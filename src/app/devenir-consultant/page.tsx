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
  ArrowRight, Users, Globe, TrendingUp, Heart, Shield, Award,
  ChevronDown, Zap, Target, Rocket, Check,
} from "lucide-react";
import { useAccompagnementStore, EspacePersonnalise } from "@/lib/accompagnement-store";

/* ───────── Styles ───────── */
const inputCls =
  "w-full px-4 py-3.5 bg-white border border-[var(--g-ligne)] rounded-[10px] text-[var(--g-encre)] placeholder-gray-400 focus:outline-none focus:border-[var(--g-encre)] transition-colors text-sm";
const labelCls = "block text-[var(--g-encre)] text-sm font-medium mb-2";

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
// Titre affiché tout de suite (sans apparition mot par mot) : visible même sur une connexion lente.
// « delay » est gardé pour ne pas changer les appels existants.
function WordReveal({ text, className = "" }: { text: string; className?: string; delay?: number }) {
  return (
    <>
      <span className={className}>{text.trim()}</span>{" "}
    </>
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
  "On commence : votre photo et vos coordonnées.",
  "Très bien ! Parlez-nous de votre expérience.",
  "Dernière étape : pourquoi vous rejoindre ?",
];

/* ───────── Barre de progression ───────── */
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
              <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-semibold transition-colors duration-300 ${
                done
                  ? "bg-[var(--g-vert)] text-white"
                  : active
                  ? "bg-[var(--g-jaune)] text-[var(--g-encre)]"
                  : "bg-[var(--g-doux)] text-gray-400"
              }`}>
                {done ? <CheckCircle size={18} /> : <Icon size={18} />}
              </div>
              <span className={`text-xs font-semibold transition-colors duration-300 ${
                active ? "text-[var(--g-encre)]" : done ? "text-[var(--g-vert)]" : "text-gray-400"
              }`}>
                {s.label}
              </span>
            </div>
          );
        })}
      </div>

      <div className="relative h-1.5 bg-[var(--g-doux)] rounded-full overflow-hidden">
        <motion.div
          className="absolute left-0 top-0 h-full rounded-full bg-[var(--g-vert)]"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        />
      </div>

      <div className="flex items-center justify-between mt-2">
        <motion.p
          key={current}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-[13px] font-semibold text-[var(--g-vert)]"
        >
          {ENCOURAGEMENTS[current - 1]}
        </motion.p>
        <p className="text-xs text-[var(--g-gris)] font-semibold whitespace-nowrap">
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
    // Ne recalcule la page que lorsque le bouton flottant doit apparaître ou disparaître (défilement fluide)
    let visible: boolean | null = null;
    const onScroll = () => {
      const v = window.scrollY > 500 && !showForm && !done;
      if (v !== visible) { visible = v; setShowFloatingCTA(v); }
    };
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
      <div className="min-h-screen flex items-center justify-center px-4 bg-[var(--g-doux)]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="max-w-md w-full text-center bg-white border border-[var(--g-ligne)] rounded-[18px] p-8 sm:p-10"
        >
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="w-20 h-20 mx-auto rounded-full bg-[var(--g-vert-doux)] flex items-center justify-center mb-7"
          >
            <CheckCircle size={40} className="text-[var(--g-vert)]" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="text-3xl font-semibold tracking-[-0.02em] text-[var(--g-encre)] mb-4"
          >
            Candidature envoyée !
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="text-[var(--g-gris)] mb-2 leading-relaxed"
          >
            Notre équipe va l&apos;examiner et vous contactera sous{" "}
            <span className="text-[var(--g-encre)] font-semibold">48 à 72 heures</span>.
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55 }}
            className="text-[var(--g-gris)] text-sm mb-9"
          >
            Si votre profil est validé, votre prénom apparaîtra dans l&apos;espace consultants.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 }}
            className="flex flex-wrap gap-3 justify-center"
          >
            <Link href="/accompagnement" className="g-btn-ghost text-sm">
              Voir les programmes
            </Link>
            <Link href="/" className="g-btn text-sm">
              Retour à l&apos;accueil
            </Link>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  /* ═══════════════ PAGE DE VENTE ═══════════════ */
  return (
    <div className="overflow-hidden bg-white text-[var(--g-encre)]">

      {/* ════════ HERO ════════ */}
      <section ref={heroRef} className="relative min-h-[80vh] sm:min-h-[85vh] flex items-center justify-center overflow-hidden bg-white">
        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative z-10 max-w-4xl mx-auto px-5 text-center"
        >
          {/* Étiquette */}
          <motion.p
            initial={false}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-[14px] font-semibold text-[var(--g-vert)] mb-6"
          >
            L&apos;écosystème des visionnaires africains
          </motion.p>

          {/* Titre avec révélation mot par mot */}
          <h1 className="text-[2.4rem] sm:text-[3.2rem] md:text-[4rem] lg:text-[4.6rem] font-semibold leading-[1.04] tracking-[-0.035em] mb-6 text-[var(--g-encre)]">
            <WordReveal text="Partagez votre" delay={0.3} />
            <WordReveal text="savoir" delay={0.5} className="g-surligne" />
            <WordReveal text=" et contribuez" delay={0.65} />
            <br className="hidden sm:block" />
            <WordReveal text=" à un " delay={0.85} />
            <WordReveal text="monde meilleur" delay={0.95} className="g-surligne" />
          </h1>

          {/* Sous-titre */}
          <motion.p
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.5 }}
            className="text-[var(--g-gris)] text-[18px] sm:text-[20px] max-w-xl mx-auto mb-10 leading-[1.45]"
          >
            Rejoignez le réseau de consultants Smart Life et accompagnez
            les entrepreneurs africains dans leur parcours.
          </motion.p>

          {/* CTA hero */}
          <motion.div
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.35, duration: 0.5 }}
            className="flex flex-col sm:flex-row gap-3 justify-center items-center"
          >
            <button onClick={openForm} className="g-btn">
              Devenir Consultant
              <ArrowRight size={18} />
            </button>
            <a href="#avantages" className="g-btn-ghost">
              Découvrir les avantages
              <ChevronDown size={17} />
            </a>
          </motion.div>

          {/* Preuve sociale */}
          <motion.div
            initial={false}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.6, duration: 0.5 }}
            className="flex items-center justify-center gap-3 mt-10"
          >
            <div className="flex -space-x-2.5">
              {["AM", "JD", "FK", "NB", "SO"].map((initials, i) => (
                <div
                  key={initials}
                  className="w-9 h-9 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-semibold"
                  style={{
                    background: i % 2 === 0 ? "var(--g-jaune)" : "var(--g-vert)",
                    color: i % 2 === 0 ? "var(--g-encre)" : "#fff",
                  }}
                >
                  {initials}
                </div>
              ))}
            </div>
            <div className="text-left">
              <p className="text-[var(--g-encre)] text-xs font-semibold">7 consultants actifs</p>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={10} className="fill-[var(--g-jaune)] text-[var(--g-jaune)]" />
                ))}
                <span className="text-[var(--g-gris)] text-[10px] ml-0.5">5.0</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ════════ CHIFFRES ════════ */}
      <section className="bg-[var(--g-vert-profond)]">
        <div className="max-w-5xl mx-auto px-5 py-10 sm:py-12">
          <div className="grid grid-cols-2 sm:grid-cols-4">
            {[
              { value: 7, suffix: "", label: "Consultants actifs" },
              { value: 15000, suffix: "+", label: "Ebooks vendus" },
              { value: 100, suffix: "%", label: "Gratuit pour postuler" },
              { value: 48, suffix: "h", label: "Réponse garantie" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: i * 0.08, duration: 0.45 }}
                className={`py-5 pr-4 ${i % 2 === 1 ? "pl-4 border-l border-white/20" : ""} ${i === 2 ? "sm:pl-4 sm:border-l sm:border-white/20" : ""}`}
              >
                <span className="block h-[3px] w-7 rounded-full bg-[var(--g-jaune)] mb-4" aria-hidden="true" />
                <p className="g-chiffre" style={{ color: "#fff" }}>
                  <Counter value={stat.value} suffix={stat.suffix} />
                </p>
                <p className="mt-2 text-white/75 text-[14px]">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ BANDE DE CONFIANCE ════════ */}
      <section className="pt-10 sm:pt-12 bg-white">
        <div className="max-w-5xl mx-auto px-5">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 p-5 sm:p-6 bg-[var(--g-doux)] rounded-[16px]"
          >
            <div className="flex -space-x-3">
              {["AM", "JD", "FK", "NB", "SO", "LM", "PK"].map((initials, i) => (
                <div
                  key={initials}
                  className="w-10 h-10 rounded-full border-[2.5px] border-[var(--g-doux)] flex items-center justify-center text-[10px] font-semibold"
                  style={{
                    background: i % 2 === 0 ? "var(--g-jaune)" : "var(--g-vert)",
                    color: i % 2 === 0 ? "var(--g-encre)" : "#fff",
                  }}
                >
                  {initials}
                </div>
              ))}
            </div>
            <div className="text-center sm:text-left">
              <p className="text-[var(--g-encre)] text-sm font-semibold">Rejoignez les 7 consultants qui font déjà la différence</p>
              <p className="text-[var(--g-gris)] text-xs">Chaque consultant crée de la valeur pour des dizaines d&apos;entrepreneurs</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ════════ AVANTAGES ════════ */}
      <section id="avantages" className="py-14 sm:py-20 px-5 bg-white">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <p className="text-[14px] font-semibold text-[var(--g-vert)] mb-3">
              Vos avantages
            </p>
            <h2 className="g-titre-section mb-4">
              Pourquoi devenir consultant{" "}
              <span className="g-surligne">Smart Life</span> ?
            </h2>
            <p className="text-[var(--g-gris)] max-w-lg mx-auto text-sm sm:text-base">
              Une opportunité unique de partager votre expertise et de contribuer
              à l&apos;émergence d&apos;entrepreneurs africains.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                icon: Heart, title: "Impact social réel",
                desc: "Chaque entrepreneur que vous accompagnez crée de la valeur dans sa communauté. Votre savoir a un effet multiplicateur.",
              },
              {
                icon: Globe, title: "Visibilité panafricaine",
                desc: "Votre profil est visible par tous les membres de l'écosystème Smart Life. Des missions vous trouvent, pas l'inverse.",
              },
              {
                icon: TrendingUp, title: "Revenus complémentaires",
                desc: "Chaque mission d'accompagnement est rémunérée. Développez une source de revenus basée sur votre expertise.",
              },
              {
                icon: Users, title: "Communauté d'experts",
                desc: "Rejoignez un réseau de consultants partageant les mêmes valeurs. Échangez, apprenez, grandissez ensemble.",
              },
              {
                icon: Award, title: "Formation continue",
                desc: "Accédez à des ressources exclusives et des formations pour affiner vos compétences d'accompagnement.",
              },
              {
                icon: Shield, title: "Cadre professionnel",
                desc: "Smart Life vous offre un cadre structuré : outils, méthodologie et support pour réussir vos missions.",
              },
            ].map((a, i) => (
              <motion.div
                key={a.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ delay: i * 0.06, duration: 0.45 }}
                className="p-6 rounded-[16px] bg-white border border-[var(--g-ligne)] h-full"
              >
                <div className="w-11 h-11 rounded-[12px] bg-[var(--g-vert-doux)] flex items-center justify-center mb-4">
                  <a.icon size={21} className="text-[var(--g-vert)]" />
                </div>
                <h3 className="text-[var(--g-encre)] font-semibold tracking-[-0.02em] text-[17px] mb-2">{a.title}</h3>
                <p className="text-[var(--g-gris)] text-sm leading-relaxed">{a.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ COMMENT ÇA MARCHE — ÉTAPES ════════ */}
      <section className="py-14 sm:py-20 bg-[var(--g-doux)] px-5">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="g-titre-section mb-3">
              Comment ça marche ?
            </h2>
            <p className="text-[var(--g-gris)] text-sm sm:text-base max-w-md mx-auto">
              Un processus simple, de la candidature à votre première mission.
            </p>
          </motion.div>

          {/* Étapes (2 colonnes sur mobile, 4 sur ordinateur) */}
          <div className="relative">
            {/* Filet de liaison (ordinateur) */}
            <div className="hidden md:block absolute top-[52px] left-[12.5%] right-[12.5%] h-px bg-[var(--g-ligne)]" aria-hidden="true" />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {[
                { n: "01", title: "Candidature", desc: "Remplissez le formulaire en 3 minutes", icon: FileText },
                { n: "02", title: "Examen", desc: "Notre équipe étudie votre profil sous 48h", icon: Target },
                { n: "03", title: "Validation", desc: "Votre profil est publié sur la plateforme", icon: CheckCircle },
                { n: "04", title: "Missions", desc: "Accompagnez vos premiers clients", icon: Rocket },
              ].map((step, i) => (
                <motion.div
                  key={step.n}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 + i * 0.1, duration: 0.45 }}
                  className="relative text-center p-5 sm:p-6"
                >
                  <div className="relative inline-flex items-center justify-center w-14 h-14 rounded-[14px] bg-white border border-[var(--g-ligne)] mb-4">
                    <step.icon size={23} className="text-[var(--g-vert)]" />
                  </div>
                  <div className="text-xs font-semibold text-[var(--g-gris)] mb-1">{step.n}</div>
                  <h3 className="text-[var(--g-encre)] font-semibold tracking-[-0.02em] text-sm sm:text-base mb-2">{step.title}</h3>
                  <p className="text-[var(--g-gris)] text-xs sm:text-sm leading-relaxed">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════ TÉMOIGNAGE CONSULTANT ════════ */}
      <section className="py-14 sm:py-20 px-5 bg-white">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8"
          >
            <h2 className="text-[26px] sm:text-[32px] font-semibold tracking-[-0.02em] text-[var(--g-encre)]">
              Ce que disent nos consultants
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-4">
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
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ delay: i * 0.1, duration: 0.45 }}
              >
                <div className="p-6 sm:p-7 bg-white border border-[var(--g-ligne)] rounded-[16px] h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center text-xs font-semibold"
                      style={{
                        background: i === 0 ? "var(--g-vert)" : "var(--g-jaune)",
                        color: i === 0 ? "#fff" : "var(--g-encre)",
                      }}
                    >
                      {t.initials}
                    </div>
                    <div>
                      <p className="text-[var(--g-encre)] text-sm font-semibold">{t.name}</p>
                      <p className="text-[var(--g-vert)] text-xs font-medium flex items-center gap-1">
                        <CheckCircle size={11} /> {t.role}
                      </p>
                    </div>
                  </div>
                  <p className="text-[var(--g-gris)] text-[15px] leading-relaxed">&laquo;&nbsp;{t.quote}&nbsp;&raquo;</p>
                  <div className="flex items-center gap-1 mt-4">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} size={12} className="fill-[var(--g-jaune)] text-[var(--g-jaune)]" />
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ CITATION ════════ */}
      <section className="py-14 sm:py-20 px-5 bg-[var(--g-vert-profond)]">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <span className="block h-[3px] w-7 rounded-full bg-[var(--g-jaune)] mx-auto mb-7" aria-hidden="true" />
            <p className="text-white text-[20px] sm:text-[24px] md:text-[28px] leading-[1.35] font-semibold tracking-[-0.02em] mb-8">
              Devenir consultant chez Smart Life, c&apos;est saisir l&apos;opportunité
              de partager votre savoir-faire et votre expérience pour aider
              d&apos;autres entrepreneurs à éviter les pièges du terrain.
              C&apos;est contribuer concrètement à un monde meilleur.
            </p>
            <div className="flex items-center justify-center gap-3">
              <div className="w-11 h-11 rounded-full bg-[var(--g-jaune)] flex items-center justify-center text-[var(--g-encre)] font-semibold text-sm">
                SL
              </div>
              <div className="text-left">
                <p className="text-white text-sm font-semibold">L&apos;équipe Smart Life</p>
                <p className="text-white/70 text-xs">L&apos;écosystème des visionnaires africains</p>
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
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-2xl mx-auto text-center"
            >
              <p className="inline-flex items-center gap-2 text-[14px] font-semibold text-[var(--g-vert)] mb-4">
                <span className="w-2 h-2 rounded-full bg-[var(--g-vert-vif)]" aria-hidden="true" />
                Recrutement ouvert
              </p>

              <h2 className="g-titre-section mb-4">
                Prêt à rejoindre l&apos;aventure ?
              </h2>
              <p className="text-[var(--g-gris)] text-sm sm:text-base max-w-md mx-auto mb-9">
                La candidature est 100% gratuite et prend moins de 3 minutes.
                Notre équipe vous répond sous 48 heures.
              </p>

              <button onClick={openForm} className="g-btn">
                Postuler maintenant
                <ArrowRight size={18} />
              </button>

              <div className="flex flex-wrap items-center justify-center gap-5 mt-8 text-xs text-[var(--g-gris)] font-medium">
                <span className="flex items-center gap-1.5"><Shield size={13} className="text-[var(--g-vert)]" /> Données protégées</span>
                <span className="flex items-center gap-1.5"><CheckCircle size={13} className="text-[var(--g-vert)]" /> 100% gratuit</span>
                <span className="flex items-center gap-1.5"><Zap size={13} className="text-[var(--g-vert)]" /> Réponse sous 48h</span>
              </div>
            </motion.div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* ════════ FORMULAIRE PROGRESSIF ════════ */}
      <AnimatePresence>
        {showForm && (
          <motion.section
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="py-10 sm:py-16 px-5 bg-[var(--g-doux)]"
          >
            <div className="max-w-2xl mx-auto" ref={formRef}>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="text-center mb-10"
              >
                <p className="text-[14px] font-semibold text-[var(--g-vert)] mb-3">
                  Formulaire de candidature
                </p>
                <h2 className="text-[28px] sm:text-[34px] font-semibold tracking-[-0.02em] text-[var(--g-encre)] mb-2">
                  Rejoignez notre réseau
                </h2>
                <p className="text-[var(--g-gris)] text-sm">
                  3 étapes simples. Moins de 3 minutes.
                </p>
              </motion.div>

              <StepBar current={currentStep} />

              <AnimatePresence mode="wait">
                {/* ── Étape 1 ── */}
                {currentStep === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="p-6 sm:p-8 bg-white border border-[var(--g-ligne)] rounded-[16px] space-y-5"
                  >
                    <h3 className="text-[var(--g-encre)] font-semibold tracking-[-0.02em] text-lg flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-[10px] bg-[var(--g-vert-doux)] flex items-center justify-center">
                        <User size={16} className="text-[var(--g-vert)]" />
                      </div>
                      Vos informations
                    </h3>

                    <div className="flex flex-col items-center gap-3">
                      <div className="relative">
                        <button type="button" onClick={() => photoInputRef.current?.click()} disabled={photoUploading}
                          className={`relative w-28 h-28 rounded-full border-2 border-dashed ${errors.photoUrl ? "border-red-400 bg-red-50" : "border-[var(--g-jaune-fonce)] bg-[var(--g-jaune-doux)] hover:bg-[#fff0b3]"} overflow-hidden flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--g-encre)]`}>
                          {photoPreview ? (
                            <Image src={photoPreview} alt="Aperçu photo" fill className="object-cover rounded-full" unoptimized />
                          ) : (
                            <div className="flex flex-col items-center gap-1 text-[#8a6d00]">
                              {photoUploading ? <span className="w-5 h-5 border-2 border-gray-300 border-t-[var(--g-jaune-fonce)] rounded-full animate-spin" /> : <Camera size={26} />}
                              <span className="text-[11px] font-semibold">Ajouter</span>
                            </div>
                          )}
                        </button>
                        {photoPreview && !photoUploading && (
                          <button type="button" onClick={removePhoto}
                            className="absolute -top-1 -right-1 w-6 h-6 bg-[var(--g-encre)] text-white rounded-full flex items-center justify-center hover:bg-black transition-colors">
                            <X size={12} />
                          </button>
                        )}
                      </div>
                      <p className="text-[13px] font-semibold text-[var(--g-encre)] inline-flex items-center gap-1.5">
                        {photoUploading ? "Envoi de la photo…" : photoPreview ? <><CheckCircle size={14} className="text-[var(--g-vert)]" /> Photo ajoutée</> : <span>Votre photo de profil <span className="text-[var(--g-jaune-fonce)]">*</span> (obligatoire)</span>}
                      </p>
                      {!photoPreview && !photoUploading && (
                        <p className="text-[12px] text-[var(--g-gris)] text-center max-w-xs">Une photo nette de votre visage : les clients font confiance à un consultant qu&apos;ils peuvent voir.</p>
                      )}
                      {(photoError || errors.photoUrl) && <p className="text-red-500 text-xs font-semibold text-center">{photoError || errors.photoUrl}</p>}
                      <input ref={photoInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" className="hidden" onChange={handlePhotoChange} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={labelCls}>Prénom <span className="text-[var(--g-jaune-fonce)]">*</span></label>
                        <input type="text" value={form.prenom} onChange={(e) => setField("prenom", e.target.value)} className={inputCls} placeholder="Jean" />
                        {errors.prenom && <p className="text-red-500 text-xs mt-1">{errors.prenom}</p>}
                      </div>
                      <div>
                        <label className={labelCls}>Nom <span className="text-[var(--g-jaune-fonce)]">*</span></label>
                        <input type="text" value={form.nom} onChange={(e) => setField("nom", e.target.value)} className={inputCls} placeholder="Dupont" />
                        {errors.nom && <p className="text-red-500 text-xs mt-1">{errors.nom}</p>}
                      </div>
                    </div>

                    <div>
                      <label className={labelCls}><Mail size={13} className="inline mr-1 text-[var(--g-gris)]" />Email <span className="text-[var(--g-jaune-fonce)]">*</span></label>
                      <input type="email" value={form.email} onChange={(e) => setField("email", e.target.value)} className={inputCls} placeholder="jean.dupont@exemple.com" />
                      {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={labelCls}><Phone size={13} className="inline mr-1 text-[var(--g-gris)]" />Téléphone <span className="text-[var(--g-jaune-fonce)]">*</span></label>
                        <input type="tel" value={form.telephone} onChange={(e) => setField("telephone", e.target.value)} className={inputCls} placeholder="+237 6XX XXX XXX" />
                        {errors.telephone && <p className="text-red-500 text-xs mt-1">{errors.telephone}</p>}
                      </div>
                      <div>
                        <label className={labelCls}><MapPin size={13} className="inline mr-1 text-[var(--g-gris)]" />Ville <span className="text-[var(--g-jaune-fonce)]">*</span></label>
                        <input type="text" value={form.ville} onChange={(e) => setField("ville", e.target.value)} className={inputCls} placeholder="Douala" />
                        {errors.ville && <p className="text-red-500 text-xs mt-1">{errors.ville}</p>}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ── Étape 2 ── */}
                {currentStep === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="p-6 sm:p-8 bg-white border border-[var(--g-ligne)] rounded-[16px] space-y-5"
                  >
                    <h3 className="text-[var(--g-encre)] font-semibold tracking-[-0.02em] text-lg flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-[10px] bg-[var(--g-vert-doux)] flex items-center justify-center">
                        <Briefcase size={16} className="text-[var(--g-vert)]" />
                      </div>
                      Votre expertise
                    </h3>

                    <div>
                      <label className={labelCls}>Années d&apos;expérience <span className="text-[var(--g-jaune-fonce)]">*</span></label>
                      <div className="flex flex-wrap gap-2">
                        {EXPERIENCE_OPTIONS.map((opt) => (
                          <button key={opt} type="button"
                            onClick={() => setField("anneesExperience", opt)}
                            className={`px-4 py-2.5 rounded-[10px] border text-sm font-medium transition-colors ${
                              form.anneesExperience === opt
                                ? "bg-[var(--g-jaune)] border-[var(--g-jaune)] text-[var(--g-encre)] font-semibold"
                                : "bg-white border-[var(--g-ligne)] text-[var(--g-gris)] hover:border-[var(--g-encre)]"
                            }`}>
                            {opt}
                          </button>
                        ))}
                      </div>
                      {errors.anneesExperience && <p className="text-red-500 text-xs mt-1">{errors.anneesExperience}</p>}
                    </div>

                    <div>
                      <label className={labelCls}>
                        Domaines d&apos;expertise <span className="text-[var(--g-jaune-fonce)]">*</span>
                        <span className="text-[var(--g-gris)] ml-2 text-xs font-normal">(programmes que vous pouvez encadrer)</span>
                      </label>
                      {espaces.length === 0 ? (
                        <p className="text-[var(--g-gris)] text-sm">Aucun programme disponible pour le moment.</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {espaces.map((e) => (
                            <button key={e.id} type="button"
                              onClick={() => toggleDomaine(e.id)}
                              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-[10px] border text-sm font-medium transition-colors ${
                                form.domainesIds.includes(e.id)
                                  ? "bg-[var(--g-vert)] border-[var(--g-vert)] text-white font-semibold"
                                  : "bg-white border-[var(--g-ligne)] text-[var(--g-gris)] hover:border-[var(--g-encre)]"
                              }`}>
                              {form.domainesIds.includes(e.id) && <Check size={14} aria-hidden="true" />}{e.titre}
                            </button>
                          ))}
                        </div>
                      )}
                      {errors.domainesIds && <p className="text-red-500 text-xs mt-1">{errors.domainesIds}</p>}
                    </div>

                    <div>
                      <label className={labelCls}>
                        <Link2 size={13} className="inline mr-1 text-[var(--g-gris)]" />LinkedIn ou portfolio
                        <span className="text-[var(--g-gris)] ml-2 text-xs font-normal">optionnel</span>
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
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="p-6 sm:p-8 bg-white border border-[var(--g-ligne)] rounded-[16px] space-y-5"
                  >
                    <h3 className="text-[var(--g-encre)] font-semibold tracking-[-0.02em] text-lg flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-[10px] bg-[var(--g-vert-doux)] flex items-center justify-center">
                        <FileText size={16} className="text-[var(--g-vert)]" />
                      </div>
                      Votre motivation
                    </h3>

                    <div>
                      <label className={labelCls}>
                        Pourquoi souhaitez-vous rejoindre Smart Life ? <span className="text-[var(--g-jaune-fonce)]">*</span>
                        <span className="text-[var(--g-gris)] ml-2 text-xs font-normal">(min. 50 caractères)</span>
                      </label>
                      <textarea rows={5} value={form.motivation} onChange={(e) => setField("motivation", e.target.value)}
                        className={`${inputCls} resize-none`}
                        placeholder="Décrivez votre parcours, vos réalisations et pourquoi vous souhaitez rejoindre le réseau SMART LIFE…" />
                      <div className="flex items-center justify-between mt-1.5">
                        {errors.motivation ? <p className="text-red-500 text-xs">{errors.motivation}</p> : <span />}
                        <span className={`text-xs font-semibold ${form.motivation.length < 50 ? "text-gray-400" : "text-[var(--g-vert)]"}`}>
                          {form.motivation.length} / 50
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className={labelCls}>
                        <Gift size={13} className="inline mr-1 text-[var(--g-gris)]" />Code de parrainage
                        <span className="text-[var(--g-gris)] ml-2 text-xs font-normal">optionnel</span>
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
                  <button type="button" onClick={goPrev} className="g-btn-ghost bg-white text-sm">
                    <ArrowRight size={15} className="rotate-180" /> Précédent
                  </button>
                )}

                {currentStep < 3 ? (
                  <button type="button" onClick={goNext} className="g-btn text-sm">
                    Suivant
                    <ArrowRight size={15} />
                  </button>
                ) : (
                  <button type="button" onClick={handleSubmit} disabled={loading}
                    className="g-btn text-sm disabled:opacity-60">
                    {loading
                      ? <><span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Envoi en cours...</>
                      : <><Send size={15} /> Envoyer ma candidature</>}
                  </button>
                )}
              </div>

              {/* Réassurance */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex flex-wrap items-center justify-center gap-5 mt-8 text-xs text-[var(--g-gris)] font-medium"
              >
                <span className="flex items-center gap-1.5"><Shield size={13} className="text-[var(--g-vert)]" /> Données protégées</span>
                <span className="flex items-center gap-1.5"><CheckCircle size={13} className="text-[var(--g-vert)]" /> 100% gratuit</span>
                <span className="flex items-center gap-1.5"><Zap size={13} className="text-[var(--g-vert)]" /> Réponse sous 48h</span>
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
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="fixed bottom-20 left-4 right-4 z-40 lg:hidden"
          >
            <button
              onClick={openForm}
              className="g-btn w-full text-sm shadow-[0_2px_10px_rgba(16,20,16,0.12)]"
            >
              Devenir Consultant — Gratuit
              <ArrowRight size={15} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
