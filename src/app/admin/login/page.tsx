"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Lock, Mail, AlertCircle, ShieldAlert, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { loginSchema } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import type { z } from "zod";

type LoginFormData = z.infer<typeof loginSchema>;

function AdminLoginForm() {
  const router = useRouter();
  const toast = useToast();
  const searchParams = useSearchParams();
  const redirect = searchParams?.get("redirect") || "/admin";

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

      if (data.session && data.user) {
        // Verify role in profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .single();

        if (profile?.role !== "admin") {
          // If not admin, warn them
          setAuthError(
            "Access denied: This account does not have Super Admin privileges. Set role = 'admin' in profiles table."
          );
          toast.warning("Not authorized as Super Admin");
          return;
        }

        toast.success("Welcome back, Administrator!");
        router.push(redirect);
        router.refresh();
      }
    } catch (err: any) {
      setAuthError(err.message || "An unexpected error occurred");
      toast.error("Could not sign in to admin console");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-5">
      {authError && (
        <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-900/60 text-xs text-rose-300 flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
          <div className="leading-relaxed">{authError}</div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1">
            Admin Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <Input
              {...register("email")}
              type="email"
              placeholder="admin@parklink.app"
              className="pl-9 bg-slate-900 border-slate-800 text-white placeholder:text-slate-500 text-xs"
              autoComplete="email"
            />
          </div>
          {errors.email && (
            <p className="text-[11px] text-rose-400 mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1">
            Master Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <Input
              {...register("password")}
              type="password"
              placeholder="••••••••"
              className="pl-9 bg-slate-900 border-slate-800 text-white placeholder:text-slate-500 text-xs"
              autoComplete="current-password"
            />
          </div>
          {errors.password && (
            <p className="text-[11px] text-rose-400 mt-1">{errors.password.message}</p>
          )}
        </div>

        <Button
          type="submit"
          isLoading={isLoading}
          className="w-full bg-rose-600 hover:bg-rose-700 text-white font-semibold h-10 mt-2 text-xs"
        >
          Authenticate & Access Console <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </form>

      <div className="pt-4 border-t border-slate-800/80 text-center text-xs text-slate-400">
        Looking for the vehicle owner portal?{" "}
        <Link href="/login" className="text-emerald-400 font-semibold hover:underline">
          Owner Sign In
        </Link>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center py-12 px-4 sm:px-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-rose-600 text-white shadow-lg mb-2">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Super Admin Console
          </h1>
          <p className="text-xs text-slate-400">
            Restricted access • System administrators only
          </p>
        </div>

        <Suspense fallback={<div className="h-64 rounded-2xl bg-slate-950 animate-pulse border border-slate-800" />}>
          <AdminLoginForm />
        </Suspense>

        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Return to ParkLink Home
          </Link>
        </div>
      </div>
    </div>
  );
}

