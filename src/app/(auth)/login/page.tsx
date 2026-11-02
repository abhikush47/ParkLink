"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Lock, Mail, AlertCircle, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { loginSchema } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import type { z } from "zod";

type LoginFormData = z.infer<typeof loginSchema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams?.get("redirect") || "/dashboard";
  const toast = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginFormData) => {
    setIsLoading(true);
    setAuthError(null);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) {
        setAuthError(error.message);
        toast.error(error.message, "Sign in failed");
        return;
      }

      if (data.session) {
        toast.success("Welcome back", "Signed in successfully");
        router.push(redirect);
        router.refresh();
      }
    } catch (err: any) {
      setAuthError(err.message || "An unexpected error occurred");
      toast.error("Could not complete sign in");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6 sm:p-8 space-y-4">
      {authError && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-start gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{authError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="text-xs font-medium text-foreground block mb-1">
            Email address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              {...register("email")}
              type="email"
              placeholder="driver@example.com"
              className="pl-9 bg-muted"
              autoComplete="email"
            />
          </div>
          {errors.email && (
            <p className="text-[11px] text-destructive mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-foreground">Password</label>
            <Link
              href="/forgot-password"
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              {...register("password")}
              type="password"
              placeholder="••••••••"
              className="pl-9 bg-muted"
              autoComplete="current-password"
            />
          </div>
          {errors.password && (
            <p className="text-[11px] text-destructive mt-1">{errors.password.message}</p>
          )}
        </div>

        <Button
          type="submit"
          isLoading={isLoading}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium h-9 mt-1"
        >
          Sign in <ArrowRight className="ml-1.5 h-4 w-4" />
        </Button>
      </form>

      <div className="pt-3 border-t border-border text-center text-xs text-muted-foreground">
        Don&apos;t have an account yet?{" "}
        <Link href="/register" className="text-emerald-600 dark:text-emerald-400 font-medium hover:underline">
          Register vehicle
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
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
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Sign in to your account
          </h2>
          <p className="text-xs text-muted-foreground">
            Manage your vehicles, QR stickers, and parking assistance alerts
          </p>
        </div>

        <Suspense fallback={<div className="h-64 rounded-xl bg-muted animate-pulse" />}>
          <LoginForm />
        </Suspense>

        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>End-to-end encrypted session</span>
          </div>
        </div>
      </div>
    </div>
  );
}
