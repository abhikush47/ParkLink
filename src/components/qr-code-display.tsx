"use client";

import React, { useState, useEffect } from "react";
import {
  Download,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Printer,
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

  // Dynamically resolve URL
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
      toast.success("Permanent vehicle URL copied to clipboard");
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
    toast.success("High-resolution PNG downloaded");
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
      toast.success("Vector SVG downloaded");
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
      toast.success("Printable PDF downloaded");
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
      toast.success("QR token rotated. Old physical stickers are now deactivated.");
      setIsRotateModalOpen(false);
      if (onTokenRotated) onTokenRotated(newToken);
    } catch (err: any) {
      toast.error(err.message || "Failed to rotate QR token");
    } finally {
      setIsRotating(false);
    }
  };

  // Theme card styles (solid surfaces per Hallmark)
  const themeCardStyles: Record<StickerTheme, { border: string; bg: string; text: string; header: string }> = {
    emerald: {
      border: "border-emerald-600 dark:border-emerald-700",
      bg: "bg-white dark:bg-card text-foreground",
      text: "text-emerald-800 dark:text-emerald-300",
      header: "bg-emerald-600 text-white",
    },
    carbon: {
      border: "border-border",
      bg: "bg-neutral-900 text-white",
      text: "text-neutral-200",
      header: "bg-neutral-950 text-emerald-400 border-b border-border",
    },
    amber: {
      border: "border-amber-500",
      bg: "bg-amber-50 dark:bg-card text-foreground",
      text: "text-amber-800 dark:text-amber-300",
      header: "bg-amber-500 text-neutral-950 font-semibold",
    },
    monochrome: {
      border: "border-border",
      bg: "bg-white dark:bg-card text-foreground",
      text: "text-foreground",
      header: "bg-neutral-900 dark:bg-neutral-800 text-white",
    },
  };

  return (
    <div className="flex flex-col items-center p-6 bg-card border border-border rounded-2xl shadow-sm text-center space-y-5">
      {/* Top Header & Status */}
      <div className="w-full flex items-center justify-between pb-3 border-b border-border">
        <div className="text-left">
          <h3 className="font-semibold text-foreground text-sm">
            Permanent dynamic QR
          </h3>
          <p className="text-xs text-muted-foreground font-mono">Token: {token}</p>
        </div>
        <Badge
          variant={status === "active" ? "success" : "destructive"}
          className="text-xs capitalize font-mono"
        >
          {status}
        </Badge>
      </div>

      {/* Theme Selector segmented bar */}
      <div className="w-full grid grid-cols-4 gap-1 p-1 bg-muted rounded-lg text-xs">
        <button
          type="button"
          onClick={() => setTheme("emerald")}
          className={`py-1.5 rounded text-center transition-colors duration-150 font-medium ${
            theme === "emerald"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Emerald
        </button>
        <button
          type="button"
          onClick={() => setTheme("carbon")}
          className={`py-1.5 rounded text-center transition-colors duration-150 font-medium ${
            theme === "carbon"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Carbon
        </button>
        <button
          type="button"
          onClick={() => setTheme("amber")}
          className={`py-1.5 rounded text-center transition-colors duration-150 font-medium ${
            theme === "amber"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Amber
        </button>
        <button
          type="button"
          onClick={() => setTheme("monochrome")}
          className={`py-1.5 rounded text-center transition-colors duration-150 font-medium ${
            theme === "monochrome"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Mono
        </button>
      </div>

      {/* Realistic Physical Sticker Preview Card */}
      <div
        className={`w-64 rounded-2xl border ${themeCardStyles[theme].border} ${themeCardStyles[theme].bg} overflow-hidden shadow-md`}
      >
        {/* Sticker Header Banner */}
        <div className={`p-3 text-center ${themeCardStyles[theme].header}`}>
          <div className="text-xs font-bold tracking-tight">ParkLink Connect</div>
          <div className="text-[10px] opacity-90">Vehicle contact & parking assistance</div>
        </div>

        {/* QR Code Container */}
        <div className="p-5 flex flex-col items-center space-y-3">
          <div className="p-3 bg-white rounded-xl border border-neutral-200">
            {qrPngUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrPngUrl}
                alt={`ParkLink QR code for ${vehicleReg}`}
                className="w-40 h-40 object-contain rounded"
              />
            ) : (
              <div className="w-40 h-40 bg-neutral-100 rounded" />
            )}
          </div>

          <div className="text-center">
            <div className="text-sm font-bold font-plate text-foreground">
              {vehicleReg}
            </div>
            <div className="text-xs text-muted-foreground">{vehicleModel}</div>
          </div>

          <div className="text-[11px] font-medium px-3 py-1 rounded-md bg-neutral-100 dark:bg-neutral-800 text-foreground border border-border">
            Scan to reach driver
          </div>
        </div>
      </div>

      {/* Telemetry bar */}
      <div className="w-full flex items-center justify-between py-2 px-3 bg-muted rounded-lg text-xs text-muted-foreground">
        <span>Total scans: <strong className="text-foreground font-mono">{scanCount}</strong></span>
        <span>Last scan: <strong className="text-foreground">{lastScannedAt ? "Recent" : "Never"}</strong></span>
      </div>

      {/* Dynamic Target Domain Indicator */}
      <div className="w-full flex items-center justify-between text-xs text-muted-foreground">
        <span className="font-medium text-foreground flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          <span>Dynamic target address</span>
        </span>
        <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400">
          Live sync
        </span>
      </div>

      {/* Permanent URL Bar */}
      <div className="w-full flex items-center gap-2">
        <input
          type="text"
          readOnly
          value={publicUrl}
          className="flex-1 bg-muted border border-border text-xs px-3 py-2 rounded-lg text-foreground font-mono focus:outline-none"
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

      {/* Download Actions */}
      <div className="w-full grid grid-cols-3 gap-2">
        <Button variant="outline" size="sm" onClick={downloadPNG} className="text-xs h-9">
          <Download className="mr-1.5 h-3.5 w-3.5" /> PNG
        </Button>
        <Button variant="outline" size="sm" onClick={downloadSVG} className="text-xs h-9">
          <Download className="mr-1.5 h-3.5 w-3.5" /> SVG
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={downloadPDF}
          isLoading={downloadingPdf}
          className="text-xs h-9 bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <Printer className="mr-1.5 h-3.5 w-3.5" /> PDF Card
        </Button>
      </div>

      {/* Token rotation */}
      {isOwner && (
        <div className="w-full pt-3 border-t border-border flex justify-between items-center text-xs">
          <span className="text-muted-foreground">Sticker compromised?</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsRotateModalOpen(true)}
            className="text-destructive hover:bg-destructive/10 text-xs h-8 px-2"
          >
            <RefreshCw className="mr-1.5 h-3 w-3" /> Rotate token
          </Button>
        </div>
      )}

      {/* Token Rotation Warning Dialog */}
      <Dialog open={isRotateModalOpen} onOpenChange={setIsRotateModalOpen}>
        <DialogHeader>
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-700 mb-2">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <DialogTitle className="text-center">Rotate QR token?</DialogTitle>
          <DialogDescription className="text-center text-xs">
            This will generate a new permanent URL for <strong>{vehicleReg}</strong>. Any previously printed stickers will immediately stop resolving.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0 mt-4">
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
            Yes, rotate token
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
