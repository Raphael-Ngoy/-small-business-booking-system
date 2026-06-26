import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { bookingSchema } from "@/lib/validation";
import { z } from "zod";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = bookingSchema.parse(body);

    const service = await prisma.service.findUnique({
      where: { id: validated.serviceId },
    });

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    const [hours, minutes] = validated.startTime.split(":").map(Number);
    const endTime = new Date();
    endTime.setHours(hours, minutes + service.duration, 0, 0);
    const endTimeStr = `${String(endTime.getHours()).padStart(2, "0")}:${String(endTime.getMinutes()).padStart(2, "0")}`;

    const dateObj = new Date(validated.date);

    const existingUser = await prisma.user.findUnique({
      where: { email: validated.customerEmail },
    });

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
    } else {
      const hashedPassword = await bcrypt.hash(
        Math.random().toString(36) + Date.now(),
        10
      );

      const newUser = await prisma.user.create({
        data: {
          email: validated.customerEmail,
          name: validated.customerName,
          role: "USER",
          password: hashedPassword,
        },
      });

      userId = newUser.id;
    }

    // Store phone in notes for now (schema doesn't have phone field on user)
    const notesWithPhone = validated.notes 
      ? `📞 ${validated.customerPhone}\n\n${validated.notes}`
      : `📞 ${validated.customerPhone}`;

    const booking = await prisma.booking.create({
      data: {
        userId,
        serviceId: validated.serviceId,
        date: dateObj,
        startTime: validated.startTime,
        endTime: endTimeStr,
        notes: notesWithPhone,
        status: "PENDING",
      },
      include: {
        service: true,
        user: true,
      },
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    console.error("Booking error:", error);
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }
}