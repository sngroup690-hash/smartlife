import Link from "next/link";
import { Star, ArrowRight, BookOpen, CheckCircle, TrendingUp, Users, Shield, Zap, Clock } from "lucide-react";
import { ebooks, testimonials } from "@/lib/data";
import { espaces as domainesAccompagnement } from "@/lib/accompagnement-data";
import EbookCard from "@/components/EbookCard";
import { readFile } from "fs/promises";
import path from "path";
import HeroBgSlider from "@/components/HeroBgSlider";
import AnimatedHero from "@/components/AnimatedHero";
import AnimateOnScroll, { StaggerContainer, StaggerItem, AnimatedCounter, Tilt3DCard, FloatingElement, ParallaxSection } from "@/components/AnimateOnScroll";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let actifMap: Record<string, boolean> = {};
  try {
    const raw = await readFile(path.join(process.cwd(), "private", "ebooks-data.json"), "utf-8");
    actifMap = (JSON.parse(raw).actif as Record<string, boolean>) || {};
  } catch { /* file may not exist yet */ }
  const featuredEbooks = ebooks.filter((e) => e.bestseller && actifMap[e.id] !== false).slice(0, 3);

  return (
    <div className="overflow-x-hidden">

      {/* ══════ HERO ANIMÉ ══════ */}
      <section className="relative min-h-[60vh] sm:min-h-[80vh] flex items-center">
        <HeroBgSlider />
        <AnimatedHero />
      </section>

      {/* ══════ CHIFFRES CLÉS ══════ */}
      <section className="py-6 sm:py-10 border-b border-gray-200 bg-white">
        <StaggerContainer className="max-w-5xl mx-auto px-4" staggerDelay={0.15}>
          <div className="grid grid-cols-3 gap-4">
            <StaggerItem>
              <div className="text-center">
                <div className="text-xl sm:text-3xl font-black text-[#27A827]">
                  <AnimatedCounter value={15000} suffix="+" />
                </div>
                <div className="text-gray-500 text-[11px] sm:text-sm mt-1">Ebooks vendus</div>
              </div>
            </StaggerItem>
            <StaggerItem>
              <div className="text-center">
                <div className="text-xl sm:text-3xl font-black text-[#27A827]">
                  <AnimatedCounter value={7} suffix="" />
                </div>
                <div className="text-gray-500 text-[11px] sm:text-sm mt-1">Entrepreneurs accompagnés</div>
              </div>
            </StaggerItem>
            <StaggerItem>
              <div className="text-center">
                <div className="text-xl sm:text-3xl font-black text-[#E8B800]">⚡</div>
                <div className="text-gray-500 text-[11px] sm:text-sm mt-1">Livraison instantanée</div>
              </div>
            </StaggerItem>
          </div>
        </StaggerContainer>
      </section>

      {/* ══════ 3 PARCOURS ══════ */}
      <section className="py-8 sm:py-12 bg-[#f4f3f0]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <AnimateOnScroll variant="fadeUp">
            <h2 className="text-center text-2xl sm:text-3xl font-black text-gray-900 mb-2">
              Choisissez votre <span className="text-[#27A827]">parcours</span>
            </h2>
            <p className="text-center text-gray-500 text-sm mb-8">
              3 façons de créer de la valeur avec Smart Life
            </p>
          </AnimateOnScroll>

          <StaggerContainer className="grid gap-4 sm:grid-cols-3 sm:gap-6" staggerDelay={0.15}>

            {/* EBOOKS */}
            <StaggerItem>
              <Tilt3DCard>
              <Link href="/ebooks" className="group bg-white rounded-2xl p-5 sm:p-7 border-2 border-[#27A827]/20 hover:border-[#27A827] shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col h-full">
                <div className="flex items-start gap-4 sm:flex-col">
                  <div className="w-12 h-12 rounded-xl bg-[#27A827]/15 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <BookOpen size={22} className="text-[#27A827]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[#27A827] text-xs font-bold uppercase tracking-wide mb-1">Ebooks &amp; Guides</p>
                    <h3 className="text-gray-900 font-bold text-lg leading-tight mb-2">
                      Montez en compétences
                    </h3>
                    <p className="text-gray-500 text-sm mb-3 hidden sm:block">
                      Guides pratiques en IA, marketing digital, business et productivité.
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <span className="text-[#1e8c1e] font-bold text-sm bg-[#27A827]/8 px-3 py-1 rounded-full">
                    Dès 3 500 FCFA
                  </span>
                  <span className="text-[#27A827] font-bold text-sm flex items-center gap-1 group-hover:gap-2 transition-all duration-300">
                    Voir <ArrowRight size={14} />
                  </span>
                </div>
              </Link>
              </Tilt3DCard>
            </StaggerItem>

            {/* ACCOMPAGNEMENT */}
            <StaggerItem>
              <Tilt3DCard>
              <Link href="/accompagnement" className="group bg-white rounded-2xl p-5 sm:p-7 border-2 border-[#E8B800]/20 hover:border-[#E8B800] shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col h-full">
                <div className="flex items-start gap-4 sm:flex-col">
                  <div className="w-12 h-12 rounded-xl bg-[#E8B800]/15 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <TrendingUp size={22} className="text-[#E8B800]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[#E8B800] text-xs font-bold uppercase tracking-wide mb-1">Accompagnement</p>
                    <h3 className="text-gray-900 font-bold text-lg leading-tight mb-2">
                      Lancez votre business
                    </h3>
                    <p className="text-gray-500 text-sm mb-3 hidden sm:block">
                      Saisissez l&apos;expertise de nos consultants pour éviter les pièges du terrain.
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <span className="text-[#E8B800] font-bold text-sm bg-[#E8B800]/10 px-3 py-1 rounded-full">
                    Sur candidature
                  </span>
                  <span className="text-[#E8B800] font-bold text-sm flex items-center gap-1 group-hover:gap-2 transition-all duration-300">
                    Postuler <ArrowRight size={14} />
                  </span>
                </div>
              </Link>
              </Tilt3DCard>
            </StaggerItem>

            {/* DEVENIR CONSULTANT */}
            <StaggerItem>
              <Tilt3DCard>
              <Link href="/devenir-consultant" className="group bg-white rounded-2xl p-5 sm:p-7 border-2 border-[#27A827]/20 hover:border-[#27A827] shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col h-full">
                <div className="flex items-start gap-4 sm:flex-col">
                  <div className="w-12 h-12 rounded-xl bg-[#27A827]/15 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <Users size={22} className="text-[#27A827]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[#27A827] text-xs font-bold uppercase tracking-wide mb-1">Devenir Consultant</p>
                    <h3 className="text-gray-900 font-bold text-lg leading-tight mb-2">
                      Partagez votre savoir
                    </h3>
                    <p className="text-gray-500 text-sm mb-3 hidden sm:block">
                      Contribuez à un monde meilleur en accompagnant des entrepreneurs.
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <span className="text-[#1e8c1e] font-bold text-sm bg-[#27A827]/8 px-3 py-1 rounded-full">
                    Gratuit
                  </span>
                  <span className="text-[#27A827] font-bold text-sm flex items-center gap-1 group-hover:gap-2 transition-all duration-300">
                    Rejoindre <ArrowRight size={14} />
                  </span>
                </div>
              </Link>
              </Tilt3DCard>
            </StaggerItem>
          </StaggerContainer>
        </div>
      </section>

      {/* ══════ EBOOKS POPULAIRES ══════ */}
      <section className="py-8 sm:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimateOnScroll variant="fadeUp">
            <div className="flex items-end justify-between gap-4 mb-8">
              <div>
                <p className="text-[#27A827] font-bold text-sm flex items-center gap-2 mb-2">
                  <Zap size={14} /> Les plus vendus
                </p>
                <h2 className="text-2xl sm:text-3xl font-black text-gray-900">
                  Ebooks populaires
                </h2>
              </div>
              <Link href="/ebooks" className="text-[#27A827] hover:text-[#1a7a1a] font-bold text-sm flex items-center gap-1 shrink-0">
                Tout voir <ArrowRight size={14} />
              </Link>
            </div>
          </AnimateOnScroll>

          <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6" staggerDelay={0.12}>
            {featuredEbooks.map((ebook) => (
              <StaggerItem key={ebook.id}>
                <EbookCard ebook={ebook} />
              </StaggerItem>
            ))}
          </StaggerContainer>

          <AnimateOnScroll variant="fadeUp" delay={0.3}>
            <div className="text-center mt-8">
              <Link
                href="/ebooks"
                className="cta-glow inline-flex items-center gap-2 px-8 py-4 bg-[#27A827] hover:bg-[#1e8c1e] text-white font-bold rounded-xl transition-all duration-300 shadow-md hover:shadow-lg hover:scale-[1.05]"
              >
                Voir tout le catalogue <ArrowRight size={18} />
              </Link>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* ══════ ACCOMPAGNEMENT ══════ */}
      <section className="py-8 sm:py-14 bg-gradient-to-br from-[#E8B800]/5 to-[#27A827]/5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <AnimateOnScroll variant="fadeUp">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#E8B800]/15 rounded-full text-[#C49A00] text-xs font-bold mb-4">
                <TrendingUp size={12} /> Programme d&apos;accompagnement
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-3">
                Évitez les pièges du terrain avec un <span style={{ color: "#E8B800" }}>expert dédié</span>
              </h2>
              <p className="text-gray-500 text-sm max-w-lg mx-auto">
                Connaître les pièges d&apos;un business ne se limite pas à avoir un plan d&apos;affaires. Profitez de l&apos;expertise de ceux qui sont passés avant vous.
              </p>
            </div>
          </AnimateOnScroll>

          <StaggerContainer className="grid sm:grid-cols-2 gap-4 mb-8" staggerDelay={0.1}>
            {[
              { icon: <Shield size={18} />, title: "Accompagnement personnalisé", desc: "Un expert dédié qui vous guide pas à pas" },
              { icon: <Zap size={18} />, title: "Résultats concrets", desc: "Stratégie, sourcing, installation et suivi" },
              { icon: <Users size={18} />, title: "Réseau d'entrepreneurs", desc: "Rejoignez une communauté qui avance ensemble" },
              { icon: <Clock size={18} />, title: "Suivi continu", desc: "On ne vous lâche pas après le lancement" },
            ].map((item) => (
              <StaggerItem key={item.title}>
                <div className="flex items-start gap-3 p-4 rounded-xl bg-white border border-gray-200 hover:border-[#E8B800]/40 hover:shadow-md transition-all duration-300">
                  <div className="w-9 h-9 rounded-lg bg-[#E8B800]/15 flex items-center justify-center text-[#E8B800] shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-gray-900 font-bold text-sm">{item.title}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{item.desc}</p>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>

          <AnimateOnScroll variant="fadeIn" delay={0.2}>
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {domainesAccompagnement.slice(0, 6).map((d) => (
                <span key={d.id} className="px-3 py-1.5 bg-white text-gray-700 text-xs font-medium rounded-full border border-gray-200 hover:border-[#E8B800]/40 hover:bg-[#E8B800]/5 transition-colors duration-200 shadow-sm">
                  {d.icone} {d.titre.length > 25 ? d.titre.slice(0, 25) + "…" : d.titre}
                </span>
              ))}
              {domainesAccompagnement.length > 6 && (
                <span className="px-3 py-1.5 bg-[#E8B800]/15 text-[#C49A00] text-xs font-bold rounded-full border border-[#E8B800]/30">
                  +{domainesAccompagnement.length - 6} domaines
                </span>
              )}
            </div>
          </AnimateOnScroll>

          <AnimateOnScroll variant="scaleUp" delay={0.3}>
            <div className="text-center">
              <Link
                href="/accompagnement"
                className="cta-shimmer cta-pulse inline-flex items-center gap-2 px-8 py-4 text-black font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.05] text-base"
              >
                Postuler maintenant <ArrowRight size={18} />
              </Link>
              <p className="text-gray-500 text-xs mt-3">Places limitées · Candidature étudiée sous 48h</p>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* ══════ DEVENIR CONSULTANT ══════ */}
      <section className="py-8 sm:py-14">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <AnimateOnScroll variant="scaleUp">
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-[#27A827]/30 rounded-3xl p-6 sm:p-10">
              <div className="grid sm:grid-cols-2 gap-8 items-center">
                <div>
                  <p className="text-[#27A827] text-xs font-bold uppercase tracking-wide mb-2">Rejoignez le réseau</p>
                  <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-3">
                    Devenez <span className="text-[#27A827]">Consultant</span> Smart Life
                  </h2>
                  <p className="text-gray-600 text-sm mb-5">
                    Partagez votre savoir et contribuez à un monde meilleur en accompagnant des entrepreneurs dans votre domaine d&apos;expertise.
                  </p>
                  <ul className="space-y-2.5 mb-6">
                    {[
                      "Commissions sur chaque accompagnement",
                      "Formation et certification offerte",
                      "Outils et support de l'équipe Smart Life",
                      "Flexibilité totale — travaillez à votre rythme",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2 text-gray-700 text-sm">
                        <CheckCircle size={16} className="text-[#27A827] mt-0.5 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/devenir-consultant"
                    className="btn-postuler inline-flex items-center gap-2 px-6 py-3.5 bg-[#27A827] hover:bg-[#1e8c1e] text-white font-bold rounded-xl transition-all duration-300 shadow-md hover:shadow-lg hover:scale-[1.05]"
                  >
                    Candidature gratuite <ArrowRight size={16} />
                  </Link>
                </div>
                <div className="hidden sm:flex flex-col items-center justify-center">
                  <FloatingElement duration={3} distance={10}>
                  <div className="text-7xl mb-4">💼</div>
                  <div className="text-center">
                    <div className="text-4xl font-black text-[#27A827] mb-1">0 FCFA</div>
                    <p className="text-gray-500 text-sm font-bold">pour rejoindre le réseau</p>
                  </div>
                  </FloatingElement>
                </div>
              </div>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* ══════ TÉMOIGNAGES ══════ */}
      <section className="py-8 sm:py-14 bg-gray-50 overflow-hidden">
        <AnimateOnScroll variant="fadeUp">
          <div className="text-center mb-10 px-4">
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2">
              Ils nous font <span className="text-[#27A827]">confiance</span>
            </h2>
            <p className="text-gray-500 text-sm">Plus de 15 000 ebooks vendus</p>
          </div>
        </AnimateOnScroll>

        <AnimateOnScroll variant="fadeIn" delay={0.2}>
          <div className="relative overflow-hidden py-2">
            <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-gray-50 to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-gray-50 to-transparent z-10 pointer-events-none" />

            <div
              className="flex gap-4 animate-marquee-left"
              style={{ width: "max-content", animationDuration: "35s" }}
            >
              {[...testimonials, ...testimonials, ...testimonials].map((t, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-72 p-4 bg-white border border-gray-200 rounded-2xl flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow duration-300"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#27A827]/15 flex items-center justify-center text-[#1e8c1e] font-bold text-sm shrink-0">
                      {t.avatar}
                    </div>
                    <div className="min-w-0">
                      <p className="text-gray-900 font-bold text-sm truncate">{t.name}</p>
                      <div className="flex gap-0.5 mt-0.5">
                        {[...Array(5)].map((_, j) => (
                          <Star key={j} size={10} className={j < t.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
                    &ldquo;{t.content}&rdquo;
                  </p>
                </div>
              ))}
            </div>
          </div>
        </AnimateOnScroll>

        <AnimateOnScroll variant="fadeUp" delay={0.3}>
          <div className="text-center mt-8 px-4">
            <Link href="/temoignages" className="text-[#27A827] hover:text-[#1a7a1a] font-bold text-sm inline-flex items-center gap-1">
              Voir tous les avis <ArrowRight size={14} />
            </Link>
          </div>
        </AnimateOnScroll>
      </section>

      {/* ══════ CTA FINAL ══════ */}
      <section className="py-8 sm:py-14">
        <AnimateOnScroll variant="scaleUp">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-3">
              Prêt à passer à l&apos;action ?
            </h2>
            <p className="text-gray-500 text-sm mb-8 max-w-md mx-auto">
              Rejoignez des centaines d&apos;entrepreneurs qui ont transformé leurs compétences en revenus avec Smart Life.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Link href="/ebooks" className="cta-glow px-8 py-4 bg-[#27A827] hover:bg-[#1e8c1e] text-white font-bold rounded-xl transition-all duration-300 shadow-md hover:shadow-lg hover:scale-[1.05]">
                Acheter un Ebook
              </Link>
              <Link href="/accompagnement" className="cta-pulse px-8 py-4 border-2 border-[#E8B800] hover:bg-[#E8B800]/10 text-[#E8B800] font-bold rounded-xl transition-all duration-300">
                Être accompagné
              </Link>
              <Link href="/devenir-consultant" className="btn-postuler px-8 py-4 border-2 border-[#27A827] hover:bg-[#27A827]/8 text-[#27A827] font-bold rounded-xl transition-all duration-300">
                Devenir Consultant
              </Link>
            </div>
          </div>
        </AnimateOnScroll>
      </section>
    </div>
  );
}
