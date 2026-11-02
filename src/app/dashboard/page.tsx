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
  TrendingUp,
  MapPin,
  Check,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
    let alertsChannel: any = null;
    let pollInterval: any = null;

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

              // Realtime listener for overview alerts
              alertsChannel = supabase
                .channel("overview-realtime-alerts")
                .on(
                  "postgres_changes",
                  {
                    event: "*",
                    schema: "public",
                    table: "parking_alerts",
                  },
                  async () => {
                    const { data: freshAlerts } = await supabase
                      .from("parking_alerts")
                      .select("*, vehicle:vehicles(*)")
                      .in("vehicle_id", vehicleIds)
                      .order("created_at", { ascending: false })
                      .limit(5);

                    if (isMounted && freshAlerts) {
                      setAlerts(freshAlerts as any);
                    }
                  }
                )
                .subscribe();

              // Resilient 5s polling for overview
              pollInterval = setInterval(async () => {
                if (!isMounted) return;
                const { data: pollAlerts } = await supabase
                  .from("parking_alerts")
                  .select("*, vehicle:vehicles(*)")
                  .in("vehicle_id", vehicleIds)
                  .order("created_at", { ascending: false })
                  .limit(5);

                if (isMounted && pollAlerts) {
                  setAlerts(pollAlerts as any);
                }
              }, 5000);
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
      if (alertsChannel) {
        const supabase = createClient();
        supabase.removeChannel(alertsChannel);
      }
      if (pollInterval) clearInterval(pollInterval);
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
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Skeleton className="lg:col-span-7 h-80 rounded-xl" />
          <Skeleton className="lg:col-span-5 h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Add */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-muted text-[11px] font-mono text-muted-foreground mb-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
            <span>Active cloud sync</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Vehicle command center
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Fleet status, QR interaction telemetry, and parking assistance dispatch.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/dashboard/qr">
            <Button variant="outline" size="sm" className="text-xs h-9">
              <QrCode className="mr-1.5 h-4 w-4 text-emerald-600" /> Print stickers
            </Button>
          </Link>
          <Link href="/dashboard/vehicles/new">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 font-medium">
              <Plus className="mr-1.5 h-4 w-4" /> Register vehicle
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Registered Fleet */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span>Registered fleet</span>
            <Car className="h-4 w-4 text-emerald-600" />
          </div>
          <div>
            <div className="text-2xl font-mono font-bold text-foreground">{vehicles.length}</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {activeVehicles} active in circulation
            </div>
          </div>
        </div>

        {/* Card 2: Total Scans */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span>Total QR views</span>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <div className="text-2xl font-mono font-bold text-foreground">{totalScans}</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Live visitor lookups logged
            </div>
          </div>
        </div>

        {/* Card 3: Parking Alerts */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span>Parking alerts</span>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </div>
          <div>
            <div className="text-2xl font-mono font-bold text-foreground">{alerts.length}</div>
            <div className="text-xs mt-0.5">
              {pendingAlerts > 0 ? (
                <span className="text-amber-600 font-medium">
                  {pendingAlerts} require action
                </span>
              ) : (
                <span className="text-emerald-600 font-medium">
                  All spots clear
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Card 4: Unread Notifications */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span>Push notifications</span>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <div className="text-2xl font-mono font-bold text-foreground">
              {notifications.filter((n) => !n.is_read).length}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Realtime event dispatch
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Fleet Cards on Left, Recent Alerts Feed on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: My Registered Fleet */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Active vehicle fleet</h2>
            <Link
              href="/dashboard/vehicles"
              className="text-xs text-emerald-600 hover:underline flex items-center gap-1 font-medium"
            >
              Manage all ({vehicles.length}) <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {vehicles.length === 0 ? (
            <div className="bg-card border border-border border-dashed rounded-xl p-10 text-center space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <Car className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">No vehicles registered yet</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                Add your vehicle to generate a permanent dynamic QR code sticker.
              </p>
              <Link href="/dashboard/vehicles/new">
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs mt-2">
                  <Plus className="mr-1 h-3.5 w-3.5" /> Register first vehicle
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2.5">
              {vehicles.slice(0, 4).map((vehicle) => (
                <div
                  key={vehicle.id}
                  className="bg-card border border-border rounded-xl p-3.5 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center text-foreground font-bold">
                      <Car className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-foreground">
                        {vehicle.brand} {vehicle.model}
                      </div>
                      <div className="text-[11px] font-mono text-muted-foreground">
                        {vehicle.registration_number} / {vehicle.color}
                      </div>
                      {vehicle.parking_location && (
                        <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3" />
                          <span>{vehicle.parking_location}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      variant={vehicle.status === "active" ? "success" : "secondary"}
                      className="text-[10px] font-mono capitalize"
                    >
                      {vehicle.status}
                    </Badge>
                    <Link href={`/dashboard/vehicles/${vehicle.id}`}>
                      <Button variant="outline" size="sm" className="text-xs h-7 px-2.5">
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
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Recent parking alerts</h2>
            <Link
              href="/dashboard/alerts"
              className="text-xs text-emerald-600 hover:underline flex items-center gap-1 font-medium"
            >
              Alerts centre <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {alerts.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-8 text-center space-y-2">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-emerald-600 mb-2">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <p className="text-xs font-medium text-foreground">No active parking alerts</p>
              <p className="text-[11px] text-muted-foreground max-w-xs mx-auto leading-relaxed">
                Your vehicles have no reported issues. Alerts sent by passersby will appear here in real time.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="bg-card border border-border rounded-xl p-3.5 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-foreground flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                      <span>{alert.category.replace(/_/g, " ")}</span>
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {formatTimeAgo(alert.created_at)}
                    </span>
                  </div>

                  {alert.custom_message && (
                    <div className="bg-muted p-2 rounded text-xs text-foreground italic">
                      &ldquo;{alert.custom_message}&rdquo;
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-border text-muted-foreground">
                    <span className="font-mono font-medium text-foreground">
                      {alert.vehicle?.registration_number || "Vehicle"}
                    </span>
                    <Badge
                      variant={alert.status === "resolved" ? "success" : "warning"}
                      className="text-[10px] font-mono capitalize"
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
