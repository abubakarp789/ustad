import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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
                    }
                },
                required: ["id", "title", "description", "script"],
            },
            description: "Array of lab tasks with their bash script solutions",
        },
    },
    required: ["labTitle", "tasks"],
};

export async function POST(req: NextRequest) {
    try {
        let body;
        try {
            body = await req.json();
        } catch {
            return NextResponse.json(
                { error: "Invalid or empty request body. Please provide valid JSON." },
                { status: 400 }
            );
        }
        const { labTitle, rawTasks, codeSnippets, pastedContent } = body;

        // Build the prompt
        let contextText = "";

        if (pastedContent) {
            contextText = pastedContent;
        }

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
${contextText}`;

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseJsonSchema: labSolutionSchema,
                temperature: 0.3,
            },
        });

        const result = JSON.parse(response.text || "{}");

        return NextResponse.json(result);
    } catch (error) {
        console.error("Solve error:", error);
        return NextResponse.json(
            {
                error:
                    "Failed to generate solution. Please check your Gemini API key and try again.",
            },
            { status: 500 }
        );
    }
}
