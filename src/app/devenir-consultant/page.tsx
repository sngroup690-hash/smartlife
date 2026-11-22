"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft, CheckCircle, Send, User, Mail, Phone,
  MapPin, Briefcase, FileText, Link2, Star, VolumeX, Camera, X, Gift,
} from "lucide-react";
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
          style={{ maxHeight: 360 }}
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
          className="absolute top-3 right-3 p-2 bg-black/60 backdrop-blur-sm border border-white/20 text-white rounded-full hover:bg-black/90 transition-all opacity-0 group-hover:opacity-100"
          title="Lecture immersive"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"/></svg>
        </button>
      </div>

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

import { useAccompagnementStore, EspacePersonnalise } from "@/lib/accompagnement-store";

const inputCls =
  "w-full px-4 py-3 bg-gray-50 border border-green-500 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-green-600 focus:bg-white transition-colors text-sm";
const labelCls = "block text-gray-700 text-sm mb-2";

type FormData = {
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  ville: string;
  anneesExperience: string;
  domainesIds: string[];
  motivation: string;
  portfolioUrl: string;
  photoUrl: string;
  codeParrainage: string;
};

const FORM_VIDE: FormData = {
  prenom: "", nom: "", email: "", telephone: "", ville: "",
  anneesExperience: "", domainesIds: [], motivation: "", portfolioUrl: "", photoUrl: "",
  codeParrainage: "",
};

const EXPERIENCE_OPTIONS = [
  "Moins d'1 an", "1 à 2 ans", "3 à 5 ans", "6 à 10 ans", "Plus de 10 ans",
];

const STEP_CONFIG = [
  { label: "Identité", icon: User },
  { label: "Expérience", icon: Briefcase },
  { label: "Motivation", icon: FileText },
];

function StepBar({ current }: { current: number }) {
  const total = STEP_CONFIG.length;
  const progress = ((current - 1) / (total - 1)) * 100;

  return (
    <div className="mb-8">
      {/* Labels */}
      <div className="flex justify-between mb-3">
        {STEP_CONFIG.map((s, i) => {
          const n = i + 1;
          const done = n < current;
          const active = n === current;
          return (
            <div key={n} className="flex flex-col items-center gap-1.5" style={{ width: `${100 / total}%` }}>
              <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                done
                  ? "bg-[#27A827] border-[#27A827] text-white"
                  : active
                  ? "bg-[#E8B800] border-[#E8B800] text-black"
                  : "bg-white border-gray-200 text-gray-400"
              }`}>
                {done ? <CheckCircle size={16} /> : n}
              </div>
              <span className={`text-xs font-medium transition-colors duration-300 ${
                active ? "text-gray-900" : done ? "text-[#27A827]" : "text-gray-400"
              }`}>
                {s.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="relative h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-[#E8B800] to-[#27A827] transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="text-right text-xs text-gray-400 mt-1.5">
        Étape {current} sur {total}
      </p>
    </div>
  );
}

export default function DevenirConsultantPage() {
  const store = useAccompagnementStore();
  const [serverEspaces, setServerEspaces] = useState<EspacePersonnalise[] | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const stepsRef = useRef<HTMLDivElement>(null);
  const [stepsVisible, setStepsVisible] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState("");

  useEffect(() => {
    fetch("/api/espaces")
      .then((r) => r.json())
      .then((data) => setServerEspaces(data.espaces ?? null))
      .catch(() => {});
    fetch("/api/consultant-video")
      .then((r) => r.json())
      .then((d) => setVideoUrl(d.url ?? ""))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStepsVisible(true); },
      { threshold: 0.15 }
    );
    if (stepsRef.current) observer.observe(stepsRef.current);
    return () => observer.disconnect();
  }, []);

  const espaces = (serverEspaces ?? store.espaces).filter((e) => e.actif);

  const formRef = useRef<HTMLDivElement>(null);
  const [form, setForm] = useState<FormData>(FORM_VIDE);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  function setField<K extends keyof FormData>(k: K, v: FormData[K]) {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  }

  function toggleDomaine(id: string) {
    const curr = form.domainesIds;
    setField("domainesIds", curr.includes(id) ? curr.filter((x) => x !== id) : [...curr, id]);
  }

  function validateStep(step: number): boolean {
    const errs: Partial<Record<keyof FormData, string>> = {};

    if (step === 1) {
      if (!form.prenom.trim()) errs.prenom = "Le prénom est requis";
      if (!form.nom.trim()) errs.nom = "Le nom est requis";
      if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
        errs.email = "Email invalide";
      if (!form.telephone.trim()) errs.telephone = "Le téléphone est requis";
      if (!form.ville.trim()) errs.ville = "La ville est requise";
    }

    if (step === 2) {
      if (!form.anneesExperience) errs.anneesExperience = "Veuillez sélectionner votre expérience";
      if (form.domainesIds.length === 0) errs.domainesIds = "Sélectionnez au moins un domaine";
    }

    if (step === 3) {
      if (!form.motivation.trim() || form.motivation.trim().length < 50)
        errs.motivation = "Décrivez votre motivation (min. 50 caractères)";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function goNext() {
    if (!validateStep(currentStep)) return;
    setCurrentStep((s) => s + 1);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function goPrev() {
    setErrors({});
    setCurrentStep((s) => s - 1);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoError("");
    const preview = URL.createObjectURL(file);
    setPhotoPreview(preview);
    setPhotoUploading(true);
    try {
      const fd = new FormData();
      fd.append("photo", file);
      const res = await fetch("/api/upload-consultant-photo", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { setPhotoError(data.error || "Erreur upload"); return; }
      setField("photoUrl", data.url);
    } catch {
      setPhotoError("Erreur réseau lors de l'upload.");
    } finally {
      setPhotoUploading(false);
    }
  }

  function removePhoto() {
    setPhotoPreview("");
    setField("photoUrl", "");
    setPhotoError("");
    if (photoInputRef.current) photoInputRef.current.value = "";
  }

  async function handleSubmit() {
    if (!validateStep(3)) return;
    setLoading(true);
    try {
      const res = await fetch("/api/candidatures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prenom: form.prenom.trim(),
          nom: form.nom.trim(),
          email: form.email.trim().toLowerCase(),
          telephone: form.telephone.trim(),
          ville: form.ville.trim(),
          anneesExperience: form.anneesExperience,
          domainesIds: form.domainesIds,
          motivation: form.motivation.trim(),
          portfolioUrl: form.portfolioUrl.trim() || undefined,
          photoUrl: form.photoUrl || undefined,
          codeParrainage: form.codeParrainage.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setErrors({ motivation: data.error || "Une erreur est survenue. Réessayez." });
        return;
      }
      setDone(true);
    } catch {
      setErrors({ motivation: "Erreur réseau. Veuillez réessayer." });
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-6">
            <CheckCircle size={36} className="text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Candidature envoyée !</h1>
          <p className="text-gray-600 mb-2 leading-relaxed">
            Votre candidature a bien été reçue. Notre équipe va l&apos;examiner et vous contactera sous{" "}
            <span className="text-gray-900 font-medium">48 à 72 heures</span>.
          </p>
          <p className="text-gray-600 text-sm mb-8">
            Si votre profil est validé, votre prénom apparaîtra dans l&apos;espace consultants accessible à nos membres.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/accompagnement"
              className="px-5 py-3 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-xl text-sm transition-all">
              Voir les programmes
            </Link>
            <Link href="/"
              className="px-5 py-3 bg-[#E8B800] hover:bg-[#27A827] text-black font-bold rounded-xl text-sm transition-all">
              Retour à l&apos;accueil
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16">

      {/* Retour */}
      <Link href="/accompagnement"
        className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 text-sm mb-8 transition-colors">
        <ArrowLeft size={15} /> Retour aux programmes
      </Link>

      {/* Hero */}
      <AnimateOnScroll variant="fadeUp" className="mb-10">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#E8B800]/20 to-[#27A827]/10 border border-[#E8B800]/30 flex items-center justify-center mb-4">
          <Star size={24} className="text-[#E8B800]" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Devenir Consultant SMART LIFE</h1>
        <p className="text-gray-600 leading-relaxed">
          Vous avez une expertise entrepreneuriale et l&apos;envie d&apos;accompagner des porteurs de projets ?
          Rejoignez notre réseau de consultants. Votre candidature sera examinée par notre équipe avant publication.
        </p>
      </AnimateOnScroll>

      {/* Vidéo de présentation */}
      {videoUrl && (
        <AnimateOnScroll variant="scaleUp" delay={0.2} className="mb-10">
          <AutoplayVideo src={videoUrl} />
        </AnimateOnScroll>
      )}

      {/* Avantages */}
      <StaggerContainer className="flex overflow-x-auto gap-4 pb-2 mb-10 snap-x snap-mandatory scrollbar-hide sm:grid sm:grid-cols-3 sm:overflow-visible sm:pb-0" staggerDelay={0.15}>
        {[
          { icon: "🎯", label: "Missions ciblées", sub: "Accompagnement sur mesure" },
          { icon: "🤝", label: "Réseau solide", sub: "Communauté de consultants" },
          { icon: "💼", label: "Visibilité", sub: "Profil visible aux membres" },
        ].map((a) => (
          <StaggerItem key={a.label} className="flex-shrink-0 w-44 sm:w-auto p-4 bg-white border border-gray-200 rounded-2xl text-center snap-center shadow-sm">
            <div className="text-2xl mb-2">{a.icon}</div>
            <p className="text-gray-900 text-xs font-semibold mb-0.5">{a.label}</p>
            <p className="text-gray-600 text-xs">{a.sub}</p>
          </StaggerItem>
        ))}
      </StaggerContainer>

      {/* Comment ça marche */}
      <div className="mb-10" ref={stepsRef}>
        <h2 className="text-gray-900 font-bold text-base mb-4 flex items-center gap-2">
          <span className="w-1 h-5 bg-[#E8B800] rounded-full" />
          Comment ça marche ?
        </h2>
        <div className="flex flex-nowrap overflow-x-auto md:grid md:grid-cols-4 gap-3 pb-4 md:pb-0 snap-x snap-mandatory scrollbar-hide">
          {[
            { n: "01", title: "Candidature", desc: "Remplissez le formulaire avec votre profil et motivation" },
            { n: "02", title: "Examen", desc: "Notre équipe étudie votre dossier sous 48 à 72 heures" },
            { n: "03", title: "Validation", desc: "Vous êtes contacté et votre profil est publié sur la plateforme" },
            { n: "04", title: "Mission", desc: "Accompagnez vos premiers clients et développez votre réseau" },
          ].map((step, i) => (
            <div
              key={i}
              className="relative flex-shrink-0 w-[175px] md:w-auto p-4 bg-white border border-gray-200 rounded-2xl shadow-sm snap-center text-center transition-all duration-700 ease-out"
              style={{
                transitionDelay: `${i * 220}ms`,
                opacity: stepsVisible ? 1 : 0,
                transform: stepsVisible ? "scale(1) translateY(0)" : "scale(0.78) translateY(24px)",
              }}
            >
              <div className="w-10 h-10 mx-auto rounded-full bg-[#E8B800]/10 border border-[#E8B800]/30 flex items-center justify-center text-[#E8B800] font-bold text-sm mb-3 transition-transform hover:scale-110">
                {step.n}
              </div>
              <h3 className="text-gray-900 font-semibold text-xs mb-1">{step.title}</h3>
              <p className="text-gray-600 text-xs leading-relaxed">{step.desc}</p>
              {i < 3 && (
                <ArrowLeft size={14} className="hidden md:block absolute top-5 -right-2 text-gray-700 rotate-180" />
              )}
            </div>
          ))}
        </div>
        <div className={`flex items-center justify-center gap-2 mt-3 md:hidden transition-opacity duration-700 ${stepsVisible ? "opacity-100" : "opacity-0"}`}>
          <span className="text-gray-700 text-xs">←</span>
          {[0,1,2,3].map((d) => <div key={d} className="w-1.5 h-1.5 rounded-full bg-gray-700/60" />)}
          <span className="text-gray-700 text-xs">→</span>
        </div>
      </div>

      {/* Formulaire multi-étapes */}
      <AnimateOnScroll variant="blurUp" className="">
      <div ref={formRef}>

        {/* Barre de progression */}
        <StepBar current={currentStep} />

        {/* ── Étape 1 : Identité ── */}
        {currentStep === 1 && (
          <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm space-y-4">
            <h2 className="text-gray-900 font-bold flex items-center gap-2">
              <User size={16} className="text-[#E8B800]" /> Informations d&apos;identité
            </h2>

            {/* Photo de profil */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative group">
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  disabled={photoUploading}
                  className="w-24 h-24 rounded-full border-2 border-dashed border-gray-300 hover:border-[#E8B800] bg-gray-50 overflow-hidden flex items-center justify-center transition-all group-hover:border-[#E8B800] focus:outline-none"
                >
                  {photoPreview ? (
                    <Image src={photoPreview} alt="Aperçu photo" fill className="object-cover rounded-full" unoptimized />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-gray-400">
                      {photoUploading
                        ? <span className="w-5 h-5 border-2 border-gray-300 border-t-[#E8B800] rounded-full animate-spin" />
                        : <Camera size={22} />}
                      <span className="text-xs">Photo</span>
                    </div>
                  )}
                </button>
                {photoPreview && !photoUploading && (
                  <button
                    type="button"
                    onClick={removePhoto}
                    className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow hover:bg-red-600 transition-colors"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
              <div className="text-center">
                <p className="text-gray-500 text-xs">
                  {photoUploading ? "Upload en cours…" : "Photo de profil (optionnel)"}
                </p>
                {photoError && <p className="text-red-400 text-xs mt-0.5">{photoError}</p>}
              </div>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                className="hidden"
                onChange={handlePhotoChange}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Prénom <span className="text-[#E8B800]">*</span></label>
                <input type="text" value={form.prenom}
                  onChange={(e) => setField("prenom", e.target.value)}
                  className={inputCls} placeholder="Jean" />
                {errors.prenom && <p className="text-red-400 text-xs mt-1">{errors.prenom}</p>}
              </div>
              <div>
                <label className={labelCls}>Nom <span className="text-[#E8B800]">*</span></label>
                <input type="text" value={form.nom}
                  onChange={(e) => setField("nom", e.target.value)}
                  className={inputCls} placeholder="Dupont" />
                {errors.nom && <p className="text-red-400 text-xs mt-1">{errors.nom}</p>}
              </div>
            </div>

            <div>
              <label className={labelCls}><Mail size={13} className="inline mr-1" />Email <span className="text-[#E8B800]">*</span></label>
              <input type="email" value={form.email}
                onChange={(e) => setField("email", e.target.value)}
                className={inputCls} placeholder="jean.dupont@exemple.com" />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}><Phone size={13} className="inline mr-1" />Téléphone <span className="text-[#E8B800]">*</span></label>
                <input type="tel" value={form.telephone}
                  onChange={(e) => setField("telephone", e.target.value)}
                  className={inputCls} placeholder="+237 6XX XXX XXX" />
                {errors.telephone && <p className="text-red-400 text-xs mt-1">{errors.telephone}</p>}
              </div>
              <div>
                <label className={labelCls}><MapPin size={13} className="inline mr-1" />Ville <span className="text-[#E8B800]">*</span></label>
                <input type="text" value={form.ville}
                  onChange={(e) => setField("ville", e.target.value)}
                  className={inputCls} placeholder="Douala" />
                {errors.ville && <p className="text-red-400 text-xs mt-1">{errors.ville}</p>}
              </div>
            </div>
          </div>
        )}

        {/* ── Étape 2 : Expérience & domaines ── */}
        {currentStep === 2 && (
          <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm space-y-4">
            <h2 className="text-gray-900 font-bold flex items-center gap-2">
              <Briefcase size={16} className="text-[#E8B800]" /> Expériences &amp; domaines
            </h2>

            <div>
              <label className={labelCls}>Années d&apos;expérience <span className="text-[#E8B800]">*</span></label>
              <div className="flex flex-wrap gap-2">
                {EXPERIENCE_OPTIONS.map((opt) => (
                  <button key={opt} type="button"
                    onClick={() => setField("anneesExperience", opt)}
                    className={`px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                      form.anneesExperience === opt
                        ? "bg-[#E8B800] border-[#E8B800] text-black"
                        : "border-gray-200 text-gray-600 hover:border-gray-400 hover:text-gray-900"
                    }`}>
                    {opt}
                  </button>
                ))}
              </div>
              {errors.anneesExperience && <p className="text-red-400 text-xs mt-1">{errors.anneesExperience}</p>}
            </div>

            <div>
              <label className={labelCls}>
                Domaines d&apos;expertise <span className="text-[#E8B800]">*</span>
                <span className="text-gray-600 ml-2 text-xs">(sélectionnez les programmes que vous pouvez encadrer)</span>
              </label>
              {espaces.length === 0 ? (
                <p className="text-gray-600 text-sm">Aucun programme disponible pour le moment.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {espaces.map((e) => (
                    <button key={e.id} type="button" onClick={() => toggleDomaine(e.id)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                        form.domainesIds.includes(e.id)
                          ? "bg-[#E8B800] border-[#E8B800] text-black"
                          : "border-gray-200 text-gray-600 hover:border-gray-400 hover:text-gray-900"
                      }`}>
                      {form.domainesIds.includes(e.id) && "✓ "}{e.titre}
                    </button>
                  ))}
                </div>
              )}
              {errors.domainesIds && <p className="text-red-400 text-xs mt-1">{errors.domainesIds}</p>}
            </div>

            <div>
              <label className={labelCls}>
                <Link2 size={13} className="inline mr-1" />LinkedIn ou portfolio
                <span className="text-gray-600 ml-2 text-xs">optionnel</span>
              </label>
              <input type="text" value={form.portfolioUrl}
                onChange={(e) => setField("portfolioUrl", e.target.value)}
                className={inputCls} placeholder="https://linkedin.com/in/votre-profil" />
            </div>
          </div>
        )}

        {/* ── Étape 3 : Motivation & parrainage ── */}
        {currentStep === 3 && (
          <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm space-y-4">
            <h2 className="text-gray-900 font-bold flex items-center gap-2">
              <FileText size={16} className="text-[#E8B800]" /> Motivation &amp; parrainage
            </h2>

            <div>
              <label className={labelCls}>
                Votre motivation <span className="text-[#E8B800]">*</span>
                <span className="text-gray-600 ml-2 text-xs">(min. 50 caractères)</span>
              </label>
              <textarea rows={5} value={form.motivation}
                onChange={(e) => setField("motivation", e.target.value)}
                className={`${inputCls} resize-none`}
                placeholder="Décrivez votre parcours, vos réalisations entrepreneuriales et pourquoi vous souhaitez rejoindre le réseau SMART LIFE en tant que consultant..." />
              <div className="flex items-center justify-between mt-1">
                {errors.motivation
                  ? <p className="text-red-400 text-xs">{errors.motivation}</p>
                  : <span />}
                <span className={`text-xs ${form.motivation.length < 50 ? "text-gray-600" : "text-emerald-500"}`}>
                  {form.motivation.length} / 50
                </span>
              </div>
            </div>

            <div>
              <label className={labelCls}>
                <Gift size={13} className="inline mr-1" />Code de parrainage
                <span className="text-gray-600 ml-2 text-xs">optionnel</span>
              </label>
              <input type="text" value={form.codeParrainage}
                onChange={(e) => setField("codeParrainage", e.target.value.toUpperCase())}
                className={inputCls}
                placeholder="ex : SL-XXXXXX"
                maxLength={20}
              />
            </div>
          </div>
        )}

        {/* Boutons de navigation */}
        <div className={`flex mt-6 gap-3 ${currentStep === 1 ? "justify-end" : "justify-between"}`}>
          {currentStep > 1 && (
            <button
              type="button"
              onClick={goPrev}
              className="flex items-center gap-2 px-6 py-3 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-xl text-sm font-medium transition-all"
            >
              <ArrowLeft size={15} /> Précédent
            </button>
          )}

          {currentStep < 3 ? (
            <button
              type="button"
              onClick={goNext}
              className="flex items-center gap-2 px-6 py-3 bg-[#E8B800] hover:bg-yellow-400 text-black font-bold rounded-xl text-sm transition-all"
            >
              Suivant
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-4 bg-gradient-to-r from-[#E8B800] to-[#27A827] hover:from-[#27A827] hover:to-[#E8B800] text-black font-bold rounded-xl transition-all disabled:opacity-60 text-sm"
            >
              {loading
                ? <><span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Envoi en cours...</>
                : <><Send size={15} /> Envoyer ma candidature</>}
            </button>
          )}
        </div>
      </div>
      </AnimateOnScroll>
    </div>
  );
}
