"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Car,
  Plus,
  Search,
  Filter,
  QrCode,
  ExternalLink,
  Edit,
  Trash2,
  Bike,
  Truck,
  ShieldAlert,
  MapPin,
  Palette,
  Eye,
  Sliders,
  CheckCircle2,
  AlertTriangle,
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
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/40 via-card to-card p-6 md:p-8 backdrop-blur-xl">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Registered Fleet Registry</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Vehicle Fleet Management
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
              Manage your registered cars, bikes, and utility vehicles. Configure individual privacy guards, view live scan telemetry, and customize dynamic windshield passes.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/dashboard/vehicles/new">
              <Button className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs h-10 px-5 shadow-lg shadow-emerald-950/30 transition-all">
                <Plus className="mr-1.5 h-4 w-4" /> Add Vehicle
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Micro-Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Total Registered
          </div>
          <div className="text-2xl font-mono font-bold text-foreground mt-1">
            {vehicles.length}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Active On-Road
          </div>
          <div className="text-2xl font-mono font-bold text-emerald-400 mt-1">
            {activeCount}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Total QR Scans
          </div>
          <div className="text-2xl font-mono font-bold text-sky-400 mt-1">
            {totalScans}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Protected Status
          </div>
          <div className="text-xs font-semibold text-emerald-400 mt-2 flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" /> 100% Privacy Enabled
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="rounded-2xl border border-border bg-card p-3 md:p-4 flex flex-col md:flex-row gap-3 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by registration plate, brand, or model..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 text-xs bg-background/60 border-border/80 h-10 rounded-xl"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs bg-background/80 border border-border rounded-xl px-3 h-10 text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
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

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-background/80 border border-border rounded-xl px-3 h-10 text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="sold">Sold</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Vehicle Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 rounded-3xl" />
          <Skeleton className="h-64 rounded-3xl" />
          <Skeleton className="h-64 rounded-3xl" />
        </div>
      ) : filteredVehicles.length === 0 ? (
        <div className="bg-card border border-border border-dashed rounded-3xl p-16 text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <Car className="h-8 w-8" />
          </div>
          <h3 className="text-base font-bold text-foreground">No vehicles found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
            {searchQuery || typeFilter !== "all" || statusFilter !== "all"
              ? "No vehicles matched your current filter criteria. Try resetting your search filters."
              : "You haven't added any vehicles to your garage yet. Register your vehicle to generate its dynamic QR pass."}
          </p>
          <Link href="/dashboard/vehicles/new">
            <Button className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold">
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Register Vehicle
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVehicles.map((vehicle) => {
            const qrToken = vehicle.qr?.token;
            return (
              <div
                key={vehicle.id}
                className="group relative rounded-3xl border border-border/80 bg-card/80 p-5 backdrop-blur-xl shadow-sm hover:shadow-xl hover:border-emerald-500/50 transition-all flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Top Row: Type Pill & Status Badge */}
                  <div className="flex items-center justify-between">
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/60 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                      {getVehicleIcon(vehicle.vehicle_type)}
                      <span>{vehicle.vehicle_type}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {vehicle.status === "active" && (
                        <span className="flex h-2 w-2 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                        </span>
                      )}
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
                  </div>

                  {/* License Plate Element */}
                  <div className="relative inline-flex items-center rounded-xl border border-slate-700 bg-slate-900/90 px-3.5 py-2 shadow-inner">
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col items-center justify-center bg-blue-700 text-white text-[8px] font-bold px-1.5 py-0.5 rounded leading-tight">
                        <span>IND</span>
                      </div>
                      <span className="font-mono text-base font-extrabold tracking-wider text-slate-100 uppercase">
                        {vehicle.registration_number}
                      </span>
                    </div>
                  </div>

                  {/* Brand & Model */}
                  <div>
                    <h3 className="text-lg font-bold text-foreground tracking-tight group-hover:text-emerald-400 transition-colors">
                      {vehicle.brand} {vehicle.model}
                    </h3>
                  </div>

                  {/* Specs / Meta */}
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/50">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Palette className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{vehicle.color || "Standard"}</span>
                    </div>

                    {vehicle.parking_location ? (
                      <div className="flex items-center gap-1.5 text-muted-foreground truncate" title={vehicle.parking_location}>
                        <MapPin className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate">{vehicle.parking_location}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <QrCode className="h-3.5 w-3.5 text-sky-400" />
                        <span className="font-mono">{vehicle.qr?.scan_count || 0} scans</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Action Bar */}
                <div className="pt-5 mt-4 border-t border-border flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {qrToken && (
                      <Link href={`/v/${qrToken}`} target="_blank" title="View Public Profile">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground rounded-lg"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </Link>
                    )}
                    <Link href="/dashboard/qr" title="Open QR Studio">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground rounded-lg"
                      >
                        <QrCode className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>

                  <Link href={`/dashboard/vehicles/${vehicle.id}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-8 rounded-xl font-medium border-border/80 group-hover:border-emerald-500/50"
                    >
                      <span>Settings</span>
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

