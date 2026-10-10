import { NextResponse } from "next/server";
import { initDatabase, query } from "@/lib/db";

export async function POST() {
  try {
    const result = await initDatabase();

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          code: result.code,
          hint: result.hint,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "PostgreSQL tables initialized and seeded successfully!",
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
