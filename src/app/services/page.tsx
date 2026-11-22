import type { Metadata } from "next";
import { services } from "@/lib/data";
import { getEnabledDynamicServices } from "@/lib/services-data";
import ServicesGrid from "@/components/ServicesGrid";

export const metadata: Metadata = {
  title: "Services Professionnels | Smart Life – Voix Off, Vidéo & Sourcing",
  description: "Voix off professionnelle, création vidéo et sourcing de produits au Cameroun. Livraison en 12–48h. Qualité studio, prix adaptés au marché africain.",
  alternates: { canonical: "https://smartlifecm.com/services" },
  openGraph: {
    type: "website",
    url: "https://smartlifecm.com/services",
    title: "Services Professionnels | Smart Life",
    description: "Voix off, création vidéo et commande de produits. Livraison rapide, qualité studio.",
    siteName: "Smart Life",
    images: [{ url: "https://smartlifecm.com/logo-smartlife.jpeg", width: 1200, height: 630, alt: "Smart Life Services" }],
  },
  twitter: { card: "summary_large_image", title: "Services Professionnels | Smart Life", description: "Voix off, vidéo, sourcing. Livraison 12–48h." },
};

export default async function ServicesPage() {
  const dynamicServices = await getEnabledDynamicServices();
  return <ServicesGrid staticServices={services} dynamicServices={dynamicServices} />;
}
