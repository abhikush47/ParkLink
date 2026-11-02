"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  QrCode,
  ShieldCheck,
  PhoneCall,
  MessageCircle,
  AlertTriangle,
  Building2,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  EyeOff,
  Clock,
  Car,
  ChevronDown,
  Layers,
  FileText,
  Lock,
} from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function HomePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: "Does someone scanning my vehicle need to download an app?",
      a: "No! Anyone with a standard smartphone camera can scan the ParkLink QR code. The mobile profile opens immediately in their mobile browser without downloading or registering.",
    },
    {
      q: "What happens if I change my phone number or sell my car?",
      a: "Your physical QR code never needs to be reprinted! Because our QR codes point to a permanent dynamic token, any update you make to your phone number, WhatsApp, or vehicle profile takes effect instantly in the cloud.",
    },
    {
      q: "Will random strangers be able to see my personal phone number?",
      a: "You are in 100% control. By default, ParkLink enables privacy-focused options: you can hide your raw phone number and allow visitors to reach you solely through pre-defined Parking Alerts or the Anonymous Contact Relay.",
    },
    {
      q: "Can someone spam or harass me with continuous alerts?",
      a: "No. ParkLink implements server-side cryptographic rate-limiting, duplicate alert suppression, and sender cooldown timers. Visitors cannot spam alerts, and abusive users can be reported and blocked immediately.",
    },
    {
      q: "Can colleges, universities, or housing societies use ParkLink?",
      a: "Yes! ParkLink includes a dedicated Institutional Module designed for campuses, gated societies, IT parks, and hospitals to manage thousands of vehicles, issue branded stickers, and monitor parking zones.",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-emerald-500/20">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-32 border-b border-border/40">
        <div className="container max-w-7xl px-4 sm:px-8 mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Headline & Value Prop */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Next-Gen Smart Vehicle Contact</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-foreground leading-[1.12]">
                Your Vehicle. <br />
                <span className="text-emerald-600">One Scan.</span> <br />
                Instant Connection.
              </h1>

              <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Make parking easier. Connect with vehicle owners instantly through a simple dynamic
                QR code. No app required. No unnecessary hassle. Protect your privacy while never
                getting trapped in a parking spot again.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
                <Link href="/register" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-12 px-8 shadow-md"
                  >
                    Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="#how-it-works" className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto font-medium h-12 px-6"
                  >
                    How It Works
                  </Button>
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>No mobile app required</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Masked phone privacy</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Permanent dynamic sticker</span>
                </div>
              </div>
            </div>

            {/* Right Column: Live Interactive Mock / Visual */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-sm rounded-3xl p-1 bg-gradient-to-b from-emerald-500/20 via-border to-transparent shadow-2xl">
                <div className="bg-card rounded-[22px] border border-border p-6 space-y-5">
                  {/* Vehicle Tag Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-border">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                        <Car className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-foreground">Hyundai Creta • White</div>
                        <div className="text-[10px] text-muted-foreground font-mono">DL 01 AB 1234</div>
                      </div>
                    </div>
                    <Badge variant="success" className="text-[10px]">Active</Badge>
                  </div>

                  {/* QR Sticker Card */}
                  <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-center space-y-2">
                    <div className="mx-auto w-36 h-36 bg-white p-2 rounded-xl shadow-inner flex items-center justify-center">
                      <QrCode className="h-32 w-32 text-slate-900" />
                    </div>
                    <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 tracking-wider">
                      SCAN TO REACH OWNER
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      parklink.app/v/a8Kp92xLmQ
                    </div>
                  </div>

                  {/* Sample Action Simulation */}
                  <div className="space-y-2 pt-1">
                    <div className="w-full bg-emerald-600 text-white rounded-xl py-2.5 px-3 text-xs font-semibold flex items-center justify-between shadow-sm">
                      <span className="flex items-center gap-2">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Send Parking Alert
                      </span>
                      <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">1-Tap</span>
                    </div>
                    <div className="w-full bg-muted/60 text-foreground rounded-xl py-2.5 px-3 text-xs font-medium flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <PhoneCall className="h-3.5 w-3.5 text-emerald-600" />
                        Call Owner
                      </span>
                      <span className="text-[10px] text-muted-foreground">Direct / Masked</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-slate-50/50 dark:bg-slate-950/40 border-b border-border/40">
        <div className="container max-w-7xl px-4 sm:px-8 mx-auto text-center space-y-4">
          <Badge variant="subtle" className="text-xs">Seamless Workflow</Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            How ParkLink Works
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
            From vehicle registration to instant parking resolution in three simple steps.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-10 text-left">
            {/* Step 1 */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm relative group hover:border-emerald-500/50 transition-all">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-lg mb-4">
                1
              </div>
              <h3 className="text-lg font-bold text-foreground">Register & Place Sticker</h3>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                Add your vehicle in 60 seconds. ParkLink generates an opaque cryptographic QR token.
                Download the high-res sticker or print-ready PDF and place it on your windshield.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm relative group hover:border-emerald-500/50 transition-all">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-lg mb-4">
                2
              </div>
              <h3 className="text-lg font-bold text-foreground">Anyone Scans With Camera</h3>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                If your car is blocking another vehicle or has lights on, a passerby scans the code
                with their native smartphone camera. No app download or sign-up needed.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm relative group hover:border-emerald-500/50 transition-all">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-lg mb-4">
                3
              </div>
              <h3 className="text-lg font-bold text-foreground">Instant Alert & Resolution</h3>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                Visitor sends a 1-tap parking alert (&quot;Car blocking&quot;, &quot;Please move&quot;) or calls you.
                You receive instant real-time alerts on your dashboard and phone.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Deep Dive: Smart Parking Alerts */}
      <section id="features" className="py-20 border-b border-border/40">
        <div className="container max-w-7xl px-4 sm:px-8 mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-5">
              <Badge variant="subtle" className="text-xs">No Awkward Honking</Badge>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                Smart Parking Alert System
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Vehicles frequently block driveways, double park, or leave headlights on. ParkLink
                replaces loud horn honking and scratch-and-dent frustrations with structured,
                instant digital alerts.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-xl border border-border bg-card">
                  <div className="font-semibold text-xs text-foreground flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-rose-500" />
                    Vehicle Blocking
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1">
                    Instant notify to clear blocked bay.
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-border bg-card">
                  <div className="font-semibold text-xs text-foreground flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-yellow-500" />
                    Lights Left On
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1">
                    Prevents dead battery emergencies.
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-border bg-card">
                  <div className="font-semibold text-xs text-foreground flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-sky-500" />
                    Window Open
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1">
                    Protects interior from rain or theft.
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-border bg-card">
                  <div className="font-semibold text-xs text-foreground flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Anonymous Relay
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1">
                    Safe 2-way message without numbers.
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 bg-slate-50 dark:bg-slate-900 border border-border rounded-3xl p-6 sm:p-8 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Dynamic QR Advantage
              </h3>
              <div className="space-y-4 text-xs">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                    <Lock className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">Zero Private Data in the QR</h4>
                    <p className="text-muted-foreground mt-0.5">
                      Unlike amateur QR stickers that encode raw phone numbers into the image,
                      ParkLink encodes only a secure opaque web token.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                    <EyeOff className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">1-Click Token Rotation</h4>
                    <p className="text-muted-foreground mt-0.5">
                      If you move, change cars, or suspect sticker tampering, rotate your token in
                      your dashboard. The old code is permanently neutralized.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">Anti-Spam & Rate Limiting</h4>
                    <p className="text-muted-foreground mt-0.5">
                      Cryptographic sender cooldowns prevent automated bots or malicious repeated
                      submissions.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Institutional Parking Module */}
      <section id="institutions" className="py-20 bg-slate-50/40 dark:bg-slate-950/30 border-b border-border/40">
        <div className="container max-w-7xl px-4 sm:px-8 mx-auto text-center space-y-4">
          <Badge variant="subtle" className="text-xs">Enterprise & Education</Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Built for Campuses, Societies & Enterprises
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
            ParkLink powers centralized parking management for institutions managing hundreds or
            thousands of vehicles daily.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-10 text-left">
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-2">
              <Building2 className="h-6 w-6 text-emerald-600 mb-1" />
              <h3 className="font-bold text-sm text-foreground">Universities & Colleges</h3>
              <p className="text-xs text-muted-foreground">
                Issue student and faculty parking passes with unified digital vehicle verification.
              </p>
            </div>

            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-2">
              <Layers className="h-6 w-6 text-emerald-600 mb-1" />
              <h3 className="font-bold text-sm text-foreground">Residential Societies</h3>
              <p className="text-xs text-muted-foreground">
                End neighbor parking disputes. Seamlessly contact owners of double-parked vehicles.
              </p>
            </div>

            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-2">
              <Building2 className="h-6 w-6 text-emerald-600 mb-1" />
              <h3 className="font-bold text-sm text-foreground">Corporate IT Parks</h3>
              <p className="text-xs text-muted-foreground">
                Designated parking bays, security guard tools, and visitor vehicle logging.
              </p>
            </div>

            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-2">
              <FileText className="h-6 w-6 text-emerald-600 mb-1" />
              <h3 className="font-bold text-sm text-foreground">Hospitals & Malls</h3>
              <p className="text-xs text-muted-foreground">
                Rapid ambulance route clearing, emergency parking coordination, and CSV bulk exports.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section id="faq" className="py-20 border-b border-border/40">
        <div className="container max-w-4xl px-4 sm:px-8 mx-auto space-y-8">
          <div className="text-center space-y-2">
            <Badge variant="subtle" className="text-xs">Got Questions?</Badge>
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-border bg-card overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between p-4 text-left font-semibold text-sm text-foreground hover:bg-muted/30"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`h-4 w-4 text-muted-foreground transition-transform ${
                        isOpen ? "rotate-180 text-emerald-600" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 text-xs text-muted-foreground leading-relaxed border-t border-border/50">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="py-20 bg-gradient-to-b from-emerald-600 to-emerald-800 text-white text-center">
        <div className="container max-w-4xl px-4 mx-auto space-y-6">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
            Ready to Upgrade Your Vehicle&apos;s Parking Experience?
          </h2>
          <p className="text-emerald-100 text-sm sm:text-base max-w-xl mx-auto">
            Get your vehicle registered in under two minutes. Download and print your dynamic QR
            sticker immediately.
          </p>
          <div className="pt-2">
            <Link href="/register">
              <Button
                size="lg"
                className="bg-white text-emerald-800 hover:bg-emerald-50 font-bold h-12 px-8 shadow-xl"
              >
                Create Your Free Account <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
