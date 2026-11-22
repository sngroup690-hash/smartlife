import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { tousLesConseils, guideLie, photoDuConseil } from "@/lib/conseils";
import { SITE_URL } from "@/lib/seo";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Idées de business au Cameroun et en Afrique : nos conseils gratuits pour se lancer | Smart Life",
  description: "Élevage, agriculture, commerce, transformation : nos conseils gratuits et concrets pour lancer votre activité au Cameroun et en Afrique, étape par étape.",
  alternates: { canonical: `${SITE_URL}/conseils` },
};

export default async function PageConseils() {
  const conseils = await tousLesConseils();
  const cartes = await Promise.all(conseils.map(async (c) => {
    const guide = await guideLie(c.guideId);
    return { c, photo: await photoDuConseil(c.guideId, guide?.cover, c.titre), categorie: guide?.category ?? "" };
  }));

  return (
    <div style={{ background: "linear-gradient(180deg, #fffdf3 0%, #ffffff 30%)" }}>
      <div className="max-w-6xl mx-auto px-4 pt-8 pb-14">
        <p className="inline-flex rounded-full px-3 py-1 text-[12px] font-extrabold" style={{ background: "#27A827", color: "#fff" }}>Conseils gratuits</p>
        <h1 className="mt-3 text-[30px] sm:text-[42px] font-black leading-tight text-[#111827]">
          Comment se lancer au Cameroun et en Afrique : <span className="texte-brillant">nos conseils</span>
        </h1>
        <p className="mt-3 max-w-2xl text-[16px] sm:text-[17px] leading-relaxed text-[#393c41]">
          Des conseils concrets, métier par métier, pour démarrer votre activité sans perdre d&apos;argent. Et quand vous êtes prêt, le guide complet et un expert du terrain vous attendent.
        </p>
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {cartes.map(({ c, photo, categorie }) => (
            <Link key={c.slug} href={`/conseils/${c.slug}`} className="group flex flex-col overflow-hidden rounded-3xl bg-white shadow-lg border border-[#f1f2f3]">
              <div className="relative w-full overflow-hidden" style={{ aspectRatio: "16/10", background: "#f7f7f8" }}>
                {photo && <Image src={photo} alt={c.titre} fill sizes="(max-width: 640px) 100vw, 380px" className="object-cover transition-transform duration-700 group-hover:scale-105" style={{ objectPosition: "50% 25%", transformOrigin: "50% 100%" }} />}
                {categorie && <span className="absolute top-3 left-3 rounded-full px-2.5 py-1 text-[11px] font-bold shadow" style={{ background: "#27A827", color: "#fff" }}>{categorie}</span>}
              </div>
              <div className="flex flex-1 flex-col p-4">
                <h2 className="text-[16.5px] font-black leading-snug text-[#111827]">{c.titre}</h2>
                <p className="mt-2 text-[14px] leading-relaxed text-[#5c5e62] line-clamp-3">{c.description}</p>
                <span className="mt-auto pt-3 text-[14px] font-extrabold text-[#1e7a1e]">Lire le conseil →</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
