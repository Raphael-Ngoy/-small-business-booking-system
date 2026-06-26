import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const history = await prisma.activityLog.findMany({
      where: { description: { contains: `booking:${id}` } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(history);
  } catch (error) {
    console.error("Failed to fetch booking history:", error);
    return NextResponse.json({ error: "Failed to fetch booking history" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, fromStatus, toStatus } = body;

    const history = await prisma.activityLog.create({
      data: {
        action,
        description: `booking:${id}|${fromStatus || ""}→${toStatus || ""}`,
        performedBy: (session.user as { email?: string })?.email || "system",
      },
    });

    return NextResponse.json(history, { status: 201 });
  } catch (error) {
    console.error("Failed to create booking history:", error);
    return NextResponse.json({ error: "Failed to create booking history" }, { status: 500 });
  }
}