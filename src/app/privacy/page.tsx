import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ShieldCheck } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="container max-w-4xl mx-auto px-4 sm:px-8 py-12 flex-1 space-y-8">
        <div className="space-y-3 pb-6 border-b border-border">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-full">
            <ShieldCheck className="h-4 w-4" />
            Privacy Policy
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            ParkLink Privacy & Data Protection Policy
          </h1>
          <p className="text-sm text-muted-foreground">Last updated: November 2026</p>
        </div>

        <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-foreground">1. Privacy by Architecture</h2>
            <p>
              ParkLink was built specifically to eliminate the need for vehicle owners to write
              their personal mobile numbers on handwritten slips placed on car dashboards. We treat
              privacy as an essential civil utility, not an afterthought.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-foreground">2. Information We Collect</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Account Information:</strong> Name, verified email address, and encrypted
                password.
              </li>
              <li>
                <strong>Vehicle Details:</strong> Registration number, vehicle type, make, model,
                color, and optional parking description.
              </li>
              <li>
                <strong>Visitor Scans & Alerts:</strong> When a visitor scans your QR code or
                submits a parking alert, we log timestamp, action type, and a cryptographic,
                non-reversible one-way hash of client headers to enforce anti-spam rate limiting.
                We do NOT store raw IP addresses indefinitely.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-foreground">3. What Scanners Can and Cannot See</h2>
            <p>
              When a visitor scans your vehicle QR code, they see only the vehicle profile fields you
              have explicitly marked as public. If you choose to hide your phone number, visitors
              cannot access it under any circumstances and must contact you via structured parking
              alerts or the Anonymous Contact Relay.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-foreground">4. QR Code Security & Token Rotation</h2>
            <p>
              Every vehicle is issued a cryptographically secure, non-sequential token. No personal
              data is ever embedded into the physical QR code graphic. If you ever feel your sticker
              has been compromised, you can rotate the token instantly from your dashboard,
              immediately invalidating the old QR sticker.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-foreground">5. Contact Us</h2>
            <p>
              If you have any questions or data privacy inquiries, please contact our Data
              Protection Officer at{" "}
              <Link href="/contact" className="text-emerald-600 underline">
                support@parklink.app
              </Link>
              .
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}

