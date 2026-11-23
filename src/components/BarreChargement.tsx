"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// Fine barre jaune en haut de l'écran dès qu'on touche un lien interne :
// le visiteur voit tout de suite que son geste est pris en compte, même sur une connexion lente.
export default function BarreChargement() {
  const chemin = usePathname();
  const recherche = useSearchParams();
  const [etat, setEtat] = useState<"repos" | "charge" | "fini">("repos");
  const minuterie = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const auClic = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a");
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const href = a.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
      let url: URL;
      try { url = new URL(href, location.href); } catch { return; }
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.search === location.search) return;
      setEtat("charge");
      if (minuterie.current) clearTimeout(minuterie.current);
      // Sécurité : la barre ne reste jamais bloquée.
      minuterie.current = setTimeout(() => setEtat("repos"), 12000);
    };
    document.addEventListener("click", auClic, true);
    return () => document.removeEventListener("click", auClic, true);
  }, []);

  // La nouvelle page est là : la barre se remplit puis disparaît.
  useEffect(() => {
    setEtat((e) => (e === "charge" ? "fini" : e));
    const t = setTimeout(() => setEtat((e) => (e === "fini" ? "repos" : e)), 350);
    return () => clearTimeout(t);
  }, [chemin, recherche]);

  return (
    <div
      aria-hidden="true"
      className={`barre-chargement ${etat === "charge" ? "barre-charge" : ""} ${etat === "fini" ? "barre-fini" : ""}`}
    />
  );
}
