import { NextRequest, NextResponse } from "next/server";
import { createClientServer } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { reportSubmissionSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const parsed = reportSubmissionSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "VALIDATION_FAILED", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { token, reason, details } = parsed.data;

    if (isSupabaseConfigured) {
      const ip = request.headers.get("x-forwarded-for") || "unknown";
      const reporterHash = Buffer.from(`${ip}-${Date.now()}`).toString("base64").slice(0, 20);

      const supabase = await createClientServer();
      const { data: qr } = await supabase
        .from("vehicle_qr_codes")
        .select("id, vehicle_id")
        .eq("token", token)
        .single();

      const { error: insertError } = await supabase.from("reports").insert({
        qr_id: qr?.id || null,
        vehicle_id: qr?.vehicle_id || null,
        reporter_hash: reporterHash,
        reason,
        details: details || null,
        status: "pending",
      });

      if (insertError) {
        return NextResponse.json(
          { success: false, error: "DB_ERROR", message: insertError.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true, message: "Report logged successfully" });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "SERVER_ERROR", message: err.message },
      { status: 500 }
    );
  }
}
