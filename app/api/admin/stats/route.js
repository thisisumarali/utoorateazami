import { NextResponse } from "next/server";
import { query, testDbConnection } from "@/lib/db";
import { PRODUCTS } from "@/data/storeData";

export async function GET() {
  const dbStatus = await testDbConnection();

  if (!dbStatus.connected) {
    // Return gracefully formatted fallback stats
    return NextResponse.json({
      dbConnected: false,
      dbError: dbStatus.error,
      dbHint: dbStatus.hint,
      stats: {
        totalRevenue: 9675,
        totalOrders: 3,
        ordersBreakdown: {
          confirmed: 1,
          shipped: 1,
          delivered: 1,
          cancelled: 0,
        },
        totalProducts: PRODUCTS.length,
        outOfStockCount: 0,
        averageOrderValue: 3225,
      },
      recentOrders: [],
      topProducts: PRODUCTS.slice(0, 4).map((p) => ({
        id: p.id,
        name: p.name,
        category: p.categoryDisplay || "Attar",
        price: p.minPrice,
        salesCount: 14,
        image: p.image,
      })),
      activityLogs: [
        {
          id: 1,
          action: "SYSTEM_ALERT",
          details: "PostgreSQL configuration required. Update .env to activate live DB sync.",
          created_at: new Date().toISOString(),
        },
      ],
    });
  }

  try {
    // 1. Revenue & Order Counts
    const ordersRes = await query(`
      SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(CASE WHEN status != 'Cancelled' THEN grand_total ELSE 0 END), 0) as total_revenue,
        COALESCE(AVG(CASE WHEN status != 'Cancelled' THEN grand_total ELSE NULL END), 0) as avg_order_value,
        COUNT(CASE WHEN status = 'Confirmed' THEN 1 END) as confirmed_count,
        COUNT(CASE WHEN status = 'Processing' THEN 1 END) as processing_count,
        COUNT(CASE WHEN status = 'Shipped' THEN 1 END) as shipped_count,
        COUNT(CASE WHEN status = 'Delivered' THEN 1 END) as delivered_count,
        COUNT(CASE WHEN status = 'Cancelled' THEN 1 END) as cancelled_count
      FROM utoor_orders;
    `);

    // 2. Products Counts
    const prodsRes = await query(`
      SELECT 
        COUNT(*) as total_products,
        COUNT(CASE WHEN in_stock = false THEN 1 END) as out_of_stock
      FROM products;
    `);

    // 3. Contact Messages Counts
    const messagesRes = await query(`
      SELECT 
        COUNT(*)::int as total_messages,
        COUNT(CASE WHEN status = 'Unread' THEN 1 END)::int as unread_messages
      FROM utoor_contact_messages;
    `).catch(() => ({ rows: [{ total_messages: 0, unread_messages: 0 }] }));

    // 4. Recent 5 Orders
    const recentOrdersRes = await query(`
      SELECT 
        id, order_number, customer_name, customer_phone, customer_city,
        grand_total, status, items, created_at
      FROM utoor_orders
      ORDER BY created_at DESC
      LIMIT 6;
    `).catch(() => ({ rows: [] }));

    // 5. Recent 4 Contact Inquiries
    const recentMessagesRes = await query(`
      SELECT id, name, phone, topic, message, status, created_at
      FROM utoor_contact_messages
      ORDER BY created_at DESC
      LIMIT 4;
    `).catch(() => ({ rows: [] }));

    // 6. Activity Logs
    const logsRes = await query(`
      SELECT id, action, details, admin_email, created_at
      FROM utoor_activity_logs
      ORDER BY created_at DESC
      LIMIT 6;
    `).catch(() => ({ rows: [] }));

    // 7. Top Products (from live products)
    const topProdsRes = await query(`
      SELECT id, name, category_display, min_price, image, in_stock
      FROM products
      ORDER BY rating DESC, reviews_count DESC
      LIMIT 5;
    `).catch(() => ({ rows: [] }));

    const ordRow = ordersRes.rows?.[0] || {};
    const prodRow = prodsRes.rows?.[0] || {};
    const msgRow = messagesRes.rows?.[0] || { total_messages: 0, unread_messages: 0 };

    return NextResponse.json({
      dbConnected: true,
      dbInfo: {
        database: dbStatus.database,
        user: dbStatus.user,
        version: dbStatus.version,
      },
      stats: {
        totalRevenue: Math.round(parseFloat(ordRow.total_revenue || 0)),
        totalOrders: parseInt(ordRow.total_orders || 0, 10),
        ordersBreakdown: {
          confirmed: parseInt(ordRow.confirmed_count || 0, 10),
          processing: parseInt(ordRow.processing_count || 0, 10),
          shipped: parseInt(ordRow.shipped_count || 0, 10),
          delivered: parseInt(ordRow.delivered_count || 0, 10),
          cancelled: parseInt(ordRow.cancelled_count || 0, 10),
        },
        totalProducts: parseInt(prodRow.total_products || 0, 10),
        outOfStockCount: parseInt(prodRow.out_of_stock || 0, 10),
        averageOrderValue: Math.round(parseFloat(ordRow.avg_order_value || 0)),
        totalMessages: parseInt(msgRow.total_messages || 0, 10),
        unreadMessages: parseInt(msgRow.unread_messages || 0, 10),
      },
      recentOrders: recentOrdersRes.rows,
      recentMessages: recentMessagesRes.rows,
      topProducts: topProdsRes.rows.map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category_display,
        price: p.min_price,
        image: p.image,
        inStock: p.in_stock,
      })),
      activityLogs: logsRes.rows,
    });
  } catch (err) {
    console.error("Stats API error:", err);
    return NextResponse.json(
      { error: "Failed to calculate stats", details: err.message },
      { status: 500 }
    );
  }
}
