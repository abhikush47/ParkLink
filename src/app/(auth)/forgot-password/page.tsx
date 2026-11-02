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
      toast.success("Password reset link sent");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to initiate password reset");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center py-12 px-4 sm:px-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-lg">
              P
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">
              Park<span className="text-emerald-600">Link</span>
            </span>
          </Link>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Reset password</h2>
          <p className="text-xs text-muted-foreground">
            Enter your email to receive recovery instructions
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 sm:p-8 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {submitted ? (
            <div className="text-center space-y-3 py-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-emerald-600">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <p className="text-sm text-foreground font-semibold">Check your inbox</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                We sent a secure password reset link to <strong>{email}</strong>. Follow the link to
                choose a new password.
              </p>
              <div className="pt-2">
                <Link href="/login">
                  <Button variant="outline" className="w-full text-xs">
                    Return to sign in
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">
                  Registered email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    required
                    placeholder="driver@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 bg-muted"
                  />
                </div>
              </div>

              <Button
                type="submit"
                isLoading={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium h-9"
              >
                Send reset link
              </Button>
            </form>
          )}

          <div className="pt-3 border-t border-border text-center">
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
