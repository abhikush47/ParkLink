"use client";

import React, { useState } from "react";
import { Flag, CheckCircle2 } from "lucide-react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

interface ReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: string;
  vehicleReg: string;
}

export function ReportModal({ open, onOpenChange, token, vehicleReg }: ReportModalProps) {
  const toast = useToast();
  const [reason, setReason] = useState<"misuse" | "fake_vehicle" | "harassment" | "illegal_parking" | "other">("misuse");
  const [details, setDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/reports/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, reason, details: details.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to submit report");
      }
      setSubmitted(true);
    } catch (err: any) {
      toast.error(err.message || "Error submitting report");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setSubmitted(false);
      setDetails("");
      setReason("misuse");
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      {submitted ? (
        <div className="py-6 text-center space-y-4 animate-in fade-in zoom-in-95">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground">Report Received</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
              Thank you. Our moderation team has logged your report regarding vehicle{" "}
              <strong>{vehicleReg}</strong> and will investigate.
            </p>
          </div>
          <div className="pt-4">
            <Button onClick={handleClose} className="w-full">
              Close
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-2 rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                <Flag className="h-5 w-5" />
              </span>
              <DialogTitle>Report Vehicle or QR</DialogTitle>
            </div>
            <DialogDescription>
              Report suspicious activity, misplaced sticker, or harassment related to {vehicleReg}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-3">
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Reason for report
              </label>
              <select
                value={reason}
                onChange={(e: any) => setReason(e.target.value)}
                className="w-full text-sm rounded-lg border border-input bg-background p-2.5 text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="misuse">QR Misuse / Fake QR Sticker</option>
                <option value="fake_vehicle">Vehicle info does not match actual car</option>
                <option value="harassment">Harassment or abusive behavior</option>
                <option value="illegal_parking">Repeated abandoned / illegal parking</option>
                <option value="other">Other issue</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Additional Details (Optional)
              </label>
              <textarea
                rows={3}
                maxLength={500}
                placeholder="Please describe what you observed..."
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                className="w-full text-xs rounded-lg border border-input bg-background p-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive" isLoading={isSubmitting}>
              Submit Report
            </Button>
          </DialogFooter>
        </form>
      )}
    </Dialog>
  );
}

