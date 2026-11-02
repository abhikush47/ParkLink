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
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { formatTimeAgo, formatDate } from "@/lib/utils";
import type { ParkingAlert, AlertStatus, Vehicle } from "@/types/database";

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
          // 1. Fetch user vehicles
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
      toast.success(`Alert marked as ${newStatus}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update alert");
    }
  };

  const filteredAlerts = alerts.filter((a) => {
    const matchesStatus = statusFilter === "all" || a.status === statusFilter;
    const matchesVehicle = vehicleFilter === "all" || a.vehicle_id === vehicleFilter;
    return matchesStatus && matchesVehicle;
  });

  const categoryLabels: Record<string, string> = {
    blocking: "Vehicle is blocking another vehicle",
    please_move: "Please move your vehicle",
    lights_on: "Vehicle lights are switched on",
    window_open: "Vehicle window appears open",
    parked_incorrectly: "Vehicle parked incorrectly",
    other: "Other issue",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Parking Alerts Centre
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Incoming notifications submitted by visitors who scanned your vehicle QR code.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-xl p-4 flex flex-col sm:flex-row gap-3 shadow-sm">
        <div className="flex items-center gap-2 flex-1">
          <label className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
            Filter Status:
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-background border border-input rounded-md px-3 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">All Alerts</option>
            <option value="pending">Pending</option>
            <option value="read">Read</option>
            <option value="resolved">Resolved</option>
            <option value="ignored">Ignored</option>
          </select>
        </div>

        {vehicles.length > 0 && (
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
              Vehicle:
            </label>
            <select
              value={vehicleFilter}
              onChange={(e) => setVehicleFilter(e.target.value)}
              className="text-xs bg-background border border-input rounded-md px-3 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">All My Vehicles</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.registration_number} ({v.brand} {v.model})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Alerts List */}
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className="bg-card border border-border border-dashed rounded-2xl p-12 text-center space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-emerald-600">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h3 className="text-base font-bold text-foreground">No parking alerts found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {statusFilter !== "all" || vehicleFilter !== "all"
              ? "No alerts match the chosen filters."
              : "Your parked vehicles have no reported issues. Alerts sent by scanners appear here."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map((alert) => {
            const isPending = alert.status === "pending";
            return (
              <div
                key={alert.id}
                className={`bg-card border rounded-2xl p-5 shadow-sm transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isPending
                    ? "border-amber-500/50 bg-amber-50/10 dark:bg-amber-950/10"
                    : "border-border"
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                      <AlertTriangle className="h-4 w-4" />
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-foreground">
                        {categoryLabels[alert.category] || alert.category}
                      </h3>
                      <div className="text-[11px] text-muted-foreground font-mono">
                        Vehicle: <strong>{alert.vehicle?.registration_number}</strong> ({alert.vehicle?.brand} {alert.vehicle?.model}) • Received {formatTimeAgo(alert.created_at)}
                      </div>
                    </div>
                  </div>

                  {alert.custom_message && (
                    <div className="bg-muted/40 p-3 rounded-xl border border-border text-xs text-foreground italic ml-11">
                      &ldquo;{alert.custom_message}&rdquo;
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 self-end md:self-center">
                  <Badge
                    variant={
                      alert.status === "resolved"
                        ? "success"
                        : alert.status === "pending"
                        ? "warning"
                        : "secondary"
                    }
                    className="text-xs"
                  >
                    {alert.status.toUpperCase()}
                  </Badge>

                  {alert.status !== "resolved" && (
                    <Button
                      size="sm"
                      onClick={() => handleUpdateStatus(alert.id, "resolved")}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8"
                    >
                      <Check className="mr-1 h-3.5 w-3.5" /> Mark Resolved
                    </Button>
                  )}

                  {alert.status === "pending" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpdateStatus(alert.id, "ignored")}
                      className="text-xs h-8"
                    >
                      Dismiss
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
