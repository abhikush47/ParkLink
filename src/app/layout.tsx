import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: {
    default: "ParkLink — Your Vehicle. One Scan. Instant Connection.",
    template: "%s | ParkLink",
  },
  description:
    "Dynamic QR-based vehicle identification and parking assistance platform. Instant connection, privacy-conscious vehicle alerts, no app required.",
  keywords: [
    "ParkLink",
    "parking assistance",
    "vehicle QR code",
    "smart parking",
    "vehicle contact",
    "parking alert",
    "blocking vehicle",
  ],
  authors: [{ name: "ParkLink Team" }],
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#16a34a" },
    { media: "(prefers-color-scheme: dark)", color: "#090d16" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased text-foreground">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}

