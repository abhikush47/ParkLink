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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">My Vehicles</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage your registered vehicles, privacy controls, and dynamic QR stickers.
          </p>
        </div>
        <Link href="/dashboard/vehicles/new">
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 font-semibold">
            <Plus className="mr-1.5 h-4 w-4" /> Add Vehicle
          </Button>
        </Link>
      </div>

      {/* Filters & Search */}
      <div className="bg-card border border-border rounded-xl p-4 flex flex-col md:flex-row gap-3 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by registration number, brand, model..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs bg-background border border-input rounded-md px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">All Types</option>
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
            className="text-xs bg-background border border-input rounded-md px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="sold">Sold</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Vehicle Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-56 rounded-2xl" />
          <Skeleton className="h-56 rounded-2xl" />
          <Skeleton className="h-56 rounded-2xl" />
        </div>
      ) : filteredVehicles.length === 0 ? (
        <div className="bg-card border border-border border-dashed rounded-2xl p-12 text-center space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-muted-foreground">
            <Car className="h-7 w-7" />
          </div>
          <h3 className="text-base font-bold text-foreground">No vehicles found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {searchQuery || typeFilter !== "all" || statusFilter !== "all"
              ? "No vehicles matched your current filter criteria."
              : "You haven't registered any vehicles yet. Click below to add one."}
          </p>
          <Link href="/dashboard/vehicles/new">
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs mt-2">
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
                className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:border-emerald-500/50 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar */}
                  <div className="bg-muted/40 p-4 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                        <Car className="h-4 w-4" />
                      </span>
                      <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                        {vehicle.vehicle_type}
                      </span>
                    </div>
                    <Badge
                      variant={
                        vehicle.status === "active"
                          ? "success"
                          : vehicle.status === "suspended"
                          ? "destructive"
                          : "secondary"
                      }
                      className="text-[10px]"
                    >
                      {vehicle.status}
                    </Badge>
                  </div>

                  {/* Body Info */}
                  <div className="p-5 space-y-3">
                    <div>
                      <h3 className="text-lg font-bold text-foreground">
                        {vehicle.brand} {vehicle.model}
                      </h3>
                      <div className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">
                        {vehicle.registration_number}
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>Color: <strong className="text-foreground">{vehicle.color}</strong></div>
                      {vehicle.parking_location && (
                        <div>Bay: <strong className="text-foreground">{vehicle.parking_location}</strong></div>
                      )}
                      <div>QR Scans: <strong className="text-foreground">{vehicle.qr?.scan_count || 0}</strong></div>
                    </div>
                  </div>
                </div>

                {/* Footer Quick Links */}
                <div className="p-4 bg-muted/20 border-t border-border flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {qrToken && (
                      <Link href={`/v/${qrToken}`} target="_blank">
                        <Button variant="ghost" size="sm" className="h-8 text-xs px-2" title="View Public Profile">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    )}
                    <Link href={`/dashboard/qr`}>
                      <Button variant="ghost" size="sm" className="h-8 text-xs px-2" title="Manage QR">
                        <QrCode className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>

                  <Link href={`/dashboard/vehicles/${vehicle.id}`}>
                    <Button variant="outline" size="sm" className="h-8 text-xs">
                      Manage Details
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

