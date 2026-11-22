"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Star, BookOpen, Download, Tag, Eye, Share2, Check, BookOpenCheck, X, Bookmark } from "lucide-react";
import { PaymentBadges } from "@/components/PaymentBadges";
import Link from "next/link";
import NextImage from "next/image";
import dynamic from "next/dynamic";
import { Ebook, formatPrice } from "@/lib/data";
import { useUserStore } from "@/lib/user-store";
import { stripHtml } from "@/lib/strip-html";
import { PriceTag } from "@/components/PriceTag";
import DownloadModal from "@/components/DownloadModal";

const PdfViewer = dynamic(
  () => import("@/components/PdfViewer").then((m) => m.PdfViewer),
  { ssr: false }
);

const CATEGORY_COLORS: Record<string, string> = {
  "Création d'Entreprises & Commerce Réel": "bg-[#E8B800]/10 text-[#A07800] border-[#E8B800]/30",
  "Élevage & Dresseurs": "bg-[#27A827]/10 text-[#1a7a1a] border-[#27A827]/30",
  "Agriculture & Cultures Rentables": "bg-[#27A827]/10 text-[#1a7a1a] border-[#27A827]/30",
  "Fabrication Artisanale & Transformation": "bg-orange-50 text-orange-700 border-orange-200",
  "Santé, Bien-être & Soins Corporels": "bg-pink-50 text-pink-700 border-pink-200",
  "Business Numérique, IA & Tech": "bg-blue-50 text-blue-700 border-blue-200",
  "Gestion, Droit & Finance": "bg-amber-50 text-amber-700 border-amber-200",
  "Développement Personnel, Compétences & Spiritualité": "bg-purple-50 text-purple-700 border-purple-200",
  Marketing: "bg-blue-50 text-blue-700 border-blue-200",
  Entrepreneuriat: "bg-[#E8B800]/10 text-[#A07800] border-[#E8B800]/30",
  "Développement Personnel": "bg-purple-50 text-purple-700 border-purple-200",
  Finance: "bg-amber-50 text-amber-700 border-amber-200",
};

const COVER_COLORS = [
  "from-[#1A1200] to-[#2D2000]",
  "from-blue-900 to-indigo-800",
  "from-emerald-900 to-teal-800",
  "from-pink-900 to-rose-800",
  "from-orange-900 to-amber-800",
  "from-cyan-900 to-sky-800",
];


function ApercuModal({ ebook, pdfUrl, onClose }: { ebook: Ebook; pdfUrl: string; onClose: () => void }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = "hidden";
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", fn);
    };
  }, [onClose]);

  if (!mounted) return null;

  const modal = (
    <div
      className="fixed inset-0 flex items-center justify-center p-3"
      style={{ zIndex: 9999, backgroundColor: "rgba(0,0,0,0.82)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden"
        style={{ maxHeight: "92vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <BookOpenCheck size={16} className="text-[#E8B800]" />
            <span className="text-gray-800 text-sm font-semibold">Aperçu gratuit — 3 premières pages</span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500"
          >
            <X size={15} />
          </button>
        </div>

        {/* PDF rendu en canvas — scrollable */}
        <div className="overflow-y-auto flex-1 relative">
          <PdfViewer url={pdfUrl} />

          {/* Gradient + CTA fixé en bas */}
          <div
            className="sticky bottom-0 left-0 right-0 flex flex-col items-center gap-2 pb-4 px-5"
            style={{
              background: "linear-gradient(to top, #ffffff 60%, rgba(255,255,255,0.9) 80%, transparent 100%)",
              paddingTop: "4rem",
            }}
          >
            <p className="text-gray-500 text-xs text-center">La suite est disponible après achat</p>
            <Link
              href={`/ebooks/${ebook.slug}`}
              onClick={onClose}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#E8B800] to-[#27A827] text-black font-bold rounded-xl text-sm shadow-lg w-full justify-center"
            >
              <Download size={15} />
              Obtenir cet ebook — <PriceTag amount={ebook.price} />
            </Link>
            <PaymentBadges size="xs" className="justify-center" />
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

export default function EbookCard({ ebook, priority = false }: { ebook: Ebook; priority?: boolean }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [apercuOpen, setApercuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [coverError, setCoverError] = useState(false);
  const toggleWishlist = useUserStore((s) => s.toggleWishlist);
  const isInWishlist = useUserStore((s) => s.isInWishlist);
  const saved = isInWishlist(ebook.id, "ebook");

  const pdfPreviewUrl = (ebook as Ebook & { pdfPreviewUrl?: string }).pdfPreviewUrl;
  // Le bouton aperçu est toujours visible — si pas de PDF, le modal affiche un message
  // On se base sur pdfPreviewUrl ET downloadUrl comme fallback
  const downloadUrl = (ebook as Ebook & { downloadUrl?: string }).downloadUrl;
  const aperçuUrl = typeof pdfPreviewUrl === "string" && pdfPreviewUrl.trim()
    ? pdfPreviewUrl
    : typeof downloadUrl === "string" && downloadUrl.trim()
    ? downloadUrl
    : null;

  function copyLink() {
    const url = `${window.location.origin}/ebooks/${ebook.slug}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const colorIndex = parseInt(ebook.id.replace("eb-", "")) - 1;
  const coverColor = COVER_COLORS[Math.abs(isNaN(colorIndex) ? 0 : colorIndex) % COVER_COLORS.length];
  const catColor = CATEGORY_COLORS[ebook.category] || "bg-[#27A827]/10 text-[#1a7a1a] border-[#27A827]/30";

  const discount = ebook.originalPrice
    ? Math.round((1 - ebook.price / ebook.originalPrice) * 100)
    : null;

  const customBg = (ebook as Ebook & { cardBgColor?: string }).cardBgColor;
  const customText = (ebook as Ebook & { cardTextColor?: string }).cardTextColor;
  const coverHeight = (ebook as Ebook & { coverHeight?: number }).coverHeight || 260;

  return (
    <>
      <div
        className="border border-gray-200 rounded-2xl overflow-hidden card-hover group flex flex-col shadow-sm transition-colors"
        style={{ backgroundColor: customBg || "#ffffff", color: customText || undefined }}
      >
        {/* Cover — vignette carrée 600×600 */}
        <Link
          href={`/ebooks/${ebook.slug}`}
          className="block relative w-full overflow-hidden aspect-square"
        >
          {ebook.cover && !coverError ? (
            <NextImage
              src={ebook.cover.split("?")[0]}
              alt={ebook.title}
              width={600}
              height={600}
              sizes="(max-width: 640px) calc(100vw - 32px), (max-width: 1024px) calc(50vw - 48px), 400px"
              className="w-full h-full group-hover:scale-105 transition-transform duration-300"
              style={{ objectFit: ebook.coverObjectFit || "cover", objectPosition: ebook.coverObjectPosition || "center" }}
              priority={priority}
              loading={priority ? undefined : "lazy"}
              onError={() => setCoverError(true)}
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${coverColor} flex flex-col justify-between p-5 relative overflow-hidden`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2" />
              <div className="relative z-10">
                <div className="inline-block px-2 py-1 bg-white/20 rounded text-white/90 text-[10px] font-bold uppercase tracking-wider mb-2">
                  Guide pratique
                </div>
                <BookOpen size={28} className="text-white/40" />
              </div>
              <div className="relative z-10">
                <p className="text-white font-black text-base leading-tight line-clamp-3 mb-2">{ebook.title.replace("Guide pratique : ", "")}</p>
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded bg-white/20 flex items-center justify-center">
                    <span className="text-[8px] font-bold text-white">SL</span>
                  </div>
                  <span className="text-white/70 text-[10px] font-medium">Smart Life</span>
                  {ebook.pages && <span className="text-white/50 text-[10px]">· {ebook.pages} pages</span>}
                </div>
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <span className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 px-4 py-2 bg-black/70 text-white text-xs font-medium rounded-full">
              <Eye size={14} /> Voir les détails
            </span>
          </div>
          <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
            {ebook.bestseller && (
              <span className="px-2 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full">Bestseller</span>
            )}
            {ebook.new && (
              <span className="px-2 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full">Nouveau</span>
            )}
            {discount && (
              <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full">-{discount}%</span>
            )}
          </div>
          <button
            onClick={(e) => { e.preventDefault(); toggleWishlist(ebook.id, "ebook"); }}
            title={saved ? "Retirer des favoris" : "Sauvegarder"}
            className={`absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full shadow transition-all ${saved ? "bg-[#E8B800] text-black" : "bg-black/50 text-white hover:bg-[#E8B800] hover:text-black"}`}
          >
            <Bookmark size={14} className={saved ? "fill-black" : ""} />
          </button>
        </Link>

        {/* Contenu */}
        <div className="p-4 flex flex-col flex-1 min-w-0">
          <div className="flex items-start gap-2 mb-3">
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] border font-bold leading-tight min-w-0 ${catColor}`}>
              <Tag size={9} className="flex-shrink-0" />
              <span className="line-clamp-1">{ebook.category}</span>
            </span>
            <div className="flex items-center gap-1 text-xs text-gray-900 font-bold whitespace-nowrap flex-shrink-0">
              <BookOpen size={12} />
              {ebook.pages}p
            </div>
          </div>

          <Link href={`/ebooks/${ebook.slug}`} className="group/title">
            <h3
              className="font-bold text-sm leading-snug mb-2 transition-colors line-clamp-3"
              style={{ color: customText || "#111827" }}
            >
              {ebook.title}
            </h3>
          </Link>

          <p
            className="font-bold text-sm leading-relaxed line-clamp-3 mb-3 flex-1"
            style={{ color: customText ? `${customText}cc` : "#111827" }}
          >
            {stripHtml(ebook.description)}
          </p>

          <div className="flex items-center gap-2 mb-4">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={13}
                  className={i < Math.floor(ebook.rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
                />
              ))}
            </div>
            <span className="text-yellow-500 text-sm font-bold">{ebook.rating}</span>
            <span className="text-gray-900 font-bold text-xs">({ebook.reviews})</span>
          </div>

          <div className="flex flex-col gap-3 mt-auto">
            {/* Prix */}
            <div className="flex items-baseline gap-2">
              <span className="font-bold text-lg" style={{ color: customText || "#111827" }}>
                <PriceTag amount={ebook.price} />
              </span>
              {ebook.originalPrice && (
                <span
                  className="text-sm line-through"
                  style={{ color: customText ? `${customText}88` : "#6b7280" }}
                >
                  <PriceTag amount={ebook.originalPrice} />
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              {/* Ligne 1 : boutons principaux */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setApercuOpen(true)}
                  title="Lire les 3 premières pages gratuitement"
                  className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 bg-gradient-to-r from-[#27A827] to-[#E8B800] text-black font-bold text-xs rounded-lg animate-pulse hover:animate-none hover:opacity-90 transition-opacity"
                >
                  <BookOpenCheck size={12} /> Aperçu
                </button>
                <button
                  onClick={() => setModalOpen(true)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 bg-[#27A827] hover:bg-[#1f8c1f] text-white text-xs font-bold rounded-lg transition-colors"
                >
                  <Download size={13} /> Acheter
                </button>
                <Link
                  href={`/ebooks/${ebook.slug}`}
                  className="flex items-center gap-1 px-2 py-1.5 border border-gray-200 hover:border-[#27A827] text-gray-900 font-bold hover:text-[#27A827] text-xs rounded-lg transition-colors"
                >
                  <Eye size={13} /> Détails
                </Link>
                <button
                  onClick={copyLink}
                  title="Copier le lien"
                  className={`p-1.5 rounded-lg border transition-all ${copied ? "bg-[#27A827]/10 border-[#27A827]/40 text-[#27A827]" : "border-gray-200 hover:border-[#27A827] text-gray-600 hover:text-[#27A827]"}`}
                >
                  {copied ? <Check size={13} /> : <Share2 size={13} />}
                </button>
              </div>
              {/* Ligne 2 : badges paiement */}
              <PaymentBadges size="xs" />
            </div>
          </div>
        </div>
      </div>

      {modalOpen && (
        <DownloadModal
          ebook={{ id: ebook.id, title: ebook.title, price: ebook.price }}
          onClose={() => setModalOpen(false)}
        />
      )}

      {apercuOpen && (
        <ApercuModal
          ebook={ebook}
          pdfUrl={aperçuUrl || `/api/pdf-preview/${ebook.id}`}
          onClose={() => setApercuOpen(false)}
        />
      )}
    </>
  );
}
