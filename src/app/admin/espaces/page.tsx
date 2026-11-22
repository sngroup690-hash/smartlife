"use client";

import { useState, useEffect, useRef } from "react";
import {
  Plus, Pencil, Trash2, ToggleLeft, ToggleRight,
  Lock, Save, X, CheckCircle, Users, Upload, Loader2, AlertCircle,
} from "lucide-react";
import { useAccompagnementStore, EspacePersonnalise } from "@/lib/accompagnement-store";

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? "";

async function syncEspacesApi(espacesList: EspacePersonnalise[]) {
  await fetch("/api/admin/sync-espaces", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-admin-password": ADMIN_PASSWORD },
    body: JSON.stringify({ espaces: espacesList }),
  }).catch(() => {});
}

function EspaceImageButton({
  espaceId,
  currentImage,
}: {
  espaceId: string;
  currentImage?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [msg, setMsg] = useState("");
  const [preview, setPreview] = useState(currentImage || "");

  async function handleFile(file: File) {
    if (!file) return;
    setStatus("loading");
    setMsg("");
    try {
      const fd = new FormData();
      fd.append("ebookId", "esp-" + espaceId);
      fd.append("file", file);
      const res = await fetch("/api/admin/upload-cover", {
        method: "POST",
        headers: { "x-admin-password": ADMIN_PASSWORD },
        body: fd,
      });
      const json = await res.json();
      if (json.success) {
        setStatus("idle");
        setPreview(json.url + "?t=" + Date.now());
        useAccompagnementStore.getState().modifierEspace(espaceId, { image: json.url });
        await syncEspacesApi(useAccompagnementStore.getState().espaces);
      } else {
        setStatus("error");
        setMsg(json.error || "Erreur");
      }
    } catch {
      setStatus("error");
      setMsg("Erreur réseau");
    }
  }

  return (
    <div className="flex items-center gap-1.5">
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
          title="Changer la photo"
          className="relative w-8 h-8 rounded-lg overflow-hidden border border-white/20 hover:border-[#E8B800]/50 transition-all group flex-shrink-0"
        >
          <img src={preview} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            {status === "loading"
              ? <Loader2 size={10} className="text-white animate-spin" />
              : <Upload size={10} className="text-white" />}
          </div>
        </button>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          disabled={status === "loading"}
          className="p-2 text-gray-600 hover:text-[#E8B800] hover:bg-[#E8B800]/10 rounded-lg transition-all"
          title="Ajouter une photo de couverture"
        >
          {status === "loading" ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
        </button>
      )}
      {status === "error" && (
        <span className="text-red-400 text-[10px] flex items-center gap-0.5">
          <AlertCircle size={10} /> {msg}
        </span>
      )}
    </div>
  );
}

const DOMAINES_DEFAULT = [
  "Services", "Agriculture", "Commerce", "Restauration",
  "Beauté", "Alimentaire", "Santé & Bien-être", "Éducation",
  "Transport", "Artisanat", "Numérique", "Élevage", "BTP",
  "Finance", "Immobilier", "Entrepreneuriat", "Marketing", "Autre",
];

// Accompagnements de référence pré-définis
const REFERENCES = [
  { titre: "Pressing & Blanchisserie", domaine: "Services", avantages: ["Demande constante et croissante", "Retour sur investissement en 6–12 mois", "Marges bénéficiaires élevées", "Clientèle fidèle et récurrente"], inclus: ["Étude personnalisée de votre zone", "Formation au métier du pressing", "Accompagnement à l'installation", "Mise en relation fournisseurs d'équipements", "Suivi mensuel pendant 3 mois"] },
  { titre: "Pisciculture (Élevage de Poissons)", domaine: "Élevage", avantages: ["Secteur subventionné par l'État", "Forte demande locale et régionale", "Valorisation des terres disponibles", "Revenus complémentaires possibles"], inclus: ["Visite et analyse du site", "Formation technique piscicole", "Aide à la construction des bassins", "Sélection des espèces (tilapia, clarias)", "Suivi sanitaire et commercial"] },
  { titre: "Quincaillerie & Matériaux", domaine: "Commerce", avantages: ["Marché porteur lié au BTP", "Clientèle professionnelle stable", "Diversification des produits possible", "Réseau fournisseurs établi"], inclus: ["Étude de zone et analyse de la concurrence", "Mise en relation avec les fournisseurs", "Formation gestion des stocks", "Conseils d'aménagement", "Suivi pendant 4 mois"] },
  { titre: "Restaurant & Snack", domaine: "Restauration", avantages: ["Faible investissement de départ possible", "Retour sur investissement rapide", "Clientèle locale fidèle", "Possibilité de livraison à domicile"], inclus: ["Définition du concept et des recettes", "Formation hygiène et gestion", "Accompagnement à l'ouverture", "Stratégie de fidélisation", "Suivi 3 mois"] },
  { titre: "Salon de Coiffure & Beauté", domaine: "Beauté", avantages: ["Clientèle féminine très fidèle", "Revenus réguliers et prévisibles", "Possibilité de vente de produits", "Faible saisonnalité"], inclus: ["Étude de positionnement", "Formation gestion salon", "Accompagnement à l'aménagement", "Stratégie de communication locale"] },
  { titre: "Commerce Général (Boutique)", domaine: "Commerce", avantages: ["Démarrage accessible avec peu de capital", "Diversité des produits possibles", "Clientèle locale immédiate", "Flexibilité et adaptabilité"], inclus: ["Analyse de la zone et des besoins", "Formation en gestion commerciale", "Mise en relation avec les grossistes", "Optimisation de l'espace de vente"] },
  { titre: "Boulangerie & Pâtisserie", domaine: "Alimentaire", avantages: ["Demande quotidienne et stable", "Fidélisation clientèle naturelle", "Diversification produits facile", "Revenus dès le premier jour"], inclus: ["Formation boulangerie et gestion", "Aide au choix de l'équipement", "Mise en place du four", "Formation recettes", "Suivi qualité 4 mois"] },
  { titre: "Parapharmacie & Santé", domaine: "Santé & Bien-être", avantages: ["Secteur en croissance constante", "Marges élevées sur certains produits", "Clientèle de confiance récurrente", "Image professionnelle valorisante"], inclus: ["Accompagnement réglementaire", "Formation produits et conseils clients", "Sourcing produits certifiés", "Aménagement et communication"] },
];

const inputCls = "w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[#E8B800] transition-colors text-sm";
const selectCls = "w-full px-4 py-3 bg-[#0e0e1a] border border-white/20 rounded-xl text-white focus:outline-none focus:border-[#E8B800] transition-colors text-sm";
const labelCls = "block text-gray-400 text-sm mb-2";

type FormData = {
  titre: string;
  domaine: string;
  descriptionCourte: string;
  descriptionLongue: string;
  avantages: string[];
  inclus: string[];
  clientsSatisfaits: string;
  placesDisponibles: string;
  espacesSimilaires: string[];
};

const FORM_VIDE: FormData = {
  titre: "", domaine: "", descriptionCourte: "", descriptionLongue: "",
  avantages: [""], inclus: [""], clientsSatisfaits: "0",
  placesDisponibles: "5", espacesSimilaires: [],
};

function ListeEditable({
  label, values, onChange, placeholder,
}: {
  label: string; values: string[]; onChange: (v: string[]) => void; placeholder: string;
}) {
  function update(i: number, v: string) {
    const next = [...values]; next[i] = v; onChange(next);
  }
  function remove(i: number) { onChange(values.filter((_, idx) => idx !== i)); }
  function add() { onChange([...values, ""]); }

  return (
    <div>
      <label className={labelCls}>{label}</label>
      <div className="space-y-2">
        {values.map((v, i) => (
          <div key={i} className="flex gap-2">
            <input
              type="text" value={v}
              onChange={(e) => update(i, e.target.value)}
              className={inputCls} placeholder={placeholder}
            />
            {values.length > 1 && (
              <button type="button" onClick={() => remove(i)}
                className="p-2 text-gray-600 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-all flex-shrink-0">
                <X size={14} />
              </button>
            )}
          </div>
        ))}
        <button type="button" onClick={add}
          className="flex items-center gap-1.5 text-[#E8B800] text-xs hover:text-[#27A827] transition-colors mt-1">
          <Plus size={13} /> Ajouter une ligne
        </button>
      </div>
    </div>
  );
}

function FormulaireEspace({
  initial, onSave, onCancel, titreForm, autresEspaces, domaines,
}: {
  initial: FormData; onSave: (d: FormData) => void; onCancel: () => void;
  titreForm: string; autresEspaces: EspacePersonnalise[]; domaines: string[];
}) {
  const [form, setForm] = useState<FormData>(initial);
  const [refOpen, setRefOpen] = useState(false);
  const [domaineLibre, setDomaineLibre] = useState("");
  const set = (k: keyof FormData, v: string | string[]) => setForm((f) => ({ ...f, [k]: v }));
  const isAutre = form.domaine === "Autre";
  const domaineEffectif = isAutre ? domaineLibre.trim() || "Autre" : form.domaine;
  const valide = form.titre.trim() && domaineEffectif;

  function handleSave(d: FormData) {
    onSave({ ...d, domaine: domaineEffectif });
  }

  function appliquerReference(ref: typeof REFERENCES[0]) {
    setForm((f) => ({
      ...f,
      titre: ref.titre,
      domaine: ref.domaine,
      descriptionCourte: `Accompagnement dans le secteur ${ref.titre.toLowerCase()}.`,
      descriptionLongue: `Notre programme d'accompagnement ${ref.titre} vous guide de A à Z dans la création et le développement de votre activité. Bénéficiez de l'expertise de nos consultants et de notre réseau de partenaires.`,
      avantages: ref.avantages,
      inclus: ref.inclus,
    }));
    setRefOpen(false);
  }

  function toggleSimilaire(id: string) {
    const curr = form.espacesSimilaires;
    set("espacesSimilaires", curr.includes(id) ? curr.filter((x) => x !== id) : [...curr, id]);
  }

  return (
    <div className="p-6 bg-white/[0.03] border border-[#E8B800]/30 rounded-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-bold text-lg">{titreForm}</h3>

        {/* Référence rapide */}
        <div className="relative">
          <button type="button" onClick={() => setRefOpen(!refOpen)}
            className="flex items-center gap-2 px-4 py-2 bg-[#E8B800]/10 border border-[#E8B800]/30 text-[#E8B800] text-sm rounded-xl hover:bg-[#E8B800]/20 transition-all">
            ⚡ Utiliser un modèle
          </button>
          {refOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-[#12121f] border border-white/20 rounded-2xl shadow-2xl z-10 max-h-80 overflow-y-auto">
              <p className="text-gray-500 text-xs px-4 pt-3 pb-1">Choisir un accompagnement de référence :</p>
              {REFERENCES.map((ref) => (
                <button key={ref.titre} type="button" onClick={() => appliquerReference(ref)}
                  className="w-full text-left px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0">
                  <p className="text-white text-sm font-medium">{ref.titre}</p>
                  <p className="text-gray-600 text-xs">{ref.domaine}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Infos de base */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Nom du domaine <span className="text-[#E8B800]">*</span></label>
          <input type="text" value={form.titre} onChange={(e) => set("titre", e.target.value)}
            className={inputCls} placeholder="Ex : Pressing, Pisciculture..." />
        </div>
        <div>
          <label className={labelCls}>Secteur <span className="text-[#E8B800]">*</span></label>
          <select value={form.domaine} onChange={(e) => set("domaine", e.target.value)} className={selectCls}>
            <option value="" className="bg-[#0e0e1a]">Choisir...</option>
            {domaines.map((d) => <option key={d} value={d} className="bg-[#0e0e1a]">{d}</option>)}
            {!domaines.includes("Autre") && <option value="Autre" className="bg-[#0e0e1a]">Autre (préciser)</option>}
          </select>
          {isAutre && (
            <input
              type="text"
              value={domaineLibre}
              onChange={(e) => setDomaineLibre(e.target.value)}
              className={`${inputCls} mt-2`}
              placeholder="Précisez le secteur (ex: Comptabilité, Fiscalité...)"
              autoFocus
            />
          )}
        </div>
        <div>
          <label className={labelCls}>Clients & entreprises satisfaits</label>
          <input type="number" min="0" value={form.clientsSatisfaits}
            onChange={(e) => set("clientsSatisfaits", e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Places disponibles <span className="text-[#E8B800]">*</span></label>
          <input type="number" min="1" value={form.placesDisponibles}
            onChange={(e) => set("placesDisponibles", e.target.value)} className={inputCls} />
        </div>
      </div>

      {/* Descriptions */}
      <div>
        <label className={labelCls}>Description courte (carte)</label>
        <input type="text" value={form.descriptionCourte}
          onChange={(e) => set("descriptionCourte", e.target.value)}
          className={inputCls} placeholder="Une phrase résumant le domaine d'accompagnement..." />
      </div>

      <div>
        <label className={labelCls}>Description détaillée (page de détail)</label>
        <textarea rows={4} value={form.descriptionLongue}
          onChange={(e) => set("descriptionLongue", e.target.value)}
          className={`${inputCls} resize-none`}
          placeholder="Décrivez l'accompagnement en détail : objectifs, déroulement, bénéfices attendus..." />
      </div>

      {/* Avantages */}
      <ListeEditable
        label="Avantages du secteur"
        values={form.avantages}
        onChange={(v) => set("avantages", v)}
        placeholder="Ex : Retour sur investissement rapide..."
      />

      {/* Ce qui est inclus */}
      <ListeEditable
        label="Ce que comprend l'accompagnement"
        values={form.inclus}
        onChange={(v) => set("inclus", v)}
        placeholder="Ex : Formation au métier, Mise en relation fournisseurs..."
      />

      {/* Espaces similaires */}
      {autresEspaces.length > 0 && (
        <div>
          <label className={labelCls}>Espaces similaires à afficher</label>
          <div className="flex flex-wrap gap-2">
            {autresEspaces.map((e) => (
              <button key={e.id} type="button" onClick={() => toggleSimilaire(e.id)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                  form.espacesSimilaires.includes(e.id)
                    ? "bg-[#E8B800] border-[#E8B800] text-black"
                    : "border-white/20 text-gray-400 hover:border-white/40"
                }`}>
                {form.espacesSimilaires.includes(e.id) && "✓ "}
                {e.titre}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button onClick={() => valide && handleSave(form)} disabled={!valide}
          className="flex items-center gap-2 px-6 py-3 bg-[#E8B800] hover:bg-[#27A827] text-black font-bold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm">
          <Save size={15} /> Enregistrer
        </button>
        <button onClick={onCancel}
          className="flex items-center gap-2 px-6 py-3 border border-white/20 hover:bg-white/5 text-gray-400 rounded-xl transition-all text-sm">
          <X size={15} /> Annuler
        </button>
      </div>
    </div>
  );
}

export default function AdminEspacesPage() {
  const store = useAccompagnementStore();
  const [authed, setAuthed] = useState(false);
  const [pwd, setPwd] = useState("");
  const [pwdError, setPwdError] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [domaines, setDomaines] = useState<string[]>(DOMAINES_DEFAULT);
  const [showSecteurs, setShowSecteurs] = useState(false);
  const [nouveauSecteur, setNouveauSecteur] = useState("");
  const [savingSecteurs, setSavingSecteurs] = useState(false);

  useEffect(() => {
    if (!authed) return;
    fetch("/api/espaces")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.espaces) && data.espaces.length > 0) {
          useAccompagnementStore.getState().setEspaces(data.espaces as EspacePersonnalise[]);
        }
      })
      .catch(() => {});
    fetch("/api/admin/secteurs")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data.secteurs)) setDomaines(data.secteurs); })
      .catch(() => {});
  }, [authed]);

  async function saveSecteurs(list: string[]) {
    setSavingSecteurs(true);
    await fetch("/api/admin/secteurs", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-password": ADMIN_PASSWORD },
      body: JSON.stringify({ secteurs: list }),
    }).catch(() => {});
    setSavingSecteurs(false);
    setDomaines(list);
  }

  function ajouterSecteur() {
    const s = nouveauSecteur.trim();
    if (!s || domaines.includes(s)) return;
    const updated = [...domaines.filter((d) => d !== "Autre"), s, "Autre"];
    setNouveauSecteur("");
    saveSecteurs(updated);
  }

  function supprimerSecteur(s: string) {
    if (s === "Autre") return;
    saveSecteurs(domaines.filter((d) => d !== s));
  }

  function login(e: React.FormEvent) {
    e.preventDefault();
    if (pwd === ADMIN_PASSWORD) { setAuthed(true); setPwdError(false); }
    else setPwdError(true);
  }

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-[#E8B800]/10 border border-[#E8B800]/30 flex items-center justify-center text-3xl mb-4">🔐</div>
            <h1 className="text-2xl font-bold text-white mb-1">Administration</h1>
            <p className="text-gray-500 text-sm">Gestion des espaces d&apos;accompagnement</p>
          </div>
          <div className="p-8 bg-white/[0.03] border border-white/10 rounded-2xl">
            <form onSubmit={login} className="space-y-4">
              <div>
                <label className={labelCls}><Lock size={14} className="inline mr-1" />Mot de passe</label>
                <input type="password" value={pwd}
                  onChange={(e) => { setPwd(e.target.value); setPwdError(false); }}
                  className={inputCls} placeholder="••••••••" autoFocus />
                {pwdError && <p className="text-red-400 text-xs mt-2">Mot de passe incorrect.</p>}
              </div>
              <button type="submit" className="w-full py-3 bg-[#E8B800] hover:bg-[#27A827] text-black font-bold rounded-xl">Accéder</button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const espaces = store.espaces.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  function toFormData(e: EspacePersonnalise): FormData {
    return {
      titre: e.titre, domaine: e.domaine,
      descriptionCourte: e.descriptionCourte || "",
      descriptionLongue: e.descriptionLongue || "",
      avantages: e.avantages?.length ? e.avantages : [""],
      inclus: e.inclus?.length ? e.inclus : [""],
      clientsSatisfaits: String(e.clientsSatisfaits),
      placesDisponibles: String(e.placesDisponibles),
      espacesSimilaires: e.espacesSimilaires || [],
    };
  }

  async function syncEspaces(espacesList: EspacePersonnalise[]) {
    await fetch("/api/admin/sync-espaces", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-password": ADMIN_PASSWORD },
      body: JSON.stringify({ espaces: espacesList }),
    }).catch(() => {});
  }

  async function handleAjouter(form: FormData) {
    store.ajouterEspace({
      titre: form.titre.trim(), domaine: form.domaine,
      descriptionCourte: form.descriptionCourte.trim(),
      descriptionLongue: form.descriptionLongue.trim(),
      avantages: form.avantages.filter((a) => a.trim()),
      inclus: form.inclus.filter((i) => i.trim()),
      clientsSatisfaits: parseInt(form.clientsSatisfaits) || 0,
      placesDisponibles: parseInt(form.placesDisponibles) || 5,
      espacesSimilaires: form.espacesSimilaires,
    });
    setShowForm(false);
    await syncEspaces(useAccompagnementStore.getState().espaces);
  }

  async function handleModifier(id: string, form: FormData) {
    store.modifierEspace(id, {
      titre: form.titre.trim(), domaine: form.domaine,
      descriptionCourte: form.descriptionCourte.trim(),
      descriptionLongue: form.descriptionLongue.trim(),
      avantages: form.avantages.filter((a) => a.trim()),
      inclus: form.inclus.filter((i) => i.trim()),
      clientsSatisfaits: parseInt(form.clientsSatisfaits) || 0,
      placesDisponibles: parseInt(form.placesDisponibles) || 5,
      espacesSimilaires: form.espacesSimilaires,
    });
    setEditId(null);
    await syncEspaces(useAccompagnementStore.getState().espaces);
  }

  async function handleToggle(id: string) {
    store.toggleEspaceActif(id);
    await syncEspaces(useAccompagnementStore.getState().espaces);
  }

  async function handleSupprimer(id: string) {
    store.supprimerEspace(id);
    setConfirmDelete(null);
    await syncEspaces(useAccompagnementStore.getState().espaces);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      <div className="flex items-center justify-between mb-10 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Gestion des Espaces</h1>
          <p className="text-gray-500 text-sm">{espaces.length} espace{espaces.length > 1 ? "s" : ""} enregistré{espaces.length > 1 ? "s" : ""}</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <a href="/admin/consultants" className="px-4 py-2 bg-white/5 border border-white/20 hover:bg-white/10 text-gray-300 rounded-xl text-sm transition-all">
            👤 Consultants
          </a>
          <button
            onClick={async () => {
              setSyncing(true);
              await fetch("/api/admin/sync-espaces", {
                method: "POST",
                headers: { "Content-Type": "application/json", "x-admin-password": ADMIN_PASSWORD },
                body: JSON.stringify({ espaces: store.espaces }),
              }).catch(() => {});
              setSyncing(false);
            }}
            disabled={syncing}
            className="px-4 py-2 bg-emerald-900/30 border border-emerald-700/40 hover:bg-emerald-800/40 text-emerald-400 rounded-xl text-sm transition-all disabled:opacity-50">
            {syncing ? "Sync…" : "↻ Sync site"}
          </button>
          <a href="/admin/accompagnement" className="px-4 py-2 border border-white/20 hover:bg-white/5 text-gray-400 rounded-xl text-sm transition-all">
            Candidatures
          </a>
          <button onClick={() => setAuthed(false)} className="px-4 py-2 border border-white/20 text-gray-400 rounded-xl text-sm">
            Déconnexion
          </button>
        </div>
      </div>

      {/* ── Gestion des secteurs d'activité ── */}
      <div className="mb-6 p-4 bg-white/[0.02] border border-white/10 rounded-2xl">
        <button
          onClick={() => setShowSecteurs(!showSecteurs)}
          className="flex items-center justify-between w-full text-left"
        >
          <div>
            <p className="text-white font-semibold text-sm">🏷️ Secteurs d&apos;activité ({domaines.length})</p>
            <p className="text-gray-500 text-xs mt-0.5">Gérez la liste des secteurs disponibles dans les formulaires</p>
          </div>
          <span className="text-gray-500 text-xs">{showSecteurs ? "▲ Replier" : "▼ Gérer"}</span>
        </button>
        {showSecteurs && (
          <div className="mt-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              {domaines.map((d) => (
                <span key={d} className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/15 rounded-full text-gray-300 text-xs">
                  {d}
                  {d !== "Autre" && (
                    <button onClick={() => supprimerSecteur(d)} className="text-gray-600 hover:text-red-400 transition-colors" title="Supprimer">
                      <X size={11} />
                    </button>
                  )}
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={nouveauSecteur}
                onChange={(e) => setNouveauSecteur(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); ajouterSecteur(); } }}
                className={`${inputCls} flex-1`}
                placeholder="Nouveau secteur (ex: Finance, Comptabilité...)"
              />
              <button
                onClick={ajouterSecteur}
                disabled={savingSecteurs || !nouveauSecteur.trim()}
                className="px-4 py-2 bg-[#E8B800] hover:bg-[#27A827] text-black text-sm font-bold rounded-xl transition-all disabled:opacity-40"
              >
                {savingSecteurs ? "…" : <Plus size={16} />}
              </button>
            </div>
          </div>
        )}
      </div>

      {!showForm && (
        <button onClick={() => { setShowForm(true); setEditId(null); }}
          className="w-full mb-8 py-4 border-2 border-dashed border-[#E8B800]/40 hover:border-[#E8B800] hover:bg-[#E8B800]/5 text-[#E8B800] rounded-2xl transition-all flex items-center justify-center gap-2 font-bold">
          <Plus size={20} /> Ajouter un nouvel espace d&apos;accompagnement
        </button>
      )}

      {showForm && (
        <div className="mb-8">
          <FormulaireEspace
            initial={FORM_VIDE}
            autresEspaces={espaces}
            onSave={handleAjouter}
            onCancel={() => setShowForm(false)}
            titreForm="Nouvel espace d'accompagnement"
            domaines={domaines}
          />
        </div>
      )}

      {espaces.length === 0 ? (
        <div className="text-center py-20 bg-white/[0.02] border border-white/8 rounded-2xl">
          <div className="text-6xl mb-4">🏢</div>
          <h3 className="text-white font-bold text-xl mb-2">Aucun espace enregistré</h3>
          <p className="text-gray-500 text-sm">Cliquez sur le bouton ci-dessus pour créer votre premier espace.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {espaces.map((espace) => (
            <div key={espace.id}>
              {editId === espace.id ? (
                <FormulaireEspace
                  initial={toFormData(espace)}
                  autresEspaces={espaces.filter((e) => e.id !== espace.id)}
                  onSave={(form) => handleModifier(espace.id, form)}
                  onCancel={() => setEditId(null)}
                  titreForm={`Modifier — ${espace.titre}`}
                  domaines={domaines}
                />
              ) : (
                <div className={`p-5 rounded-2xl border transition-all ${espace.actif ? "bg-white/[0.03] border-white/10" : "bg-white/[0.01] border-white/5 opacity-60"}`}>
                  <div className="flex items-start justify-between gap-4">
                    {espace.image && (
                      <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 border border-white/10">
                        <img src={espace.image} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="text-white font-bold text-lg">{espace.titre}</h3>
                        <span className="text-xs px-2 py-0.5 bg-white/5 border border-white/10 text-gray-400 rounded-full">{espace.domaine}</span>
                        {!espace.actif && <span className="text-xs px-2 py-0.5 bg-red-900/30 border border-red-700/30 text-red-400 rounded-full">Désactivé</span>}
                      </div>
                      {espace.descriptionCourte && (
                        <p className="text-gray-500 text-sm mb-2 truncate">{espace.descriptionCourte}</p>
                      )}
                      <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><CheckCircle size={11} className="text-emerald-400" /><strong className="text-white">{espace.clientsSatisfaits}</strong> satisfaits</span>
                        <span className="flex items-center gap-1"><Users size={11} className="text-[#E8B800]" /><strong className="text-white">{espace.placesDisponibles}</strong> places</span>
                        {espace.avantages?.filter(Boolean).length > 0 && <span>{espace.avantages.filter(Boolean).length} avantage{espace.avantages.filter(Boolean).length > 1 ? "s" : ""}</span>}
                        {espace.inclus?.filter(Boolean).length > 0 && <span>{espace.inclus.filter(Boolean).length} élément{espace.inclus.filter(Boolean).length > 1 ? "s" : ""} inclus</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <EspaceImageButton espaceId={espace.id} currentImage={espace.image} />
                      <button onClick={() => handleToggle(espace.id)}
                        className={`p-2 rounded-lg transition-all ${espace.actif ? "text-emerald-400 hover:bg-emerald-900/30" : "text-gray-600 hover:bg-white/5"}`}
                        title={espace.actif ? "Désactiver" : "Activer"}>
                        {espace.actif ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                      </button>
                      <button onClick={() => { setEditId(espace.id); setShowForm(false); }}
                        className="p-2 text-gray-500 hover:text-[#E8B800] hover:bg-[#E8B800]/10 rounded-lg transition-all" title="Modifier">
                        <Pencil size={16} />
                      </button>
                      {confirmDelete === espace.id ? (
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleSupprimer(espace.id)}
                            className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg">Confirmer</button>
                          <button onClick={() => setConfirmDelete(null)}
                            className="px-3 py-1 border border-white/20 text-gray-400 text-xs rounded-lg">Non</button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmDelete(espace.id)}
                          className="p-2 text-gray-600 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-all" title="Supprimer">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {espaces.some((e) => e.actif) && (
        <div className="mt-10 p-5 bg-emerald-900/10 border border-emerald-700/20 rounded-2xl flex items-center justify-between gap-4">
          <div>
            <p className="text-white font-semibold text-sm">Vos espaces sont visibles sur le site</p>
            <p className="text-gray-500 text-xs mt-0.5">{espaces.filter((e) => e.actif).length} espace{espaces.filter((e) => e.actif).length > 1 ? "s" : ""} actif{espaces.filter((e) => e.actif).length > 1 ? "s" : ""}</p>
          </div>
          <a href="/accompagnement" target="_blank"
            className="flex-shrink-0 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-bold rounded-xl transition-all">
            Voir la page →
          </a>
        </div>
      )}
    </div>
  );
}