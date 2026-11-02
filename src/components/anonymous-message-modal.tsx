"use client";

import React, { useState } from "react";
import { MessageSquare, CheckCircle2, ShieldCheck, Send } from "lucide-react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

interface AnonymousMessageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: string;
  vehicleReg: string;
}

export function AnonymousMessageModal({
  open,
  onOpenChange,
  token,
  vehicleReg,
}: AnonymousMessageModalProps) {
  const toast = useToast();
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      toast.warning("Please type a message first");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/messages/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          message: message.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || "Failed to deliver message");
      }

      setSubmitted(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to send anonymous message");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setSubmitted(false);
      setMessage("");
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
            <h3 className="text-xl font-bold text-foreground">Message Relayed!</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
              Your message was delivered privately to the owner of <strong>{vehicleReg}</strong>.
              Neither your phone number nor personal details were disclosed.
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
              <span className="p-2 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                <MessageSquare className="h-5 w-5" />
              </span>
              <DialogTitle>Anonymous Contact Relay</DialogTitle>
            </div>
            <DialogDescription>
              Privately message the driver of <strong>{vehicleReg}</strong>. Your number remains
              completely confidential.
            </DialogDescription>
          </DialogHeader>

          <div className="my-3">
            <textarea
              rows={4}
              maxLength={1000}
              required
              placeholder="e.g., Hi, I need to leave bay #4 in 15 minutes, please reposition your car."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full text-sm rounded-xl border border-input bg-background p-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <div className="flex justify-between items-center text-[11px] text-muted-foreground mt-1 px-1">
              <span className="flex items-center gap-1">
                <ShieldCheck className="h-3 w-3 text-emerald-600" />
                Zero personal data shared
              </span>
              <span>{message.length}/1000</span>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              <Send className="mr-1.5 h-4 w-4" /> Send Message
            </Button>
          </DialogFooter>
        </form>
      )}
    </Dialog>
  );
}

