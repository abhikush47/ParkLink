import QRCode from "qrcode";
import { jsPDF } from "jspdf";

/**
 * Generates an opaque, cryptographically secure, non-sequential token.
 * Length 10 gives 62^10 = 8.39 x 10^17 possibilities, impervious to sequential guessing or enumeration.
 */
export function generateSecureToken(length = 10): string {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let token = "";
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const values = new Uint8Array(length);
    crypto.getRandomValues(values);
    for (let i = 0; i < length; i++) {
      token += charset[values[i] % charset.length];
    }
  } else {
    // Fallback for non-browser / crypto-less edge environments
    for (let i = 0; i < length; i++) {
      token += charset.charAt(Math.floor(Math.random() * charset.length));
    }
  }
  return token;
}

/**
 * Returns the permanent public URL for a vehicle QR code.
 */
export function getPublicVehicleUrl(token: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://parklink.app";
  // Remove trailing slash if present
  const cleanBase = baseUrl.replace(/\/$/, "");
  return `${cleanBase}/v/${token}`;
}

/**
 * Generates high-resolution PNG data URL for the QR code.
 */
export async function generateQRCodePNG(
  url: string,
  options: {
    width?: number;
    margin?: number;
    darkColor?: string;
    lightColor?: string;
  } = {}
): Promise<string> {
  const {
    width = 600,
    margin = 2,
    darkColor = "#0f172a", // Charcoal
    lightColor = "#ffffff",
  } = options;

  return QRCode.toDataURL(url, {
    width,
    margin,
    color: {
      dark: darkColor,
      light: lightColor,
    },
    errorCorrectionLevel: "H", // High error correction so logo or damage won't break scanning
  });
}

/**
 * Generates clean SVG markup string for the QR code.
 */
export async function generateQRCodeSVG(
  url: string,
  options: {
    darkColor?: string;
    lightColor?: string;
  } = {}
): Promise<string> {
  const { darkColor = "#0f172a", lightColor = "#ffffff" } = options;

  return QRCode.toString(url, {
    type: "svg",
    margin: 2,
    color: {
      dark: darkColor,
      light: lightColor,
    },
    errorCorrectionLevel: "H",
  });
}

/**
 * Generates a print-ready PDF sticker sheet / dashboard card with instructions and QR code.
 */
export async function generatePrintablePDF(params: {
  vehicleReg: string;
  vehicleModel: string;
  token: string;
  qrDataUrl: string;
  brandingText?: string;
}): Promise<Blob> {
  const { vehicleReg, vehicleModel, qrDataUrl, brandingText = "PARKLINK CONNECT" } = params;

  // Standard A6 or Card size: 105 x 148 mm (portrait) or 148 x 105 mm (landscape sticker)
  // Let's use 105 x 148 mm (A6) which fits windshields and sun visors perfectly.
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a6",
  });

  const pageWidth = 105;
  const pageHeight = 148;

  // Background card styling
  doc.setFillColor(248, 250, 252); // charcoal-50
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  // Top header banner (emerald/forest green)
  doc.setFillColor(22, 163, 74); // #16a34a
  doc.rect(0, 0, pageWidth, 24, "F");

  // Header Title
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("PARKLINK", pageWidth / 2, 11, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Your Vehicle. One Scan. Instant Connection.", pageWidth / 2, 17, { align: "center" });

  // Vehicle Information Badge
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(8, 28, pageWidth - 16, 20, 3, 3, "F");
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(8, 28, pageWidth - 16, 20, 3, 3, "S");

  doc.setTextColor(15, 23, 42); // Charcoal-900
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(vehicleReg.toUpperCase(), pageWidth / 2, 37, { align: "center" });

  doc.setTextColor(100, 116, 139); // Charcoal-500
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(vehicleModel, pageWidth / 2, 43, { align: "center" });

  // QR Code Image container
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(14, 52, pageWidth - 28, 56, 4, 4, "F");
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, 52, pageWidth - 28, 56, 4, 4, "S");

  // Add QR Code image
  doc.addImage(qrDataUrl, "PNG", (pageWidth - 48) / 2, 56, 48, 48);

  // Instructions
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text("SCAN TO CONTACT OWNER", pageWidth / 2, 115, { align: "center" });

  doc.setTextColor(71, 85, 105);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text("Vehicle blocking? Need car moved?", pageWidth / 2, 120, { align: "center" });
  doc.text("Point your smartphone camera at this code.", pageWidth / 2, 125, { align: "center" });
  doc.text("No app required • Instant & Safe", pageWidth / 2, 129, { align: "center" });

  // Footer branding
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(brandingText, pageWidth / 2, 142, { align: "center" });

  return doc.output("blob");
}

