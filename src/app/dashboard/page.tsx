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

            // Calculate total scans across user's vehicles
            const vehicleIds = userVehicles.map((v) => v.id);
            if (vehicleIds.length > 0) {
              const { data: qrData } = await supabase
                .from("vehicle_qr_codes")
                .select("scan_count")
                .in("vehicle_id", vehicleIds);

              const scans = qrData?.reduce((acc, curr) => acc + (curr.scan_count || 0), 0) || 0;
              setTotalScans(scans);

              // 2. Fetch recent alerts for user's vehicles
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
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Title & Quick Add */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Dashboard Overview
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Realtime vehicle status, QR interactions, and parking assistance requests.
          </p>
        </div>
        <Link href="/dashboard/vehicles/new">
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 font-semibold">
            <Plus className="mr-1.5 h-4 w-4" /> Register New Vehicle
          </Button>
        </Link>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Registered Vehicles */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Vehicles
            </CardTitle>
            <Car className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{vehicles.length}</div>
            <p className="text-[11px] text-muted-foreground mt-1">
              <span className="text-emerald-600 font-semibold">{activeVehicles} active</span> in
              circulation
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Total QR Scans */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Scans
            </CardTitle>
            <Eye className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalScans}</div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Live QR profile views logged
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Parking Alerts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Parking Alerts
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{alerts.length}</div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {pendingAlerts > 0 ? (
                <span className="text-amber-600 font-semibold">{pendingAlerts} require action</span>
              ) : (
                "All issues resolved"
              )}
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Unread Notifications */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Activity Alerts
            </CardTitle>
            <Bell className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {notifications.filter((n) => !n.is_read).length}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Unread push notifications</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid: Vehicles + Recent Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: My Vehicles Summary */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground">My Vehicles</h2>
            <Link
              href="/dashboard/vehicles"
              className="text-xs text-emerald-600 hover:underline flex items-center gap-1 font-semibold"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {vehicles.length === 0 ? (
            <div className="bg-card border border-border border-dashed rounded-2xl p-8 text-center space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60">
                <Car className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-foreground">No vehicles registered yet</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Add your car, scooter, or bike to generate your unique dynamic QR code sticker.
              </p>
              <Link href="/dashboard/vehicles/new">
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs mt-2">
                  Register Your First Vehicle
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {vehicles.slice(0, 3).map((vehicle) => (
                <div
                  key={vehicle.id}
                  className="bg-card border border-border rounded-xl p-4 flex items-center justify-between hover:border-emerald-500/50 transition-all shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-foreground font-bold">
                      <Car className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-foreground">
                        {vehicle.brand} {vehicle.model}
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {vehicle.registration_number} • {vehicle.color}
                      </div>
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
                      <Button variant="ghost" size="sm" className="text-xs h-8">
                        Manage
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Recent Parking Alerts */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground">Recent Parking Alerts</h2>
            <Link
              href="/dashboard/alerts"
              className="text-xs text-emerald-600 hover:underline flex items-center gap-1 font-semibold"
            >
              See all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {alerts.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-8 text-center space-y-2">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-emerald-600 mb-2">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <p className="text-xs font-semibold text-foreground">No parking alerts</p>
              <p className="text-[11px] text-muted-foreground">
                Your vehicles are parked clear. Any alerts sent by scanners will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="bg-card border border-border rounded-xl p-3.5 space-y-2 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                      {alert.category.replace(/_/g, " ").toUpperCase()}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatTimeAgo(alert.created_at)}
                    </span>
                  </div>
                  {alert.custom_message && (
                    <p className="text-xs text-muted-foreground italic">
                      &ldquo;{alert.custom_message}&rdquo;
                    </p>
                  )}
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-border/50 text-muted-foreground">
                    <span>Vehicle: {alert.vehicle?.registration_number || "Car"}</span>
                    <Badge variant={alert.status === "resolved" ? "success" : "warning"} className="text-[10px]">
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

