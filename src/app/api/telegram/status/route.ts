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

    const { username, isConfigured } = getTelegramConfig();
    const admin = createAdminClient();

    let connection = null;
    let preferences = null;

    if (admin) {
      const { data: conn } = await admin
        .from("telegram_connections")
        .select("*")
        .eq("user_id", user.id)
        .single();

      connection = conn;

      const { data: prefs } = await admin
        .from("user_notification_preferences")
        .select("*")
        .eq("user_id", user.id)
        .single();

      preferences = prefs;
    }

    return NextResponse.json({
      success: true,
      botUsername: username,
      isBotConfigured: isConfigured,
      isConnected: Boolean(connection && connection.status === "connected"),
      connection: connection
        ? {
            id: connection.id,
            telegram_username: connection.telegram_username,
            telegram_chat_id: connection.telegram_chat_id
              ? `${connection.telegram_chat_id.slice(0, 3)}••••${connection.telegram_chat_id.slice(-2)}`
              : null,
            first_name: connection.first_name,
            connected_at: connection.connected_at,
            status: connection.status,
          }
        : null,
      preferences: preferences || {
        telegram_enabled: true,
        parking_alerts_enabled: true,
        anonymous_messages_enabled: true,
        qr_scans_enabled: false,
        security_alerts_enabled: true,
        email_alerts: true,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch status" },
      { status: 500 }
    );
  }
}

