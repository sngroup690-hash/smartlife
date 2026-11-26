"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle, User, Mail, Phone, MapPin, Camera, X,
  ArrowRight, ArrowLeft, Calendar, Shield, FileCheck,
} from "lucide-react";

const inputCls =
  "w-full px-4 py-4 bg-white border border-[var(--g-ligne)] rounded-[12px] text-[var(--g-encre)] placeholder-gray-400 focus:outline-none focus:border-[var(--g-encre)] transition-colors text-[16px]";
const labelCls = "block text-[var(--g-encre)] text-sm font-semibold mb-2";

type FormData = {
  photoUrl: string;
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  ville: string;
  dateNaissance: string;
  convention: boolean;
};

const VIDE: FormData = {
  photoUrl: "", prenom: "", nom: "", email: "", telephone: "",
  ville: "", dateNaissance: "", convention: false,
};

const ETAPES = [
  { label: "Photo", icon: Camera },
  { label: "Identité", icon: User },
  { label: "Contact", icon: Phone },
  { label: "Profil", icon: MapPin },
  { label: "Convention", icon: FileCheck },
];

const MESSAGES = [
  "Commençons par votre photo de profil",
  "Comment vous appelez-vous ?",
  "Comment vous joindre ?",
  "Quelques détails sur vous",
  "Dernière étape avant l'évaluation",
];

function BarreProgression({ etape }: { etape: number }) {
  const pct = ((etape - 1) / (ETAPES.length - 1)) * 100;
  return (
    <div className="mb-8">
      <div className="flex justify-between mb-3">
        {ETAPES.map((s, i) => {
          const n = i + 1;
          const fait = n < etape;
          const actif = n === etape;
          const Icon = s.icon;
          return (
            <div key={n} className="flex flex-col items-center gap-1.5" style={{ width: `${100 / ETAPES.length}%` }}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                fait
                  ? "bg-[var(--g-vert)] text-white scale-90"
                  : actif
                  ? "bg-[var(--g-jaune)] text-[var(--g-encre)] scale-105"
                  : "bg-[var(--g-doux)] text-gray-400"
              }`}>
                {fait ? <CheckCircle size={16} /> : <Icon size={16} />}
              </div>
              <span className={`text-[11px] font-semibold transition-colors hidden sm:block ${
                actif ? "text-[var(--g-encre)]" : fait ? "text-[var(--g-vert)]" : "text-gray-400"
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
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        />
      </div>
      <div className="flex items-center justify-between mt-2">
        <motion.p
          key={etape}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-[13px] font-semibold text-[var(--g-vert)]"
        >
          {MESSAGES[etape - 1]}
        </motion.p>
        <p className="text-xs text-[var(--g-gris)] font-semibold whitespace-nowrap">
          {etape}/{ETAPES.length}
        </p>
      </div>
    </div>
  );
}

const anim = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
  transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] },
};

export default function DevenirConsultantPage() {
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const formRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState<FormData>(VIDE);
  const [etape, setEtape] = useState(1);
  const [loading, setLoading] = useState(false);
  const [soumis, setSoumis] = useState(false);
  const [erreurs, setErreurs] = useState<Record<string, string>>({});

  function set<K extends keyof FormData>(k: K, v: FormData[K]) {
    setForm((f) => ({ ...f, [k]: v }));
    setErreurs((e) => { const c = { ...e }; delete c[k]; return c; });
  }

  function valider(n: number): boolean {
    const e: Record<string, string> = {};
    if (n === 1 && !form.photoUrl) e.photoUrl = "Ajoutez une photo de vous";
    if (n === 2) {
      if (!form.prenom.trim()) e.prenom = "Le prénom est requis";
      if (!form.nom.trim()) e.nom = "Le nom est requis";
    }
    if (n === 3) {
      if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Adresse email invalide";
      if (!form.telephone.trim()) e.telephone = "Le numéro de téléphone est requis";
    }
    if (n === 4) {
      if (!form.ville.trim()) e.ville = "La ville est requise";
      if (!form.dateNaissance) e.dateNaissance = "La date de naissance est requise";
    }
    if (n === 5 && !form.convention) e.convention = "Vous devez accepter la convention";
    setErreurs(e);
    return Object.keys(e).length === 0;
  }

  function suivant() {
    if (!valider(etape)) return;
    setEtape((s) => s + 1);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function precedent() {
    setErreurs({});
    setEtape((s) => s - 1);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function changerPhoto(e: React.ChangeEvent<HTMLInputElement>) {
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
      if (!res.ok) { setPhotoError(data.error || "Erreur lors de l'envoi"); return; }
      set("photoUrl", data.url);
    } catch {
      setPhotoError("Erreur réseau. Réessayez.");
    } finally {
      setPhotoUploading(false);
    }
  }

  function supprimerPhoto() {
    setPhotoPreview("");
    set("photoUrl", "");
    setPhotoError("");
    if (photoInputRef.current) photoInputRef.current.value = "";
  }

  async function envoyer() {
    if (!valider(5)) return;
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
          dateNaissance: form.dateNaissance,
          photoUrl: form.photoUrl || undefined,
          convention: true,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setErreurs({ convention: data.error || "Erreur. Réessayez." });
        return;
      }
      setSoumis(true);
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch {
      setErreurs({ convention: "Erreur réseau. Réessayez." });
    } finally {
      setLoading(false);
    }
  }

  if (soumis) {
    return (
      <div className="min-h-screen bg-[var(--g-doux)] text-[var(--g-encre)] flex items-center justify-center px-5">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center bg-white rounded-[20px] p-8 sm:p-10 shadow-sm border border-[var(--g-ligne)]"
        >
          <div className="w-16 h-16 bg-[var(--g-vert-doux)] rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle size={32} className="text-[var(--g-vert)]" />
          </div>
          <h2 className="text-[22px] sm:text-[26px] font-semibold mb-3">
            Candidature envoyée
          </h2>
          <p className="text-[var(--g-gris)] text-[15px] leading-relaxed mb-6">
            Merci <strong>{form.prenom}</strong> ! Nous allons étudier votre profil et vous contacter sur <strong>WhatsApp</strong> au <strong>{form.telephone}</strong> pour la suite du processus.
          </p>
          <div className="bg-[var(--g-doux)] rounded-[12px] p-4 text-left space-y-2 text-sm text-[var(--g-encre)]">
            <p className="flex items-start gap-2"><CheckCircle size={14} className="text-[var(--g-vert)] mt-0.5 shrink-0" /> Votre dossier est en cours d&apos;examen</p>
            <p className="flex items-start gap-2"><Phone size={14} className="text-[var(--g-vert)] mt-0.5 shrink-0" /> Nous vous contacterons sur WhatsApp</p>
            <p className="flex items-start gap-2"><FileCheck size={14} className="text-[var(--g-vert)] mt-0.5 shrink-0" /> Un test d&apos;évaluation vous sera envoyé</p>
          </div>
          <a href="/" className="inline-block mt-6 g-btn text-sm">
            Retour à l&apos;accueil
          </a>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--g-doux)] text-[var(--g-encre)]">
      <section className="pt-10 pb-4 sm:pt-14 sm:pb-6">
        <div className="max-w-lg mx-auto px-5 text-center">
          <div className="inline-flex items-center gap-2 text-[13px] font-semibold text-[var(--g-vert)] mb-4">
            <span className="w-2 h-2 rounded-full bg-[var(--g-vert-vif)]" />
            Inscription consultant
          </div>
          <h1 className="text-[26px] sm:text-[32px] font-semibold leading-[1.15] tracking-[-0.03em] mb-3">
            Devenez consultant <span className="g-surligne">Smart Life</span>
          </h1>
          <p className="text-[var(--g-gris)] text-[15px] max-w-sm mx-auto leading-relaxed">
            Remplissez ce formulaire en quelques étapes pour rejoindre notre réseau de consultants.
          </p>
        </div>
      </section>

      <section className="pb-16 px-5">
        <div className="max-w-lg mx-auto" ref={formRef}>
          <BarreProgression etape={etape} />

          <AnimatePresence mode="wait">
            {etape === 1 && (
              <motion.div key="e1" {...anim} className="p-6 sm:p-8 bg-white border border-[var(--g-ligne)] rounded-[16px]">
                <h3 className="text-lg font-semibold mb-6 text-center">Votre photo de profil</h3>
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <button type="button" onClick={() => photoInputRef.current?.click()} disabled={photoUploading}
                      className={`relative w-32 h-32 rounded-full border-2 border-dashed ${erreurs.photoUrl ? "border-red-400 bg-red-50" : "border-[var(--g-jaune-fonce)] bg-[var(--g-jaune-doux)] hover:bg-[#fff0b3]"} overflow-hidden flex items-center justify-center transition-colors`}>
                      {photoPreview ? (
                        <Image src={photoPreview} alt="Aperçu" fill className="object-cover rounded-full" unoptimized />
                      ) : (
                        <div className="flex flex-col items-center gap-1.5 text-[#8a6d00]">
                          {photoUploading
                            ? <span className="w-6 h-6 border-2 border-gray-300 border-t-[var(--g-jaune-fonce)] rounded-full animate-spin" />
                            : <Camera size={30} />}
                          <span className="text-xs font-semibold">Ajouter</span>
                        </div>
                      )}
                    </button>
                    {photoPreview && !photoUploading && (
                      <button type="button" onClick={supprimerPhoto}
                        className="absolute -top-1 -right-1 w-7 h-7 bg-[var(--g-encre)] text-white rounded-full flex items-center justify-center hover:bg-black transition-colors">
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  <div className="text-center">
                    {photoUploading ? (
                      <p className="text-sm font-semibold text-[var(--g-gris)]">Envoi en cours…</p>
                    ) : photoPreview ? (
                      <p className="text-sm font-semibold text-[var(--g-vert)] inline-flex items-center gap-1.5">
                        <CheckCircle size={14} /> Photo ajoutée
                      </p>
                    ) : (
                      <p className="text-sm text-[var(--g-gris)]">
                        Une photo nette de votre visage
                      </p>
                    )}
                  </div>
                  {(photoError || erreurs.photoUrl) && (
                    <p className="text-red-500 text-xs font-semibold">{photoError || erreurs.photoUrl}</p>
                  )}
                  <input ref={photoInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" className="hidden" onChange={changerPhoto} />
                </div>
              </motion.div>
            )}

            {etape === 2 && (
              <motion.div key="e2" {...anim} className="p-6 sm:p-8 bg-white border border-[var(--g-ligne)] rounded-[16px] space-y-5">
                <h3 className="text-lg font-semibold flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-[10px] bg-[var(--g-vert-doux)] flex items-center justify-center">
                    <User size={16} className="text-[var(--g-vert)]" />
                  </div>
                  Votre identité
                </h3>
                <div>
                  <label className={labelCls}>Prénom</label>
                  <input type="text" value={form.prenom} onChange={(e) => set("prenom", e.target.value)}
                    className={inputCls} placeholder="Ex : Jean" autoFocus />
                  {erreurs.prenom && <p className="text-red-500 text-xs mt-1.5">{erreurs.prenom}</p>}
                </div>
                <div>
                  <label className={labelCls}>Nom</label>
                  <input type="text" value={form.nom} onChange={(e) => set("nom", e.target.value)}
                    className={inputCls} placeholder="Ex : Dupont" />
                  {erreurs.nom && <p className="text-red-500 text-xs mt-1.5">{erreurs.nom}</p>}
                </div>
              </motion.div>
            )}

            {etape === 3 && (
              <motion.div key="e3" {...anim} className="p-6 sm:p-8 bg-white border border-[var(--g-ligne)] rounded-[16px] space-y-5">
                <h3 className="text-lg font-semibold flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-[10px] bg-[var(--g-vert-doux)] flex items-center justify-center">
                    <Mail size={16} className="text-[var(--g-vert)]" />
                  </div>
                  Vos coordonnées
                </h3>
                <div>
                  <label className={labelCls}>Adresse email</label>
                  <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)}
                    className={inputCls} placeholder="jean.dupont@exemple.com" autoFocus />
                  {erreurs.email && <p className="text-red-500 text-xs mt-1.5">{erreurs.email}</p>}
                </div>
                <div>
                  <label className={labelCls}>Numéro de téléphone</label>
                  <input type="tel" value={form.telephone} onChange={(e) => set("telephone", e.target.value)}
                    className={inputCls} placeholder="+237 6XX XXX XXX" />
                  {erreurs.telephone && <p className="text-red-500 text-xs mt-1.5">{erreurs.telephone}</p>}
                </div>
              </motion.div>
            )}

            {etape === 4 && (
              <motion.div key="e4" {...anim} className="p-6 sm:p-8 bg-white border border-[var(--g-ligne)] rounded-[16px] space-y-5">
                <h3 className="text-lg font-semibold flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-[10px] bg-[var(--g-vert-doux)] flex items-center justify-center">
                    <MapPin size={16} className="text-[var(--g-vert)]" />
                  </div>
                  Votre profil
                </h3>
                <div>
                  <label className={labelCls}>Ville</label>
                  <input type="text" value={form.ville} onChange={(e) => set("ville", e.target.value)}
                    className={inputCls} placeholder="Ex : Douala" autoFocus />
                  {erreurs.ville && <p className="text-red-500 text-xs mt-1.5">{erreurs.ville}</p>}
                </div>
                <div>
                  <label className={labelCls}>
                    <Calendar size={13} className="inline mr-1 text-[var(--g-gris)]" />
                    Date de naissance
                  </label>
                  <input type="date" value={form.dateNaissance} onChange={(e) => set("dateNaissance", e.target.value)}
                    className={inputCls} />
                  {erreurs.dateNaissance && <p className="text-red-500 text-xs mt-1.5">{erreurs.dateNaissance}</p>}
                </div>
              </motion.div>
            )}

            {etape === 5 && (
              <motion.div key="e5" {...anim} className="p-6 sm:p-8 bg-white border border-[var(--g-ligne)] rounded-[16px] space-y-5">
                <h3 className="text-lg font-semibold flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-[10px] bg-[var(--g-vert-doux)] flex items-center justify-center">
                    <FileCheck size={16} className="text-[var(--g-vert)]" />
                  </div>
                  Convention de collaboration
                </h3>

                <div className="bg-[var(--g-doux)] rounded-[12px] p-5 space-y-3 text-sm text-[var(--g-gris)] leading-relaxed">
                  <p className="text-[var(--g-encre)] font-semibold">En rejoignant Smart Life en tant que consultant, vous vous engagez à :</p>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle size={14} className="text-[var(--g-vert)] mt-0.5 shrink-0" />
                      <span>Accompagner les clients avec professionnalisme, bienveillance et intégrité</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle size={14} className="text-[var(--g-vert)] mt-0.5 shrink-0" />
                      <span>Respecter la confidentialité des informations partagées par les clients</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle size={14} className="text-[var(--g-vert)] mt-0.5 shrink-0" />
                      <span>Fournir des conseils honnêtes, fondés sur votre expertise réelle</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle size={14} className="text-[var(--g-vert)] mt-0.5 shrink-0" />
                      <span>Respecter le cadre et les valeurs de l&apos;écosystème Smart Life</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle size={14} className="text-[var(--g-vert)] mt-0.5 shrink-0" />
                      <span>Passer l&apos;évaluation psychotechnique qui vous sera envoyée</span>
                    </li>
                  </ul>
                </div>

                <label className={`flex items-start gap-3 cursor-pointer p-4 rounded-[12px] border transition-colors ${
                  form.convention
                    ? "border-[var(--g-vert)] bg-[var(--g-vert-doux)]"
                    : erreurs.convention
                    ? "border-red-400 bg-red-50"
                    : "border-[var(--g-ligne)] bg-white hover:border-[var(--g-encre)]"
                }`}>
                  <input
                    type="checkbox"
                    checked={form.convention}
                    onChange={(e) => set("convention", e.target.checked)}
                    className="mt-0.5 w-5 h-5 accent-[var(--g-vert)] rounded"
                  />
                  <span className="text-sm text-[var(--g-encre)]">
                    J&apos;ai lu et j&apos;accepte la convention de collaboration Smart Life
                  </span>
                </label>
                {erreurs.convention && <p className="text-red-500 text-xs font-semibold">{erreurs.convention}</p>}
              </motion.div>
            )}
          </AnimatePresence>

          <div className={`flex mt-6 gap-3 ${etape === 1 ? "justify-end" : "justify-between"}`}>
            {etape > 1 && (
              <button type="button" onClick={precedent} className="g-btn-ghost bg-white text-sm">
                <ArrowLeft size={15} /> Précédent
              </button>
            )}
            {etape < 5 ? (
              <button type="button" onClick={suivant} className="g-btn text-sm">
                Suivant <ArrowRight size={15} />
              </button>
            ) : (
              <button type="button" onClick={envoyer} disabled={loading}
                className="g-btn text-sm disabled:opacity-60">
                {loading
                  ? <><span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Envoi…</>
                  : <>Envoyer ma candidature <ArrowRight size={15} /></>}
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-5 mt-8 text-xs text-[var(--g-gris)] font-medium">
            <span className="flex items-center gap-1.5"><Shield size={13} className="text-[var(--g-vert)]" /> Données protégées</span>
            <span className="flex items-center gap-1.5"><CheckCircle size={13} className="text-[var(--g-vert)]" /> 100% gratuit</span>
          </div>
        </div>
      </section>
    </div>
  );
}
