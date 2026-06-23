import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedRoutes: Record<string, string[]> = {
  admin: ["/dashboard"],
  teacher: ["/teacher"],
  director: ["/director"],
  deputy_director: ["/deputy-director"],
};

export function proxy(request: NextRequest) {
  const token = request.cookies.get("session")?.value;
  const { pathname } = request.nextUrl;

  if (pathname === "/" || (!token && !pathname.startsWith("/login"))) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname.startsWith("/login")) {
    if (!token) return NextResponse.next();
    try {
      const jwt = require("jsonwebtoken");
      const payload = jwt.verify(token, process.env.JWT_SECRET || "super-secret-key-change-in-production");
      const dashboards: Record<string, string> = {
        admin: "/dashboard", teacher: "/teacher", director: "/director", deputy_director: "/deputy-director",
      };
      return NextResponse.redirect(new URL(dashboards[payload.role] || "/login", request.url));
    } catch {
      return NextResponse.next();
    }
  }

  if (!token) return NextResponse.redirect(new URL("/login", request.url));

  try {
    const jwt = require("jsonwebtoken");
    const payload = jwt.verify(token, process.env.JWT_SECRET || "super-secret-key-change-in-production");
    const allowedPrefixes = protectedRoutes[payload.role] || [];
    const canAccess = allowedPrefixes.some((prefix) => pathname.startsWith(prefix));
    if (!canAccess) {
      const dashboards: Record<string, string> = {
        admin: "/dashboard", teacher: "/teacher", director: "/director", deputy_director: "/deputy-director",
      };
      return NextResponse.redirect(new URL(dashboards[payload.role] || "/login", request.url));
    }
    return NextResponse.next();
  } catch {
    const res = NextResponse.redirect(new URL("/login", request.url));
    res.cookies.delete("session");
    return res;
  }
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|ico|webp)).*)"] };
