import { z } from "zod";

export const vehicleSchema = z.object({
  registration_number: z
    .string()
    .min(3, "Registration number must be at least 3 characters")
    .max(20, "Registration number is too long")
    .regex(/^[a-zA-Z0-9\s\-_.]+$/, "Invalid registration number format"),
  vehicle_type: z.enum([
    "Car",
    "Motorcycle",
    "Scooter",
    "SUV",
    "Van",
    "Truck",
    "Other",
  ]),
  brand: z.string().min(2, "Brand must be at least 2 characters").max(50),
  model: z.string().min(1, "Model is required").max(50),
  color: z.string().min(2, "Color is required").max(30),
  image_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  description: z.string().max(250, "Description must be under 250 characters").optional().or(z.literal("")),
  parking_location: z.string().max(100, "Location must be under 100 characters").optional().or(z.literal("")),
  status: z.enum(["active", "inactive", "sold", "suspended"]).default("active"),
});

export type VehicleFormData = z.infer<typeof vehicleSchema>;

export const vehicleContactSettingsSchema = z.object({
  show_phone: z.boolean(),
  show_whatsapp: z.boolean(),
  enable_anonymous_messages: z.boolean(),
  enable_parking_alerts: z.boolean(),
  alternate_contact_name: z.string().max(50).optional().or(z.literal("")),
  alternate_contact_phone: z
    .string()
    .regex(/^(\+?[0-9\s\-()]{7,20})?$/, "Invalid phone number")
    .optional()
    .or(z.literal("")),
  temporary_privacy_mode: z.boolean(),
});

export type VehicleContactSettingsFormData = z.infer<typeof vehicleContactSettingsSchema>;

export const parkingAlertSubmissionSchema = z.object({
  token: z.string().min(6, "Invalid QR token").max(32),
  category: z.enum([
    "blocking",
    "please_move",
    "lights_on",
    "window_open",
    "parked_incorrectly",
    "other",
  ]),
  custom_message: z.string().max(500, "Message cannot exceed 500 characters").optional().or(z.literal("")),
});

export type ParkingAlertSubmissionData = z.infer<typeof parkingAlertSubmissionSchema>;

export const anonymousMessageSubmissionSchema = z.object({
  token: z.string().min(6, "Invalid QR token").max(32),
  message: z.string().min(3, "Message must be at least 3 characters").max(1000, "Message too long"),
});

export type AnonymousMessageSubmissionData = z.infer<typeof anonymousMessageSubmissionSchema>;

export const reportSubmissionSchema = z.object({
  token: z.string().min(6).max(32),
  reason: z.enum(["misuse", "fake_vehicle", "harassment", "illegal_parking", "other"]),
  details: z.string().max(1000).optional().or(z.literal("")),
});

export type ReportSubmissionData = z.infer<typeof reportSubmissionSchema>;

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  full_name: z.string().min(2, "Full name is required"),
  email: z.string().email("Please enter a valid email address"),
  phone_number: z.string().min(7, "Valid phone number required").max(20),
  whatsapp_number: z.string().max(20).optional().or(z.literal("")),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirm_password: z.string().min(6),
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords do not match",
  path: ["confirm_password"],
});

export const profileSettingsSchema = z.object({
  full_name: z.string().min(2, "Full name is required"),
  phone_number: z.string().min(7, "Valid phone number required").max(20),
  whatsapp_number: z.string().max(20).optional().or(z.literal("")),
  avatar_url: z.string().url().optional().or(z.literal("")),
});
