"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Car,
  Shield,
  Save,
  Trash2,
  ExternalLink,
  Phone,
  MessageCircle,
  MessageSquare,
  Lock,
  Eye,
  Check,
  X,
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
          brand: brand.trim(),
          model: model.trim(),
          color: color.trim(),
          vehicle_type: vehicleType,
          status,
          parking_location: parkingLocation.trim() || null,
          description: description.trim() || null,
        })
        .eq("id", vehicleId);

      if (error) throw error;
      toast.success("Vehicle details updated");
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
          alternate_contact_name: altName.trim() || null,
          alternate_contact_phone: altPhone.trim() || null,
        })
        .eq("vehicle_id", vehicleId);

      if (error) throw error;
      toast.success("Privacy and contact preferences synced");
    } catch (err: any) {
      toast.error(err.message || "Failed to update preferences");
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Skeleton className="lg:col-span-7 h-96 rounded-xl" />
          <Skeleton className="lg:col-span-5 h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/dashboard/vehicles"
          className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground font-medium"
        >
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back to vehicles
        </Link>
      </div>

      {/* Header Banner - Console Minimal */}
      <div className="rounded-2xl border border-border bg-card p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center rounded-lg border border-border bg-muted px-2.5 py-1">
              <span className="font-mono text-xs font-bold text-foreground">
                {vehicle.registration_number}
              </span>
            </div>

            <Badge
              variant={status === "active" ? "success" : "secondary"}
              className="text-xs font-mono capitalize"
            >
              {status}
            </Badge>

            <span className="text-xs text-muted-foreground font-mono">
              {vehicleType} / {color}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {brand} {model}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
            Configure driver contact permissions, parking alert responders, and manage your dynamic sticker.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {qrCode && (
            <Link href={`/v/${qrCode.token}`} target="_blank">
              <Button variant="outline" size="sm" className="text-xs">
                <ExternalLink className="mr-1.5 h-3.5 w-3.5 text-emerald-600" /> Public pass
              </Button>
            </Link>
          )}
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteModalOpen(true)}
            className="h-9 px-3"
            title="Delete Vehicle"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Scanner View Simulator Bar */}
      <div className="rounded-xl border border-border bg-card p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs">
          <Eye className="h-4 w-4 text-emerald-600 shrink-0" />
          <span className="font-medium text-foreground">Active public view:</span>
          <span className="text-muted-foreground">What a stranger sees right now when scanning</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {tempPrivacy ? (
            <Badge variant="destructive" className="text-[10px]">
              Privacy mute active (contacts hidden)
            </Badge>
          ) : (
            <>
              <Badge variant={showPhone ? "success" : "secondary"} className="text-[10px]">
                {showPhone ? "Call enabled" : "Call hidden"}
              </Badge>
              <Badge variant={showWhatsApp ? "success" : "secondary"} className="text-[10px]">
                {showWhatsApp ? "WhatsApp enabled" : "WhatsApp hidden"}
              </Badge>
              <Badge variant={enableAlerts ? "success" : "secondary"} className="text-[10px]">
                {enableAlerts ? "Alerts enabled" : "Alerts disabled"}
              </Badge>
              <Badge variant={enableAnonMsg ? "success" : "secondary"} className="text-[10px]">
                {enableAnonMsg ? "Masked chat enabled" : "Chat disabled"}
              </Badge>
            </>
          )}
        </div>
      </div>

      {/* Main Grid: Forms on left, Dynamic QR on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Vehicle Details Form & Privacy Settings */}
        <div className="lg:col-span-7 space-y-6">
          {/* Edit Information Form */}
          <form onSubmit={handleSaveInfo} className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Car className="h-4 w-4 text-emerald-600" /> Vehicle details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">Brand</label>
                <Input value={brand} onChange={(e) => setBrand(e.target.value)} required />
              </div>

              <div>
                <label className="text-xs font-medium text-foreground block mb-1">Model</label>
                <Input value={model} onChange={(e) => setModel(e.target.value)} required />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">Color</label>
                <Input value={color} onChange={(e) => setColor(e.target.value)} required />
              </div>

              <div>
                <label className="text-xs font-medium text-foreground block mb-1">Type</label>
                <select
                  value={vehicleType}
                  onChange={(e: any) => setVehicleType(e.target.value)}
                  className="w-full text-xs bg-muted border border-border rounded-md px-3 py-2 text-foreground focus:outline-none"
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
                <label className="text-xs font-medium text-foreground block mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e: any) => setStatus(e.target.value)}
                  className="w-full text-xs bg-muted border border-border rounded-md px-3 py-2 text-foreground focus:outline-none"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Temporarily inactive</option>
                  <option value="sold">Sold</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Parking location or bay
              </label>
              <Input
                value={parkingLocation}
                onChange={(e) => setParkingLocation(e.target.value)}
                placeholder="e.g. Basement B2, Bay 14"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Description note
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Identifying marks or parking note"
                className="w-full text-xs rounded-lg border border-border bg-muted p-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <Button type="submit" isLoading={isSavingInfo} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
                <Save className="mr-1.5 h-3.5 w-3.5" /> Save changes
              </Button>
            </div>
          </form>

          {/* Privacy & Contact Settings Form */}
          <form onSubmit={handleSavePrivacy} className="bg-card border border-border rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Shield className="h-4 w-4 text-emerald-600" /> Contact and privacy controls
              </h2>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono">
                Live sync
              </span>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Configure what happens when someone scans your vehicle QR code. Updates apply immediately without re-printing.
            </p>

            {/* Toggle list */}
            <div className="space-y-2.5">
              <label className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30 cursor-pointer">
                <div className="space-y-0.5 pr-4">
                  <div className="text-xs font-medium text-foreground flex items-center gap-2">
                    <Phone className="h-4 w-4 text-emerald-600" />
                    <span>Show direct call button</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Allows visitors to call your primary or alternate number directly.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={showPhone}
                  onChange={(e) => setShowPhone(e.target.checked)}
                  className="h-4 w-4 rounded text-emerald-600"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30 cursor-pointer">
                <div className="space-y-0.5 pr-4">
                  <div className="text-xs font-medium text-foreground flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-emerald-600" />
                    <span>Show WhatsApp contact link</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Opens WhatsApp chat with pre-filled vehicle details.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={showWhatsApp}
                  onChange={(e) => setShowWhatsApp(e.target.checked)}
                  className="h-4 w-4 rounded text-emerald-600"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30 cursor-pointer">
                <div className="space-y-0.5 pr-4">
                  <div className="text-xs font-medium text-foreground flex items-center gap-2">
                    <Car className="h-4 w-4 text-emerald-600" />
                    <span>Enable 1-tap parking alerts</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Enables visitors to send standard parking alerts like &quot;Vehicle blocking drive&quot;.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={enableAlerts}
                  onChange={(e) => setEnableAlerts(e.target.checked)}
                  className="h-4 w-4 rounded text-emerald-600"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30 cursor-pointer">
                <div className="space-y-0.5 pr-4">
                  <div className="text-xs font-medium text-foreground flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <span>Enable anonymous contact relay</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Allows visitor messages to reach your inbox without revealing phone numbers.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={enableAnonMsg}
                  onChange={(e) => setEnableAnonMsg(e.target.checked)}
                  className="h-4 w-4 rounded text-emerald-600"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-lg border border-amber-300/40 bg-amber-500/10 cursor-pointer">
                <div className="space-y-0.5 pr-4">
                  <div className="text-xs font-medium text-foreground flex items-center gap-2">
                    <Lock className="h-4 w-4 text-amber-600" />
                    <span>Temporary privacy mode (emergency mute)</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Temporarily mutes all public contact buttons while keeping vehicle registered.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={tempPrivacy}
                  onChange={(e) => setTempPrivacy(e.target.checked)}
                  className="h-4 w-4 rounded text-amber-600"
                />
              </label>
            </div>

            {/* Alternate Contact Person */}
            <div className="pt-2 border-t border-border space-y-3">
              <h3 className="text-xs font-medium text-foreground">Alternate contact person (optional)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-muted-foreground block mb-1">Contact name</label>
                  <Input
                    value={altName}
                    onChange={(e) => setAltName(e.target.value)}
                    placeholder="e.g. Spouse or Co-driver"
                    className="text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground block mb-1">Contact phone</label>
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
                <Save className="mr-1.5 h-3.5 w-3.5" /> Save privacy settings
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
          <DialogTitle className="text-center">Delete {vehicle.registration_number}?</DialogTitle>
          <DialogDescription className="text-center text-xs">
            Are you sure you want to delete this vehicle from your account? This action cannot be undone. Any issued stickers will cease functioning immediately.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0 mt-4">
          <Button variant="outline" onClick={() => setDeleteModalOpen(false)} disabled={isDeleting} className="text-xs">
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDeleteVehicle} isLoading={isDeleting} className="text-xs">
            Yes, delete vehicle
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
