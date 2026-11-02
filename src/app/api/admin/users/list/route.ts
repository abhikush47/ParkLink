import { NextRequest, NextResponse } from "next/server";
import { createClientServer, createAdminClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClientServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    // Role check
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "FORBIDDEN" },
        { status: 403 }
      );
    }

    const supabaseAdmin = createAdminClient();
    if (!supabaseAdmin) {
      // Fallback to client query
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      return NextResponse.json({ success: true, users: profiles || [], currentUserId: user.id });
    }

    // Fetch auth users to get emails
    const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.listUsers();
    // Fetch profiles
    const { data: profilesData } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    const authMap = new Map();
    authData?.users?.forEach((u) => {
      authMap.set(u.id, u.email);
    });

    const merged = (profilesData || []).map((p) => ({
      ...p,
      email: authMap.get(p.id) || null,
    }));

    return NextResponse.json({
      success: true,
      users: merged,
      currentUserId: user.id,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "SERVER_ERROR", message: err.message },
      { status: 500 }
    );
  }
}
