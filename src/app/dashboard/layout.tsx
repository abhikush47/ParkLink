"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Car,
  QrCode,
  Bell,
  MessageSquare,
  BarChart3,
  Settings,
  AlertTriangle,
  LogOut,
  Menu,
  X,
  Shield,
  ChevronRight,
  User,
  Send,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import type { Profile } from "@/types/database";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/vehicles", label: "My Vehicles", icon: Car },
  { href: "/dashboard/qr", label: "QR Management", icon: QrCode },
  { href: "/dashboard/alerts", label: "Parking Alerts", icon: AlertTriangle },
  { href: "/dashboard/messages", label: "Messages Relay", icon: MessageSquare },
  { href: "/dashboard/telegram", label: "Telegram Bot", icon: Send },
  { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/settings", label: "Account Settings", icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let isMounted = true;
    async function fetchSession() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

          if (isMounted && data) {
            setProfile(data);
          }

          // Count unread notifications
          const { count } = await supabase
            .from("notifications")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("is_read", false);

          if (isMounted && count !== null) {
            setUnreadCount(count);
          }
        }
      } catch (err) {
        console.error("Dashboard session load error", err);
      }
    }

    fetchSession();
    return () => {
      isMounted = false;
    };
  }, [pathname]);

  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      toast.success("Signed out successfully");
      router.push("/login");
      router.refresh();
    } catch {
      router.push("/login");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card p-5 space-y-6 shrink-0">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 px-2">
          <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-sm">
            P
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground">
            Park<span className="text-emerald-600">Link</span>
          </span>
        </Link>

        {/* Navigation list */}
        <nav className="flex-1 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname?.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors duration-150 ${
                  isActive
                    ? "bg-emerald-600 text-white font-semibold"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </div>
                {item.href === "/dashboard/notifications" && unreadCount > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                      isActive ? "bg-white text-emerald-800" : "bg-emerald-600 text-white"
                    }`}
                  >
                    {unreadCount}
                  </span>
                )}
              </Link>
            );
          })}

          {/* Super Admin Access Link if user is admin */}
          {profile?.role === "admin" && (
            <div className="pt-3 mt-3 border-t border-border">
              <Link
                href="/admin"
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors duration-150"
              >
                <Shield className="h-4 w-4 shrink-0" />
                <span>Super Admin Panel</span>
              </Link>
            </div>
          )}
        </nav>

        {/* User mini badge & Sign out */}
        <div className="pt-3 border-t border-border flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-foreground font-semibold text-xs shrink-0">
              {profile?.full_name?.charAt(0).toUpperCase() || <User className="h-3.5 w-3.5" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium text-foreground truncate">
                {profile?.full_name || "Vehicle Owner"}
              </div>
              <div className="text-[10px] text-muted-foreground truncate font-mono">
                {profile?.phone_number || "Active Account"}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-muted rounded transition-colors duration-150"
            title="Sign Out"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="h-14 border-b border-border bg-card px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 text-muted-foreground hover:text-foreground rounded"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
            <div className="text-xs font-medium text-muted-foreground hidden sm:flex items-center gap-1.5">
              <span>ParkLink</span>
              <ChevronRight className="h-3 w-3" />
              <span className="text-foreground capitalize">
                {pathname?.split("/").pop() || "Dashboard"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/dashboard/notifications" className="relative p-1.5 text-muted-foreground hover:text-foreground rounded">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-emerald-600" />
              )}
            </Link>
            <Link href="/dashboard/vehicles/new">
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 px-3">
                + Add vehicle
              </Button>
            </Link>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-border bg-card p-4 space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname?.startsWith(item.href));
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium ${
                    isActive
                      ? "bg-emerald-600 text-white"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.href === "/dashboard/notifications" && unreadCount > 0 && (
                    <span className="text-[10px] bg-white text-emerald-800 font-mono px-1.5 py-0.2 rounded">
                      {unreadCount}
                    </span>
                  )}
                </Link>
              );
            })}
            <div className="pt-2 border-t border-border">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="w-full justify-start text-xs text-destructive hover:bg-destructive/10"
              >
                <LogOut className="mr-2 h-3.5 w-3.5" /> Sign out
              </Button>
            </div>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
