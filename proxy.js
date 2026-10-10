import { NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib/auth";

export async function proxy(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("utoor_admin_token")?.value;

  // Protect admin API routes
  if (pathname.startsWith("/api/admin")) {
    if (pathname === "/api/admin/login") {
      return NextResponse.next();
    }
    const session = await verifyAdminToken(token);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }
    return NextResponse.next();
  }

  // Protect admin pages
  if (pathname.startsWith("/admin")) {
    const session = await verifyAdminToken(token);

    if (pathname === "/admin/login") {
      if (session) {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
      return NextResponse.next();
    }

    if (!session) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
