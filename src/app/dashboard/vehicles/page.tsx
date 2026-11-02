"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Car,
  Plus,
  Search,
  QrCode,
  ExternalLink,
  Bike,
  Truck,
  MapPin,
  Palette,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Vehicle, VehicleQRCode } from "@/types/database";

interface VehicleWithQR extends Vehicle {
  qr?: VehicleQRCode;
}

const getVehicleIcon = (type: string) => {
  switch (type) {
    case "Motorcycle":
    case "Scooter":
      return <Bike className="h-4 w-4" />;
    case "Truck":
    case "Van":
      return <Truck className="h-4 w-4" />;
    default:
      return <Car className="h-4 w-4" />;
  }
};

export default function VehiclesListPage() {
  const [vehicles, setVehicles] = useState<VehicleWithQR[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    let isMounted = true;
    async function loadVehicles() {
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

          if (isMounted && data) {
            setVehicles(data as any);
          }
        }
      } catch (err) {
        console.error("Failed to load vehicles", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadVehicles();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredVehicles = vehicles.filter((v) => {
    const matchesSearch =
      v.registration_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.model.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || v.vehicle_type === typeFilter;
    const matchesStatus = statusFilter === "all" || v.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const activeCount = vehicles.filter((v) => v.status === "active").length;
  const totalScans = vehicles.reduce((sum, v) => sum + (v.qr?.scan_count || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner - Console Minimal */}
      <div className="rounded-2xl border border-border bg-card p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-md bg-muted px-2.5 py-1 text-xs text-foreground font-mono">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Vehicle registry</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Vehicle fleet management
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
            Manage your registered cars, bikes, and utility vehicles. Configure individual privacy guards, view live scan telemetry, and customize dynamic windshield passes.
          </p>
        </div>

        <div>
          <Link href="/dashboard/vehicles/new">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs h-10 px-4">
              <Plus className="mr-1.5 h-4 w-4" /> Add vehicle
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Micro-Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground font-medium">
            Total registered
          </div>
          <div className="text-2xl font-mono font-bold text-foreground mt-1">
            {vehicles.length}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground font-medium">
            Active on-road
          </div>
          <div className="text-2xl font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {activeCount}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground font-medium">
            Total QR scans
          </div>
          <div className="text-2xl font-mono font-bold text-foreground mt-1">
            {totalScans}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground font-medium">
            Privacy protection
          </div>
          <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" /> Direct numbers masked
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="rounded-xl border border-border bg-card p-3 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by license plate, brand, or model..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs bg-muted border-border h-9 rounded-lg"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs bg-muted border border-border rounded-lg px-3 h-9 text-foreground focus:outline-none"
          >
            <option value="all">All vehicle types</option>
            <option value="Car">Car</option>
            <option value="SUV">SUV</option>
            <option value="Motorcycle">Motorcycle</option>
            <option value="Scooter">Scooter</option>
            <option value="Van">Van</option>
            <option value="Truck">Truck</option>
            <option value="Other">Other</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-muted border border-border rounded-lg px-3 h-9 text-foreground focus:outline-none"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="sold">Sold</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Vehicle Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-60 rounded-xl" />
          <Skeleton className="h-60 rounded-xl" />
          <Skeleton className="h-60 rounded-xl" />
        </div>
      ) : filteredVehicles.length === 0 ? (
        <div className="bg-card border border-border border-dashed rounded-xl p-16 text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <Car className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-foreground">No vehicles found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
            {searchQuery || typeFilter !== "all" || statusFilter !== "all"
              ? "No vehicles matched your filter. Try adjusting your query."
              : "You have not registered any vehicles yet. Add a vehicle to generate its dynamic QR pass."}
          </p>
          <Link href="/dashboard/vehicles/new">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Register vehicle
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVehicles.map((vehicle) => {
            const qrToken = vehicle.qr?.token;
            return (
              <div
                key={vehicle.id}
                className="rounded-xl border border-border bg-card p-5 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Top Row: Type Pill & Status Badge */}
                  <div className="flex items-center justify-between">
                    <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      {getVehicleIcon(vehicle.vehicle_type)}
                      <span>{vehicle.vehicle_type}</span>
                    </div>

                    <Badge
                      variant={
                        vehicle.status === "active"
                          ? "success"
                          : vehicle.status === "suspended"
                          ? "destructive"
                          : "secondary"
                      }
                      className="text-[10px] font-mono capitalize"
                    >
                      {vehicle.status}
                    </Badge>
                  </div>

                  {/* License Plate Element */}
                  <div className="inline-flex items-center rounded-lg border border-border bg-muted px-3 py-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold text-muted-foreground">IND</span>
                      <span className="font-mono text-sm font-bold text-foreground">
                        {vehicle.registration_number}
                      </span>
                    </div>
                  </div>

                  {/* Brand & Model */}
                  <div>
                    <h3 className="text-base font-semibold text-foreground">
                      {vehicle.brand} {vehicle.model}
                    </h3>
                  </div>

                  {/* Specs / Meta */}
                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-border">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Palette className="h-3.5 w-3.5" />
                      <span>{vehicle.color || "Standard"}</span>
                    </div>

                    {vehicle.parking_location ? (
                      <div className="flex items-center gap-1.5 text-muted-foreground truncate" title={vehicle.parking_location}>
                        <MapPin className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">{vehicle.parking_location}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <QrCode className="h-3.5 w-3.5" />
                        <span className="font-mono">{vehicle.qr?.scan_count || 0} scans</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Action Bar */}
                <div className="pt-4 mt-3 border-t border-border flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    {qrToken && (
                      <Link href={`/v/${qrToken}`} target="_blank" title="View Public Profile">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </Link>
                    )}
                    <Link href="/dashboard/qr" title="Open QR Studio">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                      >
                        <QrCode className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>

                  <Link href={`/dashboard/vehicles/${vehicle.id}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-8 font-medium"
                    >
                      <span>Manage</span>
                      <ChevronRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
