"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  QrCode,
  Car,
  ShieldCheck,
  Printer,
  CheckCircle2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { QRCodeDisplay } from "@/components/qr-code-display";
import type { Vehicle, VehicleQRCode } from "@/types/database";

interface VehicleWithQR extends Vehicle {
  qr?: VehicleQRCode;
}

export default function QRManagementPage() {
  const [vehicles, setVehicles] = useState<VehicleWithQR[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setLoading(true);
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data } = await supabase
            .from("vehicles")
            .select("*, qr:vehicle_qr_codes(*)")
            .eq("owner_id", user.id)
            .order("created_at", { ascending: false });

          if (isMounted && data && data.length > 0) {
            setVehicles(data as any);
            setSelectedVehicleId(data[0].id);
          }
        }
      } catch (err) {
        console.error("QR management fetch error", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);
  const totalScans = vehicles.reduce((acc, curr) => acc + (curr.qr?.scan_count || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner - Solid Console style */}
      <div className="rounded-2xl border border-border bg-card p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-md bg-muted px-2.5 py-1 text-xs text-foreground font-mono">
            <QrCode className="h-3.5 w-3.5 text-emerald-600" />
            <span>Dynamic QR studio</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Dynamic QR stickers
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
            Generate, customize, and export vector stickers and windshield cards. Your dynamic code remains permanent even when you update contact numbers or privacy preferences.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-border bg-muted/60 px-4 py-3">
            <div className="text-xs font-medium text-muted-foreground">
              Total fleet scans
            </div>
            <div className="text-xl font-mono font-bold text-foreground">
              {totalScans}
            </div>
          </div>
          <div className="rounded-xl border border-border bg-muted/60 px-4 py-3">
            <div className="text-xs font-medium text-muted-foreground">
              Active stickers
            </div>
            <div className="text-xl font-mono font-bold text-foreground">
              {vehicles.filter((v) => v.status === "active").length} / {vehicles.length}
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <Skeleton className="md:col-span-4 h-96 rounded-2xl" />
          <Skeleton className="md:col-span-8 h-[500px] rounded-2xl" />
        </div>
      ) : vehicles.length === 0 ? (
        <div className="bg-card border border-border border-dashed rounded-2xl p-16 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-muted text-muted-foreground border border-border">
            <QrCode className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-foreground">No vehicles registered yet</h3>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            Register your vehicle to generate its dedicated permanent dynamic QR code.
          </p>
          <Link href="/dashboard/vehicles/new">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-5">
              Register first vehicle
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Vehicle Selector list & Windshield Guidelines */}
          <div className="lg:col-span-4 space-y-4">
            <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <span className="text-xs font-semibold text-muted-foreground">
                  Select vehicle ({vehicles.length})
                </span>
                <Link
                  href="/dashboard/vehicles/new"
                  className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
                >
                  + Add new
                </Link>
              </div>

              <div className="space-y-2">
                {vehicles.map((v) => {
                  const isSelected = v.id === selectedVehicleId;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVehicleId(v.id)}
                      className={`w-full p-3 rounded-xl border text-left transition-colors duration-150 flex items-center justify-between group ${
                        isSelected
                          ? "border-emerald-600 bg-emerald-500/10 text-foreground"
                          : "border-border bg-muted/40 hover:bg-muted text-muted-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-9 w-9 rounded-lg flex items-center justify-center transition-colors duration-150 ${
                            isSelected
                              ? "bg-emerald-600 text-white"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          <Car className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-foreground">
                            {v.brand} {v.model}
                          </div>
                          <div className="text-[11px] font-mono text-muted-foreground">
                            {v.registration_number}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-0.5">
                        <Badge
                          variant={v.status === "active" ? "success" : "secondary"}
                          className="text-[10px] font-mono capitalize"
                        >
                          {v.status}
                        </Badge>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {v.qr?.scan_count || 0} scans
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Windshield Placement Guide */}
            <div className="rounded-2xl border border-border bg-card p-4 space-y-2.5 text-xs">
              <div className="flex items-center gap-2 font-semibold text-foreground">
                <Printer className="h-4 w-4 text-emerald-600" />
                <span>Windshield placement guidance</span>
              </div>
              <ul className="space-y-1.5 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 mt-0.5 shrink-0" />
                  <span>Mount sticker in the lower corner of the front windshield.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 mt-0.5 shrink-0" />
                  <span>Ensure 50mm clearance from tinted windshield sun-strips.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 mt-0.5 shrink-0" />
                  <span>Exported PDF is calibrated for standard 3.5 × 2.5 inch vinyl cuts.</span>
                </li>
              </ul>
            </div>

            {/* Privacy Architecture Guarantee */}
            <div className="rounded-2xl border border-border bg-card p-4 space-y-2 text-xs">
              <div className="flex items-center gap-2 font-semibold text-foreground">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>Zero personal data on sticker</span>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Stickers encode strictly an opaque token URL. Phone numbers are never embedded in the QR image itself.
              </p>
            </div>
          </div>

          {/* Right Column: Interactive QR Code Display */}
          <div className="lg:col-span-8">
            {selectedVehicle && selectedVehicle.qr ? (
              <QRCodeDisplay
                token={selectedVehicle.qr.token}
                vehicleId={selectedVehicle.id}
                vehicleReg={selectedVehicle.registration_number}
                vehicleModel={`${selectedVehicle.brand} ${selectedVehicle.model}`}
                status={selectedVehicle.qr.status}
                scanCount={selectedVehicle.qr.scan_count}
                lastScannedAt={selectedVehicle.qr.last_scanned_at}
                onTokenRotated={(newToken) => {
                  setVehicles((prev) =>
                    prev.map((v) =>
                      v.id === selectedVehicle.id
                        ? { ...v, qr: { ...v.qr!, token: newToken } }
                        : v
                    )
                  );
                }}
              />
            ) : (
              <div className="bg-card border border-border rounded-2xl p-16 text-center text-muted-foreground text-xs">
                Select a vehicle to inspect and download its dynamic QR sticker.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
