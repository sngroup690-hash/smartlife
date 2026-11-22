"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpen, Play, ArrowRight, Package, ShoppingCart,
  Tag, Zap, Copy, Check, Share2, ArrowLeft,
} from "lucide-react";
import { useUserStore } from "@/lib/user-store";
import { PriceTag } from "@/components/PriceTag";
import BandeGuides from "@/components/BandeGuides";
import VideoPlayer from "@/components/VideoPlayer";

type PackItem = { type: "ebook" | "formation"; id: string; title: string };
export type PackData = {
  id: string; slug: string; nom: string; description: string; prix: number;
  originalValeur?: number; image?: string; statut: string; items: PackItem[];
  videoUrl?: string;
};

const SITE = "https://smartlifecm.com";
const WA_SVG = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
    <path d="M11.99 2C6.476 2 2 6.477 2 11.99c0 1.979.58 3.82 1.584 5.363L2 22l4.784-1.556A9.953 9.953 0 0011.99 22C17.523 22 22 17.523 22 11.99S17.523 2 11.99 2zm0 18.154a8.164 8.164 0 01-4.154-1.135l-.298-.177-3.086 1.003.988-3.01-.196-.31A8.163 8.163 0 013.836 11.99c0-4.508 3.667-8.154 8.154-8.154s8.154 3.646 8.154 8.154-3.667 8.154-8.154 8.154z"/>
  </svg>
);
const FB_SVG = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

export default function PackDetailClient({ pack }: { pack: PackData }) {
  const { isLoggedIn } = useUserStore();
  const [copied, setCopied] = useState(false);

  const checkoutUrl = `/checkout?packId=${pack.id}&titre=${encodeURIComponent(pack.nom)}&prix=${pack.prix}`;
  const href = isLoggedIn ? checkoutUrl : `/register?redirect=${encodeURIComponent(checkoutUrl)}`;
  const shareUrl = `${SITE}/packs/${pack.slug}`;
  const shareText = `Découvrez notre pack exclusif : ${pack.nom} — ${shareUrl}`;

  const ebookItems     = pack.items.filter((i) => i.type === "ebook");
  const formationItems = pack.items.filter((i) => i.type === "formation");
  const hasOriginal    = (pack.originalValeur || 0) > pack.prix;
  const economy        = hasOriginal ? pack.originalValeur! - pack.prix : 0;
  const discountPct    = hasOriginal ? Math.round((economy / pack.originalValeur!) * 100) : 0;

  function copyLink() {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link href="/packs"
        className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-900 text-sm mb-8 transition-colors">
        <ArrowLeft size={14} /> Tous les packs
      </Link>

      <div className="grid lg:grid-cols-5 gap-10">
        {/* ── Colonne gauche ── */}
        <div className="lg:col-span-3 space-y-8">
          {/* Bannière */}
          {pack.image ? (
            <div className="relative w-full rounded-2xl overflow-hidden" style={{ aspectRatio: "4/3", background: "linear-gradient(135deg, #fffbea 0%, #f0fdf4 100%)" }}>
              <img src={pack.image} alt={pack.nom} loading="lazy" decoding="async" className="w-full h-full object-contain pt-10 pb-10" />
              <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
                <span className="px-2.5 py-1 text-xs font-bold rounded-full flex items-center gap-1 backdrop-blur-sm" style={{ background: "#27A827", color: "#fff" }}>
                  <Package size={10} /> {pack.items.length} contenu{pack.items.length > 1 ? "s" : ""}
                </span>
                {discountPct > 0 && (
                  <span className="px-2.5 py-1 bg-red-500 text-white text-xs font-black rounded-full flex items-center gap-1">
                    <Zap size={10} /> -{discountPct}%
                  </span>
                )}
              </div>
              <BandeGuides items={ebookItems} taille="text-[11px]" />
            </div>
          ) : (
            <div className="h-40 bg-gradient-to-br from-[#E8B800]/10 via-[#27A827]/5 to-[#E8B800]/10 flex items-center justify-center rounded-2xl relative">
              <Package size={56} className="text-[#E8B800]" />
              {discountPct > 0 && (
                <span className="absolute top-3 right-3 px-2.5 py-1 bg-red-500 text-white text-xs font-black rounded-full flex items-center gap-1">
                  <Zap size={10} /> -{discountPct}%
                </span>
              )}
            </div>
          )}

          {/* Titre + description */}
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#E8B800]/10 border border-[#E8B800]/30 rounded-full text-[#E8B800] text-xs font-bold mb-3">
              <Tag size={11} /> PACK EXCLUSIF
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3 leading-tight">{pack.nom}</h1>
            {pack.description && (
              <p className="text-gray-600 leading-relaxed text-base whitespace-pre-line">{pack.description}</p>
            )}
          </div>

          {/* Vidéo de présentation */}
          {pack.videoUrl && (
            <VideoPlayer url={pack.videoUrl} title="Vidéo de présentation" />
          )}

          {/* Contenus inclus */}
          <div className="bg-gray-50 rounded-2xl p-6 space-y-5">
            <h2 className="text-gray-900 font-black text-lg">Ce qui est inclus</h2>
            {ebookItems.length > 0 && (
              <div>
                <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <BookOpen size={12} /> Guides ({ebookItems.length})
                </p>
                <ul className="space-y-2">
                  {ebookItems.map((item) => (
                    <li key={item.id} className="flex items-start gap-3 text-sm text-gray-700">
                      <span className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <BookOpen size={10} className="text-blue-500" />
                      </span>
                      {item.title}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {formationItems.length > 0 && (
              <div>
                <p className="text-xs font-bold text-purple-600 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <Play size={12} /> Formations ({formationItems.length})
                </p>
                <ul className="space-y-2">
                  {formationItems.map((item) => (
                    <li key={item.id} className="flex items-start gap-3 text-sm text-gray-700">
                      <span className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Play size={10} className="text-purple-500" />
                      </span>
                      {item.title}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Partage */}
          <div className="border border-gray-200 rounded-2xl p-5">
            <p className="text-gray-700 font-bold text-sm mb-3 flex items-center gap-2">
              <Share2 size={14} className="text-[#E8B800]" /> Partager ce pack
            </p>
            <div className="flex flex-wrap gap-2">
              <a href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-[#25D366] hover:bg-[#20b858] text-white text-sm font-bold rounded-xl transition-colors">
                {WA_SVG} WhatsApp
              </a>
              <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-[#1877F2] hover:bg-[#1565d8] text-white text-sm font-bold rounded-xl transition-colors">
                {FB_SVG} Facebook
              </a>
              <button onClick={copyLink}
                className={`flex items-center gap-2 px-4 py-2 border text-sm font-bold rounded-xl transition-colors ${copied ? "bg-emerald-50 border-emerald-300 text-emerald-700" : "bg-gray-50 border-gray-200 text-gray-700 hover:border-[#E8B800] hover:text-[#E8B800]"}`}>
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "Lien copié !" : "Copier le lien"}
              </button>
            </div>
          </div>
        </div>

        {/* ── Colonne droite ── */}
        <div className="lg:col-span-2">
          <div className="sticky top-24 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-5">
            <div>
              {hasOriginal && (
                <p className="text-sm text-gray-400 line-through mb-1">
                  Valeur totale : <PriceTag amount={pack.originalValeur!} />
                </p>
              )}
              <p className="text-4xl font-black text-[#27A827] leading-none">
                <PriceTag amount={pack.prix} />
              </p>
              {hasOriginal && (
                <span className="inline-flex items-center gap-1 mt-2 px-3 py-1.5 bg-green-50 border border-green-200 text-green-700 text-xs font-black rounded-xl">
                  <Zap size={11} /> Vous économisez <PriceTag amount={economy} />
                </span>
              )}
            </div>

            <ul className="space-y-2 text-sm text-gray-700">
              {ebookItems.length > 0 && (
                <li className="flex items-center gap-2">
                  <BookOpen size={14} className="text-blue-500 flex-shrink-0" />
                  {ebookItems.length} guide{ebookItems.length > 1 ? "s" : ""} PDF
                </li>
              )}
              {formationItems.length > 0 && (
                <li className="flex items-center gap-2">
                  <Play size={14} className="text-purple-500 flex-shrink-0" />
                  {formationItems.length} formation{formationItems.length > 1 ? "s" : ""} vidéo
                </li>
              )}
              <li className="flex items-center gap-2">
                <ArrowRight size={14} className="text-[#E8B800] flex-shrink-0" />
                Accès immédiat après paiement
              </li>
            </ul>

            <Link href={href}
              className="flex items-center justify-center gap-2 w-full py-4 bg-gradient-to-r from-[#E8B800] to-[#27A827] hover:from-[#27A827] hover:to-[#E8B800] text-black font-black rounded-xl text-base transition-all shadow-sm">
              <ShoppingCart size={18} /> Obtenir ce pack
            </Link>

            <p className="text-gray-400 text-xs text-center">Paiement sécurisé · Accès instantané</p>

            <div className="pt-3 border-t border-gray-100">
              <p className="text-gray-500 text-xs font-semibold mb-2 text-center">Partager</p>
              <div className="flex justify-center gap-2">
                <a href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="p-2 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] rounded-lg transition-colors">
                  {WA_SVG}
                </a>
                <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="p-2 bg-[#1877F2]/10 hover:bg-[#1877F2]/20 text-[#1877F2] rounded-lg transition-colors">
                  {FB_SVG}
                </a>
                <button onClick={copyLink}
                  className={`p-2 rounded-lg transition-colors ${copied ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 hover:bg-gray-200 text-gray-600"}`}>
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
