"use client";

import { useState, useEffect } from "react";
import {
  CheckCircle,
  Clock,
  ArrowRight,
  ArrowLeft,
  Send,
  Package,
  FileText,
  User,
  ClipboardList,
  ExternalLink,
} from "lucide-react";
import { Service, formatPrice } from "@/lib/data";

type ServiceLike = Service & { briefLabel?: string; id?: string };

type ServiceOrderConfig = {
  confirmationMessage: string;
  whatsappNumber: string;
  redirectUrl: string;
  redirectDelay: number;
};

// ─── Types ──────────────────────────────────────────────────────────────────

type VoixOffDetails = {
  wordCount: string;
  accent: string;
  tone: string;
  script: string;
  backgroundMusic: string;
  usageType: string;
};

type VideoDetails = {
  videoType: string;
  duration: string;
  formats: string[];
  hasMedia: string;
  needsVoiceover: string;
  description: string;
};

type SourcingDetails = {
  productName: string;
  quantity: string;
  budget: string;
  urgency: string;
  city: string;
  hasReference: string;
  referenceUrl: string;
  description: string;
};

type ContactInfo = {
  name: string;
  email: string;
  phone: string;
  preferredContact: string;
};

type GenericDetails = { brief: string };

type OrderState = {
  selectedPackage: number | null;
  voixOff: VoixOffDetails;
  video: VideoDetails;
  sourcing: SourcingDetails;
  generic: GenericDetails;
  contact: ContactInfo;
};

// ─── Initial state ───────────────────────────────────────────────────────────

const INITIAL: OrderState = {
  selectedPackage: null,
  voixOff: { wordCount: "", accent: "", tone: "", script: "", backgroundMusic: "non", usageType: "" },
  video: { videoType: "", duration: "", formats: [], hasMedia: "non", needsVoiceover: "non", description: "" },
  sourcing: { productName: "", quantity: "", budget: "", urgency: "", city: "", hasReference: "non", referenceUrl: "", description: "" },
  generic: { brief: "" },
  contact: { name: "", email: "", phone: "", preferredContact: "email" },
};

// ─── Step indicator ──────────────────────────────────────────────────────────

const STEPS = [
  { label: "Forfait", icon: Package },
  { label: "Détails", icon: FileText },
  { label: "Contact", icon: User },
  { label: "Résumé", icon: ClipboardList },
];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-10">
      {STEPS.map((s, i) => {
        const Icon = s.icon;
        const done = i < current;
        const active = i === current;
        return (
          <div key={s.label} className="flex items-center gap-2">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                  done
                    ? "bg-green-600 border-green-600 text-white"
                    : active
                    ? "border-green-500 text-green-400 bg-green-900/30"
                    : "border-white/20 text-gray-600"
                }`}
              >
                {done ? <CheckCircle size={18} /> : <Icon size={18} />}
              </div>
              <span className={`text-xs font-medium ${active ? "text-green-400" : done ? "text-green-500" : "text-gray-600"}`}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-12 h-px mb-5 ${i < current ? "bg-green-600" : "bg-white/10"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Field helpers ───────────────────────────────────────────────────────────

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div>
      <label className="block text-gray-400 text-sm mb-2">
        {label} {required && <span className="text-[#E8B800]">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full px-4 py-3 bg-white/5 border border-green-700/60 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-green-400 transition-colors";

const selectCls =
  "w-full px-4 py-3 bg-[#0e0e1a] border border-green-700/60 rounded-xl text-white focus:outline-none focus:border-green-400 transition-colors";

function RadioGroup({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-wrap gap-3">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
            value === o.value
              ? "bg-green-600 border-green-600 text-white"
              : "border-white/20 text-gray-400 hover:border-white/40"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function CheckboxGroup({
  values,
  onChange,
  options,
}: {
  values: string[];
  onChange: (v: string[]) => void;
  options: { value: string; label: string }[];
}) {
  function toggle(val: string) {
    if (values.includes(val)) onChange(values.filter((v) => v !== val));
    else onChange([...values, val]);
  }
  return (
    <div className="flex flex-wrap gap-3">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => toggle(o.value)}
          className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all flex items-center gap-2 ${
            values.includes(o.value)
              ? "bg-green-600 border-green-600 text-white"
              : "border-white/20 text-gray-400 hover:border-white/40"
          }`}
        >
          {values.includes(o.value) && <CheckCircle size={13} />}
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ─── Step 1: Package selection ───────────────────────────────────────────────

function StepPackage({
  service,
  state,
  onSelect,
}: {
  service: Service;
  state: OrderState;
  onSelect: (i: number) => void;
}) {
  return (
    <div>
      <h3 className="text-white text-xl font-bold mb-2">Choisissez votre forfait</h3>
      <p className="text-gray-500 text-sm mb-8">Sélectionnez l&apos;offre qui correspond le mieux à vos besoins.</p>
      <div className="space-y-4">
        {service.packages.map((pkg, i) => (
          <div
            key={pkg.name}
            onClick={() => onSelect(i)}
            className={`p-6 rounded-2xl border cursor-pointer transition-all ${
              state.selectedPackage === i
                ? "bg-green-900/30 border-green-500"
                : pkg.popular
                ? "bg-green-900/10 border-green-700/40 hover:border-green-600/60"
                : "bg-white/[0.03] border-white/10 hover:border-white/25"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    state.selectedPackage === i ? "border-green-500 bg-green-500" : "border-white/30"
                  }`}
                >
                  {state.selectedPackage === i && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-white font-bold text-lg">{pkg.name}</h4>
                    {pkg.popular && (
                      <span className="px-2 py-0.5 bg-[#E8B800] text-black text-xs font-bold rounded-full">
                        Populaire
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-gray-500 text-xs mb-3">
                    <Clock size={12} />
                    Livraison : {pkg.deliveryTime}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {pkg.features.map((f) => (
                      <span key={f} className="flex items-center gap-1 text-gray-400 text-xs">
                        <CheckCircle size={11} className="text-green-400" />
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-[#E8B800] font-bold text-xl">{formatPrice(pkg.price)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Step 2: Service-specific details ────────────────────────────────────────

function StepDetailsVoixOff({
  data,
  onChange,
}: {
  data: VoixOffDetails;
  onChange: (d: VoixOffDetails) => void;
}) {
  const set = (k: keyof VoixOffDetails, v: string) => onChange({ ...data, [k]: v });
  return (
    <div className="space-y-5">
      <h3 className="text-white text-xl font-bold mb-2">Détails de votre Voix Off</h3>
      <p className="text-gray-500 text-sm mb-6">Plus vous êtes précis, plus le résultat sera parfait.</p>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Nombre de mots approximatif" required>
          <select value={data.wordCount} onChange={(e) => set("wordCount", e.target.value)} className={selectCls} required>
            <option value="" className="bg-[#0e0e1a]">Sélectionner...</option>
            <option value="moins-100" className="bg-[#0e0e1a]">Moins de 100 mots</option>
            <option value="100-300" className="bg-[#0e0e1a]">100 – 300 mots</option>
            <option value="300-600" className="bg-[#0e0e1a]">300 – 600 mots</option>
            <option value="600-1000" className="bg-[#0e0e1a]">600 – 1 000 mots</option>
            <option value="plus-1000" className="bg-[#0e0e1a]">Plus de 1 000 mots</option>
          </select>
        </Field>

        <Field label="Type d'utilisation" required>
          <select value={data.usageType} onChange={(e) => set("usageType", e.target.value)} className={selectCls} required>
            <option value="" className="bg-[#0e0e1a]">Sélectionner...</option>
            <option value="pub-radio-tv" className="bg-[#0e0e1a]">Publicité Radio / TV</option>
            <option value="pub-reseaux" className="bg-[#0e0e1a]">Publicité Réseaux Sociaux</option>
            <option value="e-learning" className="bg-[#0e0e1a]">E-learning / Formation</option>
            <option value="documentaire" className="bg-[#0e0e1a]">Documentaire</option>
            <option value="presentation" className="bg-[#0e0e1a]">Présentation / Corporate</option>
            <option value="livre-audio" className="bg-[#0e0e1a]">Livre Audio</option>
            <option value="autre" className="bg-[#0e0e1a]">Autre</option>
          </select>
        </Field>
      </div>

      <Field label="Accent souhaité" required>
        <RadioGroup
          value={data.accent}
          onChange={(v) => set("accent", v)}
          options={[
            { value: "camerounais", label: "Camerounais" },
            { value: "francais", label: "Français de France" },
            { value: "neutre", label: "Neutre / International" },
            { value: "africain", label: "Africain (général)" },
          ]}
        />
      </Field>

      <Field label="Ton souhaité" required>
        <RadioGroup
          value={data.tone}
          onChange={(v) => set("tone", v)}
          options={[
            { value: "professionnel", label: "Professionnel" },
            { value: "dynamique", label: "Dynamique" },
            { value: "detendu", label: "Détendu" },
            { value: "solennel", label: "Solennel" },
            { value: "publicitaire", label: "Publicitaire" },
          ]}
        />
      </Field>

      <Field label="Musique de fond souhaitée ?">
        <RadioGroup
          value={data.backgroundMusic}
          onChange={(v) => set("backgroundMusic", v)}
          options={[
            { value: "oui", label: "Oui" },
            { value: "non", label: "Non" },
            { value: "je-ne-sais-pas", label: "À votre discrétion" },
          ]}
        />
      </Field>

      <Field label="Texte à lire / Script" required>
        <textarea
          required
          rows={6}
          value={data.script}
          onChange={(e) => set("script", e.target.value)}
          className={`${inputCls} resize-none`}
          placeholder="Collez ici le texte exact que vous souhaitez enregistrer. Si vous n'avez pas encore de script, décrivez le contenu souhaité..."
        />
      </Field>
    </div>
  );
}

function StepDetailsVideo({
  data,
  onChange,
}: {
  data: VideoDetails;
  onChange: (d: VideoDetails) => void;
}) {
  const set = (k: keyof VideoDetails, v: string | string[]) => onChange({ ...data, [k]: v });
  return (
    <div className="space-y-5">
      <h3 className="text-white text-xl font-bold mb-2">Détails de votre Vidéo</h3>
      <p className="text-gray-500 text-sm mb-6">Décrivez votre projet vidéo pour que nous puissions vous proposer le meilleur résultat.</p>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Type de vidéo" required>
          <select value={data.videoType} onChange={(e) => set("videoType", e.target.value)} className={selectCls} required>
            <option value="" className="bg-[#0e0e1a]">Sélectionner...</option>
            <option value="pub-promo" className="bg-[#0e0e1a]">Publicité / Promo</option>
            <option value="presentation" className="bg-[#0e0e1a]">Présentation d&apos;entreprise</option>
            <option value="tutoriel" className="bg-[#0e0e1a]">Tutoriel / Formation</option>
            <option value="temoignage" className="bg-[#0e0e1a]">Témoignage client</option>
            <option value="reseaux" className="bg-[#0e0e1a]">Contenu Réseaux Sociaux</option>
            <option value="autre" className="bg-[#0e0e1a]">Autre</option>
          </select>
        </Field>

        <Field label="Durée souhaitée" required>
          <select value={data.duration} onChange={(e) => set("duration", e.target.value)} className={selectCls} required>
            <option value="" className="bg-[#0e0e1a]">Sélectionner...</option>
            <option value="moins-30s" className="bg-[#0e0e1a]">Moins de 30 secondes</option>
            <option value="30s-1min" className="bg-[#0e0e1a]">30 sec – 1 min</option>
            <option value="1-2min" className="bg-[#0e0e1a]">1 – 2 minutes</option>
            <option value="2-5min" className="bg-[#0e0e1a]">2 – 5 minutes</option>
            <option value="plus-5min" className="bg-[#0e0e1a]">Plus de 5 minutes</option>
          </select>
        </Field>
      </div>

      <Field label="Format(s) souhaité(s)" required>
        <CheckboxGroup
          values={data.formats}
          onChange={(v) => set("formats", v)}
          options={[
            { value: "story-reel", label: "Story / Reel (vertical)" },
            { value: "youtube", label: "YouTube (16:9)" },
            { value: "tiktok", label: "TikTok" },
            { value: "linkedin", label: "LinkedIn" },
            { value: "television", label: "Télévision" },
          ]}
        />
      </Field>

      <Field label="Avez-vous des photos/vidéos existantes ?">
        <RadioGroup
          value={data.hasMedia}
          onChange={(v) => set("hasMedia", v)}
          options={[
            { value: "oui", label: "Oui, j'ai du matériel" },
            { value: "non", label: "Non, tout est à créer" },
            { value: "partiel", label: "En partie" },
          ]}
        />
      </Field>

      <Field label="Voix off nécessaire ?">
        <RadioGroup
          value={data.needsVoiceover}
          onChange={(v) => set("needsVoiceover", v)}
          options={[
            { value: "oui", label: "Oui" },
            { value: "non", label: "Non" },
            { value: "je-ne-sais-pas", label: "À votre avis" },
          ]}
        />
      </Field>

      <Field label="Description du projet" required>
        <textarea
          required
          rows={5}
          value={data.description}
          onChange={(e) => set("description", e.target.value)}
          className={`${inputCls} resize-none`}
          placeholder="Décrivez votre projet : le contexte, le message à transmettre, votre public cible, les couleurs / style souhaités, des exemples de vidéos qui vous inspirent..."
        />
      </Field>
    </div>
  );
}

function StepDetailsSourcing({
  data,
  onChange,
}: {
  data: SourcingDetails;
  onChange: (d: SourcingDetails) => void;
}) {
  const set = (k: keyof SourcingDetails, v: string) => onChange({ ...data, [k]: v });
  return (
    <div className="space-y-5">
      <h3 className="text-white text-xl font-bold mb-2">Détails de votre Commande Produits</h3>
      <p className="text-gray-500 text-sm mb-6">Soyez le plus précis possible pour faciliter la recherche.</p>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Nom / Description du produit" required>
          <input
            required
            type="text"
            value={data.productName}
            onChange={(e) => set("productName", e.target.value)}
            className={inputCls}
            placeholder="Ex : iPhone 15 Pro Max 256Go, Robe maxi fleurie..."
          />
        </Field>

        <Field label="Quantité souhaitée" required>
          <input
            required
            type="number"
            min="1"
            value={data.quantity}
            onChange={(e) => set("quantity", e.target.value)}
            className={inputCls}
            placeholder="Ex : 10"
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Budget maximum" required>
          <select value={data.budget} onChange={(e) => set("budget", e.target.value)} className={selectCls} required>
            <option value="" className="bg-[#0e0e1a]">Sélectionner...</option>
            <option value="moins-50k" className="bg-[#0e0e1a]">Moins de 50 000 FCFA</option>
            <option value="50k-150k" className="bg-[#0e0e1a]">50 000 – 150 000 FCFA</option>
            <option value="150k-500k" className="bg-[#0e0e1a]">150 000 – 500 000 FCFA</option>
            <option value="500k-1m" className="bg-[#0e0e1a]">500 000 – 1 000 000 FCFA</option>
            <option value="plus-1m" className="bg-[#0e0e1a]">Plus de 1 000 000 FCFA</option>
          </select>
        </Field>

        <Field label="Urgence / Délai souhaité" required>
          <select value={data.urgency} onChange={(e) => set("urgency", e.target.value)} className={selectCls} required>
            <option value="" className="bg-[#0e0e1a]">Sélectionner...</option>
            <option value="standard" className="bg-[#0e0e1a]">Standard – 7 à 15 jours</option>
            <option value="express" className="bg-[#0e0e1a]">Express – 5 à 10 jours</option>
            <option value="urgent" className="bg-[#0e0e1a]">Urgent – 3 à 5 jours</option>
          </select>
        </Field>
      </div>

      <Field label="Ville / Lieu de livraison" required>
        <input
          required
          type="text"
          value={data.city}
          onChange={(e) => set("city", e.target.value)}
          className={inputCls}
          placeholder="Ex : Yaoundé, Douala, Bafoussam..."
        />
      </Field>

      <Field label="Avez-vous une référence ou un lien produit ?">
        <RadioGroup
          value={data.hasReference}
          onChange={(v) => set("hasReference", v)}
          options={[
            { value: "oui", label: "Oui" },
            { value: "non", label: "Non" },
          ]}
        />
      </Field>

      {data.hasReference === "oui" && (
        <Field label="Lien de référence (URL)">
          <input
            type="url"
            value={data.referenceUrl}
            onChange={(e) => set("referenceUrl", e.target.value)}
            className={inputCls}
            placeholder="https://aliexpress.com/item/..."
          />
        </Field>
      )}

      <Field label="Informations complémentaires">
        <textarea
          rows={4}
          value={data.description}
          onChange={(e) => set("description", e.target.value)}
          className={`${inputCls} resize-none`}
          placeholder="Couleur, taille, modèle, marque préférée, conditions spéciales..."
        />
      </Field>
    </div>
  );
}

// ─── Step 3: Contact ─────────────────────────────────────────────────────────

function StepContact({
  data,
  onChange,
}: {
  data: ContactInfo;
  onChange: (d: ContactInfo) => void;
}) {
  const set = (k: keyof ContactInfo, v: string) => onChange({ ...data, [k]: v });
  return (
    <div className="space-y-5">
      <h3 className="text-white text-xl font-bold mb-2">Vos coordonnées</h3>
      <p className="text-gray-500 text-sm mb-6">Pour vous envoyer le devis et finaliser votre commande.</p>

      <Field label="Nom complet" required>
        <input
          required
          type="text"
          value={data.name}
          onChange={(e) => set("name", e.target.value)}
          className={inputCls}
          placeholder="Jean Dupont"
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Email" required>
          <input
            required
            type="email"
            value={data.email}
            onChange={(e) => set("email", e.target.value)}
            className={inputCls}
            placeholder="jean@exemple.com"
          />
        </Field>
        <Field label="Téléphone / WhatsApp" required>
          <input
            required
            type="tel"
            value={data.phone}
            onChange={(e) => set("phone", e.target.value)}
            className={inputCls}
            placeholder="+237 6XX XXX XXX"
          />
        </Field>
      </div>

      <Field label="Mode de contact préféré">
        <RadioGroup
          value={data.preferredContact}
          onChange={(v) => set("preferredContact", v)}
          options={[
            { value: "whatsapp", label: "WhatsApp" },
            { value: "email", label: "Email" },
            { value: "appel", label: "Appel téléphonique" },
          ]}
        />
      </Field>
    </div>
  );
}

// ─── Step 4: Summary ─────────────────────────────────────────────────────────

function SummaryRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-4 py-2 border-b border-white/5 last:border-0">
      <span className="text-gray-500 text-sm">{label}</span>
      <span className="text-white text-sm font-medium text-right max-w-[60%]">{value}</span>
    </div>
  );
}

function StepSummary({
  service,
  state,
  loading,
}: {
  service: Service;
  state: OrderState;
  loading: boolean;
}) {
  const pkg = state.selectedPackage !== null ? service.packages[state.selectedPackage] : null;

  const detailRows = () => {
    if (service.slug === "voix-off") {
      const d = state.voixOff;
      return [
        { label: "Nombre de mots", value: d.wordCount },
        { label: "Type d'utilisation", value: d.usageType },
        { label: "Accent", value: d.accent },
        { label: "Ton", value: d.tone },
        { label: "Musique de fond", value: d.backgroundMusic },
        { label: "Script", value: d.script ? d.script.substring(0, 120) + (d.script.length > 120 ? "..." : "") : "" },
      ];
    }
    if (service.slug === "creation-video") {
      const d = state.video;
      return [
        { label: "Type de vidéo", value: d.videoType },
        { label: "Durée", value: d.duration },
        { label: "Formats", value: d.formats.join(", ") },
        { label: "Matériel existant", value: d.hasMedia },
        { label: "Voix off", value: d.needsVoiceover },
        { label: "Description", value: d.description ? d.description.substring(0, 120) + "..." : "" },
      ];
    }
    if (service.slug === "commande-produits") {
      const d = state.sourcing;
      return [
        { label: "Produit", value: d.productName },
        { label: "Quantité", value: d.quantity },
        { label: "Budget", value: d.budget },
        { label: "Urgence", value: d.urgency },
        { label: "Ville", value: d.city },
        { label: "Référence URL", value: d.referenceUrl },
      ];
    }
    return [];
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-white text-xl font-bold mb-2">Récapitulatif de votre commande</h3>
        <p className="text-gray-500 text-sm mb-6">Vérifiez les informations avant d&apos;envoyer.</p>
      </div>

      {pkg && (
        <div className="p-5 bg-green-900/20 border border-green-700/30 rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs mb-1">Forfait sélectionné</p>
              <p className="text-white font-bold text-lg">{service.title} — {pkg.name}</p>
              <p className="text-gray-500 text-xs mt-1 flex items-center gap-1">
                <Clock size={11} />
                Livraison : {pkg.deliveryTime}
              </p>
            </div>
            <p className="text-[#E8B800] font-bold text-2xl">{formatPrice(pkg.price)}</p>
          </div>
        </div>
      )}

      <div className="p-5 bg-white/[0.03] border border-white/10 rounded-2xl">
        <p className="text-gray-500 text-xs mb-3 uppercase tracking-wider">Détails du projet</p>
        {detailRows().map((r) => (
          <SummaryRow key={r.label} label={r.label} value={r.value} />
        ))}
      </div>

      <div className="p-5 bg-white/[0.03] border border-white/10 rounded-2xl">
        <p className="text-gray-500 text-xs mb-3 uppercase tracking-wider">Vos coordonnées</p>
        <SummaryRow label="Nom" value={state.contact.name} />
        <SummaryRow label="Email" value={state.contact.email} />
        <SummaryRow label="Téléphone" value={state.contact.phone} />
        <SummaryRow label="Contact préféré" value={state.contact.preferredContact} />
      </div>

      <p className="text-gray-600 text-xs text-center">
        En soumettant ce formulaire, vous acceptez d&apos;être contacté par notre équipe pour finaliser votre commande.
      </p>

      {loading && (
        <div className="flex items-center justify-center gap-3 text-green-400">
          <span className="w-5 h-5 border-2 border-green-400/30 border-t-green-400 rounded-full animate-spin" />
          <span className="text-sm">Envoi en cours...</span>
        </div>
      )}
    </div>
  );
}

// ─── Generic brief step (services dynamiques) ────────────────────────────────

function StepDetailsGeneric({
  label, data, onChange,
}: { label: string; data: GenericDetails; onChange: (d: GenericDetails) => void }) {
  return (
    <div className="space-y-5">
      <h3 className="text-white font-bold text-lg mb-6">Décrivez votre projet</h3>
      <Field label={label || "Brief de votre projet"} required>
        <textarea
          value={data.brief}
          onChange={(e) => onChange({ ...data, brief: e.target.value })}
          rows={7}
          className={inputCls + " resize-none"}
          placeholder="Décrivez en détail votre besoin : objectif, cible, style, références, contraintes, délais souhaités…"
        />
        <p className="text-gray-600 text-xs mt-1">{data.brief.length}/2000 caractères</p>
      </Field>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const STATIC_SLUGS = ["voix-off", "creation-video", "commande-produits"];

export default function ServiceOrderForm({ service }: { service: ServiceLike }) {
  const [step, setStep] = useState(0);
  const [state, setState] = useState<OrderState>(INITIAL);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [config, setConfig] = useState<ServiceOrderConfig | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    fetch("/api/admin/service-order-config", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: ServiceOrderConfig) => setConfig(d))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!submitted || !config?.redirectUrl || config.redirectDelay <= 0) return;
    setCountdown(config.redirectDelay);
    const id = setInterval(() => {
      setCountdown((c) => {
        if (c === null || c <= 1) {
          clearInterval(id);
          window.location.href = config.redirectUrl;
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [submitted, config]);

  function canProceed(): boolean {
    if (step === 0) return state.selectedPackage !== null;
    if (step === 1) {
      if (service.slug === "voix-off") {
        const d = state.voixOff;
        return !!(d.wordCount && d.accent && d.tone && d.script && d.usageType);
      }
      if (service.slug === "creation-video") {
        const d = state.video;
        return !!(d.videoType && d.duration && d.formats.length > 0 && d.description);
      }
      if (service.slug === "commande-produits") {
        const d = state.sourcing;
        return !!(d.productName && d.quantity && d.budget && d.urgency && d.city);
      }
      // Generic services dynamiques
      if (!STATIC_SLUGS.includes(service.slug)) {
        return state.generic.brief.trim().length >= 20;
      }
    }
    if (step === 2) {
      const c = state.contact;
      return !!(c.name && c.email && c.phone);
    }
    return true;
  }

  async function handleSubmit() {
    setLoading(true);
    setSubmitError("");
    const pkg = state.selectedPackage !== null ? service.packages[state.selectedPackage] : null;

    let details: Record<string, unknown>;
    if (service.slug === "voix-off") details = { type: "voix-off", ...state.voixOff };
    else if (service.slug === "creation-video") details = { type: "creation-video", ...state.video };
    else if (service.slug === "commande-produits") details = { type: "commande-produits", ...state.sourcing };
    else details = { type: "generic", brief: state.generic.brief };

    try {
      const res = await fetch("/api/service-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: service.id ?? service.slug,
          serviceSlug: service.slug,
          serviceTitle: service.title,
          packageName: pkg?.name ?? "",
          packagePrice: pkg?.price ?? 0,
          details,
          contact: state.contact,
        }),
      });
      const data = (await res.json()) as { success?: boolean; orderNumber?: string; error?: string };
      if (data.success && data.orderNumber) {
        setOrderNumber(data.orderNumber);
        setSubmitted(true);
      } else {
        setSubmitError(data.error || "Une erreur est survenue. Veuillez réessayer.");
      }
    } catch {
      setSubmitError("Erreur réseau. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    const prenom = state.contact.name.split(" ")[0];
    const confirmMsg = config?.confirmationMessage
      ?.replace(/\{prenom\}/g, prenom)
      ?.replace(/\{nom\}/g, state.contact.name)
      ?.replace(/\{numero_commande\}/g, orderNumber ?? "")
      ?.replace(/\{whatsapp\}/g, config?.whatsappNumber ?? "");

    return (
      <div className="p-8 bg-emerald-900/20 border border-emerald-700/30 rounded-2xl text-center">
        <div className="w-20 h-20 mx-auto rounded-full bg-emerald-900/40 border border-emerald-600/40 flex items-center justify-center mb-6">
          <CheckCircle size={40} className="text-emerald-400" />
        </div>
        <h3 className="text-white text-2xl font-bold mb-3">Commande envoyée !</h3>

        {orderNumber && (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl mb-5">
            <span className="text-gray-400 text-sm">N° de commande :</span>
            <span className="text-[#E8B800] font-bold font-mono">{orderNumber}</span>
          </div>
        )}

        <p className="text-gray-300 text-sm leading-relaxed max-w-md mx-auto whitespace-pre-wrap mb-6">
          {confirmMsg || `Merci ${prenom} ! Notre équipe vous contactera via ${state.contact.preferredContact} dans les 24h pour finaliser votre commande.`}
        </p>

        {config?.redirectUrl && (
          <div className="mb-6">
            <a
              href={config.redirectUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl transition-all"
            >
              <ExternalLink size={15} />
              Réserver mon créneau
              {countdown !== null && countdown > 0 && (
                <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs">{countdown}s</span>
              )}
            </a>
            {countdown !== null && countdown > 0 && (
              <p className="text-gray-600 text-xs mt-2">Redirection automatique dans {countdown}s…</p>
            )}
          </div>
        )}

        <button
          onClick={() => { setState(INITIAL); setStep(0); setSubmitted(false); setOrderNumber(null); setCountdown(null); }}
          className="px-6 py-3 border border-white/20 hover:bg-white/5 text-white rounded-xl text-sm transition-all"
        >
          Faire une nouvelle demande
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 bg-white/[0.03] border border-white/10 rounded-2xl">
      <StepIndicator current={step} />

      <div className="min-h-[400px]">
        {step === 0 && (
          <StepPackage
            service={service}
            state={state}
            onSelect={(i) => setState({ ...state, selectedPackage: i })}
          />
        )}

        {step === 1 && service.slug === "voix-off" && (
          <StepDetailsVoixOff
            data={state.voixOff}
            onChange={(d) => setState({ ...state, voixOff: d })}
          />
        )}
        {step === 1 && service.slug === "creation-video" && (
          <StepDetailsVideo
            data={state.video}
            onChange={(d) => setState({ ...state, video: d })}
          />
        )}
        {step === 1 && service.slug === "commande-produits" && (
          <StepDetailsSourcing
            data={state.sourcing}
            onChange={(d) => setState({ ...state, sourcing: d })}
          />
        )}
        {step === 1 && !STATIC_SLUGS.includes(service.slug) && (
          <StepDetailsGeneric
            label={service.briefLabel || "Brief de votre projet"}
            data={state.generic}
            onChange={(d) => setState({ ...state, generic: d })}
          />
        )}

        {step === 2 && (
          <StepContact
            data={state.contact}
            onChange={(d) => setState({ ...state, contact: d })}
          />
        )}

        {step === 3 && (
          <StepSummary service={service} state={state} loading={loading} />
        )}
      </div>

      {/* Navigation */}
      {submitError && (
        <p className="mt-4 text-red-400 text-sm text-center bg-red-900/20 border border-red-700/30 rounded-xl px-4 py-2">
          {submitError}
        </p>
      )}
      <div className={`flex gap-3 mt-4 ${step > 0 ? "justify-between" : "justify-end"}`}>
        {step > 0 && (
          <button
            onClick={() => setStep(step - 1)}
            className="flex items-center gap-2 px-6 py-3 border border-white/20 hover:bg-white/5 text-white rounded-xl transition-all"
          >
            <ArrowLeft size={16} />
            Retour
          </button>
        )}

        {step < 3 ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={!canProceed()}
            className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-[#E8B800] to-[#27A827] hover:from-[#27A827] hover:to-[#E8B800] text-black font-bold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Continuer <ArrowRight size={16} />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl transition-all disabled:opacity-60"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send size={16} />
            )}
            Envoyer ma commande
          </button>
        )}
      </div>
    </div>
  );
}
