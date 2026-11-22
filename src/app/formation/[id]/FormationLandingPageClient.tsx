"use client";

import { useState, useEffect } from "react";
import { useParams, notFound } from "next/navigation";
import Link from "next/link";
import {
  Play, Clock, BookOpen, Star, Users, Award, ArrowLeft,
  Monitor, MapPin, Layers, ShieldCheck, CheckCircle, Tag,
  ChevronDown, ChevronUp, X, Copy, Check, Share2,
} from "lucide-react";
import { FORMATIONS, type Formation } from "@/lib/formations-data";
import { useCatalogueStore } from "@/lib/catalogue-store";
import { useCurrencyStore } from "@/lib/currency-store";
import { pixelViewContent } from "@/lib/pixel-events";
import { useUserStore } from "@/lib/user-store";
import ReviewSection from "@/components/ReviewSection";
import { DescriptionRenderer } from "@/components/DescriptionRenderer";
import CountdownTimer from "@/components/CountdownTimer";
import RareteBlock from "@/components/RareteBlock";
import { PaymentBadges } from "@/components/PaymentBadges";
import VideoPlayer from "@/components/VideoPlayer";
import CrossSellWidget from "@/components/CrossSellWidget";
import DownloadModal from "@/components/DownloadModal";


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

function toYouTubeEmbed(url: string): string | null {
  return toVideoEmbed(url);
}

function ModeBadge({ mode }: { mode: Formation["mode"] }) {
  if (mode === "online")
    return (
      <span className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 border border-blue-200 text-blue-700 text-sm rounded-full font-medium">
        <Monitor size={13} /> Formation en ligne
      </span>
    );
  if (mode === "presentiel")
    return (
      <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 border border-emerald-200 text-emerald-700 text-sm rounded-full font-medium">
        <MapPin size={13} /> Formation présentiel
      </span>
    );
  return (
    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-[#E8B800]/10 border border-[#E8B800]/30 text-[#E8B800] text-sm rounded-full font-medium">
      <Layers size={13} /> En ligne + Présentiel
    </span>
  );
}

function FAQAccordion({ faq }: { faq: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="mb-16">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Questions fréquentes</h2>
      <div className="space-y-3">
        {faq.map((item, i) => (
          <div key={i} className="bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden">
            <button onClick={() => setOpen(open === i ? null : i)} className="w-full flex items-center justify-between px-6 py-4 text-left gap-4 hover:bg-gray-100 transition-colors">
              <span className="text-gray-900 font-medium text-sm">{item.q}</span>
              {open === i ? <ChevronUp size={16} className="text-[#E8B800] flex-shrink-0" /> : <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />}
            </button>
            {open === i && <div className="px-6 pb-4 text-gray-600 text-sm leading-relaxed border-t border-gray-100">{item.a}</div>}
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
              <p className="text-gray-500 text-xs mb-3">Choisissez une formation, cliquez sur le bouton d&apos;achat, renseignez vos coordonnées et payez par Mobile Money ou carte bancaire. Vous recevez l&apos;accès immédiatement après confirmation.</p>
              <button onClick={() => setOpen(false)} className="text-xs text-gray-400 hover:text-gray-600 underline"><X size={11} className="inline mr-1" />Fermer</button>
            </div>
          ) : (
            <>
              <div className="flex justify-end px-2 pt-1.5 bg-gray-900">
                <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-white transition-colors"><X size={13} /></button>
              </div>
              {isNative ? (
                <video src={url} controls autoPlay playsInline className="w-full" style={{ maxHeight: 300 }} />
              ) : embed ? (
                <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
                  <iframe src={embed} className="absolute inset-0 w-full h-full" allow="autoplay; fullscreen" allowFullScreen />
                </div>
              ) : (
                <a href={url} target="_blank" rel="noopener noreferrer" className="block p-4 text-center bg-black text-[#E8B800] text-sm hover:underline">
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


function WhatsAppGateModal({ onClose, onBuy }: {
  onClose: () => void;
  onBuy: () => void;
  formation: { id: string; titre: string; prix: number };
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-2xl p-8 shadow-2xl">
        <button onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all">
          <X size={18} />
        </button>
        <div className="text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[#25D366]/10 border border-[#25D366]/30 flex items-center justify-center mb-5">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          </div>
          <h2 className="text-gray-900 text-xl font-bold mb-3">Accès réservé aux membres</h2>
          <p className="text-gray-600 text-sm leading-relaxed mb-6">
            L&apos;accès à la communauté WhatsApp est exclusivement réservé aux membres.
            Vous devez d&apos;abord effectuer votre achat pour débloquer votre accès !
          </p>
          <button
            onClick={() => { onClose(); onBuy(); }}
            className="w-full py-3.5 bg-gradient-to-r from-[#E8B800] to-[#27A827] hover:from-[#27A827] hover:to-[#E8B800] text-black font-bold rounded-xl transition-all flex items-center justify-center gap-2"
          >
            Acheter maintenant →
          </button>
          <button onClick={onClose} className="mt-3 text-gray-400 text-xs hover:text-gray-600 transition-colors">
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

const SITE_FM = "https://smartlifecm.com";
const WA_SVG_FM = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);
const FB_SVG_FM = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

type ServerFormationData = {
  formations: Formation[];
  overrides: Record<string, Partial<Formation>>;
  actif: Record<string, boolean>;
};

const NIVEAU_COLORS: Record<string, string> = {
  "Débutant": "bg-emerald-100 text-emerald-700 border-emerald-200",
  "Intermédiaire": "bg-blue-100 text-blue-700 border-blue-200",
  "Avancé": "bg-green-100 text-green-700 border-green-200",
};

export default function FormationDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const { formations: storeFormations, formationOverrides, staticFormationActif } = useCatalogueStore();
  const { formationsAchetees, currentUser } = useUserStore();
  const convert = useCurrencyStore((s) => s.convert);

  const [activeSection, setActiveSection] = useState(-1);
  const [serverData, setServerData] = useState<ServerFormationData | null>(null);
  const [serverLoading, setServerLoading] = useState(true);
  const [showWhatsAppGate, setShowWhatsAppGate] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [quickBuyOpen, setQuickBuyOpen] = useState(false);

  useEffect(() => {
    fetch("/api/formations")
      .then((r) => r.json())
      .then((d) => setServerData(d))
      .catch(() => {})
      .finally(() => setServerLoading(false));
  }, []);

  const overrides = serverData?.overrides ?? formationOverrides;
  const actif = serverData?.actif ?? staticFormationActif;
  const dynamicFormations: Formation[] = serverData
    ? (serverData.formations ?? [])
    : storeFormations.filter((f) => f.actif).map(({ actif: _, createdAt: __, ...f }) => f as Formation);

  const allFormations: Formation[] = [
    ...FORMATIONS
      .filter((f) => actif[f.id] !== false)
      .map((f) => ({ ...f, ...(overrides[f.id] || {}) } as Formation)),
    ...dynamicFormations,
  ];

  const formation = allFormations.find((f) => f.id === id);

  // Pixel tracking — must be before conditional returns to respect Rules of Hooks
  useEffect(() => {
    if (formation) pixelViewContent(formation.titre, formation.id, formation.prix);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formation?.id]);

  if (!formation && serverLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#E8B800] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!formation) return notFound();

  const discount = formation.prixOriginal
    ? Math.round((1 - formation.prix / formation.prixOriginal) * 100)
    : null;

  const isPurchased = formationsAchetees.includes(formation.id);
  const hasOnline = formation.mode === "online" || formation.mode === "both";
  const hasPresentiel = formation.mode === "presentiel" || formation.mode === "both";

  const ctaAnimClass = (formation as { ctaAnimation?: string }).ctaAnimation && (formation as { ctaAnimation?: string }).ctaAnimation !== "none"
    ? `cta-${(formation as { ctaAnimation?: string }).ctaAnimation}`
    : "animate-pulse hover:animate-none";

  const reviewCardSize = (formation as { reviewCardSize?: "small" | "medium" | "large" }).reviewCardSize ?? "medium";

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Top bar */}
      <div className="border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <Link href="/formation" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors text-sm">
            <ArrowLeft size={16} /> Toutes les formations
          </Link>
          <div className="flex items-center gap-3">
            {(() => {
              const shareUrl = `${SITE_FM}/formation/${formation.id}`;
              const shareText = encodeURIComponent(`Découvrez cette formation : ${formation.titre} — ${shareUrl}`);
              return (
                <div className="flex items-center gap-1.5">
                  <a href={`https://api.whatsapp.com/send?text=${shareText}`} target="_blank" rel="noopener noreferrer"
                    className="p-2 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] rounded-lg transition-colors" title="Partager sur WhatsApp">
                    {WA_SVG_FM}
                  </a>
                  <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer"
                    className="p-2 bg-[#1877F2]/10 hover:bg-[#1877F2]/20 text-[#1877F2] rounded-lg transition-colors" title="Partager sur Facebook">
                    {FB_SVG_FM}
                  </a>
                  <button onClick={() => { navigator.clipboard.writeText(shareUrl); setCopiedShare(true); setTimeout(() => setCopiedShare(false), 2000); }}
                    className={`p-2 rounded-lg transition-colors ${copiedShare ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 hover:bg-gray-200 text-gray-600"}`} title="Copier le lien">
                    {copiedShare ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              );
            })()}
            <span className="text-[#E8B800] font-bold text-sm tracking-widest uppercase">SMART LIFE</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 items-start mb-10 md:mb-16">

          {/* Visuel */}
          <div className="flex flex-col items-center gap-4">
            <div className="w-full max-w-sm aspect-video rounded-2xl bg-gradient-to-br from-[#1A1200] to-[#2D1A00] relative shadow-2xl overflow-hidden">
              {formation.videoPreview ? (
                (() => {
                  const embedUrl = toYouTubeEmbed(formation.videoPreview);
                  return embedUrl ? (
                    <iframe
                      src={embedUrl}
                      title={formation.titre}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <video
                      src={formation.videoPreview}
                      controls
                      className="w-full h-full object-cover"
                      preload="metadata"
                    />
                  );
                })()
              ) : formation.cover ? (
                <img src={formation.cover} alt={formation.titre} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-20 h-20 rounded-2xl bg-[#E8B800]/20 flex items-center justify-center">
                    <Play size={40} className="text-[#E8B800] ml-1" />
                  </div>
                </div>
              )}
              {!formation.videoPreview && formation.badge && (
                <div className="absolute top-4 left-4">
                  {formation.badge === "Bestseller" && (
                    <span className="px-3 py-1 bg-yellow-500/90 text-yellow-900 text-xs font-bold rounded-full">Bestseller</span>
                  )}
                  {formation.badge === "Nouveau" && (
                    <span className="px-3 py-1 bg-emerald-500/90 text-emerald-900 text-xs font-bold rounded-full">Nouveau</span>
                  )}
                  {formation.badge === "Premium" && (
                    <span className="px-3 py-1 bg-[#E8B800] text-black text-xs font-bold rounded-full">Premium</span>
                  )}
                </div>
              )}
              {!formation.videoPreview && discount && (
                <div className="absolute top-4 right-4">
                  <span className="px-3 py-1 bg-red-500/90 text-white text-xs font-bold rounded-full">-{discount}%</span>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 text-sm flex-wrap justify-center">
              <div className="flex items-center gap-1.5 text-gray-600">
                <Clock size={14} /> <span>{formation.duree}</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-600">
                <BookOpen size={14} /> <span>{formation.modules} modules</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-600">
                <Users size={14} /> <span>{formation.apprenants} apprenants</span>
              </div>
              <div className="flex items-center gap-1.5 text-yellow-500">
                <Star size={14} className="fill-yellow-400" />
                <span className="font-semibold">{formation.note}</span>
              </div>
            </div>
          </div>

          {/* Info + CTA */}
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#E8B800]/10 border border-[#E8B800]/30 rounded-full text-[#E8B800] text-xs font-medium">
                <Tag size={11} /> {formation.categorie}
              </span>
              <span className={`px-3 py-1.5 rounded-full text-xs font-medium border ${NIVEAU_COLORS[formation.niveau]}`}>
                {formation.niveau}
              </span>
              <ModeBadge mode={formation.mode} />
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">{formation.titre}</h1>

            {/* Rareté */}
            {(formation as typeof formation & { placesRestantesBloquees?: number }).placesRestantesBloquees != null && (
              <RareteBlock
                vendus={(formation as typeof formation & { vendusAffiche?: number }).vendusAffiche ?? formation.apprenants}
                restantes={(formation as typeof formation & { placesRestantesBloquees?: number }).placesRestantesBloquees!}
              />
            )}

            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} className={i < Math.floor(formation.note) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} />
                ))}
              </div>
              <span className="text-yellow-500 font-semibold">{formation.note}</span>
              <span className="text-gray-500 text-sm">— {formation.apprenants.toLocaleString("fr-FR")} apprenants</span>
            </div>

            <p className="text-gray-500 text-sm">par <span className="text-gray-700 font-medium">{formation.instructeur}</span></p>

            {/* Prix */}
            <div className="flex items-baseline gap-3">
              <span
                className="text-2xl sm:text-3xl font-extrabold"
                style={{ color: formation.priceColor || "#111827" }}
              >
                {convert(formation.prix)}
              </span>
              {formation.prixOriginal && (
                <>
                  <span className="text-gray-400 text-lg line-through">{convert(formation.prixOriginal)}</span>
                  <span className="px-2 py-0.5 bg-red-100 text-red-600 text-sm font-bold rounded-lg">-{discount}%</span>
                </>
              )}
            </div>

            {/* Décompte promo */}
            <CountdownTimer
              endDate={formation.promoEndDate}
              cyclique={(formation as typeof formation & { promoCyclique?: boolean }).promoCyclique}
              dureeHeures={(formation as typeof formation & { promoDureeHeures?: number }).promoDureeHeures}
            />

            {/* Boutons */}
            {isPurchased && hasOnline ? (
              <div className="flex flex-col gap-3">
                <Link
                  href={`/formation/${formation.id}/watch`}
                  className="w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <Play size={18} /> Accéder à la formation
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {hasOnline && (
                  <button
                    onClick={() => setQuickBuyOpen(true)}
                    className={`w-full py-4 font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-base ${
                      !formation.ctaBgColor
                        ? `bg-gradient-to-r from-[#E8B800] to-[#27A827] hover:from-[#27A827] hover:to-[#E8B800] text-black shadow-lg shadow-[#E8B800]/20 active:scale-95 ${ctaAnimClass}`
                        : `active:scale-95 ${ctaAnimClass}`
                    }`}
                    style={formation.ctaBgColor ? { backgroundColor: formation.ctaBgColor, color: formation.ctaTextColor || "#ffffff" } : {}}
                  >
                    <Monitor size={18} />
                    {`${(formation as { ctaLabel?: string }).ctaLabel || "Acheter"} (En ligne) — ${convert(formation.prix)}`}
                  </button>
                )}
                {hasPresentiel && (
                  <Link
                    href="/contact"
                    className="w-full py-4 border border-gray-300 hover:border-[#E8B800]/60 text-gray-600 hover:text-[#E8B800] font-medium rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    <MapPin size={18} /> S&apos;inscrire en présentiel
                  </Link>
                )}
              </div>
            )}

            {(formation as { whatsappUrl?: string }).whatsappUrl && (
              isPurchased ? (
                <a
                  href={(formation as { whatsappUrl?: string }).whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/40 text-[#25D366] font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  Rejoindre la communauté WhatsApp
                </a>
              ) : (
                <>
                  <button
                    onClick={() => setShowWhatsAppGate(true)}
                    className="w-full py-3.5 bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-700 font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    Rejoindre la communauté WhatsApp 🔒
                  </button>
                  {showWhatsAppGate && (
                    <WhatsAppGateModal
                      onClose={() => setShowWhatsAppGate(false)}
                      onBuy={() => setQuickBuyOpen(true)}
                      formation={formation}
                    />
                  )}
                </>
              )
            )}

            <CommentAcheterMini url={(formation as { commentAcheterUrl?: string }).commentAcheterUrl} />

            {/* Bloc partage complet */}
            {(() => {
              const shareUrl = `${SITE_FM}/formation/${formation.id}`;
              const shareText = encodeURIComponent(`Découvrez cette formation : ${formation.titre} — ${shareUrl}`);
              return (
                <div className="border border-gray-200 rounded-2xl p-4 space-y-2.5">
                  <p className="text-gray-700 font-bold text-xs flex items-center gap-1.5">
                    <Share2 size={12} className="text-[#E8B800]" /> Partager cette formation
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <a href={`https://api.whatsapp.com/send?text=${shareText}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-2 bg-[#25D366] hover:bg-[#20b858] text-white text-xs font-bold rounded-xl transition-colors">
                      {WA_SVG_FM} WhatsApp
                    </a>
                    <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-2 bg-[#1877F2] hover:bg-[#1565d8] text-white text-xs font-bold rounded-xl transition-colors">
                      {FB_SVG_FM} Facebook
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
              <PaymentBadges size="sm" />
            </div>
            <p className="text-gray-500 text-xs text-center flex items-center justify-center gap-1.5">
              <ShieldCheck size={12} /> Paiement 100% sécurisé · Accès immédiat après confirmation
            </p>

            <div className="border-t border-gray-200" />

            {/* Description complète */}
            <DescriptionRenderer
              html={formation.description}
              className="text-gray-700 leading-relaxed text-base
                [&_img]:rounded-xl [&_img]:my-4
                [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1
                [&_b]:text-gray-900 [&_strong]:text-gray-900 [&_i]:italic [&_em]:italic"
            />

          </div>
        </div>

        {/* Vidéo de présentation — juste après le hero */}
        {formation.videoUrl && (
          <VideoPlayer
            url={formation.videoUrl}
            title="Vidéo de présentation"
            className="mb-10"
          />
        )}

        {/* Sections/Onglets supplémentaires */}
        {formation.sections && formation.sections.length > 0 && (
          <div className="mb-16">
            <div className="flex gap-1 overflow-x-auto border-b border-gray-200 mb-8">
              <button
                onClick={() => setActiveSection(-1)}
                className={`px-5 py-3 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${activeSection === -1 ? "border-[#E8B800] text-[#E8B800]" : "border-transparent text-gray-500 hover:text-gray-700"}`}
              >
                Description
              </button>
              {formation.sections.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setActiveSection(i)}
                  className={`px-5 py-3 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${activeSection === i ? "border-[#E8B800] text-[#E8B800]" : "border-transparent text-gray-500 hover:text-gray-700"}`}
                >
                  {s.titre || `Section ${i + 1}`}
                </button>
              ))}
            </div>
            <DescriptionRenderer
              html={activeSection === -1 ? formation.description : (formation.sections[activeSection]?.contenu || "")}
              className="text-gray-700 leading-relaxed text-base
                [&_img]:rounded-xl [&_img]:my-4
                [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1 [&_li]:mb-1
                [&_b]:text-gray-900 [&_strong]:text-gray-900 [&_i]:italic
                [&_h3]:text-[#E8B800] [&_h3]:font-bold [&_h3]:text-lg [&_h3]:mt-4 [&_h3]:mb-2"
            />
          </div>
        )}

        {/* ── AVIS DE NOS CLIENTS ───────────────────────────────────────────── */}
        <div className="py-12 border-t border-b border-gray-200 mb-16 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 bg-gray-50/50">
          <ReviewSection
            productId={formation.id}
            productType="formation"
            userId={currentUser?.id ?? null}
            userName={currentUser ? `${currentUser.firstName ?? ""} ${currentUser.lastName ?? ""}`.trim() : ""}
            isPurchased={isPurchased}
            staticReviews={(formation.avisClients ?? []).map((a) => ({ nom: a.nom, note: a.note, texte: a.texte }))}
            cardSize={reviewCardSize}
          />
        </div>

        {/* FAQ */}
        {formation.faq && formation.faq.length > 0 && <FAQAccordion faq={formation.faq} />}


        {/* Garantie */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 sm:p-8 flex flex-col md:flex-row items-center gap-4 sm:gap-6 mt-10 sm:mt-16">
          <div className="flex -space-x-3">
            {["MN", "PK", "SF", "JM"].map((init) => (
              <div key={init} className="w-10 h-10 rounded-full bg-gradient-to-br from-[#E8B800]/40 to-[#27A827]/40 border-2 border-white flex items-center justify-center text-xs font-bold text-[#E8B800]">
                {init}
              </div>
            ))}
          </div>
          <div className="text-center md:text-left">
            <div className="flex items-center gap-1 justify-center md:justify-start mb-1">
              {[...Array(5)].map((_, i) => <Star key={i} size={14} className="fill-yellow-400 text-yellow-400" />)}
            </div>
            <p className="text-gray-900 font-semibold text-sm">
              Rejoignez <span className="text-[#E8B800]">{formation.apprenants.toLocaleString("fr-FR")}+</span> apprenants satisfaits
            </p>
            <p className="text-gray-500 text-xs mt-0.5">Note {formation.note}/5 · Formation certifiante</p>
          </div>
          <div className="md:ml-auto flex items-center gap-2 text-emerald-600 text-sm font-medium">
            <CheckCircle size={16} /> Satisfait ou remboursé
          </div>
        </div>

        {/* Bottom prix + CTA */}
        {!isPurchased && hasOnline && (
          <div className="mt-10 sm:mt-16 p-5 sm:p-8 bg-gray-50 border border-gray-200 rounded-2xl flex flex-col items-center gap-5">
            <div className="text-center">
              <div className="flex items-baseline justify-center gap-3">
                <span className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900">{convert(formation.prix)}</span>
                {formation.prixOriginal && (
                  <span className="text-gray-400 text-xl line-through">{convert(formation.prixOriginal)}</span>
                )}
              </div>
              {discount && (
                <span className="inline-block mt-2 px-3 py-1 bg-red-100 text-red-600 text-sm font-bold rounded-lg">
                  Économisez {discount}%
                </span>
              )}
            </div>
            <button
              onClick={() => setQuickBuyOpen(true)}
              className={`px-10 py-4 font-bold rounded-xl transition-all text-base inline-flex items-center gap-2 bg-gradient-to-r from-[#E8B800] to-[#27A827] hover:from-[#27A827] hover:to-[#E8B800] text-black shadow-lg shadow-[#E8B800]/20 active:scale-95 ${ctaAnimClass}`}
            >
              <Monitor size={18} />
              {(formation as { ctaLabel?: string }).ctaLabel || "Rejoindre la formation"}
            </button>
            {(() => {
              const shareUrl = `${SITE_FM}/formation/${formation.id}`;
              const shareText = encodeURIComponent(`Découvrez cette formation : ${formation.titre} — ${shareUrl}`);
              return (
                <div className="border border-gray-200 rounded-2xl p-4 space-y-2.5 w-full">
                  <p className="text-gray-700 font-bold text-xs flex items-center gap-1.5">
                    <Share2 size={12} className="text-[#E8B800]" /> Partager cette formation
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <a href={`https://api.whatsapp.com/send?text=${shareText}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-2 bg-[#25D366] hover:bg-[#20b858] text-white text-xs font-bold rounded-xl transition-colors">
                      {WA_SVG_FM} WhatsApp
                    </a>
                    <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-2 bg-[#1877F2] hover:bg-[#1565d8] text-white text-xs font-bold rounded-xl transition-colors">
                      {FB_SVG_FM} Facebook
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
              <PaymentBadges size="sm" />
            </div>
            <div className="flex items-center gap-4 text-gray-500 text-xs">
              <span className="flex items-center gap-1"><ShieldCheck size={12} /> Paiement sécurisé</span>
              <span className="flex items-center gap-1"><Award size={12} /> Formation certifiante</span>
              <span className="flex items-center gap-1"><CheckCircle size={12} /> Accès immédiat</span>
            </div>
          </div>
        )}
      </div>
      {formation && <CrossSellWidget productId={formation.id} productType="formation" variant="light" />}

      {/* Modal achat rapide */}
      {quickBuyOpen && (
        <DownloadModal
          item={{ type: "formation", id: formation.id, title: formation.titre, price: formation.prix }}
          onClose={() => setQuickBuyOpen(false)}
        />
      )}
    </div>
  );
}
