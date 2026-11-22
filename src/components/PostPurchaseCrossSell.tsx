"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Zap, ShoppingCart, Check, X, BookOpen, Play } from "lucide-react";
import { useCartStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import type { RecommendedProduct } from "@/components/CrossSellWidget";

type Props = {
  purchasedEbookIds: string[];
  purchasedFormationIds: string[];
  userId?: string;
  onSkip: () => void;
};

function fmt(p: number): string {
  return new Intl.NumberFormat("fr-FR").format(p) + " FCFA";
}

export default function PostPurchaseCrossSell({
  purchasedEbookIds,
  purchasedFormationIds,
  userId,
  onSkip,
}: Props) {
  const [offer, setOffer] = useState<RecommendedProduct | null>(null);
  const [discount, setDiscount] = useState(20);
  const [added, setAdded] = useState(false);
  const { addItem } = useCartStore();
  const router = useRouter();

  useEffect(() => {
    const allIds = [...purchasedEbookIds, ...purchasedFormationIds];
    if (!allIds.length) { onSkip(); return; }

    const baseId = purchasedEbookIds[0] ?? purchasedFormationIds[0];
    const baseType = purchasedEbookIds.length > 0 ? "ebook" : "formation";

    const params = new URLSearchParams({
      productId: baseId,
      productType: baseType,
      postPurchase: "true",
      excludeIds: allIds.join(","),
    });

    fetch(`/api/cross-sell?${params}`)
      .then(r => r.json())
      .then(d => {
        if (d.recommendations?.length > 0) {
          setOffer(d.recommendations[0]);
          setDiscount(d.postPurchaseDiscount ?? 20);
        } else {
          onSkip();
        }
      })
      .catch(() => onSkip());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!offer) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-[#E8B800]/40 border-t-[#E8B800] rounded-full animate-spin" />
      </div>
    );
  }

  const href = offer.type === "ebook" ? `/ebooks/${offer.slug || offer.id}` : `/formation/${offer.id}`;

  function handleAccept() {
    if (!offer) return;
    addItem({
      id: offer.id,
      title: offer.title,
      price: offer.discountedPrice ?? offer.price,
      type: offer.type === "ebook" ? "ebook" : "formation",
      cover: offer.cover,
    });
    setAdded(true);
    setTimeout(() => router.push("/checkout"), 900);
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-3">
          <Check size={28} className="text-emerald-600" />
        </div>
        <h1 className="text-gray-900 text-2xl font-bold mb-1">Achat confirmé !</h1>
        <p className="text-gray-500 text-sm">Vos produits sont disponibles dans Mon Espace.</p>
      </div>

      {/* Offer card */}
      <div className="relative bg-gradient-to-br from-[#E8B800]/8 to-[#27A827]/8 border border-[#E8B800]/30 rounded-2xl p-5 overflow-hidden shadow-sm">
        <button
          onClick={onSkip}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Ignorer l'offre"
        >
          <X size={16} />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <span className="flex items-center gap-1.5 bg-[#E8B800] text-black text-xs font-bold px-2.5 py-1 rounded-lg">
            <Zap size={11} />
            Offre exclusive −{discount}%
          </span>
          <span className="text-gray-400 text-xs">Réservée juste après l&apos;achat</span>
        </div>

        <p className="text-gray-700 text-sm font-semibold mb-3">
          Complétez votre apprentissage avec&nbsp;:
        </p>

        <div className="flex items-start gap-3">
          <Link href={href} className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
            {offer.cover ? (
              <img src={offer.cover} alt={offer.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                {offer.type === "ebook" ? <BookOpen size={22} className="text-gray-400" /> : <Play size={22} className="text-gray-400" />}
              </div>
            )}
          </Link>
          <div className="flex-1 min-w-0">
            <Link href={href}>
              <p className="text-gray-900 font-bold text-sm leading-tight line-clamp-2 hover:text-[#E8B800] transition-colors mb-1.5">
                {offer.title}
              </p>
            </Link>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-md inline-block ${offer.type === "ebook" ? "bg-[#E8B800]/15 text-[#b88a00]" : "bg-green-100 text-green-700"}`}>
              {offer.type === "ebook" ? "Ebook" : "Formation"}
            </span>
            <div className="flex items-center gap-2 mt-2">
              {offer.discountedPrice && offer.discountedPrice < offer.price ? (
                <>
                  <span className="text-gray-400 line-through text-xs">{fmt(offer.price)}</span>
                  <span className="text-[#E8B800] font-bold text-base">{fmt(offer.discountedPrice)}</span>
                </>
              ) : (
                <span className="text-gray-900 font-bold text-base">{fmt(offer.price)}</span>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={handleAccept}
          disabled={added}
          className={`w-full mt-5 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.99] ${
            added
              ? "bg-emerald-500 text-white cursor-not-allowed"
              : "bg-gradient-to-r from-[#E8B800] to-[#27A827] hover:from-[#27A827] hover:to-[#E8B800] text-black shadow-md"
          }`}
        >
          {added ? <Check size={15} /> : <ShoppingCart size={15} />}
          {added ? "Ajouté — redirection vers le paiement…" : `Profiter de l'offre −${discount}%`}
        </button>
      </div>

      <div className="text-center mt-5">
        <button
          onClick={onSkip}
          className="text-gray-400 text-sm hover:text-gray-600 transition-colors underline"
        >
          Non merci, accéder à Mon Espace →
        </button>
      </div>
    </div>
  );
}
