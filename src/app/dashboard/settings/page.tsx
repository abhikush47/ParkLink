"use client";

import React, { useEffect, useState } from "react";
import { User, Phone, MessageSquare, Lock, Bell, Save, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import type { Profile, UserNotificationPreferences } from "@/types/database";

export default function AccountSettingsPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);

  // Profile state
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");

  // Notification prefs state
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [browserPush, setBrowserPush] = useState(true);
  const [scanAlerts, setScanAlerts] = useState(false);

  // Password update state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    let isMounted = true;
    async function loadProfile() {
      try {
        setLoading(true);
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          setEmail(user.email || "");

          const { data: pData } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

          if (isMounted && pData) {
            setFullName(pData.full_name || "");
            setPhone(pData.phone_number || "");
            setWhatsapp(pData.whatsapp_number || "");
          }

          const { data: prefData } = await supabase
            .from("user_notification_preferences")
            .select("*")
            .eq("user_id", user.id)
            .single();

          if (isMounted && prefData) {
            setEmailAlerts(prefData.email_alerts);
            setBrowserPush(prefData.browser_push);
            setScanAlerts(prefData.instant_scan_alerts);
          }
        }
      } catch (err) {
        console.error("Load settings error", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadProfile();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim(),
          phone_number: phone.trim() || null,
          whatsapp_number: whatsapp.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;
      toast.success("Profile updated successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSavePrefs = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPrefs(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("user_notification_preferences")
        .upsert({
          user_id: user.id,
          email_alerts: emailAlerts,
          browser_push: browserPush,
          instant_scan_alerts: scanAlerts,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      toast.success("Notification preferences updated!");
    } catch (err: any) {
      toast.error(err.message || "Failed to update preferences");
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setSavingPassword(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) throw error;

      toast.success("Account password changed successfully");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.message || "Failed to update password");
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="pb-4 border-b border-border">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Account Settings</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Manage your personal profile, notification channels, and security credentials.
        </p>
      </div>

      {/* Profile Form */}
      <form
        onSubmit={handleSaveProfile}
        className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm space-y-4"
      >
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <User className="h-4 w-4 text-emerald-600" /> Personal Profile
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-foreground block mb-1">Full Name</label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground block mb-1">
              Account Email (Read-only)
            </label>
            <Input value={email} disabled className="bg-muted/40 cursor-not-allowed" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-foreground block mb-1">
              Primary Contact Phone
            </label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
            />
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Used when you enable phone calling on your vehicle profile.
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground block mb-1">
              WhatsApp Number
            </label>
            <Input
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="+91 98765 43210"
            />
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Leave blank to use your primary phone number.
            </p>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <Button
            type="submit"
            isLoading={savingProfile}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
          >
            <Save className="mr-1.5 h-3.5 w-3.5" /> Save Profile
          </Button>
        </div>
      </form>

      {/* Notification Preferences */}
      <form
        onSubmit={handleSavePrefs}
        className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm space-y-4"
      >
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Bell className="h-4 w-4 text-emerald-600" /> Notification Channels
        </h2>

        <div className="space-y-3">
          <label className="flex items-center justify-between p-3.5 rounded-xl border border-border cursor-pointer hover:bg-muted/30">
            <div className="space-y-0.5">
              <div className="text-xs font-semibold text-foreground">Email Notifications</div>
              <div className="text-[11px] text-muted-foreground">
                Receive parking alert notices and critical relay messages via email.
              </div>
            </div>
            <input
              type="checkbox"
              checked={emailAlerts}
              onChange={(e) => setEmailAlerts(e.target.checked)}
              className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
            />
          </label>

          <label className="flex items-center justify-between p-3.5 rounded-xl border border-border cursor-pointer hover:bg-muted/30">
            <div className="space-y-0.5">
              <div className="text-xs font-semibold text-foreground">Realtime Browser Alerts</div>
              <div className="text-[11px] text-muted-foreground">
                Display immediate notifications when logged into your dashboard.
              </div>
            </div>
            <input
              type="checkbox"
              checked={browserPush}
              onChange={(e) => setBrowserPush(e.target.checked)}
              className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
            />
          </label>

          <label className="flex items-center justify-between p-3.5 rounded-xl border border-border cursor-pointer hover:bg-muted/30">
            <div className="space-y-0.5">
              <div className="text-xs font-semibold text-foreground">Scan Alerts</div>
              <div className="text-[11px] text-muted-foreground">
                Receive notification whenever a visitor scans your vehicle QR sticker.
              </div>
            </div>
            <input
              type="checkbox"
              checked={scanAlerts}
              onChange={(e) => setScanAlerts(e.target.checked)}
              className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
            />
          </label>
        </div>

        <div className="pt-2 flex justify-end">
          <Button
            type="submit"
            isLoading={savingPrefs}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
          >
            <Save className="mr-1.5 h-3.5 w-3.5" /> Save Preferences
          </Button>
        </div>
      </form>

      {/* Password Update */}
      <form
        onSubmit={handleUpdatePassword}
        className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm space-y-4"
      >
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Lock className="h-4 w-4 text-emerald-600" /> Security & Password
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-foreground block mb-1">
              New Password
            </label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground block mb-1">
              Confirm Password
            </label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <Button
            type="submit"
            isLoading={savingPassword}
            variant="outline"
            className="text-xs h-9"
          >
            Update Password
          </Button>
        </div>
      </form>
    </div>
  );
}
