"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ShoppingCart, Check, BookOpen, Play } from "lucide-react";
import { useCartStore } from "@/lib/store";
import { useUserStore } from "@/lib/user-store";

export type RecommendedProduct = {
  id: string;
  type: "ebook" | "formation";
  title: string;
  price: number;
  originalPrice?: number;
  cover?: string;
  category?: string;
  slug?: string;
  discountedPrice?: number;
};

type Props = {
  productId: string;
  productType: "ebook" | "formation";
  variant?: "dark" | "light";
};

function fmt(price: number): string {
  return new Intl.NumberFormat("fr-FR").format(price) + " FCFA";
}

function ProductCard({
  product,
  isDark,
  isAdded,
  onAdd,
}: {
  product: RecommendedProduct;
  isDark: boolean;
  isAdded: boolean;
  onAdd: () => void;
}) {
  const [imgError, setImgError] = useState(false);
  const href = product.type === "ebook"
    ? `/ebooks/${product.slug || product.id}`
    : `/formation/${product.id}`;

  const coverPlaceholder = (
    <div className={`w-full h-full flex items-center justify-center ${isDark ? "bg-white/5" : "bg-gray-100"}`}>
      {product.type === "ebook"
        ? <BookOpen size={32} className="text-gray-400" />
        : <Play size={32} className="text-gray-400" />}
    </div>
  );

  return (
    <div className={`rounded-2xl border overflow-hidden flex flex-col ${isDark ? "bg-white/[0.04] border-white/10" : "bg-white border-gray-200 shadow-sm hover:shadow-md"} transition-shadow`}>
      <Link href={href} className="block relative overflow-hidden" style={{ aspectRatio: "16/9" }}>
        {product.cover && !imgError ? (
          <img
            src={product.cover}
            alt={product.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            onError={() => setImgError(true)}
          />
        ) : (
          coverPlaceholder
        )}
        <span className={`absolute top-2 left-2 text-xs font-bold px-2 py-0.5 rounded-lg ${product.type === "ebook" ? "bg-[#E8B800] text-black" : "bg-[#27A827] text-white"}`}>
          {product.type === "ebook" ? "Ebook" : "Formation"}
        </span>
      </Link>

      <div className="p-4 flex flex-col gap-2.5 flex-1">
        <Link href={href}>
          <p className={`text-sm font-bold leading-tight line-clamp-2 hover:text-[#E8B800] transition-colors ${isDark ? "text-white" : "text-gray-900"}`}>
            {product.title}
          </p>
        </Link>
        {product.category && (
          <span className={`text-xs ${isDark ? "text-white/50" : "text-gray-400"}`}>{product.category}</span>
        )}

        <div className="flex items-center justify-between mt-auto pt-2 border-t border-dashed border-gray-100">
          <div className="flex flex-col">
            {product.discountedPrice && product.discountedPrice < product.price ? (
              <>
                <span className={`text-xs line-through ${isDark ? "text-white/40" : "text-gray-400"}`}>{fmt(product.price)}</span>
                <span className="text-[#E8B800] font-bold text-sm">{fmt(product.discountedPrice)}</span>
              </>
            ) : (
              <>
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className={`text-xs line-through ${isDark ? "text-white/40" : "text-gray-400"}`}>{fmt(product.originalPrice)}</span>
                )}
                <span className={`font-bold text-sm ${isDark ? "text-white" : "text-gray-900"}`}>{fmt(product.price)}</span>
              </>
            )}
          </div>
          <button
            onClick={onAdd}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
              isAdded ? "bg-emerald-500 text-white" : "bg-[#E8B800] hover:bg-[#d4a700] text-black"
            }`}
          >
            {isAdded ? <Check size={12} /> : <ShoppingCart size={12} />}
            {isAdded ? "Ajouté !" : "Ajouter"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CrossSellWidget({ productId, productType, variant = "light" }: Props) {
  const [recommendations, setRecommendations] = useState<RecommendedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState<Set<string>>(new Set());

  const { addItem } = useCartStore();
  const { currentUser, ebooksAchetes, formationsAchetees } = useUserStore();

  useEffect(() => {
    const alreadyOwned = [...ebooksAchetes, ...formationsAchetees];
    const params = new URLSearchParams({ productId, productType });
    if (alreadyOwned.length > 0) params.set("excludeIds", alreadyOwned.join(","));

    fetch(`/api/cross-sell?${params}`)
      .then(r => r.json())
      .then(d => setRecommendations(d.recommendations || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [productId, productType, currentUser?.id]); // eslint-disable-line

  if (loading || recommendations.length === 0) return null;

  const isDark = variant === "dark";

  function handleAdd(product: RecommendedProduct) {
    addItem({
      id: product.id,
      title: product.title,
      price: product.discountedPrice ?? product.price,
      type: product.type === "ebook" ? "ebook" : "formation",
      cover: product.cover,
      category: product.category,
    });
    setAdded(prev => new Set([...prev, product.id]));
    setTimeout(() => {
      setAdded(prev => { const n = new Set(prev); n.delete(product.id); return n; });
    }, 2000);
  }

  const cols =
    recommendations.length === 1 ? "grid-cols-1 max-w-sm mx-auto" :
    recommendations.length === 2 ? "grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto" :
    "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";

  return (
    <section className={`py-14 ${isDark ? "" : "bg-gray-50"} border-t ${isDark ? "border-white/10" : "border-gray-100"}`}>
      <div className="max-w-5xl mx-auto px-4">
        <h2 className={`text-lg font-bold mb-6 ${isDark ? "text-white" : "text-gray-900"}`}>
          Ceux qui ont acheté ceci ont aussi aimé…
        </h2>
        <div className={`grid gap-4 ${cols}`}>
          {recommendations.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              isDark={isDark}
              isAdded={added.has(product.id)}
              onAdd={() => handleAdd(product)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
