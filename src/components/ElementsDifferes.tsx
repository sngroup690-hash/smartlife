"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import MasquerSurPageProduit from "@/components/MasquerSurPageProduit";

// Éléments utiles mais pas indispensables à l'arrivée (fenêtres surgissantes, notifications d'achat,
// fenêtre de sortie, rappel du panier) : leur code n'est téléchargé et préparé qu'une fois la page
// affichée et le téléphone libre. La page apparaît ainsi plus vite à la première visite.
const PopupManager = dynamic(() => import("@/components/PopupManager"), { ssr: false });
const SocialProofToast = dynamic(() => import("@/components/SocialProofToast"), { ssr: false });
const ExitIntentPopup = dynamic(() => import("@/components/ExitIntentPopup"), { ssr: false });
const CartAbandonmentBanner = dynamic(() => import("@/components/CartAbandonmentBanner"), { ssr: false });
const OnboardingPopup = dynamic(() => import("@/components/OnboardingPopup"), { ssr: false });

export default function ElementsDifferes() {
  const [pret, setPret] = useState(false);

  useEffect(() => {
    const go = () => setPret(true);
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(go, { timeout: 2500 });
      return () => window.cancelIdleCallback(id);
    }
    const t = setTimeout(go, 1200);
    return () => clearTimeout(t);
  }, []);

  if (!pret) return null;
  return (
    <>
      <PopupManager />
      <SocialProofToast />
      <ExitIntentPopup />
      <MasquerSurPageProduit>
        <CartAbandonmentBanner />
        <OnboardingPopup />
      </MasquerSurPageProduit>
    </>
  );
}
