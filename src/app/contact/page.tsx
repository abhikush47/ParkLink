"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Phone, MapPin, CheckCircle2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";

export default function ContactPage() {
  const toast = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      toast.success("Thank you! Our support team will respond shortly.");
    }, 800);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="container max-w-5xl mx-auto px-4 sm:px-8 py-12 flex-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Left contact info */}
          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                Support & Partnerships
              </span>
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground mt-1">
                Get in Touch with ParkLink
              </h1>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                Whether you have questions about our dynamic vehicle QR codes, need campus
                institutional deployments, or need help with your account, our team is here.
              </p>
            </div>

            <div className="space-y-4 text-sm text-muted-foreground pt-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-semibold text-foreground text-xs">Email Inquiries</div>
                  <div className="text-xs">support@parklink.app</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-semibold text-foreground text-xs">Campus Deployments</div>
                  <div className="text-xs">+91 11 4000 7890 / +977 1 4500000</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-semibold text-foreground text-xs">Headquarters</div>
                  <div className="text-xs">ParkLink Technologies, Tech Hub Innovation Campus</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right form */}
          <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm">
            {submitted ? (
              <div className="py-12 text-center space-y-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Message Dispatched</h3>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                  We have received your message and assigned a ticket. You will hear from us within
                  24 hours.
                </p>
                <Button variant="outline" size="sm" onClick={() => setSubmitted(false)}>
                  Send Another Message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="text-lg font-bold text-foreground">Send a Message</h3>
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">Your Name</label>
                  <Input required placeholder="Jane Doe" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">Email Address</label>
                  <Input type="email" required placeholder="jane@example.com" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">Subject</label>
                  <Input required placeholder="Institutional deployment / Help" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">Message</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Tell us what you need..."
                    className="w-full text-xs rounded-lg border border-input bg-background p-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <Button type="submit" isLoading={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                  Send Message
                </Button>
              </form>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
