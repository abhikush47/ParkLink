"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Car, Search, Filter, ShieldAlert, Check, AlertTriangle, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { formatDate } from "@/lib/utils";
import type { Vehicle, VehicleQRCode } from "@/types/database";

interface AdminVehicle extends Vehicle {
  qr?: VehicleQRCode;
  owner?: { full_name: string; phone_number: string };
}

export default function AdminVehiclesPage() {
  const toast = useToast();
  const [vehicles, setVehicles] = useState<AdminVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    let isMounted = true;
    async function loadAllVehicles() {
      try {
        setLoading(true);
        const supabase = createClient();
        const { data } = await supabase
          .from("vehicles")
          .select("*, qr:vehicle_qr_codes(*), owner:profiles(full_name, phone_number)")
          .order("created_at", { ascending: false });

        if (isMounted && data) {
          setVehicles(data as any);
        }
      } catch (err) {
        console.error("Admin vehicles load error", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadAllVehicles();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleToggleSuspend = async (vehicleId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "suspended" ? "active" : "suspended";
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("vehicles")
        .update({ status: nextStatus })
        .eq("id", vehicleId);

      if (error) throw error;

      // Update QR status as well if suspended
      await supabase
        .from("vehicle_qr_codes")
        .update({ status: nextStatus === "suspended" ? "suspended" : "active" })
        .eq("vehicle_id", vehicleId);

      // Audit log
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await supabase.from("admin_audit_logs").insert({
          admin_id: user.id,
          action: nextStatus === "suspended" ? "SUSPEND_VEHICLE" : "REACTIVATE_VEHICLE",
          target_type: "vehicle",
          target_id: vehicleId,
        });
      }

      setVehicles((prev) =>
        prev.map((v) => (v.id === vehicleId ? { ...v, status: nextStatus as any } : v))
      );
      toast.success(`Vehicle status changed to ${nextStatus}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update vehicle status");
    }
  };

  const filtered = vehicles.filter((v) => {
    const matchesSearch =
      v.registration_number.toLowerCase().includes(query.toLowerCase()) ||
      v.brand.toLowerCase().includes(query.toLowerCase()) ||
      v.model.toLowerCase().includes(query.toLowerCase());
    const matchesType = typeFilter === "all" || v.vehicle_type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Platform Vehicle Fleet</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Inspect all registered vehicles across university and commercial parking zones.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search by registration number, brand, model..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 bg-slate-950 border-slate-800 text-white text-xs"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="text-xs bg-slate-950 border border-slate-800 text-white rounded-md px-3 py-1.5 focus:outline-none"
        >
          <option value="all">All Vehicle Types</option>
          <option value="Car">Car</option>
          <option value="SUV">SUV</option>
          <option value="Motorcycle">Motorcycle</option>
          <option value="Scooter">Scooter</option>
          <option value="Van">Van</option>
          <option value="Truck">Truck</option>
          <option value="Other">Other</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-16 rounded-xl bg-slate-800" />
          <Skeleton className="h-16 rounded-xl bg-slate-800" />
          <Skeleton className="h-16 rounded-xl bg-slate-800" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 text-xs">
          No vehicles found.
        </div>
      ) : (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase font-semibold">
              <tr>
                <th className="p-4">Reg Number</th>
                <th className="p-4">Vehicle Details</th>
                <th className="p-4">Owner</th>
                <th className="p-4">QR Token</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.map((v) => (
                <tr key={v.id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="p-4 font-mono font-bold text-white">
                    {v.registration_number}
                  </td>
                  <td className="p-4">
                    {v.brand} {v.model} • <span className="text-slate-400">{v.color} ({v.vehicle_type})</span>
                  </td>
                  <td className="p-4">
                    {v.owner?.full_name || "Unknown"}
                  </td>
                  <td className="p-4 font-mono text-slate-400">
                    {v.qr?.token ? (
                      <Link
                        href={`/v/${v.qr.token}`}
                        target="_blank"
                        className="text-emerald-400 hover:underline flex items-center gap-1"
                      >
                        {v.qr.token} <ExternalLink className="h-3 w-3" />
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="p-4">
                    <Badge
                      variant={
                        v.status === "active"
                          ? "success"
                          : v.status === "suspended"
                          ? "destructive"
                          : "secondary"
                      }
                      className="text-[10px]"
                    >
                      {v.status}
                    </Badge>
                  </td>
                  <td className="p-4 text-right">
                    <Button
                      variant={v.status === "suspended" ? "default" : "destructive"}
                      size="sm"
                      onClick={() => handleToggleSuspend(v.id, v.status)}
                      className="text-[11px] h-7"
                    >
                      {v.status === "suspended" ? "Reactivate" : "Suspend"}
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

