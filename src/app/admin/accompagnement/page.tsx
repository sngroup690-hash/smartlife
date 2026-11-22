"use client";

import { useState, useRef, useEffect } from "react";
import {
  CheckCircle, XCircle, Clock, Users, Search,
  Eye, Lock, Plus, Pencil, Trash2, Save, X,
  ToggleLeft, ToggleRight, BookOpen, Play,
  Upload, FileCheck, AlertCircle, Loader2,
  ShoppingBag, Star, Tag, ChevronDown, ChevronUp,
  MapPin, Phone, Briefcase, Link2, Copy, ExternalLink,
  Monitor, Layers, Video,
} from "lucide-react";
import { useAccompagnementStore, DemandeAccompagnement, CandidatureConsultant } from "@/lib/accompagnement-store";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { VideoManagerPanel } from "@/components/admin/VideoManagerPanel";
import { QuizManagerPanel } from "@/components/admin/QuizManagerPanel";
import { UploadProgressBar } from "@/components/admin/UploadProgressBar";
import { uploadWithProgress } from "@/lib/upload-with-progress";
import {
  useCatalogueStore,
  type EbookAdmin,
  type FormationAdmin,
} from "@/lib/catalogue-store";
import { useUserStore, type StoredUser } from "@/lib/user-store";
import { ebooks as STATIC_EBOOKS, formatPrice, type Ebook, type Section } from "@/lib/data";
import { FORMATIONS as STATIC_FORMATIONS, type Formation } from "@/lib/formations-data";

type ClientInfo = {
  nom: string; email: string; telephone: string; ville: string;
  profession: string; capital: string; motivation: string;
};
type DemandePlusClient = DemandeAccompagnement & { clientInfo?: ClientInfo };

// ─── Constantes ───────────────────────────────────────────────────────────────

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? "";

const EBOOK_CATEGORIES = [
  "Développement Personnel, Compétences & Spiritualité",
  "Santé, Bien-être & Soins Corporels",
  "Élevage & Dresseurs",
  "Agriculture & Cultures Rentables",
  "Création d'Entreprises & Commerce Réel",
  "Fabrication Artisanale & Transformation",
  "Business Numérique, IA & Tech",
  "Gestion, Droit & Finance",
];

const FORMATION_CATEGORIES = [
  "Publicité & Traffic",
  "Contenu, Vidéo & IA",
  "Télévente & Commercialisation",
  "Marketing Digital & Stratégie",
];

// ─── Styles partagés ──────────────────────────────────────────────────────────

const inputCls =
  "w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[#E8B800] transition-colors text-sm";
const selectCls =
  "w-full px-4 py-3 bg-[#0e0e1a] border border-white/20 rounded-xl text-white focus:outline-none focus:border-[#E8B800] transition-colors text-sm";
const labelCls = "block text-gray-400 text-sm mb-2";

// ─── Types formulaires ────────────────────────────────────────────────────────

type EbookForm = {
  title: string; description: string; category: string;
  price: string; originalPrice: string; pages: string;
  rating: string; reviews: string; bestseller: boolean; new: boolean;
  sections: Section[];
};
const EBOOK_VIDE: EbookForm = {
  title: "", description: "", category: "", price: "", originalPrice: "",
  pages: "80", rating: "4.5", reviews: "0", bestseller: false, new: false,
  sections: [],
};

type FormationForm = {
  titre: string; description: string; categorie: string;
  instructeur: string; duree: string; modules: string;
  prix: string; prixOriginal: string;
  niveau: "Débutant" | "Intermédiaire" | "Avancé";
  note: string; apprenants: string; badge: string;
  mode: "online" | "presentiel" | "both";
  cover?: string;
  sections: Section[];
};
const FORMATION_VIDE: FormationForm = {
  titre: "", description: "", categorie: "", instructeur: "SMART LIFE",
  duree: "6h", modules: "5", prix: "", prixOriginal: "",
  niveau: "Débutant", note: "4.5", apprenants: "0", badge: "",
  mode: "online", cover: "",
  sections: [],
};

// ─── Éditeur de description enrichie ─────────────────────────────────────────

function DescriptionEditor({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <RichTextEditor
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      adminPassword={ADMIN_PASSWORD}
      minHeight={160}
    />
  );
}

// ─── Éditeur de sections/onglets ──────────────────────────────────────────────

function SectionsEditor({
  sections,
  onChange,
}: {
  sections: Section[];
  onChange: (s: Section[]) => void;
}) {
  function add() { onChange([...sections, { titre: "", contenu: "" }]); }
  function remove(i: number) { onChange(sections.filter((_, idx) => idx !== i)); }
  function update(i: number, field: keyof Section, val: string) {
    const next = [...sections];
    next[i] = { ...next[i], [field]: val };
    onChange(next);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className={labelCls}>Onglets / Sections supplémentaires <span className="text-gray-600 text-xs">(optionnel)</span></label>
        <button type="button" onClick={add}
          className="flex items-center gap-1.5 text-[#E8B800] text-xs hover:text-[#27A827] transition-colors">
          <Plus size={13} /> Ajouter un onglet
        </button>
      </div>
      {sections.length === 0 ? (
        <p className="text-gray-700 text-xs py-2">Aucun onglet. Ajoutez des sections pour enrichir la page de détail (ex : &quot;Ce que vous apprendrez&quot;, &quot;À qui s&apos;adresse&quot;, &quot;Table des matières&quot;).</p>
      ) : (
        <div className="space-y-4">
          {sections.map((s, i) => (
            <div key={i} className="p-4 bg-white/[0.02] border border-white/10 rounded-xl space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={s.titre}
                  onChange={(e) => update(i, "titre", e.target.value)}
                  className={inputCls}
                  placeholder={`Titre de l'onglet (ex: Ce que vous apprendrez)`}
                />
                <button type="button" onClick={() => remove(i)}
                  className="p-2 text-gray-600 hover:text-red-400 rounded-lg transition-colors flex-shrink-0">
                  <X size={14} />
                </button>
              </div>
              <DescriptionEditor
                value={s.contenu}
                onChange={(v) => update(i, "contenu", v)}
                placeholder="Contenu de cet onglet..."
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Bouton copier lien ───────────────────────────────────────────────────────

function CopyLinkButton({ path, label }: { path: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const fullUrl = typeof window !== "undefined"
    ? `${window.location.origin}${path}`
    : `https://smartlifecm.com${path}`;

  function copy() {
    navigator.clipboard.writeText(fullUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="flex items-center gap-1">
      <a
        href={path}
        target="_blank"
        rel="noopener noreferrer"
        title={`Voir : ${fullUrl}`}
        className="flex items-center gap-1 px-2 py-1 bg-white/5 border border-white/10 hover:border-[#E8B800]/40 hover:bg-[#E8B800]/5 text-gray-500 hover:text-[#E8B800] rounded-lg text-[10px] font-mono transition-all max-w-[160px] truncate"
      >
        <ExternalLink size={10} className="flex-shrink-0" />
        <span className="truncate">{label}</span>
      </a>
      <button
        onClick={copy}
        title="Copier le lien"
        className={`p-1.5 rounded-lg border transition-all flex-shrink-0 ${copied ? "bg-emerald-900/30 border-emerald-700/40 text-emerald-400" : "bg-white/5 border-white/10 hover:border-[#E8B800]/40 text-gray-500 hover:text-[#E8B800]"}`}
      >
        {copied ? <CheckCircle size={11} /> : <Copy size={11} />}
      </button>
    </div>
  );
}

// ─── Badge statut candidature ─────────────────────────────────────────────────

function StatutBadge({ statut }: { statut: string }) {
  if (statut === "validee")
    return (
      <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-900/30 border border-emerald-700/40 text-emerald-400 text-xs font-bold rounded-full">
        <CheckCircle size={11} /> Validée
      </span>
    );
  if (statut === "rejetee")
    return (
      <span className="flex items-center gap-1.5 px-3 py-1 bg-red-900/30 border border-red-700/40 text-red-400 text-xs font-bold rounded-full">
        <XCircle size={11} /> Rejetée
      </span>
    );
  return (
    <span className="flex items-center gap-1.5 px-3 py-1 bg-yellow-900/30 border border-yellow-700/40 text-yellow-400 text-xs font-bold rounded-full">
      <Clock size={11} /> En attente
    </span>
  );
}

// ─── Modal candidature ────────────────────────────────────────────────────────

function DemandeModal({
  demande, onClose, onValider, onRejeter,
}: {
  demande: DemandePlusClient;
  onClose: () => void;
  onValider: (id: string, note: string) => void;
  onRejeter: (id: string, note: string) => void;
}) {
  const store = useAccompagnementStore();
  const storedClient = store.getClientById(demande.clientId);
  const ci = demande.clientInfo;
  const client = ci
    ? { id: demande.clientId, nom: ci.nom, email: ci.email, telephone: ci.telephone, ville: ci.ville, profession: ci.profession, capital: ci.capital, motivation: ci.motivation, createdAt: demande.createdAt }
    : storedClient;
  const [note, setNote] = useState(demande.noteAdmin || "");
  const [loading, setLoading] = useState(false);

  async function action(type: "valider" | "rejeter") {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    if (type === "valider") onValider(demande.id, note);
    else onRejeter(demande.id, note);
    setLoading(false);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-[#12121f] border border-white/10 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-white font-bold text-xl">{demande.espaceTitre}</h2>
            <p className="text-gray-500 text-xs mt-1">
              {new Date(demande.createdAt).toLocaleDateString("fr-FR", {
                day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
              })}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-600 hover:text-white text-2xl leading-none">×</button>
        </div>
        <div className="p-6 space-y-5">
          {client && (
            <div className="p-5 bg-white/[0.03] border border-white/10 rounded-xl">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Users size={16} className="text-[#E8B800]" /> Informations du candidat
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ["Nom complet", client.nom],
                  ["Email", client.email],
                  ["Téléphone", client.telephone],
                  ["Ville", client.ville],
                  ["Profession", client.profession || "—"],
                  ["Capital disponible", client.capital || "—"],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-gray-600 text-xs">{label}</p>
                    <p className="text-white font-medium">{value}</p>
                  </div>
                ))}
              </div>
              {client.motivation && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-gray-600 text-xs mb-1">Motivation :</p>
                  <p className="text-gray-400 text-sm leading-relaxed">{client.motivation}</p>
                </div>
              )}
            </div>
          )}
          <div className="p-4 bg-white/[0.03] rounded-xl">
            <p className="text-gray-500 text-xs mb-2">Message de candidature</p>
            <p className="text-gray-300 text-sm leading-relaxed">{demande.message}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-gray-500 text-sm">Statut :</span>
            <StatutBadge statut={demande.statut} />
          </div>
          <div>
            <label className={labelCls}>Note pour le candidat</label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className={`${inputCls} resize-none`}
              placeholder="Message qui sera communiqué au candidat..."
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => action("valider")}
              disabled={loading || demande.statut === "validee"}
              className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle size={16} />}
              Valider
            </button>
            <button
              onClick={() => action("rejeter")}
              disabled={loading || demande.statut === "rejetee"}
              className="flex-1 py-3 bg-red-700 hover:bg-red-600 text-white font-bold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <XCircle size={16} />}
              Rejeter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Formulaire Ebook ─────────────────────────────────────────────────────────

function FormulaireEbook({
  initial, onSave, onCancel, titreForm,
}: {
  initial: EbookForm;
  onSave: (d: EbookForm) => void;
  onCancel: () => void;
  titreForm: string;
}) {
  const [form, setForm] = useState<EbookForm>(initial);
  const set = <K extends keyof EbookForm>(k: K, v: EbookForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));
  const valide = form.title.trim() && form.description.trim() && form.category && form.price;

  return (
    <div className="p-6 bg-white/[0.03] border border-[#E8B800]/20 rounded-2xl space-y-5">
      <h3 className="text-white font-bold text-lg">{titreForm}</h3>

      <div>
        <label className={labelCls}>Titre <span className="text-[#E8B800]">*</span></label>
        <input type="text" value={form.title} onChange={(e) => set("title", e.target.value)}
          className={inputCls} placeholder="Guide pratique : ..." autoFocus />
      </div>

      <div>
        <label className={labelCls}>Description <span className="text-[#E8B800]">*</span></label>
        <DescriptionEditor value={form.description} onChange={(v) => set("description", v)} placeholder="Description complète de l'ebook..." />
      </div>

      <div>
        <label className={labelCls}>Catégorie <span className="text-[#E8B800]">*</span></label>
        <select value={form.category} onChange={(e) => set("category", e.target.value)} className={selectCls}>
          <option value="" className="bg-[#0e0e1a]">Choisir une catégorie...</option>
          {EBOOK_CATEGORIES.map((c) => (
            <option key={c} value={c} className="bg-[#0e0e1a]">{c}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Prix (FCFA) <span className="text-[#E8B800]">*</span></label>
          <input type="number" min="0" value={form.price} onChange={(e) => set("price", e.target.value)}
            className={inputCls} placeholder="3500" />
        </div>
        <div>
          <label className={labelCls}>Prix original <span className="text-gray-600 text-xs">optionnel</span></label>
          <input type="number" min="0" value={form.originalPrice} onChange={(e) => set("originalPrice", e.target.value)}
            className={inputCls} placeholder="5000" />
        </div>
        <div>
          <label className={labelCls}>Nombre de pages</label>
          <input type="number" min="1" value={form.pages} onChange={(e) => set("pages", e.target.value)}
            className={inputCls} placeholder="80" />
        </div>
        <div>
          <label className={labelCls}>Note (1 à 5)</label>
          <input type="number" min="1" max="5" step="0.1" value={form.rating}
            onChange={(e) => set("rating", e.target.value)} className={inputCls} placeholder="4.5" />
        </div>
        <div>
          <label className={labelCls}>Nombre d&apos;avis</label>
          <input type="number" min="0" value={form.reviews} onChange={(e) => set("reviews", e.target.value)}
            className={inputCls} placeholder="0" />
        </div>
      </div>

      <div className="flex gap-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.bestseller} onChange={(e) => set("bestseller", e.target.checked)}
            className="w-4 h-4 accent-[#E8B800]" />
          <span className="text-gray-300 text-sm">Badge Bestseller</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.new} onChange={(e) => set("new", e.target.checked)}
            className="w-4 h-4 accent-[#E8B800]" />
          <span className="text-gray-300 text-sm">Badge Nouveau</span>
        </label>
      </div>

      <SectionsEditor sections={form.sections} onChange={(s) => set("sections", s)} />

      <div className="flex gap-3 pt-2">
        <button onClick={() => valide && onSave(form)} disabled={!valide}
          className="flex items-center gap-2 px-6 py-3 bg-[#E8B800] hover:bg-[#27A827] text-black font-bold rounded-xl text-sm disabled:opacity-40">
          <Save size={15} /> Enregistrer
        </button>
        <button onClick={onCancel}
          className="flex items-center gap-2 px-6 py-3 border border-white/20 text-gray-400 rounded-xl text-sm hover:bg-white/5">
          <X size={15} /> Annuler
        </button>
      </div>
    </div>
  );
}

// ─── Formulaire Formation ─────────────────────────────────────────────────────

function FormulaireFormation({
  initial, onSave, onCancel, titreForm, formationId,
}: {
  initial: FormationForm;
  onSave: (d: FormationForm) => void;
  onCancel: () => void;
  titreForm: string;
  formationId?: string;
}) {
  const [form, setForm] = useState<FormationForm>(initial);
  const entityIdRef = useRef(formationId ? `form-${formationId}` : `form-temp-${Date.now()}`);
  const set = <K extends keyof FormationForm>(k: K, v: FormationForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));
  const valide = form.titre.trim() && form.description.trim() && form.categorie && form.prix;

  return (
    <div className="p-6 bg-white/[0.03] border border-[#E8B800]/20 rounded-2xl space-y-5">
      <h3 className="text-white font-bold text-lg">{titreForm}</h3>

      <div>
        <label className={labelCls}>Titre <span className="text-[#E8B800]">*</span></label>
        <input type="text" value={form.titre} onChange={(e) => set("titre", e.target.value)}
          className={inputCls} placeholder="Nom de la formation..." autoFocus />
      </div>

      <div>
        <label className={labelCls}>Description <span className="text-[#E8B800]">*</span></label>
        <DescriptionEditor value={form.description} onChange={(v) => set("description", v)} placeholder="Description complète de la formation..." />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Catégorie <span className="text-[#E8B800]">*</span></label>
          <select value={form.categorie} onChange={(e) => set("categorie", e.target.value)} className={selectCls}>
            <option value="" className="bg-[#0e0e1a]">Choisir...</option>
            {FORMATION_CATEGORIES.map((c) => (
              <option key={c} value={c} className="bg-[#0e0e1a]">{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Niveau</label>
          <select value={form.niveau} onChange={(e) => set("niveau", e.target.value as FormationForm["niveau"])} className={selectCls}>
            {(["Débutant", "Intermédiaire", "Avancé"] as const).map((n) => (
              <option key={n} value={n} className="bg-[#0e0e1a]">{n}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Instructeur</label>
          <input type="text" value={form.instructeur} onChange={(e) => set("instructeur", e.target.value)}
            className={inputCls} placeholder="SMART LIFE" />
        </div>
        <div>
          <label className={labelCls}>Durée (ex: 8h)</label>
          <input type="text" value={form.duree} onChange={(e) => set("duree", e.target.value)}
            className={inputCls} placeholder="8h" />
        </div>
        <div>
          <label className={labelCls}>Prix (FCFA) <span className="text-[#E8B800]">*</span></label>
          <input type="number" min="0" value={form.prix} onChange={(e) => set("prix", e.target.value)}
            className={inputCls} placeholder="25000" />
        </div>
        <div>
          <label className={labelCls}>Prix original <span className="text-gray-600 text-xs">optionnel</span></label>
          <input type="number" min="0" value={form.prixOriginal} onChange={(e) => set("prixOriginal", e.target.value)}
            className={inputCls} placeholder="40000" />
        </div>
        <div>
          <label className={labelCls}>Nombre de modules</label>
          <input type="number" min="1" value={form.modules} onChange={(e) => set("modules", e.target.value)}
            className={inputCls} placeholder="5" />
        </div>
        <div>
          <label className={labelCls}>Note (1 à 5)</label>
          <input type="number" min="1" max="5" step="0.1" value={form.note}
            onChange={(e) => set("note", e.target.value)} className={inputCls} placeholder="4.5" />
        </div>
        <div>
          <label className={labelCls}>Nombre d&apos;apprenants</label>
          <input type="number" min="0" value={form.apprenants} onChange={(e) => set("apprenants", e.target.value)}
            className={inputCls} placeholder="0" />
        </div>
        <div>
          <label className={labelCls}>Badge</label>
          <select value={form.badge} onChange={(e) => set("badge", e.target.value)} className={selectCls}>
            <option value="" className="bg-[#0e0e1a]">Aucun</option>
            {["Bestseller", "Nouveau", "Premium"].map((b) => (
              <option key={b} value={b} className="bg-[#0e0e1a]">{b}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Mode de formation</label>
          <select value={form.mode} onChange={(e) => set("mode", e.target.value as FormationForm["mode"])} className={selectCls}>
            <option value="online" className="bg-[#0e0e1a]">En ligne uniquement</option>
            <option value="presentiel" className="bg-[#0e0e1a]">Présentiel uniquement</option>
            <option value="both" className="bg-[#0e0e1a]">En ligne + Présentiel</option>
          </select>
        </div>
      </div>

      <div>
        <label className={labelCls}>Image de couverture <span className="text-gray-600 text-xs">(miniature visible sur la page formation)</span></label>
        <div className="flex items-center gap-3">
          <CoverUploadButton
            entityId={entityIdRef.current}
            currentCover={form.cover}
            onSuccess={(url) => set("cover", url)}
          />
          {form.cover && (
            <button type="button" onClick={() => set("cover", "")} className="text-xs text-gray-500 hover:text-red-400 transition-colors">
              Supprimer l&apos;image
            </button>
          )}
        </div>
      </div>

      <SectionsEditor sections={form.sections} onChange={(s) => set("sections", s)} />

      <div className="flex gap-3 pt-2">
        <button onClick={() => valide && onSave(form)} disabled={!valide}
          className="flex items-center gap-2 px-6 py-3 bg-[#E8B800] hover:bg-[#27A827] text-black font-bold rounded-xl text-sm disabled:opacity-40">
          <Save size={15} /> Enregistrer
        </button>
        <button onClick={onCancel}
          className="flex items-center gap-2 px-6 py-3 border border-white/20 text-gray-400 rounded-xl text-sm hover:bg-white/5">
          <X size={15} /> Annuler
        </button>
      </div>
    </div>
  );
}

// ─── Bouton upload PDF ────────────────────────────────────────────────────────

function PdfUploadButton({ ebookId }: { ebookId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [msg, setMsg] = useState("");
  const [progress, setProgress] = useState(0);

  async function handleFile(file: File) {
    if (!file) return;
    if (file.type !== "application/pdf") {
      setStatus("error");
      setMsg("Le fichier doit être un PDF");
      return;
    }
    setStatus("loading");
    setProgress(0);
    setMsg("");
    try {
      const fd = new FormData();
      fd.append("ebookId", ebookId);
      fd.append("file", file);
      const res = await uploadWithProgress("/api/admin/upload", fd, { "x-admin-password": ADMIN_PASSWORD }, setProgress);
      const json = await res.data() as { success?: boolean; error?: string };
      if (json.success) {
        setStatus("ok");
        setMsg("PDF uploadé");
      } else {
        setStatus("error");
        setMsg(json.error || "Erreur upload");
      }
    } catch {
      setStatus("error");
      setMsg("Erreur réseau");
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2 flex-wrap">
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
        />
        <button
          onClick={() => inputRef.current?.click()}
          disabled={status === "loading"}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/15 hover:border-[#E8B800]/50 hover:bg-[#E8B800]/5 text-gray-400 hover:text-[#E8B800] rounded-lg text-xs font-medium transition-all disabled:opacity-50"
        >
          {status === "loading" ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
          {status === "loading" ? `PDF ${progress}%` : "PDF"}
        </button>
        {status === "ok" && <span className="flex items-center gap-1 text-emerald-400 text-xs"><FileCheck size={12} /> {msg}</span>}
        {status === "error" && <span className="flex items-center gap-1 text-red-400 text-xs"><AlertCircle size={12} /> {msg}</span>}
      </div>
      {status === "loading" && <UploadProgressBar percent={progress} label="Envoi du PDF…" />}
    </div>
  );
}

// ─── Bouton upload image de couverture ───────────────────────────────────────

function CoverUploadButton({
  entityId,
  currentCover,
  onSuccess,
}: {
  entityId: string;
  currentCover?: string;
  onSuccess: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [msg, setMsg] = useState("");
  const [preview, setPreview] = useState(currentCover || "");
  const [progress, setProgress] = useState(0);

  async function handleFile(file: File) {
    if (!file) return;
    setStatus("loading");
    setProgress(0);
    setMsg("");
    try {
      const fd = new FormData();
      fd.append("ebookId", entityId);
      fd.append("file", file);
      const res = await uploadWithProgress("/api/admin/upload-cover", fd, { "x-admin-password": ADMIN_PASSWORD }, setProgress);
      const json = await res.data() as { success?: boolean; url?: string; error?: string };
      if (json.success) {
        setStatus("ok");
        setPreview(json.url + "?t=" + Date.now());
        onSuccess(json.url!);
      } else {
        setStatus("error");
        setMsg(json.error || "Erreur upload");
      }
    } catch {
      setStatus("error");
      setMsg("Erreur réseau");
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
        />
        {preview ? (
          <button
            onClick={() => inputRef.current?.click()}
            disabled={status === "loading"}
            title="Changer l'image de couverture"
            className="relative w-10 h-10 rounded-lg overflow-hidden border border-white/20 hover:border-[#E8B800]/50 transition-all group flex-shrink-0"
          >
            <img src={preview} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              {status === "loading"
                ? <Loader2 size={12} className="text-white animate-spin" />
                : <Upload size={12} className="text-white" />}
            </div>
          </button>
        ) : (
          <button
            onClick={() => inputRef.current?.click()}
            disabled={status === "loading"}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/15 hover:border-[#E8B800]/50 hover:bg-[#E8B800]/5 text-gray-400 hover:text-[#E8B800] rounded-lg text-xs font-medium transition-all disabled:opacity-50"
          >
            {status === "loading" ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
            {status === "loading" ? `Image ${progress}%` : "Image"}
          </button>
        )}
        {status === "error" && (
          <span className="flex items-center gap-1 text-red-400 text-xs">
            <AlertCircle size={12} /> {msg}
          </span>
        )}
      </div>
      {status === "loading" && <UploadProgressBar percent={progress} label="Envoi de l'image…" />}
    </div>
  );
}

// ─── Ligne ebook unifiée ──────────────────────────────────────────────────────

type EbookRow = {
  id: string;
  slug: string;
  title: string;
  category: string;
  price: number;
  originalPrice?: number;
  pages: number;
  rating: number;
  reviews: number;
  bestseller?: boolean;
  new?: boolean;
  actif: boolean;
  source: "statique" | "admin";
};

// ─── Ligne formation unifiée ──────────────────────────────────────────────────

type FormationRow = {
  id: string;
  titre: string;
  categorie: string;
  description: string;
  instructeur: string;
  duree: string;
  modules: number;
  prix: number;
  prixOriginal?: number;
  niveau: "Débutant" | "Intermédiaire" | "Avancé";
  note: number;
  apprenants: number;
  badge?: string;
  mode: "online" | "presentiel" | "both";
  actif: boolean;
  source: "statique" | "admin";
};

// ─── Page principale ──────────────────────────────────────────────────────────

type Onglet = "candidatures" | "candidatures_consultant" | "ebooks" | "formations" | "acheteurs" | "admins";
type AdminType = {
  id: string;
  username: string;
  nom: string;
  role: "super_admin" | "admin_manager";
  actif: boolean;
  createdAt: string;
};

export default function AdminAccompagnementPage() {
  const store = useAccompagnementStore();
  const catalogue = useCatalogueStore();
  const userStore = useUserStore();

  const [authed, setAuthed] = useState(false);
  const [pwd, setPwd] = useState("");
  const [pwdError, setPwdError] = useState(false);
  const [onglet, setOnglet] = useState<Onglet>("candidatures");
  const [adminRole, setAdminRole] = useState<"super_admin" | "admin_manager">("super_admin");
  const [loginMode, setLoginMode] = useState<"master" | "subadmin">("master");
  const [loginUsername, setLoginUsername] = useState("");
  // Gestion des sous-admins
  const [adminList, setAdminList] = useState<AdminType[]>([]);
  const [adminListLoading, setAdminListLoading] = useState(false);
  const [showAdminCreateForm, setShowAdminCreateForm] = useState(false);
  const [adminCreateForm, setAdminCreateForm] = useState({ username: "", password: "", nom: "", role: "admin_manager" as "super_admin" | "admin_manager" });
  const [adminCreateError, setAdminCreateError] = useState("");
  const [confirmDeleteAdmin, setConfirmDeleteAdmin] = useState<string | null>(null);

  // Candidatures accompagnement
  const [filtre, setFiltre] = useState<"toutes" | "en_attente" | "validee" | "rejetee">("toutes");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<DemandePlusClient | null>(null);
  const [serverDemandes, setServerDemandes] = useState<DemandePlusClient[] | null>(null);

  // Candidatures consultants
  const [filtreConsultant, setFiltreConsultant] = useState<"toutes" | "en_attente" | "validee" | "rejetee">("toutes");
  const [searchConsultant, setSearchConsultant] = useState("");
  const [selectedConsultant, setSelectedConsultant] = useState<CandidatureConsultant | null>(null);
  const [noteConsultantModal, setNoteConsultantModal] = useState("");
  const [selectedCCIds, setSelectedCCIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  // Ebooks
  const [showEbookForm, setShowEbookForm] = useState(false);
  const [editEbookId, setEditEbookId] = useState<string | null>(null);
  const [confirmDeleteEbook, setConfirmDeleteEbook] = useState<string | null>(null);
  const [ebookSearch, setEbookSearch] = useState("");

  // Formations
  const [showFormationForm, setShowFormationForm] = useState(false);
  const [editFormationId, setEditFormationId] = useState<string | null>(null);
  const [confirmDeleteFormation, setConfirmDeleteFormation] = useState<string | null>(null);
  const [formationSearch, setFormationSearch] = useState("");
  const [expandedVideoPanel, setExpandedVideoPanel] = useState<string | null>(null);
  const [expandedQuizPanel, setExpandedQuizPanel] = useState<string | null>(null);

  // Toast lien après save
  const [savedLink, setSavedLink] = useState<string | null>(null);

  // Acheteurs
  const [acheteurSearch, setAcheteurSearch] = useState("");
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  // Données server-side
  const [serverUsers, setServerUsers] = useState<StoredUser[] | null>(null);
  const [serverCC, setServerCC] = useState<CandidatureConsultant[] | null>(null);
  const [adminEspaces, setAdminEspaces] = useState<{ id: string; titre: string }[]>([]);

  useEffect(() => {
    if (!authed) return;
    // Charger depuis le serveur pour hydrater le store (évite d'écraser les données avec un localStorage vide)
    fetch("/api/ebooks")
      .then((r) => r.json())
      .then((d) => {
        if (d.ebooks?.length > 0) useCatalogueStore.getState().setEbooks(d.ebooks);
        if (d.overrides) useCatalogueStore.setState({ ebookOverrides: d.overrides });
        if (d.actif) useCatalogueStore.setState({ staticEbookActif: d.actif });
      })
      .catch(() => {});
    fetch("/api/formations")
      .then((r) => r.json())
      .then((d) => {
        if (d.formations?.length > 0) useCatalogueStore.getState().setFormations(d.formations);
        if (d.overrides) useCatalogueStore.setState({ formationOverrides: d.overrides });
        if (d.actif) useCatalogueStore.setState({ staticFormationActif: d.actif });
      })
      .catch(() => {});
    fetch(`/api/admin/users`, { headers: { "x-admin-password": ADMIN_PASSWORD } })
      .then((r) => r.json())
      .then((data) => setServerUsers(data.users ?? null))
      .catch(() => {});
    fetch(`/api/candidatures?password=${ADMIN_PASSWORD}`)
      .then((r) => r.json())
      .then((data) => {
        const list: CandidatureConsultant[] = data.candidatures ?? [];
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setServerCC(list);
      })
      .catch(() => {});
    fetch("/api/espaces")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.espaces) && d.espaces.length > 0) {
          setAdminEspaces(d.espaces.map((e: { id: string; titre: string }) => ({ id: e.id, titre: e.titre })));
          useAccompagnementStore.getState().setEspaces(d.espaces);
        }
      })
      .catch(() => {});
    fetch(`/api/demandes?password=${ADMIN_PASSWORD}`)
      .then((r) => r.json())
      .then((data) => {
        if (!Array.isArray(data.demandes)) return;
        const parsed: DemandePlusClient[] = data.demandes.map((d: Record<string, unknown>) => ({
          id: d.id as string,
          clientId: d.id as string,
          espaceId: d.espaceId as string,
          espaceSlug: (d.espaceSlug ?? d.espaceId) as string,
          espaceTitre: d.espaceTitre as string,
          message: d.message as string,
          statut: d.statut as "en_attente" | "validee" | "rejetee",
          noteAdmin: (d.noteAdmin ?? "") as string,
          createdAt: d.createdAt as string,
          updatedAt: d.updatedAt as string,
          clientInfo: d.client as ClientInfo | undefined,
        })).sort((a: DemandePlusClient, b: DemandePlusClient) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setServerDemandes(parsed);
      })
      .catch(() => {});
  }, [authed]);

  // Vider la sélection quand le filtre ou la recherche change
  useEffect(() => { setSelectedCCIds(new Set()); }, [filtreConsultant, searchConsultant]);

  // Recharger les espaces à chaque ouverture du modal consultant
  useEffect(() => {
    if (!selectedConsultant) return;
    fetch("/api/espaces")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.espaces) && d.espaces.length > 0) {
          setAdminEspaces(d.espaces.map((e: { id: string; titre: string }) => ({ id: e.id, titre: e.titre })));
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConsultant?.id]);

  async function mettreAJourDemande(id: string, statut: "validee" | "rejetee", noteAdmin: string) {
    await fetch(`/api/demandes?id=${id}&password=${ADMIN_PASSWORD}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statut, noteAdmin }),
    });
    setServerDemandes((prev) =>
      prev?.map((d) =>
        d.id === id ? { ...d, statut, noteAdmin, updatedAt: new Date().toISOString() } : d
      ) ?? null
    );
    // also update local store if it's a local demande
    if (statut === "validee") store.validerDemande(id, noteAdmin);
    else store.rejeterDemande(id, noteAdmin);
  }

  function refreshCC() {
    setServerCC(null);
    fetch(`/api/candidatures?password=${ADMIN_PASSWORD}`)
      .then((r) => r.json())
      .then((data) => {
        const list: CandidatureConsultant[] = data.candidatures ?? [];
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setServerCC(list);
      })
      .catch(() => { setServerCC([]); });
  }

  async function mettreAJourCC(id: string, statut: "validee" | "rejetee", noteAdmin: string) {
    await fetch(`/api/candidatures?id=${id}&password=${ADMIN_PASSWORD}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statut, noteAdmin }),
    });
    setServerCC((prev) =>
      prev?.map((c) =>
        c.id === id ? { ...c, statut, noteAdmin, updatedAt: new Date().toISOString() } : c
      ) ?? null
    );
  }

  async function marquerLuCC(id: string) {
    await fetch(`/api/candidatures?id=${id}&password=${ADMIN_PASSWORD}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lu: true }),
    });
    setServerCC((prev) =>
      prev?.map((c) => (c.id === id ? { ...c, lu: true } : c)) ?? null
    );
  }

  function toggleSelectCC(id: string) {
    setSelectedCCIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function bulkActionCC(action: "validee" | "rejetee" | "lu") {
    const ids = Array.from(selectedCCIds);
    setBulkLoading(true);
    for (const id of ids) {
      if (action === "lu") {
        await marquerLuCC(id);
      } else {
        await mettreAJourCC(id, action,
          action === "validee"
            ? "Félicitations ! Votre profil a été validé. Bienvenue dans le réseau SMART LIFE."
            : "Votre profil ne correspond pas aux critères actuels. Merci de votre intérêt."
        );
      }
    }
    setSelectedCCIds(new Set());
    setBulkLoading(false);
  }

  // ── Login ──
  async function login(e: React.FormEvent) {
    e.preventDefault();
    if (loginMode === "master") {
      if (pwd === ADMIN_PASSWORD) {
        setAuthed(true);
        setAdminRole("super_admin");
        setPwdError(false);
      } else {
        setPwdError(true);
      }
    } else {
      try {
        const res = await fetch("/api/admin/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: loginUsername, password: pwd }),
        });
        const data = await res.json();
        if (data.success) {
          setAuthed(true);
          setAdminRole(data.role);
          setPwdError(false);
        } else {
          setPwdError(true);
        }
      } catch {
        setPwdError(true);
      }
    }
  }

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-[#E8B800]/10 border border-[#E8B800]/30 flex items-center justify-center text-3xl mb-4">🔐</div>
            <h1 className="text-2xl font-bold text-white mb-1">Administration</h1>
            <p className="text-gray-500 text-sm">Accès réservé aux administrateurs</p>
          </div>
          <div className="p-8 bg-white/[0.03] border border-white/10 rounded-2xl">
            <div className="flex gap-2 mb-5">
              <button type="button" onClick={() => { setLoginMode("master"); setPwdError(false); }}
                className={`flex-1 py-2 text-sm rounded-lg font-medium transition-colors ${loginMode === "master" ? "bg-[#E8B800] text-black" : "bg-white/5 text-gray-400 hover:bg-white/10"}`}>
                Admin Principal
              </button>
              <button type="button" onClick={() => { setLoginMode("subadmin"); setPwdError(false); }}
                className={`flex-1 py-2 text-sm rounded-lg font-medium transition-colors ${loginMode === "subadmin" ? "bg-[#E8B800] text-black" : "bg-white/5 text-gray-400 hover:bg-white/10"}`}>
                Sous-Admin
              </button>
            </div>
            <form onSubmit={login} className="space-y-4">
              {loginMode === "subadmin" && (
                <div>
                  <label className={labelCls}>Identifiant</label>
                  <input type="text" value={loginUsername} onChange={(e) => { setLoginUsername(e.target.value); setPwdError(false); }}
                    className={inputCls} placeholder="nom_utilisateur" autoFocus />
                </div>
              )}
              <div>
                <label className={labelCls}><Lock size={14} className="inline mr-1" />Mot de passe</label>
                <input type="password" value={pwd} onChange={(e) => { setPwd(e.target.value); setPwdError(false); }}
                  className={inputCls} placeholder="••••••••" autoFocus={loginMode === "master"} />
                {pwdError && <p className="text-red-400 text-xs mt-2">Identifiants incorrects.</p>}
              </div>
              <button type="submit" className="w-full py-3 bg-[#E8B800] hover:bg-[#27A827] text-black font-bold rounded-xl">
                Accéder au panel
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ── Données candidatures ──
  const toutes: DemandePlusClient[] = serverDemandes ?? store.getAllDemandes();
  const serverClientsList = serverDemandes?.map((d) => ({
    id: d.id,
    nom: d.clientInfo?.nom ?? "—",
    email: d.clientInfo?.email ?? "—",
    telephone: d.clientInfo?.telephone ?? "—",
    ville: d.clientInfo?.ville ?? "—",
    profession: d.clientInfo?.profession ?? "",
    capital: d.clientInfo?.capital ?? "",
    motivation: d.clientInfo?.motivation ?? "",
    createdAt: d.createdAt,
  })) ?? null;
  const clients = serverClientsList ?? store.clients;
  const stats = {
    total: toutes.length,
    en_attente: toutes.filter((d) => d.statut === "en_attente").length,
    validees: toutes.filter((d) => d.statut === "validee").length,
    rejetees: toutes.filter((d) => d.statut === "rejetee").length,
    clients: clients.length,
  };
  const candidaturesFiltrees = toutes.filter((d) => {
    const matchStatut = filtre === "toutes" || d.statut === filtre;
    const clientNom = d.clientInfo?.nom ?? store.getClientById(d.clientId)?.nom ?? "";
    const clientEmail = d.clientInfo?.email ?? store.getClientById(d.clientId)?.email ?? "";
    const q = search.toLowerCase();
    return matchStatut && (!q || d.espaceTitre.toLowerCase().includes(q) || clientNom.toLowerCase().includes(q) || clientEmail.toLowerCase().includes(q));
  });

  // ── Tous les ebooks (statiques + admin) ──
  const allEbookRows: EbookRow[] = [
    ...STATIC_EBOOKS.map((e): EbookRow => {
      const ov = catalogue.ebookOverrides[e.id] || {};
      return {
        id: e.id,
        slug: e.slug,
        title: (ov.title ?? e.title) as string,
        category: (ov.category ?? e.category) as string,
        price: (ov.price ?? e.price) as number,
        originalPrice: ov.originalPrice ?? e.originalPrice,
        pages: (ov.pages ?? e.pages) as number,
        rating: (ov.rating ?? e.rating) as number,
        reviews: (ov.reviews ?? e.reviews) as number,
        bestseller: (ov.bestseller ?? e.bestseller) as boolean | undefined,
        new: (ov.new ?? e.new) as boolean | undefined,
        actif: catalogue.staticEbookActif[e.id] !== false,
        source: "statique",
      };
    }),
    ...catalogue.ebooks.map((e): EbookRow => ({
      id: e.id,
      slug: e.slug,
      title: e.title,
      category: e.category,
      price: e.price,
      originalPrice: e.originalPrice,
      pages: e.pages,
      rating: e.rating,
      reviews: e.reviews,
      bestseller: e.bestseller,
      new: e.new,
      actif: e.actif,
      source: "admin",
    })),
  ];

  const ebooksFiltres = ebookSearch.trim()
    ? allEbookRows.filter(
        (e) =>
          e.title.toLowerCase().includes(ebookSearch.toLowerCase()) ||
          e.category.toLowerCase().includes(ebookSearch.toLowerCase())
      )
    : allEbookRows;

  // ── Helpers ebooks ──
  function toEbookForm(e: EbookRow): EbookForm {
    return {
      title: e.title, description: "", category: e.category,
      price: String(e.price), originalPrice: e.originalPrice ? String(e.originalPrice) : "",
      pages: String(e.pages), rating: String(e.rating), reviews: String(e.reviews),
      bestseller: !!e.bestseller, new: !!e.new, sections: [],
    };
  }
  function toEbookFormFull(e: EbookRow): EbookForm {
    if (e.source === "statique") {
      const base = STATIC_EBOOKS.find((s) => s.id === e.id)!;
      const ov = catalogue.ebookOverrides[e.id] || {};
      return {
        title: (ov.title ?? base.title) as string,
        description: (ov.description ?? base.description) as string,
        category: (ov.category ?? base.category) as string,
        price: String(ov.price ?? base.price),
        originalPrice: String(ov.originalPrice ?? base.originalPrice ?? ""),
        pages: String(ov.pages ?? base.pages),
        rating: String(ov.rating ?? base.rating),
        reviews: String(ov.reviews ?? base.reviews),
        bestseller: !!(ov.bestseller ?? base.bestseller),
        new: !!(ov.new ?? base.new),
        sections: (ov.sections ?? base.sections ?? []) as Section[],
      };
    }
    const dyn = catalogue.ebooks.find((d) => d.id === e.id)!;
    return {
      title: dyn.title, description: dyn.description, category: dyn.category,
      price: String(dyn.price), originalPrice: dyn.originalPrice ? String(dyn.originalPrice) : "",
      pages: String(dyn.pages), rating: String(dyn.rating), reviews: String(dyn.reviews),
      bestseller: !!dyn.bestseller, new: !!dyn.new, sections: dyn.sections ?? [],
    };
  }

  async function syncEbooks() {
    const state = useCatalogueStore.getState();
    const payload = {
      ebooks: state.ebooks,
      overrides: state.ebookOverrides,
      actif: state.staticEbookActif,
    };
    await fetch("/api/admin/sync-ebooks", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-password": ADMIN_PASSWORD },
      body: JSON.stringify(payload),
    }).catch(() => {});
  }

  async function saveEbook(form: EbookForm) {
    const price = parseInt(form.price) || 0;
    const originalPrice = form.originalPrice ? parseInt(form.originalPrice) : undefined;
    const pages = parseInt(form.pages) || 80;
    const rating = parseFloat(form.rating) || 4.5;
    const reviews = parseInt(form.reviews) || 0;
    const sections = form.sections.filter((s) => s.titre.trim() || s.contenu.trim());

    if (!editEbookId) {
      catalogue.ajouterEbook({
        title: form.title.trim(), description: form.description.trim(),
        category: form.category, price, originalPrice, pages, rating, reviews,
        bestseller: form.bestseller, new: form.new, cover: "", sections,
      });
      const newest = useCatalogueStore.getState().ebooks.at(-1);
      await syncEbooks();
      if (newest) setSavedLink(`/ebooks/${newest.slug}`);
      setShowEbookForm(false);
      return;
    }

    const row = allEbookRows.find((e) => e.id === editEbookId);
    if (!row) return;

    if (row.source === "statique") {
      catalogue.setEbookOverride(editEbookId, {
        title: form.title.trim(), description: form.description.trim(),
        category: form.category, price, originalPrice, pages, rating, reviews,
        bestseller: form.bestseller, new: form.new, sections,
      });
    } else {
      catalogue.modifierEbook(editEbookId, {
        title: form.title.trim(), description: form.description.trim(),
        category: form.category, price, originalPrice, pages, rating, reviews,
        bestseller: form.bestseller, new: form.new, sections,
      });
    }
    await syncEbooks();
    setSavedLink(`/ebooks/${row.slug}`);
    setEditEbookId(null);
  }

  async function toggleEbook(id: string, source: "statique" | "admin") {
    if (source === "statique") catalogue.toggleStaticEbookActif(id);
    else catalogue.toggleEbookActif(id);
    await syncEbooks();
  }

  // ── Toutes les formations (statiques + admin) ──
  const allFormationRows: FormationRow[] = [
    ...STATIC_FORMATIONS.map((f): FormationRow => {
      const ov = catalogue.formationOverrides[f.id] || {};
      return {
        id: f.id,
        titre: (ov.titre ?? f.titre) as string,
        categorie: (ov.categorie ?? f.categorie) as string,
        description: (ov.description ?? f.description) as string,
        instructeur: (ov.instructeur ?? f.instructeur) as string,
        duree: (ov.duree ?? f.duree) as string,
        modules: (ov.modules ?? f.modules) as number,
        prix: (ov.prix ?? f.prix) as number,
        prixOriginal: ov.prixOriginal ?? f.prixOriginal,
        niveau: (ov.niveau ?? f.niveau) as FormationRow["niveau"],
        note: (ov.note ?? f.note) as number,
        apprenants: (ov.apprenants ?? f.apprenants) as number,
        badge: ov.badge ?? f.badge,
        mode: ((ov.mode ?? f.mode) as FormationRow["mode"]) || "both",
        actif: catalogue.staticFormationActif[f.id] !== false,
        source: "statique",
      };
    }),
    ...catalogue.formations.map((f): FormationRow => ({
      id: f.id,
      titre: f.titre,
      categorie: f.categorie,
      description: f.description,
      instructeur: f.instructeur,
      duree: f.duree,
      modules: f.modules,
      prix: f.prix,
      prixOriginal: f.prixOriginal,
      niveau: f.niveau,
      note: f.note,
      apprenants: f.apprenants,
      badge: f.badge,
      mode: f.mode || "both",
      actif: f.actif,
      source: "admin",
    })),
  ];

  const formationsFiltrees = formationSearch.trim()
    ? allFormationRows.filter(
        (f) =>
          f.titre.toLowerCase().includes(formationSearch.toLowerCase()) ||
          f.categorie.toLowerCase().includes(formationSearch.toLowerCase())
      )
    : allFormationRows;

  // ── Helpers formations ──
  function toFormationFormFull(f: FormationRow): FormationForm {
    if (f.source === "statique") {
      const base = STATIC_FORMATIONS.find((s) => s.id === f.id)!;
      const ov = catalogue.formationOverrides[f.id] || {};
      return {
        titre: (ov.titre ?? base.titre) as string,
        description: (ov.description ?? base.description) as string,
        categorie: (ov.categorie ?? base.categorie) as string,
        instructeur: (ov.instructeur ?? base.instructeur) as string,
        duree: (ov.duree ?? base.duree) as string,
        modules: String(ov.modules ?? base.modules),
        prix: String(ov.prix ?? base.prix),
        prixOriginal: String(ov.prixOriginal ?? base.prixOriginal ?? ""),
        niveau: (ov.niveau ?? base.niveau) as FormationForm["niveau"],
        note: String(ov.note ?? base.note),
        apprenants: String(ov.apprenants ?? base.apprenants),
        badge: (ov.badge ?? base.badge) || "",
        mode: ((ov.mode ?? base.mode) as FormationForm["mode"]) || "online",
        cover: (ov.cover ?? base.cover) as string | undefined,
        sections: (ov.sections ?? base.sections ?? []) as Section[],
      };
    }
    const dyn = catalogue.formations.find((d) => d.id === f.id)!;
    return {
      titre: dyn.titre, description: dyn.description, categorie: dyn.categorie,
      instructeur: dyn.instructeur, duree: dyn.duree, modules: String(dyn.modules),
      prix: String(dyn.prix), prixOriginal: dyn.prixOriginal ? String(dyn.prixOriginal) : "",
      niveau: dyn.niveau, note: String(dyn.note), apprenants: String(dyn.apprenants), badge: dyn.badge || "",
      mode: dyn.mode || "online",
      cover: dyn.cover,
      sections: dyn.sections ?? [],
    };
  }

  async function syncFormations() {
    const state = useCatalogueStore.getState();
    const payload = {
      formations: state.formations,
      overrides: state.formationOverrides,
      actif: state.staticFormationActif,
    };
    await fetch("/api/admin/sync-formations", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-password": ADMIN_PASSWORD },
      body: JSON.stringify(payload),
    }).catch(() => {});
  }

  async function saveFormation(form: FormationForm) {
    const data = {
      titre: form.titre.trim(), description: form.description.trim(), categorie: form.categorie,
      instructeur: form.instructeur.trim() || "SMART LIFE", duree: form.duree.trim(),
      modules: parseInt(form.modules) || 5, prix: parseInt(form.prix) || 0,
      prixOriginal: form.prixOriginal ? parseInt(form.prixOriginal) : undefined,
      niveau: form.niveau, note: parseFloat(form.note) || 4.5,
      apprenants: parseInt(form.apprenants) || 0, badge: form.badge || undefined,
      mode: form.mode || "online",
      cover: form.cover || undefined,
      sections: form.sections.filter((s) => s.titre.trim() || s.contenu.trim()),
    };

    if (!editFormationId) {
      catalogue.ajouterFormation(data);
      const newest = useCatalogueStore.getState().formations.at(-1);
      await syncFormations();
      if (newest) setSavedLink(`/formation/${newest.id}`);
      setShowFormationForm(false);
      return;
    }

    const row = allFormationRows.find((f) => f.id === editFormationId);
    if (!row) return;

    if (row.source === "statique") {
      catalogue.setFormationOverride(editFormationId, data);
    } else {
      catalogue.modifierFormation(editFormationId, data);
    }
    await syncFormations();
    setSavedLink(`/formation/${row.id}`);
    setEditFormationId(null);
  }

  async function toggleFormation(id: string, source: "statique" | "admin") {
    if (source === "statique") catalogue.toggleStaticFormationActif(id);
    else catalogue.toggleFormationActif(id);
    await syncFormations();
  }

  // ── Gestion sous-admins ──
  async function loadAdmins() {
    setAdminListLoading(true);
    try {
      const res = await fetch("/api/admin/admins", {
        headers: { "x-admin-password": ADMIN_PASSWORD },
      });
      const data = await res.json();
      setAdminList(data.admins ?? []);
    } catch {
      setAdminList([]);
    } finally {
      setAdminListLoading(false);
    }
  }

  async function createAdmin() {
    setAdminCreateError("");
    if (!adminCreateForm.username || !adminCreateForm.password || !adminCreateForm.nom) {
      setAdminCreateError("Tous les champs sont requis.");
      return;
    }
    try {
      const res = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-password": ADMIN_PASSWORD },
        body: JSON.stringify(adminCreateForm),
      });
      const data = await res.json();
      if (data.success) {
        setAdminList((prev) => [...prev, data.admin]);
        setAdminCreateForm({ username: "", password: "", nom: "", role: "admin_manager" });
        setShowAdminCreateForm(false);
      } else {
        setAdminCreateError(data.error || "Erreur lors de la création.");
      }
    } catch {
      setAdminCreateError("Erreur réseau.");
    }
  }

  async function deleteAdmin(id: string) {
    await fetch(`/api/admin/admins?id=${id}`, {
      method: "DELETE",
      headers: { "x-admin-password": ADMIN_PASSWORD },
    });
    setAdminList((prev) => prev.filter((a) => a.id !== id));
    setConfirmDeleteAdmin(null);
  }

  async function toggleAdminActif(admin: AdminType) {
    const updated = { ...admin, actif: !admin.actif };
    await fetch("/api/admin/admins", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-password": ADMIN_PASSWORD },
      body: JSON.stringify({ id: admin.id, actif: updated.actif }),
    });
    setAdminList((prev) => prev.map((a) => (a.id === admin.id ? updated : a)));
  }

  // ── Données acheteurs ──
  const allUsers = serverUsers ?? userStore.users;
  const usersWithPurchases = allUsers.filter(
    (u) => (u.ebooksAchetes && u.ebooksAchetes.length > 0) || (u.formationsAchetees && u.formationsAchetees.length > 0)
  );
  const totalEbooksSold = allUsers.reduce((sum, u) => sum + (u.ebooksAchetes?.length || 0), 0);
  const totalFormationsSold = allUsers.reduce((sum, u) => sum + (u.formationsAchetees?.length || 0), 0);

  // Map id → titre pour tous les ebooks
  const ebookTitleMap: Record<string, string> = {};
  STATIC_EBOOKS.forEach((e) => {
    const ov = catalogue.ebookOverrides[e.id];
    ebookTitleMap[e.id] = (ov?.title as string | undefined) ?? e.title;
  });
  catalogue.ebooks.forEach((e) => { ebookTitleMap[e.id] = e.title; });

  // Map id → titre pour toutes les formations
  const formationTitleMap: Record<string, string> = {};
  STATIC_FORMATIONS.forEach((f) => {
    const ov = catalogue.formationOverrides[f.id];
    formationTitleMap[f.id] = (ov?.titre as string | undefined) ?? f.titre;
  });
  catalogue.formations.forEach((f) => { formationTitleMap[f.id] = f.titre; });

  const acheteursFiltres = acheteurSearch.trim()
    ? usersWithPurchases.filter(
        (u) =>
          `${u.firstName} ${u.lastName}`.toLowerCase().includes(acheteurSearch.toLowerCase()) ||
          u.email.toLowerCase().includes(acheteurSearch.toLowerCase()) ||
          u.phone.includes(acheteurSearch)
      )
    : usersWithPurchases;

  // Candidatures consultants
  const toutesCC = serverCC ?? store.getAllCandidaturesConsultant();
  const statsCC = {
    total: toutesCC.length,
    en_attente: toutesCC.filter((c) => c.statut === "en_attente").length,
    validees: toutesCC.filter((c) => c.statut === "validee").length,
    rejetees: toutesCC.filter((c) => c.statut === "rejetee").length,
    non_lu: toutesCC.filter((c) => !c.lu).length,
  };
  const ccFiltrees = toutesCC.filter((c) => {
    const matchStatut = filtreConsultant === "toutes" || c.statut === filtreConsultant;
    const q = searchConsultant.toLowerCase();
    return matchStatut && (!q ||
      c.prenom.toLowerCase().includes(q) ||
      c.nom.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.ville.toLowerCase().includes(q)
    );
  });
  const allCCSelected = ccFiltrees.length > 0 && ccFiltrees.every((c) => selectedCCIds.has(c.id));
  const someCCSelected = !allCCSelected && ccFiltrees.some((c) => selectedCCIds.has(c.id));

  const ONGLETS: { key: Onglet; label: string; icon: React.ReactNode; badge?: number }[] = [
    { key: "candidatures", label: "Demandes Accomp.", icon: <Users size={16} />, badge: stats.en_attente || undefined },
    { key: "candidatures_consultant", label: "Candidat. Consult.", icon: <Star size={16} />, badge: statsCC.non_lu || undefined },
    { key: "ebooks", label: "Ebooks", icon: <BookOpen size={16} />, badge: allEbookRows.length },
    { key: "formations", label: "Formations", icon: <Play size={16} />, badge: allFormationRows.length },
    { key: "acheteurs", label: "Acheteurs", icon: <ShoppingBag size={16} />, badge: usersWithPurchases.length || undefined },
    ...(adminRole === "super_admin" ? [{ key: "admins" as Onglet, label: "Admins", icon: <Lock size={16} /> }] : []),
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* Toast lien généré */}
      {savedLink && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 bg-emerald-900/90 border border-emerald-700/50 rounded-2xl shadow-2xl backdrop-blur max-w-sm">
          <CheckCircle size={18} className="text-emerald-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold mb-0.5">Lien généré ✓</p>
            <p className="text-emerald-300 text-xs font-mono truncate">{typeof window !== "undefined" ? window.location.origin : "https://smartlifecm.com"}{savedLink}</p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={() => {
                const url = `${typeof window !== "undefined" ? window.location.origin : "https://smartlifecm.com"}${savedLink}`;
                navigator.clipboard.writeText(url);
              }}
              className="p-1.5 bg-emerald-800/60 hover:bg-emerald-700/60 text-emerald-300 rounded-lg transition-colors"
              title="Copier"
            >
              <Copy size={13} />
            </button>
            <a href={savedLink} target="_blank" rel="noopener noreferrer"
              className="p-1.5 bg-emerald-800/60 hover:bg-emerald-700/60 text-emerald-300 rounded-lg transition-colors"
              title="Ouvrir">
              <ExternalLink size={13} />
            </a>
            <button onClick={() => setSavedLink(null)} className="p-1.5 text-emerald-500 hover:text-white rounded-lg transition-colors">
              <X size={13} />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Panel Administrateur</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-gray-500 text-sm">SMART LIFE · Gestion du catalogue et des candidatures</p>
            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${adminRole === "super_admin" ? "bg-[#E8B800]/20 text-[#E8B800] border-[#E8B800]/30" : "bg-green-900/40 text-green-400 border-green-700/30"}`}>
              {adminRole === "super_admin" ? "SUPER ADMIN" : "ADMIN MANAGER"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <a href="/admin/espaces" className="px-4 py-2 bg-white/5 border border-white/20 hover:bg-white/10 text-gray-300 rounded-xl text-sm">
            Gérer les espaces →
          </a>
          <button onClick={() => setAuthed(false)} className="px-4 py-2 border border-white/20 text-gray-400 rounded-xl text-sm hover:bg-white/5">
            Déconnexion
          </button>
        </div>
      </div>

      {/* Onglets */}
      <div className="flex gap-1 p-1 bg-white/[0.03] border border-white/10 rounded-2xl mb-8 overflow-x-auto">
        {ONGLETS.map((o) => (
          <button
            key={o.key}
            onClick={() => setOnglet(o.key)}
            className={`flex-1 min-w-max flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm transition-all whitespace-nowrap ${onglet === o.key ? "bg-[#E8B800] text-black font-bold" : "text-gray-900 font-bold hover:bg-black/5"}`}
          >
            {o.icon}
            {o.label}
            {o.badge !== undefined && o.badge > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${onglet === o.key ? "bg-black/20 text-black" : o.key === "candidatures" ? "bg-yellow-500 text-black" : "bg-gray-200 text-gray-800"}`}>
                {o.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ══ ONGLET CANDIDATURES ACCOMPAGNEMENT ══ */}
      {onglet === "candidatures" && (
        <div>
          <div className="mb-6">
            <h2 className="text-gray-900 text-xl font-bold flex items-center gap-2">
              <Users size={20} className="text-[#E8B800]" /> Demandes d&apos;accompagnement
            </h2>
            <p className="text-gray-500 text-sm mt-1">Clients ayant soumis une demande pour être accompagnés par un consultant.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            {[
              { label: "Total demandes", value: stats.total, color: "text-gray-900" },
              { label: "En attente", value: stats.en_attente, color: "text-yellow-600" },
              { label: "Validées", value: stats.validees, color: "text-emerald-600" },
              { label: "Rejetées", value: stats.rejetees, color: "text-red-600" },
              { label: "Clients inscrits", value: stats.clients, color: "text-[#D4A017]" },
            ].map((s) => (
              <div key={s.label} className="p-5 bg-white border border-gray-200 rounded-2xl text-center shadow-sm">
                <div className={`text-3xl font-bold ${s.color} mb-1`}>{s.value}</div>
                <div className="text-gray-500 text-xs">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#E8B800] text-sm"
                placeholder="Rechercher par nom, email, espace..." />
            </div>
            <div className="flex gap-2 flex-wrap">
              {([["toutes", "Toutes"], ["en_attente", "En attente"], ["validee", "Validées"], ["rejetee", "Rejetées"]] as const).map(([val, label]) => (
                <button key={val} onClick={() => setFiltre(val)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${filtre === val ? "bg-[#E8B800] border-[#E8B800] text-black" : "border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50"}`}>
                  {label}
                  {val === "en_attente" && stats.en_attente > 0 && (
                    <span className="ml-1.5 text-xs bg-yellow-500 text-black px-1.5 py-0.5 rounded-full">{stats.en_attente}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {candidaturesFiltrees.length === 0 ? (
            <div className="text-center py-20 bg-gray-50 border border-gray-200 rounded-2xl">
              <div className="text-5xl mb-4">📋</div>
              <h3 className="text-gray-900 font-bold mb-2">Aucune demande</h3>
              <p className="text-gray-500 text-sm">{toutes.length === 0 ? "Aucune candidature reçue pour le moment." : "Aucun résultat pour ces filtres."}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {candidaturesFiltrees.map((d) => {
                const client = d.clientInfo ?? store.getClientById(d.clientId);
                return (
                  <div key={d.id} className="p-5 bg-white border border-gray-200 rounded-2xl hover:border-gray-300 hover:shadow-sm transition-all">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1 flex-wrap">
                          <h3 className="text-gray-900 font-bold">{d.espaceTitre}</h3>
                          <StatutBadge statut={d.statut} />
                        </div>
                        {client && (
                          <div className="flex flex-wrap gap-x-4 text-xs text-gray-600">
                            <span className="text-gray-800 font-semibold">{client.nom}</span>
                            <span>{client.email}</span>
                            <span>{client.telephone}</span>
                            <span>{client.ville}</span>
                          </div>
                        )}
                        <p className="text-gray-500 text-xs mt-1">
                          {new Date(d.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {d.statut === "en_attente" && (
                          <>
                            <button onClick={() => mettreAJourDemande(d.id, "validee", "Votre dossier a été validé.")}
                              className="p-2 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white rounded-lg transition-all" title="Valider">
                              <CheckCircle size={16} />
                            </button>
                            <button onClick={() => mettreAJourDemande(d.id, "rejetee", "Votre dossier ne correspond pas aux critères actuels.")}
                              className="p-2 bg-red-50 hover:bg-red-600 text-red-700 hover:text-white rounded-lg transition-all" title="Rejeter">
                              <XCircle size={16} />
                            </button>
                          </>
                        )}
                        <button onClick={() => setSelected(d)}
                          className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 hover:text-gray-900 rounded-xl text-xs transition-all">
                          <Eye size={13} /> Détails
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {clients.length > 0 && (
            <div className="mt-16">
              <h2 className="text-gray-900 text-xl font-bold mb-6 flex items-center gap-2">
                <Users size={20} className="text-[#E8B800]" />Clients inscrits ({clients.length})
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left">
                      {["Nom", "Email", "Téléphone", "Ville", "Capital", "Inscrit le"].map((h) => (
                        <th key={h} className="pb-3 text-gray-500 text-xs font-semibold pr-4">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {clients.map((c) => (
                      <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-3 text-gray-900 font-semibold pr-4">{c.nom}</td>
                        <td className="py-3 text-gray-700 pr-4">{c.email}</td>
                        <td className="py-3 text-gray-700 pr-4">{c.telephone}</td>
                        <td className="py-3 text-gray-700 pr-4">{c.ville}</td>
                        <td className="py-3 text-gray-600 pr-4">{c.capital || "—"}</td>
                        <td className="py-3 text-gray-500 text-xs">{new Date(c.createdAt).toLocaleDateString("fr-FR")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ ONGLET EBOOKS ══ */}
      {onglet === "ebooks" && (
        <div>
          {/* Stats ebooks */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: "Total ebooks", value: allEbookRows.length, color: "text-white" },
              { label: "Actifs", value: allEbookRows.filter((e) => e.actif).length, color: "text-emerald-400" },
              { label: "Désactivés", value: allEbookRows.filter((e) => !e.actif).length, color: "text-red-400" },
            ].map((s) => (
              <div key={s.label} className="p-4 bg-white/[0.03] border border-white/10 rounded-2xl text-center">
                <div className={`text-2xl font-bold ${s.color} mb-1`}>{s.value}</div>
                <div className="text-gray-600 text-xs">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Barre d'actions */}
          <div className="flex gap-3 mb-6 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input type="text" value={ebookSearch} onChange={(e) => setEbookSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[#E8B800] text-sm"
                placeholder="Rechercher un ebook..." />
            </div>
            {!showEbookForm && !editEbookId && (
              <button onClick={() => setShowEbookForm(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#E8B800] hover:bg-[#27A827] text-black font-bold rounded-xl text-sm">
                <Plus size={16} /> Ajouter un ebook
              </button>
            )}
          </div>

          {showEbookForm && !editEbookId && (
            <div className="mb-6">
              <FormulaireEbook initial={EBOOK_VIDE} onSave={saveEbook} onCancel={() => setShowEbookForm(false)} titreForm="Nouvel ebook" />
            </div>
          )}

          {/* Liste unifiée */}
          <div className="space-y-2">
            {ebooksFiltres.map((e) => (
              <div key={e.id}>
                {editEbookId === e.id ? (
                  <div className="mb-2">
                    <FormulaireEbook
                      initial={toEbookFormFull(e)}
                      onSave={saveEbook}
                      onCancel={() => setEditEbookId(null)}
                      titreForm={`Modifier — ${e.title}`}
                    />
                  </div>
                ) : (
                  <div className={`p-4 rounded-2xl border transition-all ${e.actif ? "bg-white/[0.03] border-white/10" : "bg-white/[0.01] border-white/5 opacity-55"}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="text-white font-semibold text-sm leading-tight">{e.title}</h3>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${e.source === "statique" ? "bg-blue-900/40 text-blue-400 border border-blue-700/30" : "bg-green-900/40 text-green-400 border border-green-700/30"}`}>
                            {e.source === "statique" ? "Base" : "Admin"}
                          </span>
                          {e.bestseller && <span className="text-[10px] px-1.5 py-0.5 bg-yellow-900/30 text-yellow-400 rounded border border-yellow-700/30">Bestseller</span>}
                          {e.new && <span className="text-[10px] px-1.5 py-0.5 bg-emerald-900/30 text-emerald-400 rounded border border-emerald-700/30">Nouveau</span>}
                          {!e.actif && <span className="text-[10px] px-1.5 py-0.5 bg-red-900/30 text-red-400 rounded border border-red-700/30">Désactivé</span>}
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-500 mb-1.5">
                          <span className="flex items-center gap-1"><Tag size={10} />{e.category}</span>
                          <span className="font-semibold text-[#E8B800]">{formatPrice(e.price)}</span>
                          {e.originalPrice && <span className="line-through text-gray-600">{formatPrice(e.originalPrice)}</span>}
                          <span>{e.pages}p</span>
                          <span className="flex items-center gap-0.5"><Star size={10} className="fill-yellow-400 text-yellow-400" />{e.rating} ({e.reviews})</span>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <CopyLinkButton path={`/ebooks/${e.slug}`} label={`/ebooks/${e.slug}`} />
                          <PdfUploadButton ebookId={e.id} />
                          <CoverUploadButton
                            entityId={e.id}
                            currentCover={
                              e.source === "statique"
                                ? catalogue.ebookOverrides[e.id]?.cover
                                : catalogue.ebooks.find((eb) => eb.id === e.id)?.cover
                            }
                            onSuccess={(url) => {
                              if (e.source === "statique") catalogue.setEbookOverride(e.id, { cover: url });
                              else catalogue.modifierEbook(e.id, { cover: url });
                              syncEbooks();
                            }}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => toggleEbook(e.id, e.source)}
                          className={`p-1.5 rounded-lg transition-all ${e.actif ? "text-emerald-400 hover:bg-emerald-900/30" : "text-gray-600 hover:bg-white/5"}`}
                          title={e.actif ? "Désactiver" : "Activer"}
                        >
                          {e.actif ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                        </button>
                        <button
                          onClick={() => { setEditEbookId(e.id); setShowEbookForm(false); }}
                          className="p-1.5 text-gray-500 hover:text-[#E8B800] hover:bg-[#E8B800]/10 rounded-lg"
                          title="Modifier"
                        >
                          <Pencil size={15} />
                        </button>
                        {e.source === "admin" && (
                          confirmDeleteEbook === e.id ? (
                            <div className="flex gap-1">
                              <button onClick={async () => { catalogue.supprimerEbook(e.id); setConfirmDeleteEbook(null); await syncEbooks(); }}
                                className="px-2 py-1 bg-red-600 text-white text-xs font-bold rounded-lg">Oui</button>
                              <button onClick={() => setConfirmDeleteEbook(null)}
                                className="px-2 py-1 border border-white/20 text-gray-400 text-xs rounded-lg">Non</button>
                            </div>
                          ) : (
                            <button onClick={() => setConfirmDeleteEbook(e.id)}
                              className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-900/20 rounded-lg" title="Supprimer">
                              <Trash2 size={15} />
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {ebooksFiltres.length === 0 && (
            <div className="text-center py-12 text-gray-500 text-sm">Aucun ebook trouvé</div>
          )}
        </div>
      )}

      {/* ══ ONGLET FORMATIONS ══ */}
      {onglet === "formations" && (
        <div>
          {/* Stats formations */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: "Total formations", value: allFormationRows.length, color: "text-white" },
              { label: "Actives", value: allFormationRows.filter((f) => f.actif).length, color: "text-emerald-400" },
              { label: "Désactivées", value: allFormationRows.filter((f) => !f.actif).length, color: "text-red-400" },
            ].map((s) => (
              <div key={s.label} className="p-4 bg-white/[0.03] border border-white/10 rounded-2xl text-center">
                <div className={`text-2xl font-bold ${s.color} mb-1`}>{s.value}</div>
                <div className="text-gray-600 text-xs">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Barre d'actions */}
          <div className="flex gap-3 mb-6 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input type="text" value={formationSearch} onChange={(e) => setFormationSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[#E8B800] text-sm"
                placeholder="Rechercher une formation..." />
            </div>
            {!showFormationForm && !editFormationId && (
              <button onClick={() => setShowFormationForm(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#E8B800] hover:bg-[#27A827] text-black font-bold rounded-xl text-sm">
                <Plus size={16} /> Ajouter une formation
              </button>
            )}
          </div>

          {showFormationForm && !editFormationId && (
            <div className="mb-6">
              <FormulaireFormation initial={FORMATION_VIDE} onSave={saveFormation} onCancel={() => setShowFormationForm(false)} titreForm="Nouvelle formation" formationId={undefined} />
            </div>
          )}

          <div className="space-y-2">
            {formationsFiltrees.map((f) => {
              const hasOnline = f.mode === "online" || f.mode === "both";
              const isVideoPanelOpen = expandedVideoPanel === f.id;
              const isQuizPanelOpen = expandedQuizPanel === f.id;
              return (
                <div key={f.id}>
                  {editFormationId === f.id ? (
                    <div className="mb-2">
                      <FormulaireFormation initial={toFormationFormFull(f)} onSave={saveFormation} onCancel={() => setEditFormationId(null)} titreForm={`Modifier — ${f.titre}`} formationId={f.id} />
                    </div>
                  ) : (
                    <div>
                      <div className={`p-4 rounded-2xl border transition-all ${f.actif ? "bg-white/[0.03] border-white/10" : "bg-white/[0.01] border-white/5 opacity-55"} ${(isVideoPanelOpen || isQuizPanelOpen) ? "rounded-b-none border-b-0" : ""}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h3 className="text-white font-semibold text-sm leading-tight">{f.titre}</h3>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${f.source === "statique" ? "bg-blue-900/40 text-blue-400 border border-blue-700/30" : "bg-green-900/40 text-green-400 border border-green-700/30"}`}>
                                {f.source === "statique" ? "Base" : "Admin"}
                              </span>
                              {/* Badge mode */}
                              {f.mode === "online" && (
                                <span className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 bg-blue-900/30 text-blue-400 rounded border border-blue-700/30 font-medium">
                                  <Monitor size={9} /> En ligne
                                </span>
                              )}
                              {f.mode === "presentiel" && (
                                <span className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 bg-emerald-900/30 text-emerald-400 rounded border border-emerald-700/30 font-medium">
                                  <MapPin size={9} /> Présentiel
                                </span>
                              )}
                              {f.mode === "both" && (
                                <span className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 bg-[#E8B800]/10 text-[#E8B800] rounded border border-[#E8B800]/30 font-medium">
                                  <Layers size={9} /> En ligne + Présentiel
                                </span>
                              )}
                              {f.badge && <span className="text-[10px] px-1.5 py-0.5 bg-yellow-900/30 text-yellow-400 rounded border border-yellow-700/30">{f.badge}</span>}
                              {!f.actif && <span className="text-[10px] px-1.5 py-0.5 bg-red-900/30 text-red-400 rounded border border-red-700/30">Désactivé</span>}
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-500 mb-1">
                              <span className="text-gray-600">{f.categorie}</span>
                              <span className="font-semibold text-[#E8B800]">{f.prix.toLocaleString("fr-FR")} FCFA</span>
                              {f.prixOriginal && <span className="line-through text-gray-700">{f.prixOriginal.toLocaleString("fr-FR")}</span>}
                              <span>{f.niveau} · {f.duree} · {f.modules} modules</span>
                              <span className="flex items-center gap-0.5"><Star size={10} className="fill-yellow-400 text-yellow-400" />{f.note} ({f.apprenants} apprenants)</span>
                            </div>
                            <div className="mb-2">
                              <CopyLinkButton path={`/formation/${f.id}`} label={`/formation/${f.id}`} />
                            </div>
                            <CoverUploadButton
                              entityId={"form-" + f.id}
                              currentCover={
                                f.source === "statique"
                                  ? catalogue.formationOverrides[f.id]?.cover
                                  : catalogue.formations.find((fm) => fm.id === f.id)?.cover
                              }
                              onSuccess={(url) => {
                                if (f.source === "statique") catalogue.setFormationOverride(f.id, { cover: url });
                                else catalogue.modifierFormation(f.id, { cover: url });
                                syncFormations();
                              }}
                            />
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap justify-end">
                            {/* Bouton Vidéos (uniquement pour formations en ligne) */}
                            {hasOnline && (
                              <button
                                onClick={() => { setExpandedVideoPanel(isVideoPanelOpen ? null : f.id); setExpandedQuizPanel(null); }}
                                className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                                  isVideoPanelOpen
                                    ? "bg-[#E8B800]/20 border-[#E8B800]/40 text-[#E8B800]"
                                    : "bg-white/5 border-white/20 text-gray-400 hover:border-[#E8B800]/40 hover:text-[#E8B800]"
                                }`}
                                title="Gérer les vidéos de formation"
                              >
                                <Video size={13} />
                                Vidéos
                              </button>
                            )}
                            {/* Bouton Quiz */}
                            {hasOnline && (
                              <button
                                onClick={() => { setExpandedQuizPanel(isQuizPanelOpen ? null : f.id); setExpandedVideoPanel(null); }}
                                className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                                  isQuizPanelOpen
                                    ? "bg-purple-500/20 border-purple-500/40 text-purple-300"
                                    : "bg-white/5 border-white/20 text-gray-400 hover:border-purple-400/40 hover:text-purple-300"
                                }`}
                                title="Gérer les quiz par module"
                              >
                                <CheckCircle size={13} />
                                Quiz
                              </button>
                            )}
                            <button
                              onClick={() => toggleFormation(f.id, f.source)}
                              className={`p-1.5 rounded-lg transition-all ${f.actif ? "text-emerald-400 hover:bg-emerald-900/30" : "text-gray-600 hover:bg-white/5"}`}
                              title={f.actif ? "Désactiver" : "Activer"}
                            >
                              {f.actif ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                            </button>
                            <button
                              onClick={() => { setEditFormationId(f.id); setShowFormationForm(false); setExpandedVideoPanel(null); }}
                              className="p-1.5 text-gray-500 hover:text-[#E8B800] hover:bg-[#E8B800]/10 rounded-lg"
                              title="Modifier"
                            >
                              <Pencil size={15} />
                            </button>
                            {f.source === "admin" && (
                              confirmDeleteFormation === f.id ? (
                                <div className="flex gap-1">
                                  <button onClick={async () => { catalogue.supprimerFormation(f.id); setConfirmDeleteFormation(null); await syncFormations(); }}
                                    className="px-2 py-1 bg-red-600 text-white text-xs font-bold rounded-lg">Oui</button>
                                  <button onClick={() => setConfirmDeleteFormation(null)}
                                    className="px-2 py-1 border border-white/20 text-gray-400 text-xs rounded-lg">Non</button>
                                </div>
                              ) : (
                                <button onClick={() => setConfirmDeleteFormation(f.id)}
                                  className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-900/20 rounded-lg" title="Supprimer">
                                  <Trash2 size={15} />
                                </button>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                      {/* Panneau gestionnaire vidéos */}
                      {isVideoPanelOpen && (
                        <div className="border border-[#E8B800]/15 border-t-0 rounded-b-2xl px-4 pb-4 bg-white/[0.02]">
                          <VideoManagerPanel formationId={f.id} />
                        </div>
                      )}
                      {/* Panneau gestionnaire quiz */}
                      {isQuizPanelOpen && (
                        <div className="border border-purple-500/20 border-t-0 rounded-b-2xl px-4 pb-4 bg-white/[0.02]">
                          <div className="flex items-center gap-2 pt-4 pb-2 border-b border-white/5 mb-2">
                            <CheckCircle size={14} className="text-purple-400" />
                            <span className="text-purple-300 text-sm font-semibold">Quiz par module</span>
                          </div>
                          <QuizManagerPanel formationId={f.id} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {formationsFiltrees.length === 0 && (
            <div className="text-center py-12 text-gray-500 text-sm">Aucune formation trouvée</div>
          )}
        </div>
      )}

      {/* ══ ONGLET ACHETEURS ══ */}
      {onglet === "acheteurs" && (
        <div>
          {/* Stats acheteurs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Comptes créés", value: allUsers.length, color: "text-white" },
              { label: "Ont acheté", value: usersWithPurchases.length, color: "text-[#E8B800]" },
              { label: "Ebooks vendus", value: totalEbooksSold, color: "text-emerald-400" },
              { label: "Formations vendues", value: totalFormationsSold, color: "text-green-400" },
            ].map((s) => (
              <div key={s.label} className="p-4 bg-white/[0.03] border border-white/10 rounded-2xl text-center">
                <div className={`text-2xl font-bold ${s.color} mb-1`}>{s.value}</div>
                <div className="text-gray-600 text-xs">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Recherche */}
          <div className="relative mb-6">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={acheteurSearch}
              onChange={(e) => setAcheteurSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[#E8B800] text-sm"
              placeholder="Rechercher par nom, email ou téléphone..."
            />
          </div>

          {/* Liste acheteurs */}
          {acheteursFiltres.length === 0 ? (
            <div className="text-center py-16 bg-white/[0.02] border border-white/5 rounded-2xl">
              <div className="text-5xl mb-3">🛒</div>
              <h3 className="text-white font-bold mb-2">
                {usersWithPurchases.length === 0 ? "Aucun achat enregistré" : "Aucun résultat"}
              </h3>
              <p className="text-gray-500 text-sm">
                {usersWithPurchases.length === 0
                  ? "Les achats des clients apparaîtront ici."
                  : "Essayez avec un autre terme de recherche."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {acheteursFiltres.map((u) => {
                const isOpen = expandedUser === u.id;
                const ebooksTitles = (u.ebooksAchetes || []).map((id) => ebookTitleMap[id] || id);
                const formationsTitles = (u.formationsAchetees || []).map((id) => formationTitleMap[id] || id);
                const totalAchats = ebooksTitles.length + formationsTitles.length;
                return (
                  <div key={u.id} className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
                    <button
                      onClick={() => setExpandedUser(isOpen ? null : u.id)}
                      className="w-full p-5 flex items-center justify-between gap-4 hover:bg-white/[0.02] transition-all text-left"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#E8B800]/30 to-[#27A827]/30 border border-[#E8B800]/20 flex items-center justify-center text-sm font-bold text-[#E8B800] flex-shrink-0">
                          {u.firstName?.[0]?.toUpperCase()}{u.lastName?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="text-white font-semibold text-sm">
                            {u.firstName} {u.lastName}
                          </p>
                          <div className="flex flex-wrap gap-x-3 text-xs text-gray-500">
                            <span>{u.email}</span>
                            {u.phone && <span>{u.phone}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {ebooksTitles.length > 0 && (
                          <span className="flex items-center gap-1.5 px-3 py-1 bg-[#E8B800]/10 border border-[#E8B800]/20 rounded-full text-[#E8B800] text-xs font-bold">
                            <BookOpen size={11} />
                            {ebooksTitles.length} ebook{ebooksTitles.length > 1 ? "s" : ""}
                          </span>
                        )}
                        {formationsTitles.length > 0 && (
                          <span className="flex items-center gap-1.5 px-3 py-1 bg-green-900/30 border border-green-700/30 rounded-full text-green-400 text-xs font-bold">
                            <Play size={11} />
                            {formationsTitles.length} formation{formationsTitles.length > 1 ? "s" : ""}
                          </span>
                        )}
                        {isOpen ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
                      </div>
                    </button>

                    {isOpen && (
                      <div className="px-5 pb-5 border-t border-white/5 space-y-4">
                        {ebooksTitles.length > 0 && (
                          <div>
                            <p className="text-gray-500 text-xs mb-2 mt-4 font-medium uppercase tracking-wide flex items-center gap-1.5">
                              <BookOpen size={11} className="text-[#E8B800]" /> Ebooks achetés ({ebooksTitles.length})
                            </p>
                            <div className="space-y-2">
                              {ebooksTitles.map((titre, i) => (
                                <div key={i} className="flex items-center gap-2.5 p-2.5 bg-white/[0.03] rounded-xl">
                                  <div className="w-6 h-6 rounded-lg bg-[#E8B800]/10 flex items-center justify-center flex-shrink-0">
                                    <BookOpen size={12} className="text-[#E8B800]" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-white text-xs font-medium truncate">{titre}</p>
                                    <p className="text-gray-600 text-[10px] font-mono">{u.ebooksAchetes[i]}</p>
                                  </div>
                                  <CheckCircle size={13} className="text-emerald-400 flex-shrink-0" />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {formationsTitles.length > 0 && (
                          <div>
                            <p className="text-gray-500 text-xs mb-2 font-medium uppercase tracking-wide flex items-center gap-1.5">
                              <Play size={11} className="text-green-400" /> Formations achetées ({formationsTitles.length})
                            </p>
                            <div className="space-y-2">
                              {formationsTitles.map((titre, i) => (
                                <div key={i} className="flex items-center gap-2.5 p-2.5 bg-white/[0.03] rounded-xl">
                                  <div className="w-6 h-6 rounded-lg bg-green-900/30 flex items-center justify-center flex-shrink-0">
                                    <Play size={12} className="text-green-400" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-white text-xs font-medium truncate">{titre}</p>
                                    <p className="text-gray-600 text-[10px] font-mono">{u.formationsAchetees[i]}</p>
                                  </div>
                                  <CheckCircle size={13} className="text-emerald-400 flex-shrink-0" />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {totalAchats === 0 && (
                          <p className="text-gray-600 text-xs mt-4">Aucun achat enregistré.</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Tous les comptes (sans achat) */}
          {allUsers.filter((u) => (!u.ebooksAchetes || u.ebooksAchetes.length === 0) && (!u.formationsAchetees || u.formationsAchetees.length === 0)).length > 0 && (
            <div className="mt-10">
              <h3 className="text-gray-500 text-sm font-medium mb-4">
                Comptes sans achat ({allUsers.filter((u) => (!u.ebooksAchetes || u.ebooksAchetes.length === 0) && (!u.formationsAchetees || u.formationsAchetees.length === 0)).length})
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-left">
                      {["Nom", "Email", "Téléphone", "Mot de passe"].map((h) => (
                        <th key={h} className="pb-3 text-gray-600 text-xs font-medium pr-6">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {allUsers
                      .filter((u) => (!u.ebooksAchetes || u.ebooksAchetes.length === 0) && (!u.formationsAchetees || u.formationsAchetees.length === 0))
                      .map((u) => (
                        <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                          <td className="py-3 text-white pr-6">{u.firstName} {u.lastName}</td>
                          <td className="py-3 text-gray-400 pr-6">{u.email}</td>
                          <td className="py-3 text-gray-500 pr-6">{u.phone || "—"}</td>
                          <td className="py-3 text-gray-600 text-xs">{u.hasPassword ? "Défini" : "Non défini"}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ ONGLET CANDIDATURES CONSULTANTS ══ */}
      {onglet === "candidatures_consultant" && (
        <div>
          <div className="mb-6">
            <h2 className="text-gray-900 text-xl font-bold flex items-center gap-2">
              <Star size={20} className="text-[#E8B800]" /> Candidatures Consultants
            </h2>
            <p className="text-gray-500 text-sm mt-1">Personnes ayant soumis une candidature pour rejoindre le réseau de consultants SMART LIFE.</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            {[
              { label: "Total", value: statsCC.total, color: "text-gray-900" },
              { label: "Non lues", value: statsCC.non_lu, color: "text-blue-600" },
              { label: "En attente", value: statsCC.en_attente, color: "text-yellow-600" },
              { label: "Validées", value: statsCC.validees, color: "text-emerald-600" },
              { label: "Rejetées", value: statsCC.rejetees, color: "text-red-600" },
            ].map((s) => (
              <div key={s.label} className={`p-5 bg-white border rounded-2xl text-center shadow-sm ${s.label === "Non lues" && s.value > 0 ? "border-blue-300 bg-blue-50" : "border-gray-200"}`}>
                <div className={`text-3xl font-bold ${s.color} mb-1`}>{s.value}</div>
                <div className="text-gray-500 text-xs">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Barre recherche + filtres */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
              <input type="text" value={searchConsultant} onChange={(e) => setSearchConsultant(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#E8B800] text-sm"
                placeholder="Rechercher par nom, email, ville..." />
            </div>
            <div className="flex gap-2 flex-wrap">
              {([["toutes", "Toutes"], ["en_attente", "En attente"], ["validee", "Validées"], ["rejetee", "Rejetées"]] as const).map(([val, label]) => (
                <button key={val} onClick={() => setFiltreConsultant(val)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${filtreConsultant === val ? "bg-[#E8B800] border-[#E8B800] text-black" : "border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50"}`}>
                  {label}
                  {val === "en_attente" && statsCC.en_attente > 0 && (
                    <span className="ml-1.5 text-xs bg-yellow-500 text-black px-1.5 py-0.5 rounded-full">{statsCC.en_attente}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Lien vers la page publique */}
          <div className="mb-6 p-4 bg-[#E8B800]/5 border border-[#E8B800]/20 rounded-xl flex items-center justify-between gap-4 flex-wrap gap-y-3">
            <p className="text-gray-700 text-sm">
              Page de candidature publique :{" "}
              <span className="text-gray-900 font-semibold">/devenir-consultant</span>
            </p>
            <div className="flex items-center gap-2">
              <button onClick={refreshCC}
                className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 hover:text-gray-900 text-xs font-medium rounded-xl transition-all whitespace-nowrap">
                ↻ Actualiser
              </button>
              <a href="/devenir-consultant" target="_blank"
                className="px-4 py-2 bg-[#E8B800] hover:bg-[#27A827] text-black text-xs font-bold rounded-xl transition-all whitespace-nowrap">
                Voir la page →
              </a>
            </div>
          </div>

          {/* Barre d'actions en masse */}
          {selectedCCIds.size > 0 && (
            <div className="sticky top-0 z-10 mb-4 p-3 bg-[#1a1a2e] border border-[#E8B800]/40 rounded-2xl flex items-center gap-3 flex-wrap shadow-lg">
              <span className="text-[#E8B800] font-bold text-sm">{selectedCCIds.size} sélectionné{selectedCCIds.size > 1 ? "s" : ""}</span>
              <div className="flex items-center gap-2 flex-wrap flex-1">
                <button
                  onClick={() => bulkActionCC("validee")}
                  disabled={bulkLoading}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all">
                  {bulkLoading ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
                  Valider ({selectedCCIds.size})
                </button>
                <button
                  onClick={() => bulkActionCC("rejetee")}
                  disabled={bulkLoading}
                  className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all">
                  {bulkLoading ? <Loader2 size={13} className="animate-spin" /> : <XCircle size={13} />}
                  Rejeter ({selectedCCIds.size})
                </button>
                <button
                  onClick={() => bulkActionCC("lu")}
                  disabled={bulkLoading}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all">
                  {bulkLoading ? <Loader2 size={13} className="animate-spin" /> : <Eye size={13} />}
                  Marquer lu ({selectedCCIds.size})
                </button>
              </div>
              <button
                onClick={() => setSelectedCCIds(new Set())}
                className="p-1.5 text-gray-500 hover:text-white rounded-lg transition-colors">
                <X size={14} />
              </button>
            </div>
          )}

          {ccFiltrees.length === 0 ? (
            <div className="text-center py-20 bg-gray-50 border border-gray-200 rounded-2xl">
              <div className="text-5xl mb-4">⭐</div>
              <h3 className="text-gray-900 font-bold text-xl mb-2">
                {toutesCC.length === 0 ? "Aucune candidature reçue" : "Aucun résultat"}
              </h3>
              <p className="text-gray-500 text-sm">
                {toutesCC.length === 0
                  ? "Les candidatures consultants apparaîtront ici."
                  : "Essayez avec d'autres filtres."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* En-tête sélectionner tout */}
              <div className="flex items-center gap-3 px-2 py-1">
                <label className="flex items-center gap-2 cursor-pointer select-none group">
                  <div
                    onClick={() => {
                      if (allCCSelected) {
                        setSelectedCCIds(new Set());
                      } else {
                        setSelectedCCIds(new Set(ccFiltrees.map((c) => c.id)));
                      }
                    }}
                    className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition-all ${
                      allCCSelected
                        ? "bg-[#E8B800] border-[#E8B800]"
                        : someCCSelected
                        ? "bg-[#E8B800]/50 border-[#E8B800]"
                        : "border-gray-400 bg-white hover:border-[#E8B800]"
                    }`}
                  >
                    {allCCSelected && <CheckCircle size={10} className="text-black" />}
                    {someCCSelected && <span className="w-2 h-0.5 bg-black rounded" />}
                  </div>
                  <span className="text-gray-500 text-xs group-hover:text-gray-700 transition-colors">
                    {allCCSelected ? "Tout désélectionner" : `Tout sélectionner (${ccFiltrees.length})`}
                  </span>
                </label>
              </div>

              {ccFiltrees.map((cc) => {
                const nonLu = !cc.lu;
                const isSelected = selectedCCIds.has(cc.id);
                return (
                <div key={cc.id} className={`p-5 bg-white rounded-2xl hover:shadow-sm transition-all border ${isSelected ? "border-[#E8B800] ring-1 ring-[#E8B800]/30" : nonLu ? "border-blue-300 ring-1 ring-blue-200" : "border-gray-200 hover:border-gray-300"}`}>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      {/* Checkbox sélection */}
                      <div
                        onClick={() => toggleSelectCC(cc.id)}
                        className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center cursor-pointer transition-all ${
                          isSelected
                            ? "bg-[#E8B800] border-[#E8B800]"
                            : "border-gray-400 bg-white hover:border-[#E8B800]"
                        }`}
                      >
                        {isSelected && <CheckCircle size={10} className="text-black" />}
                      </div>
                      <div className="relative w-12 h-12 flex-shrink-0">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#E8B800]/20 to-[#27A827]/10 border border-[#E8B800]/30 flex items-center justify-center text-[#D4A017] font-black text-xl">
                          {cc.prenom.charAt(0).toUpperCase()}
                        </div>
                        {nonLu && <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1 flex-wrap">
                          <h3 className="text-gray-900 font-bold">{cc.prenom} {cc.nom}</h3>
                          {nonLu && (
                            <span className="px-2 py-0.5 bg-blue-100 border border-blue-300 text-blue-700 text-xs font-bold rounded-full">Nouveau</span>
                          )}
                          <StatutBadge statut={cc.statut} />
                        </div>
                        <div className="flex flex-wrap gap-x-4 text-xs text-gray-600">
                          <span className="flex items-center gap-1"><Phone size={10} />{cc.telephone}</span>
                          <span>{cc.email}</span>
                          <span className="flex items-center gap-1"><MapPin size={10} />{cc.ville}</span>
                          <span className="flex items-center gap-1"><Briefcase size={10} />{cc.anneesExperience}</span>
                        </div>
                        {(cc.domainesIds?.length ?? 0) > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {cc.domainesIds.map((id) => {
                              const espace = adminEspaces.find((e) => e.id === id);
                              return (
                                <span key={id} className="px-2 py-0.5 bg-[#E8B800]/10 border border-[#E8B800]/30 text-[#D4A017] text-xs rounded-full font-medium">
                                  {espace ? espace.titre : id}
                                </span>
                              );
                            })}
                          </div>
                        )}
                        <p className="text-gray-500 text-xs mt-1">
                          {new Date(cc.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {cc.statut === "en_attente" && (
                        <>
                          <button onClick={() => mettreAJourCC(cc.id, "validee", "Félicitations ! Votre profil a été validé. Bienvenue dans le réseau SMART LIFE.")}
                            className="p-2 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white rounded-lg transition-all" title="Valider">
                            <CheckCircle size={16} />
                          </button>
                          <button onClick={() => mettreAJourCC(cc.id, "rejetee", "Votre profil ne correspond pas aux critères actuels. Merci de votre intérêt.")}
                            className="p-2 bg-red-50 hover:bg-red-600 text-red-700 hover:text-white rounded-lg transition-all" title="Rejeter">
                            <XCircle size={16} />
                          </button>
                        </>
                      )}
                      <button onClick={() => {
                          setSelectedConsultant(cc);
                          setNoteConsultantModal(cc.noteAdmin || "");
                          if (!cc.lu) marquerLuCC(cc.id);
                        }}
                        className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 hover:text-gray-900 rounded-xl text-xs transition-all">
                        <Eye size={13} /> Détails
                      </button>
                    </div>
                  </div>
                </div>
              );})}

            </div>
          )}
        </div>
      )}

      {/* Modal candidature consultant */}
      {selectedConsultant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedConsultant(null); }}>
          <div className="bg-[#12121f] border border-white/10 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div>
                <h2 className="text-white font-bold text-xl">{selectedConsultant.prenom} {selectedConsultant.nom}</h2>
                <p className="text-gray-500 text-xs mt-1">
                  {new Date(selectedConsultant.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              <button onClick={() => setSelectedConsultant(null)} className="text-gray-600 hover:text-white text-2xl leading-none">×</button>
            </div>
            <div className="p-6 space-y-5">
              {/* Infos candidat */}
              <div className="p-5 bg-white/[0.03] border border-white/10 rounded-xl space-y-4">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <Users size={16} className="text-[#E8B800]" /> Informations du candidat
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    ["Prénom", selectedConsultant.prenom],
                    ["Nom", selectedConsultant.nom],
                    ["Email", selectedConsultant.email],
                    ["Téléphone", selectedConsultant.telephone],
                    ["Ville", selectedConsultant.ville],
                    ["Expérience", selectedConsultant.anneesExperience],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <p className="text-gray-500 text-xs mb-0.5">{label}</p>
                      <p className="text-white font-medium text-sm">{value}</p>
                    </div>
                  ))}
                </div>

                {/* Domaines d'activité — toujours affiché */}
                <div className="pt-3 border-t border-white/10">
                  <p className="text-gray-500 text-xs mb-2 flex items-center gap-1">
                    <Briefcase size={11} /> Domaines d&apos;activité / programmes
                  </p>
                  {(selectedConsultant.domainesIds?.length ?? 0) === 0 ? (
                    <p className="text-gray-600 text-xs italic">Aucun domaine sélectionné</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {selectedConsultant.domainesIds.map((id) => {
                        const espace = adminEspaces.find((e) => e.id === id);
                        return (
                          <span key={id} className="px-2.5 py-1 bg-[#E8B800]/15 border border-[#E8B800]/30 text-[#E8B800] text-xs font-medium rounded-full">
                            {espace ? espace.titre : id}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Portfolio / LinkedIn */}
                {selectedConsultant.portfolioUrl && (
                  <div className="pt-3 border-t border-white/10">
                    <p className="text-gray-500 text-xs mb-1">Portfolio / LinkedIn :</p>
                    <a href={selectedConsultant.portfolioUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-[#E8B800] text-sm hover:text-[#27A827] transition-colors break-all">
                      <Link2 size={12} /> {selectedConsultant.portfolioUrl}
                    </a>
                  </div>
                )}
              </div>

              {/* Motivation */}
              <div className="p-4 bg-white/[0.03] border border-white/10 rounded-xl">
                <p className="text-gray-500 text-xs mb-2 font-medium flex items-center gap-1">
                  <FileCheck size={11} /> Motivation
                </p>
                <p className="text-gray-300 text-sm leading-relaxed">{selectedConsultant.motivation}</p>
              </div>

              {/* Statut */}
              <div className="flex items-center gap-3">
                <span className="text-gray-500 text-sm">Statut :</span>
                <StatutBadge statut={selectedConsultant.statut} />
              </div>

              {/* Note admin */}
              <div>
                <label className={labelCls}>Note pour le candidat</label>
                <textarea rows={3} value={noteConsultantModal}
                  onChange={(e) => setNoteConsultantModal(e.target.value)}
                  className={`${inputCls} resize-none`}
                  placeholder="Message qui sera visible par le candidat..." />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  disabled={selectedConsultant.statut === "validee"}
                  onClick={() => {
                    mettreAJourCC(selectedConsultant.id, "validee", noteConsultantModal || "Félicitations ! Votre profil a été validé. Bienvenue dans le réseau SMART LIFE.");
                    setSelectedConsultant(null);
                  }}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2">
                  <CheckCircle size={16} /> Valider
                </button>
                <button
                  disabled={selectedConsultant.statut === "rejetee"}
                  onClick={() => {
                    mettreAJourCC(selectedConsultant.id, "rejetee", noteConsultantModal || "Votre profil ne correspond pas aux critères actuels.");
                    setSelectedConsultant(null);
                  }}
                  className="flex-1 py-3 bg-red-700 hover:bg-red-600 text-white font-bold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2">
                  <XCircle size={16} /> Rejeter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ ONGLET ADMINS ══ */}
      {onglet === "admins" && adminRole === "super_admin" && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-white font-bold text-lg">Gestion des administrateurs</h2>
              <p className="text-gray-500 text-sm mt-0.5">Créez et gérez les comptes des sous-admins</p>
            </div>
            <div className="flex gap-2">
              <button onClick={loadAdmins} disabled={adminListLoading}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/15 hover:border-white/30 text-gray-400 hover:text-white rounded-xl text-sm transition-all disabled:opacity-50">
                {adminListLoading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />} Actualiser
              </button>
              {!showAdminCreateForm && (
                <button onClick={() => { setShowAdminCreateForm(true); loadAdmins(); }}
                  className="flex items-center gap-2 px-5 py-2 bg-[#E8B800] hover:bg-[#27A827] text-black font-bold rounded-xl text-sm">
                  <Plus size={16} /> Créer un admin
                </button>
              )}
            </div>
          </div>

          {/* Formulaire création */}
          {showAdminCreateForm && (
            <div className="mb-6 p-6 bg-white/[0.03] border border-[#E8B800]/20 rounded-2xl space-y-4">
              <h3 className="text-white font-bold">Nouveau compte administrateur</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Nom complet <span className="text-[#E8B800]">*</span></label>
                  <input type="text" value={adminCreateForm.nom}
                    onChange={(e) => setAdminCreateForm((f) => ({ ...f, nom: e.target.value }))}
                    className={inputCls} placeholder="ex: Jean Dupont" />
                </div>
                <div>
                  <label className={labelCls}>Identifiant <span className="text-[#E8B800]">*</span></label>
                  <input type="text" value={adminCreateForm.username}
                    onChange={(e) => setAdminCreateForm((f) => ({ ...f, username: e.target.value.toLowerCase().replace(/\s/g, "_") }))}
                    className={inputCls} placeholder="ex: jean_dupont" />
                </div>
                <div>
                  <label className={labelCls}>Mot de passe <span className="text-[#E8B800]">*</span></label>
                  <input type="text" value={adminCreateForm.password}
                    onChange={(e) => setAdminCreateForm((f) => ({ ...f, password: e.target.value }))}
                    className={inputCls} placeholder="Choisir un mot de passe fort" />
                </div>
                <div>
                  <label className={labelCls}>Rôle</label>
                  <select value={adminCreateForm.role}
                    onChange={(e) => setAdminCreateForm((f) => ({ ...f, role: e.target.value as "super_admin" | "admin_manager" }))}
                    className={selectCls}>
                    <option value="admin_manager" className="bg-[#0e0e1a]">Admin Manager — gestion du contenu</option>
                    <option value="super_admin" className="bg-[#0e0e1a]">Super Admin — accès complet</option>
                  </select>
                </div>
              </div>
              {adminCreateError && (
                <p className="text-red-400 text-sm flex items-center gap-1.5">
                  <AlertCircle size={13} /> {adminCreateError}
                </p>
              )}
              <div className="flex gap-3">
                <button onClick={createAdmin}
                  className="flex items-center gap-2 px-6 py-3 bg-[#E8B800] hover:bg-[#27A827] text-black font-bold rounded-xl text-sm">
                  <Save size={15} /> Créer le compte
                </button>
                <button onClick={() => { setShowAdminCreateForm(false); setAdminCreateError(""); }}
                  className="flex items-center gap-2 px-6 py-3 border border-white/20 text-gray-400 rounded-xl text-sm hover:bg-white/5">
                  <X size={15} /> Annuler
                </button>
              </div>
            </div>
          )}

          {/* Liste des admins */}
          <div className="space-y-2">
            {/* Admin principal */}
            <div className="p-4 bg-[#E8B800]/5 border border-[#E8B800]/20 rounded-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#E8B800]/20 flex items-center justify-center">
                  <Lock size={16} className="text-[#E8B800]" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">Super Administrateur Principal</p>
                  <p className="text-gray-500 text-xs">@admin · Accès complet permanent</p>
                </div>
              </div>
              <span className="px-2 py-0.5 bg-[#E8B800]/20 text-[#E8B800] text-[10px] font-bold rounded-full border border-[#E8B800]/30">SUPER ADMIN</span>
            </div>

            {adminList.length === 0 && !adminListLoading && (
              <div className="text-center py-10 text-gray-600 text-sm">
                <p>Aucun sous-admin créé.</p>
                <p className="mt-1">Cliquez sur &quot;Créer un admin&quot; pour commencer.</p>
              </div>
            )}
            {adminListLoading && (
              <div className="text-center py-8">
                <Loader2 size={24} className="animate-spin text-gray-600 mx-auto" />
              </div>
            )}

            {adminList.map((a) => (
              <div key={a.id} className={`p-4 rounded-2xl border transition-all ${a.actif ? "bg-white/[0.03] border-white/10" : "bg-white/[0.01] border-white/5 opacity-55"}`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                      <Users size={16} className="text-gray-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-white font-semibold text-sm">{a.nom}</p>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${a.role === "super_admin" ? "bg-[#E8B800]/20 text-[#E8B800] border-[#E8B800]/30" : "bg-green-900/40 text-green-400 border-green-700/30"}`}>
                          {a.role === "super_admin" ? "SUPER ADMIN" : "ADMIN MANAGER"}
                        </span>
                        {!a.actif && <span className="px-2 py-0.5 bg-red-900/30 text-red-400 text-[10px] font-bold rounded-full border border-red-700/30">Désactivé</span>}
                      </div>
                      <p className="text-gray-500 text-xs mt-0.5">@{a.username} · Créé le {new Date(a.createdAt).toLocaleDateString("fr-FR")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button onClick={() => toggleAdminActif(a)}
                      className={`p-1.5 rounded-lg transition-all ${a.actif ? "text-emerald-400 hover:bg-emerald-900/30" : "text-gray-600 hover:bg-white/5"}`}
                      title={a.actif ? "Désactiver" : "Activer"}>
                      {a.actif ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                    </button>
                    {confirmDeleteAdmin === a.id ? (
                      <div className="flex gap-1">
                        <button onClick={() => deleteAdmin(a.id)}
                          className="px-2 py-1 bg-red-600 text-white text-xs font-bold rounded-lg">Oui</button>
                        <button onClick={() => setConfirmDeleteAdmin(null)}
                          className="px-2 py-1 border border-white/20 text-gray-400 text-xs rounded-lg">Non</button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmDeleteAdmin(a.id)}
                        className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-900/20 rounded-lg" title="Supprimer">
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 p-5 bg-white/[0.02] border border-white/5 rounded-2xl">
            <p className="text-gray-500 text-sm font-medium mb-2">Différences de rôles</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-600">
              <div>
                <p className="text-[#E8B800] font-bold mb-1">Super Admin</p>
                <ul className="space-y-0.5">
                  <li>• Accès complet à toutes les sections</li>
                  <li>• Gestion des autres admins</li>
                  <li>• Création et suppression de contenus</li>
                </ul>
              </div>
              <div>
                <p className="text-green-400 font-bold mb-1">Admin Manager</p>
                <ul className="space-y-0.5">
                  <li>• Gestion des ebooks, formations, espaces</li>
                  <li>• Validation des candidatures</li>
                  <li>• Pas d&apos;accès à la gestion des admins</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal candidature accompagnement */}
      {selected && (
        <DemandeModal
          demande={selected}
          onClose={() => setSelected(null)}
          onValider={(id, note) => mettreAJourDemande(id, "validee", note)}
          onRejeter={(id, note) => mettreAJourDemande(id, "rejetee", note)}
        />
      )}
    </div>
  );
}