import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const activities = await prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const formatted = activities.map((activity) => ({
      id: activity.id,
      action: activity.action,
      performedBy: activity.performedBy,
      createdAt: activity.createdAt.toISOString(),
      details: activity.description || "—",
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Failed to fetch activity:", error);
    return NextResponse.json({ error: "Failed to fetch activity" }, { status: 500 });
  }
}
