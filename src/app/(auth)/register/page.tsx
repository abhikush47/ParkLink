"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Lock, Mail, User, Phone, AlertCircle, CheckCircle2 } from "lucide-react";
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

      if (data.session) {
        toast.success("Account created successfully", "Welcome to ParkLink");
        router.push("/dashboard/vehicles/new");
        router.refresh();
      } else {
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
      <div className="min-h-screen bg-background flex flex-col justify-center items-center py-12 px-4 sm:px-6">
        <div className="w-full max-w-md bg-card border border-border rounded-xl p-8 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-muted text-emerald-600">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Verify your email</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            We sent a verification link to your email address. Please click the link to activate
            your account and start adding vehicles.
          </p>
          <div className="pt-2">
            <Link href="/login">
              <Button variant="outline" className="w-full text-xs">
                Proceed to sign in
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center py-12 px-4 sm:px-6">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
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
            Create your account
          </h2>
          <p className="text-xs text-muted-foreground">
            Get instant dynamic QR passes and parking assistance for your fleet
          </p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-xl p-6 sm:p-8 space-y-4">
          {authError && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Full name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  {...register("full_name")}
                  placeholder="Rahul Sharma"
                  className="pl-9 bg-muted"
                  autoComplete="name"
                />
              </div>
              {errors.full_name && (
                <p className="text-[11px] text-destructive mt-1">{errors.full_name.message}</p>
              )}
            </div>

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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">
                  Primary phone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    {...register("phone_number")}
                    placeholder="+91 98765 43210"
                    className="pl-9 bg-muted font-mono text-xs"
                    autoComplete="tel"
                  />
                </div>
                {errors.phone_number && (
                  <p className="text-[11px] text-destructive mt-1">{errors.phone_number.message}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-medium text-foreground block mb-1">
                  WhatsApp (optional)
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    {...register("whatsapp_number")}
                    placeholder="+91 98765 43210"
                    className="pl-9 bg-muted font-mono text-xs"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  {...register("password")}
                  type="password"
                  placeholder="••••••••"
                  className="pl-9 bg-muted"
                  autoComplete="new-password"
                />
              </div>
              {errors.password && (
                <p className="text-[11px] text-destructive mt-1">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Confirm password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  {...register("confirm_password")}
                  type="password"
                  placeholder="••••••••"
                  className="pl-9 bg-muted"
                  autoComplete="new-password"
                />
              </div>
              {errors.confirm_password && (
                <p className="text-[11px] text-destructive mt-1">{errors.confirm_password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              isLoading={isLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium h-9 mt-1"
            >
              Create account <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </form>

          <div className="pt-3 border-t border-border text-center text-xs text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-emerald-600 dark:text-emerald-400 font-medium hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
