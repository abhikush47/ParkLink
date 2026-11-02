-- ============================================================================
-- PARKLINK MIGRATION: TELEGRAM BOT INTEGRATION & NOTIFICATION SUBSYSTEM
-- ============================================================================

-- 1. TELEGRAM CONNECTIONS TABLE
CREATE TABLE IF NOT EXISTS public.telegram_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    telegram_chat_id TEXT NOT NULL,
    telegram_user_id TEXT,
    telegram_username TEXT,
    first_name TEXT,
    last_name TEXT,
    connected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    status TEXT NOT NULL DEFAULT 'connected' CHECK (status IN ('connected', 'disconnected', 'suspended')),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tg_conn_user_id ON public.telegram_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_tg_conn_chat_id ON public.telegram_connections(telegram_chat_id);
CREATE INDEX IF NOT EXISTS idx_tg_conn_status ON public.telegram_connections(status);

-- 2. TELEGRAM LINK TOKENS TABLE (Single-use, short-lived deep linking)
CREATE TABLE IF NOT EXISTS public.telegram_link_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    token_hash TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tg_tokens_token ON public.telegram_link_tokens(token);
CREATE INDEX IF NOT EXISTS idx_tg_tokens_user ON public.telegram_link_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_tg_tokens_expires ON public.telegram_link_tokens(expires_at);

-- 3. NOTIFICATION DELIVERY LOGS TABLE (Comprehensive audit of all outbound messages)
CREATE TABLE IF NOT EXISTS public.notification_delivery_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    channel TEXT NOT NULL CHECK (channel IN ('telegram', 'email', 'in_app', 'sms', 'whatsapp')),
    event_type TEXT NOT NULL CHECK (event_type IN ('parking_alert', 'anonymous_message', 'qr_scanned', 'security', 'test_notification')),
    delivery_status TEXT NOT NULL CHECK (delivery_status IN ('delivered', 'failed', 'skipped', 'pending')),
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notif_logs_user ON public.notification_delivery_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notif_logs_status ON public.notification_delivery_logs(delivery_status);
CREATE INDEX IF NOT EXISTS idx_notif_logs_created ON public.notification_delivery_logs(created_at DESC);

-- 4. UPDATE PARKING ALERTS TABLE STATUS CONSTRAINT & OPTIONAL FIELDS
ALTER TABLE public.parking_alerts DROP CONSTRAINT IF EXISTS parking_alerts_status_check;
ALTER TABLE public.parking_alerts ADD CONSTRAINT parking_alerts_status_check 
    CHECK (status IN ('pending', 'read', 'owner_responding', 'delayed', 'resolved', 'ignored', 'cancelled'));

ALTER TABLE public.parking_alerts ADD COLUMN IF NOT EXISTS custom_status_note TEXT;
ALTER TABLE public.parking_alerts ADD COLUMN IF NOT EXISTS owner_response_at TIMESTAMPTZ;
ALTER TABLE public.parking_alerts ADD COLUMN IF NOT EXISTS requester_phone TEXT;

-- 5. UPDATE USER NOTIFICATION PREFERENCES TABLE
ALTER TABLE public.user_notification_preferences ADD COLUMN IF NOT EXISTS telegram_enabled BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.user_notification_preferences ADD COLUMN IF NOT EXISTS parking_alerts_enabled BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.user_notification_preferences ADD COLUMN IF NOT EXISTS anonymous_messages_enabled BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.user_notification_preferences ADD COLUMN IF NOT EXISTS qr_scans_enabled BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.user_notification_preferences ADD COLUMN IF NOT EXISTS security_alerts_enabled BOOLEAN NOT NULL DEFAULT true;

-- 6. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.telegram_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_link_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_delivery_logs ENABLE ROW LEVEL SECURITY;

-- 7. RLS POLICIES FOR TELEGRAM CONNECTIONS
CREATE POLICY "Users view own telegram connection" ON public.telegram_connections
    FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users update own telegram connection" ON public.telegram_connections
    FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users delete own telegram connection" ON public.telegram_connections
    FOR DELETE USING (auth.uid() = user_id OR public.is_admin());

-- 8. RLS POLICIES FOR TELEGRAM LINK TOKENS
CREATE POLICY "Users manage own link tokens" ON public.telegram_link_tokens
    FOR ALL USING (auth.uid() = user_id);

-- 9. RLS POLICIES FOR NOTIFICATION DELIVERY LOGS
CREATE POLICY "Users view own delivery logs" ON public.notification_delivery_logs
    FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
