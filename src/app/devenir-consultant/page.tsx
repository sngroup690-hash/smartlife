"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  motion, AnimatePresence, useScroll, useTransform, useSpring,
  useInView, useMotionValue,
} from "framer-motion";
import {
  CheckCircle, Send, User, Mail, Phone,
  MapPin, Briefcase, FileText, Link2, Star, Camera, X, Gift,
  ArrowRight, Sparkles, Users, Globe, TrendingUp, Heart, Shield, Award,
  ChevronDown, Zap, Target, Rocket,
} from "lucide-react";
import { useAccompagnementStore, EspacePersonnalise } from "@/lib/accompagnement-store";

/* ───────── Styles ───────── */
const inputCls =
  "w-full px-4 py-3.5 bg-white/80 backdrop-blur-sm border-2 border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#27A827] focus:bg-white focus:shadow-lg focus:shadow-green-500/10 transition-all text-sm";
const labelCls = "block text-gray-700 text-sm font-medium mb-2";

/* ───────── Compteur animé ───────── */
function Counter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = Math.max(1, Math.ceil(value / 60));
    const timer = setInterval(() => {
      start += step;
      if (start >= value) { setDisplay(value); clearInterval(timer); }
      else setDisplay(start);
    }, 25);
    return () => clearInterval(timer);
  }, [inView, value]);

  return (
    <span ref={ref}>
      {display.toLocaleString("fr-FR")}{suffix}
    </span>
  );
}

/* ───────── Révélation mot par mot ───────── */
function WordReveal({ text, className = "", delay = 0 }: { text: string; className?: string; delay?: number }) {
  const words = text.split(" ");
  return (
    <span className={className}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ delay: delay + i * 0.08, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="inline-block mr-[0.3em]"
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}

/* ───────── Bordure dégradée animée ───────── */
function GlowCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative group ${className}`}>
      <div className="absolute -inset-[1px] bg-gradient-to-r from-[#E8B800]/40 via-[#27A827]/40 to-[#E8B800]/40 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />
      <div className="relative bg-white rounded-3xl border border-gray-100 h-full">
        {children}
      </div>
    </div>
  );
}

/* ───────── Formulaire ───────── */
type FormDataType = {
  prenom: string; nom: string; email: string; telephone: string; ville: string;
  anneesExperience: string; domainesIds: string[]; motivation: string;
  portfolioUrl: string; photoUrl: string; codeParrainage: string;
};

const FORM_VIDE: FormDataType = {
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

const ENCOURAGEMENTS = [
  "👋 On commence : votre photo et vos coordonnées.",
  "💪 Très bien ! Parlez-nous de votre expérience.",
  "🏁 Dernière étape : pourquoi vous rejoindre ?",
];

/* ───────── Barre de progression premium ───────── */
function StepBar({ current }: { current: number }) {
  const total = STEP_CONFIG.length;
  const progress = ((current - 1) / (total - 1)) * 100;

  return (
    <div className="mb-8">
      <div className="flex justify-between mb-4">
        {STEP_CONFIG.map((s, i) => {
          const n = i + 1;
          const done = n < current;
          const active = n === current;
          const Icon = s.icon;
          return (
            <div key={n} className="flex flex-col items-center gap-2" style={{ width: `${100 / total}%` }}>
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.15, type: "spring", stiffness: 400, damping: 15 }}
                className="relative"
              >
                {active && (
                  <motion.div
                    className="absolute -inset-2 rounded-full bg-[#E8B800]/20"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  />
                )}
                <div className={`relative w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 ${
                  done
                    ? "bg-gradient-to-br from-[#27A827] to-emerald-600 text-white shadow-lg shadow-green-500/30"
                    : active
                    ? "bg-gradient-to-br from-[#E8B800] to-amber-500 text-black shadow-lg shadow-[#E8B800]/40"
                    : "bg-gray-100 text-gray-400"
                }`}>
                  {done ? <CheckCircle size={18} /> : <Icon size={18} />}
                </div>
              </motion.div>
              <span className={`text-xs font-semibold transition-all duration-300 ${
                active ? "text-gray-900" : done ? "text-[#27A827]" : "text-gray-400"
              }`}>
                {s.label}
              </span>
            </div>
          );
        })}
      </div>

      <div className="relative h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-[#E8B800] via-yellow-400 to-[#27A827]"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        />
        <motion.div
          className="absolute top-0 h-full w-8 rounded-full bg-white/40"
          animate={{ left: ["0%", `${progress}%`] }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>

      <div className="flex items-center justify-between mt-2">
        <motion.p
          key={current}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-[13px] font-semibold text-[#1e7a1e]"
        >
          {ENCOURAGEMENTS[current - 1]}
        </motion.p>
        <p className="text-xs text-gray-500 font-bold whitespace-nowrap">
          Étape {current}/{total} · {Math.round(((current - 1) / total) * 100)} %
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════ */
export default function DevenirConsultantPage() {
  const store = useAccompagnementStore();
  const [serverEspaces, setServerEspaces] = useState<EspacePersonnalise[] | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState("");

  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  useEffect(() => {
    fetch("/api/espaces")
      .then((r) => r.json())
      .then((data) => setServerEspaces(data.espaces ?? null))
      .catch(() => {});
  }, []);

  const espaces = (serverEspaces ?? store.espaces).filter((e) => e.actif);

  const formRef = useRef<HTMLDivElement>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormDataType>(FORM_VIDE);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormDataType, string>>>({});
  const [showFloatingCTA, setShowFloatingCTA] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowFloatingCTA(window.scrollY > 500 && !showForm && !done);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [showForm, done]);

  function setField<K extends keyof FormDataType>(k: K, v: FormDataType[K]) {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  }

  function toggleDomaine(id: string) {
    const curr = form.domainesIds;
    setField("domainesIds", curr.includes(id) ? curr.filter((x) => x !== id) : [...curr, id]);
  }

  function validateStep(step: number): boolean {
    const errs: Partial<Record<keyof FormDataType, string>> = {};
    if (step === 1) {
      if (!form.photoUrl) errs.photoUrl = "Ajoutez une photo de vous : elle est obligatoire pour apparaître parmi nos consultants";
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
    setPhotoPreview(URL.createObjectURL(file));
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

  function openForm() {
    setShowForm(true);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
  }

  async function handleSubmit() {
    if (!validateStep(3)) return;
    setLoading(true);
    try {
      const res = await fetch("/api/candidatures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prenom: form.prenom.trim(), nom: form.nom.trim(),
          email: form.email.trim().toLowerCase(), telephone: form.telephone.trim(),
          ville: form.ville.trim(), anneesExperience: form.anneesExperience,
          domainesIds: form.domainesIds, motivation: form.motivation.trim(),
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

  /* ── Confirmation ── */
  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-green-50 via-white to-yellow-50">
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="max-w-md w-full text-center"
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-emerald-100 to-green-50 border-2 border-emerald-200 flex items-center justify-center mb-8 shadow-xl shadow-green-500/20"
          >
            <CheckCircle size={44} className="text-emerald-600" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-3xl font-extrabold text-gray-900 mb-4"
          >
            Candidature envoyée !
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-gray-600 mb-2 leading-relaxed"
          >
            Notre équipe va l&apos;examiner et vous contactera sous{" "}
            <span className="text-gray-900 font-bold">48 à 72 heures</span>.
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-gray-500 text-sm mb-10"
          >
            Si votre profil est validé, votre prénom apparaîtra dans l&apos;espace consultants.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="flex gap-3 justify-center"
          >
            <Link href="/accompagnement"
              className="px-6 py-3 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-2xl text-sm font-medium transition-all">
              Voir les programmes
            </Link>
            <Link href="/"
              className="px-6 py-3 bg-gradient-to-r from-[#E8B800] to-[#27A827] text-black font-bold rounded-2xl text-sm transition-all hover:shadow-lg hover:shadow-[#E8B800]/30">
              Retour à l&apos;accueil
            </Link>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  /* ═══════════════ PAGE DE VENTE PREMIUM ═══════════════ */
  return (
    <div className="overflow-hidden bg-white">

      {/* ════════ HERO PARALLAXE ════════ */}
      <section ref={heroRef} className="relative min-h-[85vh] sm:min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Grille de points subtile */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle, #000 1px, transparent 1px)", backgroundSize: "28px 28px" }} />

        {/* Fond dégradé animé */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#f0fdf0] via-white to-[#fef9e7]">
          <motion.div
            animate={{
              background: [
                "radial-gradient(circle at 20% 50%, rgba(39,168,39,0.08) 0%, transparent 60%)",
                "radial-gradient(circle at 80% 50%, rgba(232,184,0,0.08) 0%, transparent 60%)",
                "radial-gradient(circle at 50% 20%, rgba(39,168,39,0.08) 0%, transparent 60%)",
                "radial-gradient(circle at 20% 50%, rgba(232,184,0,0.08) 0%, transparent 60%)",
              ],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0"
          />
        </div>

        {/* Formes flottantes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{ y: [-30, 30, -30], x: [-10, 15, -10], rotate: [0, 90, 180, 270, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[15%] right-[8%] w-20 h-20 rounded-3xl bg-gradient-to-br from-[#E8B800]/15 to-[#E8B800]/5 backdrop-blur-sm border border-[#E8B800]/10"
          />
          <motion.div
            animate={{ y: [20, -25, 20], x: [10, -10, 10] }}
            transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-[20%] left-[5%] w-16 h-16 rounded-full bg-gradient-to-br from-[#27A827]/15 to-[#27A827]/5 border border-[#27A827]/10"
          />
          <motion.div
            animate={{ scale: [1, 1.4, 1], rotate: [0, 45, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[40%] left-[15%] w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-200/20 to-transparent border border-amber-200/10"
          />
          <motion.div
            animate={{ y: [-15, 20, -15], rotate: [0, -60, 0] }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-[35%] right-[12%] w-14 h-14 rounded-full bg-gradient-to-br from-green-200/20 to-transparent border border-green-200/10"
          />
          <motion.div
            animate={{ scale: [0.8, 1.2, 0.8], y: [0, -20, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[60%] right-[30%] w-8 h-8 rounded-lg bg-[#E8B800]/10 border border-[#E8B800]/10"
          />
        </div>

        {/* Contenu hero */}
        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative z-10 max-w-4xl mx-auto px-5 text-center"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/70 backdrop-blur-md border border-[#27A827]/20 rounded-full text-sm text-gray-700 mb-8 shadow-lg shadow-green-500/5"
          >
            <motion.span
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <Sparkles size={16} className="text-[#E8B800]" />
            </motion.span>
            L&apos;écosystème des visionnaires africains
          </motion.div>

          {/* Titre avec révélation mot par mot */}
          <h1 className="text-[2rem] sm:text-[2.8rem] md:text-[3.5rem] lg:text-[4rem] font-extrabold leading-[1.1] mb-6 text-gray-900">
            <WordReveal text="Partagez votre" delay={0.3} />
            <br />
            <span className="relative inline-block">
              <WordReveal text="savoir" delay={0.55} className="bg-gradient-to-r from-[#E8B800] to-amber-500 bg-clip-text text-transparent" />
              <motion.span
                className="absolute -bottom-2 left-0 w-full h-1.5 bg-gradient-to-r from-[#E8B800] to-[#27A827] rounded-full"
                initial={{ scaleX: 0, originX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 1, duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
              />
            </span>
            <WordReveal text=" et contribuez" delay={0.7} />
            <br className="hidden sm:block" />
            <WordReveal text=" à un " delay={0.9} />
            <span className="bg-gradient-to-r from-[#27A827] to-emerald-500 bg-clip-text text-transparent">
              <WordReveal text="monde meilleur" delay={1} className="bg-gradient-to-r from-[#27A827] to-emerald-500 bg-clip-text text-transparent" />
            </span>
          </h1>

          {/* Sous-titre */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4, duration: 0.6 }}
            className="text-gray-500 text-base sm:text-lg md:text-xl max-w-xl mx-auto mb-10 leading-relaxed font-medium"
          >
            Rejoignez le réseau de consultants Smart Life et accompagnez
            les entrepreneurs africains dans leur parcours.
          </motion.p>

          {/* CTA hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.6, duration: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <motion.button
              onClick={openForm}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="relative group flex items-center gap-3 px-8 py-4.5 sm:px-10 sm:py-5 bg-gradient-to-r from-[#E8B800] to-[#27A827] text-black font-bold rounded-2xl text-base sm:text-lg shadow-2xl shadow-[#E8B800]/30 transition-shadow hover:shadow-[#E8B800]/50"
            >
              <motion.span
                className="absolute -inset-1 bg-gradient-to-r from-[#E8B800] to-[#27A827] rounded-2xl opacity-0 group-hover:opacity-30 blur-xl transition-opacity duration-500"
              />
              <span className="relative flex items-center gap-3">
                <Rocket size={20} />
                Devenir Consultant
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
              </span>
            </motion.button>
            <motion.a
              href="#avantages"
              whileHover={{ y: 2 }}
              className="flex items-center gap-2 text-gray-500 hover:text-[#27A827] text-sm font-medium transition-colors"
            >
              Découvrir les avantages
              <motion.span animate={{ y: [0, 4, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                <ChevronDown size={16} />
              </motion.span>
            </motion.a>
          </motion.div>

          {/* Social proof */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2, duration: 0.6 }}
            className="flex items-center justify-center gap-3 mt-10"
          >
            <div className="flex -space-x-2.5">
              {["AM", "JD", "FK", "NB", "SO"].map((initials, i) => (
                <motion.div
                  key={initials}
                  initial={{ scale: 0, x: -10 }}
                  animate={{ scale: 1, x: 0 }}
                  transition={{ delay: 2.1 + i * 0.1, type: "spring", stiffness: 300 }}
                  className="w-9 h-9 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold shadow-md"
                  style={{
                    background: i % 2 === 0
                      ? "linear-gradient(135deg, #E8B800, #d4a017)"
                      : "linear-gradient(135deg, #27A827, #1e8c1e)",
                    color: i % 2 === 0 ? "#000" : "#fff",
                  }}
                >
                  {initials}
                </motion.div>
              ))}
            </div>
            <div className="text-left">
              <p className="text-gray-700 text-xs font-semibold">7 consultants actifs</p>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={10} className="fill-[#E8B800] text-[#E8B800]" />
                ))}
                <span className="text-gray-400 text-[10px] ml-0.5">5.0</span>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.5 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-6 h-10 rounded-full border-2 border-gray-300 flex justify-center pt-2"
          >
            <motion.div
              animate={{ opacity: [1, 0.3, 1], y: [0, 6, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-1.5 h-1.5 rounded-full bg-gray-400"
            />
          </motion.div>
        </motion.div>
      </section>

      {/* ════════ CHIFFRES AVEC CARTES VERRE ════════ */}
      <section className="relative py-12 sm:py-16 bg-gradient-to-b from-white to-gray-50/50">
        <div className="max-w-5xl mx-auto px-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            {[
              { value: 7, suffix: "", label: "Consultants actifs", icon: Users, gradient: "from-green-500 to-emerald-600" },
              { value: 15000, suffix: "+", label: "Ebooks vendus", icon: TrendingUp, gradient: "from-[#E8B800] to-amber-500" },
              { value: 100, suffix: "%", label: "Gratuit pour postuler", icon: Gift, gradient: "from-[#27A827] to-green-600" },
              { value: 48, suffix: "h", label: "Réponse garantie", icon: Zap, gradient: "from-amber-500 to-[#E8B800]" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
              >
                <GlowCard>
                  <div className="p-5 sm:p-6 text-center">
                    <div className={`inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-br ${stat.gradient} mb-3 shadow-lg`}>
                      <stat.icon size={20} className="text-white" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-gray-900 mb-1">
                      <Counter value={stat.value} suffix={stat.suffix} />
                    </div>
                    <p className="text-gray-500 text-xs sm:text-sm font-medium">{stat.label}</p>
                  </div>
                </GlowCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ BANDE DE CONFIANCE ════════ */}
      <section className="py-6 sm:py-8 bg-white">
        <div className="max-w-5xl mx-auto px-5">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 p-5 sm:p-6 bg-gradient-to-r from-green-50/60 via-white to-yellow-50/60 border border-gray-100 rounded-3xl"
          >
            <div className="flex -space-x-3">
              {["AM", "JD", "FK", "NB", "SO", "LM", "PK"].map((initials, i) => (
                <div
                  key={initials}
                  className="w-10 h-10 rounded-full border-[2.5px] border-white flex items-center justify-center text-[10px] font-bold shadow-sm"
                  style={{
                    background: i % 2 === 0
                      ? "linear-gradient(135deg, #E8B800, #d4a017)"
                      : "linear-gradient(135deg, #27A827, #1e8c1e)",
                    color: i % 2 === 0 ? "#000" : "#fff",
                  }}
                >
                  {initials}
                </div>
              ))}
            </div>
            <div className="text-center sm:text-left">
              <p className="text-gray-900 text-sm font-bold">Rejoignez les 7 consultants qui font déjà la différence</p>
              <p className="text-gray-500 text-xs">Chaque consultant crée de la valeur pour des dizaines d&apos;entrepreneurs</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ════════ AVANTAGES PREMIUM ════════ */}
      <section id="avantages" className="py-14 sm:py-20 px-5 bg-gradient-to-b from-gray-50/50 to-white">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ type: "spring", stiffness: 300 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full text-sm text-[#27A827] font-semibold mb-4"
            >
              <Target size={14} />
              Vos avantages
            </motion.div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">
              Pourquoi devenir consultant{" "}
              <span className="bg-gradient-to-r from-[#E8B800] to-[#27A827] bg-clip-text text-transparent">Smart Life</span> ?
            </h2>
            <p className="text-gray-500 max-w-lg mx-auto text-sm sm:text-base">
              Une opportunité unique de partager votre expertise et de contribuer
              à l&apos;émergence d&apos;entrepreneurs africains.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: Heart, title: "Impact social réel",
                desc: "Chaque entrepreneur que vous accompagnez crée de la valeur dans sa communauté. Votre savoir a un effet multiplicateur.",
                gradient: "from-rose-500 to-pink-600", bg: "from-rose-50 to-pink-50",
              },
              {
                icon: Globe, title: "Visibilité panafricaine",
                desc: "Votre profil est visible par tous les membres de l'écosystème Smart Life. Des missions vous trouvent, pas l'inverse.",
                gradient: "from-[#27A827] to-emerald-600", bg: "from-green-50 to-emerald-50",
              },
              {
                icon: TrendingUp, title: "Revenus complémentaires",
                desc: "Chaque mission d'accompagnement est rémunérée. Développez une source de revenus basée sur votre expertise.",
                gradient: "from-[#E8B800] to-amber-500", bg: "from-yellow-50 to-amber-50",
              },
              {
                icon: Users, title: "Communauté d'experts",
                desc: "Rejoignez un réseau de consultants partageant les mêmes valeurs. Échangez, apprenez, grandissez ensemble.",
                gradient: "from-blue-500 to-indigo-600", bg: "from-blue-50 to-indigo-50",
              },
              {
                icon: Award, title: "Formation continue",
                desc: "Accédez à des ressources exclusives et des formations pour affiner vos compétences d'accompagnement.",
                gradient: "from-purple-500 to-violet-600", bg: "from-purple-50 to-violet-50",
              },
              {
                icon: Shield, title: "Cadre professionnel",
                desc: "Smart Life vous offre un cadre structuré : outils, méthodologie et support pour réussir vos missions.",
                gradient: "from-teal-500 to-cyan-600", bg: "from-teal-50 to-cyan-50",
              },
            ].map((a, i) => (
              <motion.div
                key={a.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
              >
                <motion.div
                  whileHover={{ y: -6, transition: { duration: 0.3 } }}
                  className={`relative p-6 rounded-3xl bg-gradient-to-br ${a.bg} border border-white h-full group cursor-default overflow-hidden shadow-lg shadow-gray-100/60`}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/40 blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white/30 blur-2xl translate-y-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className={`relative w-12 h-12 rounded-2xl bg-gradient-to-br ${a.gradient} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 group-hover:shadow-xl transition-all duration-300`}>
                    <a.icon size={22} className="text-white" />
                  </div>
                  <h3 className="relative text-gray-900 font-bold text-base mb-2">{a.title}</h3>
                  <p className="relative text-gray-600 text-sm leading-relaxed">{a.desc}</p>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ COMMENT ÇA MARCHE — TIMELINE ════════ */}
      <section className="py-14 sm:py-20 bg-white px-5">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-3">
              Comment ça marche ?
            </h2>
            <p className="text-gray-500 text-sm sm:text-base max-w-md mx-auto">
              Un processus simple, de la candidature à votre première mission.
            </p>
          </motion.div>

          {/* Timeline mobile-first (vertical sur mobile, horizontal sur desktop) */}
          <div className="relative">
            {/* Ligne de connexion mobile (verticale au centre) */}
            <div className="md:hidden absolute top-16 bottom-16 left-1/2 w-[3px] -translate-x-1/2">
              <motion.div
                initial={{ scaleY: 0, originY: 0 }}
                whileInView={{ scaleY: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                className="w-full h-full bg-gradient-to-b from-[#E8B800] via-[#27A827] to-[#E8B800] rounded-full opacity-20"
              />
            </div>

            {/* Ligne de connexion desktop */}
            <div className="hidden md:block absolute top-20 left-[12.5%] right-[12.5%] h-[3px]">
              <motion.div
                initial={{ scaleX: 0, originX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
                className="w-full h-full bg-gradient-to-r from-[#E8B800] via-[#27A827] to-[#E8B800] rounded-full"
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {[
                { n: "01", title: "Candidature", desc: "Remplissez le formulaire en 3 minutes", icon: FileText, gradient: "from-[#E8B800] to-amber-500" },
                { n: "02", title: "Examen", desc: "Notre équipe étudie votre profil sous 48h", icon: Target, gradient: "from-amber-500 to-orange-500" },
                { n: "03", title: "Validation", desc: "Votre profil est publié sur la plateforme", icon: CheckCircle, gradient: "from-[#27A827] to-emerald-500" },
                { n: "04", title: "Missions", desc: "Accompagnez vos premiers clients", icon: Rocket, gradient: "from-emerald-500 to-green-600" },
              ].map((step, i) => (
                <motion.div
                  key={step.n}
                  initial={{ opacity: 0, y: 30, scale: 0.9 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + i * 0.15, duration: 0.5, type: "spring", stiffness: 200 }}
                >
                  <motion.div
                    whileHover={{ y: -4 }}
                    className="relative text-center p-5 sm:p-6"
                  >
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${step.gradient} mb-4 shadow-lg`}
                    >
                      <step.icon size={24} className="text-white" />
                    </motion.div>
                    <div className="text-xs font-bold text-gray-400 mb-1">{step.n}</div>
                    <h3 className="text-gray-900 font-bold text-sm sm:text-base mb-2">{step.title}</h3>
                    <p className="text-gray-500 text-xs sm:text-sm leading-relaxed">{step.desc}</p>
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════ TÉMOIGNAGE CONSULTANT ════════ */}
      <section className="py-10 sm:py-14 px-5 bg-white">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8"
          >
            <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">
              Ce que disent nos consultants
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-5">
            {[
              {
                name: "Amadou M.",
                role: "Consultant en Agriculture",
                quote: "Grâce à Smart Life, je partage mon expertise avec des entrepreneurs qui en ont vraiment besoin. L'impact est concret et visible.",
                initials: "AM",
              },
              {
                name: "Fatou K.",
                role: "Consultante en Business Numérique",
                quote: "Le cadre professionnel et le support de l'équipe Smart Life m'ont permis de développer une activité de conseil épanouissante.",
                initials: "FK",
              },
            ].map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 25, scale: 0.97 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
              >
                <div className="relative p-6 sm:p-7 bg-gradient-to-br from-white to-gray-50/50 border border-gray-100 rounded-3xl shadow-lg shadow-gray-100/50 h-full">
                  <div className="absolute top-4 right-5 text-4xl text-[#E8B800]/15 font-serif select-none">&ldquo;</div>
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center text-xs font-bold shadow-md"
                      style={{
                        background: i === 0
                          ? "linear-gradient(135deg, #27A827, #1e8c1e)"
                          : "linear-gradient(135deg, #E8B800, #d4a017)",
                        color: i === 0 ? "#fff" : "#000",
                      }}
                    >
                      {t.initials}
                    </div>
                    <div>
                      <p className="text-gray-900 text-sm font-bold">{t.name}</p>
                      <p className="text-[#27A827] text-xs font-medium flex items-center gap-1">
                        <CheckCircle size={11} /> {t.role}
                      </p>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed italic">{t.quote}</p>
                  <div className="flex items-center gap-1 mt-4">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} size={12} className="fill-[#E8B800] text-[#E8B800]" />
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ CITATION GLASSMORPHISM ════════ */}
      <section className="py-10 sm:py-16 px-5 bg-gradient-to-br from-green-50/80 via-white to-yellow-50/80">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="relative p-8 sm:p-12 bg-white/70 backdrop-blur-xl rounded-[2rem] border border-white shadow-xl shadow-green-500/5 text-center overflow-hidden">
              <div className="absolute top-0 left-0 w-40 h-40 bg-gradient-to-br from-[#E8B800]/10 to-transparent rounded-full -translate-x-1/2 -translate-y-1/2" />
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-[#27A827]/10 to-transparent rounded-full translate-x-1/2 translate-y-1/2" />

              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                whileInView={{ scale: 1, rotate: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2, type: "spring" }}
                className="text-6xl text-[#E8B800]/25 font-serif mb-4 select-none"
              >
                &ldquo;
              </motion.div>
              <p className="relative text-gray-800 text-base sm:text-lg md:text-xl leading-relaxed italic mb-8 font-medium">
                Devenir consultant chez Smart Life, c&apos;est saisir l&apos;opportunité
                de partager votre savoir-faire et votre expérience pour aider
                d&apos;autres entrepreneurs à éviter les pièges du terrain.
                C&apos;est contribuer concrètement à un monde meilleur.
              </p>
              <div className="relative flex items-center justify-center gap-3">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#E8B800] to-[#27A827] flex items-center justify-center text-white font-bold text-sm shadow-lg">
                  SL
                </div>
                <div className="text-left">
                  <p className="text-gray-900 text-sm font-bold">L&apos;équipe Smart Life</p>
                  <p className="text-gray-500 text-xs">L&apos;écosystème des visionnaires africains</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ════════ CTA PRINCIPAL ════════ */}
      <AnimatePresence>
        {!showForm && (
          <motion.section
            exit={{ opacity: 0, height: 0 }}
            className="py-14 sm:py-20 px-5 bg-white"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-2xl mx-auto text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ type: "spring", stiffness: 300 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full text-xs text-[#27A827] font-bold mb-5"
              >
                <motion.span
                  animate={{ scale: [1, 1.4, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-2 h-2 rounded-full bg-[#27A827]"
                />
                Recrutement ouvert
              </motion.div>

              <motion.div
                whileInView={{ scale: [0.9, 1] }}
                viewport={{ once: true }}
                className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-br from-[#E8B800]/10 to-[#27A827]/10 border border-[#E8B800]/20 mb-6"
              >
                <Star size={28} className="text-[#E8B800]" />
              </motion.div>

              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">
                Prêt à rejoindre l&apos;aventure ?
              </h2>
              <p className="text-gray-500 text-sm sm:text-base max-w-md mx-auto mb-10">
                La candidature est 100% gratuite et prend moins de 3 minutes.
                Notre équipe vous répond sous 48 heures.
              </p>

              <motion.button
                onClick={openForm}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="relative group inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-[#E8B800] to-[#27A827] text-black font-bold rounded-2xl text-lg shadow-2xl shadow-[#E8B800]/25 transition-all"
              >
                <motion.span
                  className="absolute -inset-2 bg-gradient-to-r from-[#E8B800] to-[#27A827] rounded-3xl opacity-0 group-hover:opacity-20 blur-2xl transition-opacity duration-700"
                />
                <span className="relative flex items-center gap-3">
                  <Sparkles size={22} />
                  Postuler maintenant
                  <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
                </span>
              </motion.button>

              <div className="flex items-center justify-center gap-5 mt-8 text-xs text-gray-400 font-medium">
                <span className="flex items-center gap-1.5"><Shield size={13} /> Données protégées</span>
                <span className="flex items-center gap-1.5"><CheckCircle size={13} /> 100% gratuit</span>
                <span className="flex items-center gap-1.5"><Zap size={13} /> Réponse sous 48h</span>
              </div>
            </motion.div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* ════════ FORMULAIRE PROGRESSIF PREMIUM ════════ */}
      <AnimatePresence>
        {showForm && (
          <motion.section
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="py-10 sm:py-16 px-5 bg-gradient-to-b from-white via-green-50/20 to-white"
          >
            <div className="max-w-2xl mx-auto" ref={formRef}>
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-center mb-10"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-full text-sm text-[#27A827] font-semibold mb-5"
                >
                  <Rocket size={15} />
                  Formulaire de candidature
                </motion.div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">
                  Rejoignez notre réseau
                </h2>
                <p className="text-gray-500 text-sm font-medium">
                  3 étapes simples. Moins de 3 minutes.
                </p>
              </motion.div>

              <StepBar current={currentStep} />

              <AnimatePresence mode="wait">
                {/* ── Étape 1 ── */}
                {currentStep === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 40, scale: 0.98 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -40, scale: 0.98 }}
                    transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="p-6 sm:p-8 bg-white/80 backdrop-blur-sm border border-gray-100 rounded-3xl shadow-xl shadow-gray-200/50 space-y-5"
                  >
                    <h3 className="text-gray-900 font-bold text-lg flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#E8B800] to-amber-500 flex items-center justify-center">
                        <User size={16} className="text-white" />
                      </div>
                      Vos informations
                    </h3>

                    <div className="flex flex-col items-center gap-3">
                      <div className="relative group">
                        <button type="button" onClick={() => photoInputRef.current?.click()} disabled={photoUploading}
                          className={`${photoPreview ? "" : "cta-respire"} relative w-28 h-28 rounded-full border-[3px] border-dashed ${errors.photoUrl ? "border-red-400 bg-red-50" : "border-[#E8B800] bg-[#fffbea]"} overflow-hidden flex items-center justify-center transition-all group-hover:shadow-lg group-hover:shadow-[#E8B800]/20 focus:outline-none`}>
                          {photoPreview ? (
                            <Image src={photoPreview} alt="Aperçu photo" fill className="object-cover rounded-full" unoptimized />
                          ) : (
                            <div className="flex flex-col items-center gap-1 text-[#b38f00]">
                              {photoUploading ? <span className="w-5 h-5 border-2 border-gray-300 border-t-[#E8B800] rounded-full animate-spin" /> : <Camera size={26} />}
                              <span className="text-[11px] font-bold">Ajouter</span>
                            </div>
                          )}
                        </button>
                        {photoPreview && !photoUploading && (
                          <button type="button" onClick={removePhoto}
                            className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow hover:bg-red-600 transition-colors">
                            <X size={12} />
                          </button>
                        )}
                      </div>
                      <p className="text-[13px] font-bold text-[#111827]">
                        {photoUploading ? "Envoi de la photo…" : photoPreview ? "✅ Photo ajoutée" : <>Votre photo de profil <span className="text-[#E8B800]">*</span> (obligatoire)</>}
                      </p>
                      {!photoPreview && !photoUploading && (
                        <p className="text-[12px] text-gray-500 text-center max-w-xs">Une photo nette de votre visage : les clients font confiance à un consultant qu&apos;ils peuvent voir.</p>
                      )}
                      {(photoError || errors.photoUrl) && <p className="text-red-500 text-xs font-semibold text-center">{photoError || errors.photoUrl}</p>}
                      <input ref={photoInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" className="hidden" onChange={handlePhotoChange} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={labelCls}>Prénom <span className="text-[#E8B800]">*</span></label>
                        <input type="text" value={form.prenom} onChange={(e) => setField("prenom", e.target.value)} className={inputCls} placeholder="Jean" />
                        {errors.prenom && <p className="text-red-400 text-xs mt-1">{errors.prenom}</p>}
                      </div>
                      <div>
                        <label className={labelCls}>Nom <span className="text-[#E8B800]">*</span></label>
                        <input type="text" value={form.nom} onChange={(e) => setField("nom", e.target.value)} className={inputCls} placeholder="Dupont" />
                        {errors.nom && <p className="text-red-400 text-xs mt-1">{errors.nom}</p>}
                      </div>
                    </div>

                    <div>
                      <label className={labelCls}><Mail size={13} className="inline mr-1 text-gray-400" />Email <span className="text-[#E8B800]">*</span></label>
                      <input type="email" value={form.email} onChange={(e) => setField("email", e.target.value)} className={inputCls} placeholder="jean.dupont@exemple.com" />
                      {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={labelCls}><Phone size={13} className="inline mr-1 text-gray-400" />Téléphone <span className="text-[#E8B800]">*</span></label>
                        <input type="tel" value={form.telephone} onChange={(e) => setField("telephone", e.target.value)} className={inputCls} placeholder="+237 6XX XXX XXX" />
                        {errors.telephone && <p className="text-red-400 text-xs mt-1">{errors.telephone}</p>}
                      </div>
                      <div>
                        <label className={labelCls}><MapPin size={13} className="inline mr-1 text-gray-400" />Ville <span className="text-[#E8B800]">*</span></label>
                        <input type="text" value={form.ville} onChange={(e) => setField("ville", e.target.value)} className={inputCls} placeholder="Douala" />
                        {errors.ville && <p className="text-red-400 text-xs mt-1">{errors.ville}</p>}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ── Étape 2 ── */}
                {currentStep === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 40, scale: 0.98 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -40, scale: 0.98 }}
                    transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="p-6 sm:p-8 bg-white/80 backdrop-blur-sm border border-gray-100 rounded-3xl shadow-xl shadow-gray-200/50 space-y-5"
                  >
                    <h3 className="text-gray-900 font-bold text-lg flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#E8B800] to-amber-500 flex items-center justify-center">
                        <Briefcase size={16} className="text-white" />
                      </div>
                      Votre expertise
                    </h3>

                    <div>
                      <label className={labelCls}>Années d&apos;expérience <span className="text-[#E8B800]">*</span></label>
                      <div className="flex flex-wrap gap-2">
                        {EXPERIENCE_OPTIONS.map((opt) => (
                          <motion.button key={opt} type="button"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setField("anneesExperience", opt)}
                            className={`px-4 py-2.5 rounded-2xl border-2 text-sm font-medium transition-all ${
                              form.anneesExperience === opt
                                ? "bg-gradient-to-r from-[#E8B800] to-amber-400 border-transparent text-black shadow-lg shadow-[#E8B800]/20"
                                : "border-gray-200 text-gray-600 hover:border-[#E8B800]/50"
                            }`}>
                            {opt}
                          </motion.button>
                        ))}
                      </div>
                      {errors.anneesExperience && <p className="text-red-400 text-xs mt-1">{errors.anneesExperience}</p>}
                    </div>

                    <div>
                      <label className={labelCls}>
                        Domaines d&apos;expertise <span className="text-[#E8B800]">*</span>
                        <span className="text-gray-400 ml-2 text-xs font-normal">(programmes que vous pouvez encadrer)</span>
                      </label>
                      {espaces.length === 0 ? (
                        <p className="text-gray-500 text-sm">Aucun programme disponible pour le moment.</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {espaces.map((e) => (
                            <motion.button key={e.id} type="button"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => toggleDomaine(e.id)}
                              className={`px-4 py-2 rounded-2xl border-2 text-sm font-medium transition-all ${
                                form.domainesIds.includes(e.id)
                                  ? "bg-gradient-to-r from-[#27A827] to-emerald-500 border-transparent text-white shadow-lg shadow-green-500/20"
                                  : "border-gray-200 text-gray-600 hover:border-[#27A827]/50"
                              }`}>
                              {form.domainesIds.includes(e.id) && "✓ "}{e.titre}
                            </motion.button>
                          ))}
                        </div>
                      )}
                      {errors.domainesIds && <p className="text-red-400 text-xs mt-1">{errors.domainesIds}</p>}
                    </div>

                    <div>
                      <label className={labelCls}>
                        <Link2 size={13} className="inline mr-1 text-gray-400" />LinkedIn ou portfolio
                        <span className="text-gray-400 ml-2 text-xs font-normal">optionnel</span>
                      </label>
                      <input type="text" value={form.portfolioUrl} onChange={(e) => setField("portfolioUrl", e.target.value)}
                        className={inputCls} placeholder="https://linkedin.com/in/votre-profil" />
                    </div>
                  </motion.div>
                )}

                {/* ── Étape 3 ── */}
                {currentStep === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 40, scale: 0.98 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -40, scale: 0.98 }}
                    transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="p-6 sm:p-8 bg-white/80 backdrop-blur-sm border border-gray-100 rounded-3xl shadow-xl shadow-gray-200/50 space-y-5"
                  >
                    <h3 className="text-gray-900 font-bold text-lg flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#E8B800] to-amber-500 flex items-center justify-center">
                        <FileText size={16} className="text-white" />
                      </div>
                      Votre motivation
                    </h3>

                    <div>
                      <label className={labelCls}>
                        Pourquoi souhaitez-vous rejoindre Smart Life ? <span className="text-[#E8B800]">*</span>
                        <span className="text-gray-400 ml-2 text-xs font-normal">(min. 50 caractères)</span>
                      </label>
                      <textarea rows={5} value={form.motivation} onChange={(e) => setField("motivation", e.target.value)}
                        className={`${inputCls} resize-none`}
                        placeholder="Décrivez votre parcours, vos réalisations et pourquoi vous souhaitez rejoindre le réseau SMART LIFE…" />
                      <div className="flex items-center justify-between mt-1.5">
                        {errors.motivation ? <p className="text-red-400 text-xs">{errors.motivation}</p> : <span />}
                        <span className={`text-xs font-semibold ${form.motivation.length < 50 ? "text-gray-300" : "text-[#27A827]"}`}>
                          {form.motivation.length} / 50
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className={labelCls}>
                        <Gift size={13} className="inline mr-1 text-gray-400" />Code de parrainage
                        <span className="text-gray-400 ml-2 text-xs font-normal">optionnel</span>
                      </label>
                      <input type="text" value={form.codeParrainage} onChange={(e) => setField("codeParrainage", e.target.value.toUpperCase())}
                        className={inputCls} placeholder="ex : SL-XXXXXX" maxLength={20} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Navigation */}
              <div className={`flex mt-6 gap-3 ${currentStep === 1 ? "justify-end" : "justify-between"}`}>
                {currentStep > 1 && (
                  <motion.button type="button" onClick={goPrev}
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-2 px-6 py-3.5 border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-600 rounded-2xl text-sm font-semibold transition-all">
                    <ArrowRight size={15} className="rotate-180" /> Précédent
                  </motion.button>
                )}

                {currentStep < 3 ? (
                  <motion.button type="button" onClick={goNext}
                    whileHover={{ scale: 1.03, boxShadow: "0 12px 30px rgba(232, 184, 0, 0.3)" }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-[#E8B800] to-amber-400 text-black font-bold rounded-2xl text-sm transition-all shadow-lg shadow-[#E8B800]/20">
                    Suivant
                    <ArrowRight size={15} />
                  </motion.button>
                ) : (
                  <motion.button type="button" onClick={handleSubmit} disabled={loading}
                    whileHover={!loading ? { scale: 1.03, boxShadow: "0 15px 40px rgba(39, 168, 39, 0.3)" } : {}}
                    whileTap={!loading ? { scale: 0.97 } : {}}
                    className="flex items-center gap-2 px-8 py-4.5 bg-gradient-to-r from-[#E8B800] to-[#27A827] text-black font-bold rounded-2xl transition-all disabled:opacity-60 text-sm shadow-xl shadow-green-500/20">
                    {loading
                      ? <><span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Envoi en cours...</>
                      : <><Send size={15} /> Envoyer ma candidature</>}
                  </motion.button>
                )}
              </div>

              {/* Réassurance */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex flex-wrap items-center justify-center gap-5 mt-8 text-xs text-gray-400 font-medium"
              >
                <span className="flex items-center gap-1.5"><Shield size={13} className="text-[#27A827]" /> Données protégées</span>
                <span className="flex items-center gap-1.5"><CheckCircle size={13} className="text-[#27A827]" /> 100% gratuit</span>
                <span className="flex items-center gap-1.5"><Zap size={13} className="text-[#E8B800]" /> Réponse sous 48h</span>
              </motion.div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* ════════ CTA FLOTTANT MOBILE ════════ */}
      <AnimatePresence>
        {showFloatingCTA && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-20 left-4 right-4 z-40 lg:hidden"
          >
            <motion.button
              onClick={openForm}
              whileTap={{ scale: 0.97 }}
              className="w-full flex items-center justify-center gap-2.5 py-4 bg-gradient-to-r from-[#E8B800] to-[#27A827] text-black font-bold rounded-2xl text-sm shadow-2xl shadow-black/20"
            >
              <Sparkles size={17} />
              Devenir Consultant — Gratuit
              <ArrowRight size={15} />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
