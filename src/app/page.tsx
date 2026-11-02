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
  ArrowRight,
  CheckCircle2,
  EyeOff,
  Car,
  ChevronDown,
  Lock,
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
      a: "No. Anyone with a smartphone camera can scan the ParkLink QR code. The verified vehicle pass opens in their mobile browser without downloading an app or registering.",
    },
    {
      q: "What happens if I change my phone number or sell my car?",
      a: "Your physical QR sticker never needs reprinting. Because our QR codes point to a permanent dynamic token, any update you make to your phone number or privacy preferences updates instantly in the cloud.",
    },
    {
      q: "Will random strangers be able to see my personal phone number?",
      a: "You have complete control. You can hide your direct telephone number and allow visitors to reach you solely through pre-defined parking alerts or an anonymous contact relay.",
    },
    {
      q: "Can someone spam or harass me with continuous alerts?",
      a: "No. ParkLink enforces cryptographic rate limits, duplicate alert suppression, and sender cooldown timers. Visitors cannot spam alerts, and abusive senders can be reported immediately.",
    },
    {
      q: "Can colleges, universities, or housing societies use ParkLink?",
      a: "Yes. ParkLink includes an institutional management module for campuses, gated societies, IT parks, and hospitals to manage vehicle fleets and issue branded stickers.",
    },
  ];

  const handleCopyDemo = () => {
    navigator.clipboard.writeText("https://parklink.app/v/a8Kp92xLmQ");
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-12 pb-20 md:pt-20 md:pb-28 border-b border-border bg-card">
        <div className="container max-w-7xl px-4 sm:px-8 mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Column: Headline and Value Prop */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-muted border border-border text-xs font-medium text-foreground">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
                <span>Smart vehicle identification and contact system</span>
              </div>

              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground leading-tight">
                Your vehicle. <br />
                <span className="text-emerald-500">One scan.</span> <br />
                Instant connection.
              </h1>

              <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
                Connect with vehicle owners instantly through a permanent dynamic QR sticker. No app download required. Complete privacy preservation.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
                <Link href="/register" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-semibold h-12 px-8 rounded-md transition-colors duration-150"
                  >
                    Get your free vehicle QR <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/v/a8Kp92xLmQ" target="_blank" className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto font-medium h-12 px-6 border-border hover:bg-muted rounded-md transition-colors duration-150"
                  >
                    <Smartphone className="mr-2 h-4 w-4 text-emerald-500" />
                    Live scan demo
                  </Button>
                </Link>
              </div>

              {/* Key Trust Signals */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-muted-foreground font-medium">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>Zero app download</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>Masked phone privacy</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>Permanent dynamic sticker</span>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Demonstration Console */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-sm rounded-2xl border border-border bg-background p-6 space-y-5">
                {/* Switcher Navigation */}
                <div className="grid grid-cols-3 gap-1 p-1 bg-muted rounded-lg text-xs font-medium">
                  <button
                    onClick={() => setDemoTab("pass")}
                    className={`py-1.5 rounded text-center transition-colors duration-150 ${
                      demoTab === "pass"
                        ? "bg-background text-foreground font-semibold shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Digital pass
                  </button>
                  <button
                    onClick={() => setDemoTab("alert")}
                    className={`py-1.5 rounded text-center transition-colors duration-150 ${
                      demoTab === "alert"
                        ? "bg-background text-foreground font-semibold shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    1-Tap alert
                  </button>
                  <button
                    onClick={() => setDemoTab("relay")}
                    className={`py-1.5 rounded text-center transition-colors duration-150 ${
                      demoTab === "relay"
                        ? "bg-background text-foreground font-semibold shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Masked call
                  </button>
                </div>

                {/* Identity Header */}
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-md bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                      <Car className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-foreground">Hyundai Creta SX</div>
                      <div className="text-xs font-mono font-bold text-emerald-500">
                        DL 01 AB 1234
                      </div>
                    </div>
                  </div>
                  <Badge variant="success" className="text-xs">
                    Active
                  </Badge>
                </div>

                {demoTab === "pass" && (
                  <div className="space-y-4">
                    <div className="p-4 border border-border rounded-xl text-center space-y-2 bg-muted/30">
                      <div className="mx-auto w-32 h-32 bg-white p-2 rounded-lg flex items-center justify-center border border-slate-200">
                        <QrCode className="h-28 w-28 text-slate-900" />
                      </div>
                      <div className="text-xs font-semibold text-emerald-500">
                        ParkLink verified dynamic QR
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">
                        parklink.app/v/a8Kp92xLmQ
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopyDemo}
                        className="flex-1 text-xs h-9 transition-colors duration-150"
                      >
                        {copiedLink ? <Check className="mr-1 h-3.5 w-3.5" /> : <Copy className="mr-1 h-3.5 w-3.5" />}
                        {copiedLink ? "Copied URL" : "Copy permanent URL"}
                      </Button>
                      <Link href="/v/a8Kp92xLmQ" target="_blank">
                        <Button variant="outline" size="sm" className="text-xs h-9 transition-colors duration-150">
                          Scan live
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}

                {demoTab === "alert" && (
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg border border-border text-xs text-muted-foreground">
                      Visitors select a predefined issue with one tap. Zero typing needed.
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="p-2.5 rounded-lg border border-emerald-500 bg-muted flex items-center justify-between font-medium">
                        <span className="flex items-center gap-2">
                          <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
                          Vehicle blocking another vehicle
                        </span>
                        <Badge variant="success" className="text-xs">Selected</Badge>
                      </div>
                      <div className="p-2.5 rounded-lg border border-border flex items-center justify-between text-muted-foreground">
                        <span className="flex items-center gap-2">
                          <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                          Headlights left switched on
                        </span>
                      </div>
                      <div className="p-2.5 rounded-lg border border-border flex items-center justify-between text-muted-foreground">
                        <span className="flex items-center gap-2">
                          <Eye className="h-3.5 w-3.5 text-sky-500" />
                          Vehicle window appears open
                        </span>
                      </div>
                    </div>

                    <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-9 font-semibold transition-colors duration-150">
                      Send parking alert to owner
                    </Button>
                  </div>
                )}

                {demoTab === "relay" && (
                  <div className="space-y-4">
                    <div className="p-3 rounded-lg border border-border text-xs space-y-1 text-muted-foreground">
                      <div className="font-semibold text-foreground flex items-center gap-1.5">
                        <Lock className="h-3.5 w-3.5 text-emerald-500" />
                        Number masking active
                      </div>
                      <p>Visitors can call without seeing your private telephone number.</p>
                    </div>

                    <div className="space-y-2">
                      <a href="tel:+919876543210" className="block w-full">
                        <Button
                          variant="outline"
                          className="w-full justify-between h-10 text-xs font-semibold border-border hover:bg-muted transition-colors duration-150"
                        >
                          <span className="flex items-center gap-2">
                            <PhoneCall className="h-3.5 w-3.5 text-emerald-500" />
                            Call owner securely
                          </span>
                          <span className="text-xs text-muted-foreground">Direct</span>
                        </Button>
                      </a>

                      <Button
                        variant="secondary"
                        className="w-full justify-between h-10 text-xs font-semibold transition-colors duration-150"
                      >
                        <span className="flex items-center gap-2">
                          <MessageCircle className="h-3.5 w-3.5 text-emerald-500" />
                          WhatsApp driver
                        </span>
                        <span className="text-xs text-muted-foreground">Pre-filled</span>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Architectural Pillars */}
      <section id="features" className="py-20 border-b border-border">
        <div className="container max-w-7xl px-4 sm:px-8 mx-auto space-y-10">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground">
              Engineered for real-world parking friction
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Every detail is built to resolve blocked driveways in seconds while maintaining full owner privacy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-8 border border-border rounded-2xl p-7 bg-card space-y-4">
              <div className="space-y-2">
                <span className="p-2.5 rounded-lg bg-muted text-emerald-500 inline-block">
                  <Zap className="h-5 w-5" />
                </span>
                <h3 className="text-xl font-bold text-foreground">
                  Permanent dynamic URL: never reprint again
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Basic QR generators encode your telephone number directly on the sticker. If you change your number, the physical sticker becomes obsolete. ParkLink encodes a permanent opaque token: your sticker links to cloud settings that update in realtime.
                </p>
              </div>

              <div className="pt-4 border-t border-border grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <strong className="text-foreground block font-semibold">Token rotation</strong>
                  <span className="text-muted-foreground">Rotate compromised stickers with one click.</span>
                </div>
                <div>
                  <strong className="text-foreground block font-semibold">Vector SVG and print PDF</strong>
                  <span className="text-muted-foreground">High-contrast printing for windshield placement.</span>
                </div>
                <div>
                  <strong className="text-foreground block font-semibold">Instant cloud sync</strong>
                  <span className="text-muted-foreground">Immediate propagation when phone numbers change.</span>
                </div>
              </div>
            </div>

            <div className="md:col-span-4 border border-border rounded-2xl p-7 bg-card space-y-3">
              <span className="p-2.5 rounded-lg bg-muted text-emerald-500 inline-block">
                <EyeOff className="h-5 w-5" />
              </span>
              <h3 className="text-lg font-bold text-foreground">Complete masked privacy</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Avoid leaving handwritten phone numbers on dashboards. Keep your phone number hidden and communicate through structured parking alerts or anonymous relay.
              </p>
              <div className="pt-2 text-xs font-semibold text-emerald-500 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4" />
                <span>Zero spam, zero harassment</span>
              </div>
            </div>

            <div className="md:col-span-4 border border-border rounded-2xl p-7 bg-card space-y-3">
              <span className="p-2.5 rounded-lg bg-muted text-amber-500 inline-block">
                <AlertTriangle className="h-5 w-5" />
              </span>
              <h3 className="text-lg font-bold text-foreground">Anti-spam rate limits</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Cryptographic rate limiting prevents repeated triggers. Senders are restricted to a maximum of three alerts per fifteen-minute window.
              </p>
            </div>

            <div className="md:col-span-8 border border-border rounded-2xl p-7 bg-card space-y-4">
              <div className="space-y-2">
                <span className="p-2.5 rounded-lg bg-muted text-emerald-500 inline-block">
                  <Building2 className="h-5 w-5" />
                </span>
                <h3 className="text-xl font-bold text-foreground">
                  Institutional parking management
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Colleges, universities, gated housing societies, and corporate business parks can register thousands of vehicles in bulk, designate parking zones, and manage parking conflicts through centralized administrative oversight.
                </p>
              </div>

              <div className="pt-2 flex flex-wrap gap-4 text-xs text-muted-foreground font-medium">
                <span>University campuses</span>
                <span>Gated societies</span>
                <span>Corporate tech parks</span>
                <span>Hospital facilities</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3-Step Timeline */}
      <section id="how-it-works" className="py-20 bg-muted/30 border-b border-border">
        <div className="container max-w-7xl px-4 sm:px-8 mx-auto text-center space-y-10">
          <div className="space-y-2 max-w-2xl mx-auto">
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground">
              How ParkLink works
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Three straightforward steps from registration to active vehicle protection.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="border border-border rounded-2xl p-6 bg-card space-y-3">
              <div className="h-10 w-10 rounded-lg bg-muted text-emerald-500 flex items-center justify-center font-bold text-base">
                1
              </div>
              <h3 className="text-base font-bold text-foreground">Register vehicle and print sticker</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Add your vehicle details. Download the vector sticker or print-ready PDF card and place it inside your windshield.
              </p>
            </div>

            <div className="border border-border rounded-2xl p-6 bg-card space-y-3">
              <div className="h-10 w-10 rounded-lg bg-muted text-emerald-500 flex items-center justify-center font-bold text-base">
                2
              </div>
              <h3 className="text-base font-bold text-foreground">Scanner points camera</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                If your vehicle blocks an exit or has lights left on, a passerby scans the QR code with any standard smartphone camera. No app download needed.
              </p>
            </div>

            <div className="border border-border rounded-2xl p-6 bg-card space-y-3">
              <div className="h-10 w-10 rounded-lg bg-muted text-emerald-500 flex items-center justify-center font-bold text-base">
                3
              </div>
              <h3 className="text-base font-bold text-foreground">Instant alert and clear route</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                The scanner sends a 1-tap alert or connects through the masked relay. You receive realtime notifications and can move your vehicle immediately.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section id="faq" className="py-20 border-b border-border">
        <div className="container max-w-4xl px-4 sm:px-8 mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground">
              Frequently asked questions
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-border bg-card overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between p-4 text-left font-semibold text-xs sm:text-sm text-foreground hover:bg-muted transition-colors duration-150"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`h-4 w-4 text-muted-foreground transition-transform duration-150 ${
                        isOpen ? "rotate-180 text-emerald-500" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 text-xs text-muted-foreground leading-relaxed border-t border-border">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20 bg-card text-foreground text-center border-b border-border">
        <div className="container max-w-3xl px-4 mx-auto space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Protect your vehicle and improve parking today
          </h2>
          <p className="text-muted-foreground text-xs sm:text-sm max-w-lg mx-auto leading-relaxed">
            Free for individual vehicle owners. Generate your verified QR sticker and start parking with confidence.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/register">
              <Button
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold h-11 px-8 rounded-md transition-colors duration-150"
              >
                Create free account <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button
                variant="outline"
                size="lg"
                className="h-11 px-6 border-border rounded-md text-foreground hover:bg-muted transition-colors duration-150"
              >
                Campus and society inquiries
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
