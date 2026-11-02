import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="container max-w-4xl mx-auto px-4 sm:px-8 py-12 flex-1 space-y-8">
        <div className="space-y-3 pb-6 border-b border-border">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            ParkLink Terms of Service
          </h1>
          <p className="text-sm text-muted-foreground">Effective Date: November 2026</p>
        </div>

        <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-foreground">1. Acceptance of Terms</h2>
            <p>
              By registering an account, generating a QR sticker, or accessing a vehicle profile on
              ParkLink, you agree to comply with and be bound by these Terms of Service.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-foreground">2. Appropriate Vehicle Use</h2>
            <p>
              You warrant that you are the lawful owner or authorized operator of any vehicle you
              register on ParkLink. Registering fraudulent vehicle numbers or applying stickers to
              vehicles without the owner’s consent is strictly prohibited and grounds for immediate
              account termination.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-foreground">3. Visitor Code of Conduct</h2>
            <p>
              The public scanning interface and parking alert system are intended solely for lawful,
              courteous vehicle assistance and parking conflict resolution. Utilizing alerts or
              anonymous relays for harassment, spam, threats, or defamation is illegal and will be
              reported to appropriate law enforcement authorities.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-foreground">4. Service Availability & Disclaimers</h2>
            <p>
              ParkLink facilitates communication between drivers and visitors. ParkLink is not
              responsible for physical vehicle damage, parking fines, or traffic citations resulting
              from illegal parking behaviors.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
