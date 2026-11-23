"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, BookOpen, X, MessageCircle, ArrowRight } from "lucide-react";
import type { Ebook } from "@/lib/data";
import { useCurrencyStore } from "@/lib/currency-store";
import { EnteteBoutique, PiedBoutique } from "./[slug]/ElementsBoutique";
import DownloadModal from "@/components/DownloadModal";
import TitreDefilant from "@/components/TitreDefilant";


type Guide = Ebook & { ventes?: number; vendusAffiche?: number };
type Temoignage = { name: string; role: string; content: string; rating: number; avatar: string };

const NOMS_COURTS: Record<string, string> = {
  Tous: "Tous",
  "Développement Personnel, Compétences & Spiritualité": "Développement perso",
  "Santé, Bien-être & Soins Corporels": "Santé & beauté",
  "Élevage & Dresseurs": "Élevage",
  "Agriculture & Cultures Rentables": "Agriculture",
  "Création d'Entreprises & Commerce Réel": "Commerce & business",
  "Fabrication Artisanale & Transformation": "Fabrication",
  "Business Numérique, IA & Tech": "Numérique & IA",
  "Gestion, Droit & Finance": "Finance & gestion",
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
    <div className="group flex flex-col bg-white">
      <Link href={`/ebooks/${guide.slug}`} className="flex flex-col flex-1 active:scale-[0.99] transition-transform">
      <div className="relative aspect-square rounded-[14px] bg-[var(--g-doux)] flex items-center justify-center overflow-hidden">
        {image && !erreurImage ? (
          <Image src={image} alt={guide.title} fill quality={90}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 300px"
            className="object-contain transition-transform duration-500 group-hover:scale-[1.03]" onError={() => setErreurImage(true)} />
        ) : (
          <BookOpen size={30} className="text-[#a9aeb5]" />
        )}
      </div>
      <div className="pt-3 flex flex-col gap-1 flex-1">
        <h3 className="text-[14px] sm:text-[15.5px] font-semibold leading-snug tracking-[-0.01em] text-[var(--g-encre)] line-clamp-2">{guide.title}</h3>
        {ventes > 0 && <p className="text-[12.5px] text-[var(--g-gris)]">{ventes.toLocaleString("fr-FR")} ventes</p>}
        <div className="mt-auto pt-1 flex flex-wrap items-baseline gap-x-2 tabular-nums">
          <span className="text-[15.5px] sm:text-[17px] font-semibold text-[var(--g-encre)]">{convert(guide.price)}</span>
          {reduction > 0 && <span className="text-[12.5px] text-[var(--g-gris)] line-through">{convert(guide.originalPrice!)}</span>}
          {reduction > 0 && <span className="text-[12.5px] font-semibold text-[var(--g-vert)]">−{reduction} %</span>}
        </div>
      </div>
      </Link>
      <div className="pt-2.5">
        <button onClick={() => onAcheter(guide)}
          className="g-btn w-full !h-10 !text-[14px]">
          Acheter
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
    <section className="mt-12 -mx-4 py-8 bg-[var(--g-jaune-doux)]">
      <div className="px-4 flex items-end justify-between gap-3 mb-3">
        <div>
          <h2 className="text-[24px] sm:text-[28px] font-semibold tracking-[-0.02em]">Packs à prix cassé</h2>
          <p className="text-[14px] text-[var(--g-gris)]">Jusqu&apos;à {convert(maxEco)} d&apos;économie</p>
        </div>
        <Link href="/packs" className="g-lien text-[14.5px] whitespace-nowrap">Tout voir <ArrowRight size={15} /></Link>
      </div>
      <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory px-4 pb-2 [scrollbar-width:none]">
        {packs.map((p) => (
          <Link key={p.slug} href={`/packs/${p.slug}`}
            className="snap-start flex-shrink-0 w-[62%] sm:w-[34%] lg:w-[24%] rounded-[14px] bg-white overflow-hidden">
            <div className="relative aspect-[4/3] bg-[#f7f7f8]">
              {p.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.image} alt={p.nom} loading="lazy" className="w-full h-full object-cover" />
              )}
              <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-white text-[12px] font-semibold text-[var(--g-encre)]">{p.items?.length ?? 0} guides</span>
            </div>
            <div className="p-3">
              <TitreDefilant texte={p.nom} className="text-[15px] font-semibold" />
              <p className="mt-1 tabular-nums">
                <span className="text-[16px] font-semibold text-[var(--g-encre)]">{convert(p.prix)}</span>{" "}
                <span className="text-[12.5px] text-[var(--g-gris)] line-through">{convert(p.originalValeur)}</span>
              </p>
              <p className="text-[13px] font-semibold text-[var(--g-vert)]">Tu économises {convert(p.originalValeur - p.prix)}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function Grille({ guides, onAcheter }: { guides: Guide[]; onAcheter: Achat }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-9 sm:gap-x-6">
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
    <div className="min-h-screen bg-white text-black">
      <EnteteBoutique />

      {/* Bandeau de la boutique */}
      <div className="max-w-6xl mx-auto px-4 pt-10 pb-6 lg:pt-14">
        <h1 className="text-[36px] sm:text-[48px] lg:text-[58px] font-semibold leading-[1.03] tracking-[-0.035em] text-[var(--g-encre)]">
          Boutique <span className="g-surligne">Smart Life</span>
        </h1>
        <p className="mt-4 text-[17px] lg:text-[19px] leading-[1.45] max-w-[46ch] text-[var(--g-gris)]">
          Plus que des guides : un écosystème pour lancer et réussir ton activité en Afrique. Le guide, la communauté WhatsApp et des consultants pour t&apos;accompagner.
        </p>
        <p className="mt-4 text-[14.5px] text-[var(--g-gris)] tabular-nums">
          {guides.length} guides · 14 960 clients · Reçu en quelques secondes · Paiement Mobile Money · Accès à vie · Aide sur WhatsApp
        </p>
      </div>

      <div className="max-w-6xl mx-auto px-4">
        {/* Recherche + catégories */}
        <div className="sticky top-[65px] z-30 bg-white pt-4 pb-3 -mx-4 px-4 border-b border-[var(--g-ligne)]">
          <label className="flex items-center gap-2 h-12 px-3.5 rounded-[10px] bg-[var(--g-doux)] border border-transparent focus-within:border-[var(--g-encre)]">
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
                className={`flex-shrink-0 px-3.5 py-1.5 rounded-[8px] text-[13.5px] font-medium border whitespace-nowrap transition-colors ${categorie === c ? "border-[var(--g-encre)] bg-[var(--g-encre)]" : "border-[var(--g-ligne)] text-[var(--g-encre)] bg-white hover:border-[var(--g-encre)]"}`}
                style={categorie === c ? { color: "#fff" } : {}}>
                {NOMS_COURTS[c] ?? c}
              </button>
            ))}
          </div>
        </div>

        {!modeListe && plusVendus.length > 0 && (
          <ApparitionScroll>
          <section className="mt-10">
            <h2 className="text-[24px] sm:text-[28px] font-semibold tracking-[-0.02em] mb-5">Les plus vendus</h2>
            <Grille guides={plusVendus} onAcheter={setAchat} />
          </section>
          </ApparitionScroll>
        )}

        {!modeListe && <SectionPacks />}

        {!modeListe && ordre && aDecouvrir.length > 0 && (
          <ApparitionScroll delai={100}>
          <section className="mt-14">
            <h2 className="text-[24px] sm:text-[28px] font-semibold tracking-[-0.02em] mb-1">À découvrir aujourd&apos;hui</h2>
            <p className="text-[14.5px] text-[var(--g-gris)] mb-5">Une nouvelle sélection à chaque visite.</p>
            <Grille guides={aDecouvrir} onAcheter={setAchat} />
          </section>
          </ApparitionScroll>
        )}

        {/* Avis clients, remontés pour rassurer tôt */}
        {!modeListe && temoignages.length > 0 && (
          <section className="mt-14 -mx-4 py-10 bg-[var(--g-doux)] overflow-hidden">
            <h2 className="px-4 text-[24px] sm:text-[28px] font-semibold tracking-[-0.02em] mb-5">Ils nous font confiance</h2>
            <div className="flex gap-3 animate-marquee-left" style={{ width: "max-content", animationDuration: "40s" }}>
              {[...temoignages, ...temoignages].map((t, i) => (
                <div key={i} className="w-72 flex-shrink-0 p-5 bg-white rounded-[14px]">
                  <p className="text-[14px] text-[var(--g-jaune)]">{"★".repeat(t.rating)}<span className="text-[var(--g-ligne)]">{"★".repeat(5 - t.rating)}</span></p>
                  <p className="mt-2 text-[14.5px] text-[#2c322e] leading-[1.5] line-clamp-4">{t.content}</p>
                  <div className="mt-3 pt-3 border-t border-[var(--g-ligne)]">
                    <p className="text-[14px] font-semibold">{t.name}</p>
                    <p className="text-[12.5px] text-[var(--g-gris)]">{t.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="mt-14 pb-10">
          <h2 className="text-[24px] sm:text-[28px] font-semibold tracking-[-0.02em] mb-5">
            {modeListe ? `${filtres.length} guide${filtres.length > 1 ? "s" : ""} trouvé${filtres.length > 1 ? "s" : ""}` : "Tous les guides"}
          </h2>
          {filtres.length === 0 ? (
            <p className="py-10 text-center text-[15px] text-[var(--g-gris)]">Aucun guide ne correspond. Essaie un autre mot.</p>
          ) : (
            <>
              <Grille guides={filtres.slice(0, nombreVisible)} onAcheter={setAchat} />
              {filtres.length > nombreVisible && (
                <button onClick={() => setNombreVisible((n) => n + 12)}
                  className="g-btn-ghost mt-8 w-full">
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
        <div className="rounded-[18px] bg-[var(--g-jaune)] p-7 sm:p-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div>
            <p className="text-[24px] sm:text-[30px] font-semibold tracking-[-0.02em] text-[var(--g-encre)]">3 guides pour le prix de 2</p>
            <p className="mt-1 text-[15.5px] text-[#3d3a1f]">Économisez jusqu&apos;à 40 % en prenant plusieurs guides ensemble.</p>
          </div>
          <Link href="/packs" className="g-btn g-btn-noir self-start sm:self-auto">Voir les packs</Link>
        </div>
      </section>
      </ApparitionScroll>

      <PiedBoutique />

      <a href={`https://wa.me/237694176642?text=${encodeURIComponent("Bonjour Smart Life, j'ai besoin d'aide pour choisir un guide.")}`}
        target="_blank" rel="noopener noreferrer"
        className="fixed bottom-4 lg:bottom-5 right-4 z-40 flex items-center gap-2 h-11 pl-3.5 pr-4 rounded-[10px] bg-[var(--g-encre)] shadow-[0_6px_20px_rgba(16,20,16,0.18)] text-[14px] font-semibold"
        style={{ color: "#fff" }}>
        <MessageCircle size={17} /> Besoin d&apos;aide pour choisir ?
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
