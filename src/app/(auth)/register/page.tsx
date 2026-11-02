"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Lock, Mail, User, Phone, MessageSquare, AlertCircle, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { registerSchema } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import type { z } from "zod";

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const toast = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [verificationSent, setVerificationSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (values: RegisterFormData) => {
    setIsLoading(true);
    setAuthError(null);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            full_name: values.full_name,
            phone_number: values.phone_number,
            whatsapp_number: values.whatsapp_number || values.phone_number,
            role: "user",
          },
        },
      });

      if (error) {
        setAuthError(error.message);
        toast.error(error.message, "Registration failed");
        return;
      }

      // Check if email confirmation is required or if session exists immediately
      if (data.session) {
        toast.success("Account created successfully! Welcome to ParkLink.");
        router.push("/dashboard/vehicles/new");
        router.refresh();
      } else {
        // Confirmation email required
        setVerificationSent(true);
        toast.info("Please check your email to verify your account.");
      }
    } catch (err: any) {
      setAuthError(err.message || "Failed to create account");
      toast.error("Registration error");
    } finally {
      setIsLoading(false);
    }
  };

  if (verificationSent) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center py-12 px-4 sm:px-6">
        <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-sm text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Verify Your Email</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We sent a verification link to your email address. Please click the link to activate
            your ParkLink account and begin registering your vehicles.
          </p>
          <div className="pt-4">
            <Link href="/login">
              <Button variant="outline" className="w-full">
                Proceed to Sign In
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center py-12 px-4 sm:px-6">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-black text-xl shadow-sm">
              P
            </div>
            <span className="text-2xl font-bold tracking-tight text-foreground">
              Park<span className="text-emerald-600">Link</span>
            </span>
          </Link>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Create your account
          </h2>
          <p className="text-xs text-muted-foreground">
            Get instant dynamic QR codes and parking alerts for your vehicles
          </p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm space-y-5">
          {authError && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  {...register("full_name")}
                  placeholder="Rahul Sharma / Alex Morgan"
                  className="pl-9"
                  autoComplete="name"
                />
              </div>
              {errors.full_name && (
                <p className="text-[11px] text-rose-500 mt-1">{errors.full_name.message}</p>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  {...register("email")}
                  type="email"
                  placeholder="owner@example.com"
                  className="pl-9"
                  autoComplete="email"
                />
              </div>
              {errors.email && (
                <p className="text-[11px] text-rose-500 mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Primary Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  {...register("phone_number")}
                  placeholder="+91 98765 43210"
                  className="pl-9"
                  autoComplete="tel"
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Can be masked or hidden anytime in your privacy settings.
              </p>
              {errors.phone_number && (
                <p className="text-[11px] text-rose-500 mt-1">{errors.phone_number.message}</p>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                WhatsApp Number <span className="font-normal text-muted-foreground">(Optional)</span>
              </label>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  {...register("whatsapp_number")}
                  placeholder="Leave empty if same as phone"
                  className="pl-9"
                  autoComplete="tel"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    {...register("password")}
                    type="password"
                    placeholder="••••••••"
                    className="pl-9"
                    autoComplete="new-password"
                  />
                </div>
                {errors.password && (
                  <p className="text-[11px] text-rose-500 mt-1">{errors.password.message}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    {...register("confirm_password")}
                    type="password"
                    placeholder="••••••••"
                    className="pl-9"
                    autoComplete="new-password"
                  />
                </div>
                {errors.confirm_password && (
                  <p className="text-[11px] text-rose-500 mt-1">
                    {errors.confirm_password.message}
                  </p>
                )}
              </div>
            </div>

            <Button
              type="submit"
              isLoading={isLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-10 mt-4"
            >
              Register & Continue <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>

          <div className="pt-4 border-t border-border text-center text-xs text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-emerald-600 font-semibold hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

