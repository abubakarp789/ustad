import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import { auth } from "@clerk/nextjs/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { env } from "@/lib/env";
import { z } from "zod";

const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

const solveSchema = z.object({
    pastedContent: z.string().min(1).max(50000),
    labTitle: z.string().optional(),
    rawTasks: z.array(z.string()).optional(),
    codeSnippets: z.array(z.string()).optional(),
}).strict();

const solveResponseSchema = z.object({
    labTitle: z.string().min(1).max(300),
    tasks: z.array(
        z.object({
            id: z.string().max(100).optional(),
            title: z.string().min(1).max(500),
            description: z.string().min(1).max(5000),
            script: z.string().min(1).max(50000),
        }).strict()
    ).min(1).max(50),
}).strict();

const blockedCommandPatterns = [
    /\brm\s+-rf\s+\/(?:\s|$)/i,
    /\bmkfs(?:\.[a-z0-9]+)?\b/i,
    /\bshutdown\b/i,
    /\breboot\b/i,
    /\bpoweroff\b/i,
    /\bcurl\s+[^|\n\r]+\|\s*(?:bash|sh)\b/i,
    /\bwget\s+[^|\n\r]+\|\s*(?:bash|sh)\b/i,
    /:\s*\(\)\s*\{\s*:\|:\s*&\s*\};:/,
];

const ratelimit = new Ratelimit({
    redis: new Redis({
        url: env.UPSTASH_REDIS_REST_URL,
        token: env.UPSTASH_REDIS_REST_TOKEN,
    }),
    limiter: Ratelimit.slidingWindow(10, "60 s"),
    analytics: true,
});

const labSolutionSchema = {
    type: Type.OBJECT,
    properties: {
        labTitle: {
            type: Type.STRING,
            description: "The title of the lab",
        },
        tasks: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    id: {
                        type: Type.STRING,
                        description:
                            "Unique identifier for the task, e.g. task-1, task-2",
                    },
                    title: {
                        type: Type.STRING,
                        description: "Title of the task or section",
                    },
                    description: {
                        type: Type.STRING,
                        description: "Brief description of what this task accomplishes",
                    },
                    script: {
                        type: Type.STRING,
                        description: "A single, complete, executable bash script containing all gcloud/gsutil/bq commands needed to complete the entire task without any manual UI interaction. Include comments to explain what each section of the script does. Use placeholder variables like <PROJECT_ID> instead of hardcoded values.",
                    },
                },
                required: ["id", "title", "description", "script"],
            },
            description: "Array of lab tasks with their bash script solutions",
        },
    },
    required: ["labTitle", "tasks"],
};

function jsonNoStore(body: unknown, init: ResponseInit = {}) {
    const headers = new Headers(init.headers);
    headers.set("Cache-Control", "no-store, max-age=0");
    headers.set("Pragma", "no-cache");
    headers.set("Expires", "0");
    return NextResponse.json(body, { ...init, headers });
}

function getRequestOrigin(req: NextRequest): string | null {
    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
    if (!host) {
        return null;
    }

    const protocol = req.headers.get("x-forwarded-proto")
        ?? (process.env.NODE_ENV === "development" ? "http" : "https");

    return `${protocol}://${host}`;
}

function enforceSameOrigin(req: NextRequest): NextResponse | null {
    const origin = req.headers.get("origin");
    if (!origin) {
        return null;
    }

    const requestOrigin = getRequestOrigin(req);
    if (!requestOrigin || origin !== requestOrigin) {
        return jsonNoStore({ error: "Forbidden" }, { status: 403 });
    }

    return null;
}

function hasBlockedCommand(script: string): boolean {
    return blockedCommandPatterns.some((pattern) => pattern.test(script));
}

export async function POST(req: NextRequest) {
    try {
        const originError = enforceSameOrigin(req);
        if (originError) {
            return originError;
        }

        const { userId } = await auth();
        if (!userId) {
            return jsonNoStore({ error: "Unauthorized" }, { status: 401 });
        }

        const { success } = await ratelimit.limit(`solve:${userId}`);
        if (!success) {
            return jsonNoStore({ error: "Rate limit exceeded" }, { status: 429 });
        }

        let body;
        try {
            body = await req.json();
        } catch {
            return jsonNoStore(
                { error: "Invalid or empty request body. Please provide valid JSON." },
                { status: 400 }
            );
        }

        const validatedBody = solveSchema.safeParse(body);
        if (!validatedBody.success) {
            return jsonNoStore(
                { error: "Invalid payload structure or size limit exceeded." },
                { status: 400 }
            );
        }

        const { pastedContent } = validatedBody.data;

        const prompt = `You are an expert Google Cloud engineer and automation specialist. Analyze the following Google Cloud Skills Boost lab instructions and convert every manual UI step into its equivalent gcloud, bq, or gsutil command.

Lab Scripting Rules:

1. One Script Per Task
   - Completely ignore the manual UI instructions (e.g., "Click Navigation menu", "Go to IAM & Admin").
   - Instead, translate those exact goals into the equivalent CLI commands.
   - Combine all the CLI commands needed to pass a specific "Task" into a single, cohesive bash script block.

2. CLI Equivalents
   - If a lab asks the user to create a bucket in the UI, give the \`gsutil mb\` command.
   - If a lab asks to create a firewall rule in the UI, give the \`gcloud compute firewall-rules create\` command.
   - You MUST figure out the CLI equivalents for ALL UI interactions.

3. Script Formatting & Comments
   - Format the script as a valid, executable bash script.
   - Include helpful comments (starting with #) inside the script to explain to the user what the block of commands is doing.
   - Group related commands together logically.

4. Identifiers & Variables
   - Never hard-code real project IDs, generic emails, or specific bucket names.
   - Use standard placeholders like <PROJECT_ID>, <YOUR_BUCKET_NAME>, <REGION>, <ZONE>.
   - If the user needs to export variables before running the commands, put the \`export VAR_NAME=value\` block at the very top of the script with placeholder values.

5. Formatting
   - Generate the structured JSON response strictly following these rules.

Lab Content:
${pastedContent}`;

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseJsonSchema: labSolutionSchema,
                temperature: 0.3,
            },
        });

        let parsedResponse: unknown;
        try {
            parsedResponse = JSON.parse(response.text ?? "{}");
        } catch {
            return jsonNoStore(
                { error: "Model returned invalid JSON output. Please retry." },
                { status: 502 }
            );
        }

        const validatedResponse = solveResponseSchema.safeParse(parsedResponse);
        if (!validatedResponse.success) {
            return jsonNoStore(
                { error: "Model response failed schema validation. Please retry." },
                { status: 502 }
            );
        }

        const safeTasks = validatedResponse.data.tasks.map((task, index) => ({
            id: task.id?.trim() || `task-${index + 1}`,
            title: task.title.trim(),
            description: task.description.trim(),
            script: task.script.trim(),
        }));

        if (safeTasks.some((task) => hasBlockedCommand(task.script))) {
            return jsonNoStore(
                {
                    error: "Generated output contained unsafe command patterns. Please revise input and retry.",
                },
                { status: 422 }
            );
        }

        return jsonNoStore({
            labTitle: validatedResponse.data.labTitle.trim(),
            tasks: safeTasks,
        });
    } catch (error) {
        console.error("Solve error:", error instanceof Error ? error.message : "Unknown error");
        return jsonNoStore(
            {
                error:
                    "Failed to generate solution. Please check your Gemini API key and try again.",
            },
            { status: 500 }
        );
    }
}
