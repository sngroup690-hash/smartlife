"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Users, Star, CheckCircle, ArrowRight, Briefcase,
  MapPin, TrendingUp, Award, Shield, X, Clock, ExternalLink,
  Filter, Send, MessageSquare, ChevronDown, ChevronUp, Loader2,
} from "lucide-react";
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
  accentClass: string; desc: string;
};

const SECTEURS_CONFIG: SecteurConfig[] = [
  { categorie: "Agriculture",       emoji: "🌾", illustration: "🌱🐟🌿", gradientClass: "from-emerald-50 to-green-100",  borderClass: "border-emerald-200", textClass: "text-emerald-800", accentClass: "bg-emerald-500", desc: "Pisciculture, élevage & cultures" },
  { categorie: "Commerce",          emoji: "🏪", illustration: "🛒💼📦", gradientClass: "from-amber-50 to-yellow-100",   borderClass: "border-amber-200",   textClass: "text-amber-800",   accentClass: "bg-amber-500",   desc: "Boutiques, quincaillerie & négoce" },
  { categorie: "Services",          emoji: "⚙️", illustration: "🧺👔✨", gradientClass: "from-blue-50 to-indigo-100",    borderClass: "border-blue-200",    textClass: "text-blue-800",    accentClass: "bg-blue-500",    desc: "Pressing, entretien & maintenance" },
  { categorie: "Restauration",      emoji: "🍽️", illustration: "👨‍🍳🥘🍴", gradientClass: "from-orange-50 to-red-100",  borderClass: "border-orange-200",  textClass: "text-orange-800",  accentClass: "bg-orange-500",  desc: "Restaurants, snacks & traiteurs" },
  { categorie: "Beauté",            emoji: "💆", illustration: "💇‍♀️✂️💅", gradientClass: "from-pink-50 to-rose-100",   borderClass: "border-pink-200",    textClass: "text-pink-800",    accentClass: "bg-pink-500",    desc: "Coiffure, esthétique & cosmétique" },
  { categorie: "Alimentaire",       emoji: "🥖", illustration: "🧁🥐🍞", gradientClass: "from-yellow-50 to-amber-100",  borderClass: "border-yellow-200",  textClass: "text-yellow-800",  accentClass: "bg-yellow-500",  desc: "Boulangerie, pâtisserie & épicerie" },
  { categorie: "Santé & Bien-être", emoji: "💊", illustration: "🏥💊🌿", gradientClass: "from-teal-50 to-cyan-100",     borderClass: "border-teal-200",    textClass: "text-teal-800",    accentClass: "bg-teal-500",    desc: "Parapharmacie, soins & bien-être" },
];

function getSecteurConfig(categorie: string): SecteurConfig {
  return (
    SECTEURS_CONFIG.find((s) => s.categorie === categorie) ?? {
      categorie, emoji: "🏢", illustration: "📊💡🎯",
      gradientClass: "from-gray-50 to-slate-100", borderClass: "border-gray-200",
      textClass: "text-gray-800", accentClass: "bg-gray-500", desc: "Accompagnement professionnel",
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
              <p className="text-gray-500 text-xs mb-2 uppercase tracking-wider">À propos</p>
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
            className="w-full flex items-center justify-center gap-2 py-3 bg-[#E8B800] hover:bg-[#27A827] text-black font-bold rounded-xl transition-all text-sm"
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
  secteur, nbEspaces, nbConsultants, isActive, onClick,
}: {
  secteur: SecteurConfig; nbEspaces: number; nbConsultants: number;
  isActive: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative w-full text-left rounded-2xl border-2 overflow-hidden transition-all duration-200 group ${
        isActive
          ? `${secteur.borderClass} ring-2 ring-offset-2 ring-current shadow-lg scale-[1.02]`
          : "border-gray-200 hover:border-gray-300 hover:shadow-md hover:scale-[1.01]"
      }`}
    >
      <div className={`bg-gradient-to-br ${secteur.gradientClass} p-5`}>
        <div className="absolute top-2 right-3 text-4xl opacity-20 select-none pointer-events-none">{secteur.illustration}</div>
        {isActive && (
          <span className={`absolute top-3 right-3 w-6 h-6 ${secteur.accentClass} rounded-full flex items-center justify-center text-white text-xs font-bold`}>✓</span>
        )}
        <div className="text-4xl mb-3">{secteur.emoji}</div>
        <h3 className={`font-black text-base leading-tight mb-1 ${secteur.textClass}`}>{secteur.categorie}</h3>
        <p className="text-gray-600 text-xs leading-relaxed mb-3">{secteur.desc}</p>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-bold px-2 py-1 bg-white/70 border ${secteur.borderClass} ${secteur.textClass} rounded-full`}>
            {nbEspaces} espace{nbEspaces > 1 ? "s" : ""}
          </span>
          {nbConsultants > 0 && (
            <span className={`text-xs font-bold px-2 py-1 ${secteur.accentClass} text-white rounded-full`}>
              {nbConsultants} expert{nbConsultants > 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>
    </button>
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

      {/* Hero */}
      <div className="text-center mb-20">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#E8B800]/10 border border-[#E8B800]/30 rounded-full text-sm text-[#E8B800] mb-6">
          <Shield size={14} /> Équipe d&apos;experts SMART LIFE
        </div>
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Nos <span className="gradient-text">Consultants</span>
          <br />&amp; Secteurs d&apos;expertise
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto text-lg leading-relaxed mb-10">
          Des experts passionnés qui accompagnent entrepreneurs et entreprises à chaque étape de leur développement en Afrique.
        </p>

        <div className="flex flex-wrap justify-center gap-6">
          {[
            { value: consultants.length || "—", label: "Consultants actifs", icon: Users },
            { value: totalClients || "47+", label: "Clients accompagnés", icon: CheckCircle },
            { value: totalEntreprises || "20+", label: "Entreprises suivies", icon: Briefcase },
            { value: categories.length || espacesActifs.length, label: "Secteurs couverts", icon: Award },
          ].map((s) => (
            <div key={s.label} className="text-center px-8 py-4 bg-white border border-gray-200 rounded-2xl shadow-sm min-w-[140px]">
              <div className="flex justify-center mb-2"><s.icon size={18} className="text-[#E8B800]" /></div>
              <div className="text-3xl font-bold gradient-text mb-1">{s.value}</div>
              <div className="text-gray-500 text-sm">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Secteurs */}
      <div className="mb-16">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-1">
              Secteurs d&apos;<span className="gradient-text">accompagnement</span>
            </h2>
            <p className="text-gray-500 text-sm">{categories.length} secteur{categories.length > 1 ? "s" : ""} couverts par nos experts</p>
          </div>
          {filtreCategorie && (
            <button
              onClick={() => setFiltreCategorie(null)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-all"
            >
              <Filter size={14} /> Tous les secteurs <X size={14} />
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((cat) => {
            const config = getSecteurConfig(cat);
            return (
              <SecteurCard
                key={cat} secteur={config}
                nbEspaces={espacesDuSecteur(cat).length}
                nbConsultants={consultantsDuSecteur(cat).length}
                isActive={filtreCategorie === cat}
                onClick={() => setFiltreCategorie(filtreCategorie === cat ? null : cat)}
              />
            );
          })}
        </div>
      </div>

      {/* Consultants */}
      <div className="mb-20">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-1">
              {filtreCategorie
                ? <>Experts en <span className="gradient-text">{filtreCategorie}</span></>
                : <>L&apos;équipe <span className="gradient-text">SMART LIFE</span></>
              }
            </h2>
            <p className="text-gray-500 text-sm">
              {consultantsFiltres.length} consultant{consultantsFiltres.length > 1 ? "s" : ""}
              {filtreCategorie ? ` dans ce secteur` : ` au total`}
            </p>
          </div>
          {filtreCategorie && (
            <span className={`px-4 py-2 bg-gradient-to-r ${getSecteurConfig(filtreCategorie).gradientClass} border ${getSecteurConfig(filtreCategorie).borderClass} ${getSecteurConfig(filtreCategorie).textClass} rounded-xl text-sm font-bold flex items-center gap-2`}>
              {getSecteurConfig(filtreCategorie).emoji} {filtreCategorie}
            </span>
          )}
        </div>

        {consultantsFiltres.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 border border-gray-200 rounded-3xl">
            <div className="text-5xl mb-4">{filtreCategorie ? getSecteurConfig(filtreCategorie).emoji : "👥"}</div>
            <h3 className="text-gray-900 font-bold text-xl mb-2">
              {filtreCategorie ? `Aucun consultant disponible en ${filtreCategorie}` : "Équipe en cours de présentation"}
            </h3>
            <p className="text-gray-600 max-w-md mx-auto text-sm mb-5">
              {filtreCategorie
                ? "Nos experts dans ce secteur seront bientôt disponibles."
                : "Notre équipe de consultants est active et disponible. Contactez-nous pour être mis en relation."}
            </p>
            {filtreCategorie && (
              <button onClick={() => setFiltreCategorie(null)}
                className="px-5 py-2.5 border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-xl text-sm font-medium transition-all">
                Voir tous les consultants
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {consultantsFiltres.map((c) => {
              const domaines = domainesNoms(c.domainesIds);
              const categoriesPrincipales = [...new Set(
                c.domainesIds.map((id) => espaces.find((e) => e.id === id)?.domaine).filter(Boolean) as string[]
              )];
              const mainConfig = categoriesPrincipales.length > 0 ? getSecteurConfig(categoriesPrincipales[0]) : null;
              const cReviews = reviewsByConsultant[c.id] ?? [];

              return (
                <div key={c.id}
                  className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:border-[#E8B800]/40 hover:shadow-md transition-all flex flex-col overflow-hidden">
                  {mainConfig && (
                    <div className={`bg-gradient-to-r ${mainConfig.gradientClass} px-4 py-2 flex items-center gap-2`}>
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
                        className="w-full py-2.5 px-4 bg-[#E8B800]/10 hover:bg-[#E8B800]/20 border border-[#E8B800]/30 hover:border-[#E8B800]/60 text-[#E8B800] text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
                      >
                        Voir le profil <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Espaces par secteur */}
      <div className="mb-20">
        <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">
          Domaines d&apos;<span className="gradient-text">expertise</span> &amp; projets accompagnés
        </h2>
        <p className="text-gray-500 text-sm text-center mb-10">
          {espacesActifs.length} espace{espacesActifs.length > 1 ? "s" : ""} disponible{espacesActifs.length > 1 ? "s" : ""}
        </p>

        {categories.map((cat) => {
          const config = getSecteurConfig(cat);
          const espaces_cat = espacesDuSecteur(cat);
          if (espaces_cat.length === 0) return null;
          return (
            <div key={cat} className="mb-10">
              <div className={`flex items-center gap-3 px-4 py-3 bg-gradient-to-r ${config.gradientClass} border ${config.borderClass} rounded-xl mb-4`}>
                <span className="text-2xl">{config.emoji}</span>
                <div>
                  <h3 className={`font-bold text-base ${config.textClass}`}>{config.categorie}</h3>
                  <p className="text-gray-500 text-xs">{config.desc}</p>
                </div>
                <span className={`ml-auto text-xs font-bold px-3 py-1 ${config.accentClass} text-white rounded-full`}>
                  {espaces_cat.length} espace{espaces_cat.length > 1 ? "s" : ""}
                </span>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {espaces_cat.map((espace) => (
                  <Link key={espace.id} href={`/accompagnement/${espace.id}`}
                    className="group p-5 bg-white border border-gray-200 rounded-2xl shadow-sm hover:border-[#E8B800]/40 hover:shadow-md transition-all">
                    {espace.image ? (
                      <div className="w-10 h-10 rounded-xl overflow-hidden border border-gray-200 mb-3">
                        <img src={espace.image} alt={espace.titre} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${config.gradientClass} border ${config.borderClass} flex items-center justify-center mb-3`}>
                        <span className="text-lg">{config.emoji}</span>
                      </div>
                    )}
                    <h4 className="text-gray-900 font-bold text-sm leading-snug group-hover:text-[#E8B800] transition-colors mb-2">{espace.titre}</h4>
                    <div className="space-y-1">
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
                    <div className="flex items-center justify-end mt-3 pt-2 border-t border-gray-100">
                      <span className="flex items-center gap-1 px-3 py-1.5 bg-[#E8B800] text-black text-xs font-bold rounded-lg group-hover:bg-[#27A827] transition-colors">
                        Postuler <ArrowRight size={10} />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Atouts */}
      <div className="grid md:grid-cols-3 gap-6 mb-20">
        {[
          { icon: TrendingUp, titre: "Résultats mesurables", desc: "Chaque accompagnement est axé sur des objectifs concrets et des résultats quantifiables pour votre activité." },
          { icon: Star, titre: "Expertise terrain", desc: "Nos consultants ont une expérience directe du marché africain et comprennent les réalités locales." },
          { icon: MapPin, titre: "Présence locale", desc: "Disponibles en présentiel au Cameroun et en ligne pour toute l'Afrique francophone et la diaspora." },
        ].map((item) => (
          <div key={item.titre} className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-[#E8B800]/10 border border-[#E8B800]/20 flex items-center justify-center mb-4">
              <item.icon size={18} className="text-[#E8B800]" />
            </div>
            <h3 className="text-gray-900 font-bold mb-2">{item.titre}</h3>
            <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="text-center p-12 rounded-3xl bg-gradient-to-br from-[#E8B800]/10 to-[#27A827]/5 border border-[#E8B800]/20">
        <div className="text-4xl mb-4">🚀</div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Rejoindre l&apos;équipe SMART LIFE ?</h2>
        <p className="text-gray-600 mb-8 max-w-lg mx-auto">
          Vous êtes expert dans votre domaine et souhaitez accompagner des entrepreneurs ? Candidatez pour rejoindre notre réseau de consultants.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/devenir-consultant"
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#E8B800] hover:bg-[#27A827] text-black font-bold rounded-xl transition-all shadow-lg shadow-[#E8B800]/30 hover:shadow-[#27A827]/40 hover:scale-105 animate-[bounce_2s_ease-in-out_infinite]">
            Devenir consultant <ArrowRight size={18} />
          </Link>
          <Link href="/accompagnement"
            className="inline-flex items-center gap-2 px-8 py-4 border border-gray-200 hover:border-[#E8B800]/40 text-gray-700 hover:text-gray-900 rounded-xl transition-all">
            Voir les espaces
          </Link>
        </div>
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
