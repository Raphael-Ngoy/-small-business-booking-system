import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { status } = body;

    if (!status || !["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const { id } = await params;

    const previous = await prisma.booking.findUnique({ where: { id }, select: { status: true } });

    const booking = await prisma.booking.update({
      where: { id },
      data: { status },
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
    });

    // Record history when status changes
    if (previous?.status !== status) {
      await prisma.activityLog.create({
        data: {
          action: "Booking Status Changed",
          description: `booking:${id}|${previous?.status || ""}→${status}`,
          performedBy: (session.user as { email?: string })?.email || "system",
        },
      });
    }

    // Extract phone from notes if present
    const phone = booking.notes?.startsWith("📞 ")
      ? booking.notes.split("\n")[0].replace("📞 ", "").trim()
      : "";

    const notes = booking.notes?.startsWith("📞 ")
      ? booking.notes.split("\n").slice(2).join("\n").trim()
      : booking.notes;

    const formatted = {
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
    };

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Failed to update booking:", error);
    return NextResponse.json(
      { error: "Failed to update booking" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await prisma.booking.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete booking:", error);
    return NextResponse.json(
      { error: "Failed to delete booking" },
      { status: 500 }
    );
  }
}