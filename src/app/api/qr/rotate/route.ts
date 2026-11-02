import { NextRequest, NextResponse } from "next/server";
import { createClientServer } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClientServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "UNAUTHORIZED", message: "Please log in" },
        { status: 401 }
      );
    }

    const { vehicleId, newToken } = await request.json();

    if (!vehicleId || !newToken || newToken.length < 8) {
      return NextResponse.json(
        { success: false, error: "BAD_REQUEST", message: "Invalid parameters" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.rpc("rotate_vehicle_qr_token", {
      p_vehicle_id: vehicleId,
      p_new_token: newToken,
    });

    if (error) {
      return NextResponse.json(
        { success: false, error: "DB_ERROR", message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "SERVER_ERROR", message: err.message },
      { status: 500 }
    );
  }
}
