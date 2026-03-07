import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { Lab, Task } from "@prisma/client";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { env } from "@/lib/env";
import { z } from "zod";

const taskSchema = z.object({
    title: z.string().min(1).max(500),
    description: z.string().min(1).max(5000),
    script: z.string().min(1).max(50000),
}).strict();

const historySchema = z.object({
    labTitle: z.string().min(1).max(500),
    labDescription: z.string().max(5000).optional(),
    pastedContent: z.string().max(50000).optional(),
    tasks: z.array(taskSchema).min(1).max(50),
}).strict();

const idSchema = z.string().uuid();

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

// Rate limiter is optional — only active when Upstash credentials are configured
const historyWriteRateLimit =
    UPSTASH_URL && UPSTASH_TOKEN &&
        !UPSTASH_URL.includes("REPLACE_ME") &&
        !UPSTASH_TOKEN.includes("REPLACE_ME")
        ? new Ratelimit({
            redis: new Redis({ url: UPSTASH_URL, token: UPSTASH_TOKEN }),
            limiter: Ratelimit.slidingWindow(30, "60 s"),
            analytics: true,
        })
        : null;


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

async function enforceWriteRateLimit(userId: string): Promise<boolean> {
    if (!historyWriteRateLimit) return true; // Rate limiting disabled — allow all
    const { success } = await historyWriteRateLimit.limit(`history-write:${userId}`);
    return success;
}


// GET /api/history - Retrieve all labs for the current user
export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return jsonNoStore({ error: "Unauthorized" }, { status: 401 });
        }

        const labs = await prisma.lab.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            include: {
                tasks: {
                    orderBy: { order: "asc" },
                },
            },
        });

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
                    script: task.script,
                })),
            },
        }));

        return jsonNoStore(formattedHistory);
    } catch (error) {
        console.error("Error fetching history:", error instanceof Error ? error.message : "Unknown error");
        return jsonNoStore({ error: "Failed to fetch history" }, { status: 500 });
    }
}

// POST /api/history - Save a newly generated lab
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

        if (!(await enforceWriteRateLimit(userId))) {
            return jsonNoStore({ error: "Rate limit exceeded" }, { status: 429 });
        }

        let body;
        try {
            body = await req.json();
        } catch {
            return jsonNoStore({ error: "Invalid JSON body" }, { status: 400 });
        }

        const validated = historySchema.safeParse(body);
        if (!validated.success) {
            return jsonNoStore({ error: "Invalid payload parameters" }, { status: 400 });
        }

        const { labTitle, labDescription, pastedContent, tasks } = validated.data;

        const newLab = await prisma.lab.create({
            data: {
                userId,
                labTitle,
                labDescription: labDescription || null,
                pastedContent: pastedContent || "",
                tasks: {
                    create: tasks.map((task, index) => ({
                        title: task.title || `Task ${index + 1}`,
                        description: task.description || "",
                        script: task.script || "",
                        order: index,
                    })),
                },
            },
            include: { tasks: true },
        });

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
                    script: task.script,
                })),
            },
        };

        return jsonNoStore(formattedLab);
    } catch (error) {
        console.error("Error saving history:", error instanceof Error ? error.message : "Unknown error");
        return jsonNoStore({ error: "Failed to save history" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const originError = enforceSameOrigin(req);
        if (originError) {
            return originError;
        }

        const { userId } = await auth();
        if (!userId) {
            return jsonNoStore({ error: "Unauthorized" }, { status: 401 });
        }

        if (!(await enforceWriteRateLimit(userId))) {
            return jsonNoStore({ error: "Rate limit exceeded" }, { status: 429 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        if (!id || !idSchema.safeParse(id).success) {
            return jsonNoStore({ error: "Missing or invalid id" }, { status: 400 });
        }

        const lab = await prisma.lab.findFirst({
            where: { id, userId },
        });

        if (!lab) {
            return jsonNoStore({ error: "Not found or unauthorized" }, { status: 404 });
        }

        await prisma.lab.delete({ where: { id } });
        return jsonNoStore({ success: true });
    } catch (error) {
        console.error("Error deleting history:", error instanceof Error ? error.message : "Unknown error");
        return jsonNoStore({ error: "Failed to delete history" }, { status: 500 });
    }
}
