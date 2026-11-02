"use client";

import React, { useEffect, useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Eye,
  AlertTriangle,
  PhoneCall,
  MessageCircle,
  Car,
  ShieldCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Vehicle, VehicleQRCode } from "@/types/database";

interface VehicleAnalytics {
  id: string;
  reg: string;
  brand: string;
  model: string;
  scans: number;
  alerts: number;
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState<VehicleAnalytics[]>([]);
  const [totalScans, setTotalScans] = useState(0);
  const [totalAlerts, setTotalAlerts] = useState(0);

  useEffect(() => {
    let isMounted = true;
    async function loadAnalytics() {
      try {
        setLoading(true);
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          // Fetch vehicles with QR & Alert counts
          const { data: vData } = await supabase
            .from("vehicles")
            .select("*, qr:vehicle_qr_codes(*)")
            .eq("owner_id", user.id);

          if (isMounted && vData) {
            const vehicleIds = vData.map((v) => v.id);

            // Fetch alert counts
            const { data: aData } = await supabase
              .from("parking_alerts")
              .select("vehicle_id")
              .in("vehicle_id", vehicleIds);

            const alertCountMap: Record<string, number> = {};
            aData?.forEach((a) => {
              alertCountMap[a.vehicle_id] = (alertCountMap[a.vehicle_id] || 0) + 1;
            });

            let sumScans = 0;
            const mapped = vData.map((v: any) => {
              const scans = v.qr?.scan_count || 0;
              sumScans += scans;
              return {
                id: v.id,
                reg: v.registration_number,
                brand: v.brand,
                model: v.model,
                scans,
                alerts: alertCountMap[v.id] || 0,
              };
            });

            setVehicles(mapped);
            setTotalScans(sumScans);
            setTotalAlerts(aData?.length || 0);
          }
        }
      } catch (err) {
        console.error("Analytics fetch error", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadAnalytics();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Vehicle & QR Analytics
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Privacy-conscious telemetry: view interactions without tracking individual visitors.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Top Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                  Lifetime QR views across all vehicles
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Parking Alerts
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{totalAlerts}</div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Assistance alerts submitted by scanners
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Scan Conversion
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {totalScans > 0 ? ((totalAlerts / totalScans) * 100).toFixed(1) : "0"}%
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Scans resulting in an active alert
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Scans per Vehicle Breakdown */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Scans & Alerts Per Vehicle
            </h2>

            {vehicles.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">
                No vehicles registered yet.
              </p>
            ) : (
              <div className="space-y-4">
                {vehicles.map((v) => {
                  const maxScans = Math.max(...vehicles.map((x) => x.scans), 1);
                  const scanPct = Math.round((v.scans / maxScans) * 100);

                  return (
                    <div key={v.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-foreground font-mono">
                          {v.reg} ({v.brand} {v.model})
                        </span>
                        <span className="text-muted-foreground">
                          <strong className="text-foreground">{v.scans}</strong> scans •{" "}
                          <strong className="text-foreground">{v.alerts}</strong> alerts
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(scanPct, 4)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Privacy Compliance Callout */}
          <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-2xl p-5 flex items-start gap-3 text-xs">
            <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-emerald-900 dark:text-emerald-200">
                Zero Personal Surveillance Guarantee
              </h4>
              <p className="text-muted-foreground leading-relaxed">
                ParkLink analytics only aggregate high-level view actions. We do not track or store
                the GPS locations or phone identities of people who scan your vehicle stickers.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
