import { NextRequest, NextResponse } from "next/server";
import { createClientServer } from "@/lib/supabase/server";
import { createTelegramLinkToken } from "@/lib/telegram";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClientServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const linkData = await createTelegramLinkToken(user.id);

    return NextResponse.json({
      success: true,
      token: linkData.token,
      botUsername: linkData.botUsername,
      deepLink: linkData.deepLink,
      expiresAt: linkData.expiresAt,
      isBotConfigured: linkData.isBotConfigured,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to generate link token" },
      { status: 500 }
    );
  }
}
