import React from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card py-12 px-4 sm:px-8">
      <div className="container max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brand */}
        <div className="space-y-3 md:col-span-1">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-black text-sm">
              P
            </div>
            <span className="text-lg font-bold text-foreground">
              Park<span className="text-emerald-500">Link</span>
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Your vehicle. One scan. Instant connection. Dynamic QR-based vehicle contact and parking alert platform.
          </p>
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            <ShieldCheck className="h-4 w-4" />
            <span>Privacy-first architecture</span>
          </div>
        </div>

        {/* Product Links */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-semibold text-foreground">Product</h4>
          <ul className="space-y-2 text-xs text-muted-foreground">
            <li>
              <Link href="#how-it-works" className="hover:text-foreground transition-colors duration-150">
                How it works
              </Link>
            </li>
            <li>
              <Link href="#features" className="hover:text-foreground transition-colors duration-150">
                Parking alerts
              </Link>
            </li>
            <li>
              <Link href="#institutions" className="hover:text-foreground transition-colors duration-150">
                Campuses and societies
              </Link>
            </li>
            <li>
              <Link href="/dashboard/qr" className="hover:text-foreground transition-colors duration-150">
                Dynamic QR studio
              </Link>
            </li>
          </ul>
        </div>

        {/* Solutions & Resources */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-semibold text-foreground">Solutions</h4>
          <ul className="space-y-2 text-xs text-muted-foreground">
            <li>
              <Link href="#institutions" className="hover:text-foreground transition-colors duration-150">
                Universities and colleges
              </Link>
            </li>
            <li>
              <Link href="#institutions" className="hover:text-foreground transition-colors duration-150">
                Residential societies
              </Link>
            </li>
            <li>
              <Link href="#institutions" className="hover:text-foreground transition-colors duration-150">
                Commercial IT parks
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-foreground transition-colors duration-150">
                Custom deployments
              </Link>
            </li>
          </ul>
        </div>

        {/* Legal & Privacy */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-semibold text-foreground">Legal</h4>
          <ul className="space-y-2 text-xs text-muted-foreground">
            <li>
              <Link href="/privacy" className="hover:text-foreground transition-colors duration-150">
                Privacy policy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-foreground transition-colors duration-150">
                Terms of service
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-foreground transition-colors duration-150">
                Support and contact
              </Link>
            </li>
            <li>
              <Link href="/admin" className="hover:text-foreground transition-colors duration-150">
                Staff console
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="container max-w-7xl mx-auto mt-10 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-3">
        <p>© {new Date().getFullYear()} ParkLink Technologies. Dynamic vehicle identity infrastructure.</p>
        <p>Engineered for safe parking and direct driver resolution.</p>
      </div>
    </footer>
  );
}
