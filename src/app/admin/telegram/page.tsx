"use client";

import React, { useEffect, useState } from "react";
import {
  Send,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Users,
  BarChart3,
  Activity,
  ShieldAlert,
  Clock,
  ExternalLink,
  Copy,
  Check,
  Radio,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { formatTimeAgo } from "@/lib/utils";

interface TelegramAdminStats {
  success: boolean;
  bot: {
    username: string;
    isConfigured: boolean;
    webhookUrl: string;
  };
  stats: {
    totalConnected: number;
    totalDeliveries: number;
    deliveredCount: number;
    failedCount: number;
    skippedCount: number;
    successRate: number;
  };
  connections: Array<{
    id: string;
    user_id: string;
    telegram_username?: string | null;
    telegram_chat_id: string;
    first_name?: string | null;
    connected_at: string;
    status: string;
    profile?: {
      id: string;
      full_name: string;
      phone_number?: string | null;
    };
  }>;
  recentLogs: Array<{
    id: string;
    user_id: string;
    channel: string;
    event_type: string;
    delivery_status: string;
    error_message?: string | null;
    created_at: string;
    metadata?: any;
    profile?: {
      id: string;
      full_name: string;
    };
  }>;
}

export default function AdminTelegramPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<TelegramAdminStats | null>(null);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/telegram/stats");
      const json = await res.json();
      if (json.success) {
        setData(json);
      } else {
        toast.error(json.error || "Failed to load Telegram telemetry");
      }
    } catch {
      toast.error("Could not fetch admin Telegram telemetry");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const copyWebhookUrl = () => {
    if (!data?.bot?.webhookUrl) return;
    navigator.clipboard.writeText(data.bot.webhookUrl);
    setCopiedWebhook(true);
    toast.success("Webhook URL copied to clipboard");
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-md bg-slate-800 px-2.5 py-1 text-xs text-sky-400 font-mono">
            <Send className="h-3.5 w-3.5" />
            <span>Telegram Bot Telemetry</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Telegram gateway monitoring
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
            Monitor real-time Telegram Bot API connections, outbound parking alert dispatch delivery rates, and webhook operations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStats}
            className="text-xs border-slate-700 hover:bg-slate-800"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Refresh telemetry
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Skeleton className="h-28 rounded-xl bg-slate-800" />
            <Skeleton className="h-28 rounded-xl bg-slate-800" />
            <Skeleton className="h-28 rounded-xl bg-slate-800" />
            <Skeleton className="h-28 rounded-xl bg-slate-800" />
          </div>
          <Skeleton className="h-64 rounded-xl bg-slate-800" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Connected Users</span>
                <Users className="h-4 w-4 text-sky-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-white">
                {data?.stats?.totalConnected || 0}
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                Active owner links
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Total Dispatched</span>
                <Send className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-white">
                {data?.stats?.totalDeliveries || 0}
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                Outbound alerts &amp; notes
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Delivery Success Rate</span>
                <Activity className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-400">
                {data?.stats?.successRate || 100}%
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                {data?.stats?.deliveredCount || 0} delivered / {data?.stats?.failedCount || 0} failed
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Bot Status</span>
                <Radio className="h-4 w-4 text-sky-400 animate-pulse" />
              </div>
              <div className="text-base font-bold font-mono text-white truncate">
                @{data?.bot?.username || "ParkLinkAlertBot"}
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                {data?.bot?.isConfigured ? (
                  <span className="text-emerald-400">Live Bot Token Active</span>
                ) : (
                  <span className="text-amber-400">Simulated / Ready for Token</span>
                )}
              </div>
            </div>
          </div>

          {/* Webhook & Setup Diagnostics */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Telegram Bot API Webhook Configuration
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  The endpoint configured to receive incoming user interactions, start links, and button clicks.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <code className="text-xs bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-sky-300 font-mono select-all">
                  {data?.bot?.webhookUrl}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={copyWebhookUrl}
                  className="h-8 px-2.5 text-xs border-slate-700"
                >
                  {copiedWebhook ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Outbound Delivery Logs Table */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Recent Notification Delivery Logs
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Audit trail of real-time outbound alerts and responses.
                </p>
              </div>
              <Badge variant="outline" className="text-xs font-mono border-slate-700 text-slate-400">
                Latest 50 events
              </Badge>
            </div>

            {data?.recentLogs && data.recentLogs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-800 text-slate-400 font-mono text-xs">
                    <tr>
                      <th className="pb-3 font-medium">Timestamp</th>
                      <th className="pb-3 font-medium">Recipient</th>
                      <th className="pb-3 font-medium">Channel</th>
                      <th className="pb-3 font-medium">Event Type</th>
                      <th className="pb-3 font-medium">Delivery Status</th>
                      <th className="pb-3 font-medium">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {data.recentLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-800/20 transition-colors">
                        <td className="py-3 text-slate-400 whitespace-nowrap">
                          {formatTimeAgo(log.created_at)}
                        </td>
                        <td className="py-3 text-white font-medium">
                          {log.profile?.full_name || log.user_id.slice(0, 8)}
                        </td>
                        <td className="py-3 text-sky-400 capitalize">
                          {log.channel}
                        </td>
                        <td className="py-3 text-slate-300 capitalize">
                          {log.event_type.replace(/_/g, " ")}
                        </td>
                        <td className="py-3">
                          <Badge
                            variant={
                              log.delivery_status === "delivered"
                                ? "success"
                                : log.delivery_status === "failed"
                                ? "destructive"
                                : "secondary"
                            }
                            className="text-xs font-mono"
                          >
                            {log.delivery_status}
                          </Badge>
                        </td>
                        <td className="py-3 text-slate-400 text-[11px] truncate max-w-xs">
                          {log.error_message || (log.metadata ? JSON.stringify(log.metadata) : "Delivered successfully")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-500 font-mono">
                No delivery logs recorded yet. Once users connect Telegram and alerts are sent, delivery history will appear here.
              </div>
            )}
          </div>

          {/* Connected Accounts Table */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Connected Telegram Accounts
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Registered ParkLink owners linked to Telegram chat IDs.
                </p>
              </div>
              <Badge variant="outline" className="text-xs font-mono border-slate-700 text-slate-400">
                {data?.connections?.length || 0} accounts
              </Badge>
            </div>

            {data?.connections && data.connections.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-800 text-slate-400 font-mono text-xs">
                    <tr>
                      <th className="pb-3 font-medium">Owner Name</th>
                      <th className="pb-3 font-medium">Telegram Username</th>
                      <th className="pb-3 font-medium">Chat ID</th>
                      <th className="pb-3 font-medium">Linked Since</th>
                      <th className="pb-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {data.connections.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-800/20 transition-colors">
                        <td className="py-3 text-white font-medium">
                          {c.profile?.full_name || "Owner"}
                        </td>
                        <td className="py-3 text-sky-400">
                          {c.telegram_username ? `@${c.telegram_username}` : c.first_name || "N/A"}
                        </td>
                        <td className="py-3 text-slate-400">
                          {c.telegram_chat_id ? `${c.telegram_chat_id.slice(0, 3)}••••${c.telegram_chat_id.slice(-2)}` : "—"}
                        </td>
                        <td className="py-3 text-slate-400 whitespace-nowrap">
                          {new Date(c.connected_at).toLocaleDateString()}
                        </td>
                        <td className="py-3">
                          <Badge variant="success" className="text-xs font-mono">
                            {c.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-500 font-mono">
                No Telegram accounts connected yet.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
