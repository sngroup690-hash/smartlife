"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle, TrendingUp, Users, Volume2, VolumeX } from "lucide-react";
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
      <div className="relative rounded-2xl overflow-hidden border border-[#E8B800]/20 shadow-2xl group">
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
            className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-black text-sm font-bold rounded-full hover:bg-gray-100 transition-all animate-pulse"
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
              className="w-full rounded-2xl shadow-2xl"
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

      {/* Hero */}
      <div className="text-center mb-20">
        <AnimateOnScroll variant="fadeUp">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#E8B800]/10 border border-[#E8B800]/30 rounded-full text-sm text-[#E8B800] mb-6">
            <TrendingUp size={14} />
            Programme d&apos;accompagnement entrepreneurial
          </div>
        </AnimateOnScroll>
        <AnimateOnScroll variant="fadeUp" delay={0.15}>
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Lancez votre <span className="gradient-text">Business</span>
            <br />avec un expert à vos côtés
          </h1>
        </AnimateOnScroll>
        <AnimateOnScroll variant="blurUp" delay={0.3}>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg leading-relaxed mb-10">
            Choisissez votre domaine d&apos;activité, inscrivez-vous et bénéficiez d&apos;un accompagnement
            personnalisé de A à Z : formation, installation, gestion et suivi.
          </p>
        </AnimateOnScroll>

        {/* Stats */}
        <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-[10px] mb-16" staggerDelay={0.12}>
          <StaggerItem>
            <div className="text-center px-3 py-3 bg-white border border-gray-200 rounded-2xl shadow-sm">
              <div className="text-2xl sm:text-3xl font-bold gradient-text mb-0.5">{espaces.length > 0 ? `${espaces.length}+` : "8+"}</div>
              <div className="text-gray-500 text-xs sm:text-sm leading-tight">Secteurs d&apos;activité</div>
            </div>
          </StaggerItem>
          {STATIC_STATS.map((s) => (
            <StaggerItem key={s.label}>
              <div className="text-center px-3 py-3 bg-white border border-gray-200 rounded-2xl shadow-sm">
                <div className="text-2xl sm:text-3xl font-bold gradient-text mb-0.5">{s.value}</div>
                <div className="text-gray-700 font-bold text-xs sm:text-sm leading-tight">{s.label}</div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* Vidéo de présentation */}
        {videoUrl && (
          <div className="mb-12 max-w-3xl mx-auto">
            <AutoplayVideo src={videoUrl} />
          </div>
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
                <div className="w-14 h-14 mx-auto rounded-full bg-[#27A827]/20 border-2 border-[#27A827] flex items-center justify-center text-[#27A827] font-black text-xl mb-3 transition-transform hover:scale-110 hover:bg-[#27A827]/40 shadow-lg shadow-[#27A827]/20">
                  {step.n}
                </div>
                <h3 className="text-gray-900 font-bold text-sm mb-1">{step.title}</h3>
                <p className="text-gray-500 text-xs leading-relaxed px-2">{step.desc}</p>
                {i < 3 && (
                  <ArrowRight size={16} className="hidden md:block absolute top-5 -right-3 text-[#27A827] animate-pulse" />
                )}
              </div>
            ))}
          </div>
          <div className={`flex items-center justify-center gap-2 mt-4 md:hidden transition-opacity duration-700 ${stepsVisible ? "opacity-100" : "opacity-0"}`}>
            <span className="text-gray-700 text-xs">←</span>
            {[0,1,2,3].map((d) => <div key={d} className="w-1.5 h-1.5 rounded-full bg-gray-700/60" />)}
            <span className="text-gray-700 text-xs">→</span>
          </div>
        </div>
      </div>

      {/* Espaces */}
      {espaces.length === 0 ? (
        <div className="text-center py-24 bg-gray-50 border border-gray-200 rounded-3xl">
          <div className="text-6xl mb-4">🏗️</div>
          <h3 className="text-gray-900 font-bold text-2xl mb-3">
            Les espaces arrivent bientôt
          </h3>
          <p className="text-gray-500 max-w-md mx-auto mb-6">
            Notre équipe prépare les domaines d&apos;accompagnement. En attendant, contactez-nous directement pour discuter de votre projet.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#E8B800] hover:bg-[#27A827] text-black font-bold rounded-xl transition-all"
          >
            Nous contacter <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <>
          <AnimateOnScroll variant="fadeUp" className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Nos <span className="gradient-text">Domaines</span> d&apos;accompagnement
            </h2>
            <p className="text-gray-600 text-sm">
              {espaces.length} domaine{espaces.length > 1 ? "s" : ""} disponible{espaces.length > 1 ? "s" : ""}
            </p>
          </AnimateOnScroll>

          <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-20" staggerDelay={0.1}>
            {espaces.map((espace) => {
              const demandes = store.demandes.filter((d) => d.espaceId === espace.id);
              const validees = demandes.filter((d) => d.statut === "validee").length;
              return (
                <StaggerItem key={espace.id}>
                <Link
                  href={`/accompagnement/${espace.id}`}
                  className="group bg-white border border-gray-200 rounded-2xl shadow-sm hover:border-green-400 transition-all card-hover flex flex-col overflow-hidden"
                >
                  {/* Bannière image — pleine largeur en en-tête */}
                  {espace.image ? (
                    <div className="w-full flex-shrink-0" style={{ height: 190 }}>
                      <img
                        src={espace.image.split("?")[0]}
                        alt={espace.titre}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover block"
                      />
                    </div>
                  ) : (
                    <div
                      className="w-full flex-shrink-0 bg-gradient-to-br from-[#E8B800]/20 to-[#27A827]/10 flex items-center justify-center border-b border-gray-100"
                      style={{ height: 170 }}
                    >
                      <span className="text-[#E8B800] font-black text-5xl select-none">
                        {espace.titre.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}

                  {/* Contenu sous l'image */}
                  <div className="p-4 flex flex-col flex-1">
                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full w-fit mb-3">
                      {espace.domaine}
                    </span>

                    <h3 className="text-gray-900 font-bold text-base leading-snug group-hover:text-[#E8B800] transition-colors mb-4 flex-1">
                      {espace.titre}
                    </h3>

                    {/* Stats */}
                    <div className="space-y-2 mb-4">
                      {espace.clientsSatisfaits > 0 && (
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <CheckCircle size={12} className="text-emerald-400 flex-shrink-0" />
                          <span>
                            <strong className="text-gray-900">{espace.clientsSatisfaits}</strong>{" "}
                            client{espace.clientsSatisfaits > 1 ? "s" : ""} & entreprise{espace.clientsSatisfaits > 1 ? "s" : ""} satisfait{espace.clientsSatisfaits > 1 ? "s" : ""}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Users size={12} className={`flex-shrink-0 ${espace.placesDisponibles <= 2 ? "text-orange-400" : "text-[#E8B800]"}`} />
                        <span>
                          <strong className={espace.placesDisponibles <= 2 ? "text-orange-500" : "text-gray-900"}>
                            {espace.placesDisponibles}
                          </strong>{" "}
                          place{espace.placesDisponibles > 1 ? "s" : ""} disponible{espace.placesDisponibles > 1 ? "s" : ""}
                        </span>
                      </div>
                      {validees > 0 && (
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                          {validees} déjà accompagné{validees > 1 ? "s" : ""}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-end pt-3 border-t border-gray-100">
                      <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-lg group-hover:bg-emerald-500 group-hover:text-white group-hover:border-emerald-500 group-hover:gap-2.5 transition-all animate-pulse group-hover:animate-none">
                        Postuler <ArrowRight size={12} />
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
        <div className="mb-20">
          <AnimateOnScroll variant="fadeUp" className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Nos <span className="gradient-text">Consultants</span>
            </h2>
            <p className="text-gray-600 text-sm">Les experts qui vous accompagnent au quotidien</p>
          </AnimateOnScroll>
          <StaggerContainer className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5" staggerDelay={0.1}>
            {store.consultants.filter((c) => c.actif).map((c) => {
              const domainesNoms = c.domainesIds
                .map((id) => store.espaces.find((e) => e.id === id)?.titre)
                .filter(Boolean);
              return (
                <StaggerItem key={c.id}>
                <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm text-center hover:border-[#E8B800]/30 transition-all">
                  {/* Avatar */}
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-[#E8B800]/30 to-[#27A827]/10 border border-[#E8B800]/30 flex items-center justify-center text-[#E8B800] font-black text-3xl mb-4">
                    {c.prenom.charAt(0).toUpperCase()}
                  </div>
                  <h3 className="text-gray-900 font-bold text-lg mb-3">{c.prenom}</h3>
                  <div className="space-y-1.5 mb-4">
                    {c.clientsAccompa > 0 && (
                      <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
                        <span className="text-emerald-400 font-bold text-sm">{c.clientsAccompa}</span>
                        client{c.clientsAccompa > 1 ? "s" : ""} accompagné{c.clientsAccompa > 1 ? "s" : ""}
                      </div>
                    )}
                    {c.entreprisesAccompa > 0 && (
                      <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
                        <span className="text-[#E8B800] font-bold text-sm">{c.entreprisesAccompa}</span>
                        entreprise{c.entreprisesAccompa > 1 ? "s" : ""} accompagnée{c.entreprisesAccompa > 1 ? "s" : ""}
                      </div>
                    )}
                  </div>
                  {domainesNoms.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-1">
                      {domainesNoms.slice(0, 2).map((d) => (
                        <span key={d as string} className="text-xs px-2 py-0.5 bg-[#E8B800]/10 text-[#E8B800] rounded-full">{d}</span>
                      ))}
                      {domainesNoms.length > 2 && (
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">+{domainesNoms.length - 2}</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CTA bas de page */}
      <div className="text-center p-12 rounded-3xl bg-gradient-to-br from-[#E8B800]/10 to-[#27A827]/5 border border-[#E8B800]/20">
        <div className="text-4xl mb-4">💬</div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Votre domaine n&apos;est pas listé ?</h2>
        <p className="text-gray-600 font-bold mb-8 max-w-lg mx-auto">
          Contactez-nous pour discuter de votre projet. Nous étudions tous les secteurs d&apos;activité
          et pouvons créer un programme sur mesure pour vous.
        </p>
        <Link
          href="/contact"
          className="inline-flex items-center gap-2 px-8 py-4 bg-[#E8B800] hover:bg-[#27A827] text-black font-bold rounded-xl transition-all"
        >
          Discuter de mon projet <ArrowRight size={18} />
        </Link>
      </div>
    </div>
  );
}
