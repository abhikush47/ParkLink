import { NextRequest, NextResponse } from "next/server";
import { createClientServer } from "@/lib/supabase/server";
import { disconnectTelegram } from "@/lib/telegram";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClientServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await disconnectTelegram(user.id);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Telegram account disconnected." });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to disconnect" },
      { status: 500 }
    );
  }
}
