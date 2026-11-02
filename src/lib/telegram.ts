import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/server";
import type {
  TelegramConnection,
  NotificationDeliveryLog,
  UserNotificationPreferences,
  AlertCategory,
} from "@/types/database";

export interface TelegramUser {
  id: number;
  is_bot?: boolean;
  first_name?: string;
  last_name?: string;
  username?: string;
}

export interface TelegramCallbackQuery {
  id: string;
  from: TelegramUser;
  message?: {
    message_id: number;
    chat: {
      id: number;
      type: string;
    };
    text?: string;
  };
  data?: string;
}

const CATEGORY_TITLES: Record<AlertCategory, string> = {
  blocking: "🚗 Vehicle is blocking another vehicle",
  please_move: "⚠️ Please move your vehicle immediately",
  lights_on: "💡 Vehicle lights are switched on",
  window_open: "🪟 Vehicle window appears open",
  parked_incorrectly: "📐 Vehicle parked incorrectly or over line",
  other: "ℹ️ Parking assistance notice",
};

export function getTelegramConfig() {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim() || "";
  const username = process.env.TELEGRAM_BOT_USERNAME?.trim() || "MyParkLinkAlertbot";
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim() || "";

  let appUrl = "https://parklink-dusky.vercel.app";
  if (process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes("localhost")) {
    appUrl = process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  } else if (process.env.VERCEL_URL) {
    appUrl = `https://${process.env.VERCEL_URL}`;
  }

  return {
    token,
    username,
    webhookSecret,
    appUrl,
    isConfigured: Boolean(token && token !== "your_telegram_bot_token_here"),
  };
}

/**
 * Low-level Telegram Bot API caller.
 * Gracefully simulates success in dev/demo when token is not configured.
 */
export async function callTelegramApi(
  method: string,
  payload: Record<string, unknown>
): Promise<{ ok: boolean; result?: any; description?: string }> {
  const { token, isConfigured } = getTelegramConfig();

  if (!isConfigured) {
    console.warn(`[Telegram API] Simulated call to ${method} (bot token not configured):`, payload);
    return {
      ok: true,
      result: {
        message_id: Math.floor(Math.random() * 100000) + 1,
        chat: { id: (payload as any).chat_id || 123456 },
        text: (payload as any).text || "",
        simulated: true,
      },
    };
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok || !data.ok) {
      console.error(`[Telegram API Error] ${method}:`, data);
    }
    return data;
  } catch (err: any) {
    console.error(`[Telegram API Network Error] ${method}:`, err);
    return { ok: false, description: err.message };
  }
}

/**
 * Answer Telegram callback query (shows a toast alert to the user in Telegram).
 */
export async function answerTelegramCallback(
  callbackQueryId: string,
  text?: string,
  showAlert = false
) {
  return callTelegramApi("answerCallbackQuery", {
    callback_query_id: callbackQueryId,
    text: text || "",
    show_alert: showAlert,
  });
}

/**
 * Send a message to a Telegram chat.
 */
export async function sendTelegramMessage(
  chatId: string | number,
  text: string,
  options?: {
    parse_mode?: "HTML" | "MarkdownV2" | "Markdown";
    reply_markup?: any;
    disable_web_page_preview?: boolean;
  }
) {
  return callTelegramApi("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: options?.parse_mode || "HTML",
    disable_web_page_preview: options?.disable_web_page_preview ?? true,
    ...(options?.reply_markup ? { reply_markup: options.reply_markup } : {}),
  });
}

/**
 * Edit an existing message in a Telegram chat.
 */
export async function editTelegramMessage(
  chatId: string | number,
  messageId: number,
  text: string,
  replyMarkup?: any
) {
  return callTelegramApi("editMessageText", {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
  });
}

/**
 * Log notification delivery to notification_delivery_logs table for audit & analytics.
 */
export async function logDelivery(params: {
  userId: string;
  notificationId?: string | null;
  channel: "telegram" | "email" | "in_app" | "sms" | "whatsapp";
  eventType: "parking_alert" | "anonymous_message" | "qr_scanned" | "security" | "test_notification";
  status: "delivered" | "failed" | "skipped" | "pending";
  errorMessage?: string | null;
  metadata?: Record<string, unknown>;
}) {
  try {
    const admin = createAdminClient();
    if (!admin) return;

    await admin.from("notification_delivery_logs").insert({
      user_id: params.userId,
      notification_id: params.notificationId || null,
      channel: params.channel,
      event_type: params.eventType,
      delivery_status: params.status,
      error_message: params.errorMessage || null,
      metadata: params.metadata || {},
    });
  } catch (err) {
    console.warn("[logDelivery] Error recording notification delivery:", err);
  }
}

/**
 * Generate a cryptographically secure, single-use, 15-minute token for Telegram deep linking.
 */
export async function createTelegramLinkToken(userId: string) {
  const { username, isConfigured } = getTelegramConfig();
  const token = crypto.randomBytes(24).toString("base64url");
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  const admin = createAdminClient();
  if (admin) {
    try {
      // Clean up expired tokens for this user first
      await admin
        .from("telegram_link_tokens")
        .delete()
        .eq("user_id", userId)
        .lt("expires_at", new Date().toISOString());

      await admin.from("telegram_link_tokens").insert({
        user_id: userId,
        token,
        expires_at: expiresAt,
      });
    } catch (err) {
      console.error("[createTelegramLinkToken] Database error:", err);
    }
  }

  const deepLink = `https://t.me/${username}?start=${token}`;
  return {
    token,
    botUsername: username,
    deepLink,
    expiresAt,
    isBotConfigured: isConfigured,
  };
}

/**
 * Validate and consume a Telegram deep-link token from /start <token>.
 * Associates the Telegram chat/user with the ParkLink user.
 */
export async function consumeTelegramLinkToken(
  token: string,
  tgUser: TelegramUser,
  chatId: number | string
): Promise<{ success: boolean; error?: string; userId?: string }> {
  const admin = createAdminClient();
  if (!admin) {
    return { success: false, error: "Database service unavailable" };
  }

  // Look up token
  const { data: linkRecord, error: lookupErr } = await admin
    .from("telegram_link_tokens")
    .select("*")
    .eq("token", token)
    .single();

  if (lookupErr || !linkRecord) {
    return { success: false, error: "Invalid or expired linking token." };
  }

  if (linkRecord.used_at) {
    return { success: false, error: "This linking token has already been used." };
  }

  if (new Date(linkRecord.expires_at) < new Date()) {
    return { success: false, error: "This linking link has expired. Please generate a new one." };
  }

  const userId = linkRecord.user_id;

  // Mark token used
  await admin
    .from("telegram_link_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("id", linkRecord.id);

  // Upsert telegram_connections
  const { error: upsertErr } = await admin
    .from("telegram_connections")
    .upsert(
      {
        user_id: userId,
        telegram_chat_id: String(chatId),
        telegram_user_id: String(tgUser.id),
        telegram_username: tgUser.username || null,
        first_name: tgUser.first_name || null,
        last_name: tgUser.last_name || null,
        status: "connected",
        connected_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  if (upsertErr) {
    console.error("[consumeTelegramLinkToken] Failed to save connection:", upsertErr);
    return { success: false, error: "Failed to save Telegram connection." };
  }

  // Ensure user notification preferences has telegram_enabled = true
  await admin
    .from("user_notification_preferences")
    .update({ telegram_enabled: true, updated_at: new Date().toISOString() })
    .eq("user_id", userId);

  // Send welcome confirmation message
  const { appUrl } = getTelegramConfig();
  await sendTelegramMessage(
    chatId,
    `🎉 <b>ParkLink Connected Successfully!</b>\n\n` +
      `Your Telegram account is now securely linked to your ParkLink vehicle profile.\n\n` +
      `<b>Active Features:</b>\n` +
      `• 🚨 Instant 1-tap parking alert notifications\n` +
      `• 🚗 Interactive quick responses (<i>I'm coming</i>, <i>Vehicle moved</i>, <i>Need 5 min</i>)\n` +
      `• 💬 Anonymous contact relay messages\n` +
      `• 🔒 Zero personal phone number exposure\n\n` +
      `Manage your settings anytime in your dashboard.`,
    {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "🌐 Open ParkLink Dashboard",
              url: `${appUrl}/dashboard`,
            },
          ],
          [
            {
              text: "⚙️ Notification Settings",
              url: `${appUrl}/dashboard/telegram`,
            },
          ],
        ],
      },
    }
  );

  // Log successful delivery
  await logDelivery({
    userId,
    channel: "telegram",
    eventType: "test_notification",
    status: "delivered",
    metadata: {
      action: "account_linked",
      telegram_username: tgUser.username,
      chat_id: String(chatId),
    },
  });

  return { success: true, userId };
}

/**
 * Disconnect a user's Telegram connection.
 */
export async function disconnectTelegram(userId: string) {
  const admin = createAdminClient();
  if (!admin) return { success: false, error: "Database client unavailable" };

  try {
    // Check if connection exists
    const { data: conn } = await admin
      .from("telegram_connections")
      .select("telegram_chat_id")
      .eq("user_id", userId)
      .single();

    if (conn?.telegram_chat_id) {
      // Send courteous farewell message
      await sendTelegramMessage(
        conn.telegram_chat_id,
        `⚠️ <b>ParkLink Disconnected</b>\n\n` +
          `Your Telegram account has been disconnected from your ParkLink profile. You will no longer receive alerts here until re-linked in your dashboard.`
      );
    }

    await admin.from("telegram_connections").delete().eq("user_id", userId);

    await admin
      .from("user_notification_preferences")
      .update({ telegram_enabled: false, updated_at: new Date().toISOString() })
      .eq("user_id", userId);

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Dispatch an interactive Telegram Parking Alert.
 */
export async function dispatchTelegramParkingAlert(
  alertId: string,
  options?: { requesterPhone?: string }
): Promise<{ success: boolean; reason?: string }> {
  const admin = createAdminClient();
  if (!admin) return { success: false, reason: "No admin client" };

  try {
    // Fetch alert with vehicle and owner
    const { data: alert, error: aErr } = await admin
      .from("parking_alerts")
      .select("*, vehicle:vehicles(*, owner:profiles(*))")
      .eq("id", alertId)
      .single();

    if (aErr || !alert || !alert.vehicle) {
      console.warn("[dispatchTelegramParkingAlert] Alert or vehicle not found:", alertId);
      return { success: false, reason: "Alert not found" };
    }

    const vehicle = alert.vehicle;
    const ownerId = vehicle.owner_id;

    // Check owner notification preferences
    const { data: prefs } = await admin
      .from("user_notification_preferences")
      .select("*")
      .eq("user_id", ownerId)
      .single();

    if (prefs) {
      if (prefs.telegram_enabled === false) {
        await logDelivery({
          userId: ownerId,
          channel: "telegram",
          eventType: "parking_alert",
          status: "skipped",
          errorMessage: "Telegram disabled in owner preferences",
          metadata: { alert_id: alertId },
        });
        return { success: false, reason: "Telegram disabled in user preferences" };
      }
      if (prefs.parking_alerts_enabled === false) {
        await logDelivery({
          userId: ownerId,
          channel: "telegram",
          eventType: "parking_alert",
          status: "skipped",
          errorMessage: "Parking alerts disabled in owner preferences",
          metadata: { alert_id: alertId },
        });
        return { success: false, reason: "Parking alerts disabled in preferences" };
      }
    }

    // Check Telegram connection
    const { data: connection } = await admin
      .from("telegram_connections")
      .select("*")
      .eq("user_id", ownerId)
      .eq("status", "connected")
      .single();

    if (!connection) {
      await logDelivery({
        userId: ownerId,
        channel: "telegram",
        eventType: "parking_alert",
        status: "skipped",
        errorMessage: "No connected Telegram account",
        metadata: { alert_id: alertId },
      });
      return { success: false, reason: "User does not have Telegram connected" };
    }

    const categoryTitle = CATEGORY_TITLES[alert.category as AlertCategory] || alert.category;
    const { appUrl } = getTelegramConfig();
    const formattedDate = new Date(alert.created_at).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });

    const requesterPhone = options?.requesterPhone || alert.requester_phone;

    // Format message
    const messageText =
      `🚨 <b>PARKING ALERT — Immediate Attention</b>\n\n` +
      `<b>Vehicle:</b> <code>${vehicle.registration_number}</code>\n` +
      `<b>Model:</b> ${vehicle.brand} ${vehicle.model} (${vehicle.color})\n` +
      `<b>Issue:</b> ${categoryTitle}\n` +
      (alert.custom_message
        ? `<b>Note:</b> <i>"${escapeHtml(alert.custom_message)}"</i>\n`
        : "") +
      (requesterPhone ? `<b>Requester Phone:</b> <code>${requesterPhone}</code>\n` : "") +
      `<b>Time:</b> ${formattedDate}\n` +
      `<b>Status:</b> 🟡 <b>Action Required (Pending)</b>\n\n` +
      `<i>Tap an action below to update your status instantly.</i>`;

    // Interactive buttons
    const inlineKeyboard: any[][] = [
      [
        { text: "🚗 I'm coming", callback_data: `pa:coming:${alert.id}` },
        { text: "⏳ Need 5 min", callback_data: `pa:delay:${alert.id}` },
      ],
      [{ text: "✅ Vehicle moved", callback_data: `pa:moved:${alert.id}` }],
    ];

    if (requesterPhone) {
      const cleanPhone = requesterPhone.replace(/[^0-9+]/g, "");
      inlineKeyboard.push([
        { text: "📞 Call Requester", url: `tel:${cleanPhone}` },
        { text: "💬 WhatsApp Requester", url: `https://wa.me/${cleanPhone.replace("+", "")}` },
      ]);
    }

    inlineKeyboard.push([
      {
        text: "🌐 View in ParkLink Dashboard",
        url: `${appUrl}/dashboard/alerts`,
      },
    ]);

    const res = await sendTelegramMessage(connection.telegram_chat_id, messageText, {
      reply_markup: { inline_keyboard: inlineKeyboard },
    });

    const isDelivered = Boolean(res.ok);

    await logDelivery({
      userId: ownerId,
      notificationId: alert.id,
      channel: "telegram",
      eventType: "parking_alert",
      status: isDelivered ? "delivered" : "failed",
      errorMessage: res.description,
      metadata: {
        alert_id: alert.id,
        vehicle_reg: vehicle.registration_number,
        category: alert.category,
        chat_id: connection.telegram_chat_id,
      },
    });

    return { success: isDelivered };
  } catch (err: any) {
    console.error("[dispatchTelegramParkingAlert] Exception:", err);
    return { success: false, reason: err.message };
  }
}

/**
 * Dispatch an Anonymous Message Notification to Telegram.
 */
export async function dispatchTelegramAnonymousMessage(
  messageId: string
): Promise<{ success: boolean; reason?: string }> {
  const admin = createAdminClient();
  if (!admin) return { success: false, reason: "No admin client" };

  try {
    const { data: msg, error: mErr } = await admin
      .from("anonymous_messages")
      .select("*, vehicle:vehicles(*)")
      .eq("id", messageId)
      .single();

    if (mErr || !msg || !msg.vehicle) {
      return { success: false, reason: "Message or vehicle not found" };
    }

    const vehicle = msg.vehicle;
    const ownerId = vehicle.owner_id;

    // Preferences check
    const { data: prefs } = await admin
      .from("user_notification_preferences")
      .select("*")
      .eq("user_id", ownerId)
      .single();

    if (prefs) {
      if (prefs.telegram_enabled === false) return { success: false, reason: "Telegram disabled" };
      if (prefs.anonymous_messages_enabled === false)
        return { success: false, reason: "Messages disabled" };
    }

    // Connection check
    const { data: connection } = await admin
      .from("telegram_connections")
      .select("*")
      .eq("user_id", ownerId)
      .eq("status", "connected")
      .single();

    if (!connection) {
      return { success: false, reason: "Telegram not connected" };
    }

    const { appUrl } = getTelegramConfig();
    const formattedDate = new Date(msg.created_at).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });

    const messageText =
      `💬 <b>NEW ANONYMOUS MESSAGE — ParkLink</b>\n\n` +
      `<b>Vehicle:</b> <code>${vehicle.registration_number}</code> (${vehicle.brand} ${vehicle.model})\n` +
      `<b>Message:</b>\n<i>"${escapeHtml(msg.message)}"</i>\n\n` +
      `<b>Received:</b> ${formattedDate}\n` +
      `<b>Status:</b> 🔵 Unread\n\n` +
      `<i>The sender cannot see your number. You can reply through ParkLink or manage this message below.</i>`;

    const inlineKeyboard = [
      [
        { text: "👁️ Mark as Read", callback_data: `msg:read:${msg.id}` },
        { text: "🚩 Report Message", callback_data: `msg:rep:${msg.id}` },
      ],
      [
        {
          text: "💬 Reply Through ParkLink",
          url: `${appUrl}/dashboard/messages?id=${msg.id}`,
        },
      ],
      [
        {
          text: "🌐 View Messages Relay",
          url: `${appUrl}/dashboard/messages`,
        },
      ],
    ];

    const res = await sendTelegramMessage(connection.telegram_chat_id, messageText, {
      reply_markup: { inline_keyboard: inlineKeyboard },
    });

    await logDelivery({
      userId: ownerId,
      notificationId: msg.id,
      channel: "telegram",
      eventType: "anonymous_message",
      status: res.ok ? "delivered" : "failed",
      errorMessage: res.description,
      metadata: {
        message_id: msg.id,
        vehicle_reg: vehicle.registration_number,
        chat_id: connection.telegram_chat_id,
      },
    });

    return { success: Boolean(res.ok) };
  } catch (err: any) {
    console.error("[dispatchTelegramAnonymousMessage] Exception:", err);
    return { success: false, reason: err.message };
  }
}

/**
 * Handle Telegram Callback Queries triggered by inline keyboard buttons.
 */
export async function handleTelegramCallbackQuery(query: TelegramCallbackQuery) {
  const admin = createAdminClient();
  const { appUrl } = getTelegramConfig();
  const callbackQueryId = query.id;
  const data = query.data || "";
  const chatId = query.message?.chat.id;
  const messageId = query.message?.message_id;
  const originalText = query.message?.text || "";

  if (!data || !chatId || !messageId || !admin) {
    return answerTelegramCallback(callbackQueryId, "Action could not be processed.");
  }

  // 1. Authenticate user from telegram_connections
  const { data: connection } = await admin
    .from("telegram_connections")
    .select("*, profile:profiles(*)")
    .eq("telegram_chat_id", String(chatId))
    .single();

  if (!connection) {
    return answerTelegramCallback(
      callbackQueryId,
      "⚠️ Telegram account not linked to ParkLink. Please link in your dashboard.",
      true
    );
  }

  const userId = connection.user_id;

  // 2. PARKING ALERT CALLBACKS: pa:action:alertId
  if (data.startsWith("pa:")) {
    const parts = data.split(":");
    const action = parts[1]; // 'coming' | 'delay' | 'moved'
    const alertId = parts[2];

    if (!alertId) {
      return answerTelegramCallback(callbackQueryId, "Invalid alert reference.");
    }

    // Fetch alert and verify ownership
    const { data: alert, error: alertErr } = await admin
      .from("parking_alerts")
      .select("*, vehicle:vehicles(*)")
      .eq("id", alertId)
      .single();

    if (alertErr || !alert || !alert.vehicle) {
      return answerTelegramCallback(callbackQueryId, "Alert not found.", true);
    }

    if (alert.vehicle.owner_id !== userId) {
      return answerTelegramCallback(
        callbackQueryId,
        "⚠️ Unauthorized: You are not the owner of this vehicle.",
        true
      );
    }

    // Check if alert is already resolved
    if (alert.status === "resolved" || alert.status === "cancelled") {
      return answerTelegramCallback(
        callbackQueryId,
        "ℹ️ This alert has already been resolved.",
        true
      );
    }

    let newStatus: string = alert.status;
    let statusNote = "";
    let toastMessage = "";
    let statusBadgeText = "";
    let updatedKeyboard: any[][] = [];

    if (action === "coming") {
      newStatus = "owner_responding";
      statusNote = "Owner responded: On the way!";
      toastMessage = "🚗 Acknowledged! On your way.";
      statusBadgeText = "🚗 <b>Status: Owner is on the way (Responding)</b>";

      updatedKeyboard = [
        [{ text: "✅ Vehicle moved", callback_data: `pa:moved:${alert.id}` }],
        [{ text: "⏳ Need 5 min", callback_data: `pa:delay:${alert.id}` }],
        [{ text: "🌐 Open ParkLink Dashboard", url: `${appUrl}/dashboard/alerts` }],
      ];
    } else if (action === "delay") {
      newStatus = "delayed";
      statusNote = "Owner responded: Needs 5 minutes";
      toastMessage = "⏳ Status updated: Need 5 minutes.";
      statusBadgeText = "⏳ <b>Status: Owner requested 5 minutes</b>";

      updatedKeyboard = [
        [{ text: "🚗 I'm coming", callback_data: `pa:coming:${alert.id}` }],
        [{ text: "✅ Vehicle moved", callback_data: `pa:moved:${alert.id}` }],
        [{ text: "🌐 Open ParkLink Dashboard", url: `${appUrl}/dashboard/alerts` }],
      ];
    } else if (action === "moved") {
      newStatus = "resolved";
      statusNote = "Vehicle moved and resolved";
      toastMessage = "✅ Great! Vehicle marked as moved & resolved.";
      statusBadgeText = "✅ <b>Status: Resolved (Vehicle Moved)</b>";

      updatedKeyboard = [
        [{ text: "🌐 View in ParkLink Dashboard", url: `${appUrl}/dashboard/alerts` }],
      ];
    }

    // Update in Supabase
    await admin
      .from("parking_alerts")
      .update({
        status: newStatus,
        custom_status_note: statusNote,
        owner_response_at: new Date().toISOString(),
        resolved_at: newStatus === "resolved" ? new Date().toISOString() : null,
      })
      .eq("id", alert.id);

    // Edit Telegram message to reflect new status
    let updatedText = originalText;
    // Replace status line
    if (updatedText.includes("Status:")) {
      updatedText = updatedText.replace(/Status:.*$/m, statusBadgeText);
    } else {
      updatedText += `\n\n${statusBadgeText}`;
    }

    await editTelegramMessage(chatId, messageId, updatedText, {
      inline_keyboard: updatedKeyboard,
    });

    // Answer callback
    await answerTelegramCallback(callbackQueryId, toastMessage);

    // Audit log
    await admin.from("admin_audit_logs").insert({
      admin_id: userId,
      action: `telegram_alert_${action}`,
      target_type: "parking_alert",
      target_id: alert.id,
      metadata: { channel: "telegram", status: newStatus },
    });

    return;
  }

  // 3. ANONYMOUS MESSAGE CALLBACKS: msg:action:msgId
  if (data.startsWith("msg:")) {
    const parts = data.split(":");
    const action = parts[1]; // 'read' | 'rep'
    const msgId = parts[2];

    const { data: msg } = await admin
      .from("anonymous_messages")
      .select("*, vehicle:vehicles(*)")
      .eq("id", msgId)
      .single();

    if (!msg || !msg.vehicle || msg.vehicle.owner_id !== userId) {
      return answerTelegramCallback(callbackQueryId, "Message not found or unauthorized.", true);
    }

    if (action === "read") {
      await admin.from("anonymous_messages").update({ status: "read" }).eq("id", msg.id);

      let updatedText = originalText.replace(/Status:.*$/m, "🟢 <b>Status: Read</b>");

      await editTelegramMessage(chatId, messageId, updatedText, {
        inline_keyboard: [
          [
            {
              text: "💬 Reply Through ParkLink",
              url: `${appUrl}/dashboard/messages?id=${msg.id}`,
            },
          ],
          [
            {
              text: "🌐 View Messages Relay",
              url: `${appUrl}/dashboard/messages`,
            },
          ],
        ],
      });

      return answerTelegramCallback(callbackQueryId, "Marked as read.");
    }

    if (action === "rep") {
      await admin.from("anonymous_messages").update({ status: "reported" }).eq("id", msg.id);

      let updatedText = originalText.replace(/Status:.*$/m, "🚩 <b>Status: Reported to Moderation</b>");

      await editTelegramMessage(chatId, messageId, updatedText, {
        inline_keyboard: [
          [
            {
              text: "🌐 View Messages Relay",
              url: `${appUrl}/dashboard/messages`,
            },
          ],
        ],
      });

      return answerTelegramCallback(callbackQueryId, "Message reported to ParkLink moderation.");
    }
  }

  return answerTelegramCallback(callbackQueryId, "Action recognized.");
}

/**
 * Dispatch a test notification to an owner to verify delivery.
 */
export async function sendTelegramTestNotification(userId: string) {
  const admin = createAdminClient();
  if (!admin) return { success: false, error: "Database client unavailable" };

  const { data: connection } = await admin
    .from("telegram_connections")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!connection) {
    return { success: false, error: "Telegram is not connected yet." };
  }

  const { appUrl } = getTelegramConfig();
  const timeStr = new Date().toLocaleTimeString();

  const testText =
    `🧪 <b>ParkLink Test Notification</b>\n\n` +
    `Hello! This is a test notification from ParkLink to confirm that your Telegram integration is active and operating normally.\n\n` +
    `<b>Timestamp:</b> ${timeStr}\n` +
    `<b>Delivery Channel:</b> Telegram Official Bot API\n` +
    `<b>Status:</b> 🟢 Verified Active`;

  const res = await sendTelegramMessage(connection.telegram_chat_id, testText, {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "🌐 Open ParkLink Dashboard",
            url: `${appUrl}/dashboard`,
          },
        ],
      ],
    },
  });

  await logDelivery({
    userId,
    channel: "telegram",
    eventType: "test_notification",
    status: res.ok ? "delivered" : "failed",
    errorMessage: res.description,
    metadata: { test: true },
  });

  return { success: Boolean(res.ok), error: res.description };
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

