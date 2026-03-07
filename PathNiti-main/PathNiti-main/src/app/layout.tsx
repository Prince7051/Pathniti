import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { ServiceWorkerProvider } from "@/components/ServiceWorkerProvider";
import {
  AuthErrorNotification,
  AuthErrorBanner,
} from "@/components/AuthErrorNotification";
import { SarthiChatWidget } from "@/components/SarthiChatWidget";
import { NetworkStatusIndicator } from "@/components/NetworkStatusIndicator";
import { OfflineErrorBoundary } from "@/components/OfflineErrorBoundary";
import { MobileWrapper } from "@/components/MobileWrapper";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";

// Use system fonts as fallback to avoid network dependency during build
const inter = {
  variable: "--font-inter",
};

export const metadata: Metadata = {
  title: "PathNiti - Your Path. Your Future. Simplified.",
  description:
    "One-Stop Personalized Career & Education Advisor for Indian Students",
  keywords: [
    "education",
    "career",
    "guidance",
    "colleges",
    "admissions",
    "scholarships",
    "India",
  ],
  authors: [{ name: "PathNiti Team" }],
  creator: "PathNiti",
  publisher: "PathNiti",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ),
  openGraph: {
    title: "PathNiti - Your Path. Your Future. Simplified.",
    description:
      "One-Stop Personalized Career & Education Advisor for Indian Students",
    url: "/",
    siteName: "PathNiti",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PathNiti - Your Path. Your Future. Simplified.",
    description:
      "One-Stop Personalized Career & Education Advisor for Indian Students",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PathNiti",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#1A237E",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon-pathniti.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/favicon-pathniti.svg" />
        <meta name="theme-color" content="#1A237E" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="PathNiti" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>
          <ServiceWorkerProvider>
            <OfflineErrorBoundary>
              <MobileWrapper>
                <AuthErrorBanner />
                <NetworkStatusIndicator />
                {children}
                <AuthErrorNotification />
                <SarthiChatWidget />
                <PWAInstallPrompt />
              </MobileWrapper>
            </OfflineErrorBoundary>
          </ServiceWorkerProvider>
        </Providers>
      </body>
    </html>
  );
}
