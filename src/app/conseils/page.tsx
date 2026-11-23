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
    <div className="bg-white">
      <div className="max-w-6xl mx-auto px-4 pt-8 pb-14">
        <p className="text-[14px] font-semibold text-[var(--g-vert)]">Conseils gratuits</p>
        <h1 className="mt-2 text-[30px] sm:text-[42px] font-semibold tracking-[-0.02em] leading-tight text-[var(--g-encre)]">
          Comment se lancer au Cameroun et en Afrique : <span className="g-surligne">nos conseils</span>
        </h1>
        <p className="mt-3 max-w-2xl text-[16px] sm:text-[17px] leading-relaxed text-[var(--g-gris)]">
          Des conseils concrets, métier par métier, pour démarrer votre activité sans perdre d&apos;argent. Et quand vous êtes prêt, le guide complet et un expert du terrain vous attendent.
        </p>
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {cartes.map(({ c, photo, categorie }) => (
            <Link key={c.slug} href={`/conseils/${c.slug}`} className="group flex flex-col overflow-hidden rounded-[14px] bg-white border border-[var(--g-ligne)] hover:border-[var(--g-encre)]/30 transition-colors">
              <div className="relative w-full overflow-hidden" style={{ aspectRatio: "16/10", background: "var(--g-doux)" }}>
                {photo && <Image src={photo} alt={c.titre} fill sizes="(max-width: 640px) 100vw, 380px" className="object-cover" style={{ objectPosition: "50% 25%" }} />}
                {categorie && <span className="absolute top-3 left-3 rounded-[6px] px-2 py-0.5 text-[12px] font-semibold bg-white text-[var(--g-vert)]">{categorie}</span>}
              </div>
              <div className="flex flex-1 flex-col p-4">
                <h2 className="text-[16.5px] font-semibold tracking-[-0.01em] leading-snug text-[var(--g-encre)]">{c.titre}</h2>
                <p className="mt-2 text-[14px] leading-relaxed text-[var(--g-gris)] line-clamp-3">{c.description}</p>
                <span className="mt-auto pt-3 text-[14px] font-semibold text-[var(--g-vert)]">Lire le conseil →</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
