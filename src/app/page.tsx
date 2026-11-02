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
  Compass,
  Lightbulb,
  Eye,
  Check,
  Zap,
  Smartphone,
  Copy,
} from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function HomePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [demoTab, setDemoTab] = useState<"pass" | "alert" | "relay">("pass");
  const [copiedLink, setCopiedLink] = useState(false);

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

  const handleCopyDemo = () => {
    navigator.clipboard.writeText("https://parklink.app/v/a8Kp92xLmQ");
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-emerald-500/20">
      <Navbar />

      {/* Atmospheric Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-24 md:pt-20 md:pb-36 border-b border-border/60 bg-grid-pattern">
        {/* Ambient Gradient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-[120px] pointer-events-none" />

        <div className="container max-w-7xl px-4 sm:px-8 mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Column: Headline & Value Prop */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 text-xs font-semibold text-emerald-800 dark:text-emerald-300 shadow-sm animate-in fade-in slide-in-from-top-2">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-radar" />
                <span>Smart Vehicle Identification & Contact System</span>
              </div>

              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-foreground leading-[1.08]">
                Your Vehicle. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 dark:from-emerald-400 dark:via-emerald-300 dark:to-teal-300">
                  One Scan.
                </span> <br />
                Instant Connection.
              </h1>

              <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
                Make parking effortless. Connect with vehicle owners instantly through a simple
                permanent dynamic QR sticker. No mobile app download required. Total privacy preservation.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
                <Link href="/register" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-12 px-8 shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Get Your Free Vehicle QR <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/v/a8Kp92xLmQ" target="_blank" className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto font-medium h-12 px-6 border-border hover:bg-muted/60"
                  >
                    <Smartphone className="mr-2 h-4 w-4 text-emerald-600" />
                    Live Scan Demo
                  </Button>
                </Link>
              </div>

              {/* Key Trust Signals */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-muted-foreground font-medium">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Zero app download</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Masked phone privacy</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Permanent dynamic sticker</span>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Product Experience Console */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-sm">
                {/* Glow behind device */}
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/30 to-teal-500/20 rounded-[32px] blur-xl opacity-75" />

                <div className="relative bg-card border border-border/80 rounded-[28px] shadow-2xl overflow-hidden">
                  {/* Interactive Tab Switcher */}
                  <div className="bg-muted/60 p-1.5 border-b border-border flex items-center justify-between text-xs">
                    <button
                      onClick={() => setDemoTab("pass")}
                      className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
                        demoTab === "pass"
                          ? "bg-card text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Digital Pass
                    </button>
                    <button
                      onClick={() => setDemoTab("alert")}
                      className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
                        demoTab === "alert"
                          ? "bg-card text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      1-Tap Alert
                    </button>
                    <button
                      onClick={() => setDemoTab("relay")}
                      className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
                        demoTab === "relay"
                          ? "bg-card text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Masked Call
                    </button>
                  </div>

                  {/* Dynamic Device Content */}
                  <div className="p-6 space-y-5">
                    {/* Top Identity Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="h-9 w-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
                          <Car className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-foreground">Hyundai Creta • SX(O)</div>
                          <div className="text-[10px] text-muted-foreground font-plate font-semibold text-emerald-700 dark:text-emerald-400">
                            DL 01 AB 1234
                          </div>
                        </div>
                      </div>
                      <Badge variant="success" className="text-[10px]">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" />
                        Active
                      </Badge>
                    </div>

                    {demoTab === "pass" && (
                      <div className="space-y-4 animate-in fade-in duration-200">
                        {/* Interactive QR Sticker Container */}
                        <div className="bg-slate-50 dark:bg-slate-900 border-2 border-emerald-500/30 rounded-2xl p-5 text-center space-y-2 shadow-inner">
                          <div className="mx-auto w-36 h-36 bg-white p-2.5 rounded-xl shadow-md flex items-center justify-center">
                            <QrCode className="h-32 w-32 text-slate-900" />
                          </div>
                          <div className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 tracking-wider uppercase">
                            PARKLINK VERIFIED STICKER
                          </div>
                          <div className="text-[10px] text-muted-foreground font-mono">
                            parklink.app/v/a8Kp92xLmQ
                          </div>
                        </div>

                        {/* Quick link button */}
                        <div className="flex items-center gap-2">
                          <Button
                            variant="subtle"
                            size="sm"
                            onClick={handleCopyDemo}
                            className="flex-1 text-xs h-8"
                          >
                            {copiedLink ? <Check className="mr-1 h-3.5 w-3.5" /> : <Copy className="mr-1 h-3.5 w-3.5" />}
                            {copiedLink ? "Copied Demo URL" : "Copy Permanent URL"}
                          </Button>
                          <Link href="/v/a8Kp92xLmQ" target="_blank">
                            <Button variant="outline" size="sm" className="text-xs h-8">
                              Scan Live
                            </Button>
                          </Link>
                        </div>
                      </div>
                    )}

                    {demoTab === "alert" && (
                      <div className="space-y-3 animate-in fade-in duration-200">
                        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-xs text-amber-900 dark:text-amber-200">
                          <span className="font-semibold block mb-0.5">Instant Parking Alerts</span>
                          Scanners select a situation with 1 click. Zero typing required.
                        </div>

                        <div className="space-y-1.5 text-xs">
                          <div className="p-2.5 rounded-lg border border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/40 flex items-center justify-between font-medium">
                            <span className="flex items-center gap-2">
                              <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
                              Vehicle Blocking Exit
                            </span>
                            <Badge variant="success" className="text-[9px]">Pre-selected</Badge>
                          </div>
                          <div className="p-2.5 rounded-lg border border-border bg-card flex items-center justify-between text-muted-foreground">
                            <span className="flex items-center gap-2">
                              <Lightbulb className="h-3.5 w-3.5 text-yellow-500" />
                              Headlights Switched On
                            </span>
                          </div>
                          <div className="p-2.5 rounded-lg border border-border bg-card flex items-center justify-between text-muted-foreground">
                            <span className="flex items-center gap-2">
                              <Eye className="h-3.5 w-3.5 text-sky-500" />
                              Window Left Open
                            </span>
                          </div>
                        </div>

                        <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9">
                          Send 1-Tap Alert to Owner
                        </Button>
                      </div>
                    )}

                    {demoTab === "relay" && (
                      <div className="space-y-4 animate-in fade-in duration-200">
                        <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-border text-xs space-y-1">
                          <div className="font-semibold text-foreground flex items-center gap-1.5">
                            <Lock className="h-3.5 w-3.5 text-emerald-600" />
                            Number Masking Active
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            Visitors can call you without learning your private telephone number.
                          </p>
                        </div>

                        <div className="space-y-2">
                          <a href="tel:+919876543210" className="block w-full">
                            <Button
                              variant="outline"
                              className="w-full justify-between h-10 text-xs border-emerald-500/40 font-semibold"
                            >
                              <span className="flex items-center gap-2">
                                <PhoneCall className="h-3.5 w-3.5 text-emerald-600" />
                                Call Owner (Masked)
                              </span>
                              <Badge variant="subtle" className="text-[9px]">Direct</Badge>
                            </Button>
                          </a>

                          <Button
                            variant="secondary"
                            className="w-full justify-between h-10 text-xs font-semibold"
                          >
                            <span className="flex items-center gap-2">
                              <MessageCircle className="h-3.5 w-3.5 text-green-600" />
                              WhatsApp Driver
                            </span>
                            <Badge variant="charcoal" className="text-[9px]">Pre-filled</Badge>
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bento Grid: Core Product Superpowers */}
      <section className="py-24 border-b border-border/40">
        <div className="container max-w-7xl px-4 sm:px-8 mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <Badge variant="subtle" className="text-xs">Why ParkLink</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Engineered for Real-World Parking Friction
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Every detail is designed to solve blocked exits in seconds while giving vehicle owners
              100% control over their personal privacy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Feature 1: Dynamic QR Code Architecture (Wide Card) */}
            <div className="md:col-span-8 bg-card border border-border/80 rounded-3xl p-8 shadow-sm flex flex-col justify-between hover:border-emerald-500/40 transition-all">
              <div className="space-y-3">
                <span className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 inline-block">
                  <Zap className="h-6 w-6" />
                </span>
                <h3 className="text-2xl font-bold text-foreground">
                  Permanent Dynamic URL — Never Reprint Again
                </h3>
                <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">
                  Amateur QR generators print your raw phone number right on the sticker. If you
                  change numbers or travel, the sticker is useless. ParkLink stores an opaque token;
                  your physical sticker connects to live cloud settings that update in real-time.
                </p>
              </div>

              <div className="pt-6 mt-6 border-t border-border/60 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <strong className="text-foreground block font-bold">1-Click Token Rotation</strong>
                  <span className="text-muted-foreground">Neutralize stolen or scraped stickers instantly.</span>
                </div>
                <div>
                  <strong className="text-foreground block font-bold">Vector SVG & Print PDF</strong>
                  <span className="text-muted-foreground">Laser-sharp printing for windshield stickers.</span>
                </div>
                <div>
                  <strong className="text-foreground block font-bold">Instant Cloud Propagation</strong>
                  <span className="text-muted-foreground">Zero cache delay on updated telephone numbers.</span>
                </div>
              </div>
            </div>

            {/* Feature 2: Masked Phone & Zero PII Exposure */}
            <div className="md:col-span-4 bg-card border border-border/80 rounded-3xl p-8 shadow-sm flex flex-col justify-between hover:border-emerald-500/40 transition-all">
              <div className="space-y-3">
                <span className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 inline-block">
                  <EyeOff className="h-6 w-6" />
                </span>
                <h3 className="text-xl font-bold text-foreground">100% Masked Privacy</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Never leave handwritten phone slips on your dashboard. Hide your telephone number
                  completely and communicate solely via structured parking alerts or anonymous relay.
                </p>
              </div>

              <div className="pt-4 text-xs font-semibold text-emerald-600 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4" />
                <span>Zero spam, zero harassment</span>
              </div>
            </div>

            {/* Feature 3: Anti-Spam Rate Limits */}
            <div className="md:col-span-4 bg-card border border-border/80 rounded-3xl p-8 shadow-sm space-y-3 hover:border-emerald-500/40 transition-all">
              <span className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 inline-block">
                <AlertTriangle className="h-6 w-6" />
              </span>
              <h3 className="text-xl font-bold text-foreground">Anti-Spam Cooldowns</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Cryptographic rate limits prevent bot abuse or malicious repeated triggers.
                A maximum of 3 alerts per 15-minute window is strictly enforced.
              </p>
            </div>

            {/* Feature 4: Campus & Institutional Scale */}
            <div className="md:col-span-8 bg-card border border-border/80 rounded-3xl p-8 shadow-sm flex flex-col justify-between hover:border-emerald-500/40 transition-all">
              <div className="space-y-3">
                <span className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 inline-block">
                  <Building2 className="h-6 w-6" />
                </span>
                <h3 className="text-2xl font-bold text-foreground">
                  Institutional Parking Management
                </h3>
                <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">
                  Colleges, universities, housing societies, and corporate IT parks can register
                  thousands of vehicles in bulk, assign parking bays, and monitor campus parking
                  conflicts through unified admin oversight.
                </p>
              </div>

              <div className="pt-4 flex items-center gap-4 text-xs text-muted-foreground">
                <span>• University Campuses</span>
                <span>• Gated Societies</span>
                <span>• Tech Parks</span>
                <span>• Hospital Routes</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Visual Workflow Section */}
      <section id="how-it-works" className="py-24 bg-slate-50/50 dark:bg-slate-950/40 border-b border-border/40">
        <div className="container max-w-7xl px-4 sm:px-8 mx-auto text-center space-y-12">
          <div className="space-y-3 max-w-2xl mx-auto">
            <Badge variant="subtle" className="text-xs">Simple 3-Step Process</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              How ParkLink Works
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div className="bg-card border border-border rounded-3xl p-8 shadow-sm space-y-4 hover:border-emerald-500/40 transition-all">
              <div className="h-12 w-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-black text-xl">
                1
              </div>
              <h3 className="text-lg font-bold text-foreground">Add Vehicle & Print Sticker</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Register your vehicle in 60 seconds. Download the high-res sticker or printable PDF
                card and attach it to your windshield or sun visor.
              </p>
            </div>

            <div className="bg-card border border-border rounded-3xl p-8 shadow-sm space-y-4 hover:border-emerald-500/40 transition-all">
              <div className="h-12 w-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-black text-xl">
                2
              </div>
              <h3 className="text-lg font-bold text-foreground">Scanner Points Camera</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                If your car is blocking another vehicle or has lights left on, a passerby scans the
                sticker with any standard phone camera. No app download needed.
              </p>
            </div>

            <div className="bg-card border border-border rounded-3xl p-8 shadow-sm space-y-4 hover:border-emerald-500/40 transition-all">
              <div className="h-12 w-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-black text-xl">
                3
              </div>
              <h3 className="text-lg font-bold text-foreground">Instant Alert & Clear Route</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                The scanner taps a 1-click alert or calls you directly. You receive real-time push
                notifications and reposition your car before frustration occurs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section id="faq" className="py-24 border-b border-border/40">
        <div className="container max-w-4xl px-4 sm:px-8 mx-auto space-y-8">
          <div className="text-center space-y-2">
            <Badge variant="subtle" className="text-xs">Common Questions</Badge>
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
                  className="rounded-2xl border border-border bg-card overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between p-5 text-left font-semibold text-sm text-foreground hover:bg-muted/30"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`h-4 w-4 text-muted-foreground transition-transform ${
                        isOpen ? "rotate-180 text-emerald-600" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs text-muted-foreground leading-relaxed border-t border-border/50">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Premium Dark CTA Banner */}
      <section className="py-24 bg-gradient-to-b from-slate-900 to-slate-950 text-white text-center border-t border-slate-800">
        <div className="container max-w-4xl px-4 mx-auto space-y-6">
          <Badge className="bg-emerald-950/80 text-emerald-400 border border-emerald-800 text-xs">
            Instant Deployment
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Protect Your Vehicle. <br />
            Upgrade Your Parking Experience Today.
          </h2>
          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Free forever for individual vehicle owners. Generate your verified QR sticker and start
            parking with total peace of mind.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/register">
              <Button
                size="lg"
                className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold h-12 px-8 shadow-xl"
              >
                Create Free Account <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button
                variant="outline"
                size="lg"
                className="h-12 px-6 border-slate-700 text-slate-300 hover:text-white"
              >
                Campus & Society Inquiries
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
