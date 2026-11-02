"use client";

import React, { useState, useEffect } from "react";
import {
  Download,
  Copy,
  Check,
  RefreshCw,
  FileText,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Palette,
  Printer,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import {
  generateQRCodePNG,
  generateQRCodeSVG,
  generatePrintablePDF,
  getPublicVehicleUrl,
  generateSecureToken,
} from "@/lib/qr";
import type { QRStatus } from "@/types/database";

type StickerTheme = "emerald" | "carbon" | "amber" | "monochrome";

interface QRCodeDisplayProps {
  token: string;
  vehicleId: string;
  vehicleReg: string;
  vehicleModel: string;
  status: QRStatus;
  scanCount?: number;
  lastScannedAt?: string | null;
  onTokenRotated?: (newToken: string) => void;
  onStatusChanged?: (newStatus: QRStatus) => void;
  isOwner?: boolean;
}

export function QRCodeDisplay({
  token,
  vehicleId,
  vehicleReg,
  vehicleModel,
  status,
  scanCount = 0,
  lastScannedAt,
  onTokenRotated,
  onStatusChanged,
  isOwner = true,
}: QRCodeDisplayProps) {
  const toast = useToast();
  const [theme, setTheme] = useState<StickerTheme>("emerald");
  const [qrPngUrl, setQrPngUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [isRotateModalOpen, setIsRotateModalOpen] = useState(false);
  const [isRotating, setIsRotating] = useState(false);

  const [publicUrl, setPublicUrl] = useState<string>(() => getPublicVehicleUrl(token));

  useEffect(() => {
    setPublicUrl(getPublicVehicleUrl(token));
  }, [token]);

  useEffect(() => {
    let isMounted = true;
    async function loadQR() {
      try {
        if (!publicUrl) return;
        const darkColor =
          theme === "carbon" ? "#0f172a" : theme === "emerald" ? "#064e3b" : "#000000";
        const png = await generateQRCodePNG(publicUrl, {
          width: 600,
          darkColor,
          lightColor: "#ffffff",
        });
        if (isMounted) setQrPngUrl(png);
      } catch (err) {
        console.error("Failed to generate QR code", err);
      }
    }
    loadQR();
    return () => {
      isMounted = false;
    };
  }, [publicUrl, theme]);

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      toast.success("Permanent vehicle URL copied to clipboard!");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const downloadPNG = () => {
    if (!qrPngUrl) return;
    const a = document.createElement("a");
    a.href = qrPngUrl;
    a.download = `ParkLink-QR-${vehicleReg.toUpperCase().replace(/\s+/g, "_")}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("High-resolution 600 DPI PNG downloaded!");
  };

  const downloadSVG = async () => {
    try {
      const svg = await generateQRCodeSVG(publicUrl, {
        darkColor: theme === "carbon" ? "#0f172a" : theme === "emerald" ? "#064e3b" : "#000000",
      });
      const blob = new Blob([svg], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ParkLink-QR-${vehicleReg.toUpperCase().replace(/\s+/g, "_")}.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Vector SVG downloaded!");
    } catch (err) {
      toast.error("Failed to generate SVG");
    }
  };

  const downloadPDF = async () => {
    if (!qrPngUrl) return;
    setDownloadingPdf(true);
    try {
      const pdfBlob = await generatePrintablePDF({
        vehicleReg,
        vehicleModel,
        token,
        qrDataUrl: qrPngUrl,
      });
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ParkLink-Sticker-${vehicleReg.toUpperCase().replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Print-ready vehicle card PDF generated!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF");
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleRotateToken = async () => {
    setIsRotating(true);
    try {
      const newToken = generateSecureToken(10);
      const res = await fetch("/api/qr/rotate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehicleId, newToken }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to rotate token");
      }
      toast.success("QR Token rotated successfully. Old stickers are now deactivated.");
      setIsRotateModalOpen(false);
      if (onTokenRotated) onTokenRotated(newToken);
    } catch (err: any) {
      toast.error(err.message || "Failed to rotate QR token");
    } finally {
      setIsRotating(false);
    }
  };

  // Theme card styles
  const themeCardStyles: Record<StickerTheme, { border: string; bg: string; text: string; header: string }> = {
    emerald: {
      border: "border-emerald-600",
      bg: "bg-gradient-to-b from-emerald-50 to-white dark:from-emerald-950/40 dark:to-slate-900",
      text: "text-emerald-800 dark:text-emerald-300",
      header: "bg-emerald-600 text-white",
    },
    carbon: {
      border: "border-slate-800",
      bg: "bg-gradient-to-b from-slate-900 to-black text-white",
      text: "text-slate-200",
      header: "bg-slate-950 text-emerald-400 border-b border-slate-800",
    },
    amber: {
      border: "border-amber-500",
      bg: "bg-gradient-to-b from-amber-50 to-white dark:from-amber-950/40 dark:to-slate-900",
      text: "text-amber-800 dark:text-amber-300",
      header: "bg-amber-500 text-slate-950 font-black",
    },
    monochrome: {
      border: "border-slate-400",
      bg: "bg-white text-slate-900",
      text: "text-slate-800",
      header: "bg-slate-900 text-white",
    },
  };

  return (
    <div className="flex flex-col items-center p-6 bg-card border border-border/80 rounded-3xl shadow-sm text-center space-y-6">
      {/* Top Header & Status */}
      <div className="w-full flex items-center justify-between pb-3 border-b border-border">
        <div className="text-left">
          <h3 className="font-bold text-foreground text-sm tracking-wide uppercase">
            Permanent Dynamic QR
          </h3>
          <p className="text-xs text-muted-foreground font-mono">Token: {token}</p>
        </div>
        <Badge
          variant={status === "active" ? "success" : "destructive"}
          className="text-xs"
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      </div>

      {/* Theme Selector Pills */}
      <div className="w-full flex items-center justify-between gap-1 p-1 bg-muted/60 rounded-xl border border-border text-xs">
        <button
          onClick={() => setTheme("emerald")}
          className={`flex-1 py-1 rounded-lg font-medium transition-all ${
            theme === "emerald"
              ? "bg-card text-emerald-700 dark:text-emerald-300 shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Clean Emerald
        </button>
        <button
          onClick={() => setTheme("carbon")}
          className={`flex-1 py-1 rounded-lg font-medium transition-all ${
            theme === "carbon"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Carbon Dark
        </button>
        <button
          onClick={() => setTheme("amber")}
          className={`flex-1 py-1 rounded-lg font-medium transition-all ${
            theme === "amber"
              ? "bg-card text-amber-700 dark:text-amber-300 shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Caution Amber
        </button>
        <button
          onClick={() => setTheme("monochrome")}
          className={`flex-1 py-1 rounded-lg font-medium transition-all ${
            theme === "monochrome"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Mono Print
        </button>
      </div>

      {/* Realistic Physical Sticker Preview Card */}
      <div
        className={`w-64 rounded-3xl border-2 ${themeCardStyles[theme].border} ${themeCardStyles[theme].bg} shadow-xl overflow-hidden transition-all duration-300 transform hover:scale-[1.02]`}
      >
        {/* Sticker Header Banner */}
        <div className={`p-3 text-center ${themeCardStyles[theme].header}`}>
          <div className="text-xs font-black tracking-widest uppercase">PARKLINK CONNECT</div>
          <div className="text-[9px] opacity-90">Vehicle Contact & Parking Assistance</div>
        </div>

        {/* QR Code Container */}
        <div className="p-5 flex flex-col items-center space-y-3">
          <div className="p-3 bg-white rounded-2xl shadow-md border border-slate-200">
            {qrPngUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrPngUrl}
                alt={`ParkLink QR code for ${vehicleReg}`}
                className="w-40 h-40 object-contain rounded-lg"
              />
            ) : (
              <div className="w-40 h-40 bg-slate-100 animate-pulse rounded-lg" />
            )}
          </div>

          <div className="text-center">
            <div className="text-xs font-black font-plate tracking-wider uppercase">
              {vehicleReg}
            </div>
            <div className="text-[10px] opacity-75">{vehicleModel}</div>
          </div>

          <div className="text-[10px] font-bold uppercase tracking-wider bg-black/10 dark:bg-white/10 px-3 py-1 rounded-full">
            SCAN TO REACH DRIVER
          </div>
        </div>
      </div>

      {/* Telemetry quick bar */}
      <div className="w-full flex items-center justify-around py-2.5 px-4 bg-muted/40 rounded-xl border border-border text-xs text-muted-foreground font-medium">
        <span>Total Scans: <strong className="text-foreground">{scanCount}</strong></span>
        <span>•</span>
        <span>Last Scanned: <strong className="text-foreground">{lastScannedAt ? "Active recently" : "Never"}</strong></span>
      </div>

      {/* Dynamic Target Domain Indicator */}
      <div className="w-full flex items-center justify-between text-[11px] text-muted-foreground px-1">
        <span className="font-semibold text-foreground flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          <span>Permanent Dynamic QR Target</span>
        </span>
        <span className="font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-semibold">
          Live Domain
        </span>
      </div>

      {/* Permanent URL Bar */}
      <div className="w-full flex items-center gap-2">
        <input
          type="text"
          readOnly
          value={publicUrl}
          className="flex-1 bg-muted/60 border border-input text-xs px-3 py-2 rounded-xl text-muted-foreground font-mono focus:outline-none"
        />
        <Button variant="outline" size="sm" onClick={copyUrl} className="h-9 px-3" title="Copy URL">
          {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
        </Button>
        <a href={publicUrl} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm" className="h-9 px-3" title="Preview Live Profile">
            <ExternalLink className="h-4 w-4" />
          </Button>
        </a>
      </div>

      {/* Download Action Matrix */}
      <div className="w-full grid grid-cols-3 gap-2 pt-2">
        <Button variant="subtle" size="sm" onClick={downloadPNG} className="text-xs h-9">
          <Download className="mr-1.5 h-3.5 w-3.5" /> 600 DPI PNG
        </Button>
        <Button variant="outline" size="sm" onClick={downloadSVG} className="text-xs h-9">
          <Download className="mr-1.5 h-3.5 w-3.5" /> Vector SVG
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={downloadPDF}
          isLoading={downloadingPdf}
          className="text-xs h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
        >
          <Printer className="mr-1.5 h-3.5 w-3.5" /> Printable PDF
        </Button>
      </div>

      {/* Token rotation recovery */}
      {isOwner && (
        <div className="w-full pt-4 border-t border-border flex justify-between items-center text-xs">
          <span className="text-muted-foreground">Sticker scratched, stolen, or compromised?</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsRotateModalOpen(true)}
            className="text-destructive hover:bg-destructive/10 text-xs h-8 px-2"
          >
            <RefreshCw className="mr-1.5 h-3 w-3" /> Rotate Token
          </Button>
        </div>
      )}

      {/* Token Rotation Warning Dialog */}
      <Dialog open={isRotateModalOpen} onOpenChange={setIsRotateModalOpen}>
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600 mb-2">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <DialogTitle className="text-center">Rotate Vehicle QR Token?</DialogTitle>
          <DialogDescription className="text-center text-xs">
            This will instantly generate a new permanent public URL for{" "}
            <strong>{vehicleReg}</strong>. Any previously printed QR stickers or physical
            badges will immediately cease working.
          </DialogDescription>
        </DialogHeader>
        <div className="bg-muted/40 p-3 rounded-xl text-xs text-muted-foreground my-2 border border-border">
          <p>
            You will need to download and print a new QR sticker after rotating.
          </p>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsRotateModalOpen(false)}
            disabled={isRotating}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleRotateToken}
            isLoading={isRotating}
            className="text-xs"
          >
            Yes, Rotate Token
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
