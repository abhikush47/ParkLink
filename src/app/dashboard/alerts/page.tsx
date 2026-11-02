"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Car,
  Filter,
  Check,
  X,
  ShieldAlert,
  ArrowRight,
  Flame,
  BellRing,
  Lightbulb,
  DoorOpen,
  HelpCircle,
  Eye,
  Archive,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { formatTimeAgo, formatDate } from "@/lib/utils";
import type { ParkingAlert, AlertStatus, Vehicle } from "@/types/database";

const categoryMeta: Record<string, { label: string; priority: "high" | "medium" | "low"; icon: any; color: string }> = {
  blocking: {
    label: "Vehicle is blocking another vehicle",
    priority: "high",
    icon: Flame,
    color: "text-rose-500 bg-rose-500/10 border-rose-500/20",
  },
  please_move: {
    label: "Please move your vehicle immediately",
    priority: "high",
    icon: AlertTriangle,
    color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  },
  lights_on: {
    label: "Vehicle headlights or hazard lights are on",
    priority: "medium",
    icon: Lightbulb,
    color: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20",
  },
  window_open: {
    label: "Window or sunroof appears open",
    priority: "medium",
    icon: DoorOpen,
    color: "text-sky-500 bg-sky-500/10 border-sky-500/20",
  },
  parked_incorrectly: {
    label: "Vehicle parked incorrectly or over line",
    priority: "medium",
    icon: ShieldAlert,
    color: "text-orange-500 bg-orange-500/10 border-orange-500/20",
  },
  other: {
    label: "General Parking Notice",
    priority: "low",
    icon: HelpCircle,
    color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
  },
};

export default function ParkingAlertsPage() {
  const toast = useToast();
  const [alerts, setAlerts] = useState<ParkingAlert[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [vehicleFilter, setVehicleFilter] = useState<string>("all");

  useEffect(() => {
    let isMounted = true;
    async function loadAlerts() {
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
              const { data: aData } = await supabase
                .from("parking_alerts")
                .select("*, vehicle:vehicles(*)")
                .in("vehicle_id", vehicleIds)
                .order("created_at", { ascending: false });

              if (isMounted && aData) {
                setAlerts(aData as any);
              }
            }
          }
        }
      } catch (err) {
        console.error("Failed to load alerts", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadAlerts();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleUpdateStatus = async (alertId: string, newStatus: AlertStatus) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("parking_alerts")
        .update({
          status: newStatus,
          resolved_at: newStatus === "resolved" ? new Date().toISOString() : null,
        })
        .eq("id", alertId);

      if (error) throw error;

      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, status: newStatus } : a))
      );
      toast.success(`Alert updated to ${newStatus}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update alert");
    }
  };

  const filteredAlerts = alerts.filter((a) => {
    const matchesStatus = statusFilter === "all" || a.status === statusFilter;
    const matchesVehicle = vehicleFilter === "all" || a.vehicle_id === vehicleFilter;
    return matchesStatus && matchesVehicle;
  });

  const pendingCount = alerts.filter((a) => a.status === "pending").length;
  const resolvedCount = alerts.filter((a) => a.status === "resolved").length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-950/30 via-card to-card p-6 md:p-8 backdrop-blur-xl">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400">
              <BellRing className="h-3.5 w-3.5" />
              <span>Realtime Vehicle Alert Stream</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Parking Alert Command
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
              Live notifications submitted by public visitors who scanned your windshield QR sticker. Quickly acknowledge, respond, or mark alerts resolved.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-border bg-card/60 px-4 py-3 backdrop-blur-md">
              <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Needs Attention
              </div>
              <div className="text-xl font-mono font-bold text-amber-400">
                {pendingCount}
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-card/60 px-4 py-3 backdrop-blur-md">
              <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Resolved
              </div>
              <div className="text-xl font-mono font-bold text-emerald-400">
                {resolvedCount}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Selectors */}
      <div className="rounded-2xl border border-border bg-card p-3 md:p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {(["all", "pending", "read", "resolved", "ignored"] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all whitespace-nowrap ${
                statusFilter === st
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              {st}
              {st === "pending" && pendingCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 bg-amber-500 text-slate-950 rounded-full text-[10px] font-bold">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {vehicles.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground whitespace-nowrap font-medium">Filter by Vehicle:</span>
            <select
              value={vehicleFilter}
              onChange={(e) => setVehicleFilter(e.target.value)}
              className="text-xs bg-background/80 border border-border rounded-xl px-3 h-9 text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
            >
              <option value="all">All Vehicles ({vehicles.length})</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.registration_number} — {v.brand} {v.model}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Alerts Stream */}
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 rounded-3xl" />
          <Skeleton className="h-32 rounded-3xl" />
          <Skeleton className="h-32 rounded-3xl" />
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className="bg-card border border-border border-dashed rounded-3xl p-16 text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-foreground">All Clear. No Active Alerts</h3>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            {statusFilter !== "all" || vehicleFilter !== "all"
              ? "No alerts match the chosen filters. Try resetting to 'All'."
              : "Your parked vehicles have no reported issues. Alerts sent by scanners appear here in realtime."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAlerts.map((alert) => {
            const meta = categoryMeta[alert.category] || categoryMeta.other;
            const Icon = meta.icon;
            const isPending = alert.status === "pending";

            return (
              <div
                key={alert.id}
                className={`group relative rounded-3xl border p-5 md:p-6 transition-all backdrop-blur-xl ${
                  isPending
                    ? "border-amber-500/40 bg-amber-950/10 shadow-lg shadow-amber-950/10"
                    : alert.status === "resolved"
                    ? "border-border/80 bg-card/60 opacity-80 hover:opacity-100"
                    : "border-border/80 bg-card"
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-2xl border shrink-0 ${meta.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-base font-bold text-foreground">
                          {meta.label}
                        </span>

                        <Badge
                          variant={
                            alert.status === "pending"
                              ? "destructive"
                              : alert.status === "resolved"
                              ? "success"
                              : "secondary"
                          }
                          className="text-[10px] font-mono capitalize"
                        >
                          {alert.status}
                        </Badge>

                        {meta.priority === "high" && isPending && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-400">
                            High Urgency
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground font-mono">
                        <span className="font-bold text-foreground bg-muted px-2 py-0.5 rounded-lg border border-border">
                          {alert.vehicle?.registration_number}
                        </span>
                        <span>•</span>
                        <span>{alert.vehicle?.brand} {alert.vehicle?.model}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTimeAgo(alert.created_at)}
                        </span>
                      </div>

                      {alert.custom_message && (
                        <div className="mt-3 rounded-2xl border border-border/80 bg-muted/40 p-3.5 text-xs text-foreground italic">
                          &ldquo;{alert.custom_message}&rdquo;
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div className="flex items-center md:flex-col gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-border">
                    {alert.status !== "resolved" && (
                      <Button
                        size="sm"
                        onClick={() => handleUpdateStatus(alert.id, "resolved")}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs h-8 px-3 rounded-xl shadow-sm"
                      >
                        <Check className="h-3.5 w-3.5 mr-1" />
                        Mark Resolved
                      </Button>
                    )}

                    {alert.status === "pending" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateStatus(alert.id, "read")}
                        className="text-xs h-8 px-3 rounded-xl border-border hover:bg-muted"
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        Acknowledge
                      </Button>
                    )}

                    {alert.status !== "ignored" && alert.status !== "resolved" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUpdateStatus(alert.id, "ignored")}
                        className="text-xs h-8 px-2 text-muted-foreground hover:text-foreground rounded-xl"
                      >
                        Dismiss
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

