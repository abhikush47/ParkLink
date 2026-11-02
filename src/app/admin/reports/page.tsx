"use client";

import React, { useEffect, useState } from "react";
import { Flag, CheckCircle2, ShieldAlert, Check, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { formatDate } from "@/lib/utils";
import type { Report } from "@/types/database";

export default function AdminReportsPage() {
  const toast = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadReports() {
      try {
        setLoading(true);
        const supabase = createClient();
        const { data } = await supabase
          .from("reports")
          .select("*, vehicle:vehicles(*), qr:vehicle_qr_codes(*)")
          .order("created_at", { ascending: false });

        if (isMounted && data) {
          setReports(data as any);
        }
      } catch (err) {
        console.error("Admin reports load error", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadReports();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleResolve = async (reportId: string, status: "resolved" | "dismissed") => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("reports")
        .update({
          status,
          resolved_at: new Date().toISOString(),
        })
        .eq("id", reportId);

      if (error) throw error;

      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status } : r))
      );
      toast.success(`Report marked as ${status}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update report status");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Moderation & Abuse Queue
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Investigate reports submitted regarding vehicle fraud, sticker misuse, or harassment.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-16 rounded-xl bg-slate-800" />
          <Skeleton className="h-16 rounded-xl bg-slate-800" />
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 text-xs">
          No reports pending review.
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((r) => (
            <div
              key={r.id}
              className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-rose-950/60 text-rose-400">
                    <Flag className="h-4 w-4" />
                  </span>
                  <span className="font-bold text-white text-sm uppercase tracking-wide">
                    {r.reason.replace(/_/g, " ")}
                  </span>
                  <Badge variant={r.status === "pending" ? "destructive" : "secondary"} className="text-[10px]">
                    {r.status}
                  </Badge>
                </div>

                <span className="text-[11px] text-slate-400 font-mono">
                  {formatDate(r.created_at)}
                </span>
              </div>

              <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 text-xs text-slate-300">
                <div className="text-slate-400 text-[10px] uppercase font-semibold mb-1">
                  Reported Details:
                </div>
                {r.details || "No additional text details provided."}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                <div className="text-slate-400 font-mono">
                  Vehicle: <strong className="text-white">{r.vehicle?.registration_number || "Unspecified"}</strong>
                </div>

                {r.status === "pending" && (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleResolve(r.id, "resolved")}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8"
                    >
                      <Check className="mr-1 h-3.5 w-3.5" /> Resolve Report
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResolve(r.id, "dismissed")}
                      className="text-xs h-8 border-slate-700 text-slate-300"
                    >
                      Dismiss
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

