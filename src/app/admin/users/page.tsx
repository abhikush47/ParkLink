"use client";

import React, { useEffect, useState } from "react";
import {
  Users,
  Search,
  Shield,
  ShieldAlert,
  Check,
  X,
  Trash2,
  AlertTriangle,
  Mail,
  UserCheck,
  Lock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Phone,
} from "lucide-react";
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

      // Remove from table immediately
      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
      toast.success(
        `User ${userToDelete.full_name || userToDelete.email} permanently erased. Auth credentials revoked.`
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

  const adminCount = users.filter((u) => u.role === "admin").length;
  const userCount = users.filter((u) => u.role !== "admin").length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-rose-500/20 bg-gradient-to-br from-rose-950/30 via-slate-950 to-slate-950 p-6 md:p-8 backdrop-blur-xl">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-rose-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-400">
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>Super Administrator Directory & Access Control</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              User Accounts & Security
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
              Manage registered platform accounts, promote administrators, and enforce permanent user deletion. Deleting a user wipes their Supabase Auth credentials, vehicle fleet, and dynamic QR stickers.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3 backdrop-blur-md">
              <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                Total Users
              </div>
              <div className="text-xl font-mono font-bold text-white">
                {users.length}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3 backdrop-blur-md">
              <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                Admins
              </div>
              <div className="text-xl font-mono font-bold text-rose-400">
                {adminCount}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Total Accounts
          </div>
          <div className="text-2xl font-mono font-bold text-white mt-1">
            {users.length}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Platform Admins
          </div>
          <div className="text-2xl font-mono font-bold text-rose-400 mt-1">
            {adminCount}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Drivers / Owners
          </div>
          <div className="text-2xl font-mono font-bold text-emerald-400 mt-1">
            {userCount}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Auth Service
          </div>
          <div className="text-xs font-semibold text-emerald-400 mt-2 flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4" /> Supabase Connected
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
        <Input
          placeholder="Search users by name, email, phone, role..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 bg-slate-950 border-slate-800 text-white text-xs h-10 rounded-xl focus:border-rose-500"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 rounded-2xl bg-slate-800" />
          <Skeleton className="h-20 rounded-2xl bg-slate-800" />
          <Skeleton className="h-20 rounded-2xl bg-slate-800" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-slate-950 border border-slate-800 rounded-3xl p-16 text-center text-slate-400 text-xs">
          No users found matching your search.
        </div>
      ) : (
        <div className="bg-slate-950 border border-slate-800/80 rounded-3xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase font-semibold text-[11px] tracking-wider">
                <tr>
                  <th className="p-4 pl-6">User Account</th>
                  <th className="p-4">Phone Number</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Registered Date</th>
                  <th className="p-4 pr-6 text-right">Administrative Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map((user) => {
                  const isSelf = user.id === currentAdminId;
                  const initials = (user.full_name || user.email || "U")
                    .substring(0, 2)
                    .toUpperCase();

                  return (
                    <tr key={user.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/80 flex items-center justify-center font-bold text-xs text-white shrink-0">
                            {initials}
                          </div>
                          <div>
                            <div className="font-semibold text-white flex items-center gap-1.5">
                              <span>{user.full_name || "Unnamed Driver"}</span>
                              {isSelf && (
                                <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800/60 px-1.5 py-0.2 rounded font-normal">
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
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-mono text-slate-300">
                        {user.phone_number || "—"}
                      </td>
                      <td className="p-4">
                        <Badge
                          variant={user.role === "admin" ? "destructive" : "secondary"}
                          className="text-[10px] font-mono uppercase"
                        >
                          {user.role}
                        </Badge>
                      </td>
                      <td className="p-4 text-slate-400 font-mono">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <div className="inline-flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleAdmin(user.id, user.role)}
                            className="text-[11px] h-8 rounded-xl border-slate-700 text-slate-200 hover:bg-slate-800"
                          >
                            {user.role === "admin" ? "Revoke Admin" : "Make Admin"}
                          </Button>

                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={isSelf}
                            onClick={() => setUserToDelete(user)}
                            title={isSelf ? "You cannot delete your own account" : "Permanently delete user"}
                            className="text-[11px] h-8 px-3 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 font-semibold"
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                            Delete User
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-950/80 text-rose-500 border border-rose-800/50 mb-3 shadow-lg shadow-rose-950/50">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <DialogTitle className="text-center text-xl font-extrabold text-white">
            Permanently Erase User Account?
          </DialogTitle>
          <DialogDescription className="text-center text-xs text-slate-400 mt-1 leading-relaxed">
            Are you sure you want to completely erase{" "}
            <strong className="text-white font-mono">
              {userToDelete?.full_name || userToDelete?.email}
            </strong>
            ?
          </DialogDescription>
        </DialogHeader>

        <div className="bg-rose-950/30 border border-rose-900/50 rounded-2xl p-4 my-3 text-xs text-rose-300 space-y-2.5">
          <p className="font-bold text-rose-400 flex items-center gap-1.5">
            <ShieldAlert className="h-4 w-4" /> Irreversible Consequences:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-300 leading-relaxed">
            <li>Account is deleted from Supabase Authentication (<code className="text-rose-400">auth.users</code>).</li>
            <li>All associated vehicles, dynamic QR stickers, and contact settings are permanently wiped.</li>
            <li>
              <strong>If they attempt to log in with their old credentials, authentication will fail and they must register a brand new account from scratch.</strong>
            </li>
          </ul>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => setUserToDelete(null)}
            disabled={isDeleting}
            className="text-xs rounded-xl border-slate-700 text-slate-300"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirmDelete}
            isLoading={isDeleting}
            className="text-xs bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl px-4 shadow-lg shadow-rose-950/40"
          >
            Yes, Permanently Delete
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
