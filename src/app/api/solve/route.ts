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
                    steps: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                instruction: {
                                    type: Type.STRING,
                                    description: "Clear instruction for this step",
                                },
                                command: {
                                    type: Type.STRING,
                                    description:
                                        "Shell command to run (if applicable). Use placeholder variables like $PROJECT_ID, $REGION instead of hardcoded values",
                                },
                                note: {
                                    type: Type.STRING,
                                    description:
                                        "Additional tip, warning, or explanation for this step",
                                },
                            },
                            required: ["instruction"],
                        },
                        description: "Ordered steps to complete the task",
                    },
                },
                required: ["id", "title", "description", "steps"],
            },
            description: "Array of lab tasks with their solutions",
        },
    },
    required: ["labTitle", "tasks"],
};

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { labTitle, rawTasks, codeSnippets, pastedContent } = body;

        // Build the prompt
        let contextText = "";

        if (pastedContent) {
            contextText = pastedContent;
        } else {
            contextText = `Lab Title: ${labTitle}\n\n`;
            if (rawTasks && rawTasks.length > 0) {
                contextText += "Lab Tasks/Sections:\n";
                rawTasks.forEach(
                    (task: { title: string; content: string }, i: number) => {
                        contextText += `\n--- Task ${i + 1}: ${task.title} ---\n${task.content}\n`;
                    }
                );
            }
            if (codeSnippets && codeSnippets.length > 0) {
                contextText += "\n\nCode snippets found in the lab:\n";
                codeSnippets.forEach((code: string, i: number) => {
                    contextText += `\nSnippet ${i + 1}:\n${code}\n`;
                });
            }
        }

        const prompt = `You are an expert Google Cloud Platform instructor. Analyze the following cloud lab content and generate a complete, detailed solution guide.

For each task/section in the lab, provide:
1. A clear title and description
2. Step-by-step instructions with actual GCP commands (gcloud, gsutil, bq, kubectl, etc.)
3. Use placeholder variables like $PROJECT_ID, $REGION, $ZONE instead of hardcoded values
4. Add helpful notes/tips where relevant (common pitfalls, best practices, what to verify)

IMPORTANT RULES:
- Generate REAL, working GCP commands — not pseudocode
- Include commands to set the project: gcloud config set project $PROJECT_ID
- Include region/zone configuration where needed
- Add verification steps (e.g., "Run this command to verify the resource was created")
- If a task involves the Cloud Console UI, describe the exact navigation path
- Break complex tasks into small, clear steps

Lab Content:
${contextText}

Generate a comprehensive solution with all tasks and their detailed steps.`;

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
