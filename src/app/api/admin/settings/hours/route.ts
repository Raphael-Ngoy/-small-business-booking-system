import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

export async function GET() {
  try {
    const hours = await prisma.businessHour.findMany();
    const result: Record<string, { openTime: string | null; closeTime: string | null; closed: boolean }> = {};
    hours.forEach((h) => { result[h.day] = { openTime: h.openTime, closeTime: h.closeTime, closed: h.closed }; });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to fetch business hours:", error);
    return NextResponse.json({});
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    for (const day of DAYS) {
      const data = body[day];
      if (!data) continue;
      await prisma.businessHour.upsert({
        where: { day },
        update: { openTime: data.openTime || null, closeTime: data.closeTime || null, closed: data.closed ?? false },
        create: { day, openTime: data.openTime || null, closeTime: data.closeTime || null, closed: data.closed ?? false },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to save business hours:", error);
    return NextResponse.json({ error: "Failed to save business hours" }, { status: 500 });
  }
}