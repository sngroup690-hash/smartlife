"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Nunito } from "next/font/google";
import { Search, BookOpen, X } from "lucide-react";
import type { Ebook } from "@/lib/data";
import { useCurrencyStore } from "@/lib/currency-store";
import { EnteteBoutique, PiedBoutique } from "./[slug]/ElementsBoutique";
import DownloadModal from "@/components/DownloadModal";

const nunito = Nunito({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });

type Guide = Ebook & { ventes?: number; vendusAffiche?: number };
type Temoignage = { name: string; role: string; content: string; rating: number; avatar: string };

const NOMS_COURTS: Record<string, string> = {
  Tous: "✨ Tous",
  "Développement Personnel, Compétences & Spiritualité": "🧠 Développement perso",
  "Santé, Bien-être & Soins Corporels": "💆 Santé & beauté",
  "Élevage & Dresseurs": "🐔 Élevage",
  "Agriculture & Cultures Rentables": "🌱 Agriculture",
  "Création d'Entreprises & Commerce Réel": "🏪 Commerce & business",
  "Fabrication Artisanale & Transformation": "🧴 Fabrication",
  "Business Numérique, IA & Tech": "💻 Numérique & IA",
  "Gestion, Droit & Finance": "💰 Finance & gestion",
};

type Achat = (g: Guide) => void;

function ApparitionScroll({ children, className = "", delai = 0 }: { children: React.ReactNode; className?: string; delai?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className={className} style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(24px)", transition: `opacity 0.6s ease ${delai}ms, transform 0.6s ease ${delai}ms` }}>
      {children}
    </div>
  );
}

const normaliser = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const ventesDe = (g: Guide) => g.vendusAffiche ?? g.ventes ?? 0;

function melanger<T>(liste: T[]): T[] {
  const copie = [...liste];
  for (let i = copie.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copie[i], copie[j]] = [copie[j], copie[i]];
  }
  return copie;
}

function CarteGuide({ guide, onAcheter }: { guide: Guide; onAcheter: Achat }) {
  const convert = useCurrencyStore((s) => s.convert);
  const [erreurImage, setErreurImage] = useState(false);
  const image = guide.cover || guide.banner;
  const reduction = guide.originalPrice && guide.originalPrice > guide.price
    ? Math.round((1 - guide.price / guide.originalPrice) * 100) : 0;
  const ventes = ventesDe(guide);
  return (
    <div className="group flex flex-col rounded-xl border border-[#e8e9eb] bg-white overflow-hidden">
      <Link href={`/ebooks/${guide.slug}`} className="flex flex-col flex-1 active:scale-[0.99] transition-transform">
      <div className="relative aspect-square bg-[#f7f7f8] flex items-center justify-center overflow-hidden">
        {image && !erreurImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={guide.title} loading="lazy" className="w-full h-full object-contain group-hover:scale-[1.03] transition-transform duration-300" onError={() => setErreurImage(true)} />
        ) : (
          <BookOpen size={30} className="text-[#a9aeb5]" />
        )}
        {reduction > 0 && (
          <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-[#e30026] text-[11px] font-bold" style={{ color: "#fff" }}>-{reduction} %</span>
        )}
      </div>
      <div className="p-2.5 flex flex-col gap-1 flex-1">
        <p className="text-[13px] font-semibold leading-snug text-black line-clamp-2">{guide.title}</p>
        {ventes > 0 && <p className="text-[11px] text-[#717882]">🔥 {ventes.toLocaleString("fr-FR")} ventes</p>}
        <div className="mt-auto pt-1 flex flex-wrap items-baseline gap-x-1.5">
          <span className="text-[15px] font-bold text-[#e30026]">{convert(guide.price)}</span>
          {reduction > 0 && <span className="text-[11px] text-[#a9aeb5] line-through">{convert(guide.originalPrice!)}</span>}
        </div>
      </div>
      </Link>
      <div className="px-2.5 pb-2.5">
        <button onClick={() => onAcheter(guide)}
          className="w-full h-9 rounded-lg bg-[#008f51] text-[13px] font-bold active:scale-[0.98] transition-transform"
          style={{ color: "#fff" }}>
          ⚡ Acheter
        </button>
      </div>
    </div>
  );
}

type PackVitrine = { slug?: string; nom: string; prix: number; originalValeur: number; image?: string; items?: unknown[] };

function SectionPacks() {
  const convert = useCurrencyStore((s) => s.convert);
  const [packs, setPacks] = useState<PackVitrine[]>([]);
  useEffect(() => {
    fetch("/api/packs").then((r) => r.json())
      .then((d) => setPacks((d.packs ?? []).filter((p: PackVitrine) => p.slug && p.originalValeur > p.prix)))
      .catch(() => {});
  }, []);
  if (packs.length === 0) return null;
  const maxEco = Math.max(...packs.map((p) => p.originalValeur - p.prix));
  return (
    <section className="mt-8 -mx-4 py-6 bg-[#fffbeb] border-y border-[#fde68a]">
      <div className="px-4 flex items-end justify-between gap-3 mb-3">
        <div>
          <h2 className="text-[19px] font-bold">📦 Packs à prix cassé</h2>
          <p className="text-[13px] text-[#b45309] font-semibold">Jusqu&apos;à {convert(maxEco)} d&apos;économie</p>
        </div>
        <Link href="/packs" className="text-[13px] font-semibold text-[#008f51] whitespace-nowrap">Tout voir →</Link>
      </div>
      <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory px-4 pb-2 [scrollbar-width:none]">
        {packs.map((p) => (
          <Link key={p.slug} href={`/packs/${p.slug}`}
            className="snap-start flex-shrink-0 w-[62%] sm:w-[34%] lg:w-[24%] rounded-2xl bg-white border border-[#e8e9eb] overflow-hidden shadow-sm">
            <div className="relative aspect-[4/3] bg-[#f7f7f8]">
              {p.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.image} alt={p.nom} loading="lazy" className="w-full h-full object-cover" />
              )}
              <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-[#E8B800] text-[11px] font-bold text-black">{p.items?.length ?? 0} guides</span>
              <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-[#e30026] text-[11px] font-bold" style={{ color: "#fff" }}>
                -{Math.round((1 - p.prix / p.originalValeur) * 100)} %
              </span>
            </div>
            <div className="p-3">
              <p className="text-[14px] font-bold leading-snug line-clamp-2">{p.nom}</p>
              <p className="mt-1">
                <span className="text-[16px] font-extrabold text-[#e30026]">{convert(p.prix)}</span>{" "}
                <span className="text-[12px] text-[#a9aeb5] line-through">{convert(p.originalValeur)}</span>
              </p>
              <p className="text-[12px] font-semibold text-[#008f51]">Tu économises {convert(p.originalValeur - p.prix)}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function Grille({ guides, onAcheter }: { guides: Guide[]; onAcheter: Achat }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {guides.map((g) => <CarteGuide key={g.id} guide={g} onAcheter={onAcheter} />)}
    </div>
  );
}

export default function VitrineBoutique({
  guides, categories, temoignages, categorieInitiale, rechercheInitiale,
}: {
  guides: Guide[]; categories: string[]; temoignages: Temoignage[];
  categorieInitiale?: string; rechercheInitiale?: string;
}) {
  const [categorie, setCategorie] = useState(categorieInitiale && categorieInitiale !== "Tous" ? categorieInitiale : "Tous");
  const [recherche, setRecherche] = useState(rechercheInitiale ?? "");
  const [nombreVisible, setNombreVisible] = useState(12);
  const [achat, setAchat] = useState<Guide | null>(null);
  // L'ordre change à chaque visite (après l'affichage initial, pour rester rapide et stable au chargement).
  const [ordre, setOrdre] = useState<string[] | null>(null);
  useEffect(() => {
    const id = requestAnimationFrame(() => setOrdre(melanger(guides.map((g) => g.id))));
    return () => cancelAnimationFrame(id);
  }, [guides]);

  const totalVentes = guides.reduce((s, g) => s + ventesDe(g), 0);
  const plusVendus = useMemo(() => [...guides].sort((a, b) => ventesDe(b) - ventesDe(a)).filter((g) => ventesDe(g) > 0).slice(0, 4), [guides]);
  const idsPlusVendus = new Set(plusVendus.map((g) => g.id));
  const parId = new Map(guides.map((g) => [g.id, g]));
  const ordonnes = ordre ? ordre.map((id) => parId.get(id)!).filter(Boolean) : guides;
  const aDecouvrir = ordonnes.filter((g) => !idsPlusVendus.has(g.id)).slice(0, 4);

  const mots = normaliser(recherche).split(/\s+/).filter((m) => m.length >= 2);
  const filtres = ordonnes.filter((g) =>
    (categorie === "Tous" || g.category === categorie) &&
    mots.every((m) => normaliser(`${g.title} ${g.category}`).includes(m))
  );
  const modeListe = categorie !== "Tous" || mots.length > 0;

  return (
    <div className={`${nunito.className} min-h-screen bg-white text-black`}>
      <EnteteBoutique />

      {/* Bandeau de la boutique */}
      <div style={{ background: "linear-gradient(135deg, #1b7a1b 0%, #27A827 55%, #1f8f1f 100%)" }}>
        <div className="max-w-6xl mx-auto px-4 pt-10 pb-8 lg:pt-14 lg:pb-12">
          <h1 className="text-[24px] lg:text-[32px] font-extrabold leading-tight !text-white">Boutique Smart Life</h1>
          <p className="mt-2 text-[15px] lg:text-[17px] leading-snug max-w-xl" style={{ color: "rgba(255,255,255,0.92)" }}>
            Plus que des guides : un écosystème pour lancer et réussir ton activité en Afrique — le guide, la communauté WhatsApp et des consultants pour t&apos;accompagner.
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-[12px] font-semibold">
            {[`📚 ${guides.length} guides`, "⭐ 14 960+ clients", "🤝 Accompagnement possible"]
              .filter(Boolean).map((t) => (
                <span key={t!} className="px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm" style={{ color: "#fff" }}>{t}</span>
              ))}
          </div>
        </div>
      </div>

      <div className="bg-white border-b border-[#f1f2f3] overflow-hidden">
        <div className="animate-defilement-garanties flex gap-2 py-3 w-max">
          {[...["⚡ Reçu en quelques secondes", "📱 Paiement Mobile Money", "♾️ Accès à vie", "👥 Groupe WhatsApp privé", "💬 Aide sur WhatsApp", "🤝 Accompagnement possible", "🌍 14 960+ clients en Afrique"], ...["⚡ Reçu en quelques secondes", "📱 Paiement Mobile Money", "♾️ Accès à vie", "👥 Groupe WhatsApp privé", "💬 Aide sur WhatsApp", "🤝 Accompagnement possible", "🌍 14 960+ clients en Afrique"]].map((g, i) => (
            <span key={i} className="flex-shrink-0 px-3 py-1.5 rounded-full bg-[#f3fbf6] border border-[#008f51]/15 text-[12px] font-semibold text-[#20252b]">{g}</span>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4">
        {/* Recherche + catégories */}
        <div className="sticky top-[65px] z-30 bg-white pt-4 pb-3 -mx-4 px-4 border-b border-[#f1f2f3]">
          <label className="flex items-center gap-2 h-11 px-3 rounded-xl border border-[#d4d6d7] focus-within:border-[#008f51] bg-white">
            <Search size={17} className="text-[#717882] flex-shrink-0" />
            <input
              value={recherche}
              onChange={(e) => { setRecherche(e.target.value); setNombreVisible(12); }}
              placeholder="Rechercher un guide (poulet, savon, boutique…)"
              className="flex-1 min-w-0 bg-transparent text-[15px] outline-none placeholder:text-[#a9aeb5]"
            />
            {recherche && <button onClick={() => setRecherche("")} aria-label="Effacer"><X size={16} className="text-[#717882]" /></button>}
          </label>
          <div className="mt-3 flex gap-2 overflow-x-auto -mx-4 px-4 pb-1 [scrollbar-width:none]">
            {categories.map((c) => (
              <button key={c} onClick={() => { setCategorie(c); setNombreVisible(12); }}
                className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-[13px] font-semibold border whitespace-nowrap transition-colors ${categorie === c ? "border-[#008f51] bg-[#008f51]" : "border-[#d4d6d7] text-[#20252b] bg-white"}`}
                style={categorie === c ? { color: "#fff" } : {}}>
                {NOMS_COURTS[c] ?? c}
              </button>
            ))}
          </div>
        </div>

        {!modeListe && plusVendus.length > 0 && (
          <ApparitionScroll>
          <section className="mt-6">
            <h2 className="text-[19px] font-bold mb-3">🔥 Les plus vendus</h2>
            <Grille guides={plusVendus} onAcheter={setAchat} />
          </section>
          </ApparitionScroll>
        )}

        {!modeListe && <SectionPacks />}

        {!modeListe && ordre && aDecouvrir.length > 0 && (
          <ApparitionScroll delai={100}>
          <section className="mt-8">
            <h2 className="text-[19px] font-bold mb-1">✨ À découvrir aujourd&apos;hui</h2>
            <p className="text-[13px] text-[#717882] mb-3">Une nouvelle sélection à chaque visite.</p>
            <Grille guides={aDecouvrir} onAcheter={setAchat} />
          </section>
          </ApparitionScroll>
        )}

        {/* Avis clients, remontés pour rassurer tôt */}
        {!modeListe && temoignages.length > 0 && (
          <section className="mt-8 -mx-4 py-8 bg-[#f7f7f8] overflow-hidden">
            <h2 className="px-4 text-[19px] font-bold mb-4">⭐ Ils nous font confiance</h2>
            <div className="flex gap-3 animate-marquee-left" style={{ width: "max-content", animationDuration: "40s" }}>
              {[...temoignages, ...temoignages].map((t, i) => (
                <div key={i} className="w-72 flex-shrink-0 p-4 bg-white rounded-xl border border-[#e8e9eb]">
                  <div className="flex items-center gap-2.5 mb-2">
                    <span className="w-9 h-9 rounded-full bg-[#27A827] flex items-center justify-center text-[13px] font-bold" style={{ color: "#fff" }}>{t.avatar}</span>
                    <div>
                      <p className="text-[14px] font-bold">{t.name}</p>
                      <p className="text-[12px] text-[#008f51] font-semibold">{t.role}</p>
                    </div>
                  </div>
                  <p className="text-[13px] text-[#393c41] leading-relaxed line-clamp-4">{t.content}</p>
                  <p className="mt-2 text-[13px]">{"★".repeat(t.rating)}<span className="text-[#d4d6d7]">{"★".repeat(5 - t.rating)}</span></p>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="mt-8 pb-10">
          <h2 className="text-[19px] font-bold mb-3">
            {modeListe ? `${filtres.length} guide${filtres.length > 1 ? "s" : ""} trouvé${filtres.length > 1 ? "s" : ""}` : "📚 Tous les guides"}
          </h2>
          {filtres.length === 0 ? (
            <p className="py-10 text-center text-[14px] text-[#717882]">Aucun guide ne correspond. Essaie un autre mot.</p>
          ) : (
            <>
              <Grille guides={filtres.slice(0, nombreVisible)} onAcheter={setAchat} />
              {filtres.length > nombreVisible && (
                <button onClick={() => setNombreVisible((n) => n + 12)}
                  className="mt-5 w-full h-11 rounded-xl text-[14px] font-bold cta-respire"
                  style={{ background: "#E8B800", color: "#fff" }}>
                  Voir plus de guides ({filtres.length - nombreVisible})
                </button>
              )}
            </>
          )}
        </section>
      </div>

      {/* Packs */}
      <ApparitionScroll>
      <section className="max-w-6xl mx-auto px-4 py-10">
        <div className="rounded-2xl border border-[#fde68a] bg-[#fffbeb] p-6 text-center">
          <p className="text-[18px] font-bold">📦 3 guides pour le prix de 2</p>
          <p className="mt-1 text-[14px] text-[#393c41]">Économisez jusqu&apos;à 40 % en prenant plusieurs guides ensemble.</p>
          <Link href="/packs" className="mt-4 inline-flex items-center justify-center h-11 px-6 rounded-xl text-[14px] font-bold cta-respire" style={{ background: "#E8B800", color: "#fff" }}>
            Voir les packs
          </Link>
        </div>
      </section>
      </ApparitionScroll>

      <PiedBoutique />

      <a href={`https://wa.me/237694176642?text=${encodeURIComponent("Bonjour Smart Life, j'ai besoin d'aide pour choisir un guide.")}`}
        target="_blank" rel="noopener noreferrer"
        className="fixed bottom-4 right-4 z-40 flex items-center gap-2 h-12 pl-3 pr-4 rounded-full bg-[#25D366] shadow-lg text-[13px] font-bold"
        style={{ color: "#fff" }}>
        <span className="text-[18px]">💬</span> Besoin d&apos;aide pour choisir ?
      </a>

      {achat && (
        <DownloadModal
          ebook={{ id: achat.id, title: achat.title, price: achat.price, cover: achat.cover || achat.banner, originalPrice: achat.originalPrice, ventes: ventesDe(achat) }}
          onClose={() => setAchat(null)}
        />
      )}

    </div>
  );
}
