import { NextRequest, NextResponse } from "next/server";
import { createClientServer } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { anonymousMessageSubmissionSchema } from "@/lib/validations";
import { dispatchTelegramAnonymousMessage } from "@/lib/telegram";

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const parsed = anonymousMessageSubmissionSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "VALIDATION_FAILED", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { token, message } = parsed.data;

    if (isSupabaseConfigured) {
      const ip = request.headers.get("x-forwarded-for") || "unknown";
      const userAgent = request.headers.get("user-agent") || "unknown";
      const salt = new Date().toISOString().slice(0, 10);
      const sessionHash = Buffer.from(`${ip}-${userAgent}-${salt}`).toString("base64").slice(0, 24);

      const supabase = await createClientServer();
      const { data, error } = await supabase.rpc("submit_anonymous_message", {
        p_token: token,
        p_message: message,
        p_sender_session_hash: sessionHash,
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

      // Dispatch Telegram Anonymous Message notification asynchronously
      if (data.message_id) {
        dispatchTelegramAnonymousMessage(data.message_id).catch((err) => {
          console.error("[Telegram Anonymous Message Dispatch Error]", err);
        });
      }

      return NextResponse.json(data, { status: 200 });
    }

    // Local / demo fallback
    return NextResponse.json({
      success: true,
      message_id: "demo-msg-" + Date.now(),
      message: "Message relayed to owner successfully.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "SERVER_ERROR", message: err.message },
      { status: 500 }
    );
  }
}
