import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BuyerRecognitionBanner from "@/components/BuyerRecognitionBanner";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import AnalyticsTracker from "@/components/AnalyticsTracker";
import PopupManager from "@/components/PopupManager";
import PixelManager from "@/components/PixelManager";
import CurrencyProvider from "@/components/CurrencyProvider";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";
import SocialProofToast from "@/components/SocialProofToast";
import AnimationsSite from "@/components/AnimationsSite";
import { DESCRIPTION_SITE } from "@/lib/seo";
import ReferralTracker from "@/components/ReferralTracker";
import ExitIntentPopup from "@/components/ExitIntentPopup";
import BottomNav from "@/components/BottomNav";
import CartAbandonmentBanner from "@/components/CartAbandonmentBanner";
import OnboardingPopup from "@/components/OnboardingPopup";
import { Suspense } from "react";
import MasquerSurPageProduit from "@/components/MasquerSurPageProduit";

const inter = Inter({ subsets: ["latin"] });

const APP_URL = "https://smartlifecm.com";
const OG_IMAGE = `${APP_URL}/logo-smartlife.jpeg`;
const TITLE = "Smart Life — L'écosystème des visionnaires africains : guides, accompagnement et consultants";
const DESCRIPTION = DESCRIPTION_SITE;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  verification: {
    google: "IbY9wL4wtYAqWHTfvpKWqg2VlEGm9FmQsybf0ySlfNw",
  },
  keywords: [
    "comment se lancer en affaires au Cameroun", "idée de business rentable Cameroun", "guide pratique business Afrique",
    "élevage rentable Cameroun", "agriculture rentable Afrique", "accompagnement entrepreneur Cameroun",
    "consultant business Douala Yaoundé", "visionnaires africains", "Smart Life",
  ],
  metadataBase: new URL(APP_URL),
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/logo-smartlife.jpeg", type: "image/jpeg", sizes: "any" },
    ],
    shortcut: "/logo-smartlife.jpeg",
    apple: [
      { url: "/logo-smartlife.jpeg", sizes: "180x180", type: "image/jpeg" },
    ],
  },
  openGraph: {
    type: "website",
    siteName: "Smart Life",
    url: APP_URL,
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: "Smart Life" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="h-full">
      <body className={`${inter.className} min-h-full flex flex-col bg-[#f9f8f5] text-gray-900 overflow-x-hidden`}>
        <MasquerSurPageProduit>
          <AnnouncementBanner />
          <Navbar />
          <BuyerRecognitionBanner />
        </MasquerSurPageProduit>
        <AnalyticsTracker />
        <CurrencyProvider />
        <main className="flex-1 pb-24 lg:pb-0">{children}</main>
        <MasquerSurPageProduit>
          <Footer />
          <BottomNav />
        </MasquerSurPageProduit>
        <PopupManager />
        <PixelManager />
        <ServiceWorkerRegistrar />
        <SocialProofToast />
        <AnimationsSite />
        <Suspense fallback={null}><ReferralTracker /></Suspense>
        <ExitIntentPopup />
        <MasquerSurPageProduit>
          <CartAbandonmentBanner />
          <OnboardingPopup />
        </MasquerSurPageProduit>
      </body>
    </html>
  );
}
