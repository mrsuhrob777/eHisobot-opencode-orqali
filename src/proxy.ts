import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const token = request.cookies.get("session")?.value;
  const lang = request.cookies.get("lang")?.value || "uz";
  const { pathname } = request.nextUrl;

  if (pathname === "/") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (!token) {
    if (pathname.startsWith("/login")) return NextResponse.next();
    return NextResponse.redirect(new URL("/login", request.url));
  }

  let payload: any = null;
  try {
    const jwt = require("jsonwebtoken");
    payload = jwt.verify(token, process.env.JWT_SECRET || "super-secret-key-change-in-production");
  } catch {
    const res = NextResponse.redirect(new URL("/login", request.url));
    res.cookies.delete("session");
    return res;
  }

  if (pathname.startsWith("/login")) {
    if (payload.role === "super_admin") return NextResponse.redirect(new URL("/dashboard", request.url));
    if (payload.role === "teacher") return NextResponse.redirect(new URL("/teacher", request.url));
  }

  if (pathname.startsWith("/dashboard") && payload.role !== "super_admin") {
    return NextResponse.redirect(new URL("/teacher", request.url));
  }

  if (pathname.startsWith("/teacher") && payload.role !== "teacher") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.svg).*)"],
};
