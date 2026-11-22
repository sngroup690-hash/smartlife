"use client";

import { useEffect, useState } from "react";
import TitreDefilant from "@/components/TitreDefilant";

// Cadre posé sous le visuel d'un pack : un guide à la fois, titre complet, puis le suivant.
// Tout reste à l'intérieur du cadre, pour qu'on ne mélange jamais deux packs.
export default function BandeGuides({
  items,
  taille = "text-[10px]",
}: {
  items: Array<{ id: string; title: string }>;
  taille?: string;
}) {
  const [rang, setRang] = useState(0);

  const longueur = items.length ? items[rang % items.length].title.length : 0;
  useEffect(() => {
    if (items.length < 2) return;
    const t = setTimeout(() => setRang((r) => (r + 1) % items.length), longueur > 35 ? 8200 : 4200);
    return () => clearTimeout(t);
  }, [rang, items.length, longueur]);

  if (items.length === 0) return null;
  const item = items[rang % items.length];
  const couleur = rang % 2 === 0 ? "#E8B800" : "#27A827";

  return (
    <div
      className="absolute bottom-2 left-3 right-3 flex items-center gap-2 rounded-lg px-2 py-1 shadow-sm"
      style={{ background: "rgba(255,255,255,0.94)", border: `1.5px solid ${couleur}` }}
    >
      <span
        className="flex-shrink-0 rounded px-1.5 py-0.5 text-[9px] font-black"
        style={{ background: couleur, color: "#fff" }}
      >
        📘 {(rang % items.length) + 1}/{items.length}
      </span>
      <div key={item.id} className="min-w-0 flex-1 guide-entre">
        <TitreDefilant texte={item.title} lignes={1} className={`font-bold text-[#111827] ${taille}`} />
      </div>
    </div>
  );
}
