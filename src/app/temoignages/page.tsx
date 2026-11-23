"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { X, Play, ChevronLeft, ChevronRight, Star, ArrowRight, Quote, Search, Mic } from "lucide-react";
import AnimateOnScroll, { StaggerContainer, StaggerItem } from "@/components/AnimateOnScroll";

type Temoignage = {
  id: string;
  type: "image" | "video" | "audio";
  imageUrl?: string;
  videoUrl?: string;
  audioUrl?: string;
  thumbnailUrl?: string;
  clientNom?: string;
  produitNom?: string;
  caption?: string;
  ordre: number;
};

function toEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") return `https://www.youtube.com/embed${u.pathname}?rel=0&autoplay=1`;
    if (u.hostname.includes("youtube.com")) {
      if (u.pathname === "/watch") {
        const v = u.searchParams.get("v");
        return v ? `https://www.youtube.com/embed/${v}?rel=0&autoplay=1` : null;
      }
      if (u.pathname.startsWith("/embed/")) return url;
    }
    const vm = url.match(/vimeo\.com\/(\d+)/);
    if (vm) return `https://player.vimeo.com/video/${vm[1]}?autoplay=1`;
    const loom = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/);
    if (loom) return `https://www.loom.com/embed/${loom[1]}?autoplay=1`;
    if (/\.(mp4|webm|mov)(\?|#|$)/i.test(url)) return url;
    return null;
  } catch {
    return null;
  }
}

function isDirectVideo(url: string) {
  return /\.(mp4|webm|mov)(\?|#|$)/i.test(url);
}

function TemoignageCard({ item, onClick }: { item: Temoignage; onClick: () => void }) {
  const embedUrl = item.videoUrl ? toEmbedUrl(item.videoUrl) : null;

  return (
    <div
      onClick={onClick}
      className="group relative cursor-pointer rounded-[14px] overflow-hidden bg-white border border-[var(--g-ligne)] hover:border-[var(--g-encre)]/30 transition-colors duration-200"
    >
      {item.type === "image" && item.imageUrl ? (
        <div className="relative">
          <img
            src={item.imageUrl}
            alt={item.clientNom || "Témoignage"}
            className="w-full object-cover"
            style={{ maxHeight: 420 }}
          />
          <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="bg-white text-[var(--g-encre)] text-xs font-semibold px-3 py-1.5 rounded-[8px]">Agrandir</span>
          </div>
        </div>
      ) : item.type === "video" && item.videoUrl ? (
        <div className="relative bg-[var(--g-doux)] aspect-video flex items-center justify-center overflow-hidden">
          {item.thumbnailUrl ? (
            <>
              <img src={item.thumbnailUrl} alt="Miniature" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors" />
              <div className="relative z-10 w-16 h-16 rounded-full bg-white flex items-center justify-center">
                <Play size={24} className="text-[var(--g-encre)] fill-[var(--g-encre)] ml-1" />
              </div>
            </>
          ) : embedUrl && !isDirectVideo(item.videoUrl!) ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[var(--g-doux)]">
              <div className="w-16 h-16 rounded-full bg-white border border-[var(--g-ligne)] flex items-center justify-center">
                <Play size={24} className="text-[var(--g-vert)] fill-[var(--g-vert)] ml-1" />
              </div>
              <span className="text-[var(--g-gris)] text-xs font-medium">Lire la vidéo</span>
            </div>
          ) : (
            <video src={item.videoUrl} className="w-full h-full object-cover" />
          )}
        </div>
      ) : item.type === "audio" ? (
        <div className="relative bg-[var(--g-vert-doux)] px-6 py-8 flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-full bg-white border border-[var(--g-ligne)] flex items-center justify-center">
            <Mic size={26} className="text-[var(--g-vert)]" />
          </div>
          <span className="text-[var(--g-gris)] text-xs font-medium">Écouter le témoignage audio</span>
        </div>
      ) : (
        <div className="h-32 bg-[var(--g-doux)] flex items-center justify-center">
          <Quote size={32} className="text-[var(--g-vert)]/40" />
        </div>
      )}

      {(item.clientNom || item.produitNom || item.caption) && (
        <div className="p-3 bg-white border-t border-[var(--g-ligne)]">
          {item.caption && (
            <p className="text-[var(--g-gris)] text-xs leading-relaxed mb-1.5 line-clamp-2">{item.caption}</p>
          )}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            {item.clientNom && (
              <p className="text-[var(--g-encre)] text-xs font-semibold">{item.clientNom}</p>
            )}
            {item.produitNom && (
              <span className="text-xs font-semibold text-[var(--g-vert)]">
                {item.produitNom}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Lightbox({ items, index, onClose, onPrev, onNext }: {
  items: Temoignage[];
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const item = items[index];
  const embedUrl = item.videoUrl ? toEmbedUrl(item.videoUrl) : null;
  const isDirect = item.videoUrl ? isDirectVideo(item.videoUrl) : false;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, onPrev, onNext]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/90 hover:bg-white text-[var(--g-encre)] transition-colors z-10"
      >
        <X size={20} />
      </button>

      {items.length > 1 && (
        <>
          <button onClick={onPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-white/90 hover:bg-white text-[var(--g-encre)] transition-colors z-10">
            <ChevronLeft size={22} />
          </button>
          <button onClick={onNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-white/90 hover:bg-white text-[var(--g-encre)] transition-colors z-10">
            <ChevronRight size={22} />
          </button>
        </>
      )}

      <div className="flex flex-col items-center gap-4 max-w-4xl w-full max-h-[90vh]">
        {item.type === "image" && item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.clientNom || "Témoignage"}
            className="max-w-full max-h-[75vh] object-contain rounded-[12px]"
          />
        ) : item.type === "video" && item.videoUrl ? (
          <div className="w-full rounded-[12px] overflow-hidden" style={{ aspectRatio: "16/9" }}>
            {isDirect ? (
              <video src={item.videoUrl} controls autoPlay playsInline className="w-full h-full" />
            ) : embedUrl ? (
              <iframe src={embedUrl} className="w-full h-full"
                allow="autoplay; fullscreen; picture-in-picture" allowFullScreen />
            ) : (
              <a href={item.videoUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center h-full bg-[var(--g-doux)] text-[var(--g-vert)] font-semibold gap-2">
                <Play size={20} /> Ouvrir la vidéo ↗
              </a>
            )}
          </div>
        ) : item.type === "audio" && item.audioUrl ? (
          <div className="w-full max-w-md bg-white rounded-[16px] p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-[var(--g-vert-doux)] flex items-center justify-center">
              <Mic size={32} className="text-[var(--g-vert)]" />
            </div>
            {item.clientNom && <p className="text-[var(--g-encre)] font-semibold tracking-[-0.02em] text-lg mb-1">{item.clientNom}</p>}
            {item.produitNom && (
              <span className="inline-block text-[14px] font-semibold text-[var(--g-vert)] mb-4">
                {item.produitNom}
              </span>
            )}
            {item.caption && <p className="text-[var(--g-gris)] text-sm leading-relaxed mb-4">{item.caption}</p>}
            <audio src={item.audioUrl} controls autoPlay className="w-full rounded-lg" />
          </div>
        ) : null}

        {item.type !== "audio" && (item.clientNom || item.produitNom || item.caption) && (
          <div className="text-center max-w-lg bg-white rounded-[12px] px-5 py-3">
            {item.caption && <p className="text-[var(--g-gris)] text-sm leading-relaxed mb-2">{item.caption}</p>}
            <div className="flex items-center justify-center gap-3 flex-wrap">
              {item.clientNom && <p className="text-[var(--g-encre)] font-semibold text-sm">{item.clientNom}</p>}
              {item.produitNom && (
                <span className="text-xs font-semibold text-[var(--g-vert)]">
                  {item.produitNom}
                </span>
              )}
            </div>
          </div>
        )}

        {items.length > 1 && (
          <p className="text-white/70 text-xs">{index + 1} / {items.length}</p>
        )}
      </div>
    </div>
  );
}

export default function TemoignagesPage() {
  const [items, setItems] = useState<Temoignage[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [filter, setFilter] = useState<"tous" | "image" | "video" | "audio">("tous");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/temoignages")
      .then((r) => r.json())
      .then((d) => setItems(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = items.filter((i) => {
    const matchType = filter === "tous" || i.type === filter;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      (i.clientNom || "").toLowerCase().includes(q) ||
      (i.produitNom || "").toLowerCase().includes(q) ||
      (i.caption || "").toLowerCase().includes(q);
    return matchType && matchSearch;
  });

  const openLightbox = useCallback((idx: number) => setLightboxIdx(idx), []);
  const closeLightbox = useCallback(() => setLightboxIdx(null), []);
  const prevItem = useCallback(() => setLightboxIdx((i) => (i === null ? null : (i - 1 + filtered.length) % filtered.length)), [filtered.length]);
  const nextItem = useCallback(() => setLightboxIdx((i) => (i === null ? null : (i + 1) % filtered.length)), [filtered.length]);

  const images = items.filter((i) => i.type === "image").length;
  const videos = items.filter((i) => i.type === "video").length;
  const audios = items.filter((i) => i.type === "audio").length;

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="relative overflow-hidden bg-white border-b border-[var(--g-ligne)]">
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-12 text-center">
          <AnimateOnScroll variant="fadeUp">
            <p className="inline-flex items-center gap-2 text-[14px] font-semibold text-[var(--g-vert)] mb-5">
              <Star size={14} className="fill-[var(--g-jaune)] text-[var(--g-jaune)]" /> Preuves Sociales
            </p>
            <h1 className="text-4xl sm:text-5xl font-semibold tracking-[-0.02em] text-[var(--g-encre)] mb-4 leading-tight">
              Ils ont transformé leur vie<br />
              <span className="g-surligne">avec Smart Life</span>
            </h1>
            <p className="text-[var(--g-gris)] text-lg max-w-2xl mx-auto mb-8">
              Découvrez les retours authentiques de nos clients — captures WhatsApp, vidéos et messages vocaux témoignages.
            </p>
          </AnimateOnScroll>

          {!loading && items.length > 0 && (
            <AnimateOnScroll variant="blurUp" delay={0.2}>
            <div className="flex items-center justify-center gap-10 text-center mb-8">
              <div>
                <p className="g-chiffre">{items.length}</p>
                <p className="text-[var(--g-gris)] text-xs font-medium mt-1.5">témoignages</p>
              </div>
              {images > 0 && (
                <div>
                  <p className="g-chiffre">{images}</p>
                  <p className="text-[var(--g-gris)] text-xs font-medium mt-1.5">captures</p>
                </div>
              )}
              {videos > 0 && (
                <div>
                  <p className="g-chiffre">{videos}</p>
                  <p className="text-[var(--g-gris)] text-xs font-medium mt-1.5">vidéos</p>
                </div>
              )}
              {audios > 0 && (
                <div>
                  <p className="g-chiffre">{audios}</p>
                  <p className="text-[var(--g-gris)] text-xs font-medium mt-1.5">audios</p>
                </div>
              )}
            </div>
            </AnimateOnScroll>
          )}

          {/* Barre de recherche */}
          {!loading && items.length > 0 && (
            <div className="relative max-w-sm mx-auto mb-5">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--g-gris)]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un témoignage…"
                className="w-full pl-10 pr-4 py-2.5 border border-[var(--g-ligne)] rounded-[10px] text-sm bg-white focus:outline-none focus:border-[var(--g-encre)]"
              />
            </div>
          )}

          {/* Filtres */}
          {!loading && items.length > 0 && (
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {([
                { key: "tous" as const, label: "Tous" },
                ...(images > 0 ? [{ key: "image" as const, label: "Captures" }] : []),
                ...(videos > 0 ? [{ key: "video" as const, label: "Vidéos" }] : []),
                ...(audios > 0 ? [{ key: "audio" as const, label: "Audios" }] : []),
              ]).map(({ key, label }) => {
                const count = key === "tous" ? items.length : key === "image" ? images : key === "video" ? videos : audios;
                return (
                  <button key={key} onClick={() => setFilter(key)}
                    className={`px-4 py-2 rounded-[10px] text-sm font-semibold transition-colors ${
                      filter === key
                        ? "bg-[var(--g-encre)] text-white border border-[var(--g-encre)]"
                        : "bg-white border border-[var(--g-ligne)] text-[var(--g-gris)] hover:border-[var(--g-encre)] hover:text-[var(--g-encre)]"
                    }`}>
                    {label} {key !== "tous" && `(${count})`}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Galerie */}
      <AnimateOnScroll variant="fadeUp" delay={0.1}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-10 h-10 border-2 border-[var(--g-vert)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 mx-auto mb-4 rounded-[14px] bg-[var(--g-doux)] flex items-center justify-center">
              <Quote size={32} className="text-[var(--g-vert)]" />
            </div>
            <p className="text-[var(--g-gris)] text-lg font-medium">
              {items.length === 0 ? "Aucun témoignage disponible pour l'instant." : "Aucun résultat pour cette recherche."}
            </p>
            <p className="text-[var(--g-gris)] text-sm mt-2">
              {items.length === 0 ? "Revenez bientôt — ils arrivent !" : "Essayez un autre mot-clé ou filtre."}
            </p>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
            {filtered.map((item, idx) => (
              <div key={item.id} className="break-inside-avoid">
                <TemoignageCard item={item} onClick={() => openLightbox(idx)} />
              </div>
            ))}
          </div>
        )}

        {!loading && items.length > 0 && (
          <AnimateOnScroll variant="blurUp">
          <div className="mt-10 text-center rounded-[18px] p-8 bg-[var(--g-jaune-doux)]">
            <h2 className="text-2xl font-semibold tracking-[-0.02em] text-[var(--g-encre)] mb-3">Prêt à rejoindre nos clients satisfaits ?</h2>
            <p className="text-[var(--g-gris)] text-sm mb-6 max-w-md mx-auto">
              Accédez à nos guides, à l&apos;accompagnement et à nos consultants, et commencez à transformer votre situation.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Link href="/ebooks"
                className="g-btn g-btn-noir">
                Voir les guides <ArrowRight size={16} />
              </Link>
              <Link href="/accompagnement"
                className="g-btn-ghost bg-white">
                Se faire accompagner <ArrowRight size={16} />
              </Link>
            </div>
          </div>
          </AnimateOnScroll>
        )}
      </div>
      </AnimateOnScroll>

      {lightboxIdx !== null && (
        <Lightbox
          items={filtered}
          index={lightboxIdx}
          onClose={closeLightbox}
          onPrev={prevItem}
          onNext={nextItem}
        />
      )}
    </div>
  );
}
