"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BookOpen, Play, ArrowRight, Package, Loader2, ShoppingCart, Tag, Zap,
} from "lucide-react";
import { useUserStore } from "@/lib/user-store";
import { PriceTag } from "@/components/PriceTag";

// ── Types ──────────────────────────────────────────────────────────────────────

type PackItem = { type: "ebook" | "formation"; id: string; title: string; prix?: number };
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
        <Loader2 size={32} className="animate-spin text-[#E8B800]" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* En-tête */}
      <div className="text-center mb-14">
        <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#E8B800]/10 border border-[#E8B800]/30 rounded-full text-[#E8B800] text-sm font-bold mb-5">
          <Package size={14} /> Nos Packs
        </span>
        <h1 className="text-4xl sm:text-5xl font-black text-gray-900 mb-4">
          Économisez avec nos <span className="text-[#E8B800]">packs</span>
        </h1>
        <p className="text-gray-600 max-w-xl mx-auto">
          Combinez plusieurs guides et formations à prix réduit. Tout ce qu'il vous faut pour réussir, regroupé en un seul pack.
        </p>
      </div>

      {packs.length === 0 ? (
        <div className="text-center py-24 bg-white border border-gray-200 rounded-2xl">
          <Package size={48} className="text-gray-200 mx-auto mb-5" />
          <h2 className="text-gray-900 font-bold text-lg mb-2">Aucun pack disponible</h2>
          <p className="text-gray-500 text-sm mb-7">
            Revenez bientôt pour découvrir nos offres groupées.
          </p>
          <Link href="/ebooks"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#E8B800] text-black font-bold rounded-xl text-sm transition-colors hover:bg-[#27A827]">
            Voir les ebooks <ArrowRight size={14} />
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
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

  const hasOriginal = (pack.originalValeur || 0) > pack.prix;
  const economy = hasOriginal ? pack.originalValeur! - pack.prix : 0;
  const discountPct = hasOriginal ? Math.round((economy / pack.originalValeur!) * 100) : 0;

  return (
    <article className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden hover:border-[#E8B800]/50 hover:shadow-md transition-all flex flex-col">
      {/* Image / bannière */}
      {pack.image ? (
        <div className="relative w-full bg-[#f7f7f8] overflow-hidden" style={{ aspectRatio: "2/1" }}>
          <img
            src={pack.image}
            alt={pack.nom}
            className="w-full h-full object-cover"
          />
          {/* Badges superposés */}
          <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
            <span className="px-2.5 py-1 bg-black/70 text-white text-xs font-bold rounded-full flex items-center gap-1 backdrop-blur-sm">
              <Package size={10} /> {totalItems} contenu{totalItems > 1 ? "s" : ""}
            </span>
            {discountPct > 0 && (
              <span className="px-2.5 py-1 bg-red-500 text-white text-xs font-black rounded-full flex items-center gap-1">
                <Zap size={10} /> -{discountPct}%
              </span>
            )}
          </div>
          <span className="absolute bottom-3 right-3 px-3 py-1 bg-[#E8B800] text-black text-xs font-black rounded-full flex items-center gap-1">
            <Tag size={10} /> PACK
          </span>
        </div>
      ) : (
        <div className="h-32 bg-gradient-to-br from-[#E8B800]/10 via-[#27A827]/5 to-[#E8B800]/10 flex items-center justify-center relative">
          <Package size={44} className="text-[#E8B800]" />
          <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
            <span className="px-2.5 py-1 bg-white/80 text-gray-700 text-xs font-bold rounded-full flex items-center gap-1 border border-gray-200">
              <Package size={10} /> {totalItems} contenu{totalItems > 1 ? "s" : ""}
            </span>
            {discountPct > 0 && (
              <span className="px-2.5 py-1 bg-red-500 text-white text-xs font-black rounded-full flex items-center gap-1">
                <Zap size={10} /> -{discountPct}%
              </span>
            )}
          </div>
          <span className="absolute bottom-3 right-3 px-3 py-1 bg-[#E8B800] text-black text-xs font-black rounded-full flex items-center gap-1">
            <Tag size={10} /> PACK
          </span>
        </div>
      )}

      <div className="p-6 flex flex-col flex-1 gap-5">
        {/* Titre + description */}
        <div>
          <h2 className="text-gray-900 font-black text-xl mb-2 leading-tight">{pack.nom}</h2>
          {pack.description && (
            <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">{pack.description}</p>
          )}
        </div>

        {/* Contenus inclus */}
        <div className="flex-1 space-y-3">
          {ebookItems.length > 0 && (
            <div>
              <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <BookOpen size={11} /> Guides inclus ({ebookItems.length})
              </p>
              <ul className="space-y-1.5">
                {ebookItems.map((item) => (
                  <li key={item.id} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0 mt-1.5" />
                    <span className="leading-snug flex-1">{item.title}</span>
                    {item.prix ? <span className="flex-shrink-0 text-[12px] font-bold text-gray-500"><PriceTag amount={item.prix} /></span> : null}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {formationItems.length > 0 && (
            <div>
              <p className="text-xs font-bold text-purple-600 uppercase tracking-wide mb-2 flex items-center gap-1.5 mt-3">
                <Play size={11} /> Formations incluses ({formationItems.length})
              </p>
              <ul className="space-y-1.5">
                {formationItems.map((item) => (
                  <li key={item.id} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 flex-shrink-0 mt-1.5" />
                    <span className="leading-snug flex-1">{item.title}</span>
                    {item.prix ? <span className="flex-shrink-0 text-[12px] font-bold text-gray-500"><PriceTag amount={item.prix} /></span> : null}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Prix + CTA */}
        <div className="pt-4 border-t border-gray-100 space-y-3">
          {hasOriginal && (
            <div className="flex items-center justify-between text-[13px]">
              <span className="font-semibold text-gray-500">Valeur totale :</span>
              <span className="font-bold text-gray-400 line-through"><PriceTag amount={pack.originalValeur!} /></span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold text-gray-500">Prix du pack :</span>
            <span className="text-2xl font-black text-[#27A827]"><PriceTag amount={pack.prix} /></span>
          </div>
          {hasOriginal && (
            <div className="flex items-center justify-center gap-1.5 py-2 bg-green-50 border border-green-200 text-green-700 text-[13px] font-black rounded-xl">
              <Zap size={12} /> Tu économises <PriceTag amount={economy} />
            </div>
          )}

          {/* CTA */}
          <div className="flex gap-2">
            {detailHref && (
              <Link href={detailHref}
                className="flex items-center justify-center gap-1.5 px-3 py-3 border border-gray-200 hover:border-[#E8B800] text-gray-600 hover:text-[#E8B800] font-bold rounded-xl text-sm transition-all flex-shrink-0">
                <ArrowRight size={14} />
              </Link>
            )}
            <Link
              href={buyHref}
              className="cta-clignote flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-sm font-bold shadow-md"
              style={{ background: "linear-gradient(135deg, #E8B800, #27A827)", color: "#fff" }}
            >
              <ShoppingCart size={15} /> Obtenir ce pack
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
