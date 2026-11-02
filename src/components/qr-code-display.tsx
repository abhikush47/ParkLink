"use client";

import React, { useState, useEffect } from "react";
import { Download, Copy, Check, RefreshCw, FileText, ExternalLink, ShieldCheck, AlertTriangle } from "lucide-react";
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
  const [qrPngUrl, setQrPngUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [isRotateModalOpen, setIsRotateModalOpen] = useState(false);
  const [isRotating, setIsRotating] = useState(false);

  const publicUrl = getPublicVehicleUrl(token);

  useEffect(() => {
    let isMounted = true;
    async function loadQR() {
      try {
        const png = await generateQRCodePNG(publicUrl, { width: 500 });
        if (isMounted) setQrPngUrl(png);
      } catch (err) {
        console.error("Failed to generate QR code", err);
      }
    }
    loadQR();
    return () => {
      isMounted = false;
    };
  }, [publicUrl]);

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
    toast.success("High-resolution PNG downloaded!");
  };

  const downloadSVG = async () => {
    try {
      const svg = await generateQRCodeSVG(publicUrl);
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

  const statusColors: Record<QRStatus, "success" | "warning" | "destructive" | "charcoal"> = {
    active: "success",
    inactive: "warning",
    suspended: "destructive",
    compromised: "destructive",
  };

  return (
    <div className="flex flex-col items-center p-6 bg-card border border-border rounded-2xl shadow-sm text-center">
      {/* Header & Status */}
      <div className="w-full flex items-center justify-between mb-4 pb-3 border-b border-border">
        <div className="text-left">
          <h3 className="font-semibold text-foreground text-sm tracking-wide uppercase">
            Permanent Dynamic QR
          </h3>
          <p className="text-xs text-muted-foreground font-mono">Token: {token}</p>
        </div>
        <Badge variant={statusColors[status]}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      </div>

      {/* QR Code Graphic Frame */}
      <div className="relative group p-4 bg-white rounded-2xl border-2 border-emerald-500/20 shadow-md transition-all hover:border-emerald-500">
        {qrPngUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={qrPngUrl}
            alt={`ParkLink QR code for ${vehicleReg}`}
            className="w-48 h-48 sm:w-56 sm:h-56 object-contain rounded-lg"
          />
        ) : (
          <div className="w-48 h-48 sm:w-56 sm:h-56 bg-slate-100 animate-pulse rounded-lg flex items-center justify-center">
            <span className="text-xs text-muted-foreground">Generating QR...</span>
          </div>
        )}
        <div className="mt-2 text-center">
          <span className="text-[11px] font-bold tracking-wider text-emerald-800 uppercase bg-emerald-100 px-2.5 py-0.5 rounded-full">
            PARKLINK CONNECT
          </span>
        </div>
      </div>

      {/* Vehicle info label */}
      <div className="mt-4">
        <h4 className="text-lg font-bold tracking-tight text-foreground">{vehicleReg}</h4>
        <p className="text-xs text-muted-foreground">{vehicleModel}</p>
      </div>

      {/* Stats preview */}
      <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground bg-muted/40 px-3 py-1.5 rounded-lg border border-border">
        <span>Scans: <strong className="text-foreground">{scanCount}</strong></span>
        <span>•</span>
        <span>Status: <strong className="text-foreground">{status}</strong></span>
      </div>

      {/* Public URL Action Bar */}
      <div className="w-full mt-5 flex items-center gap-2">
        <input
          type="text"
          readOnly
          value={publicUrl}
          className="flex-1 bg-muted/50 border border-input text-xs px-3 py-2 rounded-lg text-muted-foreground font-mono focus:outline-none"
        />
        <Button variant="outline" size="sm" onClick={copyUrl} title="Copy link">
          {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
        </Button>
        <a href={publicUrl} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm" title="Preview Public Profile">
            <ExternalLink className="h-4 w-4" />
          </Button>
        </a>
      </div>

      {/* Download Action Buttons */}
      <div className="w-full grid grid-cols-3 gap-2 mt-4">
        <Button variant="subtle" size="sm" onClick={downloadPNG} className="text-xs">
          <Download className="mr-1.5 h-3.5 w-3.5" /> PNG
        </Button>
        <Button variant="outline" size="sm" onClick={downloadSVG} className="text-xs">
          <Download className="mr-1.5 h-3.5 w-3.5" /> SVG
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={downloadPDF}
          isLoading={downloadingPdf}
          className="text-xs"
        >
          <FileText className="mr-1.5 h-3.5 w-3.5" /> Sticker PDF
        </Button>
      </div>

      {/* Security Actions (Token rotation) */}
      {isOwner && (
        <div className="w-full mt-5 pt-4 border-t border-border flex justify-between items-center text-xs">
          <span className="text-muted-foreground">Sticker lost or compromised?</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsRotateModalOpen(true)}
            className="text-destructive hover:bg-destructive/10 text-xs h-7 px-2"
          >
            <RefreshCw className="mr-1 h-3 w-3" /> Rotate Token
          </Button>
        </div>
      )}

      {/* Rotation Warning Dialog */}
      <Dialog open={isRotateModalOpen} onOpenChange={setIsRotateModalOpen}>
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600 mb-2">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <DialogTitle className="text-center">Rotate Vehicle QR Token?</DialogTitle>
          <DialogDescription className="text-center">
            This will instantly generate a new permanent public URL for{" "}
            <strong>{vehicleReg}</strong>. Any previously printed QR stickers or physical
            badges will immediately cease working.
          </DialogDescription>
        </DialogHeader>
        <div className="bg-muted/40 p-3 rounded-lg text-xs text-muted-foreground my-2 border border-border">
          <p>
            You will need to download and print a new QR sticker after rotating.
          </p>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsRotateModalOpen(false)}
            disabled={isRotating}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleRotateToken}
            isLoading={isRotating}
          >
            Yes, Rotate Token
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
