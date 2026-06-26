import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }

    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) (where.date as Record<string, string>).gte = dateFrom;
      if (dateTo) (where.date as Record<string, string>).lte = dateTo;
    }

    if (search) {
      where.OR = [
        { user: { name: { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
      ];
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        service: {
          select: {
            name: true,
            duration: true,
            price: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    const formatted = bookings.map((booking) => {
      // Extract phone from notes if present
      const phone = booking.notes?.startsWith("📞 ")
        ? booking.notes.split("\n")[0].replace("📞 ", "").trim()
        : "";

      const notes = booking.notes?.startsWith("📞 ")
        ? booking.notes.split("\n").slice(2).join("\n").trim()
        : booking.notes || "";

      return {
        id: booking.id,
        date: booking.date.toISOString().split("T")[0],
        startTime: booking.startTime,
        endTime: booking.endTime,
        status: booking.status,
        notes,
        customerName: booking.user.name,
        customerEmail: booking.user.email,
        customerPhone: phone,
        serviceName: booking.service.name,
        serviceDuration: booking.service.duration,
        servicePrice: booking.service.price,
        createdAt: booking.createdAt.toISOString(),
        updatedAt: booking.updatedAt.toISOString(),
      };
    });

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Failed to fetch bookings:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}