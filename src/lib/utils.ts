import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
    }).format(date);
  } catch {
    return dateString;
  }
}

export function formatTimeAgo(dateString: string | null | undefined): string {
  if (!dateString) return "just now";
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return formatDate(dateString);
  } catch {
    return "recently";
  }
}

/**
 * Normalizes vehicle registration number by trimming, removing whitespace and hyphens, and converting to uppercase.
 * Handles multiple country formats (e.g., "DL 01 AB 1234", "BA 99 PA 9999", "CA-12345").
 */
export function normalizeRegistrationNumber(regNum: string): string {
  return regNum.replace(/[\s\-_.]/g, "").toUpperCase();
}

/**
 * Validates vehicle registration number: alphanumeric, 3 to 16 chars.
 */
export function isValidRegistration(regNum: string): boolean {
  const normalized = normalizeRegistrationNumber(regNum);
  return /^[A-Z0-9]{3,16}$/.test(normalized);
}

/**
 * Formats telephone link safely
 */
export function formatTelLink(phone: string): string {
  const cleaned = phone.replace(/[^0-9+]/g, "");
  return `tel:${cleaned}`;
}

/**
 * Formats WhatsApp deep link safely with pre-filled message
 */
export function formatWhatsAppLink(phone: string, vehicleInfo?: { brand?: string; model?: string; reg?: string }): string {
  let cleaned = phone.replace(/[^0-9]/g, "");
  // Default to pre-filled greeting
  const message = vehicleInfo
    ? `Hello, I am contacting you regarding your vehicle (${vehicleInfo.brand} ${vehicleInfo.model} - ${vehicleInfo.reg}) via ParkLink.`
    : `Hello, I am contacting you regarding your parked vehicle via ParkLink.`;
  
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`;
}

