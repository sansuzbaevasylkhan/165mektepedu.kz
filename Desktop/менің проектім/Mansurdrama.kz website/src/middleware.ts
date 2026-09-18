import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "mansurdrama-super-secret-jwt-key-2026";
const secretKey = new TextEncoder().encode(JWT_SECRET);

const PROTECTED_PATHS = ["/admin/dashboard"];
const PUBLIC_ADMIN_PATHS = ["/admin/login"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip non-admin paths
  if (!pathname.startsWith("/admin")) return NextResponse.next();

  // Allow login page
  if (PUBLIC_ADMIN_PATHS.includes(pathname)) return NextResponse.next();

  // Check for protected paths
  if (PROTECTED_PATHS.some((p) => pathname.startsWith(p))) {
    const token = req.cookies.get("mansur_admin_session")?.value;
    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }
    try {
      const { payload } = await jwtVerify(token, secretKey);
      if (payload.role !== "admin") throw new Error("invalid role");
      return NextResponse.next();
    } catch {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
