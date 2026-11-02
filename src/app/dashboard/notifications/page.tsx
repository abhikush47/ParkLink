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
        return <MessageSquare className="h-5 w-5 text-sky-500" />;
      case "qr_scanned":
        return <QrCode className="h-5 w-5 text-emerald-600" />;
      case "qr_reported":
        return <ShieldAlert className="h-5 w-5 text-rose-500" />;
      case "security":
        return <ShieldAlert className="h-5 w-5 text-purple-500" />;
      default:
        return <Bell className="h-5 w-5 text-emerald-600" />;
    }
  };

  const filtered = notifications.filter((n) => {
    if (filter === "unread") return !n.is_read;
    if (filter === "parking_alert") return n.type === "parking_alert";
    if (filter === "anonymous_message") return n.type === "anonymous_message";
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Notification Centre
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Realtime alerts, messages, and QR interactions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={markAllAsRead}
            disabled={notifications.filter((n) => !n.is_read).length === 0}
            className="text-xs h-9"
          >
            <CheckCheck className="mr-1.5 h-4 w-4" /> Mark All as Read
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-2 text-xs">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
            filter === "all"
              ? "bg-emerald-600 text-white"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter("unread")}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
            filter === "unread"
              ? "bg-emerald-600 text-white"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          Unread ({notifications.filter((n) => !n.is_read).length})
        </button>
        <button
          onClick={() => setFilter("parking_alert")}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
            filter === "parking_alert"
              ? "bg-emerald-600 text-white"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          Parking Alerts
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
        <div className="bg-card border border-border border-dashed rounded-2xl p-12 text-center space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-muted-foreground">
            <Bell className="h-7 w-7" />
          </div>
          <h3 className="text-base font-bold text-foreground">No notifications to display</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            You are all caught up! New alerts and interactions will appear here instantly.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => markSingleAsRead(item.id)}
              className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 cursor-pointer ${
                !item.is_read
                  ? "bg-card border-emerald-500/40 shadow-sm ring-1 ring-emerald-500/20"
                  : "bg-card border-border hover:bg-muted/30"
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0 mt-0.5">
                  {getIcon(item.type)}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-foreground">{item.title}</h3>
                    {!item.is_read && (
                      <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.message}</p>
                  <div className="text-[10px] text-muted-foreground flex items-center gap-1 pt-1">
                    <Clock className="h-3 w-3" />
                    <span>{formatTimeAgo(item.created_at)}</span>
                  </div>
                </div>
              </div>

              {item.link && (
                <Link href={item.link}>
                  <Button variant="ghost" size="sm" className="h-8 text-xs shrink-0">
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
