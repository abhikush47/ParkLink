"use client";

import React, { useEffect, useState } from "react";
import { Users, Search, Shield, ShieldAlert, Check, X, Car } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { formatDate } from "@/lib/utils";
import type { Profile } from "@/types/database";

export default function AdminUsersPage() {
  const toast = useToast();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let isMounted = true;
    async function loadUsers() {
      try {
        setLoading(true);
        const supabase = createClient();
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .order("created_at", { ascending: false });

        if (isMounted && data) {
          setUsers(data);
        }
      } catch (err) {
        console.error("Admin users fetch error", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadUsers();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleToggleAdmin = async (userId: string, currentRole: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("id", userId);

      if (error) throw error;

      // Log admin audit
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await supabase.from("admin_audit_logs").insert({
          admin_id: user.id,
          action: "UPDATE_USER_ROLE",
          target_type: "profile",
          target_id: userId,
          metadata: { old_role: currentRole, new_role: newRole },
        });
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole as any } : u))
      );
      toast.success(`User role updated to ${newRole}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update role");
    }
  };

  const filtered = users.filter((u) =>
    u.full_name?.toLowerCase().includes(query.toLowerCase()) ||
    u.phone_number?.includes(query) ||
    u.role?.includes(query.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">User Accounts</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage registered platform users, administrative privileges, and account status.
          </p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
        <Input
          placeholder="Search users by name, phone, role..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9 bg-slate-950 border-slate-800 text-white text-xs"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-16 rounded-xl bg-slate-800" />
          <Skeleton className="h-16 rounded-xl bg-slate-800" />
          <Skeleton className="h-16 rounded-xl bg-slate-800" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 text-xs">
          No users found.
        </div>
      ) : (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase font-semibold">
              <tr>
                <th className="p-4">User</th>
                <th className="p-4">Phone Number</th>
                <th className="p-4">Role</th>
                <th className="p-4">Registered</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.map((user) => (
                <tr key={user.id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="p-4 font-semibold text-white">
                    {user.full_name || "Unnamed Driver"}
                  </td>
                  <td className="p-4 font-mono">{user.phone_number || "—"}</td>
                  <td className="p-4">
                    <Badge
                      variant={user.role === "admin" ? "destructive" : "secondary"}
                      className="text-[10px]"
                    >
                      {user.role}
                    </Badge>
                  </td>
                  <td className="p-4 text-slate-400">{formatDate(user.created_at)}</td>
                  <td className="p-4 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleAdmin(user.id, user.role)}
                      className="text-[11px] h-7 border-slate-700 text-slate-200"
                    >
                      {user.role === "admin" ? "Revoke Admin" : "Make Admin"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
