import Link from "next/link";
import Image from "next/image";
import { Star, ArrowRight, CheckCircle, Shield, Zap, Users, Clock } from "lucide-react";
import { testimonials } from "@/lib/data";
import { PriceTag } from "@/components/PriceTag";
import TitreDefilant from "@/components/TitreDefilant";
import PhotosQuiDefilent from "@/components/PhotosQuiDefilent";
import { readFile, readdir } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

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
  const mosaique = [trouver("palmier", 0), trouver("alimentation", 1), trouver("evenement", 2), trouver("coiffure", 3)].filter(Boolean) as Photo[];
  const photoGuides = trouver("epice", 4);
  const photoAccompagnement = trouver("restaurant", 5);
  const photoConsultant = trouver("topographe", 6);
  const rangee1 = photos.slice(0, Math.ceil(photos.length / 2));
  const rangee2 = photos.slice(Math.ceil(photos.length / 2));

  const parcours = [
    { href: "/ebooks", photo: photoGuides, etiquette: "📚 Guides pratiques", couleur: "#27A827", titre: "Apprenez la méthode", texte: `${nbGuides || "Des dizaines de"} guides concrets pour lancer et faire tourner votre activité.`, bouton: "Voir les guides" },
    { href: "/accompagnement", photo: photoAccompagnement, etiquette: "🤝 Accompagnement", couleur: "#E8B800", titre: "Lancez-vous avec un expert", texte: "Un consultant du terrain à vos côtés pour éviter les pièges et réussir plus vite.", bouton: "Déposer ma candidature" },
    { href: "/devenir-consultant", photo: photoConsultant, etiquette: "🚀 Devenir consultant", couleur: "#27A827", titre: "Partagez votre savoir", texte: "Accompagnez des entrepreneurs dans votre domaine et rejoignez le réseau Smart Life.", bouton: "Rejoindre le réseau" },
  ];

  return (
    <div className="overflow-x-hidden">

      {/* ══════ EN-TÊTE PREMIUM ══════ */}
      <section className="relative overflow-hidden" style={{ background: "linear-gradient(160deg, #fffdf3 0%, #ffffff 45%, #f1fcf3 100%)" }}>
        <span className="accueil-bulle" style={{ top: "-120px", left: "-100px", background: "#E8B800" }} />
        <span className="accueil-bulle" style={{ bottom: "-140px", right: "-120px", background: "#27A827", animationDelay: "-6s" }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12 lg:pt-16 lg:pb-20 grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          <div>
            <p className="accueil-entree inline-flex items-center gap-2.5 rounded-full bg-white px-3 py-1.5 shadow-md border border-[#f1f2f3]">
              <span className="flex -space-x-2">
                {["M", "J", "A", "S"].map((l, i) => (
                  <span key={l} className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-black"
                    style={{ background: i % 2 === 0 ? "#E8B800" : "#27A827", color: "#fff" }}>{l}</span>
                ))}
              </span>
              <span className="text-[12.5px] font-semibold text-[#393c41]">
                <span className="text-[#E8B800]">★★★★★</span> Rejoint par <strong className="text-[#111827]">14 960+</strong> clients
              </span>
            </p>
            <h1 className="accueil-entree mt-5 text-[34px] sm:text-[48px] lg:text-[58px] font-black leading-[1.05] tracking-tight text-[#111827]" style={{ animationDelay: "0.1s" }}>
              Votre business en Afrique,{" "}
              <span className="texte-brillant">de l&apos;idée au succès.</span>
            </h1>
            <p className="accueil-entree mt-4 text-[16px] sm:text-[18px] leading-relaxed text-[#393c41] max-w-xl" style={{ animationDelay: "0.2s" }}>
              Des guides pratiques, une communauté de visionnaires et des consultants du terrain pour vous accompagner pas à pas.
            </p>
            <div className="accueil-entree mt-7 flex flex-col sm:flex-row gap-3" style={{ animationDelay: "0.3s" }}>
              <Link href="/ebooks" className="bouton-reflet cta-respire relative overflow-hidden inline-flex items-center justify-center gap-2 h-14 px-7 rounded-2xl text-[16px] font-extrabold shadow-xl"
                style={{ background: "linear-gradient(135deg, #27A827, #1b7a1b)", color: "#fff", boxShadow: "0 14px 30px -12px #27A827" }}>
                📚 Voir les guides <ArrowRight size={18} className="fleche-cta" />
              </Link>
              <Link href="/accompagnement" className="bouton-reflet relative overflow-hidden inline-flex items-center justify-center gap-2 h-14 px-7 rounded-2xl text-[16px] font-extrabold shadow-xl"
                style={{ background: "linear-gradient(135deg, #E8B800, #d4a300)", color: "#fff", boxShadow: "0 14px 30px -12px #E8B800" }}>
                🤝 Être accompagné
              </Link>
            </div>
            <Link href="/devenir-consultant" className="accueil-entree mt-3 inline-flex items-center gap-1.5 text-[14px] font-bold text-[#1e7a1e] hover:gap-2.5 transition-all" style={{ animationDelay: "0.35s" }}>
              🚀 Vous êtes expert ? Devenez consultant <ArrowRight size={15} />
            </Link>
            <div className="accueil-entree mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[13px] font-semibold text-[#393c41]" style={{ animationDelay: "0.4s" }}>
              {["Paiement Mobile Money", "Guide reçu en quelques secondes", "Aide sur WhatsApp"].map((t) => (
                <span key={t} className="inline-flex items-center gap-1.5"><CheckCircle size={15} className="text-[#27A827]" /> {t}</span>
              ))}
            </div>
          </div>

          {/* Mosaïque de vraies photos qui flottent */}
          {mosaique.length >= 4 && (
            <div className="relative h-[360px] sm:h-[460px] lg:h-[540px]">
              {[
                { s: { left: "0%", top: "6%", width: "56%", height: "52%" }, d: "0s" },
                { s: { right: "0%", top: "0%", width: "41%", height: "40%" }, d: "-1.5s" },
                { s: { right: "3%", bottom: "2%", width: "52%", height: "50%" }, d: "-3s" },
                { s: { left: "5%", bottom: "0%", width: "38%", height: "35%" }, d: "-4.5s" },
              ].map((c, i) => (
                <figure key={i} className="accueil-flotte absolute overflow-hidden rounded-3xl border-4 border-white shadow-2xl" style={{ ...c.s, animationDelay: c.d }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={mosaique[i].src} alt={mosaique[i].titre} className="w-full h-full object-cover" style={{ objectPosition: "50% 22%" }} />
                  <figcaption className="absolute bottom-2 left-2 right-2 truncate rounded-full px-2.5 py-1 text-[10.5px] font-bold shadow"
                    style={{ background: "rgba(255,255,255,0.92)", color: "#111827" }}>{mosaique[i].titre}</figcaption>
                </figure>
              ))}
              <div className="accueil-flotte absolute left-[38%] top-[44%] rounded-2xl px-3.5 py-2.5 shadow-2xl" style={{ background: "rgba(255,255,255,0.94)", backdropFilter: "blur(8px)", animationDelay: "-2s" }}>
                <p className="text-[11px] font-semibold text-[#5c5e62]">Clients satisfaits</p>
                <p className="text-[20px] font-black text-[#27A827] leading-none mt-0.5">14 960+</p>
              </div>
              <div className="accueil-flotte absolute right-[2%] top-[38%] rounded-2xl px-3 py-2 shadow-2xl" style={{ background: "#E8B800", animationDelay: "-3.5s" }}>
                <p className="text-[12px] font-extrabold" style={{ color: "#fff" }}>⚡ Reçu en quelques secondes</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ══════ CHIFFRES CLÉS ══════ */}
      <section className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #1b7a1b 0%, #27A827 55%, #1f8f1f 100%)" }}>
        <span className="accueil-bulle" style={{ top: "-180px", left: "30%", background: "#E8B800", opacity: 0.25 }} />
        <div className="relative max-w-6xl mx-auto px-4 py-10 sm:py-14 grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 text-center">
          {[
            { icone: "🌍", n: 14960, s: "+", l: "clients en Afrique et dans la diaspora" },
            { icone: "🛍️", n: 33204, s: "+", l: "clients sur notre boutique Chariow" },
            { icone: "⭐", n: 82, s: " %", l: "d'avis positifs · 248 avis au total" },
            { icone: "📚", n: nbGuides || 85, s: "", l: "guides pratiques" },
            { icone: "🤝", n: nbEspaces || 77, s: "", l: "domaines d'accompagnement" },
            { icone: "⚡", n: 0, s: "", l: "guide reçu en quelques secondes", texte: "Instantané" },
          ].map((c, i) => (
            <div key={c.l} className="garantie-boutique rounded-[1.75rem] px-3 py-5 sm:py-6"
              style={{ background: "rgba(255,255,255,0.12)", border: "1.5px solid rgba(255,255,255,0.28)", backdropFilter: "blur(6px)", animationDelay: `${i * 0.3}s` }}>
              <span className="mx-auto flex items-center justify-center w-11 h-11 rounded-full text-[22px] shadow-lg" style={{ background: i % 2 === 0 ? "#E8B800" : "#ffffff" }}>{c.icone}</span>
              <p className="mt-3 text-[28px] sm:text-[40px] font-black leading-none" style={{ color: "#fff" }}>
                {c.texte ?? <span data-compteur={c.n} data-suffixe={c.s}>{c.n.toLocaleString("fr-FR")}{c.s}</span>}
              </p>
              <p className="mt-2 text-[12px] sm:text-[14px] font-semibold leading-snug" style={{ color: "rgba(255,255,255,0.9)" }}>{c.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════ 3 PARCOURS ══════ */}
      <section className="py-12 sm:py-16" style={{ background: "#faf9f5" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <p className="text-center text-[12px] font-extrabold uppercase tracking-[0.2em] text-[#27A827]">Votre chemin</p>
          <h2 className="mt-2 text-center text-[28px] sm:text-[38px] font-black text-[#111827] leading-tight">
            Choisissez votre <span className="texte-brillant">parcours</span>
          </h2>
          <p className="mt-2 text-center text-[15px] text-[#5c5e62]">Trois façons de réussir avec Smart Life</p>
          <div className="mt-9 grid gap-5 sm:grid-cols-3">
            {parcours.map((p) => (
              <Link key={p.href} href={p.href} className="group relative block h-[380px] overflow-hidden rounded-3xl shadow-xl">
                {p.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.photo.src} alt={p.titre} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    style={{ objectPosition: "50% 22%", transformOrigin: "50% 100%" }} />
                ) : (
                  <span className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${p.couleur}, #111827)` }} />
                )}
                <span className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.45) 45%, rgba(0,0,0,0.05) 75%)" }} />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <span className="inline-block rounded-full px-3 py-1 text-[11.5px] font-extrabold shadow" style={{ background: p.couleur, color: "#fff" }}>{p.etiquette}</span>
                  <h3 className="mt-3 text-[24px] font-black leading-tight" style={{ color: "#fff" }}>{p.titre}</h3>
                  <p className="mt-1.5 text-[14px] leading-snug" style={{ color: "rgba(255,255,255,0.88)" }}>{p.texte}</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-[14px] font-extrabold transition-all group-hover:gap-3"
                    style={{ background: "#fff", color: "#111827" }}>
                    {p.bouton} <ArrowRight size={16} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══════ GUIDES POPULAIRES ══════ */}
      <section className="relative py-12 sm:py-16 overflow-hidden" style={{ background: "linear-gradient(180deg, #ffffff 0%, #fffbea 100%)" }}>
        <span className="accueil-bulle" style={{ top: "20%", right: "-160px", background: "#E8B800", opacity: 0.2 }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-9">
            <p className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[12px] font-extrabold uppercase tracking-[0.15em] shadow-sm" style={{ background: "#E8B800", color: "#fff" }}>
              <Zap size={14} /> Les plus vendus
            </p>
            <h2 className="mt-3 text-[28px] sm:text-[40px] font-black text-[#111827] leading-tight">
              Les guides que tout le monde <span className="texte-brillant">s&apos;arrache</span>
            </h2>
            <p className="mt-2 text-[15px] text-[#5c5e62] max-w-xl mx-auto">Choisis par des milliers d&apos;entrepreneurs. Reçus en quelques secondes, à lire sur ton téléphone.</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {populaires.map((g, i) => {
              const remise = g.originalPrice && g.originalPrice > g.price ? Math.round((1 - g.price / g.originalPrice) * 100) : 0;
              return (
                <Link key={g.id} href={`/ebooks/${g.slug}`} className="group relative flex flex-col overflow-hidden rounded-3xl bg-white shadow-lg border border-[#f1f2f3]">
                  <div className="relative overflow-hidden aspect-square" style={{ background: "#f7f7f8" }}>
                    <Image src={g.cover!} alt={g.title} fill quality={90} sizes="(max-width: 1024px) 50vw, 400px" className="object-contain" />
                    {i < 3 && (
                      <span className="absolute top-2 left-2 rounded-full px-2.5 py-1 text-[10.5px] sm:text-[11.5px] font-black shadow-md" style={{ background: "#111827", color: "#fff" }}>
                        {["🥇 N°1", "🥈 N°2", "🥉 N°3"][i]} des ventes
                      </span>
                    )}
                    {remise > 0 && (
                      <span className="cta-clignote absolute top-2 right-2 rounded-full px-2.5 py-1 text-[11px] sm:text-[12px] font-black shadow-md" style={{ background: "#e30026", color: "#fff" }}>-{remise} %</span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-3 sm:p-4">
                    <TitreDefilant texte={g.title} className="text-[13px] sm:text-[15px] font-extrabold text-[#111827]" />
                    {(g.ventes || 0) > 0 && (
                      <p className="mt-1.5 text-[12px] sm:text-[13px] font-semibold text-[#b45309]">🔥 {(g.ventes || 0).toLocaleString("fr-FR")} ventes</p>
                    )}
                    <div className="mt-auto pt-2.5">
                      <p className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-[17px] sm:text-[20px] font-black text-[#e30026]"><PriceTag amount={g.price} /></span>
                        {remise > 0 && <span className="text-[12px] sm:text-[13px] text-[#a9aeb5] line-through"><PriceTag amount={g.originalPrice!} /></span>}
                      </p>
                      <span className="bouton-reflet relative overflow-hidden mt-2.5 flex items-center justify-center gap-1.5 h-10 sm:h-11 rounded-2xl text-[13px] sm:text-[14px] font-extrabold transition-transform group-hover:scale-[1.02]"
                        style={{ background: "#27A827", color: "#fff" }}>
                        ⚡ Je le veux <ArrowRight size={15} className="fleche-cta" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
          <div className="text-center mt-9">
            <Link href="/ebooks" className="bouton-reflet cta-respire relative overflow-hidden inline-flex items-center gap-2 h-14 px-8 rounded-2xl text-[16px] font-extrabold shadow-xl"
              style={{ background: "#E8B800", color: "#fff", boxShadow: "0 14px 30px -12px #E8B800" }}>
              Voir tout le catalogue <ArrowRight size={18} className="fleche-cta" />
            </Link>
          </div>
        </div>
      </section>

      {/* ══════ ACCOMPAGNEMENT ══════ */}
      <section className="py-12 sm:py-16 overflow-hidden" style={{ background: "linear-gradient(180deg, #fffbea 0%, #f0fdf4 100%)" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-[12px] font-extrabold uppercase tracking-[0.2em] text-[#b38f00]">Programme d&apos;accompagnement</p>
          <h2 className="mt-2 text-[28px] sm:text-[38px] font-black text-[#111827] leading-tight">
            Évitez les pièges du terrain avec un <span className="texte-brillant">expert dédié</span>
          </h2>
          <p className="mt-3 text-[15px] text-[#5c5e62] max-w-2xl mx-auto">
            Un plan d&apos;affaires ne suffit pas. Profitez de l&apos;expérience de ceux qui sont passés avant vous.
          </p>
          <div className="mt-9 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
            {[
              { icone: <Shield size={18} />, titre: "Un expert qui connaît votre métier", texte: "Un consultant qui a déjà fait tourner ce type d'activité, sur le terrain africain.", photo: trouver("restaurant", 7) },
              { icone: <Zap size={18} />, titre: "Un plan d'action concret", texte: "Budget, fournisseurs, emplacement, prix de vente : chaque étape est posée noir sur blanc.", photo: trouver("quincaillerie", 8) },
              { icone: <Users size={18} />, titre: "Un réseau qui vous ouvre des portes", texte: "Fournisseurs, clients, autres entrepreneurs : vous n'avancez plus seul.", photo: trouver("alimentation", 9) },
              { icone: <Clock size={18} />, titre: "Un suivi après le lancement", texte: "Votre consultant reste à vos côtés pour corriger et faire grandir l'activité.", photo: trouver("coiffure", 10) },
            ].map((b, i) => (
              <div key={b.titre} className="group overflow-hidden rounded-[1.75rem] bg-white shadow-lg border border-[#f1f2f3] transition-transform hover:-translate-y-1.5">
                <div className="relative h-32 overflow-hidden">
                  {b.photo && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b.photo.src} alt="" loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" style={{ objectPosition: "50% 22%", transformOrigin: "50% 100%" }} />
                  )}
                  <span className="absolute inset-0" style={{ background: `linear-gradient(to top, ${i % 2 === 0 ? "rgba(232,184,0,0.75)" : "rgba(39,168,39,0.75)"}, transparent 70%)` }} />
                  <span className="absolute bottom-2 left-3 text-[34px] font-black leading-none" style={{ color: "#fff", textShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>0{i + 1}</span>
                  <span className="absolute bottom-2.5 right-3 flex items-center justify-center w-9 h-9 rounded-full shadow-lg" style={{ background: "#fff", color: i % 2 === 0 ? "#b38f00" : "#1e7a1e" }}>{b.icone}</span>
                </div>
                <div className="p-4">
                  <p className="text-[15px] font-extrabold text-[#111827] leading-snug">{b.titre}</p>
                  <p className="mt-1.5 text-[13px] text-[#5c5e62] leading-snug">{b.texte}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-2.5">
            {["✅ Candidature gratuite", "⏱️ Réponse sous 48 h", "🎯 Places limitées par domaine"].map((t) => (
              <span key={t} className="rounded-full bg-white px-4 py-2 text-[13px] font-bold text-[#20252b] shadow-md border border-[#f1f2f3]">{t}</span>
            ))}
          </div>
        </div>

        {/* Deux rangées de vraies photos d'activités qui défilent en sens inverse */}
        {photos.length >= 8 && (
          <div className="mt-10 space-y-3" data-sans-anim>
            {[{ l: rangee1, c: "defile-gauche" }, { l: rangee2, c: "defile-droite" }].map((r, k) => (
              <div key={k} className="overflow-hidden">
                <div className={`flex w-max gap-3 ${r.c}`}>
                  {[...r.l, ...r.l].map((p, i) => (
                    <Link key={i} href="/accompagnement" aria-hidden={i >= r.l.length ? true : undefined} tabIndex={i >= r.l.length ? -1 : undefined}
                      className="relative block w-52 sm:w-64 h-32 sm:h-40 flex-shrink-0 overflow-hidden rounded-2xl shadow-lg">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.src} alt={p.titre} loading="lazy" className="w-full h-full object-cover" style={{ objectPosition: "50% 22%" }} />
                      <span className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.75), transparent 60%)" }} />
                      <span className="absolute bottom-2 left-2.5 right-2.5 text-[12px] font-extrabold leading-tight line-clamp-2" style={{ color: "#fff" }}>{p.titre}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-10 text-center px-4">
          <Link href="/accompagnement" className="bouton-reflet cta-clignote relative overflow-hidden inline-flex items-center gap-2 h-14 px-8 rounded-2xl text-[16px] font-extrabold shadow-xl"
            style={{ background: "linear-gradient(135deg, #E8B800, #27A827)", color: "#fff" }}>
            Déposer ma candidature gratuite <ArrowRight size={18} className="fleche-cta" />
          </Link>
          <p className="mt-3 text-[13px] text-[#5c5e62]">Places limitées · Candidature étudiée sous 48 h</p>
        </div>
      </section>

      {/* ══════ DEVENIR CONSULTANT ══════ */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-8 items-center rounded-[2rem] p-6 sm:p-10 shadow-xl" style={{ background: "linear-gradient(135deg, #f0fdf4, #ffffff 60%, #fffbea)", border: "2px solid #27A827" }}>
            <div>
              <p className="text-[12px] font-extrabold uppercase tracking-[0.2em] text-[#27A827]">Rejoignez le réseau</p>
              <h2 className="mt-2 text-[28px] sm:text-[38px] font-black text-[#111827] leading-tight">
                Devenez <span className="texte-brillant">consultant</span> Smart Life
              </h2>
              <p className="mt-3 text-[15px] text-[#393c41] leading-relaxed">
                Partagez votre savoir et accompagnez des entrepreneurs dans votre domaine d&apos;expertise.
              </p>
              <p className="mt-4 rounded-2xl px-4 py-3 text-[15px] sm:text-[16px] font-bold leading-snug" style={{ background: "#fffbea", borderLeft: "5px solid #E8B800", color: "#111827" }}>
                💡 Votre <span className="text-[#c99a00]">expérience</span> et votre <span className="text-[#1e7a1e]">nom</span> ont de la valeur.{" "}
                <span className="text-[#e30026]">Ne les gâchez pas</span> : transmettez-les et faites-en une source de revenus.
              </p>
              <ul className="mt-5 space-y-2.5">
                {["Commissions sur chaque accompagnement", "Formation et certification offertes", "Outils et soutien de l'équipe Smart Life", "Vous travaillez à votre rythme"].map((t) => (
                  <li key={t} className="flex items-start gap-2 text-[14.5px] text-[#20252b]"><CheckCircle size={18} className="text-[#27A827] mt-0.5 shrink-0" /> {t}</li>
                ))}
              </ul>
              <Link href="/devenir-consultant" className="bouton-reflet btn-postuler relative overflow-hidden mt-7 inline-flex items-center gap-2 h-14 px-7 rounded-2xl text-[16px] font-extrabold"
                style={{ background: "#27A827", color: "#fff" }}>
                Candidature gratuite <ArrowRight size={18} className="fleche-cta" />
              </Link>
            </div>
            {(photosConsultants.length > 0 || photoConsultant) && (
              <div className="relative h-[300px] sm:h-[400px]">
                <div className="accueil-flotte absolute inset-0 overflow-hidden rounded-3xl border-4 border-white shadow-2xl">
                  <PhotosQuiDefilent
                    photos={photosConsultants.length > 0 ? photosConsultants.map((p) => p.src) : [photoConsultant!.src]}
                    legendes={photosConsultants.map((p) => p.domaine)}
                    alt="Un consultant Smart Life accompagne un entrepreneur sur le terrain" />
                </div>
                <div className="accueil-flotte absolute -bottom-3 -left-2 rounded-2xl px-4 py-3 shadow-2xl" style={{ background: "#E8B800", animationDelay: "-2s" }}>
                  <p className="text-[22px] font-black leading-none" style={{ color: "#fff" }}>0 FCFA</p>
                  <p className="text-[12px] font-bold mt-1" style={{ color: "#fff" }}>pour rejoindre le réseau</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Des consultants dans tous les domaines : bande continue, sans répétition visible */}
        {photosConsultants.length >= 6 && (
          <div className="mt-10">
            <p className="text-center text-[15px] sm:text-[17px] font-extrabold text-[#111827] px-4">
              Des consultants dans <span className="texte-brillant">tous les domaines</span> : trouvez le vôtre
            </p>
            <div className="mt-5 overflow-hidden" data-sans-anim>
              <div className="flex w-max gap-3 defile-gauche" style={{ animationDuration: `${photosConsultants.length * 5}s` }}>
                {[...photosConsultants, ...photosConsultants].map((p, i) => (
                  <Link key={i} href="/nos-consultants" aria-hidden={i >= photosConsultants.length ? true : undefined} tabIndex={i >= photosConsultants.length ? -1 : undefined}
                    className="relative block w-56 sm:w-72 h-40 sm:h-48 flex-shrink-0 overflow-hidden rounded-3xl shadow-lg">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.src} alt={`Consultant en ${p.domaine}`} loading="lazy" className="w-full h-full object-cover" style={{ objectPosition: "50% 22%" }} />
                    <span className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent 55%)" }} />
                    <span className="absolute bottom-2.5 left-3 right-3 text-[13px] font-extrabold leading-tight" style={{ color: "#fff" }}>{p.domaine}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ══════ AVIS ══════ */}
      <section className="py-12 sm:py-16 overflow-hidden" style={{ background: "#faf9f5" }}>
        <div className="text-center mb-9 px-4">
          <p className="text-[12px] font-extrabold uppercase tracking-[0.2em] text-[#27A827]">Avis clients</p>
          <h2 className="mt-2 text-[28px] sm:text-[38px] font-black text-[#111827]">Ils nous font <span className="texte-brillant">confiance</span></h2>
          <p className="mt-2 text-[15px] text-[#5c5e62]">Plus de 14 960 clients en Afrique et dans la diaspora</p>
        </div>
        <div className="relative overflow-hidden py-2" data-sans-anim>
          <div className="flex gap-4 animate-marquee-left" style={{ width: "max-content", animationDuration: "40s" }}>
            {[...testimonials, ...testimonials, ...testimonials].map((t, i) => (
              <div key={i} className="relative flex-shrink-0 w-80 p-5 bg-white rounded-3xl flex flex-col gap-3 shadow-lg border border-[#f1f2f3]">
                <span className="absolute -top-1 right-4 text-[54px] font-black leading-none" style={{ color: "#E8B800", opacity: 0.35 }}>&ldquo;</span>
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} size={14} className={j < t.rating ? "fill-[#E8B800] text-[#E8B800]" : "text-gray-300"} />
                  ))}
                </div>
                <p className="text-[14px] text-[#393c41] leading-relaxed line-clamp-4">{t.content}</p>
                <div className="flex items-center gap-3 mt-auto pt-2 border-t border-[#f1f2f3]">
                  <span className="w-9 h-9 rounded-full flex items-center justify-center font-black text-[13px] shrink-0" style={{ background: "#27A827", color: "#fff" }}>{t.avatar}</span>
                  <p className="text-[14px] font-bold text-[#111827] truncate">{t.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="text-center mt-8 px-4">
          <Link href="/temoignages" className="text-[#27A827] font-bold text-sm inline-flex items-center gap-1 hover:gap-2 transition-all">
            Voir tous les avis <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* ══════ APPEL FINAL ══════ */}
      <section className="py-12 sm:py-16 bg-white px-4">
        <div className="relative max-w-4xl mx-auto overflow-hidden rounded-[2rem] px-6 py-10 sm:px-12 sm:py-14 text-center shadow-2xl"
          style={{ background: "linear-gradient(135deg, #1b7a1b 0%, #27A827 50%, #b8a000 100%)" }}>
          <span className="accueil-bulle" style={{ top: "-160px", right: "-120px", background: "#E8B800" }} />
          <h2 className="relative text-[28px] sm:text-[40px] font-black leading-tight" style={{ color: "#fff" }}>Prêt à passer à l&apos;action ?</h2>
          <p className="relative mt-3 text-[15px] sm:text-[17px] max-w-xl mx-auto" style={{ color: "rgba(255,255,255,0.92)" }}>
            Rejoignez plus de 14 960 clients qui avancent avec Smart Life.
          </p>
          <div className="relative mt-7 flex flex-col sm:flex-row justify-center gap-3">
            <Link href="/ebooks" className="bouton-reflet relative overflow-hidden inline-flex items-center justify-center h-13 px-7 py-3.5 rounded-2xl text-[15px] font-extrabold shadow-lg" style={{ background: "#fff", color: "#1b7a1b" }}>
              📚 Acheter un guide
            </Link>
            <Link href="/accompagnement" className="cta-respire inline-flex items-center justify-center px-7 py-3.5 rounded-2xl text-[15px] font-extrabold shadow-lg" style={{ background: "#E8B800", color: "#fff" }}>
              🤝 Être accompagné
            </Link>
            <Link href="/devenir-consultant" className="inline-flex items-center justify-center px-7 py-3.5 rounded-2xl text-[15px] font-extrabold border-2" style={{ borderColor: "#fff", color: "#fff" }}>
              🚀 Devenir consultant
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
