import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(request: NextRequest) {
  const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
  const token = await getToken({ req: request, secret });
  const pathname = request.nextUrl.pathname;

  // Skip login page
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  // Public API routes (no auth required)
  const publicPaths = [
    "/api/admin/settings",
    "/api/admin/settings/hours",
    "/api/admin/settings/appearance",
  ];
  if (publicPaths.includes(pathname) && request.method === "GET") {
    return NextResponse.next();
  }

  // Protect all other /admin routes
  if (pathname.startsWith("/admin")) {
    if (!token) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    if ((token as { role?: string }).role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
