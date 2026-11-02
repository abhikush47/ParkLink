import { NextRequest, NextResponse } from "next/server";
import { createClientServer, createAdminClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { parkingAlertSubmissionSchema } from "@/lib/validations";
import { dispatchTelegramParkingAlert } from "@/lib/telegram";

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const parsed = parkingAlertSubmissionSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "VALIDATION_FAILED", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { token, category, custom_message, requester_phone } = parsed.data;

    if (isSupabaseConfigured) {
      const ip = request.headers.get("x-forwarded-for") || "unknown";
      const userAgent = request.headers.get("user-agent") || "unknown";
      const salt = new Date().toISOString().slice(0, 10);
      const senderHash = Buffer.from(`${ip}-${userAgent}-${salt}`).toString("base64").slice(0, 24);

      const supabase = await createClientServer();
      const { data, error } = await supabase.rpc("submit_parking_alert", {
        p_token: token,
        p_category: category,
        p_custom_message: custom_message || null,
        p_sender_hash: senderHash,
      });

      if (error) {
        return NextResponse.json(
          { success: false, error: "DB_ERROR", message: error.message },
          { status: 500 }
        );
      }

      if (!data.success) {
        const statusCode = data.error === "RATE_LIMITED" ? 429 : 400;
        return NextResponse.json(data, { status: statusCode });
      }

      // Update requester phone if provided and trigger Telegram alert non-blockingly
      const alertId = data.alert_id;
      if (alertId) {
        try {
          const admin = createAdminClient();
          if (admin && requester_phone) {
            await admin
              .from("parking_alerts")
              .update({ requester_phone: requester_phone.trim() })
              .eq("id", alertId);
          }

          // Dispatch Telegram notification instantly
          await dispatchTelegramParkingAlert(alertId, {
            requesterPhone: requester_phone?.trim(),
          });
        } catch (dispatchErr) {
          console.warn("[Telegram Dispatch Warning]", dispatchErr);
        }
      }

      return NextResponse.json(data, { status: 200 });
    }

    // Local / demo fallback
    return NextResponse.json({
      success: true,
      alert_id: "demo-alert-" + Date.now(),
      message: "Alert delivered to owner successfully.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "SERVER_ERROR", message: err.message },
      { status: 500 }
    );
  }
}
