"use client";

import { usePathname } from "next/navigation";

// La vitrine et les pages produit ont leur propre en-tête et pied de page, façon boutique Chariow.
export const estPageProduit = (chemin: string | null) => !!chemin && /^\/ebooks(\/[^/]+)?\/?$/.test(chemin);

export default function MasquerSurPageProduit({ children }: { children: React.ReactNode }) {
  const chemin = usePathname();
  return estPageProduit(chemin) ? null : <>{children}</>;
}
