import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Accompagnement Entrepreneurial | Smart Life – Lancez Votre Business",
  description: "Accompagnement personnalisé pour créer votre entreprise au Cameroun. Pressing, élevage, restauration, commerce… De l'idée au business opérationnel. Investissement à partir de 250 000 FCFA.",
  alternates: { canonical: "https://smartlifecm.com/accompagnement" },
  openGraph: {
    type: "website",
    url: "https://smartlifecm.com/accompagnement",
    title: "Accompagnement Entrepreneurial | Smart Life",
    description: "Créez votre business au Cameroun avec un accompagnement de A à Z. Pressing, élevage, restauration et plus.",
    siteName: "Smart Life",
    images: [{ url: "https://smartlifecm.com/logo-smartlife.jpeg", width: 1200, height: 630, alt: "Smart Life Accompagnement" }],
  },
  twitter: { card: "summary_large_image", title: "Accompagnement Entrepreneurial | Smart Life", description: "De l'idée au business — accompagnement complet au Cameroun." },
};

export default function AccompagnementLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
