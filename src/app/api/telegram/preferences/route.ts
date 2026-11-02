import { NextRequest, NextResponse } from "next/server";
import { createClientServer, createAdminClient } from "@/lib/supabase/server";
import { telegramPreferencesSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClientServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await request.json();
    const parsed = telegramPreferencesSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    if (!admin) {
      return NextResponse.json({ success: false, error: "Database unavailable" }, { status: 500 });
    }

    const { error } = await admin
      .from("user_notification_preferences")
      .upsert(
        {
          user_id: user.id,
          telegram_enabled: parsed.data.telegram_enabled,
          parking_alerts_enabled: parsed.data.parking_alerts_enabled,
          anonymous_messages_enabled: parsed.data.anonymous_messages_enabled,
          qr_scans_enabled: parsed.data.qr_scans_enabled,
          security_alerts_enabled: parsed.data.security_alerts_enabled,
          ...(parsed.data.email_alerts !== undefined
            ? { email_alerts: parsed.data.email_alerts }
            : {}),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Notification preferences updated." });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update preferences" },
      { status: 500 }
    );
  }
}
