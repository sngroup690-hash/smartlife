"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle, TrendingUp, Users, Volume2, VolumeX, Hammer, Star, Shield, Zap, Target, Rocket } from "lucide-react";
import { motion } from "framer-motion";
import { useAccompagnementStore, EspacePersonnalise } from "@/lib/accompagnement-store";
import AnimateOnScroll, { StaggerContainer, StaggerItem } from "@/components/AnimateOnScroll";

function AutoplayVideo({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const modalVideoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [immersive, setImmersive] = useState(false);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    v.play().catch(() => {});
  }, [src]);

  useEffect(() => {
    if (immersive && modalVideoRef.current && videoRef.current) {
      modalVideoRef.current.currentTime = videoRef.current.currentTime;
      modalVideoRef.current.muted = false;
      modalVideoRef.current.play().catch(() => {});
      videoRef.current.pause();
    } else if (!immersive && videoRef.current && modalVideoRef.current) {
      videoRef.current.currentTime = modalVideoRef.current.currentTime;
      videoRef.current.muted = true;
      videoRef.current.play().catch(() => {});
    }
  }, [immersive]);

  function toggleMute() {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  }

  return (
    <>
      <div className="relative rounded-[14px] overflow-hidden border border-[var(--g-ligne)] bg-black group">
        <video
          ref={videoRef}
          src={src}
          autoPlay
          muted
          loop
          playsInline
          controls
          className="w-full"
          style={{ maxHeight: 400 }}
        />
        {muted && (
          <button
            onClick={toggleMute}
            className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-white text-[var(--g-encre)] text-sm font-semibold rounded-[10px] hover:bg-[var(--g-doux)] transition-colors"
          >
            <VolumeX size={15} /> Cliquez ici pour écouter
          </button>
        )}
        <button
          onClick={() => setImmersive(true)}
          className="absolute top-3 right-3 p-2 bg-black/60 backdrop-blur-sm border border-white/20 text-white rounded-full hover:bg-black/90 transition-all opacity-0 group-hover:opacity-100 text-xs flex items-center gap-1.5"
          title="Lecture immersive"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"/></svg>
        </button>
      </div>

      {/* Modal immersive */}
      {immersive && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setImmersive(false); }}>
          <div className="relative w-full max-w-5xl">
            <video
              ref={modalVideoRef}
              src={src}
              controls
              autoPlay
              playsInline
              className="w-full rounded-[14px]"
              style={{ maxHeight: "80vh" }}
            />
            <button
              onClick={() => setImmersive(false)}
              className="absolute -top-10 right-0 text-white/70 hover:text-white flex items-center gap-2 text-sm font-medium"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              Fermer
            </button>
          </div>
        </div>
      )}
    </>
  );
}

const STATIC_STATS = [
  { value: "47", label: "Clients accompagnés" },
  { value: "93%", label: "Taux de réussite" },
  { value: "6 mois", label: "Accompagnement moyen" },
];

export default function AccompagnementPage() {
  const store = useAccompagnementStore();
  const [serverEspaces, setServerEspaces] = useState<EspacePersonnalise[] | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const stepsRef = useRef<HTMLDivElement>(null);
  const [stepsVisible, setStepsVisible] = useState(false);

  useEffect(() => {
    fetch("/api/espaces").then((r) => r.json()).then((data) => setServerEspaces(data.espaces ?? null)).catch(() => {});
    fetch("/api/accompagnement-video").then((r) => r.json()).then((d) => setVideoUrl(d.url ?? "")).catch(() => {});
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStepsVisible(true); },
      { threshold: 0.15 }
    );
    if (stepsRef.current) observer.observe(stepsRef.current);
    return () => observer.disconnect();
  }, []);

  const espaces = (serverEspaces ?? store.espaces)
    .filter((e) => e.actif)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="overflow-hidden bg-white">

      {/* ════════ HERO PREMIUM ════════ */}
      <section className="relative py-12 sm:py-16 overflow-hidden text-[var(--g-encre)]">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-[14px] font-semibold text-[var(--g-vert)] mb-5"
        >
          Accompagnement entrepreneurial
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-[2.1rem] sm:text-[2.8rem] md:text-[3.6rem] font-semibold leading-[1.05] tracking-[-0.03em] mb-6 text-[var(--g-encre)] max-w-[22ch] mx-auto"
        >
          Profitez de l&apos;expertise{" "}
          <span>d&apos;un professionnel</span>
          <br className="hidden sm:block" />
          {" "}pour éviter les{" "}
          <span className="g-surligne">pièges du terrain</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-[var(--g-gris)] max-w-xl mx-auto text-[17px] sm:text-[19px] leading-[1.5] mb-10"
        >
          Choisissez votre domaine, inscrivez-vous et bénéficiez d&apos;un accompagnement
          personnalisé de A à Z avec un expert à vos côtés.
        </motion.p>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 mb-10 border-y border-[var(--g-ligne)] text-left max-w-4xl mx-auto">
          {[
            { value: espaces.length > 0 ? `${espaces.length}+` : "8+", label: "Secteurs d'activité", icon: Target },
            { value: "47", label: "Clients accompagnés", icon: Users },
            { value: "93%", label: "Taux de réussite", icon: TrendingUp },
            { value: "6 mois", label: "Accompagnement moyen", icon: Zap },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 + i * 0.1, duration: 0.5 }}
              className={`py-5 px-4 sm:px-5 ${i % 2 === 1 ? "border-l border-[var(--g-ligne)]" : ""} ${i >= 2 ? "border-t sm:border-t-0 border-[var(--g-ligne)]" : ""} ${i === 2 ? "sm:border-l" : ""}`}
            >
              <stat.icon size={18} className="text-[var(--g-vert)] mb-3" aria-hidden="true" />
              <div className="g-chiffre mb-1.5">{stat.value}</div>
              <div className="text-[var(--g-gris)] text-[13.5px] sm:text-[14.5px] leading-snug">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Social proof */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.5 }}
          className="flex items-center justify-center gap-3 mb-10"
        >
          <div className="flex -space-x-2">
            {["PK", "AM", "SO", "FK", "NB"].map((initials, i) => (
              <div
                key={initials}
                className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-semibold"
                style={{
                  background: i % 2 === 0 ? "var(--g-vert)" : "var(--g-jaune)",
                  color: i % 2 === 0 ? "#fff" : "var(--g-encre)",
                }}
              >
                {initials}
              </div>
            ))}
          </div>
          <p className="text-[var(--g-gris)] text-[13.5px]">47 entrepreneurs nous font confiance</p>
        </motion.div>

        {/* Vidéo de présentation */}
        {videoUrl && (
          <AnimateOnScroll variant="fadeUp" className="mb-12 max-w-3xl mx-auto">
            <AutoplayVideo src={videoUrl} />
          </AnimateOnScroll>
        )}

        {/* Étapes */}
        <div className="max-w-4xl mx-auto" ref={stepsRef}>
          <div className="flex flex-nowrap overflow-x-auto md:grid md:grid-cols-4 gap-3 md:gap-6 pb-4 md:pb-0 snap-x snap-mandatory scrollbar-hide">
            {[
              { n: "01", title: "Choisissez", desc: "Parcourez les domaines et sélectionnez votre secteur" },
              { n: "02", title: "Inscrivez-vous", desc: "Créez votre profil et soumettez votre candidature" },
              { n: "03", title: "Validation", desc: "Un administrateur étudie et valide votre dossier" },
              { n: "04", title: "Accompagnement", desc: "Démarrez avec notre équipe d'experts à vos côtés" },
            ].map((step, i) => (
              <div
                key={i}
                className={`relative text-center flex-shrink-0 w-[175px] md:w-auto snap-center ${stepsVisible ? "step-visible" : "step-hidden"}`}
                style={{ animationDelay: `${i * 180}ms` }}
              >
                <div className="w-14 h-14 mx-auto rounded-full bg-[var(--g-vert-doux)] flex items-center justify-center text-[var(--g-vert)] font-semibold text-[19px] tracking-[-0.02em] tabular-nums mb-3">
                  {step.n}
                </div>
                <h3 className="text-[var(--g-encre)] font-semibold text-[15px] tracking-[-0.01em] mb-1">{step.title}</h3>
                <p className="text-[var(--g-gris)] text-[13px] leading-relaxed px-2">{step.desc}</p>
                {i < 3 && (
                  <ArrowRight size={16} className="hidden md:block absolute top-5 -right-3 text-[var(--g-gris-clair)]" />
                )}
              </div>
            ))}
          </div>
          <div className={`flex items-center justify-center gap-2 mt-4 md:hidden transition-opacity duration-700 ${stepsVisible ? "opacity-100" : "opacity-0"}`}>
            <span className="text-[var(--g-gris)] text-xs">←</span>
            {[0,1,2,3].map((d) => <div key={d} className="w-1.5 h-1.5 rounded-full bg-[var(--g-ligne)]" />)}
            <span className="text-[var(--g-gris)] text-xs">→</span>
          </div>
        </div>

        </div>
      </section>

      {/* ════════ ESPACES D'ACCOMPAGNEMENT ════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

      {/* Espaces */}
      {espaces.length === 0 ? (
        <div className="text-center py-24 px-5 bg-[var(--g-doux)] rounded-[18px]">
          <Hammer size={40} strokeWidth={1.6} className="mx-auto mb-5 text-[var(--g-vert)]" aria-hidden="true" />
          <h3 className="text-[var(--g-encre)] font-semibold tracking-[-0.02em] text-2xl mb-3">
            Les espaces arrivent bientôt
          </h3>
          <p className="text-[var(--g-gris)] max-w-md mx-auto mb-6">
            Notre équipe prépare les domaines d&apos;accompagnement. En attendant, contactez-nous directement pour discuter de votre projet.
          </p>
          <Link
            href="/contact"
            className="g-btn"
          >
            Nous contacter <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <>
          <AnimateOnScroll variant="fadeUp" className="mb-8 text-center">
            <h2 className="g-titre-section mb-2">
              Nos <span className="g-surligne">Domaines</span> d&apos;accompagnement
            </h2>
            <p className="text-[var(--g-gris)] text-[15px]">
              {espaces.length} domaine{espaces.length > 1 ? "s" : ""} disponible{espaces.length > 1 ? "s" : ""}
            </p>
          </AnimateOnScroll>

          <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12" staggerDelay={0.1}>
            {espaces.map((espace) => {
              const demandes = store.demandes.filter((d) => d.espaceId === espace.id);
              const validees = demandes.filter((d) => d.statut === "validee").length;
              return (
                <StaggerItem key={espace.id}>
                <Link
                  href={`/accompagnement/${espace.id}`}
                  className="group h-full bg-white border border-[var(--g-ligne)] rounded-[14px] hover:border-[var(--g-encre)]/30 transition-colors flex flex-col overflow-hidden"
                >
                  {/* Bannière image — pleine largeur en en-tête */}
                  <div className="w-full flex-shrink-0 relative overflow-hidden" style={{ aspectRatio: "16/10", background: "var(--g-vert-profond)" }}>
                    {(espace.visuel || espace.image) && (
                      <img
                        src={espace.visuel || espace.image}
                        alt={espace.titre}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover block transition-transform duration-700 group-hover:scale-[1.03]"
                        style={{ objectPosition: "50% 20%", transformOrigin: "50% 100%" }}
                        onError={(ev) => { (ev.target as HTMLImageElement).style.display = "none"; }}
                      />
                    )}
                    <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.35) 45%, transparent 70%)" }} />
                    <span className="absolute top-3 left-3 px-2 py-1 rounded-[6px] text-[12px] font-semibold bg-white/95 text-[var(--g-encre)]">
                      {espace.domaine}
                    </span>
                    <p className="absolute bottom-3 left-3 right-3 text-[17.5px] font-semibold tracking-[-0.02em] leading-tight" style={{ color: "#fff" }}>
                      {espace.titre.normalize("NFKC")}
                    </p>
                  </div>

                  {/* Contenu sous l'image */}
                  <div className="p-4 flex flex-col flex-1">
                    <p className="text-[13.5px] font-semibold text-[var(--g-vert)] leading-snug mb-2">
                      Soumettez votre projet et faites-vous accompagner par un expert à vos côtés.
                    </p>
                    {espace.descriptionCourte && (
                      <p className="text-[var(--g-gris)] text-sm leading-relaxed mb-3 line-clamp-2">{espace.descriptionCourte}</p>
                    )}

                    {/* Stats */}
                    <div className="space-y-2 mb-4">
                      {espace.clientsSatisfaits > 0 && (
                        <div className="flex items-center gap-2 text-[13px] text-[var(--g-gris)]">
                          <CheckCircle size={13} className="text-[var(--g-vert)] flex-shrink-0" />
                          <span>
                            <strong className="text-[var(--g-encre)] font-semibold">{espace.clientsSatisfaits}</strong>{" "}
                            client{espace.clientsSatisfaits > 1 ? "s" : ""} & entreprise{espace.clientsSatisfaits > 1 ? "s" : ""} satisfait{espace.clientsSatisfaits > 1 ? "s" : ""}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-[13px] text-[var(--g-gris)]">
                        <Users size={13} className={`flex-shrink-0 ${espace.placesDisponibles <= 2 ? "text-[var(--g-orange)]" : "text-[var(--g-vert)]"}`} />
                        <span>
                          <strong className={`font-semibold ${espace.placesDisponibles <= 2 ? "text-[var(--g-orange)]" : "text-[var(--g-encre)]"}`}>
                            {espace.placesDisponibles}
                          </strong>{" "}
                          place{espace.placesDisponibles > 1 ? "s" : ""} disponible{espace.placesDisponibles > 1 ? "s" : ""}
                        </span>
                      </div>
                      {validees > 0 && (
                        <div className="flex items-center gap-2 text-[13px] text-[var(--g-gris)]">
                          <span className="w-2 h-2 rounded-full bg-[var(--g-vert)] flex-shrink-0" />
                          {validees} déjà accompagné{validees > 1 ? "s" : ""}
                        </div>
                      )}
                    </div>

                    <div className="mt-auto flex items-center justify-end pt-3 border-t border-[var(--g-ligne)]">
                      <span className="g-lien text-[14.5px]">
                        Postuler <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                      </span>
                    </div>
                  </div>
                </Link>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </>
      )}

      {/* Section Consultants */}
      {store.consultants.filter((c) => c.actif).length > 0 && (
        <div className="mb-12">
          <AnimateOnScroll variant="fadeUp" className="text-center mb-8">
            <h2 className="g-titre-section mb-2">
              Nos <span className="g-surligne">Consultants</span>
            </h2>
            <p className="text-[var(--g-gris)] text-[15px]">Les experts qui vous accompagnent au quotidien</p>
          </AnimateOnScroll>
          <StaggerContainer className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5" staggerDelay={0.1}>
            {store.consultants.filter((c) => c.actif).map((c) => {
              const domainesNoms = c.domainesIds
                .map((id) => store.espaces.find((e) => e.id === id)?.titre)
                .filter(Boolean);
              return (
                <StaggerItem key={c.id}>
                <div className="p-6 h-full bg-white border border-[var(--g-ligne)] rounded-[14px] text-center">
                  {/* Avatar */}
                  <div className="w-16 h-16 mx-auto rounded-full bg-[var(--g-vert-doux)] flex items-center justify-center text-[var(--g-vert)] font-semibold text-[26px] mb-4">
                    {c.prenom.charAt(0).toUpperCase()}
                  </div>
                  <h3 className="text-[var(--g-encre)] font-semibold tracking-[-0.02em] text-lg mb-3">{c.prenom}</h3>
                  <div className="space-y-1.5 mb-4">
                    {c.clientsAccompa > 0 && (
                      <div className="flex items-center justify-center gap-1.5 text-[13px] text-[var(--g-gris)]">
                        <span className="text-[var(--g-encre)] font-semibold text-sm tabular-nums">{c.clientsAccompa}</span>
                        client{c.clientsAccompa > 1 ? "s" : ""} accompagné{c.clientsAccompa > 1 ? "s" : ""}
                      </div>
                    )}
                    {c.entreprisesAccompa > 0 && (
                      <div className="flex items-center justify-center gap-1.5 text-[13px] text-[var(--g-gris)]">
                        <span className="text-[var(--g-encre)] font-semibold text-sm tabular-nums">{c.entreprisesAccompa}</span>
                        entreprise{c.entreprisesAccompa > 1 ? "s" : ""} accompagnée{c.entreprisesAccompa > 1 ? "s" : ""}
                      </div>
                    )}
                  </div>
                  {domainesNoms.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-1">
                      {domainesNoms.slice(0, 2).map((d) => (
                        <span key={d as string} className="text-[12px] px-2 py-0.5 bg-[var(--g-doux)] text-[var(--g-gris)] rounded-[6px]">{d}</span>
                      ))}
                      {domainesNoms.length > 2 && (
                        <span className="text-[12px] px-2 py-0.5 bg-[var(--g-doux)] text-[var(--g-gris)] rounded-[6px]">+{domainesNoms.length - 2}</span>
                      )}
                    </div>
                  )}
                </div>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </div>
      )}

      </div>

      {/* ════════ CTA PREMIUM ════════ */}
      <div className="bande-wax h-[12px]" aria-hidden="true" />
      <section className="py-14 sm:py-20 px-5 bg-[var(--g-doux)]">
        <AnimateOnScroll variant="fadeUp">
          <div className="max-w-2xl mx-auto text-center">
            <p className="inline-flex items-center gap-2 text-[14px] font-semibold text-[var(--g-vert)] mb-5">
              <span className="w-2 h-2 rounded-full bg-[var(--g-vert)]" aria-hidden="true" />
              Programmes sur mesure disponibles
            </p>

            <h2 className="g-titre-section mb-4">
              Votre domaine n&apos;est pas listé ?
            </h2>
            <p className="text-[var(--g-gris)] text-[16px] sm:text-[17px] max-w-md mx-auto mb-9 leading-relaxed">
              Contactez-nous pour discuter de votre projet. Nous étudions tous les secteurs
              et créons des programmes sur mesure.
            </p>

            <Link
              href="/contact"
              className="g-btn group"
            >
              Discuter de mon projet
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </Link>

            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mt-8 text-[13.5px] text-[var(--g-gris)]">
              <span className="flex items-center gap-1.5"><Shield size={13} /> Étude gratuite</span>
              <span className="flex items-center gap-1.5"><CheckCircle size={13} /> Réponse sous 48h</span>
              <span className="flex items-center gap-1.5"><Star size={13} /> 93% de réussite</span>
            </div>
          </div>
        </AnimateOnScroll>
      </section>
    </div>
  );
}
