"use client";

import React, { useEffect, useState } from "react";
import { AlertTriangle, Search, Filter, ShieldAlert, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatTimeAgo, formatDate } from "@/lib/utils";
import type { ParkingAlert } from "@/types/database";

export default function AdminAlertsPage() {
  const [alerts, setAlerts] = useState<ParkingAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadAllAlerts() {
      try {
        setLoading(true);
        const supabase = createClient();
        const { data } = await supabase
          .from("parking_alerts")
          .select("*, vehicle:vehicles(*)")
          .order("created_at", { ascending: false })
          .limit(100);

        if (isMounted && data) {
          setAlerts(data as any);
        }
      } catch (err) {
        console.error("Admin alerts fetch error", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadAllAlerts();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Global Parking Alerts Monitor
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit parking conflicts, frequency, and potential anti-bot rate limit triggers.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-16 rounded-xl bg-slate-800" />
          <Skeleton className="h-16 rounded-xl bg-slate-800" />
        </div>
      ) : alerts.length === 0 ? (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 text-xs">
          No parking alerts recorded.
        </div>
      ) : (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-medium">
              <tr>
                <th className="p-3.5 pl-4">Vehicle</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Custom message</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 pr-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {alerts.map((a) => (
                <tr key={a.id} className="hover:bg-slate-900/50 transition-colors duration-150">
                  <td className="p-3.5 pl-4 font-mono font-bold text-white">
                    {a.vehicle?.registration_number || "—"}
                  </td>
                  <td className="p-3.5">
                    <span className="font-medium text-amber-400 text-xs capitalize">
                      {a.category.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="p-4 max-w-xs truncate text-slate-300">
                    {a.custom_message || "—"}
                  </td>
                  <td className="p-4">
                    <Badge variant={a.status === "resolved" ? "success" : "warning"} className="text-[10px]">
                      {a.status}
                    </Badge>
                  </td>
                  <td className="p-4 text-slate-400 font-mono text-[11px]">
                    {formatDate(a.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

