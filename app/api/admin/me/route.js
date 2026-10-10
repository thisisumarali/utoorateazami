import { NextResponse } from "next/server";
import { verifyAdminToken, ADMIN_CREDENTIALS } from "@/lib/auth";

export async function GET(request) {
  const token = request.cookies.get("utoor_admin_token")?.value;
  const session = await verifyAdminToken(token);

  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      email: session.email || ADMIN_CREDENTIALS.email,
      name: session.name || ADMIN_CREDENTIALS.name,
      role: session.role || ADMIN_CREDENTIALS.role,
    },
  });
}
