"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Car, Save, ShieldCheck, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { vehicleSchema, type VehicleFormData } from "@/lib/validations";
import { normalizeRegistrationNumber, isValidRegistration } from "@/lib/utils";
import { generateSecureToken } from "@/lib/qr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

export default function NewVehiclePage() {
  const router = useRouter();
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      vehicle_type: "Car",
      status: "active",
      brand: "",
      model: "",
      color: "",
      registration_number: "",
    },
  });

  const onSubmit = async (values: VehicleFormData) => {
    setIsSubmitting(true);
    setErrorMsg(null);

    const normalizedReg = normalizeRegistrationNumber(values.registration_number);
    if (!isValidRegistration(normalizedReg)) {
      setErrorMsg("Please enter a valid registration number (3 to 16 alphanumeric characters).");
      setIsSubmitting(false);
      return;
    }

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Please sign in first");
        router.push("/login");
        return;
      }

      // Check for duplicate vehicle registration for this owner
      const { data: existing } = await supabase
        .from("vehicles")
        .select("id")
        .eq("owner_id", user.id)
        .eq("normalized_registration_number", normalizedReg)
        .single();

      if (existing) {
        setErrorMsg("You have already registered a vehicle with this registration number.");
        setIsSubmitting(false);
        return;
      }

      // 1. Insert vehicle record
      const { data: newVehicle, error: vehicleError } = await supabase
        .from("vehicles")
        .insert({
          owner_id: user.id,
          registration_number: values.registration_number.trim().toUpperCase(),
          normalized_registration_number: normalizedReg,
          vehicle_type: values.vehicle_type,
          brand: values.brand.trim(),
          model: values.model.trim(),
          color: values.color.trim(),
          image_url: values.image_url || null,
          description: values.description || null,
          parking_location: values.parking_location || null,
          status: values.status,
        })
        .select()
        .single();

      if (vehicleError || !newVehicle) {
        throw new Error(vehicleError?.message || "Failed to create vehicle record");
      }

      // 2. Insert default vehicle contact settings
      await supabase.from("vehicle_contacts").insert({
        vehicle_id: newVehicle.id,
        show_phone: false, // privacy by default
        show_whatsapp: true,
        enable_anonymous_messages: true,
        enable_parking_alerts: true,
        temporary_privacy_mode: false,
      });

      // 3. Generate cryptographic QR token
      const qrToken = generateSecureToken(10);
      await supabase.from("vehicle_qr_codes").insert({
        vehicle_id: newVehicle.id,
        token: qrToken,
        status: "active",
      });

      // 4. Log notification
      await supabase.from("notifications").insert({
        user_id: user.id,
        vehicle_id: newVehicle.id,
        type: "profile_updated",
        title: "Vehicle Registered",
        message: `${newVehicle.brand} ${newVehicle.model} (${newVehicle.registration_number}) has been registered and its dynamic QR code is ready.`,
        link: `/dashboard/vehicles/${newVehicle.id}`,
      });

      toast.success("Vehicle registered successfully! Your QR code is live.");
      router.push(`/dashboard/vehicles/${newVehicle.id}`);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to register vehicle. Please try again.");
      toast.error("Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/dashboard/vehicles"
          className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground font-semibold"
        >
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back to Vehicles
        </Link>
      </div>

      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Register New Vehicle
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Add your vehicle details to generate a unique permanent dynamic QR code.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300">
          {errorMsg}
        </div>
      )}

      {/* Registration Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 space-y-5 shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Car className="h-4 w-4 text-emerald-600" /> Vehicle Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Vehicle Registration Number *
              </label>
              <Input
                {...register("registration_number")}
                placeholder="e.g. DL 01 AB 1234 or BA 99 PA 1234"
                className="uppercase font-mono"
              />
              {errors.registration_number && (
                <p className="text-[11px] text-rose-500 mt-1">
                  {errors.registration_number.message}
                </p>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Vehicle Type *
              </label>
              <select
                {...register("vehicle_type")}
                className="w-full text-xs bg-background border border-input rounded-md px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="Car">Car</option>
                <option value="SUV">SUV</option>
                <option value="Motorcycle">Motorcycle</option>
                <option value="Scooter">Scooter</option>
                <option value="Van">Van</option>
                <option value="Truck">Truck</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">Brand / Make *</label>
              <Input {...register("brand")} placeholder="e.g. Toyota, Hyundai, Honda" />
              {errors.brand && (
                <p className="text-[11px] text-rose-500 mt-1">{errors.brand.message}</p>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">Model *</label>
              <Input {...register("model")} placeholder="e.g. Creta, City, Fortuner" />
              {errors.model && (
                <p className="text-[11px] text-rose-500 mt-1">{errors.model.message}</p>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">Color *</label>
              <Input {...register("color")} placeholder="e.g. White, Silver, Black" />
              {errors.color && (
                <p className="text-[11px] text-rose-500 mt-1">{errors.color.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Current Parking Location / Spot (Optional)
              </label>
              <Input
                {...register("parking_location")}
                placeholder="e.g. Bay 42, Basement B1, Lane 3"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Vehicle Photograph URL (Optional)
              </label>
              <Input
                {...register("image_url")}
                placeholder="https://example.com/car-photo.jpg"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground block mb-1">
              Identifying Description or Note (Optional)
            </label>
            <textarea
              {...register("description")}
              rows={2}
              maxLength={250}
              placeholder="e.g. Roof rack installed, parking permit sticker on left rear."
              className="w-full text-xs rounded-lg border border-input bg-background p-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end gap-3">
          <Link href="/dashboard/vehicles">
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            isLoading={isSubmitting}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
          >
            <Save className="mr-1.5 h-4 w-4" /> Save & Generate QR
          </Button>
        </div>
      </form>
    </div>
  );
}

