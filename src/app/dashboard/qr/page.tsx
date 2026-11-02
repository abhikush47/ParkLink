"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  QrCode,
  Download,
  Copy,
  Check,
  RefreshCw,
  FileText,
  Car,
  ShieldCheck,
  ExternalLink,
  Layers,
  Sparkles,
  Printer,
  Eye,
  Info,
  CheckCircle2,
  Scan,
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
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/40 via-card to-card p-6 md:p-8 backdrop-blur-xl">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Dynamic QR Studio & Windshield Kit</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Dynamic QR Stickers
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
              Generate, preview, customize, and export high-resolution vector stickers and windshield cards. Your dynamic code remains constant even when you update contact numbers or privacy preferences.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-border bg-card/60 px-4 py-3 backdrop-blur-md">
              <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Fleet Scans
              </div>
              <div className="text-xl font-mono font-bold text-emerald-400">
                {totalScans}
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-card/60 px-4 py-3 backdrop-blur-md">
              <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Active Stickers
              </div>
              <div className="text-xl font-mono font-bold text-foreground">
                {vehicles.filter((v) => v.status === "active").length} / {vehicles.length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <Skeleton className="md:col-span-4 h-96 rounded-3xl" />
          <Skeleton className="md:col-span-8 h-[600px] rounded-3xl" />
        </div>
      ) : vehicles.length === 0 ? (
        <div className="bg-card border border-border border-dashed rounded-3xl p-16 text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <QrCode className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-foreground">No vehicles registered yet</h3>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            Register your car, bike, or commercial vehicle to generate its dedicated permanent dynamic QR code.
          </p>
          <Link href="/dashboard/vehicles/new">
            <Button className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-6 shadow-lg shadow-emerald-950/30">
              Register First Vehicle
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Vehicle Selector list & Windshield Guidelines */}
          <div className="lg:col-span-4 space-y-6">
            <div className="rounded-3xl border border-border bg-card p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Select Vehicle ({vehicles.length})
                </h2>
                <Link
                  href="/dashboard/vehicles/new"
                  className="text-xs text-emerald-500 hover:text-emerald-400 font-semibold"
                >
                  + Add New
                </Link>
              </div>

              <div className="space-y-2.5">
                {vehicles.map((v) => {
                  const isSelected = v.id === selectedVehicleId;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVehicleId(v.id)}
                      className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between group ${
                        isSelected
                          ? "border-emerald-500 bg-emerald-950/20 ring-1 ring-emerald-500 shadow-md shadow-emerald-950/20"
                          : "border-border/80 bg-background/50 hover:bg-muted/40 hover:border-border"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-11 w-11 rounded-xl flex items-center justify-center transition-colors ${
                            isSelected
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : "bg-muted text-muted-foreground group-hover:text-foreground"
                          }`}
                        >
                          <Car className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-foreground">
                            {v.brand} {v.model}
                          </div>
                          <div className="text-xs text-muted-foreground font-mono font-semibold">
                            {v.registration_number}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <Badge
                          variant={v.status === "active" ? "success" : "secondary"}
                          className="text-[10px] font-mono capitalize"
                        >
                          {v.status}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {v.qr?.scan_count || 0} scans
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Windshield Placement Guide */}
            <div className="rounded-3xl border border-border/80 bg-card/60 p-5 space-y-3.5 text-xs backdrop-blur-sm">
              <div className="flex items-center gap-2 font-bold text-foreground">
                <Printer className="h-4 w-4 text-emerald-400" />
                <span>Recommended Windshield Placement</span>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                For optimal scanning under streetlights and direct sunlight:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                  <span>Place sticker in the <strong>bottom-left or bottom-right corner</strong> of front windshield.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                  <span>Maintain a 50mm clearance from tinted windshield sun-strips.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                  <span>Printed PDF output is scaled to standard <strong>3.5 × 2.5 inch</strong> automotive adhesive vinyl specs.</span>
                </li>
              </ul>
            </div>

            {/* Security Guarantee */}
            <div className="rounded-3xl border border-emerald-500/20 bg-emerald-950/20 p-5 space-y-2.5 text-xs text-emerald-300">
              <div className="flex items-center gap-2 font-bold text-emerald-400">
                <ShieldCheck className="h-4 w-4" />
                <span>Permanent Privacy Architecture</span>
              </div>
              <p className="text-emerald-200/80 leading-relaxed">
                Your sticker encodes strictly an opaque HTTPS URL. No mobile number or home address is stored inside the barcode. If you ever misplace a car or sell it, rotate the token instantly without affecting your account.
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
              <div className="bg-card border border-border rounded-3xl p-16 text-center text-muted-foreground">
                Select a vehicle from the left menu to view and download its dynamic QR sticker.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

