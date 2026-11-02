"use client";

import React, { useEffect, useState } from "react";
import {
  MessageSquare,
  Send,
  CheckCircle2,
  Car,
  ShieldCheck,
  Flag,
  Check,
  Sparkles,
  Lock,
  Clock,
  User,
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
      toast.success("Relay reply saved.");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit reply");
    } finally {
      setSendingReply(null);
    }
  };

  const repliedCount = messages.filter((m) => m.status === "replied").length;
  const pendingCount = messages.filter((m) => m.status !== "replied").length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-sky-500/20 bg-gradient-to-br from-sky-950/30 via-card to-card p-6 md:p-8 backdrop-blur-xl">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-400">
              <Lock className="h-3.5 w-3.5" />
              <span>Masked Identity Two-Way Relay</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Anonymous Contact Relay
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
              Communicate safely with drivers and visitors who scanned your vehicle pass. Personal phone numbers and addresses remain completely concealed on both sides.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-border bg-card/60 px-4 py-3 backdrop-blur-md">
              <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Unanswered
              </div>
              <div className="text-xl font-mono font-bold text-sky-400">
                {pendingCount}
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-card/60 px-4 py-3 backdrop-blur-md">
              <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Replied
              </div>
              <div className="text-xl font-mono font-bold text-emerald-400">
                {repliedCount}
              </div>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-36 rounded-3xl" />
          <Skeleton className="h-36 rounded-3xl" />
        </div>
      ) : messages.length === 0 ? (
        <div className="bg-card border border-border border-dashed rounded-3xl p-16 text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <MessageSquare className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-foreground">No relay messages yet</h3>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            When a visitor leaves an anonymous note via your public vehicle pass, the masked conversation thread appears here.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm space-y-5 backdrop-blur-xl"
            >
              {/* Card Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border/60">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-slate-900 border border-slate-700/80 flex items-center justify-center font-bold text-xs font-mono text-emerald-400">
                    <Car className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-extrabold text-sm text-foreground">
                        {msg.vehicle?.registration_number}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        • {msg.vehicle?.brand} {msg.vehicle?.model}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                      <Clock className="h-3 w-3" />
                      <span>Received {formatTimeAgo(msg.created_at)}</span>
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
              <div className="relative rounded-2xl border border-border/80 bg-muted/40 p-4 space-y-1.5">
                <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-sky-400" />
                  <span>Public Scanner Note (Encrypted Relay)</span>
                </div>
                <p className="text-sm text-foreground leading-relaxed">
                  {msg.message}
                </p>
              </div>

              {/* Owner Reply */}
              {msg.owner_reply && (
                <div className="relative rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4 space-y-1.5 ml-4 md:ml-8">
                  <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Your Response to Visitor</span>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">
                    {msg.owner_reply}
                  </p>
                  {msg.replied_at && (
                    <div className="text-[10px] text-emerald-400/80 font-mono">
                      Sent {formatTimeAgo(msg.replied_at)}
                    </div>
                  )}
                </div>
              )}

              {/* Input if not replied yet */}
              {!msg.owner_reply && (
                <div className="pt-2 flex flex-col sm:flex-row items-stretch gap-2.5">
                  <input
                    type="text"
                    maxLength={1000}
                    placeholder="Type an anonymous response (e.g. 'Coming down in 2 minutes to move it')..."
                    value={replyTextMap[msg.id] || ""}
                    onChange={(e) =>
                      setReplyTextMap({ ...replyTextMap, [msg.id]: e.target.value })
                    }
                    className="flex-1 bg-background border border-border rounded-xl px-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                  <Button
                    size="sm"
                    onClick={() => handleSendReply(msg.id)}
                    isLoading={sendingReply === msg.id}
                    className="bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold h-10 px-5 rounded-xl shadow-sm shrink-0"
                  >
                    <Send className="mr-1.5 h-3.5 w-3.5" /> Send Reply
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

