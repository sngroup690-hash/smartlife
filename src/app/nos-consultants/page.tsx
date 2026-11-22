"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Users, Star, CheckCircle, ArrowRight, Briefcase,
  MapPin, TrendingUp, Award, Shield, X, Clock, ExternalLink,
  Filter, Send, MessageSquare, ChevronDown, ChevronUp, Loader2,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import AnimateOnScroll, { StaggerContainer, StaggerItem } from "@/components/AnimateOnScroll";
import { useAccompagnementStore, type EspacePersonnalise } from "@/lib/accompagnement-store";

// ── Types ──────────────────────────────────────────────────────────────────────

type ConsultantPublic = {
  id: string;
  prenom: string;
  nom?: string;
  ville?: string;
  anneesExperience?: string;
  motivation?: string;
  portfolioUrl?: string;
  photoUrl?: string;
  clientsAccompa: number;
  entreprisesAccompa: number;
  domainesIds: string[];
};

type ConsultantReview = {
  id: string;
  consultantId: string;
  auteur: string;
  note: number;
  contenu: string;
  createdAt: string;
};

// ── Config secteurs ────────────────────────────────────────────────────────────

type SecteurConfig = {
  categorie: string; emoji: string; illustration: string;
  gradientClass: string; borderClass: string; textClass: string;
  accentClass: string; desc: string; photo: string;
};

// Photos choisies et vérifiées une par une (Unsplash / Pexels, usage commercial gratuit) : chaque image montre l'activité du secteur.
const SECTEURS_CONFIG: SecteurConfig[] = [
  { categorie: "Agriculture",       emoji: "🌾", illustration: "🌱🐟🌿", gradientClass: "from-emerald-50 to-green-100",  borderClass: "border-emerald-200", textClass: "text-emerald-800", accentClass: "bg-emerald-500", desc: "Cultures, maraîchage & pisciculture", photo: "https://images.unsplash.com/photo-1741874299706-2b8e16839aaa?w=600&h=400&fit=crop&q=80" },
  { categorie: "Élevage",           emoji: "🐔", illustration: "🐓🐖🐄", gradientClass: "from-lime-50 to-green-100",     borderClass: "border-lime-200",    textClass: "text-lime-800",    accentClass: "bg-lime-600",    desc: "Volailles, porcs, bœufs & petits élevages", photo: "https://images.pexels.com/photos/16815564/pexels-photo-16815564.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop" },
  { categorie: "Commerce",          emoji: "🏪", illustration: "🛒💼📦", gradientClass: "from-amber-50 to-yellow-100",   borderClass: "border-amber-200",   textClass: "text-amber-800",   accentClass: "bg-amber-500",   desc: "Boutiques, dépôts & négoce", photo: "https://images.unsplash.com/photo-1687422808565-929533931584?w=600&h=400&fit=crop&q=80" },
  { categorie: "Services",          emoji: "⚙️", illustration: "🧺👔✨", gradientClass: "from-blue-50 to-indigo-100",    borderClass: "border-blue-200",    textClass: "text-blue-800",    accentClass: "bg-blue-500",    desc: "Couture, pressing, sécurité & plus", photo: "https://images.unsplash.com/photo-1687422808289-e721259c9eb4?w=600&h=400&fit=crop&q=80" },
  { categorie: "Restauration",      emoji: "🍽️", illustration: "👨‍🍳🥘🍴", gradientClass: "from-orange-50 to-red-100",  borderClass: "border-orange-200",  textClass: "text-orange-800",  accentClass: "bg-orange-500",  desc: "Restaurants, snacks & cafétérias", photo: "https://images.pexels.com/photos/14090826/pexels-photo-14090826.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop" },
  { categorie: "Beauté",            emoji: "💆", illustration: "💇‍♀️✂️💅", gradientClass: "from-pink-50 to-rose-100",   borderClass: "border-pink-200",    textClass: "text-pink-800",    accentClass: "bg-pink-500",    desc: "Coiffure, tresses & cosmétique", photo: "https://images.unsplash.com/photo-1702236242829-a34c39814f31?w=600&h=400&fit=crop&q=80" },
  { categorie: "Alimentaire",       emoji: "🥖", illustration: "🧁🥐🍞", gradientClass: "from-yellow-50 to-amber-100",  borderClass: "border-yellow-200",  textClass: "text-yellow-800",  accentClass: "bg-yellow-500",  desc: "Alimentation générale & boulangerie", photo: "https://images.unsplash.com/photo-1687422808311-a776f467a468?w=600&h=400&fit=crop&q=80" },
  { categorie: "Santé & Bien-être", emoji: "💊", illustration: "🏥💊🌿", gradientClass: "from-teal-50 to-cyan-100",     borderClass: "border-teal-200",    textClass: "text-teal-800",    accentClass: "bg-teal-500",    desc: "Parapharmacie, optique & santé", photo: "https://images.pexels.com/photos/4989190/pexels-photo-4989190.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop" },
  { categorie: "Artisanat",         emoji: "🧃", illustration: "🧼🧃🍫", gradientClass: "from-violet-50 to-purple-100", borderClass: "border-violet-200",  textClass: "text-violet-800",  accentClass: "bg-violet-500",  desc: "Fabrication artisanale & transformation", photo: "https://images.unsplash.com/photo-1603569283847-aa295f0d016a?w=600&h=400&fit=crop&q=80" },
  { categorie: "BTP",               emoji: "🏗️", illustration: "🧱🏠🔨", gradientClass: "from-slate-50 to-gray-100",   borderClass: "border-slate-200",   textClass: "text-slate-800",   accentClass: "bg-slate-500",   desc: "Construction, parpaings & topographie", photo: "https://images.pexels.com/photos/9485447/pexels-photo-9485447.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop" },
  { categorie: "Numérique",         emoji: "💻", illustration: "📱🌐💡", gradientClass: "from-indigo-50 to-blue-100",   borderClass: "border-indigo-200",  textClass: "text-indigo-800",  accentClass: "bg-indigo-500",  desc: "Travail à distance & métiers du digital", photo: "https://images.unsplash.com/photo-1604933762021-54a5858c9832?w=600&h=400&fit=crop&q=80" },
  { categorie: "Éducation",         emoji: "🎓", illustration: "📚✏️🏫", gradientClass: "from-sky-50 to-blue-100",      borderClass: "border-sky-200",     textClass: "text-sky-800",     accentClass: "bg-sky-500",     desc: "Écoles & librairies", photo: "https://images.unsplash.com/photo-1536337005238-94b997371b40?w=600&h=400&fit=crop&q=80" },
  { categorie: "Transport",         emoji: "🚗", illustration: "🚦🛣️🚌", gradientClass: "from-zinc-50 to-stone-100",    borderClass: "border-zinc-200",    textClass: "text-zinc-800",    accentClass: "bg-zinc-600",    desc: "Code de la route & conduite", photo: "https://images.pexels.com/photos/4606336/pexels-photo-4606336.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop" },
  { categorie: "Autre",             emoji: "🏦", illustration: "💰🤝📈", gradientClass: "from-emerald-50 to-teal-100",  borderClass: "border-teal-200",    textClass: "text-teal-800",    accentClass: "bg-teal-600",    desc: "Microfinance & autres activités", photo: "https://images.unsplash.com/photo-1638544253786-ab3078fe2f3f?w=600&h=400&fit=crop&q=80" },
];

function getSecteurConfig(categorie: string): SecteurConfig {
  return (
    SECTEURS_CONFIG.find((s) => s.categorie === categorie) ?? {
      categorie, emoji: "🏢", illustration: "📊💡🎯",
      gradientClass: "from-gray-50 to-slate-100", borderClass: "border-gray-200",
      textClass: "text-gray-800", accentClass: "bg-gray-500", desc: "Accompagnement professionnel",
      photo: "https://images.unsplash.com/photo-1573164574397-dd250bc8a598?w=600&h=400&fit=crop&q=80",
    }
  );
}

// ── Stars ──────────────────────────────────────────────────────────────────────

function StarDisplay({ note, size = 13 }: { note: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={size} className={i <= note ? "text-[#E8B800] fill-[#E8B800]" : "text-gray-300"} />
      ))}
    </div>
  );
}

function StarRatingInput({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i} type="button" onClick={() => onChange(i)}
          onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(0)}
          className="transition-transform hover:scale-110"
        >
          <Star size={28} className={i <= (hovered || value) ? "text-[#E8B800] fill-[#E8B800]" : "text-gray-300"} />
        </button>
      ))}
    </div>
  );
}

// ── Modal restriction avis ─────────────────────────────────────────────────────

function AvisRestrictionModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-8 text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-4xl mb-5">🔒</div>
        <h3 className="text-gray-900 font-bold text-xl mb-3">Avis réservé aux clients</h3>
        <p className="text-gray-600 text-sm leading-relaxed mb-6">
          Pour laisser un avis sur cet expert, vous devez être connecté(e) et avoir bénéficié
          d&apos;un accompagnement validé avec lui.
          <br /><br />
          Démarrez un accompagnement pour partager votre expérience.
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href="/login"
            onClick={onClose}
            className="w-full py-3 bg-[#E8B800] text-black font-bold rounded-xl text-sm hover:bg-[#27A827] transition-colors"
          >
            Se connecter
          </Link>
          <button
            onClick={onClose}
            className="w-full py-3 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal demande accompagnement ───────────────────────────────────────────────

function DemandeConsultantModal({
  consultant, consultantDomaines, allEspaces, onClose,
}: {
  consultant: ConsultantPublic;
  consultantDomaines: EspacePersonnalise[];
  allEspaces: EspacePersonnalise[];
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    nom: "", email: "", telephone: "", message: "",
    ville: "", profession: "", capital: "",
    domaineId: consultantDomaines[0]?.id || "",
  });
  const [showOtherDomaines, setShowOtherDomaines] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const otherDomaines = allEspaces.filter(
    (e) => !consultant.domainesIds.includes(e.id) && e.actif !== false
  );
  const selectedDomaine = [...consultantDomaines, ...otherDomaines].find((e) => e.id === form.domaineId);

  async function handleSubmit(evt: React.FormEvent) {
    evt.preventDefault();
    if (!form.nom.trim() || !form.email.trim() || !form.message.trim() || !form.ville.trim() || !form.profession.trim() || !form.capital.trim()) {
      setError("Veuillez remplir tous les champs obligatoires (*).");
      return;
    }
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/demandes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client: {
            nom: form.nom.trim(),
            email: form.email.trim(),
            telephone: form.telephone.trim(),
            ville: form.ville.trim(),
            profession: form.profession.trim(),
            capital: form.capital.trim(),
            motivation: form.message.trim(),
          },
          espaceId: form.domaineId || "non-specifie",
          espaceTitre: selectedDomaine?.titre || "Non spécifié",
          espaceSlug: form.domaineId || "non-specifie",
          message: form.message.trim(),
          consultantId: consultant.id,
          consultantPrenom: consultant.prenom,
        }),
      });
      if (res.ok) {
        setSent(true);
      } else {
        setError("Une erreur s'est produite. Veuillez réessayer.");
      }
    } catch {
      setError("Impossible d'envoyer la demande. Vérifiez votre connexion.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[92vh] overflow-y-auto shadow-2xl">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-gray-900 font-bold text-lg">Demander un accompagnement</h2>
            <p className="text-gray-500 text-sm">Avec <span className="font-semibold text-[#E8B800]">{consultant.prenom}</span></p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all">
            <X size={18} />
          </button>
        </div>

        {sent ? (
          <div className="p-8 text-center">
            <div className="text-5xl mb-4">✅</div>
            <h3 className="text-gray-900 font-bold text-xl mb-3">Demande envoyée !</h3>
            <p className="text-gray-600 text-sm mb-6">
              Votre demande d&apos;accompagnement avec {consultant.prenom} a bien été reçue.
              Notre équipe vous contactera sous 48h.
            </p>
            <button onClick={onClose} className="w-full py-3 bg-[#E8B800] text-black font-bold rounded-xl text-sm hover:bg-[#27A827] transition-colors">
              Fermer
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Nom */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1.5">
                Prénom &amp; Nom <span className="text-red-500">*</span>
              </label>
              <input
                type="text" value={form.nom}
                onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
                placeholder="Ex: Jean Dupont"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:border-[#E8B800] transition-colors placeholder:text-gray-400"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1.5">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email" value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="votre@email.com"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:border-[#E8B800] transition-colors placeholder:text-gray-400"
              />
            </div>

            {/* Téléphone */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1.5">Téléphone</label>
              <input
                type="tel" value={form.telephone}
                onChange={(e) => setForm((f) => ({ ...f, telephone: e.target.value }))}
                placeholder="+237 6XX XXX XXX"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:border-[#E8B800] transition-colors placeholder:text-gray-400"
              />
            </div>

            {/* Ville + Profession */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-1.5">
                  Ville <span className="text-red-500">*</span>
                </label>
                <input
                  type="text" value={form.ville}
                  onChange={(e) => setForm((f) => ({ ...f, ville: e.target.value }))}
                  placeholder="Ex: Douala"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:border-[#E8B800] transition-colors placeholder:text-gray-400"
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-1.5">
                  Profession <span className="text-red-500">*</span>
                </label>
                <input
                  type="text" value={form.profession}
                  onChange={(e) => setForm((f) => ({ ...f, profession: e.target.value }))}
                  placeholder="Ex: Commerçant"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:border-[#E8B800] transition-colors placeholder:text-gray-400"
                />
              </div>
            </div>

            {/* Capital */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1.5">
                Fourchette de capital disponible <span className="text-red-500">*</span>
              </label>
              <select
                value={form.capital}
                onChange={(e) => setForm((f) => ({ ...f, capital: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:border-[#E8B800] transition-colors bg-white"
              >
                <option value="">Sélectionner une fourchette...</option>
                <option value="moins-500k">- de 500 000 FCFA</option>
                <option value="500k-1m">500k – 1 000 000 FCFA</option>
                <option value="1m-3m">1M – 3 000 000 FCFA</option>
                <option value="3m-10m">3M – 10 000 000 FCFA</option>
                <option value="plus-10m">+ de 10 000 000 FCFA</option>
              </select>
            </div>

            {/* Domaine */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Domaine d&apos;accompagnement souhaité
              </label>

              {/* Spécialités prioritaires du consultant */}
              {consultantDomaines.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                    <Star size={11} className="text-[#E8B800]" />
                    Spécialités de {consultant.prenom}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {consultantDomaines.map((d) => (
                      <button
                        key={d.id} type="button"
                        onClick={() => setForm((f) => ({ ...f, domaineId: d.id }))}
                        className={`px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                          form.domaineId === d.id
                            ? "bg-[#E8B800] border-[#E8B800] text-black shadow-sm"
                            : "border-[#E8B800]/40 text-[#E8B800] hover:border-[#E8B800] hover:bg-[#E8B800]/5"
                        }`}
                      >
                        {form.domaineId === d.id && "✓ "}{d.titre}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Autres domaines dépliables */}
              {otherDomaines.length > 0 && (
                <div>
                  <button
                    type="button"
                    onClick={() => setShowOtherDomaines((v) => !v)}
                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors mt-1"
                  >
                    {showOtherDomaines ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    Autre domaine non listé ci-dessus
                  </button>

                  {showOtherDomaines && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {otherDomaines.map((d) => (
                        <button
                          key={d.id} type="button"
                          onClick={() => setForm((f) => ({ ...f, domaineId: d.id }))}
                          className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                            form.domaineId === d.id
                              ? "bg-gray-800 border-gray-800 text-white"
                              : "border-gray-200 text-gray-600 hover:border-gray-400"
                          }`}
                        >
                          {form.domaineId === d.id && "✓ "}{d.titre}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Message */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1.5">
                Votre projet &amp; motivations <span className="text-red-500">*</span>
              </label>
              <textarea
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                rows={4}
                placeholder="Décrivez votre projet, vos objectifs et pourquoi vous souhaitez être accompagné par cet expert..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:border-[#E8B800] transition-colors placeholder:text-gray-400 resize-none"
              />
            </div>

            {error && (
              <p className="text-red-500 text-xs bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>
            )}

            <button
              type="submit" disabled={sending}
              className="w-full py-3 bg-[#E8B800] hover:bg-[#27A827] text-black font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              Envoyer ma demande
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// ── Modal laisser un avis ──────────────────────────────────────────────────────

function AvisModal({ consultant, onClose }: { consultant: ConsultantPublic; onClose: () => void }) {
  const [form, setForm] = useState({ auteur: "", note: 0, contenu: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const NOTE_LABELS = ["", "Décevant", "Passable", "Bien", "Très bien", "Excellent !"];

  async function handleSubmit(evt: React.FormEvent) {
    evt.preventDefault();
    if (!form.auteur.trim() || form.note === 0 || !form.contenu.trim()) {
      setError("Veuillez remplir tous les champs et sélectionner une note.");
      return;
    }
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/consultant-reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consultantId: consultant.id,
          auteur: form.auteur.trim(),
          note: form.note,
          contenu: form.contenu.trim(),
        }),
      });
      if (res.ok) {
        setSent(true);
      } else {
        setError("Une erreur s'est produite. Veuillez réessayer.");
      }
    } catch {
      setError("Impossible d'envoyer votre avis. Vérifiez votre connexion.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-gray-900 font-bold text-lg">Laisser un avis</h2>
            <p className="text-gray-500 text-sm">Expérience avec <span className="font-semibold text-[#E8B800]">{consultant.prenom}</span></p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all">
            <X size={18} />
          </button>
        </div>

        {sent ? (
          <div className="p-8 text-center">
            <div className="text-5xl mb-4">🙏</div>
            <h3 className="text-gray-900 font-bold text-xl mb-3">Merci pour votre avis !</h3>
            <p className="text-gray-600 text-sm mb-6">
              Votre avis est en cours de vérification. Il sera publié sous 24-48h après validation par notre équipe.
            </p>
            <button onClick={onClose} className="w-full py-3 bg-[#E8B800] text-black font-bold rounded-xl text-sm hover:bg-[#27A827] transition-colors">
              Fermer
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Note */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Votre note <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-3">
                <StarRatingInput value={form.note} onChange={(n) => setForm((f) => ({ ...f, note: n }))} />
                {form.note > 0 && (
                  <span className="text-sm text-gray-500 font-medium">{NOTE_LABELS[form.note]}</span>
                )}
              </div>
            </div>

            {/* Auteur */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1.5">
                Votre prénom <span className="text-red-500">*</span>
              </label>
              <input
                type="text" value={form.auteur}
                onChange={(e) => setForm((f) => ({ ...f, auteur: e.target.value }))}
                placeholder="Ex: Jean D."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:border-[#E8B800] transition-colors placeholder:text-gray-400"
              />
            </div>

            {/* Contenu */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1.5">
                Votre avis <span className="text-red-500">*</span>
              </label>
              <textarea
                value={form.contenu}
                onChange={(e) => setForm((f) => ({ ...f, contenu: e.target.value }))}
                rows={4}
                placeholder="Décrivez votre expérience avec cet expert, les résultats obtenus, ce que vous recommanderiez..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:border-[#E8B800] transition-colors placeholder:text-gray-400 resize-none"
              />
            </div>

            <p className="text-xs text-gray-400">Votre avis sera soumis à validation avant publication.</p>

            {error && (
              <p className="text-red-500 text-xs bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>
            )}

            <button
              type="submit" disabled={sending || form.note === 0}
              className="w-full py-3 bg-[#E8B800] hover:bg-[#27A827] text-black font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {sending ? <Loader2 size={15} className="animate-spin" /> : <Star size={15} />}
              Publier mon avis
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// ── Modal profil consultant ────────────────────────────────────────────────────

function ProfilModal({
  consultant, domaines, reviews, onClose, onDemander, onAvis, avisChecking,
}: {
  consultant: ConsultantPublic;
  domaines: string[];
  reviews: ConsultantReview[];
  onClose: () => void;
  onDemander: () => void;
  onAvis: () => void;
  avisChecking?: boolean;
}) {
  const avgNote = reviews.length > 0
    ? Math.round((reviews.reduce((s, r) => s + r.note, 0) / reviews.length) * 10) / 10
    : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl overflow-hidden border border-[#E8B800]/30 flex-shrink-0">
              {consultant.photoUrl ? (
                <Image src={consultant.photoUrl} alt={consultant.prenom} width={64} height={64} className="w-full h-full object-cover" unoptimized />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#E8B800]/30 to-[#27A827]/10 flex items-center justify-center text-[#E8B800] font-black text-3xl">
                  {consultant.prenom.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <h2 className="text-gray-900 font-bold text-xl">
                {consultant.prenom}
                {consultant.nom && (
                  <span className="ml-2 text-gray-500 font-normal text-sm align-middle" style={{ filter: "blur(4px)", userSelect: "none" }}>
                    {consultant.nom}
                  </span>
                )}
              </h2>
              <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                {consultant.ville && (
                  <p className="text-gray-500 text-sm flex items-center gap-1">
                    <MapPin size={12} /> {consultant.ville}
                  </p>
                )}
                {reviews.length > 0 && (
                  <div className="flex items-center gap-1">
                    <StarDisplay note={Math.round(avgNote)} size={12} />
                    <span className="text-xs text-gray-500">{avgNote}/5 ({reviews.length} avis)</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Stats */}
          {(consultant.clientsAccompa > 0 || consultant.entreprisesAccompa > 0) && (
            <div className="flex gap-3">
              {consultant.clientsAccompa > 0 && (
                <div className="flex-1 text-center p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <div className="text-2xl font-bold text-emerald-700">{consultant.clientsAccompa}</div>
                  <div className="text-xs text-gray-600 mt-0.5">client{consultant.clientsAccompa > 1 ? "s" : ""} accompagné{consultant.clientsAccompa > 1 ? "s" : ""}</div>
                </div>
              )}
              {consultant.entreprisesAccompa > 0 && (
                <div className="flex-1 text-center p-3 bg-[#E8B800]/10 border border-[#E8B800]/20 rounded-xl">
                  <div className="text-2xl font-bold text-[#E8B800]">{consultant.entreprisesAccompa}</div>
                  <div className="text-xs text-gray-600 mt-0.5">entreprise{consultant.entreprisesAccompa > 1 ? "s" : ""}</div>
                </div>
              )}
              {reviews.length > 0 && (
                <div className="flex-1 text-center p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <div className="text-2xl font-bold text-amber-600">{avgNote}</div>
                  <div className="text-xs text-gray-600 mt-0.5 flex items-center justify-center gap-0.5">
                    <Star size={10} className="text-amber-500 fill-amber-500" /> note moy.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Expérience */}
          {consultant.anneesExperience && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl">
              <Clock size={15} className="text-[#E8B800] flex-shrink-0" />
              <div>
                <p className="text-gray-500 text-xs">Expérience</p>
                <p className="text-gray-900 text-sm font-medium">{consultant.anneesExperience}</p>
              </div>
            </div>
          )}

          {/* Domaines */}
          {domaines.length > 0 && (
            <div>
              <p className="text-gray-500 text-xs mb-2 uppercase tracking-wider">Secteurs d&apos;expertise</p>
              <div className="flex flex-wrap gap-2">
                {domaines.map((d) => (
                  <span key={d} className="text-xs px-3 py-1.5 bg-[#E8B800]/10 text-[#E8B800] border border-[#E8B800]/20 rounded-full">{d}</span>
                ))}
              </div>
            </div>
          )}

          {/* Motivation */}
          {consultant.motivation && (
            <div>
              <p className="text-gray-500 text-xs mb-2 uppercase tracking-wider">Son parcours, en ses mots</p>
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                <p className="text-gray-600 text-sm leading-relaxed">{consultant.motivation}</p>
              </div>
            </div>
          )}

          {/* Portfolio */}
          {consultant.portfolioUrl && (
            <a href={consultant.portfolioUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-[#E8B800] hover:underline">
              <ExternalLink size={14} /> Voir le portfolio
            </a>
          )}

          {/* Pourquoi il fait partie du réseau — uniquement à partir de ses vraies données */}
          <div className="rounded-2xl p-4" style={{ background: "linear-gradient(135deg, #f0fdf4, #fffbea)", border: "1.5px solid #27A827" }}>
            <p className="text-[13px] font-extrabold text-[#1e7a1e] mb-2.5">🏅 Pourquoi {consultant.prenom} fait partie de nos consultants</p>
            <ul className="space-y-2 text-[13px] text-[#393c41] leading-snug">
              {consultant.anneesExperience && (
                <li className="flex gap-2"><CheckCircle size={14} className="text-[#27A827] flex-shrink-0 mt-0.5" /> Une expérience de terrain : {consultant.anneesExperience}.</li>
              )}
              {domaines.length > 0 && (
                <li className="flex gap-2"><CheckCircle size={14} className="text-[#27A827] flex-shrink-0 mt-0.5" /> Maîtrise concrète {domaines.length > 1 ? `de ces ${domaines.length} domaines` : "de ce domaine"} : {domaines.slice(0, 3).join(", ")}{domaines.length > 3 ? "…" : ""}.</li>
              )}
              {(consultant.clientsAccompa > 0 || consultant.entreprisesAccompa > 0) && (
                <li className="flex gap-2"><CheckCircle size={14} className="text-[#27A827] flex-shrink-0 mt-0.5" /> A déjà accompagné {consultant.clientsAccompa > 0 ? `${consultant.clientsAccompa} porteur${consultant.clientsAccompa > 1 ? "s" : ""} de projet` : ""}{consultant.clientsAccompa > 0 && consultant.entreprisesAccompa > 0 ? " et " : ""}{consultant.entreprisesAccompa > 0 ? `${consultant.entreprisesAccompa} entreprise${consultant.entreprisesAccompa > 1 ? "s" : ""}` : ""}.</li>
              )}
              {reviews.length > 0 && (
                <li className="flex gap-2"><CheckCircle size={14} className="text-[#27A827] flex-shrink-0 mt-0.5" /> Note des clients accompagnés : {avgNote}/5 ({reviews.length} avis).</li>
              )}
              <li className="flex gap-2"><CheckCircle size={14} className="text-[#27A827] flex-shrink-0 mt-0.5" /> Connaissance des réalités du marché africain : coûts, clients, fournisseurs, pièges à éviter.</li>
            </ul>
          </div>

          {/* Comment nous sélectionnons nos consultants */}
          <div>
            <p className="text-gray-500 text-xs mb-3 uppercase tracking-wider">Comment nous sélectionnons nos consultants</p>
            <ol className="space-y-2.5">
              {[
                ["Candidature détaillée", "Chaque consultant présente son parcours, ses années d'expérience et les projets déjà menés."],
                ["Étude du dossier par l'équipe Smart Life", "Nous vérifions que l'expérience correspond vraiment aux domaines accompagnés."],
                ["Validation", "Seuls les profils retenus apparaissent ici, avec les domaines pour lesquels ils sont validés."],
                ["Suivi après chaque accompagnement", "Les clients accompagnés laissent un avis : un consultant mal noté n'est plus mis en avant."],
              ].map(([titre, texte], i) => (
                <li key={titre} className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-black" style={{ background: i % 2 === 0 ? "#E8B800" : "#27A827", color: "#fff" }}>{i + 1}</span>
                  <div>
                    <p className="text-[13px] font-bold text-[#111827]">{titre}</p>
                    <p className="text-[12px] text-[#5c5e62] leading-snug">{texte}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Avis clients */}
          {reviews.length > 0 && (
            <div>
              <p className="text-gray-500 text-xs mb-3 uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare size={12} /> Avis clients ({reviews.length})
              </p>
              <div className="space-y-3">
                {reviews.slice(0, 3).map((r) => (
                  <div key={r.id} className="p-3 bg-gray-50 border border-gray-100 rounded-xl">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-gray-900 font-semibold text-sm">{r.auteur}</span>
                      <StarDisplay note={r.note} size={12} />
                    </div>
                    <p className="text-gray-600 text-xs leading-relaxed">{r.contenu}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Boutons d'action */}
        <div className="p-6 pt-0 space-y-3 border-t border-gray-100 mt-2">
          <button
            onClick={onDemander}
            className="cta-clignote w-full flex items-center justify-center gap-2 py-3 font-bold rounded-xl text-sm shadow-lg"
            style={{ background: "linear-gradient(135deg, #E8B800, #27A827)", color: "#fff" }}
          >
            Demander un accompagnement <ArrowRight size={16} />
          </button>
          <button
            onClick={onAvis}
            disabled={avisChecking}
            className="w-full flex items-center justify-center gap-2 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-600 font-medium rounded-xl transition-all text-sm disabled:opacity-60"
          >
            {avisChecking ? <Loader2 size={14} className="animate-spin" /> : <MessageSquare size={14} />}
            {avisChecking ? "Vérification…" : "Laisser un avis sur mon expérience"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Carte secteur ──────────────────────────────────────────────────────────────

function SecteurCard({
  secteur, nbEspaces, nbConsultants, isActive, onClick, index,
}: {
  secteur: SecteurConfig; nbEspaces: number; nbConsultants: number;
  isActive: boolean; onClick: () => void; index: number;
}) {
  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay: index * 0.08, duration: 0.5, ease: "easeOut" }}
      whileHover={{ y: -6, scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      className={`relative w-full text-left rounded-3xl overflow-hidden transition-shadow duration-300 group ${
        isActive
          ? "ring-3 ring-[#E8B800] shadow-xl shadow-[#E8B800]/20"
          : "shadow-md hover:shadow-xl"
      }`}
    >
      {/* Photo de fond */}
      <div className="relative h-44 sm:h-48 overflow-hidden">
        <img
          src={secteur.photo}
          alt={secteur.categorie}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        {/* Badge actif */}
        {isActive && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-3 right-3 w-8 h-8 bg-[#E8B800] rounded-full flex items-center justify-center text-black text-sm font-bold shadow-lg"
          >
            ✓
          </motion.span>
        )}

        {/* Emoji flottant */}
        <span className="absolute top-3 left-3 text-3xl drop-shadow-lg select-none">{secteur.emoji}</span>

        {/* Contenu en bas */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          {/* text-[#FFFFFF] et non text-white : globals.css force .text-white en gris foncé sur tout le site */}
          <h3 className="font-black text-lg text-[#FFFFFF] leading-tight mb-1 drop-shadow-md">{secteur.categorie}</h3>
          <p className="text-white/80 text-xs leading-relaxed">{secteur.desc}</p>
        </div>
      </div>

      {/* Badges en dessous */}
      <div className="flex items-center gap-2 px-4 py-3 bg-white">
        <span className="text-xs font-bold px-3 py-1 bg-[#E8B800]/10 text-[#E8B800] rounded-full border border-[#E8B800]/20">
          {nbEspaces} espace{nbEspaces > 1 ? "s" : ""}
        </span>
        {nbConsultants > 0 && (
          <span className="text-xs font-bold px-3 py-1 bg-[#27A827]/10 text-[#27A827] rounded-full border border-[#27A827]/20">
            {nbConsultants} expert{nbConsultants > 1 ? "s" : ""}
          </span>
        )}
        <ArrowRight size={14} className="ml-auto text-gray-300 group-hover:text-[#E8B800] group-hover:translate-x-1 transition-all" />
      </div>
    </motion.button>
  );
}

// ── Page principale ────────────────────────────────────────────────────────────

export default function NosConsultantsPage() {
  const store = useAccompagnementStore();
  const [serverEspaces, setServerEspaces] = useState<EspacePersonnalise[] | null>(null);
  const [serverConsultants, setServerConsultants] = useState<ConsultantPublic[] | null>(null);
  const [filtreCategorie, setFiltreCategorie] = useState<string | null>(null);

  // Modal state
  const [selectedConsultant, setSelectedConsultant] = useState<ConsultantPublic | null>(null);
  const [demandeConsultant, setDemandeConsultant] = useState<ConsultantPublic | null>(null);
  const [avisConsultant, setAvisConsultant] = useState<ConsultantPublic | null>(null);
  const [showAvisRestriction, setShowAvisRestriction] = useState(false);
  const [avisChecking, setAvisChecking] = useState(false);

  // Reviews cache par consultant
  const [reviewsByConsultant, setReviewsByConsultant] = useState<Record<string, ConsultantReview[]>>({});

  useEffect(() => {
    fetch("/api/espaces")
      .then((r) => r.json())
      .then((data) => setServerEspaces(data.espaces ?? null))
      .catch(() => {});
    fetch("/api/consultants")
      .then((r) => r.json())
      .then((data) => setServerConsultants(data.consultants ?? []))
      .catch(() => {});
  }, []);

  // Charger les avis quand un consultant est sélectionné
  useEffect(() => {
    if (!selectedConsultant) return;
    const cid = selectedConsultant.id;
    if (reviewsByConsultant[cid] !== undefined) return;
    fetch(`/api/consultant-reviews?consultantId=${encodeURIComponent(cid)}`)
      .then((r) => r.json())
      .then((data: ConsultantReview[]) => {
        setReviewsByConsultant((prev) => ({ ...prev, [cid]: Array.isArray(data) ? data : [] }));
      })
      .catch(() => {
        setReviewsByConsultant((prev) => ({ ...prev, [cid]: [] }));
      });
  }, [selectedConsultant, reviewsByConsultant]);

  async function handleAvisClick(consultant: ConsultantPublic) {
    // 1. Vérifier la connexion via le store Zustand persisté
    let email = "";
    try {
      const raw = localStorage.getItem("mediastore-user-v1");
      if (!raw) { setShowAvisRestriction(true); return; }
      const parsed = JSON.parse(raw) as { state?: { isLoggedIn?: boolean; currentUser?: { email?: string } } };
      const state = parsed?.state ?? {};
      if (!state?.isLoggedIn) { setShowAvisRestriction(true); return; }
      email = state?.currentUser?.email ?? "";
    } catch { setShowAvisRestriction(true); return; }

    // 2. Vérifier l'accompagnement validé avec ce consultant
    setAvisChecking(true);
    try {
      const res = await fetch(`/api/demandes/me?email=${encodeURIComponent(email)}`);
      const data = await res.json() as { demandes?: Array<{ consultantId?: string; statut?: string }> };
      const demandes = data?.demandes ?? [];
      const hasValidated = demandes.some(
        (d) => d.consultantId === consultant.id && d.statut === "validee"
      );
      if (hasValidated) {
        setAvisConsultant(consultant);
      } else {
        setShowAvisRestriction(true);
      }
    } catch {
      setShowAvisRestriction(true);
    } finally {
      setAvisChecking(false);
    }
  }

  const espaces = serverEspaces ?? store.espaces;
  const storeConsultants: ConsultantPublic[] = store.consultants.filter((c) => c.actif);
  const apiConsultants: ConsultantPublic[] = serverConsultants ?? [];
  const apiIds = new Set(apiConsultants.map((c) => c.id));
  const consultants: ConsultantPublic[] = [
    ...apiConsultants,
    ...storeConsultants.filter((c) => !apiIds.has(c.id)),
  ];

  const espacesActifs = espaces.filter((e) => e.actif);
  const categories = [...new Set(espacesActifs.map((e) => e.domaine))].sort();

  const consultantsFiltres = filtreCategorie
    ? consultants.filter((c) =>
        c.domainesIds.some((id) => espaces.find((e) => e.id === id)?.domaine === filtreCategorie)
      )
    : consultants;

  const totalClients = consultants.reduce((s, c) => s + c.clientsAccompa, 0);
  const totalEntreprises = consultants.reduce((s, c) => s + c.entreprisesAccompa, 0);

  function domainesNoms(ids: string[]): string[] {
    return ids.map((id) => espaces.find((e) => e.id === id)?.titre).filter(Boolean) as string[];
  }

  const getConsultantDomaines = useCallback(
    (ids: string[]): EspacePersonnalise[] =>
      ids.map((id) => espaces.find((e) => e.id === id)).filter(Boolean) as EspacePersonnalise[],
    [espaces]
  );

  function consultantsDuSecteur(categorie: string): ConsultantPublic[] {
    return consultants.filter((c) =>
      c.domainesIds.some((id) => espaces.find((x) => x.id === id)?.domaine === categorie)
    );
  }

  function espacesDuSecteur(categorie: string): EspacePersonnalise[] {
    return espacesActifs.filter((e) => e.domaine === categorie);
  }

  const selectedReviews = selectedConsultant
    ? (reviewsByConsultant[selectedConsultant.id] ?? [])
    : [];

  return (
    <div className="overflow-hidden bg-white">

      {/* ════════ HERO PREMIUM ════════ */}
      <section className="relative py-14 sm:py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#f0fdf0] via-white to-[#fef9e7]" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle, #000 1px, transparent 1px)", backgroundSize: "28px 28px" }} />

        {/* Formes flottantes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{ y: [-20, 20, -20], x: [-8, 12, -8], rotate: [0, 90, 180, 270, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[10%] right-[6%] w-16 h-16 rounded-3xl bg-gradient-to-br from-[#E8B800]/12 to-[#E8B800]/4 border border-[#E8B800]/10"
          />
          <motion.div
            animate={{ y: [15, -20, 15], x: [8, -8, 8] }}
            transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-[15%] left-[4%] w-14 h-14 rounded-full bg-gradient-to-br from-[#27A827]/12 to-[#27A827]/4 border border-[#27A827]/10"
          />
          <motion.div
            animate={{ scale: [1, 1.3, 1], rotate: [0, 45, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[45%] left-[12%] w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-200/15 to-transparent border border-amber-200/10"
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/70 backdrop-blur-md border border-[#E8B800]/20 rounded-full text-sm text-gray-700 mb-8 shadow-lg shadow-[#E8B800]/5"
          >
            <motion.span
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <Sparkles size={16} className="text-[#E8B800]" />
            </motion.span>
            Réseau d&apos;experts SMART LIFE
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-[2rem] sm:text-[2.6rem] md:text-[3.5rem] font-extrabold leading-[1.1] mb-6 text-gray-900"
          >
            Nos{" "}
            <span className="bg-gradient-to-r from-[#E8B800] to-amber-500 bg-clip-text text-transparent">Consultants</span>
            <br className="hidden sm:block" />
            {" "}& Secteurs d&apos;
            <span className="bg-gradient-to-r from-[#27A827] to-emerald-500 bg-clip-text text-transparent">expertise</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="text-gray-500 max-w-xl mx-auto text-base sm:text-lg leading-relaxed mb-10 font-medium"
          >
            Des experts passionnés qui accompagnent entrepreneurs et entreprises
            à chaque étape de leur développement en Afrique.
          </motion.p>

          {/* Stats animées */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5 mb-6">
            {[
              { value: consultants.length, label: "Consultants actifs", icon: Users, gradient: "from-[#E8B800] to-amber-500" },
              { value: totalClients || 47, label: "Clients accompagnés", icon: CheckCircle, gradient: "from-[#27A827] to-emerald-500" },
              { value: totalEntreprises || 20, label: "Entreprises suivies", icon: Briefcase, gradient: "from-amber-500 to-[#E8B800]" },
              { value: categories.length || espacesActifs.length, label: "Secteurs couverts", icon: Award, gradient: "from-green-500 to-[#27A827]" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + i * 0.1, duration: 0.5 }}
                className="text-center p-4 sm:p-5 bg-white/80 backdrop-blur-sm border border-gray-100 rounded-3xl shadow-lg shadow-gray-100/50"
              >
                <div className={`inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-br ${stat.gradient} mb-2.5 shadow-lg`}>
                  <stat.icon size={18} className="text-white" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-gray-900 mb-0.5">{stat.value}+</div>
                <div className="text-gray-500 text-xs sm:text-sm font-medium leading-tight">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

      {/* ════════ SECTEURS PREMIUM ════════ */}
      <div className="mb-16">
        <AnimateOnScroll variant="fadeUp" className="flex items-center justify-between flex-wrap gap-4 mb-8">
          <div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-2">
              Secteurs d&apos;
              <span className="bg-gradient-to-r from-[#E8B800] to-amber-500 bg-clip-text text-transparent">accompagnement</span>
            </h2>
            <p className="text-gray-500 text-sm font-medium">{categories.length} secteur{categories.length > 1 ? "s" : ""} couverts par nos experts</p>
          </div>
          {filtreCategorie && (
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => setFiltreCategorie(null)}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#E8B800]/10 hover:bg-[#E8B800]/20 text-[#E8B800] border border-[#E8B800]/20 rounded-xl text-sm font-bold transition-all"
            >
              <Filter size={14} /> Tous les secteurs <X size={14} />
            </motion.button>
          )}
        </AnimateOnScroll>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
          {categories.map((cat, i) => {
            const config = getSecteurConfig(cat);
            return (
              <SecteurCard
                key={cat} secteur={config}
                nbEspaces={espacesDuSecteur(cat).length}
                nbConsultants={consultantsDuSecteur(cat).length}
                isActive={filtreCategorie === cat}
                onClick={() => setFiltreCategorie(filtreCategorie === cat ? null : cat)}
                index={i}
              />
            );
          })}
        </div>
      </div>

      {/* ════════ CONSULTANTS PREMIUM ════════ */}
      <div className="mb-20">
        <AnimateOnScroll variant="fadeUp" className="flex items-center justify-between flex-wrap gap-4 mb-8">
          <div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-2">
              {filtreCategorie
                ? <>Experts en <span className="bg-gradient-to-r from-[#E8B800] to-amber-500 bg-clip-text text-transparent">{filtreCategorie}</span></>
                : <>L&apos;équipe <span className="bg-gradient-to-r from-[#27A827] to-emerald-500 bg-clip-text text-transparent">SMART LIFE</span></>
              }
            </h2>
            <p className="text-gray-500 text-sm font-medium">
              {consultantsFiltres.length} consultant{consultantsFiltres.length > 1 ? "s" : ""}
              {filtreCategorie ? ` dans ce secteur` : ` au total`}
            </p>
          </div>
          {filtreCategorie && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`px-5 py-2.5 bg-gradient-to-r ${getSecteurConfig(filtreCategorie).gradientClass} border ${getSecteurConfig(filtreCategorie).borderClass} ${getSecteurConfig(filtreCategorie).textClass} rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm`}
            >
              {getSecteurConfig(filtreCategorie).emoji} {filtreCategorie}
            </motion.span>
          )}
        </AnimateOnScroll>

        {consultantsFiltres.length === 0 ? (
          <AnimateOnScroll variant="scaleUp">
            <div className="text-center py-16 sm:py-20 bg-gradient-to-br from-green-50/80 via-white to-yellow-50/80 border border-gray-100 rounded-3xl shadow-sm">
              <motion.div
                animate={{ y: [-5, 5, -5] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="text-6xl mb-5"
              >
                {filtreCategorie ? getSecteurConfig(filtreCategorie).emoji : "👥"}
              </motion.div>
              <h3 className="text-gray-900 font-extrabold text-2xl mb-3">
                {filtreCategorie ? `Aucun consultant en ${filtreCategorie}` : "Équipe en cours de constitution"}
              </h3>
              <p className="text-gray-500 max-w-md mx-auto text-sm mb-6 leading-relaxed">
                {filtreCategorie
                  ? "Nos experts dans ce secteur seront bientôt disponibles. Contactez-nous pour être accompagné."
                  : "Notre équipe de consultants se constitue. Contactez-nous pour être mis en relation avec un expert ou pour devenir consultant."}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                {filtreCategorie && (
                  <button onClick={() => setFiltreCategorie(null)}
                    className="px-6 py-3 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-sm font-bold transition-all">
                    Voir tous les secteurs
                  </button>
                )}
                <Link
                  href="/devenir-consultant"
                  className="px-6 py-3 bg-gradient-to-r from-[#E8B800] to-[#27A827] text-black rounded-xl text-sm font-bold shadow-lg shadow-[#E8B800]/20 hover:shadow-xl transition-all flex items-center gap-2"
                >
                  Devenir consultant <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </AnimateOnScroll>
        ) : (
          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" staggerDelay={0.1}>
            {consultantsFiltres.map((c) => {
              const domaines = domainesNoms(c.domainesIds);
              const categoriesPrincipales = [...new Set(
                c.domainesIds.map((id) => espaces.find((e) => e.id === id)?.domaine).filter(Boolean) as string[]
              )];
              const mainConfig = categoriesPrincipales.length > 0 ? getSecteurConfig(categoriesPrincipales[0]) : null;
              const cReviews = reviewsByConsultant[c.id] ?? [];

              return (
                <StaggerItem key={c.id}>
                <motion.div
                  whileHover={{ y: -4, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="bg-white border border-gray-100 rounded-3xl shadow-md hover:shadow-xl hover:border-[#E8B800]/30 transition-shadow flex flex-col overflow-hidden">
                  {mainConfig && (
                    <div className={`bg-gradient-to-r ${mainConfig.gradientClass} px-4 py-2.5 flex items-center gap-2`}>
                      <span className="text-base">{mainConfig.emoji}</span>
                      <span className={`text-xs font-bold ${mainConfig.textClass}`}>{mainConfig.categorie}</span>
                    </div>
                  )}

                  <div className="p-6 flex flex-col flex-1 text-center">
                    <div className="w-20 h-20 mx-auto rounded-2xl overflow-hidden border border-[#E8B800]/30 mb-4 flex-shrink-0">
                      {c.photoUrl ? (
                        <Image src={c.photoUrl} alt={c.prenom} width={80} height={80} className="w-full h-full object-cover" unoptimized />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#E8B800]/30 to-[#27A827]/10 flex items-center justify-center text-[#E8B800] font-black text-4xl">
                          {c.prenom.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <h3 className="text-gray-900 font-bold text-xl mb-1">
                      {c.prenom}
                      {c.nom && (
                        <span className="ml-2 text-gray-500 font-normal text-sm align-middle" style={{ filter: "blur(4px)", userSelect: "none" }}>
                          {c.nom}
                        </span>
                      )}
                    </h3>

                    {c.ville && (
                      <p className="text-gray-500 text-xs flex items-center justify-center gap-1 mb-0.5">
                        <MapPin size={10} /> {c.ville}
                      </p>
                    )}
                    {c.anneesExperience && (
                      <p className="text-gray-500 text-xs flex items-center justify-center gap-1">
                        <Clock size={10} /> {c.anneesExperience}
                      </p>
                    )}

                    {cReviews.length > 0 && (
                      <div className="flex items-center justify-center gap-1 mt-1.5">
                        <StarDisplay note={Math.round(cReviews.reduce((s, r) => s + r.note, 0) / cReviews.length)} size={11} />
                        <span className="text-xs text-gray-500">({cReviews.length})</span>
                      </div>
                    )}

                    <div className="my-4 space-y-2">
                      {c.clientsAccompa > 0 && (
                        <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                          <CheckCircle size={13} className="text-emerald-400" />
                          <span><strong className="text-gray-900 text-base">{c.clientsAccompa}</strong> client{c.clientsAccompa > 1 ? "s" : ""}</span>
                        </div>
                      )}
                      {c.entreprisesAccompa > 0 && (
                        <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                          <Briefcase size={13} className="text-[#E8B800]" />
                          <span><strong className="text-gray-900 text-base">{c.entreprisesAccompa}</strong> entreprise{c.entreprisesAccompa > 1 ? "s" : ""}</span>
                        </div>
                      )}
                    </div>

                    {domaines.length > 0 && (
                      <div className="flex flex-wrap justify-center gap-1.5 mb-4">
                        {domaines.slice(0, 2).map((d) => (
                          <span key={d} className="text-xs px-2.5 py-1 bg-[#E8B800]/10 text-[#E8B800] border border-[#E8B800]/20 rounded-full">{d}</span>
                        ))}
                        {domaines.length > 2 && (
                          <span className="text-xs px-2.5 py-1 bg-gray-50 text-gray-500 rounded-full">+{domaines.length - 2}</span>
                        )}
                      </div>
                    )}

                    <div className="mt-auto">
                      <button
                        onClick={() => setSelectedConsultant(c)}
                        className="w-full py-3 px-4 bg-gradient-to-r from-[#E8B800] to-amber-500 hover:from-[#27A827] hover:to-emerald-500 text-black text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                      >
                        Voir le profil <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                </motion.div>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        )}
      </div>

      {/* ════════ ESPACES PAR SECTEUR ════════ */}
      <div className="mb-20">
        <AnimateOnScroll variant="fadeUp" className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">
            Domaines d&apos;
            <span className="bg-gradient-to-r from-[#27A827] to-emerald-500 bg-clip-text text-transparent">expertise</span>
            {" "}& projets accompagnés
          </h2>
          <p className="text-gray-500 text-sm font-medium">
            {espacesActifs.length} espace{espacesActifs.length > 1 ? "s" : ""} disponible{espacesActifs.length > 1 ? "s" : ""}
          </p>
        </AnimateOnScroll>

        {categories.map((cat) => {
          const config = getSecteurConfig(cat);
          const espaces_cat = espacesDuSecteur(cat);
          if (espaces_cat.length === 0) return null;
          return (
            <AnimateOnScroll key={cat} variant="fadeUp" className="mb-10">
              <div className={`flex items-center gap-3 px-5 py-3.5 bg-gradient-to-r ${config.gradientClass} border ${config.borderClass} rounded-2xl mb-5 shadow-sm`}>
                <span className="text-2xl">{config.emoji}</span>
                <div>
                  <h3 className={`font-bold text-base ${config.textClass}`}>{config.categorie}</h3>
                  <p className="text-gray-500 text-xs">{config.desc}</p>
                </div>
                <span className={`ml-auto text-xs font-bold px-3 py-1.5 ${config.accentClass} text-white rounded-full shadow-sm`}>
                  {espaces_cat.length} espace{espaces_cat.length > 1 ? "s" : ""}
                </span>
              </div>

              <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4" staggerDelay={0.08}>
                {espaces_cat.map((espace) => (
                  <StaggerItem key={espace.id}>
                  <Link href={`/accompagnement/${espace.id}`}
                    className="group block overflow-hidden bg-white border border-gray-100 rounded-2xl shadow-sm hover:border-[#E8B800]/40 hover:shadow-lg transition-all hover:-translate-y-1">
                    <div className="relative w-full overflow-hidden" style={{ aspectRatio: "16/9" }}>
                      {espace.visuel || espace.image ? (
                        <img src={espace.visuel || espace.image} alt={espace.titre} loading="lazy" decoding="async"
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      ) : (
                        <div className={`w-full h-full bg-gradient-to-br ${config.gradientClass} flex items-center justify-center`}>
                          <span className="text-5xl">{config.emoji}</span>
                        </div>
                      )}
                      <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.45), transparent 55%)" }} />
                      <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm" style={{ background: "#27A827", color: "#fff" }}>
                        {config.emoji} {config.categorie}
                      </span>
                      {espace.placesDisponibles <= 2 && (
                        <span className="cta-clignote absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: "#ef4444", color: "#fff" }}>
                          Plus que {espace.placesDisponibles} place{espace.placesDisponibles > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    <div className="p-4">
                    <h4 className="text-gray-900 font-bold text-sm leading-snug group-hover:text-[#E8B800] transition-colors mb-1.5">{espace.titre}</h4>
                    <p className="text-[11.5px] text-[#393c41] leading-snug mb-2.5">
                      Soumettez votre projet et faites-vous accompagner par un expert à vos côtés pour réussir le lancement de votre activité, ou optimiser celle qui tourne déjà.
                    </p>
                    <div className="space-y-1.5">
                      {espace.clientsSatisfaits > 0 && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                          <CheckCircle size={11} className="text-emerald-400" />
                          <span><strong className="text-gray-900">{espace.clientsSatisfaits}</strong> projet{espace.clientsSatisfaits > 1 ? "s" : ""} accompagné{espace.clientsSatisfaits > 1 ? "s" : ""}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <Users size={11} className={espace.placesDisponibles <= 2 ? "text-orange-400" : "text-[#E8B800]"} />
                        <span><strong className={espace.placesDisponibles <= 2 ? "text-orange-500" : "text-gray-900"}>{espace.placesDisponibles}</strong> place{espace.placesDisponibles > 1 ? "s" : ""} dispo</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-end mt-3 pt-3 border-t border-gray-100">
                      <span className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-[#E8B800] to-amber-500 text-black text-xs font-bold rounded-lg group-hover:from-[#27A827] group-hover:to-emerald-500 transition-all shadow-sm">
                        Postuler <ArrowRight size={10} />
                      </span>
                    </div>
                    </div>
                  </Link>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </AnimateOnScroll>
          );
        })}
      </div>

      {/* ════════ ATOUTS ════════ */}
      <StaggerContainer className="grid md:grid-cols-3 gap-6 mb-20" staggerDelay={0.15}>
        {[
          { icon: TrendingUp, titre: "Résultats mesurables", desc: "Chaque accompagnement est axé sur des objectifs concrets et des résultats quantifiables pour votre activité.", gradient: "from-[#E8B800] to-amber-500" },
          { icon: Star, titre: "Expertise terrain", desc: "Nos consultants ont une expérience directe du marché africain et comprennent les réalités locales.", gradient: "from-[#27A827] to-emerald-500" },
          { icon: MapPin, titre: "Présence locale", desc: "Disponibles en présentiel au Cameroun et en ligne pour toute l'Afrique francophone et la diaspora.", gradient: "from-amber-500 to-[#E8B800]" },
        ].map((item) => (
          <StaggerItem key={item.titre}>
            <motion.div
              whileHover={{ y: -4 }}
              className="p-7 bg-white border border-gray-100 rounded-3xl shadow-md hover:shadow-xl transition-shadow"
            >
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center mb-5 shadow-lg`}>
                <item.icon size={20} className="text-white" />
              </div>
              <h3 className="text-gray-900 font-extrabold text-lg mb-2">{item.titre}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
            </motion.div>
          </StaggerItem>
        ))}
      </StaggerContainer>

      {/* ════════ CTA PREMIUM ════════ */}
      <AnimateOnScroll variant="scaleUp" className="mb-16">
        <div className="text-center p-10 sm:p-14 rounded-3xl bg-gradient-to-br from-green-50/80 via-white to-yellow-50/80 border border-gray-100 shadow-sm">
          <motion.div
            animate={{ y: [-5, 5, -5] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="text-5xl mb-5"
          >
            🚀
          </motion.div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">Rejoindre l&apos;équipe SMART LIFE ?</h2>
          <p className="text-gray-500 mb-8 max-w-lg mx-auto text-sm sm:text-base leading-relaxed">
            Vous êtes expert dans votre domaine et souhaitez accompagner des entrepreneurs ?
            Candidatez pour rejoindre notre réseau de consultants.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link href="/devenir-consultant"
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#E8B800] to-[#27A827] text-black font-bold rounded-2xl transition-all shadow-xl shadow-[#E8B800]/20 text-base">
                Devenir consultant <ArrowRight size={18} />
              </Link>
            </motion.div>
            <Link href="/accompagnement"
              className="inline-flex items-center gap-2 px-8 py-4 border border-gray-200 hover:border-[#E8B800]/40 text-gray-700 hover:text-gray-900 rounded-2xl transition-all text-base font-medium">
              Voir les espaces
            </Link>
          </div>
        </div>
      </AnimateOnScroll>

      </div>

      {/* ── Modals ── */}

      {/* Profil consultant */}
      {selectedConsultant && (
        <ProfilModal
          consultant={selectedConsultant}
          domaines={domainesNoms(selectedConsultant.domainesIds)}
          reviews={selectedReviews}
          onClose={() => setSelectedConsultant(null)}
          onDemander={() => setDemandeConsultant(selectedConsultant)}
          onAvis={() => handleAvisClick(selectedConsultant)}
          avisChecking={avisChecking}
        />
      )}

      {/* Formulaire demande accompagnement */}
      {demandeConsultant && (
        <DemandeConsultantModal
          consultant={demandeConsultant}
          consultantDomaines={getConsultantDomaines(demandeConsultant.domainesIds)}
          allEspaces={espaces}
          onClose={() => setDemandeConsultant(null)}
        />
      )}

      {/* Formulaire avis */}
      {avisConsultant && (
        <AvisModal
          consultant={avisConsultant}
          onClose={() => setAvisConsultant(null)}
        />
      )}

      {/* Restriction avis */}
      {showAvisRestriction && (
        <AvisRestrictionModal onClose={() => setShowAvisRestriction(false)} />
      )}
    </div>
  );
}
