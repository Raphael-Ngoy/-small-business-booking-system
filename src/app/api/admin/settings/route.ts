import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const settings = await prisma.businessSetting.findMany();
    const result: Record<string, string> = {};
    settings.forEach((s) => { result[s.key] = s.value; });

    return NextResponse.json(result);
  } catch (error) {
    // Table may not exist yet
    console.error("Failed to fetch settings:", error);
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

    // Upsert each setting
    for (const [key, value] of Object.entries(body)) {
      if (typeof value === "string") {
        await prisma.businessSetting.upsert({
          where: { key },
          update: { value },
          create: { key, value },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to save settings:", error);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}