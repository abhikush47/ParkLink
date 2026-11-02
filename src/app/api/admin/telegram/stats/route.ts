import { NextRequest, NextResponse } from "next/server";
import { createClientServer, createAdminClient } from "@/lib/supabase/server";
import { getTelegramConfig } from "@/lib/telegram";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClientServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Super Administrator access required" }, { status: 403 });
    }

    const admin = createAdminClient();
    if (!admin) {
      return NextResponse.json({ error: "Database client unavailable" }, { status: 500 });
    }

    const { username, isConfigured, appUrl } = getTelegramConfig();

    // 1. Fetch connected accounts
    const { data: connections, count: totalConnected } = await admin
      .from("telegram_connections")
      .select("*, profile:profiles(id, full_name, phone_number)", { count: "exact" })
      .order("connected_at", { ascending: false })
      .limit(50);

    // 2. Fetch delivery logs
    const { data: deliveryLogs, count: totalDeliveries } = await admin
      .from("notification_delivery_logs")
      .select("*, profile:profiles(id, full_name)", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(50);

    // 3. Aggregate delivery statistics
    let deliveredCount = 0;
    let failedCount = 0;
    let skippedCount = 0;

    if (deliveryLogs) {
      for (const log of deliveryLogs) {
        if (log.delivery_status === "delivered") deliveredCount++;
        else if (log.delivery_status === "failed") failedCount++;
        else if (log.delivery_status === "skipped") skippedCount++;
      }
    }

    const totalResolved = deliveredCount + failedCount;
    const successRate = totalResolved > 0 ? Math.round((deliveredCount / totalResolved) * 100) : 100;

    return NextResponse.json({
      success: true,
      bot: {
        username,
        isConfigured,
        webhookUrl: `${appUrl}/api/telegram/webhook`,
      },
      stats: {
        totalConnected: totalConnected || 0,
        totalDeliveries: totalDeliveries || 0,
        deliveredCount,
        failedCount,
        skippedCount,
        successRate,
      },
      connections: connections || [],
      recentLogs: deliveryLogs || [],
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to load telemetry" },
      { status: 500 }
    );
  }
}
