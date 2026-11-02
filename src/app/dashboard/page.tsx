"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Car,
  QrCode,
  AlertTriangle,
  Bell,
  Eye,
  Plus,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  Zap,
  TrendingUp,
  MapPin,
  Check,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatTimeAgo } from "@/lib/utils";
import type { Vehicle, ParkingAlert, Notification } from "@/types/database";

export default function DashboardOverviewPage() {
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [alerts, setAlerts] = useState<ParkingAlert[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [totalScans, setTotalScans] = useState(0);

  useEffect(() => {
    let isMounted = true;
    async function fetchDashboardData() {
      try {
        setLoading(true);
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          // 1. Fetch user vehicles
          const { data: userVehicles } = await supabase
            .from("vehicles")
            .select("*")
            .eq("owner_id", user.id)
            .order("created_at", { ascending: false });

          if (isMounted && userVehicles) {
            setVehicles(userVehicles);

            const vehicleIds = userVehicles.map((v) => v.id);
            if (vehicleIds.length > 0) {
              const { data: qrData } = await supabase
                .from("vehicle_qr_codes")
                .select("scan_count")
                .in("vehicle_id", vehicleIds);

              const scans = qrData?.reduce((acc, curr) => acc + (curr.scan_count || 0), 0) || 0;
              setTotalScans(scans);

              // 2. Fetch recent alerts
              const { data: recentAlerts } = await supabase
                .from("parking_alerts")
                .select("*, vehicle:vehicles(*)")
                .in("vehicle_id", vehicleIds)
                .order("created_at", { ascending: false })
                .limit(5);

              if (recentAlerts) setAlerts(recentAlerts as any);
            }
          }

          // 3. Fetch notifications
          const { data: userNotifications } = await supabase
            .from("notifications")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(5);

          if (isMounted && userNotifications) {
            setNotifications(userNotifications);
          }
        }
      } catch (err) {
        console.error("Dashboard overview error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchDashboardData();
    return () => {
      isMounted = false;
    };
  }, []);

  const activeVehicles = vehicles.filter((v) => v.status === "active").length;
  const pendingAlerts = alerts.filter((a) => a.status === "pending").length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <Skeleton className="lg:col-span-7 h-80 rounded-2xl" />
          <Skeleton className="lg:col-span-5 h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Banner & Quick Add */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 mb-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Active Cloud Sync</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Vehicle Command Center
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Live fleet status, physical QR interaction telemetry, and parking assistance dispatch.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/dashboard/qr">
            <Button variant="outline" size="sm" className="text-xs h-9">
              <QrCode className="mr-1.5 h-4 w-4 text-emerald-600" /> Print Stickers
            </Button>
          </Link>
          <Link href="/dashboard/vehicles/new">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 font-semibold shadow-md shadow-emerald-600/20">
              <Plus className="mr-1.5 h-4 w-4" /> Register Vehicle
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Stat Cards with Refined Hierarchy */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Registered Fleet */}
        <div className="bg-card border border-border/80 rounded-2xl p-5 space-y-3 shadow-sm hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <span>Registered Fleet</span>
            <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">
              <Car className="h-4 w-4" />
            </span>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-black text-foreground">{vehicles.length}</div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>{activeVehicles} active in circulation</span>
            </div>
          </div>
        </div>

        {/* Card 2: Total Scans */}
        <div className="bg-card border border-border/80 rounded-2xl p-5 space-y-3 shadow-sm hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <span>Total QR Views</span>
            <span className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600">
              <Eye className="h-4 w-4" />
            </span>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-black text-foreground">{totalScans}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3.5 w-3.5 text-sky-500" />
              <span>Live visitor lookups logged</span>
            </div>
          </div>
        </div>

        {/* Card 3: Parking Alerts */}
        <div className="bg-card border border-border/80 rounded-2xl p-5 space-y-3 shadow-sm hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <span>Parking Alerts</span>
            <span className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600">
              <AlertTriangle className="h-4 w-4" />
            </span>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-black text-foreground">{alerts.length}</div>
            <div className="text-xs">
              {pendingAlerts > 0 ? (
                <span className="text-amber-600 font-semibold flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                  {pendingAlerts} require action
                </span>
              ) : (
                <span className="text-emerald-600 font-medium flex items-center gap-1">
                  <Check className="h-3.5 w-3.5" /> All spots clear
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Card 4: Unread Notifications */}
        <div className="bg-card border border-border/80 rounded-2xl p-5 space-y-3 shadow-sm hover:border-purple-500/40 transition-all">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <span>Push Notifications</span>
            <span className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600">
              <Bell className="h-4 w-4" />
            </span>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-black text-foreground">
              {notifications.filter((n) => !n.is_read).length}
            </div>
            <div className="text-xs text-muted-foreground">
              <span>Realtime event dispatch</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Fleet Cards on Left, Recent Alerts Feed on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: My Registered Fleet */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground">Active Vehicle Fleet</h2>
            <Link
              href="/dashboard/vehicles"
              className="text-xs text-emerald-600 hover:underline flex items-center gap-1 font-semibold"
            >
              Manage all ({vehicles.length}) <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {vehicles.length === 0 ? (
            <div className="bg-card border border-border/80 border-dashed rounded-3xl p-10 text-center space-y-3">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">
                <Car className="h-7 w-7" />
              </div>
              <h3 className="text-sm font-bold text-foreground">No vehicles registered yet</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                Add your car, scooter, or motorcycle to generate a permanent dynamic QR code sticker.
              </p>
              <Link href="/dashboard/vehicles/new">
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs mt-2">
                  <Plus className="mr-1 h-3.5 w-3.5" /> Register Your First Vehicle
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {vehicles.slice(0, 4).map((vehicle) => (
                <div
                  key={vehicle.id}
                  className="bg-card border border-border/80 rounded-2xl p-4 flex items-center justify-between hover:border-emerald-500/40 transition-all shadow-sm group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="h-11 w-11 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-foreground font-bold shadow-inner group-hover:scale-105 transition-transform">
                      <Car className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-foreground">
                        {vehicle.brand} {vehicle.model}
                      </div>
                      <div className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400">
                        {vehicle.registration_number} • <span className="text-muted-foreground font-normal">{vehicle.color}</span>
                      </div>
                      {vehicle.parking_location && (
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3 text-slate-400" />
                          <span>{vehicle.parking_location}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      variant={vehicle.status === "active" ? "success" : "secondary"}
                      className="text-[10px]"
                    >
                      {vehicle.status}
                    </Badge>
                    <Link href={`/dashboard/vehicles/${vehicle.id}`}>
                      <Button variant="outline" size="sm" className="text-xs h-8">
                        Configure
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Live Parking Alert Dispatch */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground">Recent Parking Alerts</h2>
            <Link
              href="/dashboard/alerts"
              className="text-xs text-emerald-600 hover:underline flex items-center gap-1 font-semibold"
            >
              Alerts centre <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {alerts.length === 0 ? (
            <div className="bg-card border border-border/80 rounded-3xl p-8 text-center space-y-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 mb-2">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <p className="text-xs font-bold text-foreground">No Active Parking Alerts</p>
              <p className="text-[11px] text-muted-foreground max-w-xs mx-auto leading-relaxed">
                Your vehicles have no reported issues. Alerts sent by passersby will appear here in real time.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="bg-card border border-border/80 rounded-2xl p-4 space-y-2.5 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                      {alert.category.replace(/_/g, " ").toUpperCase()}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {formatTimeAgo(alert.created_at)}
                    </span>
                  </div>

                  {alert.custom_message && (
                    <div className="bg-muted/40 p-2.5 rounded-xl border border-border text-xs text-foreground italic">
                      &ldquo;{alert.custom_message}&rdquo;
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-border/50 text-muted-foreground">
                    <span className="font-mono font-bold text-foreground">
                      {alert.vehicle?.registration_number || "Car"}
                    </span>
                    <Badge
                      variant={alert.status === "resolved" ? "success" : "warning"}
                      className="text-[10px]"
                    >
                      {alert.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
