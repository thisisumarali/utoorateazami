import { NextResponse } from "next/server";
import { validateAdminLogin, signAdminToken, ADMIN_CREDENTIALS } from "@/lib/auth";
import { query } from "@/lib/db";

// In-memory rate limiting map for login attempts: ip -> { count, firstAttempt }
const loginAttempts = new Map();
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function getClientIp(request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return request.headers.get("x-real-ip") || "unknown";
}

function checkRateLimit(ip) {
  const now = Date.now();
  const record = loginAttempts.get(ip);
  if (!record) return { allowed: true };

  if (now - record.firstAttempt > LOCKOUT_WINDOW_MS) {
    loginAttempts.delete(ip);
    return { allowed: true };
  }

  if (record.count >= MAX_FAILED_ATTEMPTS) {
    const remainingMinutes = Math.max(1, Math.ceil((record.firstAttempt + LOCKOUT_WINDOW_MS - now) / 60000));
    return {
      allowed: false,
      message: `Too many failed login attempts. Please try again in ${remainingMinutes} minute(s).`,
    };
  }

  return { allowed: true };
}

function recordFailedAttempt(ip) {
  const now = Date.now();
  const record = loginAttempts.get(ip);
  if (!record || now - record.firstAttempt > LOCKOUT_WINDOW_MS) {
    loginAttempts.set(ip, { count: 1, firstAttempt: now });
  } else {
    record.count += 1;
  }
}

function resetAttempts(ip) {
  loginAttempts.delete(ip);
}

export async function POST(request) {
  try {
    const ip = getClientIp(request);
    const rateLimit = checkRateLimit(ip);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: rateLimit.message },
        { status: 429 }
      );
    }

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const isValid = validateAdminLogin(email, password);

    if (!isValid) {
      recordFailedAttempt(ip);

      // Log failed attempt without storing sensitive data
      try {
        await query(
          `INSERT INTO utoor_activity_logs (action, details, admin_email)
           VALUES ($1, $2, $3);`,
          ["ADMIN_LOGIN_FAILED", `Failed login attempt for ${(email || "").slice(0, 50)} from IP: ${ip}`, "system"]
        );
      } catch (logErr) {
        // Non-critical
      }

      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    // Reset rate-limit counter on success
    resetAttempts(ip);

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
