"use client";

import React, { useState } from "react";
import { AlertCircle, CheckCircle2, ShieldAlert, Car, Eye, Lightbulb, Compass, HelpCircle } from "lucide-react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import type { AlertCategory } from "@/types/database";

interface ParkingAlertModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: string;
  vehicleReg: string;
  onAlertSent?: () => void;
}

const ALERT_CATEGORIES: { id: AlertCategory; label: string; icon: React.ReactNode; desc: string }[] = [
  {
    id: "blocking",
    label: "Vehicle is blocking another vehicle",
    icon: <Car className="h-5 w-5 text-rose-500 shrink-0" />,
    desc: "I cannot move my car out because this vehicle is parked in front.",
  },
  {
    id: "please_move",
    label: "Please move your vehicle",
    icon: <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />,
    desc: "Urgent request to reposition or vacate the spot.",
  },
  {
    id: "lights_on",
    label: "Vehicle lights are switched on",
    icon: <Lightbulb className="h-5 w-5 text-yellow-500 shrink-0" />,
    desc: "Headlights or cabin lights left turned on, battery may drain.",
  },
  {
    id: "window_open",
    label: "Vehicle window appears open",
    icon: <Eye className="h-5 w-5 text-sky-500 shrink-0" />,
    desc: "Window left down or partially open, risk of rain or theft.",
  },
  {
    id: "parked_incorrectly",
    label: "Vehicle may be parked incorrectly",
    icon: <Compass className="h-5 w-5 text-purple-500 shrink-0" />,
    desc: "Across lines, in reserved bay, or obstructing a pathway.",
  },
  {
    id: "other",
    label: "Other issue",
    icon: <HelpCircle className="h-5 w-5 text-slate-500 shrink-0" />,
    desc: "Custom note regarding this vehicle.",
  },
];

export function ParkingAlertModal({
  open,
  onOpenChange,
  token,
  vehicleReg,
  onAlertSent,
}: ParkingAlertModalProps) {
  const toast = useToast();
  const [selectedCategory, setSelectedCategory] = useState<AlertCategory>("blocking");
  const [customMessage, setCustomMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/alerts/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          category: selectedCategory,
          custom_message: customMessage.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || "Failed to submit parking alert");
      }

      setSubmitted(true);
      if (onAlertSent) onAlertSent();
    } catch (err: any) {
      toast.error(err.message || "Could not send parking alert");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset state after closing animation
    setTimeout(() => {
      setSubmitted(false);
      setCustomMessage("");
      setSelectedCategory("blocking");
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      {submitted ? (
        <div className="py-6 text-center space-y-4 animate-in fade-in zoom-in-95">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground">Alert Delivered!</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
              We notified the owner of <strong>{vehicleReg}</strong> immediately. They can view
              your alert in their notification centre.
            </p>
          </div>
          <div className="pt-4">
            <Button onClick={handleClose} className="w-full">
              Done
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-2 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                <ShieldAlert className="h-5 w-5" />
              </span>
              <DialogTitle>Send Parking Alert</DialogTitle>
            </div>
            <DialogDescription>
              Select the situation for vehicle <strong>{vehicleReg}</strong>. The owner will be
              alerted immediately without revealing your identity.
            </DialogDescription>
          </DialogHeader>

          {/* Categories Grid */}
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1 my-3">
            {ALERT_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <label
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-start gap-3 p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    isSelected
                      ? "border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 ring-1 ring-emerald-600"
                      : "border-border hover:bg-muted/40"
                  }`}
                >
                  <input
                    type="radio"
                    name="alertCategory"
                    checked={isSelected}
                    onChange={() => setSelectedCategory(cat.id)}
                    className="sr-only"
                  />
                  <div className="mt-0.5">{cat.icon}</div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-foreground">{cat.label}</div>
                    <div className="text-xs text-muted-foreground">{cat.desc}</div>
                  </div>
                </label>
              );
            })}
          </div>

          {/* Optional Note */}
          <div className="mt-4">
            <label className="text-xs font-medium text-foreground block mb-1">
              Optional Message to Owner (max 500 chars)
            </label>
            <textarea
              rows={2}
              maxLength={500}
              placeholder="e.g., I'm driving the red sedan parked right behind you, need to leave in 10 mins."
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="w-full text-xs rounded-lg border border-input bg-background p-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>🛡️ Privacy protected • Instant push notification</span>
            <span>{customMessage.length}/500</span>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Send Alert
            </Button>
          </DialogFooter>
        </form>
      )}
    </Dialog>
  );
}

