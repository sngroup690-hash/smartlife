import Link from "next/link";
import { Star, ArrowRight, CheckCircle, Shield, Zap, Users, Clock } from "lucide-react";
import { ebooks, testimonials } from "@/lib/data";
import EbookCard from "@/components/EbookCard";
import { readFile, readdir } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

type Photo = { src: string; titre: string };
type EspaceBrut = { id: string; titre: string; actif?: boolean };

const propre = (t: string) =>
  t.normalize("NFKC").replace(/\s*[:—–]\s*(le |la )?guide.*$/i, "").replace(/^[^\p{L}]+/u, "").trim();
const sansAccents = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

async function lireDonnees() {
  const racine = process.cwd();
  const lire = async <T,>(f: string): Promise<T | null> => {
    try { return JSON.parse(await readFile(path.join(racine, "private", f), "utf-8")) as T; } catch { return null; }
  };
  const [ebooksData, espacesData, consultantsData] = await Promise.all([
    lire<{ ebooks?: Array<{ actif?: boolean; deletedAt?: string }>; actif?: Record<string, boolean> }>("ebooks-data.json"),
    lire<EspaceBrut[]>("espaces.json"),
    lire<Array<{ actif?: boolean }>>("consultants.json"),
  ]);
  let fichiers: string[] = [];
  try { fichiers = await readdir(path.join(racine, "public", "espaces")); } catch { /* pas encore de photos */ }
  const espaces = Array.isArray(espacesData) ? espacesData.filter((e) => e.actif !== false) : [];
  const photos: Photo[] = espaces.flatMap((e) => {
    const nom = `${String(e.id).replace(/[^a-zA-Z0-9_-]/g, "_")}.webp`;
    return fichiers.includes(nom) ? [{ src: `/espaces/${nom}`, titre: propre(e.titre) }] : [];
  });
  return {
    photos,
    nbGuides: (ebooksData?.ebooks || []).filter((e) => e.actif !== false && !e.deletedAt).length,
    nbEspaces: espaces.length,
    nbConsultants: Array.isArray(consultantsData) ? consultantsData.filter((c) => c.actif !== false).length : 0,
    actif: ebooksData?.actif || {},
  };
}

export default async function HomePage() {
  const { photos, nbGuides, nbEspaces, nbConsultants, actif } = await lireDonnees();
  const featuredEbooks = ebooks.filter((e) => e.bestseller && actif[e.id] !== false).slice(0, 3);
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
        <div className="max-w-6xl mx-auto px-4 py-9 sm:py-12 grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
          {[
            { n: 14960, s: "+", l: "clients en Afrique et dans la diaspora" },
            { n: nbGuides, s: "", l: "guides pratiques" },
            { n: nbEspaces, s: "", l: "domaines d'accompagnement" },
            { n: nbConsultants, s: "", l: "consultants du terrain" },
          ].filter((c) => c.n > 0).map((c) => (
            <div key={c.l}>
              <p className="text-[34px] sm:text-[44px] font-black leading-none" style={{ color: "#fff" }}>
                <span data-compteur={c.n} data-suffixe={c.s}>{c.n.toLocaleString("fr-FR")}{c.s}</span>
              </p>
              <p className="mt-2 text-[13px] sm:text-[14px] font-semibold" style={{ color: "rgba(255,255,255,0.88)" }}>{c.l}</p>
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
      <section className="py-12 sm:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between gap-4 mb-8">
            <div>
              <p className="text-[12px] font-extrabold uppercase tracking-[0.2em] text-[#E8B800] flex items-center gap-2"><Zap size={14} /> Les plus vendus</p>
              <h2 className="mt-2 text-[28px] sm:text-[38px] font-black text-[#111827] leading-tight">Guides populaires</h2>
            </div>
            <Link href="/ebooks" className="text-[#27A827] hover:gap-2 font-bold text-sm flex items-center gap-1 shrink-0 transition-all">
              Tout voir <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredEbooks.map((ebook) => <EbookCard key={ebook.id} ebook={ebook} />)}
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
          <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-3 text-left">
            {[
              { icone: <Shield size={20} />, titre: "Un expert dédié", texte: "Il vous guide pas à pas" },
              { icone: <Zap size={20} />, titre: "Du concret", texte: "Stratégie, fournisseurs, installation" },
              { icone: <Users size={20} />, titre: "Un réseau", texte: "Des entrepreneurs qui avancent ensemble" },
              { icone: <Clock size={20} />, titre: "Un suivi", texte: "On ne vous lâche pas après le lancement" },
            ].map((b, i) => (
              <div key={b.titre} className="rounded-2xl bg-white p-4 shadow-md border border-[#f1f2f3]">
                <span className="flex items-center justify-center w-10 h-10 rounded-xl shadow" style={{ background: i % 2 === 0 ? "#E8B800" : "#27A827", color: "#fff" }}>{b.icone}</span>
                <p className="mt-3 text-[14px] font-extrabold text-[#111827]">{b.titre}</p>
                <p className="mt-0.5 text-[12.5px] text-[#5c5e62] leading-snug">{b.texte}</p>
              </div>
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
            {photoConsultant && (
              <div className="relative h-[300px] sm:h-[380px]">
                <div className="accueil-flotte absolute inset-0 overflow-hidden rounded-3xl border-4 border-white shadow-2xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photoConsultant.src} alt="Consultant Smart Life sur le terrain" className="w-full h-full object-cover" style={{ objectPosition: "50% 22%" }} />
                </div>
                <div className="accueil-flotte absolute -bottom-3 -left-2 rounded-2xl px-4 py-3 shadow-2xl" style={{ background: "#E8B800", animationDelay: "-2s" }}>
                  <p className="text-[22px] font-black leading-none" style={{ color: "#fff" }}>0 FCFA</p>
                  <p className="text-[12px] font-bold mt-1" style={{ color: "#fff" }}>pour rejoindre le réseau</p>
                </div>
              </div>
            )}
          </div>
        </div>
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
