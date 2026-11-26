"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BookOpen, Play, ArrowRight, Package, Loader2, ShoppingCart,
} from "lucide-react";
import { useUserStore } from "@/lib/user-store";
import { PriceTag } from "@/components/PriceTag";
import BandeGuides from "@/components/BandeGuides";

// ── Types ──────────────────────────────────────────────────────────────────────

type PackItem = { type: "ebook" | "formation"; id: string; title: string; prix?: number; cover?: string };
type Pack = {
  id: string; slug?: string; nom: string; description: string; prix: number;
  originalValeur?: number;
  image?: string; ordre: number; statut: string; items: PackItem[];
};

// ── Page ───────────────────────────────────────────────────────────────────────

export default function PacksPage() {
  const [packs, setPacks] = useState<Pack[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/packs")
      .then((r) => r.json())
      .then((d) => setPacks(d.packs || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={32} className="animate-spin text-[var(--g-vert)]" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16 lg:pt-14 text-[var(--g-encre)]">
      {/* En-tête */}
      <div className="mb-10 lg:mb-12">
        <p className="text-[14px] font-semibold text-[var(--g-vert)] mb-3">Nos Packs</p>
        <h1 className="text-[36px] sm:text-[48px] lg:text-[56px] font-semibold leading-[1.04] tracking-[-0.035em] mb-4">
          Économisez avec nos <span className="g-surligne">packs</span>
        </h1>
        <p className="text-[17px] lg:text-[19px] leading-[1.45] max-w-[46ch] text-[var(--g-gris)]">
          Combinez plusieurs guides à prix réduit. Tout ce qu'il vous faut pour réussir, regroupé en un seul pack.
        </p>
      </div>

      {packs.length === 0 ? (
        <div className="text-center py-20 px-6 bg-[var(--g-doux)] rounded-[16px]">
          <Package size={40} className="text-[var(--g-gris)] mx-auto mb-5" />
          <h2 className="text-[20px] font-semibold tracking-[-0.02em] mb-2">Aucun pack disponible</h2>
          <p className="text-[var(--g-gris)] text-[15px] mb-7">
            Revenez bientôt pour découvrir nos offres groupées.
          </p>
          <Link href="/ebooks" className="g-btn">
            Voir les ebooks <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {packs.map((pack) => (
            <PackCard key={pack.id} pack={pack} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Carte pack ─────────────────────────────────────────────────────────────────

function PackCard({ pack }: { pack: Pack }) {
  const { isLoggedIn } = useUserStore();
  const checkoutUrl = `/checkout?packId=${pack.id}&titre=${encodeURIComponent(pack.nom)}&prix=${pack.prix}`;
  const buyHref = isLoggedIn
    ? checkoutUrl
    : `/register?redirect=${encodeURIComponent(checkoutUrl)}`;
  const detailHref = pack.slug ? `/packs/${pack.slug}` : null;

  const ebookItems     = pack.items.filter((i) => i.type === "ebook");
  const formationItems = pack.items.filter((i) => i.type === "formation");
  const totalItems     = pack.items.length;
  const couvertures    = ebookItems.map((i) => i.cover).filter(Boolean) as string[];

  const hasOriginal = (pack.originalValeur || 0) > pack.prix;
  const economy = hasOriginal ? pack.originalValeur! - pack.prix : 0;
  const discountPct = hasOriginal ? Math.round((economy / pack.originalValeur!) * 100) : 0;

  return (
    <article className="bg-white border border-[var(--g-ligne)] rounded-[16px] overflow-hidden transition-colors hover:border-[var(--g-gris-clair)] flex flex-col">
      {/* Montage des couvertures des ebooks du pack */}
      <div className="relative w-full overflow-hidden bg-[var(--g-doux)]" style={{ aspectRatio: "4/3" }}>
        {couvertures.length >= 2 ? (
          <div className={`grid h-full w-full ${couvertures.length === 2 ? "grid-cols-2" : couvertures.length === 3 ? "grid-cols-3" : "grid-cols-2 grid-rows-2"} gap-1 p-3`}>
            {couvertures.slice(0, 4).map((src, i) => (
              <img key={i} src={src} alt="" className="w-full h-full object-contain rounded-lg bg-white" loading="lazy" />
            ))}
            {couvertures.length > 4 && (
              <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded-md bg-black/70 text-[12px] font-semibold text-white">
                +{couvertures.length - 4}
              </div>
            )}
          </div>
        ) : pack.image ? (
          <img src={pack.image} alt={pack.nom} className="w-full h-full object-contain pt-6 pb-6" loading="lazy" />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Package size={40} className="text-[var(--g-vert)]" />
          </div>
        )}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
          <span className="px-2 py-0.5 rounded-md bg-white/90 text-[12px] font-semibold text-[var(--g-encre)] flex items-center gap-1">
            <Package size={11} /> {totalItems} contenu{totalItems > 1 ? "s" : ""}
          </span>
          {discountPct > 0 && (
            <span className="px-2 py-0.5 rounded-md bg-white/90 text-[12px] font-semibold text-[var(--g-vert)]">
              -{discountPct}%
            </span>
          )}
        </div>
      </div>

      <div className="p-6 flex flex-col flex-1 gap-5">
        {/* Titre + description */}
        <div>
          <h2 className="text-[20px] font-semibold tracking-[-0.02em] leading-tight mb-2">{pack.nom}</h2>
          {pack.description && (
            <p className="text-[var(--g-gris)] text-[14.5px] leading-relaxed line-clamp-2">{pack.description}</p>
          )}
        </div>

        {/* Contenus inclus */}
        <div className="flex-1 space-y-3">
          {ebookItems.length > 0 && (
            <div>
              <p className="text-[14px] font-semibold text-[var(--g-vert)] mb-2 flex items-center gap-1.5">
                <BookOpen size={14} /> Guides inclus ({ebookItems.length})
              </p>
              <ul className="space-y-1.5">
                {ebookItems.map((item) => (
                  <li key={item.id} className="flex items-start gap-2 text-[14px] text-[#2c322e]">
                    <span className="w-1 h-1 rounded-full bg-[var(--g-gris-clair)] flex-shrink-0 mt-2" />
                    <span className="leading-snug flex-1">{item.title}</span>
                    {item.prix ? <span className="flex-shrink-0 text-[12.5px] text-[var(--g-gris)] tabular-nums"><PriceTag amount={item.prix} /></span> : null}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {formationItems.length > 0 && (
            <div>
              <p className="text-[14px] font-semibold text-[var(--g-vert)] mb-2 flex items-center gap-1.5 mt-3">
                <Play size={14} /> Formations incluses ({formationItems.length})
              </p>
              <ul className="space-y-1.5">
                {formationItems.map((item) => (
                  <li key={item.id} className="flex items-start gap-2 text-[14px] text-[#2c322e]">
                    <span className="w-1 h-1 rounded-full bg-[var(--g-gris-clair)] flex-shrink-0 mt-2" />
                    <span className="leading-snug flex-1">{item.title}</span>
                    {item.prix ? <span className="flex-shrink-0 text-[12.5px] text-[var(--g-gris)] tabular-nums"><PriceTag amount={item.prix} /></span> : null}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Prix + CTA */}
        <div className="pt-4 border-t border-[var(--g-ligne)] space-y-2">
          {hasOriginal && (
            <div className="flex items-center justify-between text-[13px] text-[var(--g-gris)]">
              <span>Valeur totale :</span>
              <span className="line-through tabular-nums"><PriceTag amount={pack.originalValeur!} /></span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-[var(--g-gris)]">Prix du pack :</span>
            <span className="text-[24px] font-semibold tracking-[-0.02em] text-[var(--g-encre)] tabular-nums"><PriceTag amount={pack.prix} /></span>
          </div>
          {hasOriginal && (
            <p className="text-right text-[13px] font-semibold text-[var(--g-vert)]">
              Tu économises <PriceTag amount={economy} />
            </p>
          )}

          {/* CTA */}
          <div className="flex gap-2 pt-2">
            {detailHref && (
              <Link href={detailHref} aria-label="Voir le détail du pack"
                className="g-btn-ghost flex-shrink-0 !px-3.5">
                <ArrowRight size={16} />
              </Link>
            )}
            <Link href={buyHref} className="g-btn w-full">
              <ShoppingCart size={16} /> Obtenir ce pack
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
