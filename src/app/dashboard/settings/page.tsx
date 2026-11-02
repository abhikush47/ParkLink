"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { User, Phone, MessageSquare, Lock, Bell, Save, ShieldCheck, Send, ExternalLink } from "lucide-react";
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
      toast.success("Profile updated successfully");
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
      toast.success("Notification preferences updated");
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
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Banner - Console Minimal */}
      <div className="rounded-2xl border border-border bg-card p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-md bg-muted px-2.5 py-1 text-xs text-foreground font-mono">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Profile and privacy</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Account settings
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-xl leading-relaxed">
            Manage your personal contact details, notification broadcast channels, and security credentials.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-muted border border-border flex items-center justify-center text-foreground font-bold text-sm">
            {(fullName || email || "U").substring(0, 2).toUpperCase()}
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <form
        onSubmit={handleSaveProfile}
        className="rounded-xl border border-border bg-card p-6 space-y-4"
      >
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <User className="h-4 w-4 text-emerald-600" /> Personal profile
          </h2>
          <span className="text-[11px] text-muted-foreground font-mono">
            {email}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Full name</label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="bg-muted text-xs h-9 rounded-lg"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-foreground block mb-1">
              Account email (verified)
            </label>
            <Input value={email} disabled className="bg-muted/40 cursor-not-allowed text-xs h-9 rounded-lg" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">
              Primary contact phone
            </label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="bg-muted text-xs h-9 rounded-lg font-mono"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Used when you enable phone calling on your vehicle profile.
            </p>
          </div>

          <div>
            <label className="text-xs font-medium text-foreground block mb-1">
              WhatsApp number
            </label>
            <Input
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="+91 98765 43210"
              className="bg-muted text-xs h-9 rounded-lg font-mono"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Leave blank to use your primary phone number.
            </p>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <Button
            type="submit"
            isLoading={savingProfile}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs h-9 px-4"
          >
            <Save className="mr-1.5 h-3.5 w-3.5" /> Save profile
          </Button>
        </div>
      </form>

      {/* Telegram Bot Integration Spotlight */}
      <div className="rounded-xl border border-sky-500/30 bg-sky-500/5 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-sky-500/10 text-sky-400">
              <Send className="h-4 w-4" />
            </span>
            <h2 className="text-sm font-semibold text-foreground">
              Telegram bot gateway
            </h2>
            <span className="inline-flex items-center rounded-md bg-sky-500/10 px-2 py-0.5 text-[10px] font-mono text-sky-400 border border-sky-500/20">
              Interactive
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
            Connect Telegram to receive instant lock-screen parking alerts and 1-tap response buttons without exposing your phone number.
          </p>
        </div>

        <Link
          href="/dashboard/telegram"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shrink-0 shadow-sm transition-colors duration-150"
        >
          <span>Manage Telegram bot</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Notification Preferences */}
      <form
        onSubmit={handleSavePrefs}
        className="rounded-xl border border-border bg-card p-6 space-y-4"
      >
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Bell className="h-4 w-4 text-emerald-600" /> Notification channels
          </h2>
          <span className="text-[11px] text-muted-foreground font-mono">
            Active
          </span>
        </div>

        <div className="space-y-2.5">
          <label className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30 cursor-pointer">
            <div className="space-y-0.5 pr-4">
              <div className="text-xs font-medium text-foreground">Email notifications</div>
              <div className="text-[11px] text-muted-foreground">
                Receive parking alert notices and critical relay messages via email.
              </div>
            </div>
            <input
              type="checkbox"
              checked={emailAlerts}
              onChange={(e) => setEmailAlerts(e.target.checked)}
              className="h-4 w-4 rounded text-emerald-600"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30 cursor-pointer">
            <div className="space-y-0.5 pr-4">
              <div className="text-xs font-medium text-foreground">Realtime browser alerts</div>
              <div className="text-[11px] text-muted-foreground">
                Display immediate notifications when logged into your dashboard.
              </div>
            </div>
            <input
              type="checkbox"
              checked={browserPush}
              onChange={(e) => setBrowserPush(e.target.checked)}
              className="h-4 w-4 rounded text-emerald-600"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30 cursor-pointer">
            <div className="space-y-0.5 pr-4">
              <div className="text-xs font-medium text-foreground">Scan alerts</div>
              <div className="text-[11px] text-muted-foreground">
                Receive notification whenever a visitor scans your vehicle QR sticker.
              </div>
            </div>
            <input
              type="checkbox"
              checked={scanAlerts}
              onChange={(e) => setScanAlerts(e.target.checked)}
              className="h-4 w-4 rounded text-emerald-600"
            />
          </label>
        </div>

        <div className="pt-2 flex justify-end">
          <Button
            type="submit"
            isLoading={savingPrefs}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs h-9 px-4"
          >
            <Save className="mr-1.5 h-3.5 w-3.5" /> Save preferences
          </Button>
        </div>
      </form>

      {/* Password Update */}
      <form
        onSubmit={handleUpdatePassword}
        className="rounded-xl border border-border bg-card p-6 space-y-4"
      >
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Lock className="h-4 w-4 text-emerald-600" /> Security and password
          </h2>
          <span className="text-[11px] text-muted-foreground font-mono">
            Minimum 6 characters
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">
              New password
            </label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="bg-muted text-xs h-9 rounded-lg"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-foreground block mb-1">
              Confirm password
            </label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="bg-muted text-xs h-9 rounded-lg"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <Button
            type="submit"
            isLoading={savingPassword}
            variant="outline"
            className="text-xs h-9 px-4 font-medium"
          >
            Update password
          </Button>
        </div>
      </form>
    </div>
  );
}
