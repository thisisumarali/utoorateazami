import { NextResponse } from "next/server";
import { validateAdminLogin, signAdminToken, ADMIN_CREDENTIALS } from "@/lib/auth";
import { query } from "@/lib/db";

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const isValid = validateAdminLogin(email, password);

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid credentials. Use salman@utoorate.com with your authorized password." },
        { status: 401 }
      );
    }

    // Generate token valid for 7 days
    const exp = Date.now() + 7 * 24 * 60 * 60 * 1000;
    const token = await signAdminToken({
      email: ADMIN_CREDENTIALS.email,
      name: ADMIN_CREDENTIALS.name,
      role: ADMIN_CREDENTIALS.role,
      exp,
    });

    // Try logging login activity to PostgreSQL
    try {
      await query(
        `INSERT INTO utoor_activity_logs (action, details, admin_email)
         VALUES ($1, $2, $3);`,
        ["ADMIN_LOGIN", `Admin login from ${request.headers.get("user-agent")?.slice(0, 50) || "browser"}`, ADMIN_CREDENTIALS.email]
      );
    } catch (logErr) {
      // Non-critical, continue
    }

    const response = NextResponse.json({
      success: true,
      user: {
        email: ADMIN_CREDENTIALS.email,
        name: ADMIN_CREDENTIALS.name,
        role: ADMIN_CREDENTIALS.role,
      },
    });

    // Set secure HTTP-only cookie
    response.cookies.set("utoor_admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred during login." },
      { status: 500 }
    );
  }
}
