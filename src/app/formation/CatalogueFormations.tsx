"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Play, Clock, BookOpen, Star, Users, Award, ChevronRight, Filter, Monitor, MapPin, Layers, Eye, Share2, Check, X, CheckCircle, Search, Bookmark } from "lucide-react";
import { fuzzyScore } from "@/lib/search-utils";
import { PaymentBadges } from "@/components/PaymentBadges";
import Link from "next/link";
import { useCatalogueStore } from "@/lib/catalogue-store";
import { stripHtml } from "@/lib/strip-html";
import { PriceTag } from "@/components/PriceTag";
import { useUserStore } from "@/lib/user-store";
import { FORMATIONS, type Formation } from "@/lib/formations-data";
import { testimonials } from "@/lib/data";
import TitreDefilant from "@/components/TitreDefilant";

const CATEGORIES = [
  "Toutes",
  "Publicité & Traffic",
  "Contenu, Vidéo & IA",
  "Télévente & Commercialisation",
  "Marketing Digital & Stratégie",
];

const NIVEAU_COLORS: Record<string, string> = {
  "Débutant": "bg-emerald-900/40 text-emerald-300 border-emerald-700/30",
  "Intermédiaire": "bg-blue-900/40 text-blue-300 border-blue-700/30",
  "Avancé": "bg-green-900/40 text-green-300 border-green-700/30",
};

const CAT_COLORS: Record<string, string> = {
  "Publicité & Traffic": "bg-orange-50 text-orange-700 border-orange-300",
  "Contenu, Vidéo & IA": "bg-green-50 text-yellow-600 border-green-400",
  "Télévente & Commercialisation": "bg-red-50 text-red-700 border-red-300",
  "Marketing Digital & Stratégie": "bg-yellow-50 text-green-700 border-yellow-400",
};

function formatFCFA(n: number) {
  return n.toLocaleString("fr-FR") + " FCFA";
}

function ModeBadge({ mode }: { mode: Formation["mode"] }) {
  if (mode === "online") {
    return (
      <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 border border-green-300 text-green-700 text-xs rounded-full font-bold">
        <Monitor size={9} /> En ligne
      </span>
    );
  }
  if (mode === "presentiel") {
    return (
      <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 border border-green-300 text-green-700 text-xs rounded-full font-bold">
        <MapPin size={9} /> Présentiel
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 border border-green-300 text-green-700 text-xs rounded-full font-bold">
      <Layers size={9} /> En ligne + Présentiel
    </span>
  );
}

function ShareBtn({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(`${window.location.origin}/formation/${id}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  return (
    <button onClick={copy} title="Copier le lien direct"
      className={`p-1.5 rounded-lg border transition-all ${copied ? "bg-emerald-900/30 border-emerald-700/40 text-emerald-400" : "border-white/20 hover:border-[#E8B800]/50 text-gray-500 hover:text-[#E8B800]"}`}>
      {copied ? <Check size={12} /> : <Share2 size={12} />}
    </button>
  );
}

type ServerData = {
  formations: Formation[];
  overrides: Record<string, Partial<Formation>>;
  actif: Record<string, boolean>;
};


export default function CatalogueFormations() {
  const [categorieActive, setCategorieActive] = useState("Toutes");
  const [modeFilter, setModeFilter] = useState<"toutes" | "online" | "presentiel">("toutes");
  const [serverData, setServerData] = useState<ServerData | null>(null);
  const [previewFormation, setPreviewFormation] = useState<Formation | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchInput = useCallback((val: string) => {
    setSearchInput(val);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => setSearchQuery(val), 180);
  }, []);
  const { formations: storeFormations, formationOverrides, staticFormationActif } = useCatalogueStore();
  const { isLoggedIn, formationsAchetees, toggleWishlist, isInWishlist } = useUserStore();
  const router = useRouter();

  useEffect(() => {
    fetch("/api/formations").then((r) => r.json()).then((d) => setServerData(d)).catch(() => {});
  }, []);

  const overrides = serverData?.overrides ?? formationOverrides;
  const actif = serverData?.actif ?? staticFormationActif;
  const dynamicFormations: Formation[] = serverData
    ? (serverData.formations ?? []).filter((f: Formation & { actif?: boolean; deletedAt?: string }) => f.actif !== false && !f.deletedAt)
    : storeFormations.filter((f) => f.actif && !f.deletedAt).map(({ actif: _, createdAt: __, ...f }) => f as Formation);

  const allFormations: Formation[] = [
    ...FORMATIONS
      .filter((f) => actif[f.id] !== false)
      .map((f) => ({ ...f, ...(overrides[f.id] || {}) } as Formation)),
    ...dynamicFormations,
  ];

  const formationsByCategorie = categorieActive === "Toutes"
    ? allFormations
    : allFormations.filter((f) => f.categorie === categorieActive);

  const formationsByMode = modeFilter === "toutes"
    ? formationsByCategorie
    : modeFilter === "online"
    ? formationsByCategorie.filter((f) => f.mode === "online" || f.mode === "both")
    : formationsByCategorie.filter((f) => f.mode === "presentiel" || f.mode === "both");

  const formations = searchQuery.trim()
    ? formationsByMode
        .map((f) => ({
          f,
          score: fuzzyScore(searchQuery, f.titre, [
            { text: f.description.replace(/<[^>]*>/g, ""), weight: 3 },
            { text: f.categorie, weight: 6 },
            { text: f.instructeur, weight: 2 },
          ]),
        }))
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score)
        .map(({ f }) => f)
    : formationsByMode;

  function handleBuyOnline(f: Formation) {
    window.location.href = `/checkout?fid=${f.id}&titre=${encodeURIComponent(f.titre)}&prix=${f.prix}`;
  }

  function toYouTubeEmbed(url: string): string | null {
    try {
      const u = new URL(url);
      if (u.hostname === "youtu.be") return `https://www.youtube.com/embed${u.pathname}?autoplay=1&rel=0`;
      if (u.hostname.includes("youtube.com")) {
        if (u.pathname === "/watch") { const v = u.searchParams.get("v"); return v ? `https://www.youtube.com/embed/${v}?autoplay=1&rel=0` : null; }
        if (u.pathname.startsWith("/embed/")) return url;
      }
    } catch { /* ignore */ }
    return null;
  }

  return (
    <div className="min-h-screen">

      {/* Modal aperçu vidéo */}
      {previewFormation && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setPreviewFormation(null)}>
          <div className="relative w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setPreviewFormation(null)}
              className="absolute -top-10 right-0 flex items-center gap-2 text-white/70 hover:text-white text-sm">
              <X size={16} /> Fermer
            </button>
            <div className="rounded-2xl overflow-hidden aspect-video bg-black shadow-2xl">
              {(() => {
                const embed = toYouTubeEmbed(previewFormation.videoPreview!);
                return embed ? (
                  <iframe src={embed} className="w-full h-full" allow="autoplay; fullscreen" allowFullScreen />
                ) : (
                  <video src={previewFormation.videoPreview} controls autoPlay className="w-full h-full" />
                );
              })()}
            </div>
            <p className="text-center text-white/60 text-sm mt-3">{previewFormation.titre} — Aperçu</p>
          </div>
        </div>
      )}

      {/* Hero */}
      <section className="relative py-20 px-4 overflow-hidden bg-gradient-to-br from-green-50 to-white border-b border-gray-200">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#E8B800]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-4xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-[#E8B800]/10 border border-[#E8B800]/40 rounded-full text-[#b88a00] text-sm font-bold mb-6">
            <Play size={14} />
            Formations en ligne &amp; en présentiel
          </span>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight text-gray-900">
            Développez vos compétences<br />
            <span className="gradient-text">pour réussir en Afrique</span>
          </h1>
          <p className="text-lg max-w-2xl mx-auto mb-10 text-gray-700 font-bold">
            Des formations pratiques disponibles en ligne ou en présentiel, conçues par des experts africains pour les entrepreneurs et professionnels d&apos;Afrique francophone.
          </p>

          {/* Légende modes */}
          <div className="flex items-center justify-center gap-4 flex-wrap mb-8">
            <span className="flex items-center gap-1.5 text-blue-600 text-sm font-bold"><Monitor size={14} /> Formation en ligne</span>
            <span className="flex items-center gap-1.5 text-emerald-600 text-sm font-bold"><MapPin size={14} /> Formation présentiel</span>
            <span className="flex items-center gap-1.5 text-[#b88a00] text-sm font-bold"><Layers size={14} /> Les deux disponibles</span>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 flex-wrap">
            {[
              { label: "Formations", value: `${allFormations.length}` },
              { label: "Apprenants", value: "3 800+" },
              { label: "Catégories", value: "4" },
              { label: "Satisfaction", value: "4.8/5" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-2xl font-bold text-green-700">{s.value}</div>
                <div className="text-sm font-bold text-gray-600">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Filtres */}
      <section className="py-6 px-4 border-b border-gray-200 sticky top-16 z-30 bg-white/95 backdrop-blur-md">
        <div className="max-w-6xl mx-auto space-y-3">

          {/* Barre de recherche */}
          <div className="relative flex items-center">
            <Search size={16} className="absolute left-3.5 text-gray-400 pointer-events-none z-10" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => handleSearchInput(e.target.value)}
              placeholder='Rechercher une formation… ex : "facebook ads", "vente", "montage vidéo"'
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border-2 border-gray-200 focus:border-[#E8B800] focus:outline-none bg-white text-gray-900 text-sm font-medium placeholder:text-gray-400 transition-colors"
            />
            {searchInput && (
              <button
                onClick={() => handleSearchInput("")}
                className="absolute right-3.5 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Filtre catégorie */}
          <div className="flex items-center gap-3 flex-wrap">
            <Filter size={16} className="text-gray-500 shrink-0" />
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategorieActive(cat)}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-all border ${
                  categorieActive === cat
                    ? "bg-[#E8B800] text-black border-[#E8B800]"
                    : "border-green-400 text-green-700 hover:bg-green-50 hover:border-green-600"
                }`}
              >
                {cat}
              </button>
            ))}
            <span className="ml-auto text-gray-600 text-sm shrink-0">
              {searchQuery.trim()
                ? <><span className="font-bold text-[#E8B800]">{formations.length}</span> résultat{formations.length > 1 ? "s" : ""}</>
                : <>{formations.length} formation{formations.length > 1 ? "s" : ""}</>
              }
            </span>
          </div>
          {/* Filtre mode */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-gray-600 text-xs shrink-0">Mode :</span>
            {([
              { key: "toutes", label: "Toutes", icon: null },
              { key: "online", label: "En ligne", icon: <Monitor size={11} /> },
              { key: "presentiel", label: "Présentiel", icon: <MapPin size={11} /> },
            ] as const).map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => setModeFilter(key)}
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-all border ${
                  modeFilter === key
                    ? key === "online"
                      ? "bg-blue-600 text-white border-blue-600"
                      : key === "presentiel"
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "bg-gray-200 text-gray-800 border-gray-200"
                    : "border-gray-300 text-gray-500 hover:border-gray-500 hover:text-gray-700"
                }`}
              >
                {icon}{label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Grille formations */}
      <section className="py-16 px-4">
        {formations.length === 0 && searchQuery.trim() ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-gray-800 font-bold text-xl mb-2">Aucune formation trouvée</h3>
            <p className="text-gray-500 mb-4">
              Aucun résultat pour &laquo;&nbsp;{searchQuery}&nbsp;&raquo; — essayez d&apos;autres mots-clés
            </p>
            <button
              onClick={() => handleSearchInput("")}
              className="px-5 py-2.5 bg-[#E8B800] hover:bg-[#27A827] text-black font-bold rounded-xl text-sm transition-colors"
            >
              Voir toutes les formations
            </button>
          </div>
        ) : (
        <div className="max-w-6xl mx-auto grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {formations.map((f) => {
            const discount = f.prixOriginal
              ? Math.round((1 - f.prix / f.prixOriginal) * 100)
              : null;
            const isPurchased = formationsAchetees.includes(f.id);
            const hasOnline = f.mode === "online" || f.mode === "both";
            const hasPresentiel = f.mode === "presentiel" || f.mode === "both";

            return (
              <div key={f.id} className="bg-white border border-gray-200 shadow-sm rounded-2xl overflow-hidden hover:border-[#E8B800]/50 hover:-translate-y-1 hover:shadow-md transition-all duration-300 flex flex-row sm:flex-col">

                {/* Cover */}
                <div className="relative w-24 flex-shrink-0 sm:w-full sm:h-36 bg-gradient-to-br from-[#1A1200] to-[#2D1A00] flex items-center justify-center group/cover overflow-hidden">
                  {f.cover ? (
                    <img src={f.cover} alt={f.titre} loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-[#E8B800]/20 flex items-center justify-center">
                      <Play size={28} className="text-[#E8B800] ml-1" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover/cover:bg-black/30 transition-colors flex items-center justify-center gap-2">
                    {f.videoPreview ? (
                      <>
                        <button onClick={() => setPreviewFormation(f)}
                          className="opacity-0 group-hover/cover:opacity-100 transition-opacity flex items-center gap-1.5 px-3 py-1.5 bg-[#E8B800]/90 text-black text-xs font-bold rounded-full hover:bg-[#E8B800]">
                          <Play size={11} className="ml-0.5" /> Aperçu
                        </button>
                        <Link href={`/formation/${f.id}`}
                          className="opacity-0 group-hover/cover:opacity-100 transition-opacity flex items-center gap-1.5 px-3 py-1.5 bg-black/70 text-white text-xs font-medium rounded-full">
                          <Eye size={12} /> Détails
                        </Link>
                      </>
                    ) : (
                      <Link href={`/formation/${f.id}`}
                        className="opacity-0 group-hover/cover:opacity-100 transition-opacity flex items-center gap-1.5 px-3 py-1.5 bg-black/70 text-white text-xs font-medium rounded-full">
                        <Eye size={12} /> Voir les détails
                      </Link>
                    )}
                  </div>
                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex flex-col gap-1">
                    {f.badge === "Bestseller" && (
                      <span className="px-2 py-0.5 bg-yellow-500/90 text-yellow-900 text-xs font-bold rounded-full">Bestseller</span>
                    )}
                    {f.badge === "Nouveau" && (
                      <span className="px-2 py-0.5 bg-emerald-500/90 text-emerald-900 text-xs font-bold rounded-full">Nouveau</span>
                    )}
                    {f.badge === "Premium" && (
                      <span className="px-2 py-0.5 bg-[#E8B800] text-black text-xs font-bold rounded-full">Premium</span>
                    )}
                    {discount && (
                      <span className="px-2 py-0.5 bg-red-500/90 text-white text-xs font-bold rounded-full">-{discount}%</span>
                    )}
                  </div>
                  {/* Niveau */}
                  <div className="absolute bottom-3 right-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${NIVEAU_COLORS[f.niveau]}`}>
                      {f.niveau}
                    </span>
                  </div>
                  {/* Bookmark */}
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleWishlist(f.id, "formation"); }}
                    title={isInWishlist(f.id, "formation") ? "Retirer des favoris" : "Sauvegarder"}
                    className={`absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full shadow transition-all z-10 ${isInWishlist(f.id, "formation") ? "bg-[#E8B800] text-black" : "bg-black/50 text-white hover:bg-[#E8B800] hover:text-black"}`}
                  >
                    <Bookmark size={14} className={isInWishlist(f.id, "formation") ? "fill-black" : ""} />
                  </button>
                </div>

                {/* Content */}
                <div className="p-3 sm:p-5 flex flex-col flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${CAT_COLORS[f.categorie] ?? "bg-gray-900/40 text-gray-300 border-gray-700/30"}`}>
                      {f.categorie}
                    </span>
                    <ModeBadge mode={f.mode ?? "both"} />
                  </div>

                  <TitreDefilant texte={f.titre} className="font-bold text-sm mb-2" style={{ color: "#27A827" }} />
                  <p className="text-xs leading-relaxed mb-3 line-clamp-2 flex-1" style={{ color: "#27A827" }}>{stripHtml(f.description)}</p>

                  <p className="text-gray-600 text-xs mb-3">par <span className="text-gray-400">{f.instructeur}</span></p>

                  {/* Meta */}
                  <div className="flex items-center gap-3 text-xs text-gray-600 mb-4">
                    <span className="flex items-center gap-1"><Clock size={11} /> {f.duree}</span>
                    <span className="flex items-center gap-1"><BookOpen size={11} /> {f.modules} modules</span>
                    <span className="flex items-center gap-1"><Users size={11} /> {f.apprenants}</span>
                  </div>

                  {/* Note */}
                  <div className="flex items-center gap-1.5 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={12}
                        className={i < Math.floor(f.note) ? "fill-yellow-400 text-yellow-400" : "text-gray-700"}
                      />
                    ))}
                    <span className="text-yellow-400 text-xs font-medium">{f.note}</span>
                  </div>

                  {/* Prix */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-gray-900 font-bold"><PriceTag amount={f.prix} /></span>
                      {f.prixOriginal && (
                        <span className="text-gray-600 text-xs line-through ml-2"><PriceTag amount={f.prixOriginal} /></span>
                      )}
                    </div>
                  </div>

                  {/* Partage + boutons */}
                  <div className="flex items-center justify-between mb-3">
                    <ShareBtn id={f.id} />
                    <Link href={`/formation/${f.id}`} className="text-[#E8B800] text-xs font-mono hover:underline">/formation/{f.id}</Link>
                  </div>

                  {isPurchased && hasOnline ? (
                    <Link
                      href={`/formation/${f.id}/watch`}
                      className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                      <Play size={14} /> Accéder à la formation
                    </Link>
                  ) : (
                    <div className="space-y-2">
                      <Link
                        href={`/formation/${f.id}`}
                        className="w-full py-2 border border-gray-200 hover:border-[#E8B800]/50 text-gray-600 hover:text-[#E8B800] text-sm font-medium rounded-xl transition-all flex items-center justify-center gap-2"
                      >
                        <Eye size={13} /> Voir les détails
                      </Link>
                      {hasOnline && (
                        <button
                          onClick={() => handleBuyOnline(f)}
                          className="w-full py-2.5 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-[#E8B800] to-[#27A827] hover:from-[#27A827] hover:to-[#E8B800] text-black"
                        >
                          <Monitor size={13} />
                          Acheter (En ligne)
                        </button>
                      )}
                      {hasPresentiel && (
                        <Link
                          href="/contact"
                          className="w-full py-2 border border-gray-200 hover:border-[#E8B800]/50 text-gray-600 hover:text-[#E8B800] text-sm font-medium rounded-xl transition-all flex items-center justify-center gap-2"
                        >
                          <MapPin size={13} /> S&apos;inscrire (Présentiel)
                        </Link>
                      )}
                      <PaymentBadges />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        )}
      </section>

      {/* Témoignages clients */}
      <section className="py-8 px-4 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="relative overflow-hidden py-2">
            <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
            <div className="flex gap-4 animate-marquee-left" style={{ width: "max-content", animationDuration: "35s" }}>
              {[...testimonials, ...testimonials, ...testimonials].map((t, i) => (
                <div key={i} className="flex-shrink-0 w-72 sm:w-80 p-5 bg-white border border-gray-200 shadow-sm rounded-2xl flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#E8B800] to-amber-700 flex items-center justify-center text-black text-sm font-bold flex-shrink-0">
                      {t.avatar}
                    </div>
                    <div>
                      <div className="text-gray-900 text-sm font-semibold">{t.name}</div>
                      <div className="flex items-center gap-1 text-emerald-400 text-xs">
                        <CheckCircle size={11} /> {t.role}
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm leading-relaxed line-clamp-4">{t.content}</p>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} size={13} className={j < t.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-700"} />
                    ))}
                    <span className="text-gray-500 text-xs ml-1">{t.rating}/5</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA bas */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center p-10 bg-gradient-to-r from-[#E8B800]/20 to-amber-900/20 border border-[#E8B800]/30 rounded-3xl">
          <Award size={40} className="text-[#E8B800] mx-auto mb-5" />
          <h2 className="text-gray-900 text-2xl font-bold mb-4">Formation sur mesure pour votre équipe</h2>
          <p className="text-gray-400 mb-8">
            Vous avez une entreprise et souhaitez former vos collaborateurs ? Nous créons des programmes de formation personnalisés adaptés à vos besoins spécifiques.
          </p>
          <Link href="/contact"
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#E8B800] hover:bg-[#27A827] text-black font-bold rounded-xl transition-colors">
            Nous contacter <ChevronRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}
