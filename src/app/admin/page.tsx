"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Car,
  QrCode,
  AlertTriangle,
  Flag,
  Activity,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatTimeAgo } from "@/lib/utils";

export default function AdminOverviewPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    users: 0,
    vehicles: 0,
    activeQrs: 0,
    inactiveQrs: 0,
    totalScans: 0,
    alerts: 0,
    reports: 0,
  });
  const [recentReports, setRecentReports] = useState<any[]>([]);

  useEffect(() => {
    let isMounted = true;
    async function fetchAdminStats() {
      try {
        setLoading(true);
        const supabase = createClient();

        // 1. Users count
        const { count: usersCount } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true });

        // 2. Vehicles count
        const { count: vehiclesCount } = await supabase
          .from("vehicles")
          .select("*", { count: "exact", head: true });

        // 3. QR codes counts
        const { data: qrs } = await supabase
          .from("vehicle_qr_codes")
          .select("status, scan_count");

        let activeQ = 0;
        let inactiveQ = 0;
        let scans = 0;
        qrs?.forEach((q) => {
          if (q.status === "active") activeQ++;
          else inactiveQ++;
          scans += q.scan_count || 0;
        });

        // 4. Alerts count
        const { count: alertsCount } = await supabase
          .from("parking_alerts")
          .select("*", { count: "exact", head: true });

        // 5. Reports count & list
        const { data: repData, count: reportsCount } = await supabase
          .from("reports")
          .select("*, vehicle:vehicles(*)")
          .order("created_at", { ascending: false })
          .limit(5);

        if (isMounted) {
          setStats({
            users: usersCount || 0,
            vehicles: vehiclesCount || 0,
            activeQrs: activeQ,
            inactiveQrs: inactiveQ,
            totalScans: scans,
            alerts: alertsCount || 0,
            reports: reportsCount || 0,
          });
          if (repData) setRecentReports(repData);
        }
      } catch (err) {
        console.error("Failed to load admin stats", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchAdminStats();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">System Command Center</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Global ParkLink platform health, user accounts, and moderation status.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-28 rounded-xl bg-slate-800" />
          <Skeleton className="h-28 rounded-xl bg-slate-800" />
          <Skeleton className="h-28 rounded-xl bg-slate-800" />
          <Skeleton className="h-28 rounded-xl bg-slate-800" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400 uppercase tracking-wider font-semibold">
                <span>Total Users</span>
                <Users className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-white">{stats.users}</div>
              <p className="text-[11px] text-slate-500">Registered vehicle owners</p>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400 uppercase tracking-wider font-semibold">
                <span>Registered Fleet</span>
                <Car className="h-4 w-4 text-sky-400" />
              </div>
              <div className="text-2xl font-bold text-white">{stats.vehicles}</div>
              <p className="text-[11px] text-slate-500">Total registered vehicles</p>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400 uppercase tracking-wider font-semibold">
                <span>Active QR Tokens</span>
                <QrCode className="h-4 w-4 text-purple-400" />
              </div>
              <div className="text-2xl font-bold text-white">{stats.activeQrs}</div>
              <p className="text-[11px] text-slate-500">{stats.inactiveQrs} inactive or suspended</p>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400 uppercase tracking-wider font-semibold">
                <span>Reports & Flags</span>
                <Flag className="h-4 w-4 text-rose-500" />
              </div>
              <div className="text-2xl font-bold text-white">{stats.reports}</div>
              <p className="text-[11px] text-slate-500">Awaiting administrative review</p>
            </div>
          </div>

          {/* Quick Admin Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/admin/users"
              className="bg-slate-950 border border-slate-800 hover:border-slate-700 p-5 rounded-2xl transition-all space-y-2"
            >
              <h3 className="font-bold text-sm text-white flex items-center justify-between">
                <span>Manage User Accounts</span>
                <ArrowRight className="h-4 w-4 text-slate-500" />
              </h3>
              <p className="text-xs text-slate-400">
                Inspect registered users, manage privileges, and suspend compromised accounts.
              </p>
            </Link>

            <Link
              href="/admin/vehicles"
              className="bg-slate-950 border border-slate-800 hover:border-slate-700 p-5 rounded-2xl transition-all space-y-2"
            >
              <h3 className="font-bold text-sm text-white flex items-center justify-between">
                <span>Vehicle Fleet Overrides</span>
                <ArrowRight className="h-4 w-4 text-slate-500" />
              </h3>
              <p className="text-xs text-slate-400">
                Filter by vehicle type, search registration numbers, or neutralize problematic QR codes.
              </p>
            </Link>

            <Link
              href="/admin/reports"
              className="bg-slate-950 border border-slate-800 hover:border-slate-700 p-5 rounded-2xl transition-all space-y-2"
            >
              <h3 className="font-bold text-sm text-white flex items-center justify-between">
                <span>Moderation Queue</span>
                <ArrowRight className="h-4 w-4 text-slate-500" />
              </h3>
              <p className="text-xs text-slate-400">
                Review visitor reports regarding fake stickers, misuse, or illegal parking reports.
              </p>
            </Link>
          </div>

          {/* Recent Reports Table */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Recent Moderation Reports
              </h2>
              <Link href="/admin/reports" className="text-xs text-rose-400 hover:underline">
                View all reports
              </Link>
            </div>

            {recentReports.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                Clean queue. No reported vehicles or QR codes.
              </p>
            ) : (
              <div className="space-y-3">
                {recentReports.map((r) => (
                  <div
                    key={r.id}
                    className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs"
                  >
                    <div className="space-y-1">
                      <div className="font-bold text-white flex items-center gap-2">
                        <Flag className="h-3.5 w-3.5 text-rose-500" />
                        <span>Reason: {r.reason}</span>
                      </div>
                      <div className="text-slate-400">
                        Vehicle: {r.vehicle?.registration_number || "Unassigned"} • Logged {formatTimeAgo(r.created_at)}
                      </div>
                      {r.details && (
                        <p className="text-slate-300 italic">&ldquo;{r.details}&rdquo;</p>
                      )}
                    </div>

                    <Badge variant={r.status === "pending" ? "destructive" : "secondary"}>
                      {r.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

