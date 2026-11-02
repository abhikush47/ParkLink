"use client";

import React, { useEffect, useState } from "react";
import { FileText, ShieldCheck, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";
import type { AdminAuditLog } from "@/types/database";

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadLogs() {
      try {
        setLoading(true);
        const supabase = createClient();
        const { data } = await supabase
          .from("admin_audit_logs")
          .select("*, admin:profiles(*)")
          .order("created_at", { ascending: false })
          .limit(100);

        if (isMounted && data) {
          setLogs(data as any);
        }
      } catch (err) {
        console.error("Admin audit logs fetch error", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadLogs();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Administrative Audit Trail
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Immutable log recording administrative access, role elevations, and token revocations.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-16 rounded-xl bg-slate-800" />
          <Skeleton className="h-16 rounded-xl bg-slate-800" />
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 text-xs">
          No audit entries logged yet.
        </div>
      ) : (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase font-semibold">
              <tr>
                <th className="p-4">Action</th>
                <th className="p-4">Admin</th>
                <th className="p-4">Target Type</th>
                <th className="p-4">Target ID</th>
                <th className="p-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="p-4 font-bold text-rose-400 font-sans">{log.action}</td>
                  <td className="p-4 font-sans text-white">{log.admin?.full_name || log.admin_id}</td>
                  <td className="p-4 text-slate-400">{log.target_type}</td>
                  <td className="p-4 text-slate-500 truncate max-w-xs">{log.target_id}</td>
                  <td className="p-4 text-slate-400 text-[11px]">{formatDate(log.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
