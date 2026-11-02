import { NextRequest, NextResponse } from "next/server";
import {
  getTelegramConfig,
  consumeTelegramLinkToken,
  handleTelegramCallbackQuery,
  sendTelegramMessage,
} from "@/lib/telegram";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { webhookSecret, appUrl } = getTelegramConfig();

    // 1. Webhook authenticity verification (if secret configured)
    if (webhookSecret) {
      const secretHeader = request.headers.get("x-telegram-bot-api-secret-token");
      if (secretHeader !== webhookSecret) {
        console.warn("[Telegram Webhook] Unauthorized request rejected (secret mismatch)");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const update = await request.json();

    // 2. Handle Callback Queries (Inline button clicks)
    if (update.callback_query) {
      await handleTelegramCallbackQuery(update.callback_query);
      return NextResponse.json({ ok: true });
    }

    // 3. Handle Messages (e.g. /start <token>, /help, /status)
    if (update.message) {
      const msg = update.message;
      if (!msg.chat || !msg.chat.id) {
        return NextResponse.json({ ok: true });
      }
      const text = (msg.text || "").trim();
      const chatId = msg.chat.id;
      const tgUser = msg.from || { id: chatId, first_name: "Owner" };

      // Handle /start command
      if (text.startsWith("/start")) {
        const parts = text.split(/\s+/);
        const startPayload = parts[1]?.trim();

        if (startPayload) {
          // Attempt account linking with token
          const result = await consumeTelegramLinkToken(startPayload, tgUser, chatId);
          if (!result.success) {
            await sendTelegramMessage(
              chatId,
              `❌ <b>Linking Failed</b>\n\n${result.error || "Invalid or expired link."}\n\nPlease return to your ParkLink dashboard and generate a fresh linking request.`,
              {
                reply_markup: {
                  inline_keyboard: [
                    [
                      {
                        text: "🌐 Open ParkLink Dashboard",
                        url: `${appUrl}/dashboard/telegram`,
                      },
                    ],
                  ],
                },
              }
            );
          }
          return NextResponse.json({ ok: true });
        }

        // Plain /start without token
        await sendTelegramMessage(
          chatId,
          `👋 <b>Welcome to ParkLink Vehicle Assistant!</b>\n\n` +
            `ParkLink connects vehicle owners with people who scan their dynamic QR stickers.\n\n` +
            `<b>How to link your account:</b>\n` +
            `1. Log in to your <a href="${appUrl}/dashboard">ParkLink Dashboard</a>\n` +
            `2. Go to <b>Telegram Bot</b> settings\n` +
            `3. Click <b>Connect Telegram</b>\n\n` +
            `Once linked, you will receive urgent parking alerts (blocking vehicle, lights on) directly in this chat with 1-tap responses!`,
          {
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "🌐 Open ParkLink",
                    url: `${appUrl}/dashboard`,
                  },
                ],
              ],
            },
          }
        );
        return NextResponse.json({ ok: true });
      }

      // Handle /status command
      if (text === "/status") {
        const admin = createAdminClient();
        let isLinked = false;
        let ownerName = "";

        if (admin) {
          const { data } = await admin
            .from("telegram_connections")
            .select("*, profile:profiles(*)")
            .eq("telegram_chat_id", String(chatId))
            .single();

          if (data) {
            isLinked = true;
            ownerName = data.profile?.full_name || "Owner";
          }
        }

        if (isLinked) {
          await sendTelegramMessage(
            chatId,
            `🟢 <b>ParkLink Status: Connected</b>\n\n` +
              `Linked account: <b>${ownerName}</b>\n` +
              `Chat ID: <code>${chatId}</code>\n` +
              `Alerts: Active & Listening\n\n` +
              `You are ready to receive real-time parking alerts.`
          );
        } else {
          await sendTelegramMessage(
            chatId,
            `⚪ <b>ParkLink Status: Not Connected</b>\n\n` +
              `This chat is not currently connected to any ParkLink account. Visit your dashboard to link it.`
          );
        }
        return NextResponse.json({ ok: true });
      }

      // Handle /help command
      if (text === "/help") {
        await sendTelegramMessage(
          chatId,
          `📖 <b>ParkLink Bot Commands:</b>\n\n` +
            `• <code>/status</code> — Check if this chat is linked\n` +
            `• <code>/help</code> — Show this guidance message\n\n` +
            `Whenever an alert arrives, you can respond directly using the buttons below the message.`
        );
        return NextResponse.json({ ok: true });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[Telegram Webhook Exception]", err);
    // Return 200 to Telegram to prevent retry hammering on application errors
    return NextResponse.json({ ok: false, error: err.message }, { status: 200 });
  }
}

