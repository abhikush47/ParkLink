"use client";

import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import {
  Send,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Unlink,
  Bell,
  MessageSquare,
  ShieldAlert,
  Car,
  QrCode as QrIcon,
  ExternalLink,
  Smartphone,
  Info,
  Check,
  Clock,
  Sparkles,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

interface TelegramStatusResponse {
  success: boolean;
  botUsername: string;
  isBotConfigured: boolean;
  isConnected: boolean;
  connection?: {
    id: string;
    telegram_username?: string | null;
    telegram_chat_id?: string | null;
    first_name?: string | null;
    connected_at: string;
    status: string;
  } | null;
  preferences: {
    telegram_enabled: boolean;
    parking_alerts_enabled: boolean;
    anonymous_messages_enabled: boolean;
    qr_scans_enabled: boolean;
    security_alerts_enabled: boolean;
    email_alerts: boolean;
  };
}

export default function TelegramIntegrationPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [statusData, setStatusData] = useState<TelegramStatusResponse | null>(null);

  // Deep Link Generation State
  const [generatingLink, setGeneratingLink] = useState(false);
  const [deepLink, setDeepLink] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [linkExpiresAt, setLinkExpiresAt] = useState<string | null>(null);

  // Preference update state
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefs, setPrefs] = useState({
    telegram_enabled: true,
    parking_alerts_enabled: true,
    anonymous_messages_enabled: true,
    qr_scans_enabled: false,
    security_alerts_enabled: true,
    email_alerts: true,
  });

  // Action states
  const [sendingTest, setSendingTest] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [confirmDisconnectOpen, setConfirmDisconnectOpen] = useState(false);

  const fetchStatus = async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const res = await fetch("/api/telegram/status");
      const data = await res.json();
      if (data.success) {
        setStatusData(data);
        if (data.preferences) {
          setPrefs({
            telegram_enabled: data.preferences.telegram_enabled ?? true,
            parking_alerts_enabled: data.preferences.parking_alerts_enabled ?? true,
            anonymous_messages_enabled: data.preferences.anonymous_messages_enabled ?? true,
            qr_scans_enabled: data.preferences.qr_scans_enabled ?? false,
            security_alerts_enabled: data.preferences.security_alerts_enabled ?? true,
            email_alerts: data.preferences.email_alerts ?? true,
          });
        }
      }
    } catch (err: any) {
      if (!quiet) toast.error("Could not load Telegram status");
    } finally {
      if (!quiet) setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  // Poll for connection while deep link dialog is active
  useEffect(() => {
    if (!deepLink || statusData?.isConnected) return;
    const interval = setInterval(() => {
      fetchStatus(true);
    }, 3000);
    return () => clearInterval(interval);
  }, [deepLink, statusData?.isConnected]);

  // Generate deep-link token
  const handleGenerateLink = async () => {
    setGeneratingLink(true);
    try {
      const res = await fetch("/api/telegram/link", { method: "POST" });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to generate connection token");
      }

      setDeepLink(data.deepLink);
      setLinkExpiresAt(data.expiresAt);

      // Generate QR Code for mobile scanning
      const qrUrl = await QRCode.toDataURL(data.deepLink, {
        width: 320,
        margin: 1.5,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      });
      setQrDataUrl(qrUrl);
    } catch (err: any) {
      toast.error(err.message || "Failed to start Telegram connection");
    } finally {
      setGeneratingLink(false);
    }
  };

  // Disconnect Telegram
  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      const res = await fetch("/api/telegram/disconnect", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to disconnect Telegram");
      }
      toast.success("Telegram account disconnected successfully");
      setConfirmDisconnectOpen(false);
      setDeepLink(null);
      setQrDataUrl(null);
      await fetchStatus(true);
    } catch (err: any) {
      toast.error(err.message || "Disconnection failed");
    } finally {
      setDisconnecting(false);
    }
  };

  // Dispatch Test Notification
  const handleSendTest = async () => {
    setSendingTest(true);
    try {
      const res = await fetch("/api/telegram/test", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to deliver test notification");
      }
      toast.success("Test notification dispatched! Check your Telegram chat.");
    } catch (err: any) {
      toast.error(err.message || "Could not dispatch test message");
    } finally {
      setSendingTest(false);
    }
  };

  // Save Notification Preferences
  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPrefs(true);
    try {
      const res = await fetch("/api/telegram/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save preferences");
      }
      toast.success("Notification preferences updated");
    } catch (err: any) {
      toast.error(err.message || "Failed to update preferences");
    } finally {
      setSavingPrefs(false);
    }
  };

  const isConnected = Boolean(statusData?.isConnected);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="rounded-2xl border border-border bg-card p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-md bg-muted px-2.5 py-1 text-xs text-foreground font-mono">
            <Send className="h-3.5 w-3.5 text-sky-400" />
            <span>Official Bot API</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Telegram notification assistant
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
            Receive instant parking alerts and anonymous messages directly on your phone with 1-tap interactive responses. Your private phone number stays 100% confidential.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-border bg-muted/60 px-4 py-3 text-right">
            <div className="text-xs font-medium text-muted-foreground">Status</div>
            <div className="flex items-center gap-1.5 mt-0.5 justify-end">
              <span
                className={`h-2 w-2 rounded-full ${
                  isConnected ? "bg-emerald-500 animate-pulse" : "bg-neutral-500"
                }`}
              />
              <span className="text-sm font-mono font-bold text-foreground">
                {isConnected ? "Connected" : "Not Linked"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-44 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Column: Connection Card */}
          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6 md:p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Telegram account status
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Link your Telegram account via a secure single-use deep link.
                  </p>
                </div>
                {isConnected ? (
                  <Badge variant="success" className="text-xs font-mono">
                    Active & Listening
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs font-mono">
                    Ready to Connect
                  </Badge>
                )}
              </div>

              {isConnected ? (
                /* Connected State View */
                <div className="space-y-6">
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                        <CheckCircle2 className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-foreground">
                          {statusData?.connection?.first_name || "Telegram User"}{" "}
                          {statusData?.connection?.telegram_username && (
                            <span className="text-emerald-400 font-mono text-xs">
                              (@{statusData.connection.telegram_username})
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono mt-0.5">
                          Chat ID: {statusData?.connection?.telegram_chat_id || "Active"} · Linked on{" "}
                          {statusData?.connection?.connected_at
                            ? new Date(statusData.connection.connected_at).toLocaleDateString()
                            : "recently"}
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed pt-1 border-t border-border/40">
                      You will receive push notifications instantly whenever someone scans your QR code or submits a parking alert.
                    </p>
                  </div>

                  {/* Connected Actions */}
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <Button
                      onClick={handleSendTest}
                      isLoading={sendingTest}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                    >
                      <Send className="h-3.5 w-3.5 mr-1.5" />
                      Send test alert
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => fetchStatus()}
                      className="text-xs border-border"
                    >
                      <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                      Refresh status
                    </Button>

                    <Button
                      variant="ghost"
                      onClick={() => setConfirmDisconnectOpen(true)}
                      className="text-xs text-destructive hover:bg-destructive/10 ml-auto"
                    >
                      <Unlink className="h-3.5 w-3.5 mr-1.5" />
                      Disconnect
                    </Button>
                  </div>
                </div>
              ) : (
                /* Not Connected: Onboarding & Link Generator */
                <div className="space-y-6">
                  {!deepLink ? (
                    <div className="space-y-4">
                      <div className="rounded-xl border border-border bg-muted/40 p-5 space-y-3">
                        <div className="text-xs font-semibold text-foreground">
                          Why connect Telegram?
                        </div>
                        <ul className="text-xs text-muted-foreground space-y-2 leading-relaxed">
                          <li className="flex items-start gap-2">
                            <span className="text-emerald-400 font-bold mt-0.5">✓</span>
                            <span><strong>Zero delay:</strong> Get alerts on your lock screen before someone calls a towing truck.</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-emerald-400 font-bold mt-0.5">✓</span>
                            <span><strong>1-tap responses:</strong> Tap <em>&ldquo;I&apos;m coming&rdquo;</em> or <em>&ldquo;Need 5 min&rdquo;</em> directly inside Telegram.</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-emerald-400 font-bold mt-0.5">✓</span>
                            <span><strong>Privacy guaranteed:</strong> Passersby never get your phone number.</span>
                          </li>
                        </ul>
                      </div>

                      <Button
                        onClick={handleGenerateLink}
                        isLoading={generatingLink}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium h-11"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Connect Telegram bot
                      </Button>
                    </div>
                  ) : (
                    /* Deep Link Ready: QR & Direct Button */
                    <div className="space-y-6">
                      <div className="rounded-xl border border-sky-500/30 bg-sky-500/5 p-5 space-y-4">
                        <div className="flex items-center gap-2 text-sky-400 text-xs font-semibold font-mono">
                          <Clock className="h-3.5 w-3.5" />
                          <span>Single-use link generated (valid for 15 min)</span>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-6">
                          {qrDataUrl && (
                            <div className="p-3 bg-white rounded-xl shadow-lg shrink-0">
                              <img
                                src={qrDataUrl}
                                alt="Telegram Connect QR"
                                className="w-36 h-36 rounded-lg"
                              />
                            </div>
                          )}

                          <div className="space-y-3 flex-1 text-center sm:text-left">
                            <div className="text-sm font-semibold text-foreground">
                              Scan with your camera or tap below:
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              Open the link on your phone. When Telegram opens, tap <strong>START</strong> at the bottom of the chat.
                            </p>

                            <a
                              href={deepLink}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md transition-colors duration-150"
                            >
                              <Send className="h-4 w-4" />
                              <span>Open in Telegram (@{statusData?.botUsername || "ParkLinkAlertBot"})</span>
                              <ExternalLink className="h-3.5 w-3.5 opacity-70" />
                            </a>
                          </div>
                        </div>

                        <div className="text-[11px] text-muted-foreground flex items-center justify-between border-t border-border/40 pt-3">
                          <span className="flex items-center gap-1.5 font-mono">
                            <span className="h-2 w-2 rounded-full bg-sky-400 animate-ping" />
                            Listening for incoming connection…
                          </span>
                          <button
                            type="button"
                            onClick={() => fetchStatus()}
                            className="text-foreground hover:underline"
                          >
                            Check status
                          </button>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        onClick={handleGenerateLink}
                        isLoading={generatingLink}
                        className="text-xs border-border"
                      >
                        <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                        Generate new link
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Notification Preferences Form */}
            <form
              onSubmit={handleSavePreferences}
              className="rounded-2xl border border-border bg-card p-6 md:p-8 space-y-6"
            >
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Telegram notification channels
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Select which alerts dispatch to your Telegram chat in real time.
                </p>
              </div>

              <div className="space-y-4">
                {/* Master Telegram Toggle */}
                <label className="flex items-start justify-between gap-4 p-3.5 rounded-xl border border-border bg-muted/40 cursor-pointer hover:bg-muted/70 transition-colors duration-150">
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Send className="h-3.5 w-3.5 text-sky-400" />
                      <span>Enable Telegram notifications</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      Master toggle for all Telegram message deliveries.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={prefs.telegram_enabled}
                    onChange={(e) => setPrefs({ ...prefs, telegram_enabled: e.target.checked })}
                    className="h-4 w-4 rounded border-border accent-emerald-600 mt-1"
                  />
                </label>

                {/* Urgent Parking Alerts */}
                <label className="flex items-start justify-between gap-4 p-3.5 rounded-xl border border-border bg-muted/20 cursor-pointer hover:bg-muted/50 transition-colors duration-150">
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Car className="h-3.5 w-3.5 text-amber-500" />
                      <span>Urgent parking alerts (Blocking / Tow risk)</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      Dispatched when a passerby reports your vehicle blocking another car or lights left on. Includes interactive response buttons.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={prefs.parking_alerts_enabled}
                    onChange={(e) => setPrefs({ ...prefs, parking_alerts_enabled: e.target.checked })}
                    disabled={!prefs.telegram_enabled}
                    className="h-4 w-4 rounded border-border accent-emerald-600 mt-1 disabled:opacity-50"
                  />
                </label>

                {/* Anonymous Messages */}
                <label className="flex items-start justify-between gap-4 p-3.5 rounded-xl border border-border bg-muted/20 cursor-pointer hover:bg-muted/50 transition-colors duration-150">
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Anonymous message relay</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      Receive notes left by visitors without exposing phone numbers.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={prefs.anonymous_messages_enabled}
                    onChange={(e) => setPrefs({ ...prefs, anonymous_messages_enabled: e.target.checked })}
                    disabled={!prefs.telegram_enabled}
                    className="h-4 w-4 rounded border-border accent-emerald-600 mt-1 disabled:opacity-50"
                  />
                </label>

                {/* Instant Scan Alerts */}
                <label className="flex items-start justify-between gap-4 p-3.5 rounded-xl border border-border bg-muted/20 cursor-pointer hover:bg-muted/50 transition-colors duration-150">
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <QrIcon className="h-3.5 w-3.5 text-neutral-400" />
                      <span>Instant QR scan alerts</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      Notify immediately when someone scans your vehicle QR sticker.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={prefs.qr_scans_enabled}
                    onChange={(e) => setPrefs({ ...prefs, qr_scans_enabled: e.target.checked })}
                    disabled={!prefs.telegram_enabled}
                    className="h-4 w-4 rounded border-border accent-emerald-600 mt-1 disabled:opacity-50"
                  />
                </label>

                {/* Security Alerts */}
                <label className="flex items-start justify-between gap-4 p-3.5 rounded-xl border border-border bg-muted/20 cursor-pointer hover:bg-muted/50 transition-colors duration-150">
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <ShieldAlert className="h-3.5 w-3.5 text-destructive" />
                      <span>Security & suspicious activity alerts</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      Immediate warnings if token compromise or rapid suspicious scanning is detected.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={prefs.security_alerts_enabled}
                    onChange={(e) => setPrefs({ ...prefs, security_alerts_enabled: e.target.checked })}
                    disabled={!prefs.telegram_enabled}
                    className="h-4 w-4 rounded border-border accent-emerald-600 mt-1 disabled:opacity-50"
                  />
                </label>

                {/* Email Fallback */}
                <label className="flex items-start justify-between gap-4 p-3.5 rounded-xl border border-border bg-muted/20 cursor-pointer hover:bg-muted/50 transition-colors duration-150">
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Bell className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Email delivery fallback</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      Keep email delivery active if Telegram is unreachable or disabled.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={prefs.email_alerts}
                    onChange={(e) => setPrefs({ ...prefs, email_alerts: e.target.checked })}
                    className="h-4 w-4 rounded border-border accent-emerald-600 mt-1"
                  />
                </label>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-muted-foreground font-mono">
                  Preferences sync across all linked vehicles
                </span>
                <Button
                  type="submit"
                  isLoading={savingPrefs}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium"
                >
                  <Check className="h-3.5 w-3.5 mr-1.5" />
                  Save preferences
                </Button>
              </div>
            </form>
          </div>

          {/* Right Column: Interactive Bot Preview & Bot Guidance */}
          <div className="lg:col-span-5 space-y-6">
            {/* Live Interactive Telegram Simulator Card */}
            <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-md bg-sky-500/10 text-sky-400">
                  <Sparkles className="h-4 w-4" />
                </span>
                <h3 className="text-sm font-semibold text-foreground">
                  Interactive Telegram preview
                </h3>
              </div>
              <p className="text-xs text-muted-foreground">
                Here is what an alert message looks like inside your Telegram chat:
              </p>

              {/* Mock Telegram Bubble */}
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-slate-100 space-y-3 font-sans shadow-md">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px]">
                      P
                    </div>
                    <span className="text-xs font-semibold text-slate-200">
                      ParkLink Bot
                    </span>
                    <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-slate-700 text-slate-400">
                      bot
                    </Badge>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">14:32</span>
                </div>

                <div className="text-xs space-y-1.5 text-slate-200">
                  <div className="text-amber-400 font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span>PARKING ALERT: Action Required</span>
                  </div>
                  <div>
                    <strong>Vehicle:</strong> <span className="font-mono bg-slate-800 px-1.5 py-0.5 rounded text-white">DL 123 456 678</span>
                  </div>
                  <div>
                    <strong>Model:</strong> Pulsar NS (Red &amp; Black)
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Car className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                    <span>Vehicle is blocking another vehicle</span>
                  </div>
                  <div className="text-slate-400 italic text-[11px] pt-1">
                    &ldquo;Need to leave urgent, please clear bay B2&rdquo;
                  </div>
                  <div className="text-[11px] text-slate-400 pt-1 flex items-center gap-1.5 font-mono">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                    <span>Status: Pending action</span>
                  </div>
                </div>

                {/* Simulated Telegram Inline Keyboard */}
                <div className="pt-2 space-y-1.5">
                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-medium py-1.5 text-center cursor-default transition-colors flex items-center justify-center gap-1">
                      <Car className="h-3 w-3 text-sky-400" />
                      <span>I&apos;m coming</span>
                    </div>
                    <div className="rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-medium py-1.5 text-center cursor-default transition-colors flex items-center justify-center gap-1">
                      <Clock className="h-3 w-3 text-amber-400" />
                      <span>Need 5 min</span>
                    </div>
                  </div>
                  <div className="rounded-lg bg-emerald-700/60 hover:bg-emerald-700 text-white text-[11px] font-medium py-1.5 text-center cursor-default transition-colors flex items-center justify-center gap-1">
                    <Check className="h-3 w-3 text-emerald-300" />
                    <span>Vehicle moved</span>
                  </div>
                  <div className="rounded-lg bg-slate-950 border border-slate-800 text-slate-300 text-[11px] py-1 text-center font-mono flex items-center justify-center gap-1">
                    <Globe className="h-3 w-3 text-slate-400" />
                    <span>Open ParkLink Dashboard</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Privacy & Architecture Note */}
            <div className="rounded-2xl border border-border bg-card p-6 space-y-3">
              <div className="flex items-center gap-2 text-foreground font-semibold text-xs">
                <Info className="h-4 w-4 text-emerald-400" />
                <span>Zero phone number disclosure</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                When you interact with the Telegram bot, callbacks are processed securely through ParkLink webhooks. Passersby who scan your vehicle QR code can never discover your real identity, chat ID, or telephone number.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Disconnecting */}
      <Dialog open={confirmDisconnectOpen} onOpenChange={setConfirmDisconnectOpen}>
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-destructive/10 text-destructive">
              <AlertTriangle className="h-4 w-4" />
            </span>
            <DialogTitle>Disconnect Telegram?</DialogTitle>
          </div>
          <DialogDescription className="text-xs leading-relaxed">
            You will stop receiving parking alerts and anonymous messages on Telegram. You can reconnect anytime by generating a new linking token.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-0 mt-4">
          <Button
            variant="outline"
            onClick={() => setConfirmDisconnectOpen(false)}
            disabled={disconnecting}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDisconnect}
            isLoading={disconnecting}
            className="text-xs"
          >
            Disconnect Telegram
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
