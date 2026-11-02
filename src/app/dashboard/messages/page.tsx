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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Anonymous Contact Relay
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Two-way privacy relay conversations with people who scanned your vehicles.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      ) : messages.length === 0 ? (
        <div className="bg-card border border-border border-dashed rounded-2xl p-12 text-center space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-emerald-600">
            <MessageSquare className="h-7 w-7" />
          </div>
          <h3 className="text-base font-bold text-foreground">No relay messages yet</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            When a visitor leaves an anonymous note via your vehicle profile, the conversation thread
            will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                    <Car className="h-4 w-4" />
                  </span>
                  <div>
                    <span className="text-xs font-bold text-foreground font-mono">
                      {msg.vehicle?.registration_number}
                    </span>
                    <span className="text-xs text-muted-foreground ml-2">
                      ({msg.vehicle?.brand} {msg.vehicle?.model})
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground">
                    {formatTimeAgo(msg.created_at)}
                  </span>
                  <Badge variant={msg.status === "replied" ? "success" : "secondary"} className="text-[10px]">
                    {msg.status}
                  </Badge>
                </div>
              </div>

              {/* Visitor Note */}
              <div className="bg-muted/40 p-4 rounded-xl border border-border space-y-1">
                <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  Visitor Message (Identity Protected)
                </div>
                <p className="text-sm text-foreground">{msg.message}</p>
              </div>

              {/* Owner Reply if exists */}
              {msg.owner_reply && (
                <div className="bg-emerald-50/50 dark:bg-emerald-950/30 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/40 space-y-1 ml-6">
                  <div className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    Your Response
                  </div>
                  <p className="text-sm text-foreground">{msg.owner_reply}</p>
                </div>
              )}

              {/* Reply Form */}
              {!msg.owner_reply && (
                <div className="pt-2 flex items-center gap-2">
                  <input
                    type="text"
                    maxLength={1000}
                    placeholder="Type a safe response to the visitor..."
                    value={replyTextMap[msg.id] || ""}
                    onChange={(e) =>
                      setReplyTextMap({ ...replyTextMap, [msg.id]: e.target.value })
                    }
                    className="flex-1 bg-background border border-input rounded-xl px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <Button
                    size="sm"
                    onClick={() => handleSendReply(msg.id)}
                    isLoading={sendingReply === msg.id}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9"
                  >
                    <Send className="mr-1.5 h-3.5 w-3.5" /> Reply
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
