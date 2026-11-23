import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { readFile } from "fs/promises";
import path from "path";
import { toutesLesAnalyses, PAYS_A_VENIR, type Fait } from "@/lib/analyse-smart";
import { SITE_URL, jsonLd } from "@/lib/seo";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Analyse Smart : quel business lancer maintenant au Cameroun et en Afrique ? | Smart Life",
  description: "Les business d'avenir au Cameroun, analysés à partir des sources officielles (INS, Banque mondiale, FMI, BAD) et des ventes Smart Life. Pourquoi maintenant, risques, pour qui.",
  alternates: { canonical: `${SITE_URL}/analyse-smart` },
};

type GuideMin = { id: string; slug?: string; title: string; cover?: string; price: number };

async function guidesParId(): Promise<Map<string, GuideMin>> {
  try {
    const d = JSON.parse(await readFile(path.join(process.cwd(), "private", "ebooks-data.json"), "utf-8"));
    return new Map((d.ebooks || []).filter((e: { actif?: boolean }) => e.actif !== false).map((e: GuideMin) => [e.id, e]));
  } catch { return new Map(); }
}

const dateFr = (d: string) => {
  const t = new Date(d.length === 7 ? `${d}-01` : d);
  return Number.isNaN(t.getTime()) ? d : t.toLocaleDateString("fr-FR", d.length === 7 ? { month: "long", year: "numeric" } : { day: "numeric", month: "long", year: "numeric" });
};

function Preuve({ f }: { f: Fait }) {
  return (
    <li className="flex gap-2.5 text-[15px] leading-relaxed text-[#2b2f33]">
      <span className="mt-2 h-2 w-2 flex-shrink-0 rounded-full" style={{ background: "var(--g-vert)" }} />
      <span>
        {f.fait}{" "}
        <a href={f.source.url} target="_blank" rel="noopener noreferrer" className="whitespace-nowrap text-[12.5px] font-semibold text-[var(--g-vert)] underline underline-offset-2">
          ({f.source.nom}, {dateFr(f.source.date)})
        </a>
      </span>
    </li>
  );
}

const COULEUR_INVEST: Record<string, { fond: string; texte: string; libelle: string }> = {
  faible: { fond: "var(--g-vert-doux)", texte: "var(--g-vert)", libelle: "Petit budget pour démarrer" },
  moyen: { fond: "var(--g-jaune-doux)", texte: "#7a5c00", libelle: "Budget moyen" },
  "élevé": { fond: "var(--g-doux)", texte: "var(--g-encre)", libelle: "Gros investissement" },
};

export default async function PageAnalyseSmart() {
  const [analyses, guides] = await Promise.all([toutesLesAnalyses(), guidesParId()]);
  const a = analyses.find((x) => x.pays === "Cameroun") ?? analyses[0];

  if (!a) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h1 className="text-[30px] font-semibold tracking-[-0.02em] text-[var(--g-encre)]">Analyse Smart</h1>
        <p className="mt-3 text-[var(--g-gris)]">La première édition arrive très bientôt.</p>
      </div>
    );
  }

  const etiquettes = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `Analyse Smart : les business d'avenir au ${a.pays} (${a.edition})`,
    description: a.resume,
    dateModified: a.miseAJour,
    inLanguage: "fr",
    author: { "@type": "Organization", name: "Smart Life", url: SITE_URL },
    publisher: { "@type": "Organization", name: "Smart Life", logo: { "@type": "ImageObject", url: `${SITE_URL}/logo-smartlife.jpeg` } },
    mainEntityOfPage: `${SITE_URL}/analyse-smart`,
  };

  return (
    <div className="bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(etiquettes) }} />

      {/* En-tête */}
      <header className="relative overflow-hidden bg-[var(--g-vert-profond)]">
        <div className="relative max-w-5xl mx-auto px-4 pt-10 pb-12 sm:pt-14 sm:pb-16">
          <p className="text-[14px] font-semibold text-[var(--g-jaune)]">
            Analyse Smart · Édition {a.edition}
          </p>
          <h1 className="mt-3 text-[30px] sm:text-[46px] font-semibold tracking-[-0.02em] leading-[1.08]" style={{ color: "#fff" }}>
            Quel business lancer maintenant au {a.pays} ?
          </h1>
          <p className="mt-4 max-w-3xl text-[16px] sm:text-[18px] leading-relaxed" style={{ color: "rgba(255,255,255,0.93)" }}>{a.resume}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <span className="rounded-[8px] px-3 py-1.5 text-[13px] font-medium" style={{ background: "rgba(255,255,255,0.12)", color: "#fff" }}>
              {a.sources.length} sources officielles et presse économique
            </span>
            <span className="rounded-[8px] px-3 py-1.5 text-[13px] font-medium" style={{ background: "rgba(255,255,255,0.12)", color: "#fff" }}>
              Mis à jour le {dateFr(a.miseAJour)}
            </span>
          </div>
          {/* Pays */}
          <div className="mt-6 flex flex-wrap gap-2">
            <span className="rounded-[8px] px-3.5 py-1.5 text-[13px] font-semibold" style={{ background: "#fff", color: "var(--g-vert-profond)" }}>{a.pays}</span>
            {PAYS_A_VENIR.map((p) => (
              <span key={p.pays} className="rounded-[8px] px-3.5 py-1.5 text-[13px] font-medium" style={{ color: "rgba(255,255,255,0.75)", border: "1px solid rgba(255,255,255,0.3)" }}>
                {p.pays} · bientôt
              </span>
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-12 space-y-14">
        {/* Contexte */}
        <section>
          <p className="text-[14px] font-semibold text-[var(--g-vert)]">Le contexte</p>
          <h2 className="mt-1 text-[26px] sm:text-[32px] font-semibold tracking-[-0.02em] text-[var(--g-encre)]">Ce que disent les chiffres</h2>
          <ul className="mt-5 space-y-3">{a.contexte.map((f, i) => <Preuve key={i} f={f} />)}</ul>
        </section>

        {/* Signal terrain */}
        <section className="rounded-[18px] p-6 sm:p-8 bg-[var(--g-jaune-doux)]">
          <p className="text-[14px] font-semibold text-[var(--g-vert)]">Notre signal de terrain</p>
          <h2 className="mt-1 text-[22px] sm:text-[26px] font-semibold tracking-[-0.02em] text-[var(--g-encre)]">Ce que nos 14 960+ clients achètent</h2>
          <p className="mt-3 text-[16px] leading-relaxed text-[#2b2f33]">{a.signalTerrain}</p>
        </section>

        {/* Opportunités */}
        <section>
          <p className="text-[14px] font-semibold text-[var(--g-vert)]">Les business d&apos;avenir</p>
          <h2 className="mt-1 text-[26px] sm:text-[32px] font-semibold tracking-[-0.02em] text-[var(--g-encre)]">{a.opportunites.length} opportunités à étudier maintenant</h2>
          <p className="mt-2 text-[15px] text-[var(--g-gris)]">Classées de la plus accessible à la plus lourde à lancer.</p>
          <div className="mt-6 space-y-6">
            {a.opportunites.map((o, i) => {
              const inv = COULEUR_INVEST[o.investissement] ?? COULEUR_INVEST.moyen;
              const lies = o.guidesLies.map((id) => guides.get(id)).filter((g): g is GuideMin => !!g && !!g.slug);
              return (
                <article key={o.id} id={o.id} className="scroll-mt-24 overflow-hidden rounded-[18px] bg-white border border-[var(--g-ligne)]">
                  <div className="flex flex-wrap items-center gap-2 px-5 pt-5 sm:px-7 sm:pt-6">
                    <span className="flex items-center justify-center w-9 h-9 rounded-full text-[15px] font-semibold" style={{ background: "var(--g-encre)", color: "#fff" }}>{i + 1}</span>
                    <span className="rounded-[6px] px-2.5 py-1 text-[12.5px] font-semibold" style={{ background: "var(--g-vert-doux)", color: "var(--g-vert)" }}>{o.secteur}</span>
                    <span className="rounded-[6px] px-2.5 py-1 text-[12.5px] font-semibold" style={{ background: inv.fond, color: inv.texte }}>{inv.libelle}</span>
                  </div>
                  <div className="px-5 pb-6 sm:px-7">
                    <h3 className="mt-3 text-[21px] sm:text-[25px] font-semibold tracking-[-0.02em] leading-tight text-[var(--g-encre)]">{o.titre}</h3>
                    <p className="mt-4 text-[14px] font-semibold text-[var(--g-encre)]">Pourquoi maintenant</p>
                    <ul className="mt-2 space-y-2.5">{o.pourquoiMaintenant.map((f, j) => <Preuve key={j} f={f} />)}</ul>
                    <p className="mt-5 text-[14px] font-semibold text-[var(--g-encre)]">Ce qui a déjà marché</p>
                    <p className="mt-1.5 text-[15px] leading-relaxed text-[#2b2f33]">{o.ceQuiAMarche}</p>
                    <div className="mt-5 grid sm:grid-cols-2 gap-4">
                      <div className="rounded-[12px] p-4 bg-[var(--g-doux)]">
                        <p className="text-[14px] font-semibold text-[var(--g-encre)]">Les risques</p>
                        <ul className="mt-2 space-y-1.5">{o.risques.map((r, j) => <li key={j} className="text-[14px] leading-snug text-[#2b2f33]">• {r}</li>)}</ul>
                      </div>
                      <div className="rounded-[12px] p-4 bg-[var(--g-vert-doux)]">
                        <p className="text-[14px] font-semibold text-[var(--g-vert-profond)]">Pour qui</p>
                        <p className="mt-2 text-[14px] leading-snug text-[#2b2f33]">{o.pourQui}</p>
                      </div>
                    </div>
                    {lies.length > 0 && (
                      <div className="mt-5">
                        <p className="text-[14px] font-semibold text-[var(--g-encre)]">Pour vous lancer</p>
                        <div className="mt-2 grid sm:grid-cols-2 gap-2.5">
                          {lies.map((g) => (
                            <Link key={g.id} href={`/ebooks/${g.slug}`} className="flex items-center gap-3 rounded-[12px] border border-[var(--g-ligne)] p-2.5 transition-colors hover:border-[var(--g-encre)]">
                              {g.cover && (
                                <span className="relative w-12 h-12 flex-shrink-0 overflow-hidden rounded-[8px] bg-[var(--g-doux)]">
                                  <Image src={g.cover} alt={g.title} fill sizes="48px" className="object-contain" />
                                </span>
                              )}
                              <span className="text-[13.5px] font-semibold leading-snug text-[var(--g-encre)] line-clamp-2">{g.title}</span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                    <Link href="/accompagnement" className="g-btn mt-5 text-[15px]">
                      Me faire accompagner sur ce projet →
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* Méthode et sources */}
        <section className="rounded-[18px] bg-[var(--g-doux)] p-6 sm:p-8">
          <h2 className="text-[20px] font-semibold tracking-[-0.02em] text-[var(--g-encre)]">Notre méthode</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-[var(--g-gris)]">{a.methode}</p>
          <h3 className="mt-6 text-[16px] font-semibold tracking-[-0.01em] text-[var(--g-encre)]">Toutes les sources</h3>
          <ol className="mt-2 space-y-1.5">
            {a.sources.map((s, i) => (
              <li key={i} className="text-[13.5px] leading-snug text-[var(--g-gris)]">
                {i + 1}. <a href={s.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-[var(--g-vert)] underline underline-offset-2">{s.nom}</a> — {dateFr(s.date)}
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
