"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { X, Play, ChevronLeft, ChevronRight, Star, ArrowRight, Quote, Search } from "lucide-react";
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
      className="group relative cursor-pointer rounded-2xl overflow-hidden bg-white border border-gray-200 hover:border-[#E8B800]/60 transition-all duration-300 hover:shadow-xl hover:shadow-[#E8B800]/10 hover:-translate-y-0.5"
    >
      {item.type === "image" && item.imageUrl ? (
        <div className="relative">
          <img
            src={item.imageUrl}
            alt={item.clientNom || "Témoignage"}
            className="w-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
            style={{ maxHeight: 420 }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="bg-white/90 text-gray-900 text-xs font-bold px-3 py-1.5 rounded-full shadow">Agrandir</span>
          </div>
        </div>
      ) : item.type === "video" && item.videoUrl ? (
        <div className="relative bg-gray-100 aspect-video flex items-center justify-center overflow-hidden">
          {item.thumbnailUrl ? (
            <>
              <img src={item.thumbnailUrl} alt="Miniature" className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" />
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors" />
              <div className="relative z-10 w-16 h-16 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                <Play size={24} className="text-gray-900 fill-gray-900 ml-1" />
              </div>
            </>
          ) : embedUrl && !isDirectVideo(item.videoUrl!) ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-gray-50 to-gray-100">
              <div className="w-16 h-16 rounded-full bg-[#E8B800]/20 border-2 border-[#E8B800] flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                <Play size={24} className="text-[#E8B800] fill-[#E8B800] ml-1" />
              </div>
              <span className="text-gray-600 text-xs font-medium">Lire la vidéo</span>
            </div>
          ) : (
            <video src={item.videoUrl} className="w-full h-full object-cover" />
          )}
        </div>
      ) : item.type === "audio" ? (
        <div className="relative bg-gradient-to-br from-[#E8B800]/10 to-[#27A827]/10 px-6 py-8 flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-full bg-[#E8B800]/20 border-2 border-[#E8B800] flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
            <span className="text-2xl">🎙️</span>
          </div>
          <span className="text-gray-600 text-xs font-medium">Écouter le témoignage audio</span>
        </div>
      ) : (
        <div className="h-32 bg-gradient-to-br from-[#E8B800]/5 to-[#27A827]/5 flex items-center justify-center">
          <Quote size={32} className="text-[#E8B800]/40" />
        </div>
      )}

      {(item.clientNom || item.produitNom || item.caption) && (
        <div className="p-3 bg-white border-t border-gray-100">
          {item.caption && (
            <p className="text-gray-600 text-xs leading-relaxed mb-1.5 line-clamp-2">{item.caption}</p>
          )}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            {item.clientNom && (
              <p className="text-gray-900 text-xs font-bold">{item.clientNom}</p>
            )}
            {item.produitNom && (
              <span className="px-2 py-0.5 bg-[#E8B800]/10 border border-[#E8B800]/30 text-[#D4A017] text-xs font-medium rounded-full">
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
        className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/90 hover:bg-white text-gray-900 transition-colors z-10 shadow"
      >
        <X size={20} />
      </button>

      {items.length > 1 && (
        <>
          <button onClick={onPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-white/90 hover:bg-white text-gray-900 transition-colors z-10 shadow">
            <ChevronLeft size={22} />
          </button>
          <button onClick={onNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-white/90 hover:bg-white text-gray-900 transition-colors z-10 shadow">
            <ChevronRight size={22} />
          </button>
        </>
      )}

      <div className="flex flex-col items-center gap-4 max-w-4xl w-full max-h-[90vh]">
        {item.type === "image" && item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.clientNom || "Témoignage"}
            className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-2xl"
          />
        ) : item.type === "video" && item.videoUrl ? (
          <div className="w-full rounded-xl overflow-hidden shadow-2xl" style={{ aspectRatio: "16/9" }}>
            {isDirect ? (
              <video src={item.videoUrl} controls autoPlay playsInline className="w-full h-full" />
            ) : embedUrl ? (
              <iframe src={embedUrl} className="w-full h-full"
                allow="autoplay; fullscreen; picture-in-picture" allowFullScreen />
            ) : (
              <a href={item.videoUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center h-full bg-gray-100 text-[#E8B800] font-bold gap-2">
                <Play size={20} /> Ouvrir la vidéo ↗
              </a>
            )}
          </div>
        ) : item.type === "audio" && item.audioUrl ? (
          <div className="w-full max-w-md bg-white rounded-2xl p-8 text-center shadow-2xl">
            <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-[#E8B800]/20 border-2 border-[#E8B800] flex items-center justify-center">
              <span className="text-4xl">🎙️</span>
            </div>
            {item.clientNom && <p className="text-gray-900 font-black text-lg mb-1">{item.clientNom}</p>}
            {item.produitNom && (
              <span className="inline-block px-3 py-1 bg-[#E8B800]/10 border border-[#E8B800]/30 text-[#D4A017] text-xs font-semibold rounded-full mb-4">
                {item.produitNom}
              </span>
            )}
            {item.caption && <p className="text-gray-600 text-sm leading-relaxed mb-4">{item.caption}</p>}
            <audio src={item.audioUrl} controls autoPlay className="w-full rounded-lg" />
          </div>
        ) : null}

        {item.type !== "audio" && (item.clientNom || item.produitNom || item.caption) && (
          <div className="text-center max-w-lg bg-white/90 backdrop-blur rounded-xl px-5 py-3 shadow">
            {item.caption && <p className="text-gray-700 text-sm leading-relaxed mb-2">{item.caption}</p>}
            <div className="flex items-center justify-center gap-3 flex-wrap">
              {item.clientNom && <p className="text-gray-900 font-bold text-sm">{item.clientNom}</p>}
              {item.produitNom && (
                <span className="px-2.5 py-1 bg-[#E8B800]/20 border border-[#E8B800]/40 text-[#D4A017] text-xs font-semibold rounded-full">
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
    <div className="min-h-screen bg-[#f9f8f5]">
      {/* Hero */}
      <div className="relative overflow-hidden bg-white border-b border-gray-100">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#E8B800]/5 rounded-full blur-3xl" />
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#27A827]/5 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-12 text-center">
          <AnimateOnScroll variant="fadeUp">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#E8B800]/10 border border-[#E8B800]/30 rounded-full text-[#D4A017] text-sm font-bold mb-6">
              <Star size={14} className="fill-[#E8B800] text-[#E8B800]" /> Preuves Sociales
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-gray-900 mb-4 leading-tight">
              Ils ont transformé leur vie<br />
              <span className="gradient-text">avec Smart Life</span>
            </h1>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto mb-8">
              Découvrez les retours authentiques de nos clients — captures WhatsApp, vidéos et messages vocaux témoignages.
            </p>
          </AnimateOnScroll>

          {!loading && items.length > 0 && (
            <AnimateOnScroll variant="blurUp" delay={0.2}>
            <div className="flex items-center justify-center gap-10 text-center mb-8">
              <div>
                <p className="text-3xl font-black text-gray-900">{items.length}</p>
                <p className="text-gray-500 text-xs font-medium mt-0.5">témoignages</p>
              </div>
              {images > 0 && (
                <div>
                  <p className="text-3xl font-black text-gray-900">{images}</p>
                  <p className="text-gray-500 text-xs font-medium mt-0.5">captures</p>
                </div>
              )}
              {videos > 0 && (
                <div>
                  <p className="text-3xl font-black text-gray-900">{videos}</p>
                  <p className="text-gray-500 text-xs font-medium mt-0.5">vidéos</p>
                </div>
              )}
              {audios > 0 && (
                <div>
                  <p className="text-3xl font-black text-gray-900">{audios}</p>
                  <p className="text-gray-500 text-xs font-medium mt-0.5">audios</p>
                </div>
              )}
            </div>
            </AnimateOnScroll>
          )}

          {/* Barre de recherche */}
          {!loading && items.length > 0 && (
            <div className="relative max-w-sm mx-auto mb-5">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un témoignage…"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white/80 focus:outline-none focus:border-[#E8B800] focus:ring-1 focus:ring-[#E8B800]/30"
              />
            </div>
          )}

          {/* Filtres */}
          {!loading && items.length > 0 && (
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {([
                { key: "tous" as const, label: "Tous" },
                ...(images > 0 ? [{ key: "image" as const, label: "📷 Captures" }] : []),
                ...(videos > 0 ? [{ key: "video" as const, label: "▶️ Vidéos" }] : []),
                ...(audios > 0 ? [{ key: "audio" as const, label: "🎙️ Audios" }] : []),
              ]).map(({ key, label }) => {
                const count = key === "tous" ? items.length : key === "image" ? images : key === "video" ? videos : audios;
                return (
                  <button key={key} onClick={() => setFilter(key)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                      filter === key
                        ? "bg-[#E8B800] text-black shadow-sm"
                        : "bg-white border border-gray-200 text-gray-600 hover:border-[#E8B800]/50 hover:text-gray-900"
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
            <div className="w-10 h-10 border-2 border-[#E8B800] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#E8B800]/10 flex items-center justify-center">
              <Quote size={32} className="text-[#E8B800]/60" />
            </div>
            <p className="text-gray-600 text-lg font-medium">
              {items.length === 0 ? "Aucun témoignage disponible pour l'instant." : "Aucun résultat pour cette recherche."}
            </p>
            <p className="text-gray-400 text-sm mt-2">
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
          <div className="mt-10 text-center border border-[#E8B800]/20 rounded-2xl p-8 bg-gradient-to-br from-[#E8B800]/5 to-[#27A827]/5">
            <h2 className="text-2xl font-black text-gray-900 mb-3">Prêt à rejoindre nos clients satisfaits ?</h2>
            <p className="text-gray-600 text-sm mb-6 max-w-md mx-auto">
              Accédez à nos guides, formations et accompagnements et commencez à transformer votre situation.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Link href="/ebooks"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#E8B800] hover:bg-[#27A827] text-black font-black rounded-xl transition-all">
                Voir les guides <ArrowRight size={16} />
              </Link>
              <Link href="/formation"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 text-gray-900 font-bold rounded-xl border border-gray-200 transition-colors">
                Voir les formations <ArrowRight size={16} />
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
