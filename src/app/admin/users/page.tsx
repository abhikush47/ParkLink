"use client";

import React, { useEffect, useState } from "react";
import { Users, Search, Shield, ShieldAlert, Check, X, Trash2, AlertTriangle, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { formatDate } from "@/lib/utils";
import type { Profile } from "@/types/database";

interface AdminUserItem extends Profile {
  email?: string | null;
}

export default function AdminUsersPage() {
  const toast = useToast();
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [currentAdminId, setCurrentAdminId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  // Deletion modal state
  const [userToDelete, setUserToDelete] = useState<AdminUserItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/users/list");
      const data = await res.json();

      if (res.ok && data.success) {
        setUsers(data.users || []);
        if (data.currentUserId) setCurrentAdminId(data.currentUserId);
      } else {
        // Fallback directly to supabase
        const supabase = createClient();
        const { data: profiles } = await supabase
          .from("profiles")
          .select("*")
          .order("created_at", { ascending: false });

        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();

        if (profiles) setUsers(profiles);
        if (currentUser) setCurrentAdminId(currentUser.id);
      }
    } catch (err) {
      console.error("Admin users fetch error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
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

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    setIsDeleting(true);
    try {
      const res = await fetch("/api/admin/users/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: userToDelete.id }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || "Failed to delete user");
      }

      // Remove from table
      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
      toast.success(
        `User ${userToDelete.full_name || userToDelete.email} permanently deleted. If they login again, they must register as a new user.`
      );
      setUserToDelete(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete user");
    } finally {
      setIsDeleting(false);
    }
  };

  const filtered = users.filter((u) =>
    u.full_name?.toLowerCase().includes(query.toLowerCase()) ||
    u.email?.toLowerCase().includes(query.toLowerCase()) ||
    u.phone_number?.includes(query) ||
    u.role?.includes(query.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">User Accounts</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage registered platform users, administrative privileges, and permanent account removal.
          </p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
        <Input
          placeholder="Search users by name, email, phone, role..."
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
          No users found matching your search.
        </div>
      ) : (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
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
              {filtered.map((user) => {
                const isSelf = user.id === currentAdminId;
                return (
                  <tr key={user.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="p-4">
                      <div className="font-semibold text-white">
                        {user.full_name || "Unnamed Driver"}
                        {isSelf && (
                          <span className="ml-2 text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800/60 px-1.5 py-0.5 rounded font-normal">
                            You
                          </span>
                        )}
                      </div>
                      {user.email && (
                        <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                          <Mail className="h-3 w-3 text-slate-500" />
                          <span>{user.email}</span>
                        </div>
                      )}
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
                      <div className="inline-flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleAdmin(user.id, user.role)}
                          className="text-[11px] h-7 border-slate-700 text-slate-200"
                        >
                          {user.role === "admin" ? "Revoke Admin" : "Make Admin"}
                        </Button>

                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={isSelf}
                          onClick={() => setUserToDelete(user)}
                          title={isSelf ? "You cannot delete your own account" : "Permanently delete user"}
                          className="text-[11px] h-7 px-2.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30"
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Permanent Delete Confirmation Dialog */}
      <Dialog
        open={Boolean(userToDelete)}
        onOpenChange={(open) => {
          if (!open) setUserToDelete(null);
        }}
      >
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-950/80 text-rose-500 border border-rose-800/50 mb-3">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <DialogTitle className="text-center text-lg font-bold text-foreground">
            Permanently Delete User?
          </DialogTitle>
          <DialogDescription className="text-center text-xs text-muted-foreground mt-1 leading-relaxed">
            Are you sure you want to completely erase{" "}
            <strong className="text-foreground">
              {userToDelete?.full_name || userToDelete?.email}
            </strong>
            ?
          </DialogDescription>
        </DialogHeader>

        <div className="bg-rose-950/20 border border-rose-900/40 rounded-xl p-3.5 my-2 text-xs text-rose-300 space-y-2">
          <p className="font-semibold text-rose-400">⚠️ Permanent Consequences:</p>
          <ul className="list-disc pl-4 space-y-1 text-slate-300">
            <li>Account is deleted from Supabase Authentication credentials.</li>
            <li>All associated vehicles, dynamic QR stickers, and contact settings will be wiped.</li>
            <li>
              <strong>If they attempt to log in again, they will receive an invalid credentials error and will be required to register again from scratch.</strong>
            </li>
          </ul>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setUserToDelete(null)}
            disabled={isDeleting}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirmDelete}
            isLoading={isDeleting}
            className="text-xs bg-rose-600 hover:bg-rose-700 text-white font-semibold"
          >
            Yes, Delete User Permanently
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
