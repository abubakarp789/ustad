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

        const prompt = `You are a strict and precise technical parser. Analyze the following cloud lab content and convert it into a faithful, step-by-step JSON checklist.

Lab Solution Formatting Rules:

1. Faithfulness & UI Details
   - Preserve the exact task order and step order as the original lab instructions.
   - Do not drop required steps or invent new mandatory ones.
   - For UI navigation steps, elaborate slightly to help beginners (e.g., instead of "Create a dataset", write "Click the three dots next to your project ID → Create dataset") to match the literal lab intent without losing clarity.

2. Step structure
   - Every actionable instruction becomes a distinct step object.
   - Keep each step atomic (one real action per step).
   - Group purely informational text (notes, descriptions) under the nearest step using the "note" field.

3. Commands and CLI (Strict Usage)
   - Only use the "command" field for ACTUAL executable shell commands (e.g., gcloud, bq, gsutil).
   - Do NOT put plain text, connection IDs (like 'my-connection'), or arbitrary values in the "command" field. Put those in the instruction or note.
   - Do NOT introduce new hidden commands that change what the lab grader expects.
   - When adding verification CLI commands that require connection IDs, maintain consistent region formatting (e.g., always use $PROJECT_ID.US.<connection_name> if it's a US multi-region lab).

4. Identifiers and safety
   - Never hard-code real project IDs, emails, or bucket names; use placeholders like <PROJECT_ID>, <BUCKET_NAME>, <REGION>.
   - If the lab text contains a specific ID you must copy (e.g., a service account ID to paste later), create a distinct step for it.

5. No grading logic
   - Do not discuss how the lab is graded or how to "hack" the score; just reflect the documented steps.

Lab Content:
${contextText}

Generate the structured JSON response strictly following these rules.`;

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
