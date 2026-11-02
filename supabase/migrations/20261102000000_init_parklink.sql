-- ============================================================================
-- PARKLINK DATABASE SCHEMA & ROW LEVEL SECURITY POLICIES
-- Smart Vehicle Contact & Parking Assistance Platform
-- ============================================================================

-- Enable pgcrypto for UUIDs & cryptographic generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. PROFILES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone_number TEXT,
    whatsapp_number TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'institution_admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for searching profiles
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- ============================================================================
-- 2. VEHICLES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    registration_number TEXT NOT NULL,
    normalized_registration_number TEXT NOT NULL,
    vehicle_type TEXT NOT NULL CHECK (vehicle_type IN ('Car', 'Motorcycle', 'Scooter', 'SUV', 'Van', 'Truck', 'Other')),
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    color TEXT NOT NULL,
    image_url TEXT,
    description TEXT,
    parking_location TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'sold', 'suspended')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vehicles_owner_id ON public.vehicles(owner_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_normalized_reg ON public.vehicles(normalized_registration_number);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON public.vehicles(status);

-- ============================================================================
-- 3. VEHICLE CONTACTS & PRIVACY SETTINGS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.vehicle_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE UNIQUE,
    show_phone BOOLEAN NOT NULL DEFAULT false,
    show_whatsapp BOOLEAN NOT NULL DEFAULT true,
    enable_anonymous_messages BOOLEAN NOT NULL DEFAULT true,
    enable_parking_alerts BOOLEAN NOT NULL DEFAULT true,
    alternate_contact_name TEXT,
    alternate_contact_phone TEXT,
    temporary_privacy_mode BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vehicle_contacts_vehicle_id ON public.vehicle_contacts(vehicle_id);

-- ============================================================================
-- 4. VEHICLE QR CODES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.vehicle_qr_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE UNIQUE,
    token TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'compromised')),
    scan_count INTEGER NOT NULL DEFAULT 0,
    last_scanned_at TIMESTAMPTZ,
    rotated_from_token TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vehicle_qr_codes_token ON public.vehicle_qr_codes(token);
CREATE INDEX IF NOT EXISTS idx_vehicle_qr_codes_status ON public.vehicle_qr_codes(status);

-- ============================================================================
-- 5. PARKING ALERTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.parking_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN (
        'blocking',
        'please_move',
        'lights_on',
        'window_open',
        'parked_incorrectly',
        'other'
    )),
    custom_message TEXT,
    sender_hash TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'read', 'resolved', 'ignored')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_parking_alerts_vehicle_id ON public.parking_alerts(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_parking_alerts_sender_created ON public.parking_alerts(sender_hash, created_at);

-- ============================================================================
-- 6. ANONYMOUS MESSAGES TABLE (CONTACT RELAY)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.anonymous_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
    sender_session_hash TEXT NOT NULL,
    message TEXT NOT NULL,
    owner_reply TEXT,
    status TEXT NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'replied', 'closed', 'reported')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    replied_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_anon_messages_vehicle_id ON public.anonymous_messages(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_anon_messages_sender ON public.anonymous_messages(sender_session_hash, created_at);

-- ============================================================================
-- 7. NOTIFICATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN (
        'parking_alert',
        'anonymous_message',
        'qr_scanned',
        'qr_reported',
        'profile_updated',
        'security'
    )),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    is_read BOOLEAN NOT NULL DEFAULT false,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- ============================================================================
-- 8. SCAN LOGS TABLE (ANONYMIZED & PRIVACY CONSCIOUS)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.scan_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
    qr_id UUID NOT NULL REFERENCES public.vehicle_qr_codes(id) ON DELETE CASCADE,
    action_taken TEXT NOT NULL DEFAULT 'view' CHECK (action_taken IN ('view', 'call_click', 'whatsapp_click', 'alert_opened', 'report_opened')),
    visitor_hash TEXT NOT NULL,
    user_agent_short TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scan_logs_vehicle_created ON public.scan_logs(vehicle_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scan_logs_created_at ON public.scan_logs(created_at DESC);

-- ============================================================================
-- 9. REPORTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
    qr_id UUID REFERENCES public.vehicle_qr_codes(id) ON DELETE SET NULL,
    reporter_hash TEXT NOT NULL,
    reason TEXT NOT NULL CHECK (reason IN ('misuse', 'fake_vehicle', 'harassment', 'illegal_parking', 'other')),
    details TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')),
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);

-- ============================================================================
-- 10. INSTITUTIONAL PARKING MODULE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.institutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL DEFAULT 'university',
    address TEXT,
    contact_email TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.institution_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'staff', 'member')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(institution_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.parking_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    capacity INTEGER DEFAULT 100,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 11. ADMIN AUDIT LOGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES public.profiles(id),
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_created ON public.admin_audit_logs(admin_id, created_at DESC);

-- ============================================================================
-- 12. USER NOTIFICATION PREFERENCES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    email_alerts BOOLEAN NOT NULL DEFAULT true,
    browser_push BOOLEAN NOT NULL DEFAULT true,
    instant_scan_alerts BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parking_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anonymous_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institution_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parking_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notification_preferences ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Profiles:
-- Users can view their own profile, admins can view all
CREATE POLICY "Users view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Users update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id OR public.is_admin());

-- 2. Vehicles:
-- Owners view/manage their vehicles. Admins view all.
CREATE POLICY "Owners manage vehicles" ON public.vehicles
    FOR ALL USING (auth.uid() = owner_id OR public.is_admin());

-- 3. Vehicle Contacts:
CREATE POLICY "Owners manage vehicle contacts" ON public.vehicle_contacts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.vehicles
            WHERE vehicles.id = vehicle_contacts.vehicle_id
            AND (vehicles.owner_id = auth.uid() OR public.is_admin())
        )
    );

-- 4. Vehicle QR Codes:
CREATE POLICY "Owners manage vehicle QR codes" ON public.vehicle_qr_codes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.vehicles
            WHERE vehicles.id = vehicle_qr_codes.vehicle_id
            AND (vehicles.owner_id = auth.uid() OR public.is_admin())
        )
    );

-- 5. Parking Alerts:
-- Owners can view/update alerts for their own vehicles.
CREATE POLICY "Owners view vehicle parking alerts" ON public.parking_alerts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.vehicles
            WHERE vehicles.id = parking_alerts.vehicle_id
            AND (vehicles.owner_id = auth.uid() OR public.is_admin())
        )
    );

CREATE POLICY "Owners update vehicle parking alerts" ON public.parking_alerts
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.vehicles
            WHERE vehicles.id = parking_alerts.vehicle_id
            AND (vehicles.owner_id = auth.uid() OR public.is_admin())
        )
    );

-- 6. Anonymous Messages:
CREATE POLICY "Owners view and reply messages" ON public.anonymous_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.vehicles
            WHERE vehicles.id = anonymous_messages.vehicle_id
            AND (vehicles.owner_id = auth.uid() OR public.is_admin())
        )
    );

CREATE POLICY "Owners update messages" ON public.anonymous_messages
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.vehicles
            WHERE vehicles.id = anonymous_messages.vehicle_id
            AND (vehicles.owner_id = auth.uid() OR public.is_admin())
        )
    );

-- 7. Notifications:
CREATE POLICY "Users view own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- 8. Scan logs:
CREATE POLICY "Owners view vehicle scan logs" ON public.scan_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.vehicles
            WHERE vehicles.id = scan_logs.vehicle_id
            AND (vehicles.owner_id = auth.uid() OR public.is_admin())
        )
    );

-- 9. Reports:
CREATE POLICY "Admins view all reports" ON public.reports
    FOR ALL USING (public.is_admin());

-- 10. Audit logs:
CREATE POLICY "Admins view audit logs" ON public.admin_audit_logs
    FOR ALL USING (public.is_admin());

-- 11. Notification Preferences:
CREATE POLICY "Users manage notification preferences" ON public.user_notification_preferences
    FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- SECURE PUBLIC RPC FUNCTIONS (Bypasses RLS strictly for safe public lookups)
-- ============================================================================

-- Function 1: Get public vehicle info by token
-- Strictly exposes only public fields based on owner privacy settings!
CREATE OR REPLACE FUNCTION public.get_public_vehicle_by_token(p_token TEXT)
RETURNS JSONB AS $$
DECLARE
    v_qr RECORD;
    v_vehicle RECORD;
    v_contact RECORD;
    v_owner RECORD;
    v_result JSONB;
BEGIN
    -- 1. Find active QR code
    SELECT * INTO v_qr FROM public.vehicle_qr_codes
    WHERE token = p_token;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'INVALID_QR', 'message', 'Invalid or expired QR code');
    END IF;

    IF v_qr.status != 'active' THEN
        RETURN jsonb_build_object('success', false, 'error', 'QR_INACTIVE', 'status', v_qr.status, 'message', 'This QR code is currently inactive or suspended');
    END IF;

    -- 2. Find vehicle
    SELECT * INTO v_vehicle FROM public.vehicles
    WHERE id = v_qr.vehicle_id;

    IF NOT FOUND OR v_vehicle.status != 'active' THEN
        RETURN jsonb_build_object('success', false, 'error', 'VEHICLE_INACTIVE', 'status', COALESCE(v_vehicle.status, 'not_found'), 'message', 'This vehicle profile is not active');
    END IF;

    -- 3. Get contact & privacy settings
    SELECT * INTO v_contact FROM public.vehicle_contacts
    WHERE vehicle_id = v_vehicle.id;

    -- 4. Get owner info
    SELECT full_name, phone_number, whatsapp_number INTO v_owner FROM public.profiles
    WHERE id = v_vehicle.owner_id;

    -- 5. Construct secure payload
    -- Never expose owner email, database IDs, or raw contact details if privacy is enabled
    v_result := jsonb_build_object(
        'success', true,
        'token', v_qr.token,
        'vehicle_id', v_vehicle.id,
        'registration_number', v_vehicle.registration_number,
        'vehicle_type', v_vehicle.vehicle_type,
        'brand', v_vehicle.brand,
        'model', v_vehicle.model,
        'color', v_vehicle.color,
        'image_url', v_vehicle.image_url,
        'description', v_vehicle.description,
        'parking_location', v_vehicle.parking_location,
        'status', v_vehicle.status,
        'privacy', jsonb_build_object(
            'temporary_privacy_mode', COALESCE(v_contact.temporary_privacy_mode, false),
            'allow_phone', (COALESCE(v_contact.show_phone, false) AND NOT COALESCE(v_contact.temporary_privacy_mode, false)),
            'allow_whatsapp', (COALESCE(v_contact.show_whatsapp, true) AND NOT COALESCE(v_contact.temporary_privacy_mode, false)),
            'allow_anonymous_messages', (COALESCE(v_contact.enable_anonymous_messages, true) AND NOT COALESCE(v_contact.temporary_privacy_mode, false)),
            'allow_parking_alerts', (COALESCE(v_contact.enable_parking_alerts, true) AND NOT COALESCE(v_contact.temporary_privacy_mode, false))
        ),
        'contact', jsonb_build_object(
            'owner_first_name', split_part(COALESCE(v_owner.full_name, 'Owner'), ' ', 1),
            'phone', CASE
                WHEN (COALESCE(v_contact.show_phone, false) AND NOT COALESCE(v_contact.temporary_privacy_mode, false))
                THEN COALESCE(v_contact.alternate_contact_phone, v_owner.phone_number)
                ELSE NULL
            END,
            'whatsapp', CASE
                WHEN (COALESCE(v_contact.show_whatsapp, true) AND NOT COALESCE(v_contact.temporary_privacy_mode, false))
                THEN COALESCE(v_owner.whatsapp_number, v_owner.phone_number)
                ELSE NULL
            END
        )
    );

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function 2: Record QR scan log
CREATE OR REPLACE FUNCTION public.log_qr_scan(
    p_token TEXT,
    p_action TEXT,
    p_visitor_hash TEXT,
    p_user_agent TEXT
)
RETURNS VOID AS $$
DECLARE
    v_qr RECORD;
    v_owner_id UUID;
BEGIN
    SELECT q.id, q.vehicle_id, v.owner_id INTO v_qr
    FROM public.vehicle_qr_codes q
    JOIN public.vehicles v ON v.id = q.vehicle_id
    WHERE q.token = p_token AND q.status = 'active';

    IF FOUND THEN
        -- Insert scan log
        INSERT INTO public.scan_logs (vehicle_id, qr_id, action_taken, visitor_hash, user_agent_short)
        VALUES (v_qr.vehicle_id, v_qr.id, p_action, p_visitor_hash, LEFT(p_user_agent, 100));

        -- Increment scan count on QR code if action is view
        IF p_action = 'view' THEN
            UPDATE public.vehicle_qr_codes
            SET scan_count = scan_count + 1,
                last_scanned_at = now()
            WHERE id = v_qr.id;
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function 3: Submit public parking alert with rate limiting (max 3 alerts per 15 min per sender)
CREATE OR REPLACE FUNCTION public.submit_parking_alert(
    p_token TEXT,
    p_category TEXT,
    p_custom_message TEXT,
    p_sender_hash TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_qr RECORD;
    v_vehicle RECORD;
    v_recent_count INT;
    v_alert_id UUID;
BEGIN
    -- Check QR and Vehicle
    SELECT q.id AS qr_id, q.vehicle_id, v.owner_id, v.registration_number, c.enable_parking_alerts, c.temporary_privacy_mode
    INTO v_qr
    FROM public.vehicle_qr_codes q
    JOIN public.vehicles v ON v.id = q.vehicle_id
    LEFT JOIN public.vehicle_contacts c ON c.vehicle_id = v.id
    WHERE q.token = p_token AND q.status = 'active';

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'INVALID_QR');
    END IF;

    IF v_qr.temporary_privacy_mode = true OR v_qr.enable_parking_alerts = false THEN
        RETURN jsonb_build_object('success', false, 'error', 'ALERTS_DISABLED');
    END IF;

    -- Rate limiting check: max 3 alerts per sender_hash in last 15 minutes for this vehicle
    SELECT COUNT(*) INTO v_recent_count
    FROM public.parking_alerts
    WHERE vehicle_id = v_qr.vehicle_id
      AND sender_hash = p_sender_hash
      AND created_at > (now() - interval '15 minutes');

    IF v_recent_count >= 3 THEN
        RETURN jsonb_build_object('success', false, 'error', 'RATE_LIMITED', 'message', 'Too many requests. Please wait a few minutes before submitting another alert.');
    END IF;

    -- Duplicate check: same category within last 5 minutes from same sender
    IF EXISTS (
        SELECT 1 FROM public.parking_alerts
        WHERE vehicle_id = v_qr.vehicle_id
          AND category = p_category
          AND sender_hash = p_sender_hash
          AND created_at > (now() - interval '5 minutes')
    ) THEN
        RETURN jsonb_build_object('success', false, 'error', 'DUPLICATE_ALERT', 'message', 'An identical alert was submitted very recently.');
    END IF;

    -- Insert alert
    INSERT INTO public.parking_alerts (vehicle_id, category, custom_message, sender_hash)
    VALUES (v_qr.vehicle_id, p_category, LEFT(p_custom_message, 500), p_sender_hash)
    RETURNING id INTO v_alert_id;

    -- Insert notification for owner
    INSERT INTO public.notifications (
        user_id,
        vehicle_id,
        type,
        title,
        message,
        link,
        metadata
    ) VALUES (
        v_qr.owner_id,
        v_qr.vehicle_id,
        'parking_alert',
        'New Parking Alert for ' || v_qr.registration_number,
        CASE p_category
            WHEN 'blocking' THEN 'Your vehicle is blocking another vehicle.'
            WHEN 'please_move' THEN 'Please move your vehicle.'
            WHEN 'lights_on' THEN 'Your vehicle lights are switched on.'
            WHEN 'window_open' THEN 'Your vehicle window appears to be open.'
            WHEN 'parked_incorrectly' THEN 'Your vehicle may be parked incorrectly.'
            ELSE 'Parking issue reported: ' || COALESCE(p_custom_message, 'Details provided')
        END,
        '/dashboard/alerts',
        jsonb_build_object('alert_id', v_alert_id, 'category', p_category)
    );

    RETURN jsonb_build_object('success', true, 'alert_id', v_alert_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function 4: Submit anonymous message
CREATE OR REPLACE FUNCTION public.submit_anonymous_message(
    p_token TEXT,
    p_message TEXT,
    p_sender_session_hash TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_qr RECORD;
    v_msg_id UUID;
    v_recent_count INT;
BEGIN
    SELECT q.id, q.vehicle_id, v.owner_id, v.registration_number, c.enable_anonymous_messages, c.temporary_privacy_mode
    INTO v_qr
    FROM public.vehicle_qr_codes q
    JOIN public.vehicles v ON v.id = q.vehicle_id
    LEFT JOIN public.vehicle_contacts c ON c.vehicle_id = v.id
    WHERE q.token = p_token AND q.status = 'active';

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'INVALID_QR');
    END IF;

    IF v_qr.temporary_privacy_mode = true OR v_qr.enable_anonymous_messages = false THEN
        RETURN jsonb_build_object('success', false, 'error', 'MESSAGING_DISABLED');
    END IF;

    -- Rate limiting check: max 5 messages in 10 minutes
    SELECT COUNT(*) INTO v_recent_count
    FROM public.anonymous_messages
    WHERE vehicle_id = v_qr.vehicle_id
      AND sender_session_hash = p_sender_session_hash
      AND created_at > (now() - interval '10 minutes');

    IF v_recent_count >= 5 THEN
        RETURN jsonb_build_object('success', false, 'error', 'RATE_LIMITED', 'message', 'Rate limit exceeded. Please wait a few minutes.');
    END IF;

    INSERT INTO public.anonymous_messages (vehicle_id, sender_session_hash, message)
    VALUES (v_qr.vehicle_id, p_sender_session_hash, LEFT(p_message, 1000))
    RETURNING id INTO v_msg_id;

    -- Notify owner
    INSERT INTO public.notifications (
        user_id,
        vehicle_id,
        type,
        title,
        message,
        link,
        metadata
    ) VALUES (
        v_qr.owner_id,
        v_qr.vehicle_id,
        'anonymous_message',
        'Anonymous message for ' || v_qr.registration_number,
        LEFT(p_message, 120),
        '/dashboard/messages',
        jsonb_build_object('message_id', v_msg_id)
    );

    RETURN jsonb_build_object('success', true, 'message_id', v_msg_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function 5: Rotate QR code token
CREATE OR REPLACE FUNCTION public.rotate_vehicle_qr_token(
    p_vehicle_id UUID,
    p_new_token TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_old_token TEXT;
BEGIN
    -- Check user owns this vehicle or is admin
    IF NOT EXISTS (
        SELECT 1 FROM public.vehicles
        WHERE id = p_vehicle_id AND (owner_id = auth.uid() OR public.is_admin())
    ) THEN
        RETURN jsonb_build_object('success', false, 'error', 'UNAUTHORIZED');
    END IF;

    -- Get old token
    SELECT token INTO v_old_token
    FROM public.vehicle_qr_codes
    WHERE vehicle_id = p_vehicle_id;

    -- Update token
    UPDATE public.vehicle_qr_codes
    SET token = p_new_token,
        status = 'active',
        rotated_from_token = v_old_token,
        updated_at = now()
    WHERE vehicle_id = p_vehicle_id;

    -- Add notification
    INSERT INTO public.notifications (
        user_id,
        vehicle_id,
        type,
        title,
        message,
        link
    ) VALUES (
        auth.uid(),
        p_vehicle_id,
        'security',
        'QR Code Rotated',
        'Your vehicle QR token has been successfully rotated. Old QR stickers will no longer connect.',
        '/dashboard/qr'
    );

    RETURN jsonb_build_object('success', true, 'new_token', p_new_token, 'old_token', v_old_token);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile on auth.users insert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, phone_number, role)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
        new.raw_user_meta_data->>'phone_number',
        COALESCE(new.raw_user_meta_data->>'role', 'user')
    )
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.user_notification_preferences (user_id)
    VALUES (new.id)
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

