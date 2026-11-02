"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { QrCode, Search, RefreshCw, AlertTriangle, ExternalLink, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { generateSecureToken } from "@/lib/qr";
import type { VehicleQRCode, Vehicle } from "@/types/database";

interface AdminQRWithVehicle extends VehicleQRCode {
  vehicle?: Vehicle;
}

export default function AdminQRCodesPage() {
  const toast = useToast();
  const [qrs, setQrs] = useState<AdminQRWithVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let isMounted = true;
    async function loadQRs() {
      try {
        setLoading(true);
        const supabase = createClient();
        const { data } = await supabase
          .from("vehicle_qr_codes")
          .select("*, vehicle:vehicles(*)")
          .order("created_at", { ascending: false });

        if (isMounted && data) {
          setQrs(data as any);
        }
      } catch (err) {
        console.error("Admin QR load error", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadQRs();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleAdminRotate = async (qrId: string, vehicleId: string) => {
    const newToken = generateSecureToken(10);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("vehicle_qr_codes")
        .update({
          token: newToken,
          status: "active",
          updated_at: new Date().toISOString(),
        })
        .eq("id", qrId);

      if (error) throw error;

      // Audit log
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await supabase.from("admin_audit_logs").insert({
          admin_id: user.id,
          action: "ADMIN_ROTATE_TOKEN",
          target_type: "vehicle_qr_code",
          target_id: qrId,
          metadata: { new_token: newToken },
        });
      }

      setQrs((prev) =>
        prev.map((q) => (q.id === qrId ? { ...q, token: newToken, status: "active" } : q))
      );
      toast.success(`Token successfully rotated to ${newToken}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to rotate token");
    }
  };

  const filtered = qrs.filter(
    (q) =>
      q.token.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.vehicle?.registration_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">QR Code Registry</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Cryptographic public tokens, scan counters, and neutralization controls.
          </p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
        <Input
          placeholder="Search by token or vehicle registration..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 bg-slate-950 border-slate-800 text-white text-xs"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-16 rounded-xl bg-slate-800" />
          <Skeleton className="h-16 rounded-xl bg-slate-800" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 text-xs">
          No QR tokens found.
        </div>
      ) : (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase font-semibold">
              <tr>
                <th className="p-4">Token</th>
                <th className="p-4">Vehicle</th>
                <th className="p-4">Scans</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.map((qr) => (
                <tr key={qr.id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="p-4 font-mono font-bold text-emerald-400">
                    <Link
                      href={`/v/${qr.token}`}
                      target="_blank"
                      className="hover:underline flex items-center gap-1.5"
                    >
                      {qr.token} <ExternalLink className="h-3 w-3 text-slate-400" />
                    </Link>
                  </td>
                  <td className="p-4">
                    <span className="font-mono font-bold text-white">
                      {qr.vehicle?.registration_number}
                    </span>{" "}
                    ({qr.vehicle?.brand} {qr.vehicle?.model})
                  </td>
                  <td className="p-4 font-semibold text-white">{qr.scan_count}</td>
                  <td className="p-4">
                    <Badge
                      variant={qr.status === "active" ? "success" : "destructive"}
                      className="text-[10px]"
                    >
                      {qr.status}
                    </Badge>
                  </td>
                  <td className="p-4 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAdminRotate(qr.id, qr.vehicle_id)}
                      className="text-[11px] h-7 border-slate-700 text-slate-200"
                    >
                      <RefreshCw className="mr-1 h-3 w-3" /> Rotate Token
                    </Button>
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
