"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Phone,
  MessageCircle,
  AlertTriangle,
  MessageSquare,
  Flag,
  ShieldCheck,
  Car,
  Bike,
  Truck,
  MapPin,
  Lock,
  ChevronRight,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ParkingAlertModal } from "@/components/parking-alert-modal";
import { AnonymousMessageModal } from "@/components/anonymous-message-modal";
import { ReportModal } from "@/components/report-modal";
import { formatTelLink, formatWhatsAppLink } from "@/lib/utils";
import type { PublicVehicleProfileResponse, VehicleType } from "@/types/database";

export default function PublicVehicleProfilePage() {
  const params = useParams();
  const token = params?.token as string;

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<PublicVehicleProfileResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [anonMsgModalOpen, setAnonMsgModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function fetchVehicle() {
      if (!token) return;
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/qr/${token}`);
        const data = await res.json();

        if (isMounted) {
          if (res.ok && data.success) {
            setProfile(data);
          } else {
            setError(data.message || "Invalid or inactive vehicle QR code.");
            setProfile(data);
          }
        }
      } catch {
        if (isMounted) {
          setError("Unable to connect to the vehicle profile server.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchVehicle();
    return () => {
      isMounted = false;
    };
  }, [token]);

  // Vehicle type icon helper
  const getVehicleIcon = (type?: VehicleType) => {
    switch (type) {
      case "Motorcycle":
      case "Scooter":
        return <Bike className="h-5 w-5 text-foreground" />;
      case "Truck":
      case "Van":
        return <Truck className="h-5 w-5 text-foreground" />;
      case "Car":
      case "SUV":
      default:
        return <Car className="h-5 w-5 text-foreground" />;
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 space-y-6">
          <div className="flex items-center space-x-3">
            <Skeleton className="h-12 w-12 rounded-xl" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-3.5 w-1/2" />
            </div>
          </div>
          <Skeleton className="h-36 w-full rounded-xl" />
          <div className="space-y-3">
            <Skeleton className="h-11 w-full rounded-lg" />
            <Skeleton className="h-11 w-full rounded-lg" />
          </div>
        </div>
      </main>
    );
  }

  // Not found or Suspended/Inactive state
  if (error || !profile || !profile.success) {
    const isSuspended = profile?.status === "suspended";
    return (
      <main className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 text-center space-y-5">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-destructive/10 text-destructive border border-destructive/20">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">
              {isSuspended ? "Vehicle profile suspended" : "QR sticker inactive"}
            </h2>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              {error ||
                "This QR sticker has either been rotated, deactivated, or expired. Please check with the vehicle owner."}
            </p>
          </div>

          <div className="pt-4 border-t border-border space-y-2">
            <Link href="/" className="block w-full">
              <Button variant="outline" className="w-full text-xs">
                Visit ParkLink home
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReportModalOpen(true)}
              className="text-muted-foreground hover:text-foreground text-xs"
            >
              <Flag className="mr-1.5 h-3.5 w-3.5" /> Report misplaced sticker
            </Button>
          </div>
        </div>

        <ReportModal
          open={reportModalOpen}
          onOpenChange={setReportModalOpen}
          token={token}
          vehicleReg="Unknown"
        />
      </main>
    );
  }

  const {
    registration_number = "",
    brand = "",
    model = "",
    color = "",
    vehicle_type = "Car",
    image_url,
    parking_location,
    description,
    privacy,
    contact,
  } = profile;

  const allowPhone = privacy?.allow_phone && contact?.phone;
  const allowWhatsApp = privacy?.allow_whatsapp && contact?.whatsapp;
  const allowAnonymousMessages = privacy?.allow_anonymous_messages;
  const allowParkingAlerts = privacy?.allow_parking_alerts;

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col items-center justify-start py-8 px-4 sm:px-6">
      <div className="w-full max-w-md space-y-4">
        {/* Top Header Bar */}
        <header className="flex items-center justify-between px-1">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-extrabold text-sm">
              P
            </div>
            <div>
              <span className="font-bold text-foreground text-sm">ParkLink</span>
              <span className="text-xs block text-muted-foreground">
                Verified vehicle pass
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-1.5 text-xs text-emerald-500 bg-muted border border-border px-2.5 py-1 rounded-md font-medium">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Encrypted relay</span>
          </div>
        </header>

        {/* Digital Vehicle Pass Card */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          {/* Card Top Information */}
          <div className="p-5 border-b border-border bg-muted/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted text-foreground">
                  {getVehicleIcon(vehicle_type)}
                </div>
                <div>
                  <div className="text-xs text-muted-foreground font-medium">
                    {vehicle_type}, {color}
                  </div>
                  <h1 className="text-lg font-bold tracking-tight text-foreground">{brand} {model}</h1>
                </div>
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-muted">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span>Active</span>
              </div>
            </div>
          </div>

          {/* License Plate Element */}
          <div className="p-5 pb-3">
            <div className="bg-muted rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="bg-blue-700 text-white rounded text-[9px] font-bold px-1.5 py-1 text-center leading-none">
                  IND
                </div>
                <div className="text-xl font-bold font-plate text-foreground">
                  {registration_number}
                </div>
              </div>
              <div className="text-xs font-medium text-muted-foreground">
                Verified pass
              </div>
            </div>
          </div>

          {/* Vehicle Photograph if provided */}
          {image_url && (
            <div className="mx-5 mb-3 rounded-xl overflow-hidden h-44 bg-muted border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image_url}
                alt={`${brand} ${model}`}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Details & Location */}
          <div className="px-5 space-y-3.5">
            {parking_location && (
              <div className="flex items-start gap-2.5 text-xs text-foreground bg-muted p-3 rounded-lg border border-border">
                <MapPin className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-semibold">Reported parking spot</strong>
                  {parking_location}
                </div>
              </div>
            )}

            {description && (
              <p className="text-xs text-muted-foreground italic px-1 leading-relaxed">
                &ldquo;{description}&rdquo;
              </p>
            )}

            {/* Instruction Notice */}
            <div className="bg-muted border border-border rounded-lg p-3 text-xs text-foreground flex items-start gap-2.5">
              <Info className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                Need to reach the driver? Choose an action below to notify them directly.
              </div>
            </div>

            {/* Tactile Action Cards Group */}
            <div className="space-y-2.5 pt-1">
              {/* Primary Action 1: Send Parking Alert */}
              {allowParkingAlerts ? (
                <Button
                  size="lg"
                  onClick={() => setAlertModalOpen(true)}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center justify-between px-4 h-12 rounded-lg transition-colors duration-150"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-7 w-7 rounded-md bg-white/20 flex items-center justify-center">
                      <AlertTriangle className="h-4 w-4 text-white" />
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-semibold leading-tight">Send parking alert</div>
                      <div className="text-[11px] font-normal text-emerald-100">
                        Vehicle blocking, lights on, urgent move
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-emerald-200" />
                </Button>
              ) : (
                <div className="text-xs text-center text-muted-foreground bg-muted py-2.5 rounded-lg border border-border">
                  Direct parking alerts are currently paused by owner
                </div>
              )}

              {/* Action 2: Call Owner (Direct Phone or Masked) */}
              {allowPhone ? (
                <a href={formatTelLink(contact.phone!)} className="block w-full">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full border-border bg-card hover:bg-muted text-foreground font-semibold flex items-center justify-between px-4 h-12 rounded-lg transition-colors duration-150"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-7 w-7 rounded-md bg-muted text-emerald-500 flex items-center justify-center">
                        <Phone className="h-4 w-4" />
                      </div>
                      <div className="text-left">
                        <div className="text-xs font-semibold leading-tight">Call vehicle owner</div>
                        <div className="text-[11px] text-muted-foreground">
                          Direct phone connection ({contact.owner_first_name || "Owner"})
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </a>
              ) : (
                <div className="text-xs text-muted-foreground flex items-center justify-center gap-1.5 py-1">
                  <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Direct phone number hidden for privacy</span>
                </div>
              )}

              {/* Action 3: WhatsApp Owner */}
              {allowWhatsApp && (
                <a
                  href={formatWhatsAppLink(contact.whatsapp!, {
                    brand,
                    model,
                    reg: registration_number,
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full"
                >
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full border-border bg-card hover:bg-muted text-foreground font-semibold flex items-center justify-between px-4 h-12 rounded-lg transition-colors duration-150"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-7 w-7 rounded-md bg-muted text-emerald-500 flex items-center justify-center">
                        <MessageCircle className="h-4 w-4" />
                      </div>
                      <div className="text-left">
                        <div className="text-xs font-semibold leading-tight">WhatsApp driver</div>
                        <div className="text-[11px] text-muted-foreground">
                          Pre-filled message with vehicle details
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </a>
              )}

              {/* Action 4: Anonymous Contact Relay */}
              {allowAnonymousMessages && (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setAnonMsgModalOpen(true)}
                  className="w-full border-border bg-card hover:bg-muted text-foreground font-semibold flex items-center justify-between px-4 h-12 rounded-lg transition-colors duration-150"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-7 w-7 rounded-md bg-muted text-sky-500 flex items-center justify-center">
                      <MessageSquare className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-semibold leading-tight">Anonymous message relay</div>
                      <div className="text-[11px] text-muted-foreground">
                        Zero phone number sharing required
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Button>
              )}
            </div>

            {/* Privacy Assurance */}
            <div className="pt-2 pb-4 text-center">
              <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                <span>Protected by ParkLink privacy architecture</span>
              </div>
            </div>
          </div>

          {/* Footer Bar */}
          <div className="bg-muted px-5 py-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <button
              onClick={() => setReportModalOpen(true)}
              className="flex items-center gap-1.5 hover:text-destructive transition-colors duration-150"
            >
              <Flag className="h-3.5 w-3.5 text-destructive" />
              <span>Report issue</span>
            </button>
            <Link href="/" className="hover:text-foreground transition-colors duration-150">
              Get your own ParkLink QR
            </Link>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ParkingAlertModal
        open={alertModalOpen}
        onOpenChange={setAlertModalOpen}
        token={token}
        vehicleReg={registration_number}
      />

      <AnonymousMessageModal
        open={anonMsgModalOpen}
        onOpenChange={setAnonMsgModalOpen}
        token={token}
        vehicleReg={registration_number}
      />

      <ReportModal
        open={reportModalOpen}
        onOpenChange={setReportModalOpen}
        token={token}
        vehicleReg={registration_number}
      />
    </main>
  );
}
