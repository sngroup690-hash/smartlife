"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Nunito } from "next/font/google";
import {
  BookOpen, FileText, Files, Eye, ChevronRight,
  ChevronDown, ChevronUp, Play, X, Lock, Copy, Check, Headphones, Share2, MessageCircle,
} from "lucide-react";
import { EnteteBoutique, PiedBoutique, CompteARebours } from "./ElementsBoutique";
import DownloadModal from "@/components/DownloadModal";
import { ebooks, type Ebook } from "@/lib/data";
import { useCatalogueStore } from "@/lib/catalogue-store";
import { useCurrencyStore } from "@/lib/currency-store";
import { pixelViewContent } from "@/lib/pixel-events";
import { useUserStore } from "@/lib/user-store";
import ReviewSection from "@/components/ReviewSection";
import { DescriptionRenderer } from "@/components/DescriptionRenderer";
import RareteBlock from "@/components/RareteBlock";
import { PaymentBadges } from "@/components/PaymentBadges";
import dynamic from "next/dynamic";
import VideoPlayer from "@/components/VideoPlayer";
import CrossSellWidget from "@/components/CrossSellWidget";

const nunito = Nunito({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

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

// Couleurs par défaut = celles de Chariow ; chacune se change guide par guide dans l'admin.
const CHARIOW = { bouton: "#008f51", texteBouton: "#ffffff", prix: "#e30026" };
const BANDEAU_SMART = "linear-gradient(135deg, #1b7a1b 0%, #27A827 55%, #1f8f1f 100%)";

function ajouterImageSiAbsente(html: string, image?: string): string {
  if (!html || !image || /<img\s/i.test(html)) return html;
  const img = `<p><img src="${image}" alt="" /></p>`;
  const i = html.search(/<\/h[12]>/i);
  return i < 0 ? img + html : html.slice(0, i + 5) + img + html.slice(i + 5);
}

function FaqBoutique({ faq }: { faq: { q: string; a: string }[] }) {
  const [ouvert, setOuvert] = useState<number | null>(null);
  return (
    <section className="mt-12 -mx-4 px-4 py-8 bg-[#f3fbf6] border-y border-[#008f51]/10 lg:mx-0 lg:rounded-2xl lg:border">
      <p className="text-[12px] font-bold uppercase tracking-wider text-[#008f51]">Vous vous demandez…</p>
      <h2 className="mt-1 text-[22px] font-extrabold text-black mb-5">Questions fréquentes</h2>
      <div className="flex flex-col gap-2.5">
        {faq.map((f, i) => {
          const actif = ouvert === i;
          return (
            <div key={i} className={`rounded-xl bg-white border transition-colors ${actif ? "border-[#008f51]/40 shadow-sm" : "border-[#e8e9eb]"}`}>
              <button onClick={() => setOuvert(actif ? null : i)} className="w-full flex items-center justify-between gap-3 p-4 text-left">
                <span className="text-[15px] font-bold text-black leading-snug">{f.q}</span>
                <span className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[18px] font-bold transition-transform duration-200 ${actif ? "rotate-45 bg-[#008f51]" : "bg-[#f2f3f5] text-black"}`}
                  style={actif ? { color: "#fff" } : {}}>+</span>
              </button>
              {actif && <p className="px-4 pb-4 -mt-1 text-[14px] leading-relaxed text-[#393c41]">{f.a}</p>}
            </div>
          );
        })}
      </div>
      <p className="mt-5 text-center text-[13px] text-[#393c41]">
        Une autre question ?{" "}
        <a href="https://wa.me/237694176642" target="_blank" rel="noopener noreferrer" className="font-bold text-[#128C4A] underline underline-offset-2">Écrivez-nous sur WhatsApp</a>
      </p>
    </section>
  );
}

export default function EbookLandingPage({ initial = null }: { initial?: Ebook | null }) {
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
  const [apercuOuvert, setApercuOuvert] = useState(false);
  const [apercuVerifie, setApercuVerifie] = useState(false);
  const [commentAcheter, setCommentAcheter] = useState(false);

  const [progression, setProgression] = useState(0);
  const [packs, setPacks] = useState<{ slug?: string; nom: string; prix: number; originalValeur: number; items?: { id: string }[] }[]>([]);

  useEffect(() => {
    fetch("/api/packs").then((r) => r.json()).then((d) => setPacks(d.packs ?? [])).catch(() => {});
  }, []);

  // Barre d'achat toujours visible sur téléphone : on réserve sa place en bas.
  useEffect(() => {
    if (checkoutModalOpen || window.innerWidth >= 1024) return;
    const avant = document.body.style.paddingBottom;
    document.body.style.paddingBottom = "80px";
    return () => { document.body.style.paddingBottom = avant; };
  }, [checkoutModalOpen]);

  // Repère de lecture : la ligne verte avance au fur et à mesure qu'on descend.
  useEffect(() => {
    let attente = 0;
    const maj = () => {
      attente = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgression(max > 0 ? Math.min(1, window.scrollY / max) : 0);
    };
    const surDefilement = () => { if (!attente) attente = requestAnimationFrame(maj); };
    window.addEventListener("scroll", surDefilement, { passive: true });
    return () => { window.removeEventListener("scroll", surDefilement); cancelAnimationFrame(attente); };
  }, []);

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
  const dynamicEbooks: Ebook[] = serverData
    ? (serverData.ebooks ?? [])
    : storeEbooks.filter((x) => x.actif).map(({ actif: _a, createdAt: _c, ...x }) => x as Ebook);
  const staticMatch = ebooks.find((x) => x.slug === slug);
  const dynamicMatch = dynamicEbooks.find((x) => x.slug === slug);
  // Les données lues par le serveur s'affichent tout de suite ; celles du navigateur les remplacent dès qu'elles arrivent.
  const ebook: Ebook | undefined = serverLoading && initial
    ? initial
    : staticMatch
      ? { ...staticMatch, ...(overrides[staticMatch.id] || {}) }
      : dynamicMatch ?? undefined;

  useEffect(() => {
    if (ebook) pixelViewContent(ebook.title, ebook.id, ebook.price);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ebook?.id]);

  const urlApercu = ebook ? (ebook.pdfPreviewUrl || `/api/pdf-preview/${ebook.id}`) : "";
  useEffect(() => {
    if (!urlApercu) return;
    if (!urlApercu.startsWith("/")) return;
    fetch(urlApercu, { method: "HEAD" }).then((r) => setApercuVerifie(r.ok)).catch(() => setApercuVerifie(false));
  }, [urlApercu]);

  if (!ebook && serverLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#008f51] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!ebook) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500">Ebook introuvable.</p>
        <Link href="/ebooks" className="text-[#008f51] underline text-sm">Voir tous les ebooks</Link>
      </div>
    );
  }

  const e = ebook as Ebook & {
    priceColor?: string; ctaBgColor?: string; ctaTextColor?: string; bandeauColor?: string;
    communityBgColor?: string; communityTextColor?: string; whatsappUrl?: string; audioUrl?: string;
    commentAcheterUrl?: string; promoEndDate?: string; promoCyclique?: boolean; promoDureeHeures?: number;
    placesRestantesBloquees?: number; vendusAffiche?: number; ventes?: number;
    avisClients?: { nom: string; note: number; texte: string }[]; reviewCardSize?: "small" | "medium" | "large";
  };
  const rawIndex = parseInt(ebook.id.replace("eb-", "")) - 1;
  const colorIndex = isNaN(rawIndex) ? ebook.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0) : rawIndex;
  const coverColor = COVER_COLORS[Math.abs(colorIndex) % COVER_COLORS.length];

  const couleurs = {
    bandeau: e.bandeauColor || BANDEAU_SMART,
    bouton: e.ctaBgColor || CHARIOW.bouton,
    texteBouton: e.ctaTextColor || CHARIOW.texteBouton,
    prix: e.priceColor && e.priceColor.toLowerCase() !== "#ffffff" ? e.priceColor : CHARIOW.prix,
  };
  // Texte et animation du bouton : choisis dans l'admin, sinon variés d'un guide à l'autre (toujours le même pour un guide donné).
  const graine = ebook.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const textes = ebook.originalPrice
    ? ["Télécharger maintenant", "Profiter de l'offre", "Acheter maintenant"]
    : ["Télécharger maintenant", "Acheter maintenant"];
  const ctaLabel = ebook.ctaLabel || textes[graine % textes.length];
  const animations = ["cta-clignote", "cta-respire"];
  const ctaAnim = ebook.ctaAnimation === "none"
    ? ""
    : ebook.ctaAnimation && ebook.ctaAnimation !== "pulse"
      ? `cta-${ebook.ctaAnimation}`
      : animations[Math.floor(graine / textes.length) % animations.length];
  const shareUrl = `${SITE_EBOOK}/ebooks/${ebook.slug}`;
  const shareText = encodeURIComponent(`Découvrez cet ebook : ${ebook.title} — ${shareUrl}`);
  const dejaAchete = ebooksAchetes.includes(ebook.id);
  const imagePrincipale = ebook.banner || ebook.cover;
  const ventes = e.vendusAffiche ?? e.ventes ?? 0;
  const apercuDispo = apercuVerifie || !urlApercu.startsWith("/");
  const openCheckout = () => setCheckoutModalOpen(true);
  const voirApercu = () => {
    setApercuOuvert(true);
    document.getElementById("fichiers")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const prix = (grand?: boolean) => (
    <div className="flex items-baseline justify-center gap-3 flex-wrap">
      {ebook.originalPrice && (
        <span className={`${grand ? "text-[16px]" : "text-[15px]"} font-medium text-[#a9aeb5] line-through`}>{convert(ebook.originalPrice)}</span>
      )}
      <span className={`${grand ? "text-[25px]" : "text-[22px]"} font-bold`} style={{ color: couleurs.prix }}>{convert(ebook.price)}</span>
      {ebook.originalPrice && ebook.originalPrice > ebook.price && (
        <span className="self-center px-2 py-0.5 rounded-md bg-[#fde8eb] text-[12px] font-bold text-[#e30026]">
          -{Math.round((1 - ebook.price / ebook.originalPrice) * 100)} %
        </span>
      )}
    </div>
  );
  const boutonAchat = (refBouton?: boolean) => (
    <button
      onClick={openCheckout}
      data-principal={refBouton ? "1" : undefined}
      className={`w-full h-11 rounded-xl text-[14px] font-semibold active:scale-[0.99] ${ctaAnim}`}
      style={{ backgroundColor: couleurs.bouton, color: couleurs.texteBouton }}
    >
      {ctaLabel}
    </button>
  );

  // Le pack le plus avantageux qui contient ce guide (économie réelle calculée sur les prix).
  const packDuGuide = packs
    .filter((p) => p.slug && p.items?.some((i) => i.id === ebook.id) && p.originalValeur > p.prix)
    .sort((a, b) => (b.originalValeur - b.prix) - (a.originalValeur - a.prix))[0];
  const offrePack = packDuGuide && (
    <Link href={`/packs/${packDuGuide.slug}`}
      className="block rounded-xl border-2 border-dashed border-[#E8B800] bg-[#fffbeb] p-3.5 active:scale-[0.99] transition-transform">
      <p className="text-[12px] font-bold uppercase tracking-wide text-[#b45309]">📦 Meilleure affaire</p>
      <p className="mt-1 text-[14px] font-bold text-black leading-snug">
        Économise {convert(packDuGuide.originalValeur - packDuGuide.prix)} avec le {packDuGuide.nom}
      </p>
      <p className="mt-0.5 text-[13px] text-[#393c41]">
        Ce guide + {(packDuGuide.items?.length ?? 1) - 1} autres pour <strong className="text-[#e30026]">{convert(packDuGuide.prix)}</strong>{" "}
        <span className="line-through text-[#a9aeb5]">{convert(packDuGuide.originalValeur)}</span>
      </p>
      <p className="mt-2 text-[13px] font-semibold text-[#008f51]">Voir le pack →</p>
    </Link>
  );

  const carteAchat = (
    <div className="flex flex-col gap-6">
      {prix(true)}
      {ventes > 0 && (
        <p className="-mt-3 text-center text-[13px] text-[#717882]">
          🔥 <strong className="text-[#0e0f10]">{ventes.toLocaleString("fr-FR")}</strong> {ventes === 1 ? "vente" : "ventes"}
        </p>
      )}
      {e.promoEndDate && <CompteARebours fin={e.promoEndDate} cyclique={e.promoCyclique} dureeHeures={e.promoDureeHeures} />}
      {e.placesRestantesBloquees != null && <RareteBlock vendus={e.vendusAffiche ?? 0} restantes={e.placesRestantesBloquees} />}
      <div className="flex flex-col items-center gap-4">
        {boutonAchat(true)}
        {apercuDispo && (
          <button onClick={voirApercu} className="text-[13px] font-semibold underline underline-offset-4" style={{ color: couleurs.bouton }}>
            Découvrir un aperçu (1)
          </button>
        )}
      </div>
      {offrePack}
      <div className="flex flex-col items-center gap-2">
        <p className="text-[13px] text-[#717882]">Moyens de paiement disponibles</p>
        <PaymentBadges size="xs" className="justify-center" />
      </div>
      <div className="flex flex-col items-center">
        <button onClick={() => setCommentAcheter((v) => !v)} className="inline-flex items-center gap-2 text-[14px] text-[#20252b] underline underline-offset-2">
          <span className="w-5 h-5 rounded-full border border-[#20252b] text-[11px] flex items-center justify-center no-underline">?</span>
          Comment acheter ?
        </button>
        {commentAcheter && <div className="w-full mt-3"><CommentAcheterMini url={e.commentAcheterUrl} /></div>}
      </div>
      {e.whatsappUrl && (
        dejaAchete ? (
          <a href={e.whatsappUrl} target="_blank" rel="noopener noreferrer"
            className="w-full h-11 rounded-xl border border-[#25D366] text-[#128C4A] text-[14px] font-semibold flex items-center justify-center gap-2">
            {WA_SVG_EB} Rejoindre la communauté WhatsApp
          </a>
        ) : (
          <div className="flex flex-col gap-2">
            <button type="button" onClick={() => { setWhatsappMsg(true); setTimeout(() => setWhatsappMsg(false), 4000); }}
              className="w-full h-11 rounded-xl border border-[#d4d6d7] text-[#717882] text-[14px] font-semibold flex items-center justify-center gap-2">
              <Lock size={14} /> Communauté WhatsApp réservée aux clients
            </button>
            {whatsappMsg && <p className="text-[12px] text-center text-[#b45309]">Cet accès se débloque automatiquement après votre paiement.</p>}
          </div>
        )
      )}
      {e.audioUrl && (dejaAchete
        ? <AudioPlayerBlock url={e.audioUrl} title={ebook.title} />
        : <p className="text-center text-[12px] text-[#717882] flex items-center justify-center gap-1.5"><Headphones size={13} /> Version audio incluse, débloquée après l&apos;achat</p>)}
    </div>
  );

  return (
    <div className={`${nunito.className} min-h-screen bg-white text-black`}>
      <EnteteBoutique />

      {/* Bandeau du titre */}
      <div style={{ background: couleurs.bandeau }}>
        <div className="max-w-6xl mx-auto px-4 pt-16 pb-12 lg:pt-20 lg:pb-20 lg:pr-[456px]">
          <h1 className="text-[20px] lg:text-[22px] leading-7 font-bold uppercase !text-white">{ebook.title}</h1>
          <div className="mt-3 flex items-center gap-2 text-[13px]" style={{ color: "#ffffff" }}>
            <Files size={20} strokeWidth={1.6} color="#ffffff" /> <span style={{ color: "#ffffff" }}>Fichier</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4">
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-12">
          {/* Carte d'achat : ordinateur = à droite, fixe, par-dessus le bandeau */}
          <aside className="hidden lg:block lg:col-start-2 lg:row-start-1 self-start sticky top-[89px] -mt-[200px] mb-10 z-10">
            <div className="bg-white rounded-xl border border-[#e8e9eb] shadow-[0_8px_30px_rgba(0,0,0,0.08)] overflow-hidden">
              {imagePrincipale && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imagePrincipale} alt={ebook.title} className="w-full h-auto block" />
              )}
              <div className="p-6">{carteAchat}</div>
            </div>
          </aside>

          <main className="lg:col-start-1 lg:row-start-1 min-w-0 pb-10">
            {/* Téléphone : image puis bloc d'achat, comme Chariow */}
            <div className="lg:hidden pt-6">
              {imagePrincipale ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imagePrincipale} alt={ebook.title} className="w-full h-auto rounded-xl block" />
              ) : (
                <div className="rounded-xl overflow-hidden aspect-[4/3]"><CoverDisplay ebook={ebook} coverColor={coverColor} /></div>
              )}
              <div className="pt-8 pb-2">{carteAchat}</div>
            </div>

            {/* Tout ce que l'acheteur reçoit */}
            <section className="mt-10 lg:mt-12 rounded-2xl border border-[#008f51]/20 bg-[#f3fbf6] p-5">
              <h2 className="text-[19px] font-extrabold text-black">🎁 Tout ce que tu reçois aujourd&apos;hui</h2>
              <ul className="mt-4 flex flex-col gap-3">
                {[
                  { t: `Le guide complet en PDF${ebook.pages ? ` (${ebook.pages} pages)` : ""}`, d: "Téléchargé tout de suite après le paiement, et envoyé par e-mail." },
                  { t: "L'accès à vie", d: "Le guide reste dans ton espace : tu le relis quand tu veux, sur téléphone ou ordinateur." },
                  { t: "Le groupe WhatsApp privé", d: "Échange avec d'autres entrepreneurs qui appliquent le même guide." },
                  { t: "L'assistance sur WhatsApp", d: "Une question ou un souci de téléchargement ? On te répond." },
                ].map((b) => (
                  <li key={b.t} className="flex gap-3">
                    <span className="mt-0.5 w-6 h-6 rounded-full bg-[#008f51] flex items-center justify-center flex-shrink-0 text-[13px] font-bold" style={{ color: "#fff" }}>✓</span>
                    <span>
                      <span className="block text-[15px] font-bold text-black">{b.t}</span>
                      <span className="block text-[13px] text-[#393c41] leading-snug">{b.d}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-5 rounded-xl bg-white border border-[#e8e9eb] p-3 flex items-center justify-between gap-3">
                <div className="leading-tight">
                  {ebook.originalPrice && <p className="text-[12px] text-[#a9aeb5] line-through">{convert(ebook.originalPrice)}</p>}
                  <p className="text-[20px] font-extrabold" style={{ color: couleurs.prix }}>{convert(ebook.price)}</p>
                </div>
                <div className="w-1/2">{boutonAchat()}</div>
              </div>
            </section>

            {/* Fichiers */}
            <section id="fichiers" className="scroll-mt-24 mt-10 lg:mt-12">
              <h2 className="text-[20px] font-medium text-black mb-4">Fichiers (1)</h2>
              {apercuDispo && (
                <div className="flex items-center gap-2 px-4 py-3 mb-3 rounded-xl border border-[#fde68a] bg-[#fffbeb] text-[12px] text-[#b45309]">
                  <Eye size={15} className="flex-shrink-0" /> Prévisualisez gratuitement les premières pages avant l&apos;achat
                </div>
              )}
              <div className="rounded-xl border border-[#d4d6d7] p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#f2f3f5] flex flex-col items-center justify-center flex-shrink-0">
                    <FileText size={16} className="text-black" />
                    <span className="text-[8px] font-bold text-black leading-none">PDF</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[16px] text-black truncate">{ebook.title}</p>
                    <p className="text-[12px] text-[#717882]">{ebook.pages ? `${ebook.pages} pages` : "PDF"}</p>
                  </div>
                </div>
                {apercuDispo && (
                  <button onClick={() => setApercuOuvert((v) => !v)}
                    className="mt-4 w-full h-11 rounded-xl border border-[#d4d6d7] text-[14px] font-semibold text-black flex items-center justify-center gap-1.5 hover:bg-[#f7f7f8]">
                    {apercuOuvert ? "Fermer l'aperçu" : "Aperçu"} {apercuOuvert ? <ChevronUp size={16} /> : <ChevronRight size={16} />}
                  </button>
                )}
              </div>
              {apercuOuvert && apercuDispo && (
                <div className="mt-3 rounded-xl overflow-hidden border border-[#d4d6d7]">
                  <PdfViewer url={urlApercu} />
                  <div className="p-4 flex flex-col items-center gap-3 bg-white border-t border-[#e8e9eb]">
                    <p className="text-[13px] text-[#717882] text-center">La suite du guide est disponible après l&apos;achat</p>
                    {boutonAchat()}
                  </div>
                </div>
              )}
            </section>

            {ebook.videoUrl && <VideoPlayer url={ebook.videoUrl} title="Vidéo de présentation" className="mt-10" />}

            {/* Description */}
            {(!ebook.sections || ebook.sections.length === 0) && ebook.description && (
              <section className="mt-10 description-boutique">
                <DescriptionRenderer html={ajouterImageSiAbsente(ebook.description, imagePrincipale)} className="" />
              </section>
            )}
            {ebook.sections && ebook.sections.length > 0 && (
              <section className="mt-10">
                <div className="flex gap-1 overflow-x-auto border-b border-[#e8e9eb] mb-6">
                  {[{ titre: "Description" }, ...ebook.sections].map((s, i) => (
                    <button key={i} onClick={() => setActiveSection(i - 1)}
                      className={`px-4 py-3 text-[14px] whitespace-nowrap border-b-2 -mb-px ${activeSection === i - 1 ? "font-semibold text-black" : "border-transparent text-[#717882]"}`}
                      style={activeSection === i - 1 ? { borderColor: couleurs.bouton } : {}}>
                      {s.titre || `Section ${i}`}
                    </button>
                  ))}
                </div>
                <div className="description-boutique">
                  <DescriptionRenderer html={activeSection === -1 ? ajouterImageSiAbsente(ebook.description, imagePrincipale) : (ebook.sections[activeSection]?.contenu || "")} className="" />
                </div>
              </section>
            )}

            <ReviewSection
              productId={ebook.id}
              productType="ebook"
              userId={currentUser?.id ?? null}
              userName={currentUser ? `${currentUser.firstName} ${currentUser.lastName}`.trim() : ""}
              isPurchased={dejaAchete}
              staticReviews={e.avisClients ?? []}
              cardSize={e.reviewCardSize}
              wrapperClassName="mt-10"
            />

            {ebook.faq && ebook.faq.length > 0 && <FaqBoutique faq={ebook.faq} />}

            {/* Partager / Contact, comme Chariow */}
            <div className="mt-10 rounded-xl border border-[#d4d6d7] p-2 flex items-center justify-around gap-1 text-[14px] text-[#20252b]">
              <a href={`https://api.whatsapp.com/send?text=${shareText}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1 hover:opacity-70">
                <Share2 size={15} /> Partager
              </a>
              <span className="w-px h-5 bg-[#d4d6d7]" />
              <button onClick={() => { navigator.clipboard.writeText(shareUrl); setCopiedShare(true); setTimeout(() => setCopiedShare(false), 2000); }} className="flex items-center gap-1.5 px-3 py-1 hover:opacity-70">
                {copiedShare ? <Check size={15} /> : <Copy size={15} />} {copiedShare ? "Copié" : "Copier"}
              </button>
              <span className="w-px h-5 bg-[#d4d6d7]" />
              <Link href="/contact" className="flex items-center gap-1.5 px-3 py-1 hover:opacity-70">
                <MessageCircle size={15} /> Contact
              </Link>
            </div>
          </main>
        </div>
      </div>

      <CrossSellWidget productId={ebook.id} productType="ebook" variant="light" compact />
      <PiedBoutique />

      {/* Barre d'achat en bas sur téléphone : fondue dans la page, avec le repère de lecture */}
      {!checkoutModalOpen && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-t border-[#e8e9eb]"
          style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
          <div className="h-[3px] bg-[#f2f3f5]">
            <div className="h-full transition-[width] duration-150" style={{ width: `${Math.round(progression * 100)}%`, backgroundColor: couleurs.bouton }} />
          </div>
          <div className="px-4 py-2.5 flex items-center gap-3">
            <div className="flex flex-col leading-tight flex-shrink-0">
              {ebook.originalPrice && <span className="text-[11px] text-[#a9aeb5] line-through">{convert(ebook.originalPrice)}</span>}
              <span className="text-[17px] font-bold" style={{ color: couleurs.prix }}>{convert(ebook.price)}</span>
            </div>
            <div className="flex-1 min-w-0">{boutonAchat()}</div>
          </div>
        </div>
      )}

      {checkoutModalOpen && (
        <DownloadModal
          ebook={{ id: ebook.id, title: ebook.title, price: ebook.price, cover: ebook.cover || ebook.banner, originalPrice: ebook.originalPrice, ventes }}
          onClose={() => setCheckoutModalOpen(false)}
        />
      )}
    </div>
  );
}
