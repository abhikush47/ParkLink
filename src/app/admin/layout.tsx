"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ShieldAlert,
  Users,
  Car,
  QrCode,
  AlertTriangle,
  Flag,
  FileText,
  Sliders,
  ArrowLeft,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  Send,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

const ADMIN_NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/users", label: "User Management", icon: Users },
  { href: "/admin/vehicles", label: "Vehicle Fleet", icon: Car },
  { href: "/admin/qr-codes", label: "QR Code Registry", icon: QrCode },
  { href: "/admin/alerts", label: "Parking Alerts", icon: AlertTriangle },
  { href: "/admin/telegram", label: "Telegram Bot", icon: Send },
  { href: "/admin/reports", label: "Abuse Reports", icon: Flag },
  { href: "/admin/audit-logs", label: "Audit Logs", icon: FileText },
  { href: "/admin/settings", label: "Platform Settings", icon: Sliders },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);

  // If viewing the admin login screen, render it without the admin dashboard shell
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col md:flex-row">
      {/* Admin Sidebar */}
      <aside className="w-full md:w-64 border-r border-slate-800 bg-slate-950 p-5 flex flex-col justify-between shrink-0">
        <div className="space-y-6">
          {/* Logo / Badge */}
          <div className="flex items-center gap-2.5 px-2">
            <div className="h-8 w-8 rounded-lg bg-rose-600 flex items-center justify-center text-white font-bold text-sm">
              <ShieldAlert className="h-4 w-4" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-white">
                ParkLink <span className="text-rose-400 text-xs font-mono">admin</span>
              </span>
              <span className="text-[10px] block text-slate-400">Super Administrator</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-1">
            {ADMIN_NAV.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/admin" && pathname?.startsWith(item.href));
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors duration-150 ${
                    isActive
                      ? "bg-rose-600 text-white font-semibold"
                      : "text-slate-400 hover:bg-slate-900 hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Switch to User Dashboard */}
        <div className="pt-4 border-t border-slate-800 space-y-2">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Owner Dashboard</span>
          </Link>
        </div>
      </aside>

      {/* Admin Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-slate-800 bg-slate-950 px-6 sm:px-8 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>Authenticated Admin Session</span>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/dashboard">
              <Button size="sm" variant="outline" className="text-xs h-8 border-slate-700 text-slate-200">
                Exit to App
              </Button>
            </Link>
          </div>
        </header>

        <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
