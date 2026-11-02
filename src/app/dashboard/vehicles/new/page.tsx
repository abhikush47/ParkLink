"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Car, Save } from "lucide-react";
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
          className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground font-medium"
        >
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back to vehicles
        </Link>
      </div>

      <div className="pb-4 border-b border-border">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Register new vehicle
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Add your vehicle details to generate a unique permanent dynamic QR code.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive">
          {errorMsg}
        </div>
      )}

      {/* Registration Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-card border border-border rounded-xl p-6 sm:p-8 space-y-5 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Car className="h-4 w-4 text-emerald-600" /> Vehicle details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Vehicle registration number *
              </label>
              <Input
                {...register("registration_number")}
                placeholder="e.g. DL 01 AB 1234"
                className="uppercase font-mono"
              />
              {errors.registration_number && (
                <p className="text-[11px] text-destructive mt-1">
                  {errors.registration_number.message}
                </p>
              )}
            </div>

            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Vehicle type *
              </label>
              <select
                {...register("vehicle_type")}
                className="w-full text-xs bg-muted border border-border rounded-md px-3 py-2 text-foreground focus:outline-none"
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
              <label className="text-xs font-medium text-foreground block mb-1">Brand / make *</label>
              <Input {...register("brand")} placeholder="e.g. Toyota" />
              {errors.brand && (
                <p className="text-[11px] text-destructive mt-1">{errors.brand.message}</p>
              )}
            </div>

            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Model *</label>
              <Input {...register("model")} placeholder="e.g. Camry" />
              {errors.model && (
                <p className="text-[11px] text-destructive mt-1">{errors.model.message}</p>
              )}
            </div>

            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Color *</label>
              <Input {...register("color")} placeholder="e.g. Silver" />
              {errors.color && (
                <p className="text-[11px] text-destructive mt-1">{errors.color.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Parking location or spot (optional)
              </label>
              <Input
                {...register("parking_location")}
                placeholder="e.g. Bay 42, Basement B1"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Vehicle photo URL (optional)
              </label>
              <Input
                {...register("image_url")}
                placeholder="https://example.com/car.jpg"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-foreground block mb-1">
              Identifying notes (optional)
            </label>
            <textarea
              {...register("description")}
              rows={2}
              maxLength={250}
              placeholder="e.g. Roof rack installed"
              className="w-full text-xs rounded-lg border border-border bg-muted p-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none"
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
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
          >
            <Save className="mr-1.5 h-4 w-4" /> Save and generate QR
          </Button>
        </div>
      </form>
    </div>
  );
}
