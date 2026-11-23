"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Infinity as InfiniIcone, MessageCircle } from "lucide-react";
import { PriceTag } from "@/components/PriceTag";
import { lienGroupeWhatsApp } from "@/lib/groupe-whatsapp";

type Pack = { id: string; slug?: string; nom: string; prix: number; originalValeur?: number; image?: string; items?: Array<{ id: string }>; statut?: string };
type Ebook = { id: string; title: string; category: string; price: number; slug?: string; originalPrice?: number; cover?: string };
type GuideVente = Ebook & { ventes?: number; vendusAffiche?: number };

// Bandeau d'accueil de l'espace client : on félicite, on rappelle ce qu'il possède.
export function BienvenueEspace({ prenom, achetes, nbFormations }: { prenom: string; achetes: Ebook[]; nbFormations: number }) {
  const valeur = achetes.reduce((s, e) => s + (e.originalPrice || e.price || 0), 0);
  const groupe = lienGroupeWhatsApp(undefined, achetes[0]?.title ?? "mes guides Smart Life");
  return (
    <div className="relative overflow-hidden rounded-[18px] p-5 sm:p-7 bg-[var(--g-vert-profond)]">
      <p className="relative text-[24px] sm:text-[30px] font-semibold tracking-[-0.02em] leading-tight" style={{ color: "#fff" }}>
        Bienvenue {prenom || "dans ton espace"}
      </p>
      <p className="relative mt-1 text-[14.5px] sm:text-[15.5px]" style={{ color: "rgba(255,255,255,0.85)" }}>
        Tu fais partie des 14 960+ visionnaires africains qui passent à l&apos;action avec Smart Life.
      </p>
      <div className="relative mt-4 grid grid-cols-3 gap-2 text-center">
        {[
          { n: String(achetes.length + nbFormations), l: achetes.length + nbFormations > 1 ? "produits à toi" : "produit à toi" },
          { n: valeur > 0 ? `${Math.round(valeur / 1000)}k` : "—", l: "FCFA de valeur" },
          { n: <InfiniIcone size={26} strokeWidth={2.2} className="mx-auto" aria-label="illimité" />, l: "accès à vie" },
        ].map((c) => (
          <div key={c.l} className="rounded-[12px] px-2 py-3" style={{ border: "1px solid rgba(255,255,255,0.22)" }}>
            <p className="h-[24px] sm:h-[28px] flex items-center justify-center text-[22px] sm:text-[26px] font-semibold tracking-[-0.02em] leading-none tabular-nums" style={{ color: "#fff" }}>{c.n}</p>
            <p className="mt-1 text-[12px]" style={{ color: "rgba(255,255,255,0.8)" }}>{c.l}</p>
          </div>
        ))}
      </div>
      <a href={groupe} target="_blank" rel="noopener noreferrer"
        className="g-btn relative mt-5">
        <MessageCircle size={17} /> Rejoindre le groupe WhatsApp privé
      </a>
    </div>
  );
}

// Recommandations, pack qui complète les achats et appel à l'accompagnement.
export default function EspaceMarketing({ achetes, tous }: { achetes: Ebook[]; tous: GuideVente[] }) {
  const [packs, setPacks] = useState<Pack[]>([]);
  useEffect(() => {
    fetch("/api/packs").then((r) => r.json()).then((d) => setPacks(d.packs || [])).catch(() => {});
  }, []);

  const idsAchetes = new Set(achetes.map((e) => e.id));
  const categories = new Set(achetes.map((e) => e.category));
  const ventes = (g: GuideVente) => g.vendusAffiche ?? g.ventes ?? 0;
  // Seulement les vrais guides de la boutique (les anciens guides d'exemple n'ont pas d'image valide).
  const disponibles = tous.filter((g) => g.id.startsWith("eb-admin") && !idsAchetes.has(g.id) && g.slug && g.cover);
  const memeDomaine = disponibles.filter((g) => categories.has(g.category)).sort((a, b) => ventes(b) - ventes(a));
  const populaires = disponibles.filter((g) => !categories.has(g.category)).sort((a, b) => ventes(b) - ventes(a));
  const recommandes = [...memeDomaine, ...populaires].slice(0, 6);

  const packComplete = packs
    .filter((p) => p.slug && (p.originalValeur ?? 0) > p.prix)
    .map((p) => ({ p, communs: (p.items ?? []).filter((i) => idsAchetes.has(i.id)).length }))
    .sort((a, b) => b.communs - a.communs || ((b.p.originalValeur ?? 0) - b.p.prix) - ((a.p.originalValeur ?? 0) - a.p.prix))[0]?.p;

  return (
    <div className="space-y-8">
      {/* Recommandés */}
      {recommandes.length > 0 && (
        <section>
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[14px] font-semibold text-[var(--g-vert)]">Choisi pour toi</p>
              <h2 className="text-[24px] sm:text-[28px] font-semibold tracking-[-0.02em] text-[var(--g-encre)] leading-tight">
                {memeDomaine.length > 0 ? "Pour aller plus loin dans ton domaine" : "Les guides qui marchent le plus"}
              </h2>
            </div>
            <Link href="/ebooks" className="g-lien flex-shrink-0 text-[14.5px] whitespace-nowrap">Tout voir <ArrowRight size={15} /></Link>
          </div>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {recommandes.map((g) => {
              const remise = g.originalPrice && g.originalPrice > g.price ? Math.round((1 - g.price / g.originalPrice) * 100) : 0;
              return (
                <Link key={g.id} href={`/ebooks/${g.slug}`} className="group flex flex-col overflow-hidden rounded-[14px] bg-white border border-[var(--g-ligne)] transition-colors hover:border-[var(--g-gris-clair)]">
                  <div className="relative aspect-square bg-[#f7f7f8]">
                    <Image src={g.cover!} alt={g.title} fill quality={90} sizes="(max-width: 640px) 50vw, 260px" className="object-contain" />
                    {remise > 0 && (
                      <span className="absolute top-2 right-2 rounded-md px-2 py-0.5 bg-white text-[12px] font-semibold text-[var(--g-vert)]">-{remise} %</span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-3">
                    <p className="text-[14px] font-semibold text-[var(--g-encre)] leading-snug line-clamp-2">{g.title}</p>
                    {ventes(g) > 0 && <p className="mt-1 text-[12.5px] text-[var(--g-gris)] tabular-nums">{ventes(g).toLocaleString("fr-FR")} ventes</p>}
                    <p className="mt-auto pt-2 text-[16px] font-semibold text-[var(--g-encre)] tabular-nums"><PriceTag amount={g.price} /></p>
                    <span className="mt-2 flex items-center justify-center rounded-[10px] py-2 text-[13.5px] font-semibold bg-[var(--g-vert)] transition-colors group-hover:bg-[var(--g-vert-profond)]"
                      style={{ color: "#fff" }}>Je le veux</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Pack qui complète la collection */}
      {packComplete && (
        <Link href={`/packs/${packComplete.slug}`}
          className="group relative flex items-center gap-4 overflow-hidden rounded-[18px] p-4 sm:p-5 bg-[var(--g-jaune-doux)]">
          {packComplete.image && (
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0 overflow-hidden rounded-[12px] bg-white">
              <Image src={packComplete.image} alt={packComplete.nom} fill sizes="112px" className="object-contain" />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-[14px] font-semibold text-[var(--g-vert)]">Complète ta collection</p>
            <p className="mt-1 text-[18px] sm:text-[20px] font-semibold tracking-[-0.02em] text-[var(--g-encre)] leading-tight">{packComplete.nom}</p>
            <p className="mt-1 text-[14px] text-[#3d3a1f]">
              Économise <strong className="font-semibold text-[var(--g-vert)]"><PriceTag amount={(packComplete.originalValeur ?? 0) - packComplete.prix} /></strong> par rapport aux guides achetés un par un.
            </p>
            <span className="g-btn g-btn-noir mt-3 !h-10 !px-4 !text-[14px]">
              Voir le pack <ArrowRight size={15} />
            </span>
          </div>
        </Link>
      )}

      {/* Passer à l'action avec un consultant */}
      <Link href="/accompagnement" className="group relative block overflow-hidden rounded-[18px]" style={{ minHeight: 220 }}>
        <Image src="/consultants-terrain/bureau.webp" alt="Un consultant Smart Life accompagne une entrepreneuse" fill sizes="(max-width: 896px) 100vw, 896px"
          className="object-cover" style={{ objectPosition: "50% 25%" }} />
        <span className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.45) 60%, rgba(0,0,0,0.1) 100%)" }} />
        <div className="relative p-5 sm:p-7 max-w-md">
          <p className="text-[14px] font-semibold" style={{ color: "var(--g-jaune)" }}>Accompagnement</p>
          <p className="mt-1 text-[24px] sm:text-[28px] font-semibold tracking-[-0.02em] leading-tight" style={{ color: "#fff" }}>
            Tu as la méthode. Passe à l&apos;action avec un expert à tes côtés.
          </p>
          <p className="mt-2 text-[14px]" style={{ color: "rgba(255,255,255,0.9)" }}>
            Un consultant du terrain t&apos;aide à lancer ton activité et à éviter les erreurs qui coûtent cher.
          </p>
          <span className="g-btn mt-5">
            Déposer ma candidature gratuite <ArrowRight size={16} />
          </span>
        </div>
      </Link>
    </div>
  );
}
