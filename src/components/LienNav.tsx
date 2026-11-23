"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState, type ComponentProps } from "react";

// Lien de menu « rapide » :
// - la page est préparée dès que le doigt touche l'écran ou que la souris s'approche
//   (on gagne les 100 à 300 ms entre le toucher et le clic) ;
// - le menu marque la rubrique choisie tout de suite, sans attendre que la page arrive.
const EVENEMENT = "smartlife-nav-cible";

export function LienNav({ href, onClick, ...reste }: ComponentProps<typeof Link> & { href: string }) {
  const router = useRouter();
  const preparer = () => {
    try { router.prefetch(href); } catch { /* sans gravité : la page se chargera au clic */ }
  };
  return (
    <Link
      href={href}
      onPointerEnter={preparer}
      onTouchStart={preparer}
      onFocus={preparer}
      onClick={(e) => {
        window.dispatchEvent(new CustomEvent(EVENEMENT, { detail: href }));
        onClick?.(e);
      }}
      {...reste}
    />
  );
}

/** Chemin de la page affichée, ou de celle qu'on vient de choisir si elle arrive encore. */
export function useCheminVise(): string | null {
  const chemin = usePathname();
  const [cible, setCible] = useState<{ href: string; depuis: string | null } | null>(null);

  useEffect(() => {
    const ecouter = (e: Event) => setCible({ href: (e as CustomEvent<string>).detail, depuis: chemin });
    window.addEventListener(EVENEMENT, ecouter);
    return () => window.removeEventListener(EVENEMENT, ecouter);
  }, [chemin]);

  // La cible ne compte que tant qu'on est encore sur la page de départ.
  return cible && cible.depuis === chemin ? cible.href : chemin;
}
