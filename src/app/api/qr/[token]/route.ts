import { NextRequest, NextResponse } from "next/server";
import { createClientServer } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";

// In-memory demo store for fallback testing when Supabase keys are not yet provided
const fallbackDemoVehicle = {
  success: true,
  token: "a8Kp92xLmQ",
  vehicle_id: "demo-veh-123",
  registration_number: "DL 01 AB 1234",
  vehicle_type: "Car",
  brand: "Hyundai",
  model: "Creta SX(O)",
  color: "Polar White",
  image_url: null,
  description: "Parked near Visitor Bay #4. Contact if blocked.",
  parking_location: "Basement Level B1, Bay 14",
  status: "active",
  privacy: {
    temporary_privacy_mode: false,
    allow_phone: true,
    allow_whatsapp: true,
    allow_anonymous_messages: true,
    allow_parking_alerts: true,
  },
  contact: {
    owner_first_name: "Rahul",
    phone: "+919876543210",
    whatsapp: "+919876543210",
  },
};

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  const token = params.token;

  if (!token || token.length < 6) {
    return NextResponse.json(
      { success: false, error: "INVALID_TOKEN", message: "Invalid QR token" },
      { status: 400 }
    );
  }

  // If live Supabase is configured, use live PostgreSQL database!
  if (isSupabaseConfigured) {
    try {
      const supabase = await createClientServer();
      const { data, error } = await supabase.rpc("get_public_vehicle_by_token", {
        p_token: token,
      });

      if (error) {
        console.error("RPC error:", error);
        return NextResponse.json(
          { success: false, error: "DB_ERROR", message: error.message },
          { status: 500 }
        );
      }

      if (!data || !data.success) {
        return NextResponse.json(data || { success: false, error: "NOT_FOUND" }, {
          status: 404,
        });
      }

      // Log scan asynchronously
      const userAgent = request.headers.get("user-agent") || "unknown";
      const ip = request.headers.get("x-forwarded-for") || "unknown";
      const salt = new Date().toISOString().slice(0, 10);
      const visitorHash = Buffer.from(`${ip}-${salt}`).toString("base64").slice(0, 16);

      supabase.rpc("log_qr_scan", {
        p_token: token,
        p_action: "view",
        p_visitor_hash: visitorHash,
        p_user_agent: userAgent,
      }).then();

      return NextResponse.json(data, {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
          "Pragma": "no-cache",
        },
      });
    } catch (err: any) {
      console.error("Database connection error:", err);
    }
  }

  // Graceful fallback for local developer preview/test tokens
  if (token === "a8Kp92xLmQ" || token.startsWith("demo_") || !isSupabaseConfigured) {
    return NextResponse.json(
      {
        ...fallbackDemoVehicle,
        token,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  }

  return NextResponse.json(
    {
      success: false,
      error: "NOT_FOUND",
      message: "The scanned QR code is either unassigned, deactivated, or expired.",
    },
    { status: 404 }
  );
}
