"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpen, Play, ArrowRight, Package, ShoppingCart,
  Copy, Check, Share2, ArrowLeft,
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-[var(--g-encre)]">
      <Link href="/packs"
        className="inline-flex items-center gap-1.5 text-[var(--g-gris)] hover:text-[var(--g-encre)] text-[14px] mb-8 transition-colors">
        <ArrowLeft size={14} /> Tous les packs
      </Link>

      <div className="grid lg:grid-cols-5 gap-10">
        {/* ── Colonne gauche ── */}
        <div className="lg:col-span-3 space-y-8">
          {/* Bannière */}
          {pack.image ? (
            <div className="relative w-full rounded-[16px] overflow-hidden bg-[var(--g-doux)]" style={{ aspectRatio: "4/3" }}>
              <img src={pack.image} alt={pack.nom} loading="lazy" decoding="async" className="w-full h-full object-contain pt-10 pb-10" />
              <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
                <span className="px-2 py-0.5 rounded-md bg-white text-[12px] font-semibold text-[var(--g-encre)] flex items-center gap-1">
                  <Package size={11} /> {pack.items.length} contenu{pack.items.length > 1 ? "s" : ""}
                </span>
                {discountPct > 0 && (
                  <span className="px-2 py-0.5 rounded-md bg-white text-[12px] font-semibold text-[var(--g-vert)]">
                    -{discountPct}%
                  </span>
                )}
              </div>
              <BandeGuides items={ebookItems} taille="text-[11px]" />
            </div>
          ) : (
            <div className="h-40 bg-[var(--g-doux)] flex items-center justify-center rounded-[16px] relative">
              <Package size={48} className="text-[var(--g-vert)]" />
              {discountPct > 0 && (
                <span className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-white text-[12px] font-semibold text-[var(--g-vert)]">
                  -{discountPct}%
                </span>
              )}
            </div>
          )}

          {/* Titre + description */}
          <div>
            <p className="text-[14px] font-semibold text-[var(--g-vert)] mb-2">Pack exclusif</p>
            <h1 className="text-[32px] sm:text-[40px] font-semibold tracking-[-0.03em] leading-[1.08] mb-3">{pack.nom}</h1>
            {pack.description && (
              <p className="text-[var(--g-gris)] leading-relaxed text-[16px] whitespace-pre-line">{pack.description}</p>
            )}
          </div>

          {/* Vidéo de présentation */}
          {pack.videoUrl && (
            <VideoPlayer url={pack.videoUrl} title="Vidéo de présentation" />
          )}

          {/* Contenus inclus */}
          <div className="bg-[var(--g-doux)] rounded-[16px] p-6 space-y-5">
            <h2 className="text-[20px] font-semibold tracking-[-0.02em]">Ce qui est inclus</h2>
            {ebookItems.length > 0 && (
              <div>
                <p className="text-[14px] font-semibold text-[var(--g-vert)] mb-3 flex items-center gap-1.5">
                  <BookOpen size={14} /> Guides ({ebookItems.length})
                </p>
                <ul className="space-y-2">
                  {ebookItems.map((item) => (
                    <li key={item.id} className="flex items-start gap-3 text-[15px] text-[#2c322e]">
                      <BookOpen size={15} className="text-[var(--g-vert)] flex-shrink-0 mt-0.5" />
                      {item.title}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {formationItems.length > 0 && (
              <div>
                <p className="text-[14px] font-semibold text-[var(--g-vert)] mb-3 flex items-center gap-1.5">
                  <Play size={14} /> Formations ({formationItems.length})
                </p>
                <ul className="space-y-2">
                  {formationItems.map((item) => (
                    <li key={item.id} className="flex items-start gap-3 text-[15px] text-[#2c322e]">
                      <Play size={15} className="text-[var(--g-vert)] flex-shrink-0 mt-0.5" />
                      {item.title}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Partage */}
          <div className="border border-[var(--g-ligne)] rounded-[16px] p-5">
            <p className="text-[15px] font-semibold mb-3 flex items-center gap-2">
              <Share2 size={15} className="text-[var(--g-vert)]" /> Partager ce pack
            </p>
            <div className="flex flex-wrap gap-2">
              <a href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-[#25D366] hover:bg-[#20b858] text-white text-[14px] font-semibold rounded-[10px] transition-colors">
                {WA_SVG} WhatsApp
              </a>
              <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-[#1877F2] hover:bg-[#1565d8] text-white text-[14px] font-semibold rounded-[10px] transition-colors">
                {FB_SVG} Facebook
              </a>
              <button onClick={copyLink}
                className={`flex items-center gap-2 px-4 py-2 border text-[14px] font-semibold rounded-[10px] transition-colors ${copied ? "bg-[var(--g-vert-doux)] border-[var(--g-vert)] text-[var(--g-vert)]" : "bg-white border-[var(--g-ligne)] text-[var(--g-encre)] hover:border-[var(--g-encre)]"}`}>
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "Lien copié !" : "Copier le lien"}
              </button>
            </div>
          </div>
        </div>

        {/* ── Colonne droite ── */}
        <div className="lg:col-span-2">
          <div className="sticky top-24 bg-white border border-[var(--g-ligne)] rounded-[16px] p-6 space-y-5">
            <div>
              {hasOriginal && (
                <p className="text-[14px] text-[var(--g-gris)] line-through mb-1 tabular-nums">
                  Valeur totale : <PriceTag amount={pack.originalValeur!} />
                </p>
              )}
              <p className="text-[36px] font-semibold tracking-[-0.03em] text-[var(--g-encre)] leading-none tabular-nums">
                <PriceTag amount={pack.prix} />
              </p>
              {hasOriginal && (
                <p className="mt-2 text-[14px] font-semibold text-[var(--g-vert)]">
                  Vous économisez <PriceTag amount={economy} />
                </p>
              )}
            </div>

            <ul className="space-y-2 text-[14.5px] text-[#2c322e]">
              {ebookItems.length > 0 && (
                <li className="flex items-center gap-2">
                  <BookOpen size={15} className="text-[var(--g-vert)] flex-shrink-0" />
                  {ebookItems.length} guide{ebookItems.length > 1 ? "s" : ""} PDF
                </li>
              )}
              {formationItems.length > 0 && (
                <li className="flex items-center gap-2">
                  <Play size={15} className="text-[var(--g-vert)] flex-shrink-0" />
                  {formationItems.length} formation{formationItems.length > 1 ? "s" : ""} vidéo
                </li>
              )}
              <li className="flex items-center gap-2">
                <ArrowRight size={15} className="text-[var(--g-vert)] flex-shrink-0" />
                Accès immédiat après paiement
              </li>
            </ul>

            <Link href={href} className="g-btn w-full !h-[52px]">
              <ShoppingCart size={18} /> Obtenir ce pack
            </Link>

            <p className="text-[var(--g-gris)] text-[12.5px] text-center">Paiement sécurisé · Accès instantané</p>

            <div className="pt-3 border-t border-[var(--g-ligne)]">
              <p className="text-[var(--g-gris)] text-[12.5px] font-semibold mb-2 text-center">Partager</p>
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
                  className={`p-2 rounded-lg transition-colors ${copied ? "bg-[var(--g-vert-doux)] text-[var(--g-vert)]" : "bg-[var(--g-doux)] hover:bg-[var(--g-ligne)] text-[var(--g-gris)]"}`}>
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
