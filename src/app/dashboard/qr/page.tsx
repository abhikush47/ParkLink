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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Dynamic QR Management
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Download high-resolution stickers, print windshield cards, or rotate compromised tokens.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <Skeleton className="md:col-span-4 h-64 rounded-2xl" />
          <Skeleton className="md:col-span-8 h-96 rounded-2xl" />
        </div>
      ) : vehicles.length === 0 ? (
        <div className="bg-card border border-border border-dashed rounded-2xl p-12 text-center space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-muted-foreground">
            <QrCode className="h-7 w-7" />
          </div>
          <h3 className="text-base font-bold text-foreground">No vehicles registered yet</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            You must register a vehicle before generating dynamic QR codes.
          </p>
          <Link href="/dashboard/vehicles/new">
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs mt-2">
              Register a Vehicle
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Vehicle Selector list */}
          <div className="lg:col-span-5 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Select Vehicle ({vehicles.length})
            </h2>

            <div className="space-y-2">
              {vehicles.map((v) => {
                const isSelected = v.id === selectedVehicleId;
                return (
                  <div
                    key={v.id}
                    onClick={() => setSelectedVehicleId(v.id)}
                    className={`p-4 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? "border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 ring-1 ring-emerald-600 shadow-sm"
                        : "border-border bg-card hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <Car className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-foreground">
                          {v.brand} {v.model}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono font-bold">
                          {v.registration_number}
                        </div>
                      </div>
                    </div>

                    <Badge
                      variant={v.status === "active" ? "success" : "secondary"}
                      className="text-[10px]"
                    >
                      {v.status}
                    </Badge>
                  </div>
                );
              })}
            </div>

            {/* Architecture Tip Card */}
            <div className="bg-muted/40 border border-border rounded-xl p-4 space-y-2 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-foreground">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>How ParkLink Dynamic QR Works</span>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Your QR sticker never embeds personal contact numbers directly. It contains only an
                opaque token. When someone scans, our server looks up the latest verified profile and
                applies your exact privacy preferences in realtime.
              </p>
            </div>
          </div>

          {/* Right Column: Interactive QR Code Display */}
          <div className="lg:col-span-7">
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
              <div className="bg-card border border-border rounded-2xl p-12 text-center text-muted-foreground">
                Select a vehicle to view and download its dynamic QR sticker.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
