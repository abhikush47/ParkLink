export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "user" | "admin" | "institution_admin";

export interface Profile {
  id: string;
  full_name: string;
  phone_number?: string | null;
  whatsapp_number?: string | null;
  avatar_url?: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export type VehicleType =
  | "Car"
  | "Motorcycle"
  | "Scooter"
  | "SUV"
  | "Van"
  | "Truck"
  | "Other";

export type VehicleStatus = "active" | "inactive" | "sold" | "suspended";

export interface Vehicle {
  id: string;
  owner_id: string;
  registration_number: string;
  normalized_registration_number: string;
  vehicle_type: VehicleType;
  brand: string;
  model: string;
  color: string;
  image_url?: string | null;
  description?: string | null;
  parking_location?: string | null;
  status: VehicleStatus;
  created_at: string;
  updated_at: string;
}

export interface VehicleContacts {
  id: string;
  vehicle_id: string;
  show_phone: boolean;
  show_whatsapp: boolean;
  enable_anonymous_messages: boolean;
  enable_parking_alerts: boolean;
  alternate_contact_name?: string | null;
  alternate_contact_phone?: string | null;
  temporary_privacy_mode: boolean;
  created_at: string;
  updated_at: string;
}

export type QRStatus = "active" | "inactive" | "suspended" | "compromised";

export interface VehicleQRCode {
  id: string;
  vehicle_id: string;
  token: string;
  status: QRStatus;
  scan_count: number;
  last_scanned_at?: string | null;
  rotated_from_token?: string | null;
  created_at: string;
  updated_at: string;
}

export type AlertCategory =
  | "blocking"
  | "please_move"
  | "lights_on"
  | "window_open"
  | "parked_incorrectly"
  | "other";

export type AlertStatus =
  | "pending"
  | "read"
  | "owner_responding"
  | "delayed"
  | "resolved"
  | "ignored"
  | "cancelled";

export interface ParkingAlert {
  id: string;
  vehicle_id: string;
  category: AlertCategory;
  custom_message?: string | null;
  sender_hash: string;
  status: AlertStatus;
  custom_status_note?: string | null;
  owner_response_at?: string | null;
  requester_phone?: string | null;
  created_at: string;
  resolved_at?: string | null;
  vehicle?: Vehicle;
}

export interface AnonymousMessage {
  id: string;
  vehicle_id: string;
  sender_session_hash: string;
  message: string;
  owner_reply?: string | null;
  status: "unread" | "read" | "replied" | "closed" | "reported";
  created_at: string;
  replied_at?: string | null;
  vehicle?: Vehicle;
}

export type NotificationType =
  | "parking_alert"
  | "anonymous_message"
  | "qr_scanned"
  | "qr_reported"
  | "profile_updated"
  | "security";

export interface Notification {
  id: string;
  user_id: string;
  vehicle_id?: string | null;
  type: NotificationType;
  title: string;
  message: string;
  link?: string | null;
  is_read: boolean;
  metadata?: Record<string, unknown> | null;
  created_at: string;
}

export interface ScanLog {
  id: string;
  vehicle_id: string;
  qr_id: string;
  action_taken: "view" | "call_click" | "whatsapp_click" | "alert_opened" | "report_opened";
  visitor_hash: string;
  user_agent_short?: string | null;
  created_at: string;
}

export interface Report {
  id: string;
  vehicle_id?: string | null;
  qr_id?: string | null;
  reporter_hash: string;
  reason: "misuse" | "fake_vehicle" | "harassment" | "illegal_parking" | "other";
  details?: string | null;
  status: "pending" | "investigating" | "resolved" | "dismissed";
  admin_notes?: string | null;
  created_at: string;
  resolved_at?: string | null;
  vehicle?: Vehicle;
  qr?: VehicleQRCode;
}

export interface AdminAuditLog {
  id: string;
  admin_id: string;
  action: string;
  target_type: string;
  target_id: string;
  metadata?: Record<string, unknown> | null;
  created_at: string;
  admin?: Profile;
}

export interface UserNotificationPreferences {
  id: string;
  user_id: string;
  email_alerts: boolean;
  browser_push: boolean;
  instant_scan_alerts: boolean;
  telegram_enabled: boolean;
  parking_alerts_enabled: boolean;
  anonymous_messages_enabled: boolean;
  qr_scans_enabled: boolean;
  security_alerts_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export type TelegramConnectionStatus = "connected" | "disconnected" | "suspended";

export interface TelegramConnection {
  id: string;
  user_id: string;
  telegram_chat_id: string;
  telegram_user_id?: string | null;
  telegram_username?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  connected_at: string;
  status: TelegramConnectionStatus;
  updated_at: string;
  profile?: Profile;
}

export interface TelegramLinkToken {
  id: string;
  user_id: string;
  token: string;
  token_hash?: string | null;
  expires_at: string;
  used_at?: string | null;
  created_at: string;
}

export type DeliveryChannel = "telegram" | "email" | "in_app" | "sms" | "whatsapp";
export type DeliveryEventType =
  | "parking_alert"
  | "anonymous_message"
  | "qr_scanned"
  | "security"
  | "test_notification";
export type DeliveryStatus = "delivered" | "failed" | "skipped" | "pending";

export interface NotificationDeliveryLog {
  id: string;
  notification_id?: string | null;
  user_id: string;
  channel: DeliveryChannel;
  event_type: DeliveryEventType;
  delivery_status: DeliveryStatus;
  error_message?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
  profile?: Profile;
}

export interface PublicVehicleProfileResponse {
  success: boolean;
  token?: string;
  vehicle_id?: string;
  registration_number?: string;
  vehicle_type?: VehicleType;
  brand?: string;
  model?: string;
  color?: string;
  image_url?: string | null;
  description?: string | null;
  parking_location?: string | null;
  status?: VehicleStatus;
  privacy?: {
    temporary_privacy_mode: boolean;
    allow_phone: boolean;
    allow_whatsapp: boolean;
    allow_anonymous_messages: boolean;
    allow_parking_alerts: boolean;
  };
  contact?: {
    owner_first_name?: string;
    phone?: string | null;
    whatsapp?: string | null;
  };
  error?: string;
  message?: string;
}

