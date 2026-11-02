"use client";

import React, { useState } from "react";
import { Sliders, Save, ShieldAlert, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

export default function AdminSettingsPage() {
  const toast = useToast();
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [rateLimitScans, setRateLimitScans] = useState("30");
  const [rateLimitAlerts, setRateLimitAlerts] = useState("3");
  const [alertCooldownMin, setAlertCooldownMin] = useState("15");
  const [saving, setSaving] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success("Platform settings saved and deployed!");
    }, 600);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Platform Settings</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Global anti-bot limits, rate limit thresholds, and system maintenance switches.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Anti-bot rate limits */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Sliders className="h-4 w-4 text-rose-500" /> Rate Limits & Anti-Abuse
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Max Alerts Per Sender (15 Min Window)
              </label>
              <Input
                type="number"
                value={rateLimitAlerts}
                onChange={(e) => setRateLimitAlerts(e.target.value)}
                className="bg-slate-900 border-slate-800 text-white text-xs"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Blocks callers attempting rapid consecutive spam submissions.
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Duplicate Alert Cooldown (Minutes)
              </label>
              <Input
                type="number"
                value={alertCooldownMin}
                onChange={(e) => setAlertCooldownMin(e.target.value)}
                className="bg-slate-900 border-slate-800 text-white text-xs"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Suppresses identical alert types sent to the same vehicle.
              </p>
            </div>
          </div>
        </div>

        {/* Maintenance mode */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-amber-500" /> Platform Maintenance
          </h2>

          <label className="flex items-center justify-between p-4 rounded-xl border border-slate-800 bg-slate-900/50 cursor-pointer">
            <div className="space-y-0.5 pr-4">
              <div className="text-xs font-semibold text-white">System Maintenance Mode</div>
              <div className="text-[11px] text-slate-400">
                When enabled, vehicle registrations are paused while existing QR scanning continues.
              </div>
            </div>
            <input
              type="checkbox"
              checked={maintenanceMode}
              onChange={(e) => setMaintenanceMode(e.target.checked)}
              className="h-4 w-4 rounded text-rose-600 focus:ring-rose-500"
            />
          </label>
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            isLoading={saving}
            className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
          >
            <Save className="mr-1.5 h-3.5 w-3.5" /> Save Platform Settings
          </Button>
        </div>
      </form>
    </div>
  );
}
