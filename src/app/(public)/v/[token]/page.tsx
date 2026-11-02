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
  Sparkles,
  Zap,
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
        return <Bike className="h-6 w-6 text-white" />;
      case "Truck":
      case "Van":
        return <Truck className="h-6 w-6 text-white" />;
      case "Car":
      case "SUV":
      default:
        return <Car className="h-6 w-6 text-white" />;
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
          <div className="flex items-center space-x-3">
            <Skeleton className="h-12 w-12 rounded-2xl bg-slate-800" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-5 w-3/4 bg-slate-800" />
              <Skeleton className="h-3.5 w-1/2 bg-slate-800" />
            </div>
          </div>
          <Skeleton className="h-44 w-full rounded-2xl bg-slate-800" />
          <div className="space-y-3">
            <Skeleton className="h-12 w-full rounded-xl bg-slate-800" />
            <Skeleton className="h-12 w-full rounded-xl bg-slate-800" />
          </div>
        </div>
      </main>
    );
  }

  // Not found or Suspended/Inactive state
  if (error || !profile || !profile.success) {
    const isSuspended = profile?.status === "suspended";
    return (
      <main className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center space-y-5">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-950/60 text-rose-500 border border-rose-800/40">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">
              {isSuspended ? "Vehicle Profile Suspended" : "QR Sticker Inactive"}
            </h2>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              {error ||
                "This QR sticker has either been rotated, deactivated, or expired. Please check with the vehicle owner."}
            </p>
          </div>

          <div className="pt-4 border-t border-slate-800 space-y-2">
            <Link href="/" className="block w-full">
              <Button variant="outline" className="w-full border-slate-700 text-slate-300 text-xs">
                Visit ParkLink Home
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReportModalOpen(true)}
              className="text-slate-500 hover:text-slate-300 text-xs"
            >
              <Flag className="mr-1.5 h-3.5 w-3.5" /> Report Misplaced or Fake Sticker
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
    <main className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-start py-8 px-4 sm:px-6 relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md space-y-4 relative z-10">
        {/* Top Header Bar */}
        <header className="flex items-center justify-between px-2">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-black text-sm shadow-md">
              P
            </div>
            <div>
              <span className="font-bold text-white tracking-tight text-sm">ParkLink</span>
              <span className="text-[10px] block text-slate-400 -mt-0.5 font-medium">
                Verified Vehicle Profile
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-1 rounded-full font-medium">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Encrypted Relay</span>
          </div>
        </header>

        {/* Digital Vehicle Security Pass Card */}
        <div className="bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
          {/* Card Banner with Vehicle Type & Active Radar */}
          <div className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700 p-5 text-white relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-md shadow-inner">
                  {getVehicleIcon(vehicle_type)}
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-emerald-100 font-bold">
                    {vehicle_type} • {color}
                  </div>
                  <h1 className="text-xl font-black tracking-tight">{brand} {model}</h1>
                </div>
              </div>

              {/* Status pill with animated radar */}
              <div className="flex items-center gap-1.5 bg-black/30 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-semibold text-emerald-300 border border-white/10">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-radar" />
                <span>Active</span>
              </div>
            </div>
          </div>

          {/* Realistic License Plate Badge */}
          <div className="p-5 pb-3">
            <div className="bg-gradient-to-b from-slate-100 to-slate-200 border-2 border-slate-400 rounded-xl p-3 text-slate-900 shadow-md flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-blue-700 text-white rounded text-[9px] font-black px-1.5 py-1 text-center leading-none">
                  IND
                </div>
                <div className="text-xl font-black font-plate tracking-widest uppercase">
                  {registration_number}
                </div>
              </div>
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                PARKLINK VERIFIED
              </div>
            </div>
          </div>

          {/* Vehicle Photograph if provided */}
          {image_url && (
            <div className="mx-5 mb-3 rounded-2xl overflow-hidden h-44 bg-slate-900 border border-slate-800">
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
              <div className="flex items-start gap-2.5 text-xs text-slate-300 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                <MapPin className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-semibold">Reported Parking Spot</strong>
                  {parking_location}
                </div>
              </div>
            )}

            {description && (
              <p className="text-xs text-slate-400 italic px-1 leading-relaxed">
                &ldquo;{description}&rdquo;
              </p>
            )}

            {/* Instruction Notice */}
            <div className="bg-emerald-950/30 border border-emerald-800/40 rounded-xl p-3 text-xs text-emerald-200 flex items-start gap-2.5">
              <Info className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                Need to reach the driver? Tap an action below to notify them immediately.
              </div>
            </div>

            {/* Tactile Action Cards Group */}
            <div className="space-y-2.5 pt-1">
              {/* Primary Action 1: Send Parking Alert */}
              {allowParkingAlerts ? (
                <Button
                  size="lg"
                  onClick={() => setAlertModalOpen(true)}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-600/25 flex items-center justify-between px-5 h-13 rounded-2xl transition-all hover:scale-[1.01]"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-xl bg-white/20 flex items-center justify-center">
                      <AlertTriangle className="h-4 w-4 text-white" />
                    </div>
                    <div className="text-left">
                      <div className="text-sm leading-tight">Send Parking Alert</div>
                      <div className="text-[11px] font-normal text-emerald-100">
                        Car blocking, lights on, urgent move
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-emerald-200" />
                </Button>
              ) : (
                <div className="text-xs text-center text-slate-500 bg-slate-900/60 py-2.5 rounded-xl border border-slate-800">
                  Direct parking alerts are currently paused by owner
                </div>
              )}

              {/* Action 2: Call Owner (Direct Phone or Masked) */}
              {allowPhone ? (
                <a href={formatTelLink(contact.phone!)} className="block w-full">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-white font-semibold flex items-center justify-between px-5 h-12 rounded-2xl transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-7 w-7 rounded-lg bg-emerald-950/80 text-emerald-400 flex items-center justify-center">
                        <Phone className="h-4 w-4" />
                      </div>
                      <div className="text-left">
                        <div className="text-xs leading-tight font-bold">Call Vehicle Owner</div>
                        <div className="text-[10px] text-slate-400">
                          Direct phone connection ({contact.owner_first_name || "Owner"})
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-500" />
                  </Button>
                </a>
              ) : (
                <div className="text-xs text-slate-500 flex items-center justify-center gap-1.5 py-1">
                  <Lock className="h-3.5 w-3.5 text-slate-600" />
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
                    className="w-full border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-white font-semibold flex items-center justify-between px-5 h-12 rounded-2xl transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-7 w-7 rounded-lg bg-green-950/80 text-green-400 flex items-center justify-center">
                        <MessageCircle className="h-4 w-4" />
                      </div>
                      <div className="text-left">
                        <div className="text-xs leading-tight font-bold">WhatsApp Driver</div>
                        <div className="text-[10px] text-slate-400">
                          Pre-filled message with vehicle details
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-500" />
                  </Button>
                </a>
              )}

              {/* Action 4: Anonymous Contact Relay */}
              {allowAnonymousMessages && (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setAnonMsgModalOpen(true)}
                  className="w-full border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-white font-semibold flex items-center justify-between px-5 h-12 rounded-2xl transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-7 w-7 rounded-lg bg-sky-950/80 text-sky-400 flex items-center justify-center">
                      <MessageSquare className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <div className="text-xs leading-tight font-bold">Anonymous Message Relay</div>
                      <div className="text-[10px] text-slate-400">
                        Zero phone number sharing required
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-500" />
                </Button>
              )}
            </div>

            {/* Privacy Assurance */}
            <div className="pt-2 pb-4 text-center">
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                <span>Protected by ParkLink Privacy Architecture</span>
              </div>
            </div>
          </div>

          {/* Footer Bar */}
          <div className="bg-slate-900/80 px-5 py-3.5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <button
              onClick={() => setReportModalOpen(true)}
              className="flex items-center gap-1.5 hover:text-rose-400 transition-colors"
            >
              <Flag className="h-3.5 w-3.5 text-rose-500" />
              <span>Report issue</span>
            </button>
            <Link href="/" className="hover:text-white transition-colors">
              Get Your Own ParkLink QR
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
