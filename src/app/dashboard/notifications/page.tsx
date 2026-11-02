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
  Clock,
  ExternalLink,
  Radio,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
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

          // Setup Realtime subscription
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
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case "anonymous_message":
        return <MessageSquare className="h-4 w-4 text-sky-500" />;
      case "qr_scanned":
        return <QrCode className="h-4 w-4 text-emerald-600" />;
      case "qr_reported":
        return <ShieldAlert className="h-4 w-4 text-destructive" />;
      case "security":
        return <ShieldAlert className="h-4 w-4 text-destructive" />;
      default:
        return <Bell className="h-4 w-4 text-emerald-600" />;
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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="rounded-2xl border border-border bg-card p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-md bg-muted px-2.5 py-1 text-xs text-foreground font-mono">
            <Radio className="h-3.5 w-3.5 text-emerald-600" />
            <span>Realtime broadcast</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Notification centre
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
            Live alerts for dynamic QR scans, parking requests, and masked relay chats sent to your registered vehicles.
          </p>
        </div>

        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
            className="text-xs h-9 px-3.5 font-medium"
          >
            <CheckCheck className="mr-1.5 h-4 w-4 text-emerald-600" /> Mark all read
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border pb-2 text-xs">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors duration-150 ${
            filter === "all"
              ? "bg-muted text-foreground font-semibold"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter("unread")}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors duration-150 flex items-center gap-1.5 ${
            filter === "unread"
              ? "bg-muted text-foreground font-semibold"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <span>Unread</span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.2 bg-emerald-600 text-white rounded font-mono text-[10px]">
              {unreadCount}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setFilter("parking_alert")}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors duration-150 ${
            filter === "parking_alert"
              ? "bg-muted text-foreground font-semibold"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          Parking alerts
        </button>
      </div>

      {/* Notification list */}
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-border border-dashed rounded-xl p-16 text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <Bell className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-foreground">You are all caught up</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
            New parking alerts and QR interactions will appear here instantly.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => markSingleAsRead(item.id)}
              className={`p-4 rounded-xl border transition-colors duration-150 flex items-start justify-between gap-4 cursor-pointer ${
                !item.is_read
                  ? "bg-emerald-500/5 border-emerald-600/40"
                  : "bg-card border-border hover:bg-muted/30"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-muted border border-border shrink-0 mt-0.5">
                  {getIcon(item.type)}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-semibold text-foreground">{item.title}</h3>
                    {!item.is_read && (
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">{item.message}</p>
                  <div className="text-[10px] text-muted-foreground font-mono flex items-center gap-1 pt-0.5">
                    <Clock className="h-3 w-3" />
                    <span>{formatTimeAgo(item.created_at)}</span>
                  </div>
                </div>
              </div>

              {item.link && (
                <Link href={item.link}>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground rounded shrink-0">
                    <ExternalLink className="h-3.5 w-3.5" />
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
