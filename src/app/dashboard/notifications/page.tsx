"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCheck,
  AlertTriangle,
  MessageSquare,
  QrCode,
  ShieldAlert,
  Car,
  Clock,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  Radio,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { formatTimeAgo } from "@/lib/utils";
import type { Notification, NotificationType } from "@/types/database";

export default function NotificationsPage() {
  const toast = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    let isMounted = true;
    const supabase = createClient();

    async function loadNotifications() {
      try {
        setLoading(true);
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data } = await supabase
            .from("notifications")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

          if (isMounted && data) {
            setNotifications(data);
          }

          // Setup Realtime subscription for incoming notifications!
          const channel = supabase
            .channel(`user-notifications-${user.id}`)
            .on(
              "postgres_changes",
              {
                event: "INSERT",
                schema: "public",
                table: "notifications",
                filter: `user_id=eq.${user.id}`,
              },
              (payload) => {
                const newNotif = payload.new as Notification;
                setNotifications((prev) => [newNotif, ...prev]);
                toast.info(newNotif.title, "New Notification");
              }
            )
            .subscribe();

          return () => {
            supabase.removeChannel(channel);
          };
        }
      } catch (err) {
        console.error("Notifications fetch error", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadNotifications();
    return () => {
      isMounted = false;
    };
  }, [toast]);

  const markAllAsRead = async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await supabase
          .from("notifications")
          .update({ is_read: true })
          .eq("user_id", user.id)
          .eq("is_read", false);

        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        toast.success("All notifications marked as read");
      }
    } catch {
      toast.error("Failed to mark all as read");
    }
  };

  const markSingleAsRead = async (id: string) => {
    try {
      const supabase = createClient();
      await supabase.from("notifications").update({ is_read: true }).eq("id", id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch {
      // silently handle
    }
  };

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case "parking_alert":
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case "anonymous_message":
        return <MessageSquare className="h-5 w-5 text-sky-400" />;
      case "qr_scanned":
        return <QrCode className="h-5 w-5 text-emerald-400" />;
      case "qr_reported":
        return <ShieldAlert className="h-5 w-5 text-rose-500" />;
      case "security":
        return <ShieldAlert className="h-5 w-5 text-purple-400" />;
      default:
        return <Bell className="h-5 w-5 text-emerald-400" />;
    }
  };

  const filtered = notifications.filter((n) => {
    if (filter === "unread") return !n.is_read;
    if (filter === "parking_alert") return n.type === "parking_alert";
    if (filter === "anonymous_message") return n.type === "anonymous_message";
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/30 via-card to-card p-6 md:p-8 backdrop-blur-xl">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
              <Radio className="h-3.5 w-3.5 animate-pulse" />
              <span>Realtime Websocket Broadcast Feed</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Notification Centre
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
              Live notifications for dynamic QR scans, emergency parking alerts, and masked relay chats sent to your registered fleet.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              className="text-xs h-10 px-4 rounded-xl border-border/80 font-medium hover:bg-muted"
            >
              <CheckCheck className="mr-1.5 h-4 w-4 text-emerald-400" /> Mark All as Read
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-3 text-xs overflow-x-auto">
        <button
          onClick={() => setFilter("all")}
          className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap ${
            filter === "all"
              ? "bg-foreground text-background shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          All Notifications ({notifications.length})
        </button>
        <button
          onClick={() => setFilter("unread")}
          className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            filter === "unread"
              ? "bg-foreground text-background shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <span>Unread</span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.2 bg-emerald-500 text-slate-950 rounded-full text-[10px] font-bold">
              {unreadCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setFilter("parking_alert")}
          className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap ${
            filter === "parking_alert"
              ? "bg-foreground text-background shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          Parking Alerts
        </button>
      </div>

      {/* Notification list */}
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 rounded-3xl" />
          <Skeleton className="h-24 rounded-3xl" />
          <Skeleton className="h-24 rounded-3xl" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-border border-dashed rounded-3xl p-16 text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <Bell className="h-8 w-8" />
          </div>
          <h3 className="text-base font-bold text-foreground">You are all caught up!</h3>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
            New parking alerts and QR interactions will appear here instantly via Supabase Realtime.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => markSingleAsRead(item.id)}
              className={`p-5 rounded-3xl border transition-all flex items-start justify-between gap-4 cursor-pointer backdrop-blur-xl ${
                !item.is_read
                  ? "bg-emerald-950/10 border-emerald-500/40 shadow-md ring-1 ring-emerald-500/20"
                  : "bg-card border-border/80 hover:bg-muted/30"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-muted/60 border border-border shrink-0 mt-0.5">
                  {getIcon(item.type)}
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-foreground">{item.title}</h3>
                    {!item.is_read && (
                      <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">{item.message}</p>
                  <div className="text-[10px] text-muted-foreground font-mono flex items-center gap-1.5 pt-1">
                    <Clock className="h-3 w-3" />
                    <span>{formatTimeAgo(item.created_at)}</span>
                  </div>
                </div>
              </div>

              {item.link && (
                <Link href={item.link}>
                  <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-muted-foreground hover:text-foreground rounded-xl shrink-0">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

