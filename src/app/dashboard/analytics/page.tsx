"use client";

import React, { useEffect, useState } from "react";
import {
  TrendingUp,
  Eye,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

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
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="pb-4 border-b border-border">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Vehicle & QR analytics
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Privacy-conscious telemetry: view interactions without tracking individual visitors.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-xl p-4 space-y-1">
              <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                <span>Total scans</span>
                <Eye className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-mono font-bold text-foreground">{totalScans}</div>
              <p className="text-[11px] text-muted-foreground">
                Lifetime QR views across all vehicles
              </p>
            </div>

            <div className="bg-card border border-border rounded-xl p-4 space-y-1">
              <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                <span>Parking alerts</span>
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              </div>
              <div className="text-2xl font-mono font-bold text-foreground">{totalAlerts}</div>
              <p className="text-[11px] text-muted-foreground">
                Assistance alerts submitted by passersby
              </p>
            </div>

            <div className="bg-card border border-border rounded-xl p-4 space-y-1">
              <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                <span>Scan conversion</span>
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-mono font-bold text-foreground">
                {totalScans > 0 ? ((totalAlerts / totalScans) * 100).toFixed(1) : "0"}%
              </div>
              <p className="text-[11px] text-muted-foreground">
                Scans resulting in an active alert
              </p>
            </div>
          </div>

          {/* Scans per Vehicle Breakdown */}
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h2 className="text-sm font-semibold text-foreground">
              Scans and alerts per vehicle
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
                        <span className="font-mono font-semibold text-foreground">
                          {v.reg} ({v.brand} {v.model})
                        </span>
                        <span className="text-muted-foreground font-mono text-[11px]">
                          {v.scans} scans / {v.alerts} alerts
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-600 rounded-full"
                          style={{ width: `${Math.max(scanPct, 3)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Privacy Guarantee */}
          <div className="bg-muted border border-border rounded-xl p-4 flex items-start gap-3 text-xs">
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-semibold text-foreground">
                Zero personal surveillance guarantee
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
