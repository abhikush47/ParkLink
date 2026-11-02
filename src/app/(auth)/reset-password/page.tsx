"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, ArrowRight, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

export default function ResetPasswordPage() {
  const router = useRouter();
  const toast = useToast();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        setErrorMsg(error.message);
        toast.error(error.message);
        return;
      }

      toast.success("Password updated successfully");
      router.push("/dashboard");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update password");
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
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Set new password</h2>
          <p className="text-xs text-muted-foreground">
            Please choose a secure password for your account
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 sm:p-8 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                New password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 bg-muted"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Confirm new password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-9 bg-muted"
                />
              </div>
            </div>

            <Button
              type="submit"
              isLoading={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium h-9 mt-1"
            >
              Update password <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
