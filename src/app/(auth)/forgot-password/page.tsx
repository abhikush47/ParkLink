"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, CheckCircle2, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

export default function ForgotPasswordPage() {
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      const supabase = createClient();
      const origin = window.location.origin;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/reset-password`,
      });

      if (error) {
        setErrorMsg(error.message);
        toast.error(error.message);
        return;
      }

      setSubmitted(true);
      toast.success("Password reset instructions dispatched!");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to initiate password reset");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center py-12 px-4 sm:px-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-black text-xl shadow-sm">
              P
            </div>
            <span className="text-2xl font-bold tracking-tight text-foreground">
              Park<span className="text-emerald-600">Link</span>
            </span>
          </Link>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Reset Password</h2>
          <p className="text-xs text-muted-foreground">
            Enter your email to receive recovery instructions
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm space-y-5">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {submitted ? (
            <div className="text-center space-y-4 py-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <p className="text-sm text-foreground font-semibold">Check your inbox</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                We sent a secure password reset link to <strong>{email}</strong>. Follow the link to
                choose a new password.
              </p>
              <div className="pt-2">
                <Link href="/login">
                  <Button variant="outline" className="w-full text-xs">
                    Return to Sign In
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  Registered Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    required
                    placeholder="driver@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <Button
                type="submit"
                isLoading={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-10"
              >
                Send Reset Link
              </Button>
            </form>
          )}

          <div className="pt-4 border-t border-border text-center">
            <Link
              href="/login"
              className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground font-medium"
            >
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

