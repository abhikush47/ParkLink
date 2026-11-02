import { NextRequest, NextResponse } from "next/server";
import { createClientServer } from "@/lib/supabase/server";
import { sendTelegramTestNotification } from "@/lib/telegram";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClientServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const res = await sendTelegramTestNotification(user.id);

    if (!res.success) {
      return NextResponse.json(
        { success: false, error: res.error || "Failed to dispatch test notification" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Test notification dispatched to your Telegram chat.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to send test" },
      { status: 500 }
    );
  }
}

