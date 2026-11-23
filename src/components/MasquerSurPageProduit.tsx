"use client";

import { usePathname } from "next/navigation";

// La vitrine et les pages produit ont leur propre en-tête et pied de page, façon boutique Chariow.
export const estPageProduit = (chemin: string | null) => !!chemin && /^\/ebooks(\/[^/]+)?\/?$/.test(chemin);
// Fiche d'un guide seule (pas la vitrine /ebooks) : elle a sa barre d'achat en bas de l'écran.
export const estFicheProduit = (chemin: string | null) => !!chemin && /^\/ebooks\/[^/]+\/?$/.test(chemin);

export default function MasquerSurPageProduit({
  children,
  seulementFiche = false,
}: {
  children: React.ReactNode;
  /** Masquer seulement sur la fiche d'un guide (le menu du bas reste sur la vitrine des guides) */
  seulementFiche?: boolean;
}) {
  const chemin = usePathname();
  const masquer = seulementFiche ? estFicheProduit(chemin) : estPageProduit(chemin);
  return masquer ? null : <>{children}</>;
}
