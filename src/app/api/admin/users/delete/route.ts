import { NextRequest, NextResponse } from "next/server";
import { createClientServer, createAdminClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClientServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "UNAUTHORIZED", message: "Not signed in" },
        { status: 401 }
      );
    }

    // Check if caller is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "FORBIDDEN", message: "Only administrators can delete users" },
        { status: 403 }
      );
    }

    const { targetUserId } = await request.json();

    if (!targetUserId) {
      return NextResponse.json(
        { success: false, error: "BAD_REQUEST", message: "Missing target user ID" },
        { status: 400 }
      );
    }

    if (targetUserId === user.id) {
      return NextResponse.json(
        { success: false, error: "FORBIDDEN", message: "You cannot delete your own admin account" },
        { status: 400 }
      );
    }

    // Call Supabase admin deleteUser
    const supabaseAdmin = createAdminClient();
    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: "CONFIG_ERROR", message: "Supabase Service Role Key is not configured" },
        { status: 500 }
      );
    }

    // 1. Delete from auth.users (cascades to profiles, vehicles, vehicle_qr_codes, etc.)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(targetUserId);

    if (deleteError) {
      console.error("Failed to delete auth user:", deleteError);
      return NextResponse.json(
        { success: false, error: "DELETE_FAILED", message: deleteError.message },
        { status: 500 }
      );
    }

    // 2. Explicitly ensure public table rows are cleaned up as well
    await supabaseAdmin.from("profiles").delete().eq("id", targetUserId);
    await supabaseAdmin.from("vehicles").delete().eq("owner_id", targetUserId);

    // 3. Log in admin audit logs
    await supabase.from("admin_audit_logs").insert({
      admin_id: user.id,
      action: "DELETE_USER_PERMANENTLY",
      target_type: "user",
      target_id: targetUserId,
      metadata: { deleted_at: new Date().toISOString() },
    });

    return NextResponse.json({
      success: true,
      message: "User permanently deleted. They must register again if they wish to use ParkLink.",
    });
  } catch (err: any) {
    console.error("Admin delete user exception:", err);
    return NextResponse.json(
      { success: false, error: "SERVER_ERROR", message: err.message },
      { status: 500 }
    );
  }
}
