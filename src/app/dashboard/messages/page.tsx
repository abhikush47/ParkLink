"use client";

import React, { useEffect, useState } from "react";
import {
  MessageSquare,
  Send,
  Car,
  ShieldCheck,
  Check,
  Lock,
  Clock,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { formatTimeAgo } from "@/lib/utils";
import type { AnonymousMessage, Vehicle } from "@/types/database";

export default function MessagesRelayPage() {
  const toast = useToast();
  const [messages, setMessages] = useState<AnonymousMessage[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({});
  const [sendingReply, setSendingReply] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let msgChannel: any = null;
    let pollInterval: any = null;

    async function loadMessages() {
      try {
        setLoading(true);
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data: vData } = await supabase
            .from("vehicles")
            .select("*")
            .eq("owner_id", user.id);

          if (isMounted && vData) {
            setVehicles(vData);
            const vehicleIds = vData.map((v) => v.id);

            if (vehicleIds.length > 0) {
              const { data: mData } = await supabase
                .from("anonymous_messages")
                .select("*, vehicle:vehicles(*)")
                .in("vehicle_id", vehicleIds)
                .order("created_at", { ascending: false });

              if (isMounted && mData) {
                setMessages(mData as any);
              }

              // Realtime messages subscription
              msgChannel = supabase
                .channel("realtime-anonymous-messages")
                .on(
                  "postgres_changes",
                  {
                    event: "*",
                    schema: "public",
                    table: "anonymous_messages",
                  },
                  async (payload) => {
                    if (payload.eventType === "INSERT") {
                      const newMsg = payload.new as AnonymousMessage;
                      const matchV = vData.find((v) => v.id === newMsg.vehicle_id);
                      if (matchV) {
                        const fullMsg = { ...newMsg, vehicle: matchV };
                        setMessages((prev) => [fullMsg as any, ...prev.filter((m) => m.id !== fullMsg.id)]);
                        toast.info(`New message regarding ${matchV.registration_number}`);
                      }
                    } else if (payload.eventType === "UPDATE") {
                      const updated = payload.new as AnonymousMessage;
                      setMessages((prev) =>
                        prev.map((m) =>
                          m.id === updated.id
                            ? { ...m, ...updated, vehicle: m.vehicle }
                            : m
                        )
                      );
                    }
                  }
                )
                .subscribe();

              // Resilient 5s poll
              pollInterval = setInterval(async () => {
                if (!isMounted) return;
                const { data: freshMsgs } = await supabase
                  .from("anonymous_messages")
                  .select("*, vehicle:vehicles(*)")
                  .in("vehicle_id", vehicleIds)
                  .order("created_at", { ascending: false });

                if (isMounted && freshMsgs) {
                  setMessages((prev) => {
                    const isDiff =
                      freshMsgs.length !== prev.length ||
                      freshMsgs.some((fm, i) => fm.id !== prev[i]?.id || fm.status !== prev[i]?.status);
                    return isDiff ? (freshMsgs as any) : prev;
                  });
                }
              }, 5000);
            }
          }
        }
      } catch (err) {
        console.error("Messages load error", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadMessages();
    return () => {
      isMounted = false;
      if (msgChannel) {
        const supabase = createClient();
        supabase.removeChannel(msgChannel);
      }
      if (pollInterval) clearInterval(pollInterval);
    };
  }, []);

  const handleSendReply = async (msgId: string) => {
    const text = replyTextMap[msgId]?.trim();
    if (!text) return;

    setSendingReply(msgId);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("anonymous_messages")
        .update({
          owner_reply: text,
          status: "replied",
          replied_at: new Date().toISOString(),
        })
        .eq("id", msgId);

      if (error) throw error;

      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId
            ? { ...m, owner_reply: text, status: "replied", replied_at: new Date().toISOString() }
            : m
        )
      );

      setReplyTextMap((prev) => ({ ...prev, [msgId]: "" }));
      toast.success("Relay reply saved");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit reply");
    } finally {
      setSendingReply(null);
    }
  };

  const repliedCount = messages.filter((m) => m.status === "replied").length;
  const pendingCount = messages.filter((m) => m.status !== "replied").length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="rounded-2xl border border-border bg-card p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-md bg-muted px-2.5 py-1 text-xs text-foreground font-mono">
            <Lock className="h-3.5 w-3.5 text-emerald-600" />
            <span>Encrypted two-way relay</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Anonymous contact relay
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
            Communicate safely with drivers and visitors who scanned your vehicle pass. Personal phone numbers remain concealed on both sides.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-border bg-muted/60 px-4 py-3">
            <div className="text-xs font-medium text-muted-foreground">
              Unanswered
            </div>
            <div className="text-xl font-mono font-bold text-foreground">
              {pendingCount}
            </div>
          </div>
          <div className="rounded-xl border border-border bg-muted/60 px-4 py-3">
            <div className="text-xs font-medium text-muted-foreground">
              Replied
            </div>
            <div className="text-xl font-mono font-bold text-emerald-600 dark:text-emerald-400">
              {repliedCount}
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      ) : messages.length === 0 ? (
        <div className="bg-card border border-border border-dashed rounded-xl p-16 text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <MessageSquare className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-foreground">No relay messages yet</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
            When a visitor leaves an anonymous note via your public vehicle pass, the conversation thread appears here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className="rounded-xl border border-border bg-card p-5 space-y-4"
            >
              {/* Card Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center font-mono text-xs text-emerald-600">
                    <Car className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-foreground">
                        {msg.vehicle?.registration_number}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        / {msg.vehicle?.brand} {msg.vehicle?.model}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-mono">
                      <Clock className="h-3 w-3" />
                      <span>{formatTimeAgo(msg.created_at)}</span>
                    </div>
                  </div>
                </div>

                <Badge
                  variant={msg.status === "replied" ? "success" : "secondary"}
                  className="text-[10px] font-mono capitalize"
                >
                  {msg.status}
                </Badge>
              </div>

              {/* Visitor Message Bubble */}
              <div className="rounded-lg border border-border bg-muted p-3.5 space-y-1">
                <div className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Visitor note</span>
                </div>
                <p className="text-xs text-foreground leading-relaxed">
                  {msg.message}
                </p>
              </div>

              {/* Owner Reply */}
              {msg.owner_reply && (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3.5 space-y-1 ml-4 md:ml-6">
                  <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5" />
                    <span>Your response</span>
                  </div>
                  <p className="text-xs text-foreground leading-relaxed">
                    {msg.owner_reply}
                  </p>
                  {msg.replied_at && (
                    <div className="text-[10px] text-muted-foreground font-mono">
                      Sent {formatTimeAgo(msg.replied_at)}
                    </div>
                  )}
                </div>
              )}

              {/* Input if not replied yet */}
              {!msg.owner_reply && (
                <div className="pt-1 flex flex-col sm:flex-row items-stretch gap-2">
                  <input
                    type="text"
                    maxLength={1000}
                    placeholder="Type an anonymous response (e.g. 'Coming down to move it in 2 minutes')..."
                    value={replyTextMap[msg.id] || ""}
                    onChange={(e) =>
                      setReplyTextMap({ ...replyTextMap, [msg.id]: e.target.value })
                    }
                    className="flex-1 bg-muted border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
                  />
                  <Button
                    size="sm"
                    onClick={() => handleSendReply(msg.id)}
                    isLoading={sendingReply === msg.id}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 px-4 shrink-0"
                  >
                    <Send className="mr-1.5 h-3.5 w-3.5" /> Send reply
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
