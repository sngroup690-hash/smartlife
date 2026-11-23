import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { X } from "lucide-react";
import { notFound } from "next/navigation";
import { PriceTag } from "@/components/PriceTag";
import { conseilParSlug, tousLesConseils, guideLie, photoDuConseil, espaceDuSujet } from "@/lib/conseils";
import { SITE_URL, jsonLd } from "@/lib/seo";

export const revalidate = 3600;

export async function generateStaticParams() {
  return (await tousLesConseils()).map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const c = await conseilParSlug(slug);
  if (!c) return { title: "Conseil introuvable | Smart Life" };
  const guide = await guideLie(c.guideId);
  const photo = await photoDuConseil(c.guideId, guide?.cover, c.titre);
  const url = `${SITE_URL}/conseils/${slug}`;
  return {
    title: `${c.titre} | Smart Life`,
    description: c.description,
    keywords: c.motsCles,
    alternates: { canonical: url },
    openGraph: { type: "article", url, title: c.titre, description: c.description, siteName: "Smart Life", images: photo ? [{ url: `${SITE_URL}${photo.startsWith("/") ? photo : `/${photo}`}` }] : undefined },
    twitter: { card: "summary_large_image", title: c.titre, description: c.description },
  };
}

const ancre = (t: string, i: number) => `partie-${i + 1}-${t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}`;

export default async function PageConseil({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = await conseilParSlug(slug);
  if (!c) notFound();
  const [guide, espace] = await Promise.all([guideLie(c.guideId), espaceDuSujet(c.titre)]);
  const photo = await photoDuConseil(c.guideId, guide?.cover, c.titre);
  const url = `${SITE_URL}/conseils/${slug}`;
  const remise = guide?.originalPrice && guide.originalPrice > guide.price ? Math.round((1 - guide.price / guide.originalPrice) * 100) : 0;
  const autres = (await tousLesConseils()).filter((x) => x.slug !== slug).slice(0, 4);

  const etiquettes = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: c.titre,
      description: c.description,
      inLanguage: "fr",
      image: photo ? `${SITE_URL}${photo.startsWith("/") ? photo : `/${photo}`}` : undefined,
      author: { "@type": "Organization", name: "Smart Life", url: SITE_URL },
      publisher: { "@type": "Organization", name: "Smart Life", logo: { "@type": "ImageObject", url: `${SITE_URL}/logo-smartlife.jpeg` } },
      mainEntityOfPage: url,
      keywords: c.motsCles.join(", "),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Accueil", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Conseils", item: `${SITE_URL}/conseils` },
        { "@type": "ListItem", position: 3, name: c.titre, item: url },
      ],
    },
    ...(c.faq.length ? [{
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: c.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    }] : []),
  ];

  const encartGuide = guide && (
    <Link href={`/ebooks/${guide.slug}`}
      className="group flex items-center gap-4 rounded-[16px] p-4 bg-[var(--g-jaune-doux)]">
      {guide.cover && (
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0 overflow-hidden rounded-[12px] bg-white">
          <Image src={guide.cover} alt={guide.title} fill quality={90} sizes="112px" className="object-contain" />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-[14px] font-semibold text-[var(--g-vert)]">Le guide complet</p>
        <p className="mt-1 text-[16px] font-semibold tracking-[-0.01em] leading-tight text-[var(--g-encre)]">{guide.title}</p>
        <p className="mt-1 flex items-baseline gap-2">
          <span className="text-[18px] font-semibold text-[var(--g-encre)]"><PriceTag amount={guide.price} /></span>
          {remise > 0 && <span className="text-[13px] text-[var(--g-gris)] line-through"><PriceTag amount={guide.originalPrice!} /></span>}
          {(guide.ventes ?? 0) > 0 && <span className="text-[12px] font-semibold text-[var(--g-vert)]">{guide.ventes!.toLocaleString("fr-FR")} ventes</span>}
        </p>
        <span className="mt-2 inline-flex rounded-[10px] px-4 py-2 text-[13px] font-semibold bg-[var(--g-vert)] text-white">
          Voir le guide →
        </span>
      </div>
    </Link>
  );

  return (
    <article className="bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(etiquettes) }} />

      {/* En-tête */}
      <header className="relative overflow-hidden bg-white">
        <div className="max-w-3xl mx-auto px-4 pt-6 pb-8">
          <nav className="text-[12.5px] text-[var(--g-gris)]">
            <Link href="/" className="hover:underline">Accueil</Link> › <Link href="/conseils" className="hover:underline">Conseils</Link>
          </nav>
          <p className="mt-4 text-[14px] font-semibold text-[var(--g-vert)]">Conseil gratuit</p>
          <h1 className="mt-2 text-[28px] sm:text-[38px] font-semibold tracking-[-0.02em] leading-[1.12] text-[var(--g-encre)]">{c.titre}</h1>
          <p className="mt-4 text-[16.5px] sm:text-[18px] leading-relaxed text-[var(--g-gris)]">{c.chapeau}</p>
        </div>
        {photo && (
          <div className="max-w-3xl mx-auto px-4 pb-8">
            <div className="relative w-full overflow-hidden rounded-[16px]" style={{ aspectRatio: "16/9" }}>
              <Image src={photo} alt={c.titre} fill priority sizes="(max-width: 768px) 100vw, 768px" className="object-cover" style={{ objectPosition: "50% 25%" }} />
            </div>
          </div>
        )}
      </header>

      <div className="max-w-3xl mx-auto px-4 pb-14">
        {/* Sommaire */}
        <nav className="rounded-[14px] bg-[var(--g-doux)] p-5">
          <p className="text-[14px] font-semibold text-[var(--g-encre)]">Dans cet article</p>
          <ol className="mt-2 space-y-1.5">
            {c.sections.map((s, i) => (
              <li key={i}><a href={`#${ancre(s.titre, i)}`} className="text-[14.5px] text-[var(--g-vert)] hover:underline">{i + 1}. {s.titre}</a></li>
            ))}
            {c.erreurs.length > 0 && <li><a href="#erreurs" className="text-[14.5px] text-[var(--g-vert)] hover:underline">Les erreurs à éviter</a></li>}
            {c.faq.length > 0 && <li><a href="#questions" className="text-[14.5px] text-[var(--g-vert)] hover:underline">Questions fréquentes</a></li>}
          </ol>
        </nav>

        {/* Parties */}
        {c.sections.map((s, i) => (
          <section key={i} id={ancre(s.titre, i)} className="mt-10 scroll-mt-24">
            <h2 className="text-[22px] sm:text-[26px] font-semibold tracking-[-0.02em] leading-tight text-[var(--g-encre)]">{s.titre}</h2>
            {s.paragraphes.map((p, j) => (
              <p key={j} className="mt-3 text-[16.5px] leading-[1.75] text-[#2b2f33]">{p}</p>
            ))}
            {s.liste && s.liste.length > 0 && (
              <ul className="mt-4 space-y-2">
                {s.liste.map((l, j) => (
                  <li key={j} className="flex gap-2.5 text-[16px] leading-relaxed text-[#2b2f33]">
                    <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full" style={{ background: "var(--g-vert)" }} />
                    {l}
                  </li>
                ))}
              </ul>
            )}
            {i === 2 && encartGuide && <div className="mt-8">{encartGuide}</div>}
          </section>
        ))}

        {/* Erreurs */}
        {c.erreurs.length > 0 && (
          <section id="erreurs" className="mt-12 scroll-mt-24 rounded-[16px] p-5 sm:p-6 bg-[var(--g-doux)]">
            <h2 className="text-[21px] font-semibold tracking-[-0.02em] text-[var(--g-encre)]">Les erreurs à éviter</h2>
            <ul className="mt-3 space-y-2.5">
              {c.erreurs.map((e, i) => (
                <li key={i} className="flex gap-2.5 text-[15.5px] leading-relaxed text-[#2b2f33]"><X size={17} strokeWidth={2.5} className="mt-1 flex-shrink-0 text-[#b42318]" />{e}</li>
              ))}
            </ul>
          </section>
        )}

        {/* Accompagnement */}
        <Link href={espace ? `/accompagnement/${espace.id}` : "/accompagnement"}
          className="group relative mt-12 block overflow-hidden rounded-[18px] p-6 bg-[var(--g-vert-profond)]">
          <p className="text-[14px] font-semibold text-[var(--g-jaune)]">Accompagnement</p>
          <p className="mt-1 text-[21px] sm:text-[24px] font-semibold tracking-[-0.02em] leading-tight" style={{ color: "#fff" }}>
            Vous voulez aller plus vite ? Un expert du terrain vous accompagne.
          </p>
          <p className="mt-2 text-[14.5px]" style={{ color: "rgba(255,255,255,0.92)" }}>
            {espace ? `Programme « ${espace.titre} » : ` : ""}soumettez votre projet, un consultant vous guide du budget au lancement. Candidature gratuite.
          </p>
          <span className="g-btn mt-4">
            Déposer ma candidature gratuite →
          </span>
        </Link>

        {/* Questions */}
        {c.faq.length > 0 && (
          <section id="questions" className="mt-12 scroll-mt-24">
            <h2 className="text-[22px] sm:text-[26px] font-semibold tracking-[-0.02em] text-[var(--g-encre)]">Questions fréquentes</h2>
            <div className="mt-4 space-y-3">
              {c.faq.map((f, i) => (
                <details key={i} className="group rounded-[12px] border border-[var(--g-ligne)] bg-white p-4">
                  <summary className="cursor-pointer list-none text-[15.5px] font-semibold text-[var(--g-encre)] flex justify-between gap-3">
                    {f.q}<span className="text-[var(--g-vert)] group-open:rotate-45 transition-transform">＋</span>
                  </summary>
                  <p className="mt-2 text-[15px] leading-relaxed text-[var(--g-gris)]">{f.a}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        {encartGuide && <div className="mt-12">{encartGuide}</div>}

        {/* Autres conseils */}
        {autres.length > 0 && (
          <section className="mt-14">
            <h2 className="text-[19px] font-semibold tracking-[-0.02em] text-[var(--g-encre)]">D&apos;autres idées de business</h2>
            <div className="mt-3 grid sm:grid-cols-2 gap-3">
              {autres.map((a) => (
                <Link key={a.slug} href={`/conseils/${a.slug}`} className="rounded-[12px] border border-[var(--g-ligne)] p-4 text-[14.5px] font-semibold text-[var(--g-encre)] hover:border-[var(--g-encre)] transition-colors">
                  {a.titre} →
                </Link>
              ))}
            </div>
            <Link href="/conseils" className="g-lien mt-4 text-[14px]">Tous les conseils →</Link>
          </section>
        )}
      </div>
    </article>
  );
}
