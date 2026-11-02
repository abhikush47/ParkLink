import React from "react";
import Link from "next/link";
import { ShieldCheck, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-slate-50 dark:bg-slate-950/50 py-12 px-4 sm:px-8">
      <div className="container max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brand */}
        <div className="space-y-3 md:col-span-1">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-black text-sm">
              P
            </div>
            <span className="text-lg font-bold text-foreground">
              Park<span className="text-emerald-600">Link</span>
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Your Vehicle. One Scan. Instant Connection. Dynamic QR-based smart parking assistance
            and vehicle contact platform.
          </p>
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-medium">
            <ShieldCheck className="h-4 w-4" />
            <span>Privacy-First Architecture</span>
          </div>
        </div>

        {/* Product Links */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Product</h4>
          <ul className="space-y-2 text-xs text-muted-foreground">
            <li>
              <Link href="#how-it-works" className="hover:text-foreground transition-colors">
                How It Works
              </Link>
            </li>
            <li>
              <Link href="#features" className="hover:text-foreground transition-colors">
                Smart Parking Alerts
              </Link>
            </li>
            <li>
              <Link href="#institutions" className="hover:text-foreground transition-colors">
                Institutions & Campuses
              </Link>
            </li>
            <li>
              <Link href="/dashboard/qr" className="hover:text-foreground transition-colors">
                Dynamic QR Stickers
              </Link>
            </li>
          </ul>
        </div>

        {/* Solutions & Resources */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Solutions</h4>
          <ul className="space-y-2 text-xs text-muted-foreground">
            <li>
              <Link href="#institutions" className="hover:text-foreground transition-colors">
                Universities & Colleges
              </Link>
            </li>
            <li>
              <Link href="#institutions" className="hover:text-foreground transition-colors">
                Residential Societies
              </Link>
            </li>
            <li>
              <Link href="#institutions" className="hover:text-foreground transition-colors">
                Corporate IT Parks
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-foreground transition-colors">
                Custom Deployments
              </Link>
            </li>
          </ul>
        </div>

        {/* Legal & Privacy */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Legal</h4>
          <ul className="space-y-2 text-xs text-muted-foreground">
            <li>
              <Link href="/privacy" className="hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-foreground transition-colors">
                Terms of Service
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-foreground transition-colors">
                Support & Contact
              </Link>
            </li>
            <li>
              <Link href="/admin" className="hover:text-foreground transition-colors">
                Staff Portal
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="container max-w-7xl mx-auto mt-10 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-3">
        <p>© {new Date().getFullYear()} ParkLink Technologies Inc. All rights reserved.</p>
        <p className="flex items-center gap-1">
          Engineered for safer communities & hassle-free parking.
        </p>
      </div>
    </footer>
  );
}

