import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { Lab, Task } from "@prisma/client";

// GET /api/history - Retrieve all labs for the current user
export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const labs = await prisma.lab.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            include: {
                tasks: {
                    orderBy: { order: "asc" }
                }
            }
        });

        // Map Prisma DB structure back to frontend expected LabHistoryItem structure
        const formattedHistory = labs.map((lab: Lab & { tasks: Task[] }) => ({
            id: lab.id,
            title: lab.labTitle,
            date: lab.createdAt.toISOString(),
            data: {
                labTitle: lab.labTitle,
                labDescription: lab.labDescription || "",
                pastedContent: lab.pastedContent,
                tasks: lab.tasks.map((task: Task) => ({
                    id: task.id,
                    title: task.title,
                    description: task.description,
                    script: task.script
                }))
            }
        }));

        return NextResponse.json(formattedHistory);
    } catch (error) {
        console.error("Error fetching history:", error);
        return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
    }
}

// POST /api/history - Save a newly generated lab
export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { labTitle, labDescription, pastedContent, tasks } = body;

        if (!labTitle || !tasks || !Array.isArray(tasks)) {
            return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
        }

        const newLab = await prisma.lab.create({
            data: {
                userId,
                labTitle,
                labDescription: labDescription || null,
                pastedContent: pastedContent || "",
                tasks: {
                    create: tasks.map((task: any, index: number) => ({
                        title: task.title || `Task ${index + 1}`,
                        description: task.description || "",
                        script: task.script || "",
                        order: index
                    }))
                }
            },
            include: { tasks: true }
        });

        // Return the formatted object so the frontend can immediately inject it into state
        const formattedLab = {
            id: newLab.id,
            title: newLab.labTitle,
            date: newLab.createdAt.toISOString(),
            data: {
                labTitle: newLab.labTitle,
                labDescription: newLab.labDescription || "",
                pastedContent: newLab.pastedContent,
                tasks: newLab.tasks.map((task: Task) => ({
                    id: task.id,
                    title: task.title,
                    description: task.description,
                    script: task.script
                }))
            }
        };

        return NextResponse.json(formattedLab);
    } catch (error) {
        console.error("Error saving history:", error);
        return NextResponse.json({ error: "Failed to save history" }, { status: 500 });
    }
}
