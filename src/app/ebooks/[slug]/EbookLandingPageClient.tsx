"use client";

import { useState, useEffect } from "react";
import { useParams, notFound } from "next/navigation";
import Link from "next/link";
import {
  Star, BookOpen, ArrowLeft, ShieldCheck, Mail,
  Download, CheckCircle, Clock, Tag, Zap,
  ChevronDown, ChevronUp, Play, X, Lock, Copy, Check, Headphones, Share2,
} from "lucide-react";
import DownloadModal from "@/components/DownloadModal";
import { ebooks, type Ebook } from "@/lib/data";
import { useCatalogueStore } from "@/lib/catalogue-store";
import { useCurrencyStore } from "@/lib/currency-store";
import { pixelViewContent } from "@/lib/pixel-events";
import { useUserStore } from "@/lib/user-store";
import ReviewSection from "@/components/ReviewSection";
import { DescriptionRenderer } from "@/components/DescriptionRenderer";
import CountdownTimer from "@/components/CountdownTimer";
import RareteBlock from "@/components/RareteBlock";
import { PaymentBadges } from "@/components/PaymentBadges";
import dynamic from "next/dynamic";
import VideoPlayer from "@/components/VideoPlayer";
import CrossSellWidget from "@/components/CrossSellWidget";

const PdfViewer = dynamic(
  () => import("@/components/PdfViewer").then((m) => m.PdfViewer),
  { ssr: false, loading: () => <div className="flex items-center justify-center py-16 bg-gray-50 rounded-xl" style={{ minHeight: 320 }}><div className="w-6 h-6 border-2 border-[#E8B800] border-t-transparent rounded-full animate-spin" /></div> }
);

function toVideoEmbed(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") return `https://www.youtube.com/embed${u.pathname}?rel=0`;
    if (u.hostname.includes("youtube.com")) {
      if (u.pathname === "/watch") { const v = u.searchParams.get("v"); return v ? `https://www.youtube.com/embed/${v}?rel=0` : null; }
      if (u.pathname.startsWith("/embed/")) return url;
    }
    const vm = url.match(/vimeo\.com\/(\d+)/);
    if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
    return null;
  } catch { return null; }
}

function FAQAccordion({ faq }: { faq: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="mb-16">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Questions fréquentes</h2>
      <div className="space-y-3">
        {faq.map((item, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full flex items-center justify-between px-6 py-4 text-left gap-4 hover:bg-gray-50 transition-colors"
            >
              <span className="text-gray-800 font-medium text-sm">{item.q}</span>
              {open === i ? <ChevronUp size={16} className="text-[#E8B800] flex-shrink-0" /> : <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />}
            </button>
            {open === i && (
              <div className="px-6 pb-4 text-gray-600 text-sm leading-relaxed border-t border-gray-100">{item.a}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function CommentAcheterMini({ url }: { url?: string }) {
  const [open, setOpen] = useState(false);
  const hasUrl = !!url;
  const isNative = hasUrl && (/\.(mp4|webm|mov|ogg)(\?|#|$)/i.test(url!) || url!.startsWith("/how-to-buy/"));
  const embed = hasUrl && !isNative ? toVideoEmbed(url!) : null;
  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl border-2 font-semibold text-sm transition-all ${
          open
            ? "border-[#E8B800] bg-[#E8B800]/10 text-[#E8B800]"
            : "border-gray-300 bg-white hover:border-[#E8B800] hover:bg-[#E8B800]/5 text-gray-700 hover:text-[#E8B800]"
        }`}
      >
        <Play size={15} className={open ? "fill-[#E8B800] text-[#E8B800]" : ""} />
        {open ? "Fermer" : "Comment acheter sur ce site ?"}
        {!open && <span className="text-xs text-gray-400 ml-1">{hasUrl ? "(vidéo)" : ""}</span>}
      </button>
      {open && (
        <div className="mt-2 rounded-xl overflow-hidden border border-gray-200 shadow-md">
          {!hasUrl ? (
            <div className="bg-gray-50 p-5 text-center">
              <p className="text-gray-700 text-sm font-medium mb-1">Comment acheter sur ce site ?</p>
              <p className="text-gray-500 text-xs mb-3">Choisissez un produit, cliquez sur le bouton d&apos;achat, renseignez vos coordonnées et payez par Mobile Money ou carte bancaire. Vous recevrez votre contenu par email immédiatement.</p>
              <button onClick={() => setOpen(false)} className="text-xs text-gray-400 hover:text-gray-600 underline"><X size={11} className="inline mr-1" />Fermer</button>
            </div>
          ) : (
            <>
              <div className="flex justify-end px-2 pt-1.5 bg-gray-100">
                <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-gray-900 transition-colors"><X size={13} /></button>
              </div>
              {isNative ? (
                <video src={url} controls autoPlay playsInline className="w-full" style={{ maxHeight: 300 }} />
              ) : embed ? (
                <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
                  <iframe src={embed} className="absolute inset-0 w-full h-full" allow="autoplay; fullscreen" allowFullScreen />
                </div>
              ) : (
                <a href={url} target="_blank" rel="noopener noreferrer" className="block p-4 text-center bg-gray-900 text-[#E8B800] text-sm hover:underline">
                  ▶ Voir la vidéo explicative
                </a>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function CoverDisplay({ ebook, coverColor }: { ebook: Ebook; coverColor: string }) {
  const layout = ebook.coverLayout || "full";
  const objFit = ebook.coverObjectFit || "cover";
  const objPos = ebook.coverObjectPosition || "center";
  const imgStyle = { objectFit: objFit, objectPosition: objPos } as React.CSSProperties;
  const badges = (
    <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
      {ebook.bestseller && <span className="px-3 py-1 bg-yellow-500/90 text-yellow-900 text-xs font-bold rounded-full">Bestseller</span>}
      {ebook.new && <span className="px-3 py-1 bg-emerald-500/90 text-emerald-900 text-xs font-bold rounded-full">Nouveau</span>}
    </div>
  );

  if (!ebook.cover) {
    return (
      <div className={`w-full h-full bg-gradient-to-br ${coverColor} flex flex-col items-center justify-center p-8`}>
        <BookOpen size={64} className="text-white/20 mb-4" />
        <p className="text-white font-bold text-center text-lg leading-snug">{ebook.title}</p>
      </div>
    );
  }

  if (layout === "overlay") {
    return (
      <div className="relative w-full h-full">
        <img src={ebook.cover} alt={ebook.title} className="w-full h-full" style={imgStyle} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/10" />
        {badges}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <p className="text-white font-black text-lg leading-snug drop-shadow-lg">{ebook.title}</p>
          <p className="text-[#E8B800] text-xs mt-1 font-semibold tracking-wide">SMART LIFE</p>
        </div>
      </div>
    );
  }

  if (layout === "split") {
    return (
      <div className="relative w-full h-full flex flex-col">
        <div className="h-[60%] overflow-hidden">
          <img src={ebook.cover} alt={ebook.title} className="w-full h-full" style={imgStyle} />
        </div>
        <div className={`h-[40%] bg-gradient-to-b ${coverColor} flex flex-col justify-center px-5 py-4`}>
          <p className="text-[#E8B800] text-xs font-bold tracking-widest uppercase mb-1">SMART LIFE</p>
          <p className="text-white font-black text-sm leading-snug">{ebook.title}</p>
        </div>
        {badges}
      </div>
    );
  }

  if (layout === "frame") {
    return (
      <div className={`relative w-full h-full bg-gradient-to-br ${coverColor} flex flex-col items-center justify-center p-3`}>
        <div className="border-2 border-[#E8B800]/60 rounded-xl overflow-hidden w-full flex-1">
          <img src={ebook.cover} alt={ebook.title} className="w-full h-full" style={imgStyle} />
        </div>
        <p className="text-white font-bold text-center text-xs mt-2 px-1 leading-snug line-clamp-2">{ebook.title}</p>
        {badges}
      </div>
    );
  }

  // "full" (default)
  return (
    <div className="relative w-full h-full">
      <img src={ebook.cover} alt={ebook.title} className="w-full h-full" style={imgStyle} />
      {badges}
    </div>
  );
}

function toPdfEmbed(url: string): string {
  // Google Drive share link → preview embed
  const gdriveMatch = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (gdriveMatch) return `https://drive.google.com/file/d/${gdriveMatch[1]}/preview`;
  // Dropbox → raw
  if (url.includes("dropbox.com")) return url.replace("dl=0", "raw=1").replace("dl=1", "raw=1");
  // Direct .pdf → Google Docs viewer
  if (url.match(/\.pdf($|\?)/i)) return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
  return url;
}

function PdfPreviewBlock({ url, ctaLabel, price, onBuy, ctaAnimClass }: { url: string; ctaLabel: string; price: string; onBuy: () => void; ctaAnimClass: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-16">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-6 py-4 bg-gray-50 hover:bg-yellow-50 border border-gray-200 hover:border-[#E8B800]/40 rounded-2xl transition-all"
      >
        <div className="flex items-center gap-3">
          <BookOpen size={20} className="text-[#E8B800]" />
          <div className="text-left">
            <p className="font-bold text-gray-900 text-sm">Aperçu gratuit</p>
            <p className="text-gray-500 text-xs">Lisez les 3 premières pages avant d&apos;acheter</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[#E8B800] text-sm font-semibold">
          {open ? "Fermer" : "Voir l'aperçu"}
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {open && (
        <div className="mt-3 rounded-2xl overflow-hidden border border-gray-200 shadow-md">
          <div className="flex items-center justify-between px-4 py-2 bg-gray-100 border-b border-gray-200">
            <span className="text-gray-600 text-xs font-medium">Aperçu — 3 premières pages</span>
            <span className="px-2 py-0.5 bg-[#E8B800]/20 text-[#ca8a04] text-xs font-bold rounded-full">Gratuit</span>
          </div>
          <div className="relative">
            <PdfViewer url={url} />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white/90 to-transparent pt-24 pb-6 px-6 flex flex-col items-center gap-3">
              <p className="text-gray-600 text-sm text-center font-medium">La suite du document est disponible après achat</p>
              <button
                onClick={onBuy}
                className={`px-8 py-3.5 bg-gradient-to-r from-[#E8B800] to-[#27A827] text-black font-bold rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-[#E8B800]/20 ${ctaAnimClass}`}
              >
                <Download size={16} /> {ctaLabel} — {price}
              </button>
              <PaymentBadges size="xs" className="justify-end" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


function AudioPlayerBlock({ url, title }: { url: string; title: string }) {
  const [open, setOpen] = useState(false);
  const isDirectAudio = /\.(mp3|m4a|ogg|aac|wav|flac)(\?|#|$)/i.test(url) || url.startsWith("/audio/");
  const isSoundCloud = url.includes("soundcloud.com");
  const scEmbed = isSoundCloud
    ? `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23E8B800&auto_play=false&hide_related=false&show_comments=false&show_user=true&show_reposts=false&show_teaser=false`
    : null;
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl border-2 font-semibold text-sm transition-all ${
          open
            ? "border-[#E8B800] bg-[#E8B800]/10 text-[#E8B800]"
            : "border-gray-300 bg-white hover:border-[#E8B800] hover:bg-[#E8B800]/5 text-gray-700 hover:text-[#E8B800]"
        }`}
      >
        <Headphones size={15} />
        {open ? "Fermer l'audio" : "Écouter la version audio"}
      </button>
      {open && (
        <div className="mt-2 rounded-xl border border-[#E8B800]/30 bg-amber-50/60 p-4">
          <p className="text-gray-700 text-xs font-semibold mb-3 flex items-center gap-1.5">
            <Headphones size={12} className="text-[#E8B800]" /> {title}
          </p>
          {isDirectAudio ? (
            <audio src={url} controls className="w-full" />
          ) : scEmbed ? (
            <iframe width="100%" height="120" scrolling="no" frameBorder="no" allow="autoplay" src={scEmbed} className="rounded-lg" />
          ) : (
            <a href={url} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 bg-[#E8B800] hover:bg-[#ca9c00] text-black text-sm font-bold rounded-xl transition-colors">
              <Headphones size={15} /> Ouvrir la version audio ↗
            </a>
          )}
        </div>
      )}
    </div>
  );
}

const SITE_EBOOK = "https://smartlifecm.com";
const WA_SVG_EB = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);
const FB_SVG_EB = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const COVER_COLORS = [
  "from-[#1A1200] to-[#2D2000]",
  "from-blue-900 to-indigo-800",
  "from-emerald-900 to-teal-800",
  "from-pink-900 to-rose-800",
  "from-orange-900 to-amber-800",
  "from-cyan-900 to-sky-800",
];

type ServerEbookData = {
  ebooks: Ebook[];
  overrides: Record<string, Partial<Ebook>>;
  actif: Record<string, boolean>;
};

const inputCls =
  "w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-[#E8B800] transition-colors";

const BENEFITS = [
  { icon: Download, label: "PDF téléchargeable", desc: "Lisez sur tous vos appareils" },
  { icon: Mail, label: "Envoyé par email", desc: "Reçu immédiatement après paiement" },
  { icon: Zap, label: "Accès instantané", desc: "Disponible dès la confirmation" },
  { icon: ShieldCheck, label: "Paiement sécurisé", desc: "Mobile Money, Visa, PayPal" },
];

export default function EbookLandingPage() {
  const params = useParams();
  const { ebooks: storeEbooks, ebookOverrides, staticEbookActif } = useCatalogueStore();
  const { ebooksAchetes, currentUser } = useUserStore();
  const convert = useCurrencyStore((s) => s.convert);

  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(-1);
  const [serverData, setServerData] = useState<ServerEbookData | null>(null);
  const [serverLoading, setServerLoading] = useState(true);
  const [whatsappMsg, setWhatsappMsg] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  useEffect(() => {
    const s = (params?.slug as string) ?? "";
    fetch(`/api/ebooks?slug=${encodeURIComponent(s)}`)
      .then((r) => r.json())
      .then((d) => setServerData(d))
      .catch(() => {})
      .finally(() => setServerLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const slug = params?.slug as string;

  const overrides = serverData?.overrides ?? ebookOverrides;
  const actif = serverData?.actif ?? staticEbookActif;
  const dynamicEbooks: Ebook[] = serverData
    ? (serverData.ebooks ?? [])
    : storeEbooks.filter((e) => e.actif).map(({ actif: _, createdAt: __, ...e }) => e as Ebook);

  const staticMatch = ebooks.find((e) => e.slug === slug);
  const dynamicMatch = dynamicEbooks.find((e) => e.slug === slug);
  // La désactivation masque l'ebook du catalogue mais ne brise pas son URL permalink.
  const ebook: Ebook | undefined = staticMatch
    ? { ...staticMatch, ...(overrides[staticMatch.id] || {}) }
    : dynamicMatch ?? undefined;

  // Pixel tracking — must be before conditional returns to respect Rules of Hooks
  useEffect(() => {
    if (ebook) pixelViewContent(ebook.title, ebook.id, ebook.price);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ebook?.id]);

  if (!ebook && serverLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#E8B800] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!ebook) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500">Ebook introuvable.</p>
        <Link href="/ebooks" className="text-[#E8B800] underline text-sm">
          Voir tous les ebooks
        </Link>
      </div>
    );
  }

  const rawIndex = parseInt(ebook.id.replace("eb-", "")) - 1;
  const colorIndex = isNaN(rawIndex) ? ebook.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0) : rawIndex;
  const coverColor = COVER_COLORS[Math.abs(colorIndex) % COVER_COLORS.length];
  const discount = ebook.originalPrice
    ? Math.round((1 - ebook.price / ebook.originalPrice) * 100)
    : null;

  const ctaAnimClass = ebook.ctaAnimation && ebook.ctaAnimation !== "none"
    ? `cta-${ebook.ctaAnimation}`
    : "animate-pulse hover:animate-none";

  const openCheckout = () => setCheckoutModalOpen(true);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Top bar */}
      <div className="border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/ebooks"
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors text-sm"
          >
            <ArrowLeft size={16} />
            Tous les ebooks
          </Link>
          <span className="text-[#E8B800] font-bold text-sm tracking-widest uppercase">
            SMART LIFE
          </span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 items-start mb-10 md:mb-16">
          {/* Cover */}
          <div className="flex flex-col items-center gap-4">
            <div className="w-full rounded-2xl overflow-hidden relative shadow-2xl" style={{ aspectRatio: "720/260" }}>
              {ebook.banner
                ? /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={ebook.banner} alt={ebook.title} className="w-full h-full object-cover" />
                : <CoverDisplay ebook={ebook} coverColor={coverColor} />
              }
              {discount && (
                <div className="absolute top-4 right-4 z-10">
                  <span className="px-3 py-1 bg-red-500/90 text-white text-xs font-bold rounded-full">-{discount}%</span>
                </div>
              )}
            </div>

            {/* Stats under cover */}
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-1.5 text-gray-500">
                <BookOpen size={14} />
                <span>{ebook.pages} pages</span>
              </div>
              <div className="flex items-center gap-1.5 text-yellow-400">
                <Star size={14} className="fill-yellow-400" />
                <span className="font-semibold">{ebook.rating}</span>
                <span className="text-gray-500">({ebook.reviews} avis)</span>
              </div>
            </div>
          </div>

          {/* Info + CTA */}
          <div className="flex flex-col gap-6">
            {/* Category */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#E8B800]/10 border border-[#E8B800]/30 rounded-full text-[#E8B800] text-xs font-medium">
                <Tag size={11} />
                {ebook.category}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold leading-tight text-gray-900">
              {ebook.title}
            </h1>

            {/* Rareté */}
            {(ebook as Ebook & { placesRestantesBloquees?: number }).placesRestantesBloquees != null && (
              <RareteBlock
                vendus={(ebook as Ebook & { vendusAffiche?: number }).vendusAffiche ?? 0}
                restantes={(ebook as Ebook & { placesRestantesBloquees?: number }).placesRestantesBloquees!}
              />
            )}

            {/* Stars */}
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    className={
                      i < Math.floor(ebook.rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-700"
                    }
                  />
                ))}
              </div>
              <span className="text-yellow-400 font-semibold">{ebook.rating}</span>
              <span className="text-gray-500 text-sm">— {ebook.reviews} clients satisfaits</span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span
                className="text-3xl font-extrabold"
                style={{ color: (ebook as Ebook & { priceColor?: string }).priceColor || "#ffffff" }}
              >
                {convert(ebook.price)}
              </span>
              {ebook.originalPrice && (
                <>
                  <span className="text-gray-500 text-lg line-through">
                    {convert(ebook.originalPrice)}
                  </span>
                  <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-sm font-bold rounded-lg">
                    -{discount}%
                  </span>
                </>
              )}
            </div>

            {/* Décompte promo */}
            <CountdownTimer
              endDate={(ebook as Ebook & { promoEndDate?: string }).promoEndDate}
              cyclique={(ebook as Ebook & { promoCyclique?: boolean }).promoCyclique}
              dureeHeures={(ebook as Ebook & { promoDureeHeures?: number }).promoDureeHeures}
            />

            {/* CTA */}
            <div className="flex flex-col gap-3">
                <button
                  onClick={openCheckout}
                  className={`w-full py-4 font-bold rounded-xl transition-all text-base flex items-center justify-center gap-2 shadow-lg active:scale-95 ${!(ebook as Ebook & { ctaBgColor?: string }).ctaBgColor ? "bg-gradient-to-r from-[#E8B800] to-[#27A827] hover:from-[#27A827] hover:to-[#E8B800] text-black shadow-[#E8B800]/20" : ""} ${ctaAnimClass}`}
                  style={(ebook as Ebook & { ctaBgColor?: string }).ctaBgColor ? { backgroundColor: (ebook as Ebook & { ctaBgColor?: string }).ctaBgColor, color: (ebook as Ebook & { ctaTextColor?: string }).ctaTextColor || "#ffffff" } : {}}
                >
                  <Download size={18} />
                  {ebook.ctaLabel || "Acheter maintenant"} — {convert(ebook.price)}
                </button>
                {/* Bloc partage */}
                {(() => {
                  const shareUrl = `${SITE_EBOOK}/ebooks/${ebook.slug}`;
                  const shareText = encodeURIComponent(`Découvrez cet ebook : ${ebook.title} — ${shareUrl}`);
                  return (
                    <div className="border border-gray-200 rounded-2xl p-4 space-y-2.5">
                      <p className="text-gray-700 font-bold text-xs flex items-center gap-1.5">
                        <Share2 size={12} className="text-[#E8B800]" /> Partager cet ebook
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <a href={`https://api.whatsapp.com/send?text=${shareText}`} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-2 bg-[#25D366] hover:bg-[#20b858] text-white text-xs font-bold rounded-xl transition-colors">
                          {WA_SVG_EB} WhatsApp
                        </a>
                        <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-2 bg-[#1877F2] hover:bg-[#1565d8] text-white text-xs font-bold rounded-xl transition-colors">
                          {FB_SVG_EB} Facebook
                        </a>
                        <button onClick={() => { navigator.clipboard.writeText(shareUrl); setCopiedShare(true); setTimeout(() => setCopiedShare(false), 2000); }}
                          className={`flex items-center gap-1.5 px-3 py-2 border text-xs font-bold rounded-xl transition-colors ${copiedShare ? "bg-emerald-50 border-emerald-300 text-emerald-700" : "bg-gray-50 border-gray-200 text-gray-700 hover:border-[#E8B800] hover:text-[#E8B800]"}`}>
                          {copiedShare ? <Check size={12} /> : <Copy size={12} />}
                          {copiedShare ? "Lien copié !" : "Copier"}
                        </button>
                      </div>
                    </div>
                  );
                })()}
                <div className="flex justify-end">
                  <PaymentBadges size="xs" />
                </div>
                {(ebook as Ebook & { whatsappUrl?: string }).whatsappUrl && (
                  ebooksAchetes.includes(ebook.id) ? (
                    <a
                      href={(ebook as Ebook & { whatsappUrl?: string }).whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`w-full py-3.5 font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-sm ${!(ebook as Ebook & { communityBgColor?: string }).communityBgColor ? "bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/40 text-[#25D366]" : "border"}`}
                      style={(ebook as Ebook & { communityBgColor?: string }).communityBgColor ? { backgroundColor: (ebook as Ebook & { communityBgColor?: string }).communityBgColor!, color: (ebook as Ebook & { communityTextColor?: string }).communityTextColor || "#ffffff", borderColor: (ebook as Ebook & { communityBgColor?: string }).communityBgColor! } : {}}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                      Rejoindre la communauté WhatsApp
                    </a>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setWhatsappMsg(true);
                          setTimeout(() => setWhatsappMsg(false), 4000);
                          openCheckout();
                        }}
                        className={`w-full py-3.5 font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-sm ${!(ebook as Ebook & { communityBgColor?: string }).communityBgColor ? "bg-gray-100 hover:bg-gray-50 border border-gray-300 text-gray-500" : "border opacity-75"}`}
                        style={(ebook as Ebook & { communityBgColor?: string }).communityBgColor ? { backgroundColor: (ebook as Ebook & { communityBgColor?: string }).communityBgColor!, color: (ebook as Ebook & { communityTextColor?: string }).communityTextColor || "#ffffff", borderColor: (ebook as Ebook & { communityBgColor?: string }).communityBgColor! } : {}}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="opacity-40"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        Rejoindre la communauté WhatsApp
                        <span className="ml-auto flex items-center gap-1 px-2 py-0.5 bg-gray-200 text-gray-500 text-xs rounded-full font-medium">
                          <Lock size={10} /> Réservé aux clients
                        </span>
                      </button>
                      {whatsappMsg && (
                        <p className="text-xs text-center text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
                          🔒 Cet accès est débloqué automatiquement après la validation de votre paiement.
                        </p>
                      )}
                    </div>
                  )
                )}
                {(ebook as Ebook & { audioUrl?: string }).audioUrl && (
                  ebooksAchetes.includes(ebook.id) ? (
                    <AudioPlayerBlock url={(ebook as Ebook & { audioUrl?: string }).audioUrl!} title={ebook.title} />
                  ) : (
                    <div className="mt-2 space-y-2">
                      <button disabled
                        className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl border-2 border-gray-300 bg-white text-gray-400 text-sm font-semibold cursor-not-allowed opacity-75">
                        <Headphones size={15} />
                        Écouter la version audio
                        <span className="ml-auto flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full font-medium">
                          <Lock size={10} /> Réservé aux clients
                        </span>
                      </button>
                      <p className="text-xs text-center text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
                        🔒 L&apos;audio complet est débloqué automatiquement après la validation de votre paiement.
                      </p>
                    </div>
                  )
                )}
                <CommentAcheterMini url={(ebook as Ebook & { commentAcheterUrl?: string }).commentAcheterUrl} />
                <p className="text-gray-500 text-xs text-center flex items-center justify-center gap-1.5">
                  <ShieldCheck size={12} />
                  Paiement 100% sécurisé · Reçu par email après paiement
                </p>
              </div>

          </div>
        </div>

        {/* Vidéo de présentation — juste après le hero, avant les avis */}
        {ebook.videoUrl && (
          <VideoPlayer
            url={ebook.videoUrl}
            title="Vidéo de présentation"
            className="mb-10"
          />
        )}

        {/* Avis clients — position 1 : juste après le bloc CTA / Comment acheter */}
        <ReviewSection
          productId={ebook.id}
          productType="ebook"
          userId={null}
          userName=""
          isPurchased={false}
          staticReviews={(ebook as Ebook & { avisClients?: { nom: string; note: number; texte: string }[] }).avisClients ?? []}
          cardSize={(ebook as Ebook & { reviewCardSize?: "small" | "medium" | "large" }).reviewCardSize}
          wrapperClassName="py-10 border-t border-b border-gray-200 mb-10 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 bg-gray-50"
        />

        {/* Description pleine largeur — ebooks sans sections */}
        {(!ebook.sections || ebook.sections.length === 0) && ebook.description && (
          <div className="mb-12">
            <DescriptionRenderer
              html={ebook.description}
              className="text-gray-700 leading-relaxed text-base
                [&_img]:rounded-xl [&_img]:my-4
                [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1
                [&_b]:text-gray-900 [&_strong]:text-gray-900 [&_i]:italic [&_em]:italic
                [&_h2]:text-gray-900 [&_h2]:font-bold [&_h2]:text-xl [&_h2]:mt-6 [&_h2]:mb-3
                [&_h3]:text-[#ca8a04] [&_h3]:font-bold [&_h3]:text-lg [&_h3]:mt-4 [&_h3]:mb-2"
            />
          </div>
        )}

        {/* Sections/Onglets supplémentaires */}
        {ebook.sections && ebook.sections.length > 0 && (
          <div className="mb-16">
            <div className="flex gap-1 overflow-x-auto border-b border-gray-200 mb-8">
              <button
                onClick={() => setActiveSection(-1)}
                className={`px-5 py-3 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${activeSection === -1 ? "border-[#E8B800] text-[#E8B800]" : "border-transparent text-gray-500 hover:text-gray-700"}`}
              >
                Description
              </button>
              {ebook.sections.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setActiveSection(i)}
                  className={`px-5 py-3 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${activeSection === i ? "border-[#E8B800] text-[#E8B800]" : "border-transparent text-gray-500 hover:text-gray-700"}`}
                >
                  {s.titre || `Section ${i + 1}`}
                </button>
              ))}
            </div>
            {/* CTA dans l'onglet Description */}
            {activeSection === -1 && (
              <div className="mb-8">
                <button
                  onClick={openCheckout}
                  className={`w-full py-4 font-bold rounded-xl transition-all text-base flex items-center justify-center gap-2 shadow-lg active:scale-95 ${!(ebook as Ebook & { ctaBgColor?: string }).ctaBgColor ? "bg-gradient-to-r from-[#E8B800] to-[#27A827] hover:from-[#27A827] hover:to-[#E8B800] text-black shadow-[#E8B800]/20" : ""} ${ctaAnimClass}`}
                  style={(ebook as Ebook & { ctaBgColor?: string }).ctaBgColor ? { backgroundColor: (ebook as Ebook & { ctaBgColor?: string }).ctaBgColor, color: (ebook as Ebook & { ctaTextColor?: string }).ctaTextColor || "#ffffff" } : {}}
                >
                  <Download size={18} />
                  {ebook.ctaLabel || "Acheter maintenant"} — {convert(ebook.price)}
                </button>
                <PaymentBadges size="xs" className="justify-end mt-2" />
              </div>
            )}

            <DescriptionRenderer
              html={activeSection === -1 ? ebook.description : (ebook.sections[activeSection]?.contenu || "")}
              className="text-gray-700 leading-relaxed text-base
                [&_img]:rounded-xl [&_img]:my-4
                [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1 [&_li]:mb-1
                [&_b]:text-gray-900 [&_strong]:text-gray-900 [&_i]:italic
                [&_h3]:text-[#ca8a04] [&_h3]:font-bold [&_h3]:text-lg [&_h3]:mt-4 [&_h3]:mb-2"
            />
          </div>
        )}

        {/* Avis clients — position 2 : juste après la description */}
        <ReviewSection
          productId={ebook.id}
          productType="ebook"
          userId={currentUser?.id ?? null}
          userName={currentUser ? `${currentUser.firstName} ${currentUser.lastName}`.trim() : ""}
          isPurchased={ebooksAchetes.includes(ebook.id)}
          staticReviews={(ebook as Ebook & { avisClients?: { nom: string; note: number; texte: string }[] }).avisClients ?? []}
          cardSize={(ebook as Ebook & { reviewCardSize?: "small" | "medium" | "large" }).reviewCardSize}
          wrapperClassName="py-12 border-t border-b border-gray-200 mb-16 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 bg-gray-50"
        />

        {/* Aperçu PDF — affiché si pdfPreviewUrl défini, sinon fallback API locale */}
        <PdfPreviewBlock
          url={ebook.pdfPreviewUrl || `/api/pdf-preview/${ebook.id}`}
          ctaLabel={ebook.ctaLabel || "Acheter maintenant"}
          price={convert(ebook.price)}
          onBuy={openCheckout}
          ctaAnimClass={ctaAnimClass}
        />

        {/* FAQ */}
        {ebook.faq && ebook.faq.length > 0 && (
          <FAQAccordion faq={ebook.faq} />
        )}

        {/* Bottom prix + CTA */}
        <div className="mt-16 p-8 bg-gray-50 border border-gray-200 rounded-2xl flex flex-col items-center gap-5">
            {/* Prix */}
            <div className="text-center">
              <div className="flex items-baseline justify-center gap-3">
                <span className="text-4xl font-extrabold text-gray-900">{convert(ebook.price)}</span>
                {ebook.originalPrice && (
                  <span className="text-gray-500 text-xl line-through">{convert(ebook.originalPrice)}</span>
                )}
              </div>
              {discount && (
                <span className="inline-block mt-2 px-3 py-1 bg-red-500/20 text-red-400 text-sm font-bold rounded-lg">
                  Économisez {discount}%
                </span>
              )}
            </div>

            {/* Bouton */}
            <button
              onClick={openCheckout}
              className={`px-10 py-4 bg-gradient-to-r from-[#E8B800] to-[#27A827] hover:from-[#27A827] hover:to-[#E8B800] text-black font-bold rounded-xl transition-all text-base inline-flex items-center gap-2 shadow-lg shadow-[#E8B800]/20 active:scale-95 ${ctaAnimClass}`}
            >
              <Download size={18} />
              {ebook.ctaLabel || "Obtenir cet ebook"}
            </button>

            {(() => {
              const shareUrl = `${SITE_EBOOK}/ebooks/${ebook.slug}`;
              const shareText = encodeURIComponent(`Découvrez cet ebook : ${ebook.title} — ${shareUrl}`);
              return (
                <div className="border border-gray-200 rounded-2xl p-4 space-y-2.5">
                  <p className="text-gray-700 font-bold text-xs flex items-center gap-1.5">
                    <Share2 size={12} className="text-[#E8B800]" /> Partager cet ebook
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <a href={`https://api.whatsapp.com/send?text=${shareText}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-2 bg-[#25D366] hover:bg-[#20b858] text-white text-xs font-bold rounded-xl transition-colors">
                      {WA_SVG_EB} WhatsApp
                    </a>
                    <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-2 bg-[#1877F2] hover:bg-[#1565d8] text-white text-xs font-bold rounded-xl transition-colors">
                      {FB_SVG_EB} Facebook
                    </a>
                    <button onClick={() => { navigator.clipboard.writeText(shareUrl); setCopiedShare(true); setTimeout(() => setCopiedShare(false), 2000); }}
                      className={`flex items-center gap-1.5 px-3 py-2 border text-xs font-bold rounded-xl transition-colors ${copiedShare ? "bg-emerald-50 border-emerald-300 text-emerald-700" : "bg-gray-50 border-gray-200 text-gray-700 hover:border-[#E8B800] hover:text-[#E8B800]"}`}>
                      {copiedShare ? <Check size={12} /> : <Copy size={12} />}
                      {copiedShare ? "Lien copié !" : "Copier"}
                    </button>
                  </div>
                </div>
              );
            })()}
            <div className="flex justify-end">
              <PaymentBadges size="xs" />
            </div>
            <div className="flex items-center gap-4 text-gray-600 text-xs">
              <span className="flex items-center gap-1"><ShieldCheck size={12} /> Paiement sécurisé</span>
              <span className="flex items-center gap-1"><Clock size={12} /> Livraison immédiate</span>
              <span className="flex items-center gap-1"><Mail size={12} /> Reçu par email</span>
            </div>
          </div>
      </div>
      {ebook && <CrossSellWidget productId={ebook.id} productType="ebook" variant="light" />}

      {/* Spacer so content isn't hidden behind the sticky bar */}
      <div className="h-20" />

      {/* ── Sticky CTA Bar ─────────────────────────────────────────────────── */}
      {!checkoutModalOpen && (
        <div
          className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-[0_-4px_24px_rgba(0,0,0,0.10)]"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
            {/* Prix + titre */}
            <div className="min-w-0">
              <p className="text-xs text-gray-400 font-medium truncate leading-tight hidden sm:block">
                {ebook.title}
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-extrabold text-gray-900 leading-tight">
                  {convert(ebook.price)}
                </span>
                {ebook.originalPrice && (
                  <span className="text-sm text-gray-400 line-through leading-tight">
                    {convert(ebook.originalPrice)}
                  </span>
                )}
                {discount && (
                  <span className="text-xs font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded-md">
                    -{discount}%
                  </span>
                )}
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={openCheckout}
              className={`flex-shrink-0 flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-[#E8B800] to-[#27A827] hover:from-[#27A827] hover:to-[#E8B800] text-black font-bold rounded-xl text-sm transition-all active:scale-95 shadow-lg shadow-[#E8B800]/20 ${ctaAnimClass}`}
            >
              <Download size={16} />
              <span className="hidden xs:inline">{ebook.ctaLabel || "Télécharger maintenant"}</span>
              <span className="xs:hidden">Acheter</span>
            </button>
          </div>
        </div>
      )}

      {checkoutModalOpen && (
        <DownloadModal
          ebook={{ id: ebook.id, title: ebook.title, price: ebook.price }}
          onClose={() => setCheckoutModalOpen(false)}
        />
      )}
    </div>
  );
}
