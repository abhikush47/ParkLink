"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import {
  ArrowLeft,
  Car,
  QrCode,
  Shield,
  Save,
  Trash2,
  ExternalLink,
  Phone,
  MessageCircle,
  MessageSquare,
  AlertTriangle,
  Lock,
  Eye,
  CheckCircle2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { QRCodeDisplay } from "@/components/qr-code-display";
import type { Vehicle, VehicleContacts, VehicleQRCode } from "@/types/database";

export default function VehicleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const vehicleId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [contacts, setContacts] = useState<VehicleContacts | null>(null);
  const [qrCode, setQrCode] = useState<VehicleQRCode | null>(null);

  const [isSavingInfo, setIsSavingInfo] = useState(false);
  const [isSavingPrivacy, setIsSavingPrivacy] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form states
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [color, setColor] = useState("");
  const [vehicleType, setVehicleType] = useState<any>("Car");
  const [status, setStatus] = useState<any>("active");
  const [parkingLocation, setParkingLocation] = useState("");
  const [description, setDescription] = useState("");

  // Privacy states
  const [showPhone, setShowPhone] = useState(false);
  const [showWhatsApp, setShowWhatsApp] = useState(true);
  const [enableAnonMsg, setEnableAnonMsg] = useState(true);
  const [enableAlerts, setEnableAlerts] = useState(true);
  const [tempPrivacy, setTempPrivacy] = useState(false);
  const [altName, setAltName] = useState("");
  const [altPhone, setAltPhone] = useState("");

  useEffect(() => {
    let isMounted = true;
    async function loadVehicle() {
      if (!vehicleId) return;
      try {
        setLoading(true);
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          // Fetch vehicle
          const { data: vData, error: vErr } = await supabase
            .from("vehicles")
            .select("*")
            .eq("id", vehicleId)
            .eq("owner_id", user.id)
            .single();

          if (vErr || !vData) {
            toast.error("Vehicle not found");
            router.push("/dashboard/vehicles");
            return;
          }

          if (isMounted) {
            setVehicle(vData);
            setBrand(vData.brand);
            setModel(vData.model);
            setColor(vData.color);
            setVehicleType(vData.vehicle_type);
            setStatus(vData.status);
            setParkingLocation(vData.parking_location || "");
            setDescription(vData.description || "");
          }

          // Fetch contacts/privacy
          const { data: cData } = await supabase
            .from("vehicle_contacts")
            .select("*")
            .eq("vehicle_id", vehicleId)
            .single();

          if (isMounted && cData) {
            setContacts(cData);
            setShowPhone(cData.show_phone);
            setShowWhatsApp(cData.show_whatsapp);
            setEnableAnonMsg(cData.enable_anonymous_messages);
            setEnableAlerts(cData.enable_parking_alerts);
            setTempPrivacy(cData.temporary_privacy_mode);
            setAltName(cData.alternate_contact_name || "");
            setAltPhone(cData.alternate_contact_phone || "");
          }

          // Fetch QR
          const { data: qrData } = await supabase
            .from("vehicle_qr_codes")
            .select("*")
            .eq("vehicle_id", vehicleId)
            .single();

          if (isMounted && qrData) {
            setQrCode(qrData);
          }
        }
      } catch (err) {
        console.error("Load vehicle detail error", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadVehicle();
    return () => {
      isMounted = false;
    };
  }, [vehicleId, router, toast]);

  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingInfo(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("vehicles")
        .update({
          brand,
          model,
          color,
          vehicle_type: vehicleType,
          status,
          parking_location: parkingLocation || null,
          description: description || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", vehicleId);

      if (error) throw error;
      toast.success("Vehicle details updated successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to update vehicle");
    } finally {
      setIsSavingInfo(false);
    }
  };

  const handleSavePrivacy = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPrivacy(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("vehicle_contacts")
        .update({
          show_phone: showPhone,
          show_whatsapp: showWhatsApp,
          enable_anonymous_messages: enableAnonMsg,
          enable_parking_alerts: enableAlerts,
          temporary_privacy_mode: tempPrivacy,
          alternate_contact_name: altName || null,
          alternate_contact_phone: altPhone || null,
          updated_at: new Date().toISOString(),
        })
        .eq("vehicle_id", vehicleId);

      if (error) throw error;
      toast.success("Privacy and contact settings updated! Active on your QR code immediately.");
    } catch (err: any) {
      toast.error(err.message || "Failed to update privacy settings");
    } finally {
      setIsSavingPrivacy(false);
    }
  };

  const handleDeleteVehicle = async () => {
    setIsDeleting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("vehicles").delete().eq("id", vehicleId);

      if (error) throw error;
      toast.success("Vehicle removed from account");
      router.push("/dashboard/vehicles");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete vehicle");
      setIsDeleting(false);
    }
  };

  if (loading || !vehicle) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <Skeleton className="lg:col-span-8 h-96 rounded-2xl" />
          <Skeleton className="lg:col-span-4 h-96 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Back button */}
      <div>
        <Link
          href="/dashboard/vehicles"
          className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground font-semibold"
        >
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back to My Vehicles
        </Link>
      </div>

      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/40 via-card to-card p-6 md:p-8 backdrop-blur-xl">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative inline-flex items-center rounded-xl border border-slate-700 bg-slate-900/90 px-3 py-1.5 shadow-inner">
                <div className="flex items-center gap-2">
                  <div className="flex flex-col items-center justify-center bg-blue-700 text-white text-[8px] font-bold px-1 py-0.5 rounded leading-tight">
                    <span>IND</span>
                  </div>
                  <span className="font-mono text-base font-extrabold tracking-wider text-slate-100 uppercase">
                    {vehicle.registration_number}
                  </span>
                </div>
              </div>

              <Badge
                variant={status === "active" ? "success" : "secondary"}
                className="text-xs font-mono capitalize"
              >
                {status}
              </Badge>

              <span className="text-xs text-muted-foreground font-mono">
                {vehicleType} • {color}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {brand} {model}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
              Configure telemetry, driver contact permissions, and emergency parking alert responders.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {qrCode && (
              <Link href={`/v/${qrCode.token}`} target="_blank">
                <Button variant="outline" className="text-xs font-semibold rounded-xl border-border/80 hover:bg-muted">
                  <ExternalLink className="mr-1.5 h-3.5 w-3.5 text-emerald-400" /> Public Pass
                </Button>
              </Link>
            )}
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteModalOpen(true)}
              className="h-10 px-3 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30"
              title="Delete Vehicle"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Live Public Simulator Pill Bar */}
      <div className="rounded-2xl border border-border bg-card p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs">
          <Eye className="h-4 w-4 text-emerald-400 shrink-0" />
          <span className="font-semibold text-foreground">Active Public Scanner View:</span>
          <span className="text-muted-foreground">What a stranger sees right now when scanning:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {tempPrivacy ? (
            <Badge variant="destructive" className="text-[10px]">
              🔒 Emergency Privacy Active (All Contacts Muted)
            </Badge>
          ) : (
            <>
              <Badge variant={showPhone ? "success" : "secondary"} className="text-[10px]">
                {showPhone ? "✓ Direct Call" : "✕ Call Hidden"}
              </Badge>
              <Badge variant={showWhatsApp ? "success" : "secondary"} className="text-[10px]">
                {showWhatsApp ? "✓ WhatsApp" : "✕ WhatsApp Hidden"}
              </Badge>
              <Badge variant={enableAlerts ? "success" : "secondary"} className="text-[10px]">
                {enableAlerts ? "✓ 1-Tap Alerts" : "✕ Alerts Off"}
              </Badge>
              <Badge variant={enableAnonMsg ? "success" : "secondary"} className="text-[10px]">
                {enableAnonMsg ? "✓ Masked Chat" : "✕ Chat Off"}
              </Badge>
            </>
          )}
        </div>
      </div>

      {/* Main Grid: Forms on left, Dynamic QR on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Vehicle Details Form & Privacy Settings */}
        <div className="lg:col-span-7 space-y-8">
          {/* Edit Information Form */}
          <form onSubmit={handleSaveInfo} className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Car className="h-4 w-4 text-emerald-600" /> Vehicle Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">Brand</label>
                <Input value={brand} onChange={(e) => setBrand(e.target.value)} required />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">Model</label>
                <Input value={model} onChange={(e) => setModel(e.target.value)} required />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">Color</label>
                <Input value={color} onChange={(e) => setColor(e.target.value)} required />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">Type</label>
                <select
                  value={vehicleType}
                  onChange={(e: any) => setVehicleType(e.target.value)}
                  className="w-full text-xs bg-background border border-input rounded-md px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="Car">Car</option>
                  <option value="SUV">SUV</option>
                  <option value="Motorcycle">Motorcycle</option>
                  <option value="Scooter">Scooter</option>
                  <option value="Van">Van</option>
                  <option value="Truck">Truck</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e: any) => setStatus(e.target.value)}
                  className="w-full text-xs bg-background border border-input rounded-md px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Temporarily Inactive</option>
                  <option value="sold">Sold</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Parking Location / Bay
              </label>
              <Input
                value={parkingLocation}
                onChange={(e) => setParkingLocation(e.target.value)}
                placeholder="e.g. Basement B2, Bay 14"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Description / Note
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Identifying marks or parking note"
                className="w-full text-xs rounded-lg border border-input bg-background p-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <Button type="submit" isLoading={isSavingInfo} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
                <Save className="mr-1.5 h-3.5 w-3.5" /> Save Changes
              </Button>
            </div>
          </form>

          {/* Privacy & Contact Settings Form */}
          <form onSubmit={handleSavePrivacy} className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Shield className="h-4 w-4 text-emerald-600" /> Contact & Privacy Controls
              </h2>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full font-medium">
                Live Cloud Sync
              </span>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Configure what happens when someone scans your vehicle&apos;s QR code. Updates take effect
              instantly without needing to print a new sticker.
            </p>

            {/* Toggle list */}
            <div className="space-y-3">
              {/* Toggle 1: Direct Phone */}
              <label className="flex items-center justify-between p-3.5 rounded-xl border border-border hover:bg-muted/30 cursor-pointer transition-colors">
                <div className="space-y-0.5 pr-4">
                  <div className="text-xs font-semibold text-foreground flex items-center gap-2">
                    <Phone className="h-4 w-4 text-emerald-600" />
                    <span>Show Direct Call Button</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Allows visitors to call your primary or alternate number directly via telephone link.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={showPhone}
                  onChange={(e) => setShowPhone(e.target.checked)}
                  className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
              </label>

              {/* Toggle 2: WhatsApp */}
              <label className="flex items-center justify-between p-3.5 rounded-xl border border-border hover:bg-muted/30 cursor-pointer transition-colors">
                <div className="space-y-0.5 pr-4">
                  <div className="text-xs font-semibold text-foreground flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-green-600" />
                    <span>Show WhatsApp Contact Link</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Opens WhatsApp chat with pre-filled vehicle details.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={showWhatsApp}
                  onChange={(e) => setShowWhatsApp(e.target.checked)}
                  className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
              </label>

              {/* Toggle 3: Parking Alerts */}
              <label className="flex items-center justify-between p-3.5 rounded-xl border border-border hover:bg-muted/30 cursor-pointer transition-colors">
                <div className="space-y-0.5 pr-4">
                  <div className="text-xs font-semibold text-foreground flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <span>Enable 1-Tap Parking Alerts</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Allows visitors to report blocking vehicles, open windows, or lights on without calling.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={enableAlerts}
                  onChange={(e) => setEnableAlerts(e.target.checked)}
                  className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
              </label>

              {/* Toggle 4: Anonymous Messages */}
              <label className="flex items-center justify-between p-3.5 rounded-xl border border-border hover:bg-muted/30 cursor-pointer transition-colors">
                <div className="space-y-0.5 pr-4">
                  <div className="text-xs font-semibold text-foreground flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-slate-700 dark:text-slate-300" />
                    <span>Enable Anonymous Contact Relay</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Allows visitor messages to reach your notification centre without disclosing numbers.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={enableAnonMsg}
                  onChange={(e) => setEnableAnonMsg(e.target.checked)}
                  className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
              </label>

              {/* Toggle 5: Temporary Privacy Mode */}
              <label className="flex items-center justify-between p-3.5 rounded-xl border border-amber-300/40 bg-amber-50/30 dark:bg-amber-950/20 cursor-pointer">
                <div className="space-y-0.5 pr-4">
                  <div className="text-xs font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    <span>Temporary Privacy Mode (Emergency Mute)</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Temporarily disables all public contact buttons while keeping the vehicle profile active.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={tempPrivacy}
                  onChange={(e) => setTempPrivacy(e.target.checked)}
                  className="h-4 w-4 rounded text-amber-600 focus:ring-amber-500"
                />
              </label>
            </div>

            {/* Alternate Contact Person */}
            <div className="pt-2 border-t border-border space-y-3">
              <h3 className="text-xs font-semibold text-foreground">Alternate / Emergency Contact Person</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-muted-foreground block mb-1">Contact Name</label>
                  <Input
                    value={altName}
                    onChange={(e) => setAltName(e.target.value)}
                    placeholder="e.g. Spouse, Roommate, Driver"
                    className="text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground block mb-1">Contact Phone</label>
                  <Input
                    value={altPhone}
                    onChange={(e) => setAltPhone(e.target.value)}
                    placeholder="+91 98765 00000"
                    className="text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button type="submit" isLoading={isSavingPrivacy} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
                <Save className="mr-1.5 h-3.5 w-3.5" /> Save Privacy Settings
              </Button>
            </div>
          </form>
        </div>

        {/* Right Column: Dynamic QR Code Display */}
        <div className="lg:col-span-5 space-y-4">
          {qrCode && (
            <QRCodeDisplay
              token={qrCode.token}
              vehicleId={vehicle.id}
              vehicleReg={vehicle.registration_number}
              vehicleModel={`${vehicle.brand} ${vehicle.model}`}
              status={qrCode.status}
              scanCount={qrCode.scan_count}
              lastScannedAt={qrCode.last_scanned_at}
              onTokenRotated={(newToken) => {
                setQrCode((prev) => (prev ? { ...prev, token: newToken } : null));
              }}
            />
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600 mb-2">
            <Trash2 className="h-6 w-6" />
          </div>
          <DialogTitle className="text-center">Delete {vehicle.registration_number}?</DialogTitle>
          <DialogDescription className="text-center">
            Are you sure you want to delete this vehicle from your account? This action cannot be
            undone. Any issued QR stickers will immediately cease functioning.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDeleteModalOpen(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDeleteVehicle} isLoading={isDeleting}>
            Yes, Delete Vehicle
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}

