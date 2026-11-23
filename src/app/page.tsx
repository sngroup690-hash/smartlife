import Link from "next/link";
import Image from "next/image";
import { Star, ArrowRight, Check, Users, ShoppingBag, ThumbsUp, BookOpen, Compass, Zap } from "lucide-react";

// Une icône par chiffre, dans le même ordre que la liste des chiffres
const ICONES_CHIFFRES = [Users, ShoppingBag, ThumbsUp, BookOpen, Compass, Zap];
import { testimonials } from "@/lib/data";
import { PriceTag } from "@/components/PriceTag";
import PhotosQuiDefilent from "@/components/PhotosQuiDefilent";
import { ETIQUETTES_SITE, jsonLd } from "@/lib/seo";
import { readFile, readdir } from "fs/promises";
import path from "path";

// Accueil servi instantanément depuis une copie prête, renouvelée au plus toutes les 5 minutes
// (les guides populaires et les photos changent rarement : inutile de tout recalculer à chaque visite).
export const revalidate = 300;

// Page d'accueil, style « Galerie » + touche wax (nov. 2026) :
// fond blanc, une grande photo, des lignes fines au lieu de cartes qui flottent,
// une seule couleur (vert forêt), pas de dégradés ni d'émojis, et le motif wax en petites bandes.

type Photo = { src: string; titre: string };
type EspaceBrut = { id: string; titre: string; actif?: boolean };
type GuideBrut = { id: string; slug?: string; title: string; cover?: string; price: number; originalPrice?: number; ventes?: number; actif?: boolean; deletedAt?: string };

const propre = (t: string) =>
  t.normalize("NFKC").replace(/\s*[:—–]\s*(le |la )?guide.*$/i, "").replace(/^[^\p{L}]+/u, "").trim();
const sansAccents = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

async function lireDonnees() {
  const racine = process.cwd();
  const lire = async <T,>(f: string): Promise<T | null> => {
    try { return JSON.parse(await readFile(path.join(racine, "private", f), "utf-8")) as T; } catch { return null; }
  };
  const [ebooksData, espacesData] = await Promise.all([
    lire<{ ebooks?: GuideBrut[] }>("ebooks-data.json"),
    lire<EspaceBrut[]>("espaces.json"),
  ]);
  let fichiers: string[] = [];
  try { fichiers = await readdir(path.join(racine, "public", "espaces")); } catch { /* pas encore de photos */ }
  let photosConsultants: Array<{ src: string; domaine: string }> = [];
  try {
    photosConsultants = JSON.parse(await readFile(path.join(racine, "public", "consultants-terrain", "liste.json"), "utf-8"));
  } catch { /* pas encore créées */ }
  const guidesActifs = (ebooksData?.ebooks || []).filter((e) => e.actif !== false && !e.deletedAt);
  const populaires = [...guidesActifs].filter((g) => g.cover && g.slug).sort((a, b) => (b.ventes || 0) - (a.ventes || 0)).slice(0, 6);
  const espaces = Array.isArray(espacesData) ? espacesData.filter((e) => e.actif !== false) : [];
  const photos: Photo[] = espaces.flatMap((e) => {
    const nom = `${String(e.id).replace(/[^a-zA-Z0-9_-]/g, "_")}.webp`;
    return fichiers.includes(nom) ? [{ src: `/espaces/${nom}`, titre: propre(e.titre) }] : [];
  });
  return { photos, nbGuides: guidesActifs.length, nbEspaces: espaces.length, populaires, photosConsultants };
}

export default async function HomePage() {
  const { photos, nbGuides, nbEspaces, populaires, photosConsultants } = await lireDonnees();
  const trouver = (mot: string, defaut = 0): Photo | undefined =>
    photos.find((p) => sansAccents(p.titre).includes(mot)) ?? photos[defaut];
  const grandePhoto = trouver("palmier", 0);
  const photoConsultant = trouver("topographe", 6);

  const parcours = [
    { href: "/ebooks", titre: "Apprenez la méthode", texte: `${nbGuides || "Des dizaines de"} guides concrets pour lancer et faire tourner votre activité, reçus en quelques secondes.`, bouton: "Voir les guides" },
    { href: "/accompagnement", titre: "Lancez-vous avec un expert", texte: "Un consultant du terrain à vos côtés pour éviter les pièges et réussir plus vite.", bouton: "Être accompagné" },
    { href: "/devenir-consultant", titre: "Partagez votre savoir", texte: "Vous maîtrisez un métier ? Accompagnez des entrepreneurs et rejoignez le réseau Smart Life.", bouton: "Devenir consultant" },
  ];

  const chiffres = [
    { n: 14960, s: "", l: "clients en Afrique et dans la diaspora" },
    { n: 33204, s: "", l: "clients sur notre boutique Chariow" },
    { n: 82, s: " %", l: "d'avis positifs, sur 248 avis" },
    { n: nbGuides || 85, s: "", l: "guides pratiques" },
    { n: nbEspaces || 77, s: "", l: "domaines d'accompagnement" },
    { n: 0, s: "", l: "pour recevoir votre guide après paiement", texte: "Quelques secondes" },
  ];

  const pointsAccompagnement = [
    { titre: "Un expert qui connaît votre métier", texte: "Un consultant qui a déjà fait tourner ce type d'activité, sur le terrain africain.", photo: trouver("restaurant", 7) },
    { titre: "Un plan d'action concret", texte: "Budget, fournisseurs, emplacement, prix de vente : chaque étape est posée noir sur blanc.", photo: trouver("quincaillerie", 8) },
    { titre: "Un réseau qui vous ouvre des portes", texte: "Fournisseurs, clients, autres entrepreneurs : vous n'avancez plus seul.", photo: trouver("alimentation", 9) },
    { titre: "Un suivi après le lancement", texte: "Votre consultant reste à vos côtés pour corriger et faire grandir l'activité.", photo: trouver("coiffure", 10) },
  ];

  return (
    <div className="overflow-x-hidden bg-white text-[var(--g-encre)]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(ETIQUETTES_SITE) }} />

      {/* ══════ EN-TÊTE ══════ */}
      <section className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-16" data-sans-anim>
        {/* Deux halos doux jaune et vert qui flottent lentement derrière le titre */}
        <span aria-hidden="true" className="hero-tache hero-tache-jaune" />
        <span aria-hidden="true" className="hero-tache hero-tache-verte" />
        {/* Décor « avenir meilleur » : soleil levant, activité qui grandit, flèche de croissance */}
        <svg aria-hidden="true" className="hero-avenir" viewBox="0 0 300 280" fill="none">
          <defs>
            <radialGradient id="avenir-soleil" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFD84D" />
              <stop offset="70%" stopColor="#E8B800" />
              <stop offset="100%" stopColor="#E8B800" stopOpacity="0.85" />
            </radialGradient>
            <linearGradient id="avenir-barre" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#27A827" />
              <stop offset="100%" stopColor="#1e7a1e" />
            </linearGradient>
          </defs>
          <g className="avenir-rayons" stroke="#E8B800" strokeWidth="4" strokeLinecap="round" opacity="0.55">
            {Array.from({ length: 12 }).map((_, i) => {
              const a = (i * Math.PI) / 6;
              return <line key={i} x1={190 + Math.cos(a) * 86} y1={120 + Math.sin(a) * 86} x2={190 + Math.cos(a) * 104} y2={120 + Math.sin(a) * 104} />;
            })}
          </g>
          <circle className="avenir-soleil" cx="190" cy="120" r="66" fill="url(#avenir-soleil)" />
          <line x1="14" y1="250" x2="290" y2="250" stroke="#1E2B5E" strokeOpacity="0.18" strokeWidth="3" strokeLinecap="round" />
          {[34, 60, 90, 122, 158].map((h, i) => (
            <rect key={i} className="avenir-barre" style={{ ["--i" as string]: i }} x={38 + i * 46} y={250 - h} width="30" height={h} rx="7" fill="url(#avenir-barre)" />
          ))}
          <path className="avenir-fleche" d="M22 222 C 90 214, 150 170, 196 120 S 262 52, 276 40" stroke="#101410" strokeWidth="5" strokeLinecap="round" />
          <path className="avenir-pointe" d="M256 36 L 280 36 L 280 60" stroke="#101410" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          <g className="avenir-etincelles" fill="#E8B800">
            <path d="M58 70 l4 10 10 4 -10 4 -4 10 -4 -10 -10 -4 10 -4z" />
            <path d="M118 30 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z" />
          </g>
        </svg>
        <p className="hero-apparait relative inline-flex items-center gap-2 rounded-full bg-white/90 border border-[var(--g-ligne)] px-3.5 py-1.5 text-[13.5px] font-medium" style={{ ["--d" as string]: "0ms" }}>
          <span className="point-vivant" aria-hidden="true" />
          14 960+ clients nous font confiance
        </p>
        <h1 className="relative mt-5 text-[40px] sm:text-[60px] lg:text-[76px] font-semibold leading-[1.02] tracking-[-0.035em] max-w-[15ch]">
          {"Votre business en Afrique, de l'idée au".split(" ").map((mot, i) => (
            <span key={i} className="mot-entre" style={{ ["--i" as string]: i }}>{mot} </span>
          ))}
          <span className="mot-entre" style={{ ["--i" as string]: 7 }}><span className="g-surligne surligne-anime">succès.</span></span>
        </h1>
        <div className="relative mt-7 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <p className="hero-apparait text-[18px] sm:text-[20px] leading-[1.45] text-[var(--g-gris)] max-w-[44ch]" style={{ ["--d" as string]: "300ms" }}>
            Des guides pratiques, une communauté de visionnaires et des consultants du terrain pour vous accompagner pas à pas.
          </p>
          <div className="hero-apparait flex flex-wrap gap-2.5" style={{ ["--d" as string]: "380ms" }}>
            <Link href="/ebooks" className="g-btn bouton-reflet relative overflow-hidden">Voir les guides <ArrowRight size={17} className="fleche-cta" /></Link>
            <Link href="/accompagnement" className="g-btn g-btn-vert">Être accompagné <ArrowRight size={17} /></Link>
          </div>
        </div>
        <p className="hero-apparait relative mt-5 text-[14.5px] text-[var(--g-gris)]" style={{ ["--d" as string]: "460ms" }}>
          Paiement Mobile Money · Guide reçu en quelques secondes · Aide sur WhatsApp
        </p>
      </section>

      {/* La grande photo s'affiche tout de suite (c'est le plus grand élément de l'écran : elle décide de la vitesse ressentie) */}
      {grandePhoto && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-9" data-sans-anim>
          <figure className="relative overflow-hidden rounded-t-[18px] aspect-[4/3] sm:aspect-[21/9]">
            <Image src={grandePhoto.src} alt={grandePhoto.titre} fill priority sizes="(max-width: 1200px) 100vw, 1150px" className="object-cover photo-lente" style={{ objectPosition: "50% 30%" }} />
            <figcaption className="legende-glisse absolute left-4 bottom-4 rounded-lg bg-white/95 px-3 py-1.5 text-[13.5px] font-medium">
              Guide · {grandePhoto.titre === grandePhoto.titre.toUpperCase()
                ? grandePhoto.titre.charAt(0) + grandePhoto.titre.slice(1).toLowerCase()
                : grandePhoto.titre}
            </figcaption>
          </figure>
          <div className="bande-wax h-[18px] rounded-b-[18px]" aria-hidden="true" />
        </div>
      )}

      {/* ══════ CHIFFRES ══════ */}
      <section className="bloc-chiffres relative mt-14 overflow-hidden bg-[var(--g-vert-profond)]">
        {/* Lumière jaune douce dans un coin, pour donner de la profondeur au vert */}
        <span aria-hidden="true" className="chiffres-lumiere" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <p className="text-[13px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--g-jaune)" }}>Smart Life en chiffres</p>
          <h2 className="mt-2 text-[26px] sm:text-[34px] font-semibold leading-[1.12] tracking-[-0.025em] max-w-[22ch]" style={{ color: "#fff" }}>
            Des milliers d&apos;entrepreneurs avancent déjà avec nous
          </h2>
          <div className="mt-8 grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {chiffres.map((c, i) => {
              const Icone = ICONES_CHIFFRES[i % ICONES_CHIFFRES.length];
              return (
                <div key={c.l} className="carte-chiffre rounded-[16px] p-4 sm:p-6">
                  <span className="chiffre-icone" aria-hidden="true"><Icone size={20} strokeWidth={2.2} /></span>
                  <p className="mt-4 g-chiffre" style={{ color: i % 2 === 0 ? "#fff" : "var(--g-jaune)" }}>
                    {c.texte ?? <span data-compteur={c.n} data-suffixe={c.s}>{c.n.toLocaleString("fr-FR")}{c.s}</span>}
                  </p>
                  <span className="barre-chiffre mt-3 block h-[3px] w-8 rounded-full bg-[var(--g-jaune)]" aria-hidden="true" />
                  <p className="mt-3 text-[13.5px] sm:text-[14.5px] leading-snug" style={{ color: "rgba(255,255,255,0.85)" }}>{c.l}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════ GUIDES LES PLUS DEMANDÉS ══════ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="g-titre-section">Les guides les plus demandés</h2>
            <p className="mt-2 text-[16px] text-[var(--g-gris)]">Choisis par des milliers d&apos;entrepreneurs, à lire sur votre téléphone.</p>
          </div>
          <Link href="/ebooks" className="g-lien">Tout le catalogue <ArrowRight size={16} /></Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-10 sm:gap-x-7">
          {populaires.map((g) => {
            const remise = g.originalPrice && g.originalPrice > g.price ? Math.round((1 - g.price / g.originalPrice) * 100) : 0;
            return (
              <Link key={g.id} href={`/ebooks/${g.slug}`} className="group carte-guide flex flex-col">
                <div className="carte-guide-image relative overflow-hidden rounded-[14px] aspect-square bg-[var(--g-doux)]">
                  <Image src={g.cover!} alt={g.title} fill quality={90} sizes="(max-width: 1024px) 50vw, 380px" className="object-contain transition-transform duration-500 group-hover:scale-[1.03]" />
                </div>
                <h3 className="mt-3.5 text-[15px] sm:text-[17.5px] font-semibold leading-snug tracking-[-0.01em] line-clamp-2">{g.title}</h3>
                {(g.ventes || 0) > 0 && (
                  <p className="mt-1 text-[13px] sm:text-[14px] text-[var(--g-gris)]">{(g.ventes || 0).toLocaleString("fr-FR")} ventes</p>
                )}
                <p className="mt-2 flex items-baseline gap-x-2.5 gap-y-0.5 flex-wrap tabular-nums">
                  <span className="text-[16px] sm:text-[18px] font-semibold"><PriceTag amount={g.price} /></span>
                  {remise > 0 && <span className="text-[13px] sm:text-[14px] text-[var(--g-gris)] line-through"><PriceTag amount={g.originalPrice!} /></span>}
                  {remise > 0 && <span className="text-[13px] sm:text-[14px] font-semibold text-[var(--g-vert)]">−{remise} %</span>}
                </p>
                <span className="g-lien mt-2.5 text-[14.5px]">Je le veux <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" /></span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ══════ TROIS FAÇONS D'AVANCER ══════ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
        <h2 className="g-titre-section mb-8">Trois façons d&apos;avancer avec Smart Life</h2>
        <div className="border-t border-[var(--g-ligne)]">
          {parcours.map((p) => (
            <Link key={p.href} href={p.href} className="group ligne-parcours grid gap-2 sm:gap-6 sm:grid-cols-[1fr_1.4fr_auto] items-baseline py-7 border-b border-[var(--g-ligne)]">
              <h3 className="text-[22px] sm:text-[26px] font-semibold tracking-[-0.02em]">{p.titre}</h3>
              <p className="text-[16.5px] leading-[1.5] text-[var(--g-gris)]">{p.texte}</p>
              <span className="g-lien whitespace-nowrap">{p.bouton} <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></span>
            </Link>
          ))}
        </div>
      </section>

      {/* ══════ ANALYSE SMART ══════ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
        <Link href="/analyse-smart" className="group grid lg:grid-cols-[1.4fr_1fr] gap-8 items-center rounded-[18px] bg-[var(--g-jaune-doux)] p-7 sm:p-12">
          <div>
            <p className="text-[14px] font-semibold text-[var(--g-vert)]">Nouveau · Analyse Smart</p>
            <h2 className="g-titre-section mt-2">Quel business lancer maintenant au Cameroun ?</h2>
            <p className="mt-3 text-[16.5px] leading-[1.5] text-[var(--g-gris)] max-w-[52ch]">
              Les business d&apos;avenir, analysés à partir des chiffres officiels et de ce que nos clients achètent : pourquoi maintenant, les risques, et pour qui.
            </p>
            <span className="g-btn g-btn-noir mt-6">Lire l&apos;analyse</span>
          </div>
          <ul className="border-t border-[#ecdc9a] text-[16px]">
            {[["Cameroun", "Disponible"], ["Bénin", "Bientôt"], ["Togo", "Bientôt"], ["Côte d'Ivoire", "Bientôt"]].map(([pays, etat], i) => (
              <li key={pays} className="flex items-center justify-between py-3.5 border-b border-[#ecdc9a]">
                <span className={i === 0 ? "font-semibold" : "text-[var(--g-gris)]"}>{pays}</span>
                <span className={`text-[14px] ${i === 0 ? "font-semibold text-[var(--g-vert)]" : "text-[var(--g-gris)]"}`}>{etat}</span>
              </li>
            ))}
          </ul>
        </Link>
      </section>

      {/* ══════ ACCOMPAGNEMENT ══════ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
        <div className="max-w-[46rem]">
          <p className="text-[14px] font-semibold text-[var(--g-vert)]">Programme d&apos;accompagnement</p>
          <h2 className="g-titre-section mt-2">Évitez les pièges du terrain avec un expert dédié</h2>
          <p className="mt-3 text-[17px] leading-[1.5] text-[var(--g-gris)]">
            Un plan d&apos;affaires ne suffit pas. Profitez de l&apos;expérience de ceux qui sont passés avant vous.
          </p>
        </div>
        <div className="mt-10 grid gap-x-7 gap-y-9 sm:grid-cols-2 lg:grid-cols-4">
          {pointsAccompagnement.map((b) => (
            <div key={b.titre}>
              {b.photo && (
                <div className="carte-photo relative aspect-[4/3] overflow-hidden rounded-[12px] bg-[var(--g-doux)]">
                  {/* Photos larges recadrées en 4/3 : on demande une version assez grande pour rester nette (sinon floue en 2 colonnes) */}
                  <Image src={b.photo.src} alt="" fill sizes="(max-width: 640px) 92vw, (max-width: 1024px) 62vw, 480px" className="object-cover" style={{ objectPosition: "50% 25%" }} />
                </div>
              )}
              <h3 className="mt-4 text-[17.5px] font-semibold leading-snug tracking-[-0.01em]">{b.titre}</h3>
              <p className="mt-1.5 text-[15px] leading-[1.5] text-[var(--g-gris)]">{b.texte}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
          <Link href="/accompagnement" className="g-btn">Déposer ma candidature gratuite</Link>
          <p className="text-[14.5px] text-[var(--g-gris)]">Candidature gratuite · Réponse sous 48 h · Places limitées par domaine</p>
        </div>
      </section>

      {/* ══════ DEVENIR CONSULTANT ══════ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center rounded-[18px] bg-[var(--g-vert-doux)] p-6 sm:p-10">
          <div>
            <p className="text-[14px] font-semibold text-[var(--g-vert)]">Rejoignez le réseau</p>
            <h2 className="g-titre-section mt-2">Devenez consultant Smart Life</h2>
            <p className="mt-3 text-[17px] leading-[1.5] text-[var(--g-gris)]">
              Votre expérience et votre nom ont de la valeur. Transmettez-les et faites-en une source de revenus, en accompagnant des entrepreneurs dans votre domaine.
            </p>
            <ul className="mt-6 border-t border-[var(--g-ligne)]">
              {["Commissions sur chaque accompagnement", "Formation et certification offertes", "Outils et soutien de l'équipe Smart Life", "Vous travaillez à votre rythme", "0 FCFA pour rejoindre le réseau"].map((t) => (
                <li key={t} className="flex items-center gap-3 py-3 border-b border-[var(--g-ligne)] text-[16px]">
                  <Check size={18} className="text-[var(--g-vert)] shrink-0" strokeWidth={2.5} /> {t}
                </li>
              ))}
            </ul>
            <Link href="/devenir-consultant" className="g-btn mt-7" style={{ background: "var(--g-vert)", color: "#fff" }}>Candidature gratuite</Link>
          </div>
          {(photosConsultants.length > 0 || photoConsultant) && (
            <div>
              <div className="relative h-[320px] sm:h-[440px] overflow-hidden rounded-t-[18px]">
                <PhotosQuiDefilent
                  photos={photosConsultants.length > 0 ? photosConsultants.map((p) => p.src) : [photoConsultant!.src]}
                  legendes={photosConsultants.map((p) => p.domaine)}
                  alt="Un consultant Smart Life accompagne un entrepreneur sur le terrain" />
              </div>
              <div className="bande-wax h-[18px] rounded-b-[18px]" aria-hidden="true" />
            </div>
          )}
        </div>

        {photosConsultants.length >= 6 && (
          <div className="mt-16">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <p className="text-[19px] sm:text-[22px] font-semibold tracking-[-0.015em]">Des consultants dans tous les domaines</p>
              <Link href="/nos-consultants" className="g-lien">Trouver le vôtre <ArrowRight size={16} /></Link>
            </div>
          </div>
        )}
      </section>
      {photosConsultants.length >= 6 && (
        <div className="mt-6 overflow-hidden" data-sans-anim>
          <div className="flex w-max gap-4 defile-gauche" style={{ animationDuration: `${photosConsultants.length * 5}s` }}>
            {[...photosConsultants, ...photosConsultants].map((p, i) => (
              <Link key={i} href="/nos-consultants" aria-hidden={i >= photosConsultants.length ? true : undefined} tabIndex={i >= photosConsultants.length ? -1 : undefined}
                className="block w-56 sm:w-72 flex-shrink-0">
                <span className="relative block h-40 sm:h-48 overflow-hidden rounded-[12px] bg-[var(--g-doux)]">
                  <Image src={p.src} alt={`Consultant en ${p.domaine}`} fill sizes="288px" className="object-cover" style={{ objectPosition: "50% 22%" }} />
                </span>
                <span className="mt-2 block text-[14px] font-medium text-[var(--g-gris)] truncate">{p.domaine}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ══════ AVIS ══════ */}
      <section className="pt-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="g-titre-section">Ils nous font confiance</h2>
            <p className="mt-2 text-[16px] text-[var(--g-gris)]">Plus de 14 960 clients en Afrique et dans la diaspora</p>
          </div>
          <Link href="/temoignages" className="g-lien">Voir tous les avis <ArrowRight size={16} /></Link>
        </div>
        <div className="relative overflow-hidden py-1" data-sans-anim>
          <div className="flex gap-4 animate-marquee-left" style={{ width: "max-content", animationDuration: "50s" }}>
            {[...testimonials, ...testimonials, ...testimonials].map((t, i) => (
              <div key={i} className="flex-shrink-0 w-80 p-6 bg-white rounded-[14px] border border-[var(--g-ligne)] flex flex-col gap-3">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} size={14} className={j < t.rating ? "fill-[var(--g-jaune)] text-[var(--g-jaune)]" : "text-[var(--g-ligne)]"} />
                  ))}
                </div>
                <p className="text-[15px] leading-[1.5] text-[#2c322e] line-clamp-4">{t.content}</p>
                <p className="mt-auto pt-3 border-t border-[var(--g-ligne)] text-[14px] font-semibold truncate">{t.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════ APPEL FINAL ══════ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <div className="rounded-[18px] bg-[var(--g-jaune)] overflow-hidden">
          <div className="p-8 sm:p-12 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-7">
            <div>
              <h2 className="g-titre-section max-w-[16ch]">Prêt à passer à l&apos;action ?</h2>
              <p className="mt-2 text-[16.5px] text-[#3d3a1f]">Rejoignez plus de 14 960 clients qui avancent avec Smart Life.</p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <Link href="/ebooks" className="g-btn g-btn-noir">Acheter un guide</Link>
              <Link href="/accompagnement" className="g-btn-ghost bg-white shadow-none">Être accompagné</Link>
              <Link href="/devenir-consultant" className="g-btn-ghost bg-white shadow-none">Devenir consultant</Link>
            </div>
          </div>
          <div className="bande-wax h-[18px]" aria-hidden="true" />
        </div>
      </section>
    </div>
  );
}
