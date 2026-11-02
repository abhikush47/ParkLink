"use client";

import React, { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Check,
  ShieldAlert,
  Flame,
  BellRing,
  Lightbulb,
  DoorOpen,
  HelpCircle,
  Eye,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { formatTimeAgo } from "@/lib/utils";
import type { ParkingAlert, AlertStatus, Vehicle } from "@/types/database";

const categoryMeta: Record<string, { label: string; priority: "high" | "medium" | "low"; icon: any }> = {
  blocking: {
    label: "Vehicle is blocking another vehicle",
    priority: "high",
    icon: Flame,
  },
  please_move: {
    label: "Please move your vehicle immediately",
    priority: "high",
    icon: AlertTriangle,
  },
  lights_on: {
    label: "Vehicle headlights or hazard lights are on",
    priority: "medium",
    icon: Lightbulb,
  },
  window_open: {
    label: "Window or sunroof appears open",
    priority: "medium",
    icon: DoorOpen,
  },
  parked_incorrectly: {
    label: "Vehicle parked incorrectly or over line",
    priority: "medium",
    icon: ShieldAlert,
  },
  other: {
    label: "General parking notice",
    priority: "low",
    icon: HelpCircle,
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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="rounded-2xl border border-border bg-card p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-md bg-muted px-2.5 py-1 text-xs text-foreground font-mono">
            <BellRing className="h-3.5 w-3.5 text-amber-500" />
            <span>Alert dispatch</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Parking alerts
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
            Live notices submitted by visitors who scanned your vehicle QR sticker. Acknowledge, respond, or mark alerts resolved.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-border bg-muted/60 px-4 py-3">
            <div className="text-xs font-medium text-muted-foreground">
              Needs attention
            </div>
            <div className="text-xl font-mono font-bold text-amber-500">
              {pendingCount}
            </div>
          </div>
          <div className="rounded-xl border border-border bg-muted/60 px-4 py-3">
            <div className="text-xs font-medium text-muted-foreground">
              Resolved
            </div>
            <div className="text-xl font-mono font-bold text-emerald-600 dark:text-emerald-400">
              {resolvedCount}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Selectors */}
      <div className="rounded-xl border border-border bg-card p-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 text-xs">
          {(["all", "pending", "read", "resolved", "ignored"] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg font-medium capitalize transition-colors duration-150 whitespace-nowrap ${
                statusFilter === st
                  ? "bg-muted text-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              {st}
              {st === "pending" && pendingCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 bg-amber-500 text-neutral-950 rounded font-mono text-[10px] font-bold">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {vehicles.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground whitespace-nowrap">Filter vehicle:</span>
            <select
              value={vehicleFilter}
              onChange={(e) => setVehicleFilter(e.target.value)}
              className="text-xs bg-muted border border-border rounded-lg px-2.5 h-8 text-foreground focus:outline-none"
            >
              <option value="all">All vehicles ({vehicles.length})</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.registration_number} / {v.brand} {v.model}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Alerts Stream */}
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className="bg-card border border-border border-dashed rounded-xl p-16 text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-emerald-600">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-foreground">All clear. No active alerts</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
            {statusFilter !== "all" || vehicleFilter !== "all"
              ? "No alerts match the chosen filters. Try resetting your filter."
              : "Your parked vehicles have no reported issues. Alerts sent by passersby will appear here in real time."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map((alert) => {
            const meta = categoryMeta[alert.category] || categoryMeta.other;
            const Icon = meta.icon;
            const isPending = alert.status === "pending";

            return (
              <div
                key={alert.id}
                className={`rounded-xl border p-5 transition-colors duration-150 ${
                  isPending
                    ? "border-amber-500/40 bg-amber-500/5"
                    : alert.status === "resolved"
                    ? "border-border bg-card/60"
                    : "border-border bg-card"
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="p-2.5 rounded-lg bg-muted border border-border shrink-0 mt-0.5">
                      <Icon className="h-5 w-5 text-amber-500" />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">
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
                          <span className="inline-flex items-center gap-1 rounded bg-destructive/10 text-[10px] font-mono text-destructive px-1.5 py-0.5">
                            High urgency
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground font-mono">
                        <span className="font-semibold text-foreground bg-muted px-2 py-0.5 rounded border border-border">
                          {alert.vehicle?.registration_number}
                        </span>
                        <span>/</span>
                        <span>{alert.vehicle?.brand} {alert.vehicle?.model}</span>
                        <span>/</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTimeAgo(alert.created_at)}
                        </span>
                      </div>

                      {alert.custom_message && (
                        <div className="mt-2 rounded-lg border border-border bg-muted p-2.5 text-xs text-foreground italic">
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
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 px-3"
                      >
                        <Check className="h-3.5 w-3.5 mr-1" />
                        Resolve
                      </Button>
                    )}

                    {alert.status === "pending" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateStatus(alert.id, "read")}
                        className="text-xs h-8 px-3"
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
                        className="text-xs h-8 px-2 text-muted-foreground hover:text-foreground"
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
