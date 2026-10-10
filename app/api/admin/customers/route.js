import { NextResponse } from "next/server";
import { query, testDbConnection } from "@/lib/db";

export async function GET() {
  const dbStatus = await testDbConnection();
  if (!dbStatus.connected) {
    return NextResponse.json({
      dbConnected: false,
      customers: [
        {
          customer_phone: "03001234567",
          customer_name: "Hamza Tariq",
          customer_email: "hamza.tariq@gmail.com",
          customer_city: "Lahore",
          total_orders: 1,
          total_spent: 3600,
          last_order_date: new Date().toISOString(),
        },
        {
          customer_phone: "03219876543",
          customer_name: "Dr. Bilal Farooqi",
          customer_email: "dr.bilal@shifa.org",
          customer_city: "Islamabad",
          total_orders: 1,
          total_spent: 2250,
          last_order_date: new Date(Date.now() - 3600000 * 24).toISOString(),
        },
        {
          customer_phone: "03335551212",
          customer_name: "Ayesha Malik",
          customer_email: "ayesha.malik@outlook.com",
          customer_city: "Karachi",
          total_orders: 1,
          total_spent: 3825,
          last_order_date: new Date(Date.now() - 3600000 * 48).toISOString(),
        },
      ],
    });
  }

  try {
    const res = await query(`
      SELECT 
        customer_phone,
        MAX(customer_name) as customer_name,
        MAX(customer_email) as customer_email,
        MAX(customer_city) as customer_city,
        COUNT(*) as total_orders,
        SUM(grand_total) as total_spent,
        MAX(created_at) as last_order_date
      FROM utoor_orders
      GROUP BY customer_phone
      ORDER BY last_order_date DESC;
    `);

    return NextResponse.json({
      dbConnected: true,
      customers: res.rows.map((r) => ({
        ...r,
        total_orders: parseInt(r.total_orders, 10),
        total_spent: Math.round(parseFloat(r.total_spent || 0)),
      })),
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
