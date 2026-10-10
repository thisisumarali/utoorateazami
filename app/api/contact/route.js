import { NextResponse } from "next/server";
import { query, testDbConnection } from "@/lib/db";

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, phone, email, topic, message } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!phone || !phone.trim()) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }
    if (!message || !message.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const cleanName = name.trim();
    const cleanPhone = phone.trim();
    const cleanEmail = email ? email.trim() : "";
    const cleanTopic = topic ? topic.trim() : "General Question";
    const cleanMessage = message.trim();

    const dbStatus = await testDbConnection();

    if (dbStatus.connected) {
      const res = await query(
        `INSERT INTO utoor_contact_messages (
          name, phone, email, topic, message, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, 'Unread', NOW(), NOW())
        RETURNING *;`,
        [cleanName, cleanPhone, cleanEmail, cleanTopic, cleanMessage]
      );

      // Log activity in admin logs
      await query(
        `INSERT INTO utoor_activity_logs (action, details, admin_email)
         VALUES ($1, $2, $3);`,
        [
          "CONTACT_MESSAGE_RECEIVED",
          `Inquiry from ${cleanName} (${cleanPhone}) regarding ${cleanTopic}`,
          "system",
        ]
      ).catch(() => {});

      return NextResponse.json({
        success: true,
        savedToDb: true,
        message: "Thank you for reaching out! We will contact you shortly.",
        contact: res.rows[0],
      });
    }

    // Graceful offline fallback
    return NextResponse.json({
      success: true,
      savedToDb: false,
      message: "Thank you for reaching out! We will contact you shortly.",
      contact: {
        name: cleanName,
        phone: cleanPhone,
        email: cleanEmail,
        topic: cleanTopic,
        message: cleanMessage,
      },
    });
  } catch (err) {
    console.error("Contact message error:", err);
    return NextResponse.json(
      { error: "Failed to submit message", details: err.message },
      { status: 500 }
    );
  }
}
