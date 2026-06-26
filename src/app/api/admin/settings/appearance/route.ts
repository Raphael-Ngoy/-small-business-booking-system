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

    const appearance = await prisma.businessAppearance.findFirst();
    if (!appearance) {
      return NextResponse.json({
        primaryColor: "#06b6d4",
        accentColor: "#3b82f6",
        darkMode: true,
        logoUrl: null,
      });
    }

    return NextResponse.json(appearance);
  } catch (error) {
    console.error("Failed to fetch appearance:", error);
    return NextResponse.json({ error: "Failed to fetch appearance" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { primaryColor, accentColor, darkMode, logoUrl } = body;

    const appearance = await prisma.businessAppearance.upsert({
      where: { id: "primary" },
      update: { primaryColor, accentColor, darkMode: darkMode ?? true, logoUrl: logoUrl || null },
      create: { id: "primary", primaryColor, accentColor, darkMode: darkMode ?? true, logoUrl: logoUrl || null },
    });

    return NextResponse.json(appearance);
  } catch (error) {
    console.error("Failed to save appearance:", error);
    return NextResponse.json({ error: "Failed to save appearance" }, { status: 500 });
  }
}