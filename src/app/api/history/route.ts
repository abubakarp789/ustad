import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { Lab, Task } from "@prisma/client";
import { z } from "zod";

const historySchema = z.object({
    labTitle: z.string().min(1).max(500),
    labDescription: z.string().max(5000).optional(),
    pastedContent: z.string().max(50000).optional(),
    tasks: z.array(z.object({
        title: z.string().max(500),
        description: z.string().max(5000),
        script: z.string().max(50000),
    })).max(50),
});

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
        console.error("Error fetching history:", error instanceof Error ? error.message : "Unknown error");
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

        let validated;
        try {
            validated = historySchema.parse(body);
        } catch (e) {
            return NextResponse.json({ error: "Invalid payload parameters" }, { status: 400 });
        }

        const { labTitle, labDescription, pastedContent, tasks } = validated;

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
        console.error("Error saving history:", error instanceof Error ? error.message : "Unknown error");
        return NextResponse.json({ error: "Failed to save history" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        if (!id) {
            return NextResponse.json({ error: "Missing id" }, { status: 400 });
        }

        // CRITICAL: Verify ownership before deleting
        const lab = await prisma.lab.findFirst({
            where: { id, userId },
        });

        if (!lab) {
            return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
        }

        await prisma.lab.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting history:", error instanceof Error ? error.message : "Unknown error");
        return NextResponse.json({ error: "Failed to delete history" }, { status: 500 });
    }
}
