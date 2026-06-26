import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Always return identical response to prevent email enumeration
    const genericMessage = "If an account exists for this email, a reset link has been sent.";

    if (!user) {
      return NextResponse.json({ message: genericMessage });
    }

    // Generate reset token
    const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Hash token before storing
    const hashedToken = await bcrypt.hash(resetToken, 10);

    await prisma.user.update({
      where: { email },
      data: {
        resetToken: hashedToken,
        resetTokenExpiry,
      },
    });

    // In production, send email with reset link
    // For now, return the token in development
    const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/admin/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    return NextResponse.json({
      message: genericMessage,
      // For development: provide direct reset URL (remove in production)
      ...(process.env.NODE_ENV === 'development' && { resetUrl })
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}