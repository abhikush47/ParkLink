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
  Clock,
  CheckCircle,
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
            // If token not found in database or DB not yet connected, check if it's a demo or invalid
            setError(data.message || "Invalid or inactive vehicle QR code.");
            setProfile(data);
          }
        }
      } catch (err: any) {
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
        return <Bike className="h-6 w-6 text-emerald-600" />;
      case "Truck":
      case "Van":
        return <Truck className="h-6 w-6 text-emerald-600" />;
      case "Car":
      case "SUV":
      default:
        return <Car className="h-6 w-6 text-emerald-600" />;
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-center space-x-3">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
          <Skeleton className="h-40 w-full rounded-xl" />
          <div className="space-y-3">
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
        </div>
      </main>
    );
  }

  // Not found or Suspended/Inactive state
  if (error || !profile || !profile.success) {
    const isSuspended = profile?.status === "suspended";
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-sm text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 mb-4">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-foreground">
            {isSuspended ? "Vehicle Profile Suspended" : "QR Code Not Found"}
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            {error ||
              "The scanned QR code is either unassigned, deactivated, or expired. Please check with the vehicle owner."}
          </p>

          <div className="mt-8 pt-6 border-t border-border flex flex-col gap-2">
            <Link href="/">
              <Button variant="outline" className="w-full">
                Visit ParkLink Home
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReportModalOpen(true)}
              className="text-muted-foreground text-xs"
            >
              <Flag className="mr-1.5 h-3.5 w-3.5" /> Report Problem with this QR
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
    <main className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 dark:from-slate-950 dark:to-slate-900 flex flex-col items-center justify-start py-6 px-4 sm:px-6">
      <div className="w-full max-w-md space-y-4">
        {/* Brand Header */}
        <header className="flex items-center justify-between px-2">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-black text-base shadow-sm">
              P
            </div>
            <div>
              <span className="font-bold text-foreground tracking-tight text-base">ParkLink</span>
              <span className="text-[10px] block text-muted-foreground -mt-1 font-medium">
                Verified Vehicle Profile
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/50 px-2.5 py-1 rounded-full font-medium">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Secure Relay</span>
          </div>
        </header>

        {/* Main Vehicle Profile Card */}
        <div className="bg-card border border-border rounded-2xl shadow-lg overflow-hidden transition-all">
          {/* Top Vehicle Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 p-5 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-white/10 backdrop-blur-sm text-white">
                  {getVehicleIcon(vehicle_type)}
                </span>
                <div>
                  <div className="text-xs uppercase tracking-wider text-emerald-100 font-semibold">
                    {vehicle_type} • {color}
                  </div>
                  <h1 className="text-xl font-black tracking-tight">{brand} {model}</h1>
                </div>
              </div>
              <Badge variant="charcoal" className="bg-white/20 text-white border-0 text-xs uppercase font-mono">
                {registration_number}
              </Badge>
            </div>
          </div>

          {/* Optional Vehicle Image */}
          {image_url && (
            <div className="w-full h-48 bg-slate-100 dark:bg-slate-900 border-b border-border overflow-hidden relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image_url}
                alt={`${brand} ${model}`}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Details & Location */}
          <div className="p-5 space-y-4">
            {parking_location && (
              <div className="flex items-start gap-2.5 text-xs text-muted-foreground bg-muted/40 p-3 rounded-xl border border-border">
                <MapPin className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-foreground block font-medium">Reported Parking Spot</strong>
                  {parking_location}
                </div>
              </div>
            )}

            {description && (
              <p className="text-xs text-muted-foreground leading-relaxed italic px-1">
                &ldquo;{description}&rdquo;
              </p>
            )}

            {/* Quick Instruction Banner */}
            <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-xl p-3 text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-2.5">
              <Info className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                Need to reach the driver? Use one of the fast contact actions below. No app download needed.
              </div>
            </div>

            {/* Action Buttons Group */}
            <div className="space-y-2.5 pt-1">
              {/* Primary Action 1: Send Parking Alert */}
              {allowParkingAlerts ? (
                <Button
                  size="lg"
                  onClick={() => setAlertModalOpen(true)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md flex items-center justify-between px-5 h-12"
                >
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5" />
                    <div className="text-left">
                      <div className="leading-tight">Send Parking Alert</div>
                      <div className="text-[11px] font-normal text-emerald-100">
                        Car blocking, lights on, urgent move
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-emerald-200" />
                </Button>
              ) : (
                <div className="text-xs text-center text-muted-foreground bg-muted/40 py-2.5 rounded-lg border border-border">
                  Direct parking alerts are paused by owner
                </div>
              )}

              {/* Action 2: Call Owner (if public phone enabled) */}
              {allowPhone ? (
                <a
                  href={formatTelLink(contact.phone!)}
                  className="block w-full"
                >
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full border-emerald-600/30 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/40 font-semibold flex items-center justify-between px-5 h-12"
                  >
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-emerald-600" />
                      <div className="text-left">
                        <div className="leading-tight">Call Vehicle Owner</div>
                        <div className="text-[11px] font-normal text-muted-foreground">
                          Direct phone connection
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </a>
              ) : (
                <div className="text-xs text-muted-foreground flex items-center justify-center gap-1.5 py-1.5">
                  <Lock className="h-3.5 w-3.5 text-muted-foreground/70" />
                  <span>Direct phone number hidden for privacy</span>
                </div>
              )}

              {/* Action 3: WhatsApp Owner (if WhatsApp enabled) */}
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
                    className="w-full border-green-600/30 hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-950/40 font-semibold flex items-center justify-between px-5 h-12"
                  >
                    <div className="flex items-center gap-3">
                      <MessageCircle className="h-5 w-5 text-green-600" />
                      <div className="text-left">
                        <div className="leading-tight">WhatsApp Driver</div>
                        <div className="text-[11px] font-normal text-muted-foreground">
                          Opens WhatsApp with pre-filled details
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
                  variant="secondary"
                  size="lg"
                  onClick={() => setAnonMsgModalOpen(true)}
                  className="w-full font-semibold flex items-center justify-between px-5 h-12"
                >
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-5 w-5 text-slate-700 dark:text-slate-300" />
                    <div className="text-left">
                      <div className="leading-tight">Anonymous Message</div>
                      <div className="text-[11px] font-normal text-muted-foreground">
                        Keep your personal phone number confidential
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Button>
              )}
            </div>

            {/* Privacy & Anti-Harassment Assurance */}
            <div className="pt-2 text-center">
              <div className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>ParkLink protects owner and visitor privacy alike.</span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="bg-muted/40 p-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <button
              onClick={() => setReportModalOpen(true)}
              className="flex items-center gap-1 hover:text-destructive transition-colors"
            >
              <Flag className="h-3.5 w-3.5" />
              <span>Report issue</span>
            </button>
            <Link href="/" className="hover:text-foreground transition-colors">
              About ParkLink
            </Link>
          </div>
        </div>

        {/* Promotion banner for visitors */}
        <div className="bg-card border border-border rounded-xl p-4 text-center space-y-2 shadow-sm">
          <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
            Own a vehicle?
          </h4>
          <p className="text-xs text-muted-foreground">
            Get your own free, permanent dynamic QR sticker. Never worry about blocked parking again.
          </p>
          <Link href="/register">
            <Button variant="subtle" size="sm" className="mt-1 text-xs">
              Get Your Free ParkLink QR
            </Button>
          </Link>
        </div>
      </div>

      {/* Interactive Modals */}
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

