"use client";

import { useState, useRef, useEffect, useCallback, createContext, useContext } from "react";
import Link from "next/link";
import {
  Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Lock,
  Save, X, CheckCircle, Users, Search, Eye,
  Building2, UserCheck, ClipboardList, XCircle, Clock,
  BookOpen, Play, Download, Image as ImageIcon, Upload, FileText, Loader2,
  ShieldCheck, User as UserIcon, KeyRound, Megaphone, MessageSquare, ThumbsUp, ThumbsDown, Star,
  Link2, ExternalLink, RefreshCw, Copy, BarChart2, AlertCircle, ShoppingBag, Package, Gift,
} from "lucide-react";
import { ROLE_CONFIG, type AdminRole } from "@/lib/admin-roles";
import TableauDeBord from "./TableauDeBord";
import { ebooks as staticEbooks } from "@/lib/data";
import { FORMATIONS as staticFormations } from "@/lib/formations-data";
import {
  useAccompagnementStore,
  EspacePersonnalise,
  Consultant,
  DemandeAccompagnement,
} from "@/lib/accompagnement-store";
import {
  useCatalogueStore,
  type EbookAdmin,
  type FormationAdmin,
} from "@/lib/catalogue-store";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { stripHtml } from "@/lib/strip-html";
import { UploadProgressBar } from "@/components/admin/UploadProgressBar";
import { uploadWithProgress } from "@/lib/upload-with-progress";

// ─── Context mot de passe admin ──────────────────────────────────────────────

const AdminPasswordContext = createContext<string>("");
function useAdminPassword() { return useContext(AdminPasswordContext); }

// ─── Constantes ──────────────────────────────────────────────────────────────

const DOMAINES = [
  "Services", "Agriculture", "Commerce", "Restauration",
  "Beauté", "Alimentaire", "Santé & Bien-être", "Éducation",
  "Transport", "Artisanat", "Numérique", "Élevage", "BTP", "Autre",
];

const REFERENCES_ESPACES = [
  { titre: "Pressing & Blanchisserie", domaine: "Services", avantages: ["Demande constante et croissante", "Retour sur investissement en 6–12 mois", "Marges bénéficiaires élevées", "Clientèle fidèle et récurrente"], inclus: ["Étude personnalisée de votre zone", "Formation au métier du pressing", "Accompagnement à l'installation", "Mise en relation fournisseurs d'équipements", "Suivi mensuel pendant 3 mois"] },
  { titre: "Pisciculture (Élevage de Poissons)", domaine: "Élevage", avantages: ["Secteur subventionné par l'État", "Forte demande locale et régionale", "Valorisation des terres disponibles", "Revenus complémentaires possibles"], inclus: ["Visite et analyse du site", "Formation technique piscicole", "Aide à la construction des bassins", "Sélection des espèces (tilapia, clarias)", "Suivi sanitaire et commercial"] },
  { titre: "Quincaillerie & Matériaux", domaine: "Commerce", avantages: ["Marché porteur lié au BTP", "Clientèle professionnelle stable", "Diversification des produits possible", "Réseau fournisseurs établi"], inclus: ["Étude de zone et analyse de la concurrence", "Mise en relation avec les fournisseurs", "Formation gestion des stocks", "Conseils d'aménagement", "Suivi pendant 4 mois"] },
  { titre: "Restaurant & Snack", domaine: "Restauration", avantages: ["Faible investissement de départ possible", "Retour sur investissement rapide", "Clientèle locale fidèle", "Possibilité de livraison à domicile"], inclus: ["Définition du concept et des recettes", "Formation hygiène et gestion", "Accompagnement à l'ouverture", "Stratégie de fidélisation", "Suivi 3 mois"] },
  { titre: "Salon de Coiffure & Beauté", domaine: "Beauté", avantages: ["Clientèle féminine très fidèle", "Revenus réguliers et prévisibles", "Possibilité de vente de produits", "Faible saisonnalité"], inclus: ["Étude de positionnement", "Formation gestion salon", "Accompagnement à l'aménagement", "Stratégie de communication locale"] },
  { titre: "Commerce Général (Boutique)", domaine: "Commerce", avantages: ["Démarrage accessible avec peu de capital", "Diversité des produits possibles", "Clientèle locale immédiate", "Flexibilité et adaptabilité"], inclus: ["Analyse de la zone et des besoins", "Formation en gestion commerciale", "Mise en relation avec les grossistes", "Optimisation de l'espace de vente"] },
  { titre: "Boulangerie & Pâtisserie", domaine: "Alimentaire", avantages: ["Demande quotidienne et stable", "Fidélisation clientèle naturelle", "Diversification produits facile", "Revenus dès le premier jour"], inclus: ["Formation boulangerie et gestion", "Aide au choix de l'équipement", "Formation recettes", "Suivi qualité 4 mois"] },
  { titre: "Parapharmacie & Santé", domaine: "Santé & Bien-être", avantages: ["Secteur en croissance constante", "Marges élevées sur certains produits", "Clientèle de confiance récurrente", "Image professionnelle valorisante"], inclus: ["Accompagnement réglementaire", "Formation produits et conseils clients", "Sourcing produits certifiés", "Aménagement et communication"] },
];

// ─── Styles ───────────────────────────────────────────────────────────────────

const inputCls = "w-full px-4 py-3 bg-white border border-green-200 rounded-xl text-gray-900 font-semibold placeholder-gray-400 focus:outline-none focus:border-green-500 transition-colors text-sm";
const selectCls = "w-full px-4 py-3 bg-white border border-green-200 rounded-xl text-gray-900 font-semibold focus:outline-none focus:border-green-500 transition-colors text-sm";
const labelCls = "block text-gray-900 font-bold text-sm mb-2";

// ─── Helpers ─────────────────────────────────────────────────────────────────


// ─── Fuzzy search ─────────────────────────────────────────────────────────────

function adminNormalize(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function ebookFuzzyMatch(query: string, title: string, category: string, description?: string): boolean {
  if (!query.trim()) return true;
  const words = adminNormalize(query).split(" ").filter((w) => w.length >= 2);
  if (words.length === 0) return true;
  const t = adminNormalize(title);
  const c = adminNormalize(category);
  const d = adminNormalize((description || "").replace(/<[^>]*>/g, ""));
  return words.some((w) =>
    t.includes(w) || c.includes(w) || d.includes(w) ||
    t.split(" ").some((tw) => tw.startsWith(w) && w.length >= 3)
  );
}

// ─── Composants partagés ──────────────────────────────────────────────────────

function StatutBadge({ statut }: { statut: string }) {
  if (statut === "validee") return <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-900/30 border border-emerald-700/40 text-emerald-400 text-xs font-bold rounded-full"><CheckCircle size={11} /> Validée</span>;
  if (statut === "rejetee") return <span className="flex items-center gap-1.5 px-3 py-1 bg-red-900/30 border border-red-700/40 text-red-400 text-xs font-bold rounded-full"><XCircle size={11} /> Rejetée</span>;
  return <span className="flex items-center gap-1.5 px-3 py-1 bg-yellow-900/30 border border-yellow-700/40 text-yellow-400 text-xs font-bold rounded-full"><Clock size={11} /> En attente</span>;
}

function ListeEditable({ label, values, onChange, placeholder }: { label: string; values: string[]; onChange: (v: string[]) => void; placeholder: string }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <div className="space-y-2">
        {values.map((v, i) => (
          <div key={i} className="flex gap-2">
            <input type="text" value={v} onChange={(e) => { const n = [...values]; n[i] = e.target.value; onChange(n); }} className={inputCls} placeholder={placeholder} />
            {values.length > 1 && <button type="button" onClick={() => onChange(values.filter((_, idx) => idx !== i))} className="p-2 text-gray-800 hover:text-red-400 rounded-lg flex-shrink-0"><X size={14} /></button>}
          </div>
        ))}
        <button type="button" onClick={() => onChange([...values, ""])} className="flex items-center gap-1.5 text-green-600 text-xs hover:text-[#27A827] mt-1"><Plus size={13} /> Ajouter</button>
      </div>
    </div>
  );
}

// ─── Types formulaires ────────────────────────────────────────────────────────

type EspaceForm = { titre: string; domaine: string; descriptionCourte: string; descriptionLongue: string; avantages: string[]; inclus: string[]; clientsSatisfaits: string; placesDisponibles: string; espacesSimilaires: string[]; image?: string };
type ConsultantForm = { prenom: string; clientsAccompa: string; entreprisesAccompa: string; domainesIds: string[] };

const ESPACE_VIDE: EspaceForm = { titre: "", domaine: "", descriptionCourte: "", descriptionLongue: "", avantages: [""], inclus: [""], clientsSatisfaits: "0", placesDisponibles: "5", espacesSimilaires: [], image: "" };
const CONSULTANT_VIDE: ConsultantForm = { prenom: "", clientsAccompa: "0", entreprisesAccompa: "0", domainesIds: [] };

// ─── Vidéo page Accompagnement ────────────────────────────────────────────────

function VideoAccompagnementAdmin() {
  const adminPassword = useContext(AdminPasswordContext);
  const [videoUrl, setVideoUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/accompagnement-video").then((r) => r.json()).then((d) => setVideoUrl(d.url ?? "")).catch(() => {});
  }, []);

  async function handleUpload(file: File) {
    setUploading(true);
    setProgress(0);
    setMsg("");
    const fd = new FormData();
    fd.append("file", file);
    fd.append("espaceId", "accompagnement-page");
    try {
      const res = await uploadWithProgress("/api/admin/upload-espace-video", fd, { "x-admin-password": adminPassword }, setProgress);
      const data = await res.data() as { videoUrl?: string; error?: string };
      if (data.videoUrl) {
        await fetch("/api/accompagnement-video", {
          method: "POST",
          headers: { "x-admin-password": adminPassword, "Content-Type": "application/json" },
          body: JSON.stringify({ url: data.videoUrl }),
        });
        setVideoUrl(data.videoUrl);
        setMsg("Vidéo enregistrée ✓");
      } else {
        setMsg(data.error ?? "Erreur upload");
      }
    } catch {
      setMsg("Erreur réseau");
    }
    setUploading(false);
  }

  async function handleDelete() {
    await fetch("/api/accompagnement-video", {
      method: "POST",
      headers: { "x-admin-password": adminPassword, "Content-Type": "application/json" },
      body: JSON.stringify({ url: "" }),
    });
    setVideoUrl("");
    setMsg("Vidéo supprimée");
  }

  return (
    <div className="mb-6 p-5 bg-white border border-green-200 rounded-2xl space-y-4">
      <div>
        <h3 className="text-gray-900 font-bold text-base mb-1">Vidéo de présentation — Page Accompagnement</h3>
        <p className="text-gray-700 text-xs font-semibold">Visible par tous les visiteurs sur la page d&apos;accueil accompagnement.</p>
      </div>
      <label className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all w-fit ${uploading ? "border-green-300 bg-white" : "border-gray-200 hover:border-green-300 hover:bg-green-50"}`}>
        <input
          type="file"
          accept="video/mp4,video/webm,video/ogg,video/quicktime,.mp4,.webm,.ogg,.mov,.avi,.mkv"
          className="hidden"
          disabled={uploading}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ""; }}
        />
        {uploading
          ? <span className="w-4 h-4 border-2 border-green-300 border-t-[#E8B800] rounded-full animate-spin" />
          : <span className="text-green-600 text-sm">▶</span>}
        <span className="text-gray-700 text-sm">{uploading ? `Envoi… ${progress}%` : "Choisir une vidéo depuis le PC"}</span>
      </label>
      {uploading && <UploadProgressBar percent={progress} label="Envoi de la vidéo…" />}
      {msg && (
        <p className={`text-xs ${msg.includes("✓") || msg.includes("supprimée") ? "text-emerald-400" : "text-red-400"}`}>{msg}</p>
      )}
      {videoUrl && (
        <div className="space-y-2">
          <video src={videoUrl} controls className="w-full max-w-xl rounded-xl border border-gray-200" style={{ maxHeight: 220 }} />
          <button type="button" onClick={handleDelete} className="text-xs text-red-400 hover:text-red-300">
            Supprimer la vidéo
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Formulaire Espace ────────────────────────────────────────────────────────

function FormulaireEspace({ initial, onSave, onCancel, titreForm, autresEspaces }: { initial: EspaceForm; onSave: (d: EspaceForm) => void; onCancel: () => void; titreForm: string; autresEspaces: EspacePersonnalise[] }) {
  const [form, setForm] = useState<EspaceForm>(initial);
  const [refOpen, setRefOpen] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [coverMsg, setCoverMsg] = useState("");
  const adminPassword = useContext(AdminPasswordContext);
  const set = (k: keyof EspaceForm, v: string | string[]) => setForm((f) => ({ ...f, [k]: v }));

  async function uploadEspaceCover(file: File) {
    if (!form.titre.trim()) { setCoverMsg("Saisissez d'abord le nom du domaine."); return; }
    setUploadingCover(true);
    setCoverMsg("Upload en cours…");
    const espaceId = form.titre.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 40);
    const fd = new FormData();
    fd.append("espaceId", espaceId);
    fd.append("file", file);
    try {
      const res = await fetch("/api/admin/upload-espace-cover", {
        method: "POST",
        headers: { "x-admin-password": adminPassword },
        body: fd,
      });
      const data = await res.json();
      if (data.url) { set("image", data.url); setCoverMsg("✓ Photo de couverture enregistrée"); }
      else setCoverMsg(data.error ?? "Erreur upload");
    } catch { setCoverMsg("Erreur réseau"); }
    finally { setUploadingCover(false); }
  }

  async function deleteEspaceCover() {
    if (!form.image) return;
    const espaceId = form.image.split("/").pop()?.replace(/\.[^/.]+$/, "") ?? "";
    await fetch("/api/admin/upload-espace-cover", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", "x-admin-password": adminPassword },
      body: JSON.stringify({ espaceId }),
    }).catch(() => {});
    set("image", "");
    setCoverMsg("");
  }
  const valide = form.titre.trim() && form.domaine;

  function appliquer(ref: typeof REFERENCES_ESPACES[0]) {
    setForm((f) => ({ ...f, titre: ref.titre, domaine: ref.domaine, descriptionCourte: `Accompagnement dans le secteur ${ref.titre.toLowerCase()}.`, descriptionLongue: `Notre programme d'accompagnement ${ref.titre} vous guide de A à Z dans la création et le développement de votre activité.`, avantages: ref.avantages, inclus: ref.inclus }));
    setRefOpen(false);
  }

  function toggleSimilaire(id: string) {
    const curr = form.espacesSimilaires;
    set("espacesSimilaires", curr.includes(id) ? curr.filter((x) => x !== id) : [...curr, id]);
  }

  return (
    <div className="p-6 bg-white border border-green-200 rounded-2xl space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="text-gray-900 font-bold text-lg">{titreForm}</h3>
        <div className="relative">
          <button type="button" onClick={() => setRefOpen(!refOpen)} className="flex items-center gap-2 px-4 py-2 bg-white border border-green-300 text-green-600 text-sm rounded-xl hover:bg-green-100">⚡ Modèle de référence</button>
          {refOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-gray-200 rounded-2xl shadow-2xl z-20 max-h-72 overflow-y-auto">
              <p className="text-gray-700 text-xs font-semibold px-4 pt-3 pb-1">Choisir un accompagnement de référence :</p>
              {REFERENCES_ESPACES.map((ref) => (
                <button key={ref.titre} type="button" onClick={() => appliquer(ref)} className="w-full text-left px-4 py-3 hover:bg-green-50 border-b border-gray-100 last:border-0">
                  <p className="text-gray-900 font-bold text-sm">{ref.titre}</p>
                  <p className="text-gray-700 text-xs font-semibold">{ref.domaine}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div><label className={labelCls}>Nom du domaine <span className="text-green-600">*</span></label><input type="text" value={form.titre} onChange={(e) => set("titre", e.target.value)} className={inputCls} placeholder="Ex : Pressing, Pisciculture..." /></div>
        <div><label className={labelCls}>Secteur <span className="text-green-600">*</span></label>
          <select value={form.domaine} onChange={(e) => set("domaine", e.target.value)} className={selectCls}>
            <option value="" className="bg-white">Choisir...</option>
            {DOMAINES.map((d) => <option key={d} value={d} className="bg-white">{d}</option>)}
          </select>
        </div>
        <div><label className={labelCls}>Clients & entreprises satisfaits</label><input type="number" min="0" value={form.clientsSatisfaits} onChange={(e) => set("clientsSatisfaits", e.target.value)} className={inputCls} /></div>
        <div><label className={labelCls}>Places disponibles <span className="text-green-600">*</span></label><input type="number" min="1" value={form.placesDisponibles} onChange={(e) => set("placesDisponibles", e.target.value)} className={inputCls} /></div>
      </div>

      <div><label className={labelCls}>Description courte (carte)</label><input type="text" value={form.descriptionCourte} onChange={(e) => set("descriptionCourte", e.target.value)} className={inputCls} placeholder="Une phrase résumant le domaine..." /></div>
      <div>
        <label className={labelCls}>Description détaillée (page de détail)</label>
        <RichTextEditor
          value={form.descriptionLongue}
          onChange={(v) => set("descriptionLongue", v)}
          placeholder="Description complète du programme... Vous pouvez ajouter du texte, des listes et des images."
          adminPassword={useContext(AdminPasswordContext)}
          minHeight={120}
        />
      </div>

      <ListeEditable label="Avantages du secteur" values={form.avantages} onChange={(v) => set("avantages", v)} placeholder="Ex : Retour sur investissement rapide..." />
      <ListeEditable label="Ce que comprend l'accompagnement" values={form.inclus} onChange={(v) => set("inclus", v)} placeholder="Ex : Formation, Mise en relation fournisseurs..." />

      {autresEspaces.length > 0 && (
        <div>
          <label className={labelCls}>Espaces similaires</label>
          <div className="flex flex-wrap gap-2">
            {autresEspaces.map((e) => (
              <button key={e.id} type="button" onClick={() => toggleSimilaire(e.id)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${form.espacesSimilaires.includes(e.id) ? "bg-green-600 border-green-500 text-black" : "border-green-200 text-gray-800 hover:border-green-400"}`}>
                {form.espacesSimilaires.includes(e.id) && "✓ "}{e.titre}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Photo de couverture */}
      <div>
        <label className={labelCls}>Photo de couverture <span className="text-gray-700 text-xs font-semibold">(visible sur la fiche accompagnement)</span></label>
        {form.image ? (
          <div className="flex items-center gap-3 p-3 bg-white border border-green-200 rounded-xl">
            <img src={form.image} alt="cover" className="w-16 h-16 object-cover rounded-lg border border-gray-200" />
            <div className="flex-1 min-w-0">
              <p className="text-green-600 text-xs font-medium truncate">{form.image}</p>
            </div>
            <button type="button" onClick={deleteEspaceCover} className="p-1.5 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50"><X size={14} /></button>
          </div>
        ) : (
          <label className={`flex items-center gap-2 px-4 py-3 border-2 border-dashed border-gray-200 hover:border-green-400 rounded-xl cursor-pointer transition-all text-sm text-gray-800 hover:text-green-600 ${uploadingCover ? "opacity-50 pointer-events-none" : ""}`}>
            <ImageIcon size={16} />
            {uploadingCover ? "Upload en cours…" : "Image de couverture (PNG, WebP, JPG, AVIF)"}
            <input type="file" accept="image/png,image/webp,image/jpeg,image/avif,image/gif,.png,.webp,.jpg,.jpeg,.avif,.gif" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadEspaceCover(f); e.target.value = ""; }} />
          </label>
        )}
        {coverMsg && !form.image && <p className={`text-xs mt-1 ${coverMsg.startsWith("✓") ? "text-green-600" : "text-red-400"}`}>{coverMsg}</p>}
      </div>

      <div className="flex gap-3 pt-2">
        <button onClick={() => valide && onSave(form)} disabled={!valide} className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-[#27A827] text-black font-bold rounded-xl text-sm disabled:opacity-40"><Save size={15} /> Enregistrer</button>
        <button onClick={onCancel} className="flex items-center gap-2 px-6 py-3 border border-gray-200 text-gray-700 rounded-xl text-sm hover:bg-green-50"><X size={15} /> Annuler</button>
      </div>
    </div>
  );
}

// ─── Vidéo page Devenir Consultant ───────────────────────────────────────────

function VideoConsultantAdmin() {
  const adminPassword = useContext(AdminPasswordContext);
  const [videoUrl, setVideoUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/consultant-video").then((r) => r.json()).then((d) => setVideoUrl(d.url ?? "")).catch(() => {});
  }, []);

  async function handleUpload(file: File) {
    setUploading(true);
    setProgress(0);
    setMsg("");
    const fd = new FormData();
    fd.append("file", file);
    fd.append("espaceId", "consultant-page");
    try {
      const res = await uploadWithProgress("/api/admin/upload-espace-video", fd, { "x-admin-password": adminPassword }, setProgress);
      const data = await res.data() as { videoUrl?: string; error?: string };
      if (data.videoUrl) {
        await fetch("/api/consultant-video", {
          method: "POST",
          headers: { "x-admin-password": adminPassword, "Content-Type": "application/json" },
          body: JSON.stringify({ url: data.videoUrl }),
        });
        setVideoUrl(data.videoUrl);
        setMsg("Vidéo enregistrée ✓");
      } else {
        setMsg(data.error ?? "Erreur upload");
      }
    } catch {
      setMsg("Erreur réseau");
    }
    setUploading(false);
  }

  async function handleDelete() {
    await fetch("/api/consultant-video", {
      method: "POST",
      headers: { "x-admin-password": adminPassword, "Content-Type": "application/json" },
      body: JSON.stringify({ url: "" }),
    });
    setVideoUrl("");
    setMsg("Vidéo supprimée");
  }

  return (
    <div className="mb-6 p-5 bg-white border border-green-200 rounded-2xl space-y-4">
      <div>
        <h3 className="text-gray-900 font-bold text-base mb-1">Vidéo de présentation — Page Devenir Consultant</h3>
        <p className="text-gray-700 text-xs font-semibold">Visible par tous les visiteurs sur la page &quot;Devenir Consultant&quot;.</p>
      </div>
      <label className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all w-fit ${uploading ? "border-green-300 bg-white" : "border-gray-200 hover:border-green-300 hover:bg-green-50"}`}>
        <input
          type="file"
          accept="video/mp4,video/webm,video/ogg,video/quicktime,.mp4,.webm,.ogg,.mov,.avi,.mkv"
          className="hidden"
          disabled={uploading}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ""; }}
        />
        {uploading
          ? <span className="w-4 h-4 border-2 border-green-300 border-t-[#E8B800] rounded-full animate-spin" />
          : <span className="text-green-600 text-sm">▶</span>}
        <span className="text-gray-700 text-sm">{uploading ? `Envoi… ${progress}%` : "Choisir une vidéo depuis le PC"}</span>
      </label>
      {uploading && <UploadProgressBar percent={progress} label="Envoi de la vidéo…" />}
      {msg && (
        <p className={`text-xs ${msg.includes("✓") || msg.includes("supprimée") ? "text-emerald-400" : "text-red-400"}`}>{msg}</p>
      )}
      {videoUrl && (
        <div className="space-y-2">
          <video src={videoUrl} controls className="w-full max-w-xl rounded-xl border border-gray-200" style={{ maxHeight: 220 }} />
          <button type="button" onClick={handleDelete} className="text-xs text-red-400 hover:text-red-300">Supprimer la vidéo</button>
        </div>
      )}
    </div>
  );
}

// ─── Formulaire Consultant ────────────────────────────────────────────────────

function FormulaireConsultant({ initial, onSave, onCancel, titreForm, espaces }: { initial: ConsultantForm; onSave: (d: ConsultantForm) => void; onCancel: () => void; titreForm: string; espaces: EspacePersonnalise[] }) {
  const [form, setForm] = useState<ConsultantForm>(initial);
  const set = (k: keyof ConsultantForm, v: string | string[]) => setForm((f) => ({ ...f, [k]: v }));
  const valide = form.prenom.trim();

  function toggleDomaine(id: string) {
    const curr = form.domainesIds;
    set("domainesIds", curr.includes(id) ? curr.filter((x) => x !== id) : [...curr, id]);
  }

  return (
    <div className="p-6 bg-white border border-green-200 rounded-2xl space-y-5">
      <h3 className="text-gray-900 font-bold text-lg">{titreForm}</h3>

      <div>
        <label className={labelCls}>Prénom <span className="text-green-600">*</span></label>
        <input type="text" value={form.prenom} onChange={(e) => set("prenom", e.target.value)} className={inputCls} placeholder="Ex : Jean, Marie, Paul..." autoFocus />
        <p className="text-gray-700 text-xs font-semibold mt-1">Seul le prénom sera visible sur le site.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div><label className={labelCls}>Clients accompagnés</label><input type="number" min="0" value={form.clientsAccompa} onChange={(e) => set("clientsAccompa", e.target.value)} className={inputCls} /></div>
        <div><label className={labelCls}>Entreprises accompagnées</label><input type="number" min="0" value={form.entreprisesAccompa} onChange={(e) => set("entreprisesAccompa", e.target.value)} className={inputCls} /></div>
      </div>

      {espaces.length > 0 && (
        <div>
          <label className={labelCls}>Domaines d&apos;expertise</label>
          <div className="flex flex-wrap gap-2">
            {espaces.map((e) => (
              <button key={e.id} type="button" onClick={() => toggleDomaine(e.id)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${form.domainesIds.includes(e.id) ? "bg-green-600 border-green-500 text-black" : "border-green-200 text-gray-800 hover:border-green-400"}`}>
                {form.domainesIds.includes(e.id) && "✓ "}{e.titre}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button onClick={() => valide && onSave(form)} disabled={!valide} className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-[#27A827] text-black font-bold rounded-xl text-sm disabled:opacity-40"><Save size={15} /> Enregistrer</button>
        <button onClick={onCancel} className="flex items-center gap-2 px-6 py-3 border border-gray-200 text-gray-700 rounded-xl text-sm hover:bg-green-50"><X size={15} /> Annuler</button>
      </div>
    </div>
  );
}

// ─── Modal candidature ────────────────────────────────────────────────────────

function ModalDemande({ demande, onClose, onValider, onRejeter }: { demande: DemandeAccompagnement; onClose: () => void; onValider: (id: string, note: string) => void; onRejeter: (id: string, note: string) => void }) {
  const store = useAccompagnementStore();
  const client = store.getClientById(demande.clientId);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white border border-gray-200 rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-gray-900 font-bold text-xl">{demande.espaceTitre}</h2>
            <p className="text-gray-700 text-xs font-semibold mt-1">{new Date(demande.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
          </div>
          <button onClick={onClose} className="text-gray-800 hover:text-white text-2xl leading-none">×</button>
        </div>
        <div className="p-6 space-y-5">
          {client && (
            <div className="p-5 bg-white border border-green-200 rounded-xl">
              <h3 className="text-gray-900 font-bold mb-4 flex items-center gap-2"><Users size={16} className="text-green-600" />Candidat</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[["Nom", client.nom], ["Email", client.email], ["Téléphone", client.telephone], ["Ville", client.ville], ["Capital", client.capital || "—"]].map(([l, v]) => (
                  <div key={l}><p className="text-gray-700 text-xs font-semibold">{l}</p><p className="text-gray-900 font-bold">{v}</p></div>
                ))}
              </div>
            </div>
          )}
          <div className="p-4 bg-white border border-green-100 rounded-xl">
            <p className="text-gray-700 text-xs font-semibold mb-2">Message</p>
            <p className="text-gray-800 text-sm leading-relaxed">{demande.message}</p>
          </div>
          <div className="flex items-center gap-3"><span className="text-gray-800 text-sm font-semibold">Statut :</span><StatutBadge statut={demande.statut} /></div>
          <div>
            <label className={labelCls}>Note pour le candidat</label>
            <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} className={`${inputCls} resize-none`} placeholder="Message qui sera communiqué au candidat..." />
          </div>
          <div className="flex gap-3">
            <button onClick={() => action("valider")} disabled={loading || demande.statut === "validee"} className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-gray-900 font-bold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle size={16} />} Valider
            </button>
            <button onClick={() => action("rejeter")} disabled={loading || demande.statut === "rejetee"} className="flex-1 py-3 bg-red-700 hover:bg-red-600 text-gray-900 font-bold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <XCircle size={16} />} Rejeter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

// ─── Constantes catalogue ─────────────────────────────────────────────────────

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

type FaqItemForm = { q: string; a: string };
type AvisClientForm = { nom: string; note: number; texte: string };

const CTA_OPTIONS = [
  { label: "Acheter maintenant", icon: "🛒" },
  { label: "Accéder au livre", icon: "📖" },
  { label: "Profiter de l'offre", icon: "⚡" },
  { label: "Profiter de la promotion", icon: "🎁" },
  { label: "Télécharger maintenant", icon: "⬇️" },
  { label: "Je veux ce guide", icon: "🎯" },
];

type SectionForm = { titre: string; contenu: string };

type EbookForm = {
  title: string; description: string; category: string;
  price: string; originalPrice: string; pages: string;
  rating: string; reviews: string; bestseller: boolean; new: boolean;
  cover: string; banner: string; downloadUrl: string;
  ctaLabel: string;
  ctaAnimation: "clignote" | "respire" | "pulse" | "bounce" | "shimmer" | "glow" | "wiggle" | "none";
  reviewCardSize: "small" | "medium" | "large";
  faq: FaqItemForm[];
  avisClients: AvisClientForm[];
  sections: SectionForm[];
  commentAcheterUrl: string;
  whatsappUrl: string;
  coverLayout: "full" | "overlay" | "split" | "frame";
  pdfPreviewUrl: string;
  promoEndDate: string;
  promoCyclique: boolean;
  promoDureeHeures: string;
  vendusAffiche: string;
  placesRestantesBloquees: string;
  cardBgColor: string;
  cardTextColor: string;
  priceColor: string;
  ctaBgColor: string;
  ctaTextColor: string;
  bandeauColor: string;
  coverHeight: string;
  coverObjectPosition: string;
  coverObjectFit: "cover" | "contain";
  communityBgColor: string;
  communityTextColor: string;
  audioUrl: string;
  videoUrl: string;
  // SEO
  metaTitle: string;
  metaDescription: string;
  keywords: string;
  customSlug: string;
  ogImage: string;
};
const EBOOK_VIDE: EbookForm = {
  title: "", description: "", category: "", price: "", originalPrice: "",
  pages: "80", rating: "4.5", reviews: "0", bestseller: false, new: false,
  cover: "", banner: "", downloadUrl: "", ctaLabel: "", ctaAnimation: "pulse", reviewCardSize: "medium",
  faq: [], avisClients: [], sections: [], commentAcheterUrl: "",
  whatsappUrl: "", coverLayout: "full", pdfPreviewUrl: "", promoEndDate: "",
  promoCyclique: false, promoDureeHeures: "24",
  vendusAffiche: "", placesRestantesBloquees: "",
  cardBgColor: "", cardTextColor: "", priceColor: "", ctaBgColor: "", ctaTextColor: "", bandeauColor: "",
  coverHeight: "260", coverObjectPosition: "center", coverObjectFit: "cover",
  communityBgColor: "", communityTextColor: "",
  audioUrl: "", videoUrl: "",
  metaTitle: "", metaDescription: "", keywords: "", customSlug: "", ogImage: "",
};

type FormationForm = {
  titre: string; description: string; categorie: string;
  instructeur: string; duree: string; modules: string;
  prix: string; prixOriginal: string;
  niveau: "Débutant" | "Intermédiaire" | "Avancé";
  note: string; apprenants: string; badge: string;
  mode: "online" | "presentiel" | "both";
  videoPreview: string;
  videoUrl: string;
  cover: string;
  faq: FaqItemForm[];
  avisClients: AvisClientForm[];
  sections: SectionForm[];
  commentAcheterUrl: string;
  whatsappUrl: string;
  ctaAnimation: "pulse" | "bounce" | "shimmer" | "glow" | "wiggle" | "none";
  reviewCardSize: "small" | "medium" | "large";
  promoEndDate: string;
  promoCyclique: boolean;
  promoDureeHeures: string;
  vendusAffiche: string;
  placesRestantesBloquees: string;
  cardBgColor: string;
  cardTextColor: string;
  priceColor: string;
  ctaBgColor: string;
  ctaTextColor: string;
  // SEO
  metaTitle: string;
  metaDescription: string;
  keywords: string;
  customSlug: string;
  ogImage: string;
};
const FORMATION_VIDE: FormationForm = {
  titre: "", description: "", categorie: "", instructeur: "SMART LIFE",
  duree: "6h", modules: "5", prix: "", prixOriginal: "",
  niveau: "Débutant", note: "4.5", apprenants: "0", badge: "", mode: "both",
  videoPreview: "", videoUrl: "", cover: "", faq: [], avisClients: [], sections: [], commentAcheterUrl: "", whatsappUrl: "",
  ctaAnimation: "pulse", reviewCardSize: "medium", promoEndDate: "",
  promoCyclique: false, promoDureeHeures: "24",
  vendusAffiche: "", placesRestantesBloquees: "",
  cardBgColor: "", cardTextColor: "", priceColor: "", ctaBgColor: "", ctaTextColor: "",
  metaTitle: "", metaDescription: "", keywords: "", customSlug: "", ogImage: "",
};

// ─── Composant Upload PDF ─────────────────────────────────────────────────────

function UploadPDF({ ebookId, ebookTitle, uploaded, onDone }: {
  ebookId: string;
  ebookTitle: string;
  uploaded: boolean;
  onDone: () => void;
}) {
  const adminPassword = useAdminPassword();
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState(0);

  async function handleFile(file: File) {
    if (file.type !== "application/pdf") {
      setStatus("error");
      setMessage("Le fichier doit être un PDF.");
      return;
    }
    if (file.size > 1300 * 1024 * 1024) {
      setStatus("error");
      setMessage("Fichier trop lourd (max 1,3 Go).");
      return;
    }
    setStatus("uploading");
    setProgress(0);
    setMessage("");
    const form = new FormData();
    form.append("ebookId", ebookId);
    form.append("file", file);
    try {
      const res = await uploadWithProgress("/api/admin/upload", form, { "x-admin-password": adminPassword }, setProgress);
      const data = await res.data() as { success?: boolean; error?: string };
      if (res.ok && data.success) {
        setStatus("success");
        setMessage("PDF uploadé avec succès !");
        onDone();
      } else {
        setStatus("error");
        setMessage(data.error || "Erreur lors de l'upload.");
      }
    } catch {
      setStatus("error");
      setMessage("Erreur réseau. Réessayez.");
    }
  }

  async function handleDelete() {
    if (!confirm(`Supprimer le PDF de "${ebookTitle}" ?`)) return;
    setStatus("uploading");
    try {
      const res = await fetch("/api/admin/upload", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", "x-admin-password": adminPassword },
        body: JSON.stringify({ ebookId }),
      });
      if (res.ok) { setStatus("idle"); setMessage(""); onDone(); }
      else { setStatus("error"); setMessage("Impossible de supprimer."); }
    } catch {
      setStatus("error"); setMessage("Erreur réseau.");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
      />

      <div className="flex items-center gap-2 flex-wrap">
        {uploaded ? (
          <>
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-black border border-gray-600 text-emerald-400 text-xs font-bold rounded-xl">
              <FileText size={12} /> PDF en ligne
            </span>
            <button
              onClick={() => inputRef.current?.click()}
              disabled={status === "uploading"}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-black border border-gray-600 text-blue-400 text-xs rounded-xl hover:bg-gray-900 transition-all disabled:opacity-50"
            >
              {status === "uploading" ? <Loader2 size={11} className="animate-spin" /> : <Upload size={11} />}
              Remplacer
            </button>
            <button
              onClick={handleDelete}
              disabled={status === "uploading"}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-black border border-gray-600 text-red-400 text-xs rounded-xl hover:bg-gray-900 transition-all disabled:opacity-50"
            >
              <Trash2 size={11} /> Supprimer
            </button>
          </>
        ) : (
          <button
            onClick={() => inputRef.current?.click()}
            disabled={status === "uploading"}
            className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-green-500/40 hover:border-green-500 hover:bg-green-900/10 text-green-400 text-sm rounded-xl transition-all disabled:opacity-50"
          >
            {status === "uploading"
              ? <><Loader2 size={14} className="animate-spin" /> Upload en cours...</>
              : <><Upload size={14} /> Uploader le PDF depuis mon PC</>
            }
          </button>
        )}
      </div>

      {status === "uploading" && <UploadProgressBar percent={progress} label="Envoi du PDF…" />}
      {message && (
        <p className={`text-xs ${status === "success" ? "text-emerald-400" : "text-red-400"}`}>
          {message}
        </p>
      )}
    </div>
  );
}

// ─── Composant Upload Couverture Ebook ───────────────────────────────────────

function UploadCover({ ebookId, currentCover, onUploaded, onDeleted, apiPath = "/api/admin/upload-cover", label = "Uploader la photo de couverture" }: {
  ebookId: string;
  currentCover: string;
  onUploaded: (url: string) => void;
  onDeleted: () => void;
  apiPath?: string;
  label?: string;
}) {
  const adminPassword = useAdminPassword();
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState(0);
  const [localPreview, setLocalPreview] = useState<string>("");
  const isLocal = /^\/(covers|banners)\//.test(currentCover);

  async function handleFile(file: File) {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    const ALLOWED = ["jpg", "jpeg", "png", "webp", "avif", "gif"];
    if (!ALLOWED.includes(ext)) {
      setStatus("error");
      setMessage("Format non supporté. Utilisez JPG, PNG, WebP ou AVIF.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setStatus("error");
      setMessage("Image trop lourde (max 10 Mo).");
      return;
    }
    const preview = URL.createObjectURL(file);
    setLocalPreview(preview);
    setStatus("uploading");
    setProgress(0);
    setMessage("");
    const form = new FormData();
    form.append("ebookId", ebookId);
    form.append("file", file);
    try {
      const res = await uploadWithProgress(apiPath, form, { "x-admin-password": adminPassword }, setProgress);
      const data = await res.data() as { success?: boolean; url?: string; error?: string };
      if (res.ok && data.success) {
        setStatus("success");
        setMessage("Image uploadée !");
        URL.revokeObjectURL(preview);
        setLocalPreview("");
        onUploaded(`${data.url!}?v=${Date.now()}`);
      } else {
        URL.revokeObjectURL(preview);
        setLocalPreview("");
        setStatus("error");
        setMessage(data.error || "Erreur lors de l'upload.");
      }
    } catch {
      URL.revokeObjectURL(preview);
      setLocalPreview("");
      setStatus("error");
      setMessage("Erreur réseau. Réessayez.");
    }
  }

  async function handleDelete() {
    if (!confirm("Supprimer l'image ?")) return;
    setStatus("uploading");
    try {
      const res = await fetch(apiPath, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", "x-admin-password": adminPassword },
        body: JSON.stringify({ ebookId }),
      });
      if (res.ok) { setStatus("idle"); setMessage(""); onDeleted(); }
      else { setStatus("error"); setMessage("Impossible de supprimer."); }
    } catch {
      setStatus("error"); setMessage("Erreur réseau.");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif,image/gif,.jpg,.jpeg,.png,.webp,.avif,.gif"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
      />

      <div className="flex items-start gap-3">
        {/* Aperçu — carré pour couverture, paysage pour bannière */}
        <div className={`rounded-lg border border-green-200 bg-white flex items-center justify-center overflow-hidden flex-shrink-0 ${apiPath.includes("banner") ? "w-40 h-[58px]" : "w-14 h-14"}`}>
          {(localPreview || currentCover) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={localPreview || currentCover}
              src={localPreview || currentCover}
              alt={apiPath.includes("banner") ? "Bannière" : "Couverture"}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              onLoad={(e) => { (e.target as HTMLImageElement).style.display = ""; }}
            />
          ) : (
            <ImageIcon size={apiPath.includes("banner") ? 16 : 20} className="text-gray-900" />
          )}
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            {isLocal && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-black border border-gray-600 text-emerald-400 text-xs font-bold rounded-xl">
                <ImageIcon size={10} /> Photo en ligne
              </span>
            )}
            <button
              onClick={() => inputRef.current?.click()}
              disabled={status === "uploading"}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl transition-all disabled:opacity-50 ${
                isLocal
                  ? "bg-black border border-gray-600 text-blue-400 hover:bg-gray-900"
                  : "border-2 border-dashed border-green-300 hover:border-green-500 hover:bg-green-50 text-green-600"
              }`}
            >
              {status === "uploading"
                ? <><Loader2 size={11} className="animate-spin" /> Upload…</>
                : isLocal
                ? <><Upload size={11} /> Remplacer</>
                : <><Upload size={11} /> {label}</>
              }
            </button>
            {isLocal && (
              <button
                onClick={handleDelete}
                disabled={status === "uploading"}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-black border border-gray-600 text-red-400 text-xs rounded-xl hover:bg-gray-900 transition-all disabled:opacity-50"
              >
                <Trash2 size={11} /> Supprimer
              </button>
            )}
          </div>
          {status === "uploading" && <UploadProgressBar percent={progress} label="Envoi de la couverture…" />}
          {message && (
            <p className={`text-xs ${status === "success" ? "text-emerald-400" : "text-red-400"}`}>
              {message}
            </p>
          )}
          {!isLocal && !currentCover && (
            <p className="text-gray-700 text-xs font-semibold">JPG, PNG, WebP · max 10 Mo</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Composant Upload Vidéo Formation ────────────────────────────────────────

function UploadVideo({ formationId, videoId, uploaded, onUploaded, onDeleted }: {
  formationId: string;
  videoId: string;
  uploaded: boolean;
  onUploaded: () => void;
  onDeleted: () => void;
}) {
  const adminPassword = useAdminPassword();
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState(0);

  async function handleFile(file: File) {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    const ALLOWED = ["mp4", "webm", "ogg", "ogv", "mov", "avi", "mkv"];
    if (!ALLOWED.includes(ext)) {
      setStatus("error");
      setMessage("Format non supporté. Utilisez MP4, WebM, MOV, AVI ou MKV.");
      return;
    }
    setStatus("uploading");
    setProgress(0);
    setMessage("");
    const form = new FormData();
    form.append("formationId", formationId);
    form.append("videoId", videoId);
    form.append("file", file);
    try {
      const res = await uploadWithProgress("/api/admin/upload-video", form, { "x-admin-password": adminPassword }, setProgress);
      const data = await res.data() as { success?: boolean; error?: string };
      if (res.ok && data.success) {
        setStatus("success");
        setMessage("Vidéo uploadée !");
        onUploaded();
      } else {
        setStatus("error");
        setMessage(data.error || "Erreur lors de l'upload.");
      }
    } catch {
      setStatus("error");
      setMessage("Erreur réseau. Réessayez.");
    }
  }

  async function handleDelete() {
    if (!confirm("Supprimer la vidéo locale ?")) return;
    setStatus("uploading");
    try {
      const res = await fetch("/api/admin/upload-video", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", "x-admin-password": adminPassword },
        body: JSON.stringify({ formationId, videoId }),
      });
      if (res.ok) { setStatus("idle"); setMessage(""); onDeleted(); }
      else { setStatus("error"); setMessage("Impossible de supprimer."); }
    } catch {
      setStatus("error"); setMessage("Erreur réseau.");
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/webm,video/ogg,video/quicktime,video/x-msvideo,video/x-matroska,.mp4,.webm,.ogg,.ogv,.mov,.avi,.mkv"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
      />
      <div className="flex items-center gap-2 flex-wrap">
        {uploaded ? (
          <>
            <span className="flex items-center gap-1 px-2 py-1 bg-green-900/30 border border-green-700/40 text-green-300 text-xs font-bold rounded-lg">
              <Play size={10} /> Vidéo locale
            </span>
            <button
              onClick={() => inputRef.current?.click()}
              disabled={status === "uploading"}
              className="flex items-center gap-1 px-2 py-1 bg-blue-900/20 border border-blue-700/30 text-blue-400 text-xs rounded-lg hover:bg-blue-900/40 transition-all disabled:opacity-50"
            >
              {status === "uploading" ? <Loader2 size={10} className="animate-spin" /> : <Upload size={10} />}
              Remplacer
            </button>
            <button
              onClick={handleDelete}
              disabled={status === "uploading"}
              className="flex items-center gap-1 px-2 py-1 bg-red-900/20 border border-red-700/30 text-red-400 text-xs rounded-lg hover:bg-red-900/40 transition-all disabled:opacity-50"
            >
              <Trash2 size={10} /> Supprimer
            </button>
          </>
        ) : (
          <button
            onClick={() => inputRef.current?.click()}
            disabled={status === "uploading"}
            className="flex items-center gap-1.5 px-3 py-1 border border-dashed border-green-500/40 hover:border-green-500 hover:bg-green-900/10 text-green-400 text-xs rounded-lg transition-all disabled:opacity-50"
          >
            {status === "uploading"
              ? <><Loader2 size={11} className="animate-spin" /> Upload en cours…</>
              : <><Upload size={11} /> Uploader depuis PC</>
            }
          </button>
        )}
      </div>
      {status === "uploading" && <UploadProgressBar percent={progress} label="Envoi de la vidéo…" />}
      {message && (
        <p className={`text-xs ${status === "success" ? "text-emerald-400" : "text-red-400"}`}>
          {message}
        </p>
      )}
    </div>
  );
}

// ─── Sauvegarde du lien Drive côté serveur ────────────────────────────────────

async function saveDriveUrlToServer(ebookId: string, driveUrl: string, adminPassword: string) {
  await fetch("/api/admin/ebook-urls", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-password": adminPassword,
    },
    body: JSON.stringify({ ebookId, driveUrl }),
  });
}

// ─── Éditeur FAQ ──────────────────────────────────────────────────────────────

function FAQEditor({ value, onChange }: { value: FaqItemForm[]; onChange: (v: FaqItemForm[]) => void }) {
  return (
    <div>
      <label className={labelCls}>FAQ <span className="text-gray-700 text-xs font-semibold">(questions fréquentes)</span></label>
      <div className="space-y-3">
        {value.map((item, i) => (
          <div key={i} className="p-3 bg-white border border-green-200 rounded-xl space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={item.q}
                onChange={(e) => { const n = [...value]; n[i] = { ...n[i], q: e.target.value }; onChange(n); }}
                className={inputCls}
                placeholder={`Question ${i + 1}...`}
              />
              <button type="button" onClick={() => onChange(value.filter((_, idx) => idx !== i))} className="p-2 text-gray-800 hover:text-red-400 flex-shrink-0"><X size={14} /></button>
            </div>
            <textarea
              value={item.a}
              onChange={(e) => { const n = [...value]; n[i] = { ...n[i], a: e.target.value }; onChange(n); }}
              className={inputCls + " resize-none"}
              placeholder="Réponse..."
              rows={2}
            />
          </div>
        ))}
        <button type="button" onClick={() => onChange([...value, { q: "", a: "" }])} className="flex items-center gap-1.5 text-green-600 text-xs hover:text-[#27A827] mt-1"><Plus size={13} /> Ajouter une question FAQ</button>
      </div>
    </div>
  );
}

// ─── Éditeur Avis Clients ─────────────────────────────────────────────────────

function AvisEditor({ value, onChange }: { value: AvisClientForm[]; onChange: (v: AvisClientForm[]) => void }) {
  return (
    <div>
      <label className={labelCls}>Avis clients <span className="text-gray-700 text-xs font-semibold">(ajoutez des témoignages)</span></label>
      <div className="space-y-3">
        {value.map((avis, i) => (
          <div key={i} className="p-3 bg-white border border-green-200 rounded-xl space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={avis.nom}
                onChange={(e) => { const n = [...value]; n[i] = { ...n[i], nom: e.target.value }; onChange(n); }}
                className={inputCls}
                placeholder="Nom du client..."
              />
              <select
                value={avis.note}
                onChange={(e) => { const n = [...value]; n[i] = { ...n[i], note: Number(e.target.value) }; onChange(n); }}
                className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-yellow-400 text-sm focus:outline-none flex-shrink-0 w-24"
              >
                {[5,4,3,2,1].map(n => <option key={n} value={n} className="bg-white">{"★".repeat(n)} {n}/5</option>)}
              </select>
              <button type="button" onClick={() => onChange(value.filter((_, idx) => idx !== i))} className="p-2 text-gray-800 hover:text-red-400 flex-shrink-0"><X size={14} /></button>
            </div>
            <textarea
              value={avis.texte}
              onChange={(e) => { const n = [...value]; n[i] = { ...n[i], texte: e.target.value }; onChange(n); }}
              className={inputCls + " resize-none"}
              placeholder="Témoignage du client..."
              rows={2}
            />
          </div>
        ))}
        <button type="button" onClick={() => onChange([...value, { nom: "", note: 5, texte: "" }])} className="flex items-center gap-1.5 text-green-600 text-xs hover:text-[#27A827] mt-1"><Plus size={13} /> Ajouter un avis</button>
      </div>
    </div>
  );
}

// ─── Upload PDF Aperçu ────────────────────────────────────────────────────────

function PdfPreviewUpload({ ebookId, adminPassword, currentUrl, onDone }: {
  ebookId: string;
  adminPassword: string;
  currentUrl: string;
  onDone: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [msg, setMsg] = useState("");

  async function handleFile(file: File) {
    if (file.type !== "application/pdf") { setMsg("Le fichier doit être un PDF."); return; }
    setUploading(true);
    setProgress(0);
    setMsg("");
    const fd = new FormData();
    fd.append("ebookId", ebookId);
    fd.append("file", file);
    try {
      const res = await uploadWithProgress("/api/admin/upload-pdf-preview", fd, { "x-admin-password": adminPassword }, setProgress);
      const data = await res.data() as { previewUrl?: string; error?: string };
      if (res.ok && data.previewUrl) {
        onDone(data.previewUrl);
        setMsg("✓ Aperçu PDF uploadé — max 6 pages visibles pour les visiteurs");
      } else {
        setMsg((data as { error?: string }).error || "Erreur upload");
      }
    } catch {
      setMsg("Erreur réseau");
    }
    setUploading(false);
  }

  return (
    <div>
      <label className={labelCls}><FileText size={13} className="inline mr-1" />PDF Aperçu <span className="text-gray-700 text-xs font-semibold">(les visiteurs verront max 6 pages, sans pouvoir télécharger)</span></label>
      <div className="space-y-2">
        <label className={`flex items-center gap-2 px-4 py-3 rounded-xl border cursor-pointer transition-all w-fit ${uploading ? "border-green-300 bg-white" : "border-dashed border-green-300 hover:border-green-500 hover:bg-green-50 text-green-600"}`}>
          <input type="file" accept="application/pdf" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
          {uploading
            ? <Loader2 size={14} className="animate-spin text-green-500" />
            : <FileText size={14} />}
          <span className="text-sm">{uploading ? "Upload en cours…" : currentUrl ? "Changer le PDF aperçu" : "Uploader un PDF aperçu"}</span>
        </label>
        {uploading && <UploadProgressBar percent={progress} label="Envoi du PDF aperçu…" />}
        {msg && <p className={`text-xs ${msg.startsWith("✓") ? "text-emerald-400" : "text-red-400"}`}>{msg}</p>}
        {currentUrl && !msg && !uploading && <p className="text-emerald-400 text-xs">✓ PDF aperçu configuré</p>}
      </div>
    </div>
  );
}

// ─── Éditeur Sections/Onglets ─────────────────────────────────────────────────

function SectionsEditor({ value, onChange, adminPassword }: { value: SectionForm[]; onChange: (v: SectionForm[]) => void; adminPassword?: string }) {
  return (
    <div>
      <label className={labelCls}>Onglets de description <span className="text-gray-700 text-xs font-semibold">(chaque onglet = un contenu supplémentaire)</span></label>
      <div className="space-y-3">
        {value.map((section, i) => (
          <div key={i} className="p-4 bg-white border border-green-200 rounded-xl space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={section.titre}
                onChange={(e) => { const n = [...value]; n[i] = { ...n[i], titre: e.target.value }; onChange(n); }}
                className={inputCls}
                placeholder={`Titre de l'onglet ${i + 1} (ex: Programme, Bonus, À propos...)`}
              />
              <button type="button" onClick={() => onChange(value.filter((_, idx) => idx !== i))} className="p-2 text-gray-800 hover:text-red-400 flex-shrink-0"><X size={14} /></button>
            </div>
            <RichTextEditor
              value={section.contenu}
              onChange={(v) => { const n = [...value]; n[i] = { ...n[i], contenu: v }; onChange(n); }}
              placeholder="Contenu de cet onglet..."
              adminPassword={adminPassword || ""}
              minHeight={100}
            />
          </div>
        ))}
        <button type="button" onClick={() => onChange([...value, { titre: "", contenu: "" }])} className="flex items-center gap-1.5 text-green-600 text-xs hover:text-[#27A827] mt-1"><Plus size={13} /> Ajouter un onglet de description</button>
      </div>
    </div>
  );
}

// ─── Formulaire Ebook ─────────────────────────────────────────────────────────

const WIZARD_STEPS = [
  { id: 1, label: "Infos de base",    icon: "📝" },
  { id: 2, label: "Prix & Fichiers",  icon: "💰" },
  { id: 3, label: "Apparence",        icon: "🎨" },
  { id: 4, label: "Contenu avancé",   icon: "📚" },
  { id: 5, label: "SEO",              icon: "🔍" },
];

function FormulaireEbook({
  initial, onSave, onCancel, titreForm, adminPassword, ebookId, extraCategories = [],
}: {
  initial: EbookForm;
  onSave: (d: EbookForm) => void;
  onCancel: () => void;
  titreForm: string;
  adminPassword?: string;
  ebookId?: string;
  extraCategories?: string[];
}) {
  const adminCtxPwd = useContext(AdminPasswordContext);
  const [form, setForm] = useState<EbookForm>(initial);
  const [step, setStep] = useState(1);
  const [uploadingHtb, setUploadingHtb] = useState(false);
  const [htbProgress, setHtbProgress] = useState(0);
  const [uploadingPV, setUploadingPV] = useState(false);
  const [pvProgress, setPvProgress] = useState(0);
  const [pdfUploaded, setPdfUploaded] = useState(!!ebookId);
  const [seoGenerating, setSeoGenerating] = useState(false);
  const [seoMsg, setSeoMsg] = useState("");
  const [uploadingOg, setUploadingOg] = useState(false);
  const [ogMsg, setOgMsg] = useState("");

  useEffect(() => {
    const rawId = ebookId || "";
    const pid = rawId.startsWith("static-") ? rawId.slice(7) : rawId;
    if (!pid) return;
    const pwd = adminCtxPwd || adminPassword || "";
    fetch("/api/admin/upload", { headers: { "x-admin-password": pwd } })
      .then((r) => r.json())
      .then((data: { uploaded?: string[] }) => {
        setPdfUploaded(!!(data.uploaded ?? []).includes(pid));
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ebookId]);

  const set = <K extends keyof EbookForm>(k: K, v: EbookForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const draftKey = `ebook-wizard-draft-${ebookId || "new"}`;

  // Restaurer le brouillon uniquement pour les nouveaux ebooks
  useEffect(() => {
    if (!ebookId) {
      try {
        const saved = localStorage.getItem(draftKey);
        if (saved) setForm(JSON.parse(saved));
      } catch { /* ignore */ }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-save à chaque modification
  useEffect(() => {
    if (!ebookId) localStorage.setItem(draftKey, JSON.stringify(form));
  }, [form, draftKey, ebookId]);

  function clearDraft() { localStorage.removeItem(draftKey); }

  async function uploadHowToBuy(file: File) {
    if (!adminPassword) return;
    setUploadingHtb(true);
    setHtbProgress(0);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await uploadWithProgress("/api/admin/upload-how-to-buy", fd, { "x-admin-password": adminPassword }, setHtbProgress);
      const data = await res.data() as { url?: string };
      if (data.url) set("commentAcheterUrl", data.url);
    } finally { setUploadingHtb(false); }
  }

  async function uploadProductVideo(file: File) {
    if (!adminPassword) return;
    setUploadingPV(true);
    setPvProgress(0);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await uploadWithProgress("/api/admin/upload-product-video", fd, { "x-admin-password": adminPassword }, setPvProgress);
      const data = await res.data() as { url?: string };
      if (data.url) set("videoUrl", data.url);
    } finally { setUploadingPV(false); }
  }

  async function generateSeo() {
    const pwd = adminCtxPwd || adminPassword || "";
    setSeoGenerating(true);
    setSeoMsg("");
    try {
      const res = await fetch("/api/admin/generate-seo", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-password": pwd },
        body: JSON.stringify({ title: form.title, description: form.description, category: form.category, price: parseInt(form.price) || 0, type: "ebook" }),
      });
      const data = await res.json() as { metaTitle?: string; metaDescription?: string; customSlug?: string; keywords?: string; error?: string };
      if (data.error) { setSeoMsg("Erreur : " + data.error); return; }
      if (data.metaTitle) set("metaTitle", data.metaTitle);
      if (data.metaDescription) set("metaDescription", data.metaDescription);
      if (data.customSlug) set("customSlug", data.customSlug);
      if (data.keywords) set("keywords", data.keywords);
      setSeoMsg("✓ SEO généré avec succès !");
    } catch { setSeoMsg("Erreur réseau"); }
    finally { setSeoGenerating(false); }
  }

  async function uploadOgImage(file: File) {
    const pwd = adminCtxPwd || adminPassword || "";
    setUploadingOg(true);
    setOgMsg("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload-og-image", { method: "POST", headers: { "x-admin-password": pwd }, body: fd });
      const data = await res.json() as { url?: string; error?: string };
      if (data.url) { set("ogImage", data.url); setOgMsg("✓ Image OG uploadée"); }
      else setOgMsg(data.error || "Erreur upload");
    } catch { setOgMsg("Erreur réseau"); }
    finally { setUploadingOg(false); }
  }

  const step1Valid = !!(form.title.trim() && form.description.trim() && form.category);
  const priceError = (form.price && form.originalPrice && (parseInt(form.price) || 0) >= (parseInt(form.originalPrice) || 0))
    ? "Le prix de vente doit être inférieur au prix d'origine (barré)."
    : null;
  const allValid   = !!(step1Valid && form.price && pdfUploaded && form.whatsappUrl.trim());
  const effectiveId = ebookId || (form.title ? form.title.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").slice(0, 40) : "preview");
  const pdfId = effectiveId.startsWith("static-") ? effectiveId.slice(7) : effectiveId;

  return (
    <div className="bg-white border border-green-200 rounded-2xl overflow-hidden">

      {/* ── En-tête + barre de progression ── */}
      <div className="px-6 pt-5 pb-4 border-b border-green-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-gray-900 font-bold text-base">{titreForm}</h3>
          <button
            onClick={() => { clearDraft(); onCancel(); }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-xl text-sm transition-colors"
          >
            <X size={14} /> Annuler
          </button>
        </div>

        <div className="flex items-center">
          {WIZARD_STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center flex-1">
              <button
                type="button"
                onClick={() => {
                  if (s.id < step) setStep(s.id);
                  else if (s.id === 2 && step1Valid) setStep(2);
                  else if (s.id >= 3 && step1Valid) setStep(s.id);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  step === s.id
                    ? "bg-green-600 text-black"
                    : s.id < step
                    ? "text-green-700 hover:bg-green-50"
                    : "text-gray-400 cursor-default"
                }`}
              >
                <span>{s.icon}</span>
                <span className="hidden sm:inline">{s.label}</span>
                <span className="sm:hidden font-mono">{s.id}</span>
              </button>
              {i < WIZARD_STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1 rounded-full transition-colors ${step > s.id ? "bg-green-500" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Contenu de l'étape ── */}
      <div className="p-6 space-y-5">

        {/* ───── ÉTAPE 1 : Infos de base ───── */}
        {step === 1 && (<>
          <div>
            <label className={labelCls}>Titre <span className="text-green-600">*</span></label>
            <input type="text" value={form.title} onChange={(e) => set("title", e.target.value)} className={inputCls} placeholder="Guide pratique : ..." autoFocus />
          </div>

          <div>
            <label className={labelCls}>Description <span className="text-green-600">*</span></label>
            <RichTextEditor
              value={form.description}
              onChange={(v) => set("description", v)}
              placeholder="Description complète de l'ebook..."
              adminPassword={adminCtxPwd}
              minHeight={100}
            />
          </div>

          <div>
            <label className={labelCls}>Catégorie <span className="text-green-600">*</span> <span className="text-gray-700 text-xs font-semibold">(tapez pour créer)</span></label>
            <input
              type="text"
              list="ebook-categories-list"
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
              className={inputCls}
              placeholder="Choisir ou saisir une catégorie..."
            />
            <datalist id="ebook-categories-list">
              {[...EBOOK_CATEGORIES, ...extraCategories].filter((v, i, a) => a.indexOf(v) === i).map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>

          <div>
            <label className={labelCls}><ImageIcon size={13} className="inline mr-1" />Image de couverture <span className="text-gray-500 text-xs font-normal">(affichée sur le catalogue)</span></label>
            <input type="text" value={form.cover} onChange={(e) => set("cover", e.target.value)} className={inputCls} placeholder="https://... ou uploader ci-dessous" />
            <div className="mt-2">
              {form.title ? (
                <UploadCover ebookId={effectiveId} currentCover={form.cover} onUploaded={(url) => set("cover", url)} onDeleted={() => set("cover", "")} />
              ) : (
                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">⚠ Saisissez d&apos;abord le titre pour activer l&apos;upload de la couverture.</p>
              )}
            </div>
            {form.cover && (<>
              {/* ── Sélecteur position + fit ── */}
              <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
                <p className="text-gray-700 text-xs font-semibold">Cadrage de la photo de couverture</p>

                {/* Position 3×3 */}
                <div className="flex gap-4 items-start">
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Position du sujet</p>
                    <div className="grid grid-cols-3 gap-1 w-28">
                      {([
                        ["top left","↖"],["top center","↑"],["top right","↗"],
                        ["center left","←"],["center","•"],["center right","→"],
                        ["bottom left","↙"],["bottom center","↓"],["bottom right","↘"],
                      ] as [string,string][]).map(([pos,icon]) => (
                        <button key={pos} type="button"
                          onClick={() => set("coverObjectPosition", pos)}
                          title={pos}
                          className={`w-8 h-8 flex items-center justify-center text-sm rounded transition-all border ${
                            form.coverObjectPosition === pos
                              ? "bg-green-600 border-green-600 text-white"
                              : "bg-white border-gray-300 text-gray-500 hover:border-green-400 hover:text-green-600"
                          }`}>
                          {icon}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Fit + aperçu */}
                  <div className="flex-1 space-y-2">
                    <p className="text-gray-500 text-xs mb-1">Ajustement</p>
                    <div className="flex gap-2">
                      {([
                        ["cover","Remplir (rogner)"],
                        ["contain","Ajuster (tout voir)"],
                      ] as [EbookForm["coverObjectFit"], string][]).map(([v, label]) => (
                        <button key={v} type="button" onClick={() => set("coverObjectFit", v)}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                            form.coverObjectFit === v
                              ? "bg-green-600 border-green-600 text-white"
                              : "bg-white border-gray-300 text-gray-600 hover:border-green-400"
                          }`}>{label}</button>
                      ))}
                    </div>
                    {/* Mini aperçu */}
                    <div className="w-full h-28 rounded-lg overflow-hidden border border-gray-200 bg-gray-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={form.cover} alt="aperçu"
                        className="w-full h-full"
                        style={{ objectFit: form.coverObjectFit || "cover", objectPosition: form.coverObjectPosition || "center" }}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    </div>
                  </div>
                </div>
              </div>
            </>)}
          </div>

          <div>
            <label className={labelCls}><ImageIcon size={13} className="inline mr-1" />Bannière page de détail <span className="text-gray-500 text-xs font-normal">(optionnel — si absent, la couverture est utilisée)</span></label>
            <input type="text" value={form.banner} onChange={(e) => set("banner", e.target.value)} className={inputCls} placeholder="https://... ou uploader ci-dessous" />
            <div className="mt-2">
              {form.title ? (
                <UploadCover
                  apiPath="/api/admin/upload-banner"
                  label="Uploader la bannière"
                  ebookId={effectiveId}
                  currentCover={form.banner}
                  onUploaded={(url) => set("banner", url)}
                  onDeleted={() => set("banner", "")}
                />
              ) : (
                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">⚠ Saisissez d&apos;abord le titre pour activer l&apos;upload de la bannière.</p>
              )}
            </div>
          </div>
        </>)}

        {/* ───── ÉTAPE 2 : Prix & Fichiers ───── */}
        {step === 2 && (<>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Prix (FCFA) <span className="text-green-600">*</span></label>
              <input type="number" min="0" value={form.price} onChange={(e) => set("price", e.target.value)} className={inputCls} placeholder="3500" autoFocus />
            </div>
            <div>
              <label className={labelCls}>Prix original <span className="text-gray-500 text-xs font-normal">optionnel</span></label>
              <input type="number" min="0" value={form.originalPrice} onChange={(e) => set("originalPrice", e.target.value)} className={inputCls} placeholder="5000" />
            </div>
          </div>
          {priceError && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              <AlertCircle size={15} className="flex-shrink-0" />
              {priceError}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Nombre de pages</label>
              <input type="number" min="1" value={form.pages} onChange={(e) => set("pages", e.target.value)} className={inputCls} placeholder="80" />
            </div>
            <div>
              <label className={labelCls}>Note (1–5)</label>
              <input type="number" min="1" max="5" step="0.1" value={form.rating} onChange={(e) => set("rating", e.target.value)} className={inputCls} placeholder="4.5" />
            </div>
            <div>
              <label className={labelCls}>Nombre d&apos;avis</label>
              <input type="number" min="0" value={form.reviews} onChange={(e) => set("reviews", e.target.value)} className={inputCls} placeholder="0" />
            </div>
          </div>

          <div className="space-y-3 p-4 bg-red-50 border border-red-200 rounded-2xl">
            <label className="text-gray-900 text-sm font-bold flex items-center gap-2">⏱ Décompte de promotion spéciale</label>
            <div>
              <label className={labelCls}>Date/heure de référence <span className="text-gray-500 text-xs font-normal">(début ou 1ère fin)</span></label>
              <input type="datetime-local" value={form.promoEndDate} onChange={(e) => set("promoEndDate", e.target.value)} className={inputCls} />
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={form.promoCyclique} onChange={(e) => set("promoCyclique", e.target.checked)}
                  className="w-4 h-4 accent-red-600 cursor-pointer" />
                <span className="text-gray-900 text-sm font-semibold">Boucle automatique (cycle infini)</span>
              </label>
            </div>
            {form.promoCyclique && (
              <div>
                <label className={labelCls}>Durée de chaque cycle</label>
                <div className="flex gap-2 flex-wrap">
                  {[["24", "1 jour"], ["48", "2 jours"], ["72", "3 jours"], ["168", "7 jours"]].map(([val, label]) => (
                    <button key={val} type="button"
                      onClick={() => set("promoDureeHeures", val)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${form.promoDureeHeures === val ? "bg-red-600 text-white border-red-600" : "bg-white text-gray-700 border-gray-300 hover:border-red-400"}`}>
                      {label}
                    </button>
                  ))}
                  <input type="number" min="1" value={form.promoDureeHeures}
                    onChange={(e) => set("promoDureeHeures", e.target.value)}
                    className="w-24 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-gray-900 text-xs focus:outline-none focus:border-red-400"
                    placeholder="heures" />
                  <span className="text-gray-500 text-xs self-center">heures</span>
                </div>
              </div>
            )}
            {form.promoEndDate && form.promoCyclique && (
              <p className="text-red-600 text-xs font-semibold flex items-center gap-1">
                🔄 Cycle actif — se répète toutes les {form.promoDureeHeures}h. Seul l&apos;admin peut l&apos;arrêter.
              </p>
            )}
            {form.promoEndDate && !form.promoCyclique && new Date(form.promoEndDate) > new Date() && (
              <p className="text-emerald-600 text-xs font-semibold">✓ Décompte unique jusqu&apos;au {new Date(form.promoEndDate).toLocaleString("fr-FR")}</p>
            )}
            {form.promoEndDate && !form.promoCyclique && new Date(form.promoEndDate) <= new Date() && (
              <p className="text-orange-500 text-xs font-semibold">⚠ Date passée — activez la boucle ou choisissez une date future</p>
            )}
          </div>

          {/* ── Rareté & Places Restantes ── */}
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
            <p className="text-gray-700 font-semibold text-sm">📊 Rareté &amp; Places Restantes</p>
            <p className="text-gray-500 text-xs">Fixez des valeurs bloquées pour maintenir un effet de rareté permanent. Laissez vide pour masquer le bloc.</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Vendus affichés</label>
                <input type="number" min="0" value={form.vendusAffiche}
                  onChange={(e) => set("vendusAffiche", e.target.value)}
                  placeholder="ex: 1030" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Places restantes (bloquées)</label>
                <input type="number" min="1" value={form.placesRestantesBloquees}
                  onChange={(e) => set("placesRestantesBloquees", e.target.value)}
                  placeholder="ex: 3" className={inputCls} />
              </div>
            </div>
            {form.placesRestantesBloquees && (
              <p className="text-emerald-600 text-xs font-semibold">✓ Bloc rareté actif — Vendus : {form.vendusAffiche || "0"} | Restants : {form.placesRestantesBloquees}</p>
            )}
          </div>

          <PdfPreviewUpload
            ebookId={effectiveId}
            adminPassword={adminPassword || ""}
            currentUrl={form.pdfPreviewUrl}
            onDone={(url) => set("pdfPreviewUrl", url)}
          />

          <div>
            <label className={labelCls}><Download size={13} className="inline mr-1" />Fichier PDF téléchargeable {!ebookId && <span className="text-green-600">*</span>}{ebookId && <span className="text-gray-400 text-xs font-normal">(optionnel — conserve le fichier actuel si aucun nouveau n&apos;est uploadé)</span>}</label>
            {ebookId && (
              <p className="text-emerald-600 text-xs mb-2 flex items-center gap-1">
                <CheckCircle size={12} /> Fichier actuel conservé — uploadez un nouveau PDF uniquement pour le remplacer
              </p>
            )}
            <UploadPDF
              ebookId={pdfId}
              ebookTitle={form.title}
              uploaded={pdfUploaded}
              onDone={() => setPdfUploaded(true)}
            />
            {!ebookId && !pdfUploaded && (
              <p className="text-amber-600 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12} /> PDF requis pour pouvoir publier l&apos;ebook</p>
            )}
          </div>
        </>)}

        {/* ───── ÉTAPE 3 : Apparence ───── */}
        {step === 3 && (<>
          <div>
            <label className={labelCls}>Disposition de la couverture</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {([
                { value: "full",    label: "Image pleine",   preview: "🖼️", desc: "Image occupe tout" },
                { value: "overlay", label: "Titre superposé",preview: "📚", desc: "Image + titre en bas" },
                { value: "split",   label: "Image + titre",  preview: "📄", desc: "Image haut, titre bas" },
                { value: "frame",   label: "Avec cadre",     preview: "🎨", desc: "Image dans un cadre" },
              ] as const).map((opt) => (
                <button key={opt.value} type="button" onClick={() => set("coverLayout", opt.value)}
                  className={`p-3 rounded-xl border text-left transition-all ${form.coverLayout === opt.value ? "bg-white border-green-500 text-green-600" : "bg-white border-green-200 text-gray-800 hover:border-green-400"}`}>
                  <div className="text-xl mb-1">{opt.preview}</div>
                  <div className="text-xs font-semibold">{opt.label}</div>
                  <div className="text-xs opacity-60 mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={labelCls}>Hauteur de la couverture (carte) <span className="text-gray-500 text-xs font-normal">défaut : 260 px</span></label>
            <div className="flex items-center gap-3">
              <input type="range" min="120" max="600" step="10" value={parseInt(form.coverHeight) || 260}
                onChange={(e) => set("coverHeight", e.target.value)} className="flex-1 accent-green-600" />
              <div className="flex items-center gap-1">
                <input type="number" min="120" max="600" value={form.coverHeight}
                  onChange={(e) => set("coverHeight", e.target.value)}
                  className="w-20 px-2 py-1.5 border border-green-200 rounded-lg text-sm text-center font-bold text-gray-900 bg-white focus:outline-none" />
                <span className="text-gray-600 text-xs font-semibold">px</span>
              </div>
            </div>
            <div className="mt-2 rounded-xl overflow-hidden border border-green-200 bg-gray-100" style={{ height: Math.min(parseInt(form.coverHeight) || 260, 200) }}>
              {form.cover
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={form.cover} alt="Aperçu" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">Aperçu ({form.coverHeight || 260} px)</div>
              }
            </div>
          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.bestseller} onChange={(e) => set("bestseller", e.target.checked)} className="w-4 h-4 accent-green-600" />
              <span className="text-gray-800 text-sm">Bestseller</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.new} onChange={(e) => set("new", e.target.checked)} className="w-4 h-4 accent-green-600" />
              <span className="text-gray-800 text-sm">Nouveau</span>
            </label>
          </div>

          <div>
            <label className={labelCls}>Bouton d&apos;achat (Call to Action)</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CTA_OPTIONS.map((opt) => (
                <button key={opt.label} type="button"
                  onClick={() => set("ctaLabel", form.ctaLabel === opt.label ? "" : opt.label)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all text-left ${form.ctaLabel === opt.label ? "bg-green-100 border-green-500 text-green-600" : "bg-white border-green-200 text-gray-800 hover:border-green-400"}`}>
                  {opt.icon} {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={labelCls}>Animation du bouton CTA</label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {([
                { value: "clignote" as const, label: "Clignote",          icon: "💡" },
                { value: "respire"  as const, label: "Avance et recule",  icon: "↔️" },
                { value: "pulse"   as const, label: "Pulsation", icon: "💓" },
                { value: "bounce"  as const, label: "Rebond",    icon: "⬆️" },
                { value: "shimmer" as const, label: "Reflet",    icon: "✨" },
                { value: "glow"    as const, label: "Halo",      icon: "🔆" },
                { value: "wiggle"  as const, label: "Secousse",  icon: "👋" },
                { value: "none"    as const, label: "Aucune",  icon: "✋" },
              ]).map((opt) => (
                <button key={opt.value} type="button" onClick={() => set("ctaAnimation", opt.value)}
                  className={`px-2 py-2 rounded-xl text-xs font-medium border transition-all text-center ${form.ctaAnimation === opt.value ? "bg-green-100 border-green-500 text-green-600" : "bg-white border-green-200 text-gray-800 hover:border-green-400"}`}>
                  <div className="text-base mb-0.5">{opt.icon}</div>{opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={labelCls}>Taille des cartes d&apos;avis</label>
            <div className="flex gap-3">
              {([
                { value: "small"  as const, label: "Petite",  desc: "Compact" },
                { value: "medium" as const, label: "Moyenne", desc: "Défaut" },
                { value: "large"  as const, label: "Grande",  desc: "Spacieux" },
              ]).map((opt) => (
                <button key={opt.value} type="button" onClick={() => set("reviewCardSize", opt.value)}
                  className={`flex-1 px-3 py-2.5 rounded-xl border text-xs font-medium transition-all text-center ${form.reviewCardSize === opt.value ? "bg-green-100 border-green-500 text-green-600" : "bg-white border-green-200 text-gray-800 hover:border-green-400"}`}>
                  <div className="font-bold">{opt.label}</div><div className="opacity-60">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4 p-4 bg-green-50 border border-green-200 rounded-2xl">
            <div className="flex items-center justify-between">
              <label className="text-gray-900 text-sm font-bold">🎨 Couleurs des éléments</label>
              <button type="button"
                onClick={() => { set("cardBgColor",""); set("cardTextColor",""); set("priceColor",""); set("ctaBgColor",""); set("ctaTextColor",""); set("bandeauColor",""); }}
                className="text-xs text-red-400 hover:text-red-600 font-semibold">Réinitialiser</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {([
                { key: "cardBgColor"   as const, label: "Fond de la carte",    default: "#ffffff", icon: "🟦" },
                { key: "cardTextColor" as const, label: "Texte / Titre",        default: "#111827", icon: "✏️" },
                { key: "priceColor"    as const, label: "Prix",                 default: "#111827", icon: "💰" },
                { key: "ctaBgColor"    as const, label: "Fond du bouton CTA",   default: "#27A827", icon: "🔲" },
                { key: "ctaTextColor"  as const, label: "Texte du bouton CTA",  default: "#ffffff", icon: "🖊️" },
                { key: "bandeauColor"  as const, label: "Bandeau du titre (page produit)", default: "#27A827", icon: "🏷️" },
              ]).map(({ key, label, default: def, icon }) => (
                <div key={key} className="flex items-center gap-3 bg-white rounded-xl px-3 py-2.5 border border-green-100">
                  <input type="color" value={(form[key] as string) || def} onChange={(e) => set(key, e.target.value)}
                    className="w-9 h-9 rounded-lg border border-gray-200 cursor-pointer p-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-700">{icon} {label}</p>
                    <p className="text-[10px] text-gray-400 font-mono">{(form[key] as string) || `${def} (défaut)`}</p>
                  </div>
                  {(form[key] as string) && <button type="button" onClick={() => set(key, "")} className="text-gray-400 hover:text-red-500 text-xs flex-shrink-0">✕</button>}
                </div>
              ))}
            </div>
            <div className="rounded-xl overflow-hidden border border-green-200 text-xs">
              <p className="text-[10px] text-gray-400 font-semibold px-2 py-1 bg-white border-b border-green-100">Aperçu carte</p>
              <div className="p-3 flex flex-col gap-2" style={{ backgroundColor: form.cardBgColor || "#ffffff" }}>
                <p className="font-bold text-sm truncate" style={{ color: form.cardTextColor || "#111827" }}>{form.title || "Titre de l'ebook"}</p>
                <p className="font-bold text-lg" style={{ color: form.priceColor || "#111827" }}>{form.price ? `${parseInt(form.price).toLocaleString("fr-FR")} FCFA` : "3 500 FCFA"}</p>
                <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold text-xs w-fit" style={{ backgroundColor: form.ctaBgColor || "#27A827", color: form.ctaTextColor || "#ffffff" }}>
                  {form.ctaLabel || "Acheter maintenant"}
                </div>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-semibold mb-2">Palettes rapides</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "Nuit dorée", bg: "#1A1200", text: "#E8B800", price: "#E8B800", ctaBg: "#E8B800", ctaText: "#000000" },
                  { label: "Forêt",      bg: "#052e16", text: "#86efac", price: "#86efac", ctaBg: "#27A827", ctaText: "#ffffff" },
                  { label: "Océan",      bg: "#0c1a2e", text: "#7dd3fc", price: "#38bdf8", ctaBg: "#0284c7", ctaText: "#ffffff" },
                  { label: "Bordeaux",   bg: "#3b0a0a", text: "#fca5a5", price: "#fca5a5", ctaBg: "#dc2626", ctaText: "#ffffff" },
                  { label: "Violet",     bg: "#1e1b4b", text: "#c4b5fd", price: "#c4b5fd", ctaBg: "#7c3aed", ctaText: "#ffffff" },
                  { label: "Ardoise",    bg: "#1e293b", text: "#e2e8f0", price: "#f1f5f9", ctaBg: "#334155", ctaText: "#f1f5f9" },
                ].map((p) => (
                  <button key={p.label} type="button"
                    onClick={() => { set("cardBgColor", p.bg); set("cardTextColor", p.text); set("priceColor", p.price); set("ctaBgColor", p.ctaBg); set("ctaTextColor", p.ctaText); }}
                    className="px-2.5 py-1.5 rounded-lg border border-green-200 text-xs font-semibold hover:scale-105 transition-transform"
                    style={{ backgroundColor: p.bg, color: p.text }}>{p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>)}

        {/* ───── ÉTAPE 4 : Contenu avancé ───── */}
        {step === 4 && (<>
          <div>
            <label className={labelCls}>Vidéo &quot;Comment acheter ?&quot; <span className="text-gray-500 text-xs font-normal">(URL ou fichier .mp4)</span></label>
            <div className="flex gap-2">
              <input type="url" value={form.commentAcheterUrl} onChange={(e) => set("commentAcheterUrl", e.target.value)}
                className={`${inputCls} flex-1`} placeholder="https://..." autoFocus />
              <label className={`flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-700 hover:border-gray-400 text-xs rounded-xl cursor-pointer transition-all flex-shrink-0 ${uploadingHtb ? "opacity-50" : ""}`}>
                {uploadingHtb ? <Loader2 size={13} className="animate-spin" /> : "📁 Upload"}
                <input type="file" accept="video/mp4,video/webm,video/quicktime,video/ogg" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadHowToBuy(f); e.target.value = ""; }} />
              </label>
            </div>
            {uploadingHtb && <UploadProgressBar percent={htbProgress} label="Envoi de la vidéo en arrière-plan…" />}
            {form.commentAcheterUrl && !uploadingHtb && <p className="text-green-600 text-xs mt-1">✓ Vidéo configurée</p>}
          </div>

          <div>
            <label className={labelCls}>Lien WhatsApp communauté <span className="text-red-500">*</span> <span className="text-gray-500 text-xs font-normal">(requis pour publication)</span></label>
            <input type="url" value={form.whatsappUrl} onChange={(e) => set("whatsappUrl", e.target.value)} className={`${inputCls} ${!form.whatsappUrl ? "border-red-300" : ""}`} placeholder="https://chat.whatsapp.com/..." />
            {form.whatsappUrl
              ? <p className="text-emerald-400 text-xs mt-1">✓ Lien WhatsApp configuré</p>
              : <p className="text-red-500 text-xs mt-1">⚠ Obligatoire — le bouton communauté ne s&apos;affichera pas sans ce lien</p>
            }
            {form.whatsappUrl && (
              <div className="flex gap-3 mt-2">
                <div className="flex-1">
                  <label className={labelCls}>Couleur fond bouton communauté</label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={form.communityBgColor || "#22c55e"} onChange={(e) => set("communityBgColor", e.target.value)} className="w-9 h-9 rounded cursor-pointer border border-gray-200 p-0.5 bg-white" />
                    <input type="text" value={form.communityBgColor} onChange={(e) => set("communityBgColor", e.target.value)} className={`${inputCls} flex-1`} placeholder="#22c55e" />
                    {form.communityBgColor && <button type="button" onClick={() => set("communityBgColor", "")} className="text-xs text-gray-400 hover:text-gray-600">✕</button>}
                  </div>
                </div>
                <div className="flex-1">
                  <label className={labelCls}>Couleur texte bouton communauté</label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={form.communityTextColor || "#ffffff"} onChange={(e) => set("communityTextColor", e.target.value)} className="w-9 h-9 rounded cursor-pointer border border-gray-200 p-0.5 bg-white" />
                    <input type="text" value={form.communityTextColor} onChange={(e) => set("communityTextColor", e.target.value)} className={`${inputCls} flex-1`} placeholder="#ffffff" />
                    {form.communityTextColor && <button type="button" onClick={() => set("communityTextColor", "")} className="text-xs text-gray-400 hover:text-gray-600">✕</button>}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Version audio */}
          <div>
            <label className={labelCls}>Version audio (optionnel)</label>
            <input
              type="url"
              value={form.audioUrl}
              onChange={(e) => set("audioUrl", e.target.value)}
              className={inputCls}
              placeholder="https://… (MP3, M4A, Google Drive, SoundCloud…)"
            />
            {form.audioUrl
              ? <p className="text-emerald-400 text-xs mt-1">✓ Lien audio configuré — un lecteur s&apos;affichera sur la fiche produit</p>
              : <p className="text-gray-400 text-xs mt-1">Laissez vide pour ne pas afficher de lecteur audio</p>
            }
          </div>

          {/* Vidéo de présentation */}
          <div>
            <label className={labelCls}>Vidéo de présentation <span className="text-gray-700 text-xs font-semibold">URL YouTube, Google Drive, MP4… (optionnel)</span></label>
            <div className="flex gap-2">
              <input
                type="url"
                value={form.videoUrl}
                onChange={(e) => set("videoUrl", e.target.value)}
                className={`${inputCls} flex-1`}
                placeholder="https://www.youtube.com/watch?v=… ou coller URL"
              />
              <label className={`flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-700 hover:border-gray-400 text-xs rounded-xl cursor-pointer transition-all flex-shrink-0 ${uploadingPV ? "opacity-50" : ""}`}>
                {uploadingPV ? <Loader2 size={13} className="animate-spin" /> : "📁 Upload"}
                <input type="file" accept="video/mp4,video/webm,video/quicktime,video/ogg" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadProductVideo(f); e.target.value = ""; }} />
              </label>
            </div>
            {uploadingPV && <UploadProgressBar percent={pvProgress} label="Envoi de la vidéo…" />}
            {form.videoUrl.trim() && !uploadingPV
              ? <p className="text-emerald-400 text-xs mt-1">✓ Vidéo configurée — un lecteur s&apos;affichera en haut de la fiche produit</p>
              : !uploadingPV && <p className="text-gray-400 text-xs mt-1">Laissez vide pour ne pas afficher de lecteur vidéo</p>
            }
          </div>

          <SectionsEditor value={form.sections} onChange={(v) => set("sections", v)} adminPassword={adminPassword} />
          <FAQEditor value={form.faq} onChange={(v) => set("faq", v)} />
          <AvisEditor value={form.avisClients} onChange={(v) => set("avisClients", v)} />
        </>)}

        {/* ───── ÉTAPE 5 : SEO ───── */}
        {step === 5 && (<>
          {/* Bouton Générer */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-4">
            <div className="flex-1">
              <p className="text-sm font-bold text-blue-800">Optimisation SEO automatique</p>
              <p className="text-xs text-blue-600 mt-0.5">Génère le méta titre, la description et le slug à partir des infos du produit.</p>
            </div>
            <button
              type="button"
              onClick={generateSeo}
              disabled={seoGenerating || !form.title}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl disabled:opacity-40 flex items-center gap-2 flex-shrink-0"
            >
              {seoGenerating ? <Loader2 size={13} className="animate-spin" /> : "✨"} Optimiser avec l&apos;IA
            </button>
          </div>
          {seoMsg && <p className={`text-xs font-medium ${seoMsg.startsWith("✓") ? "text-green-600" : "text-red-500"}`}>{seoMsg}</p>}

          {/* Aperçu SERP */}
          {(form.metaTitle || form.title) && (
            <div className="border border-gray-200 rounded-xl p-4 bg-white">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Aperçu Google</p>
              <p className="text-xs text-gray-500 mb-0.5">https://sn-group.net/ebooks/{form.customSlug || "votre-ebook"}</p>
              <p className="text-blue-700 font-medium text-sm leading-snug hover:underline cursor-pointer">
                {form.metaTitle || form.title}
              </p>
              <p className="text-gray-600 text-xs mt-1 leading-relaxed">
                {form.metaDescription || stripHtml(form.description).slice(0, 155)}
              </p>
            </div>
          )}

          {/* Meta Title */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-gray-700">Méta Titre</label>
              <span className={`text-[10px] font-mono ${form.metaTitle.length > 60 ? "text-red-500" : form.metaTitle.length >= 50 ? "text-green-600" : "text-gray-400"}`}>
                {form.metaTitle.length}/60
              </span>
            </div>
            <input
              type="text"
              value={form.metaTitle}
              onChange={(e) => set("metaTitle", e.target.value)}
              maxLength={70}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400"
              placeholder="Titre optimisé pour Google (50-60 caractères recommandés)"
            />
            <p className="text-[10px] text-gray-400 mt-0.5">Recommandé : 50-60 caractères</p>
          </div>

          {/* Meta Description */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-gray-700">Méta Description</label>
              <span className={`text-[10px] font-mono ${form.metaDescription.length > 160 ? "text-red-500" : form.metaDescription.length >= 150 ? "text-green-600" : "text-gray-400"}`}>
                {form.metaDescription.length}/160
              </span>
            </div>
            <textarea
              value={form.metaDescription}
              onChange={(e) => set("metaDescription", e.target.value)}
              maxLength={180}
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 resize-none"
              placeholder="Description affichée dans Google (150-160 caractères recommandés)"
            />
            <p className="text-[10px] text-gray-400 mt-0.5">Recommandé : 150-160 caractères</p>
          </div>

          {/* Slug personnalisé */}
          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">Slug personnalisé (URL)</label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 flex-shrink-0">/ebooks/</span>
              <input
                type="text"
                value={form.customSlug}
                onChange={(e) => set("customSlug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-"))}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 font-mono"
                placeholder="mon-super-ebook"
              />
            </div>
          </div>

          {/* Mots-clés */}
          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">Mots-clés</label>
            <input
              type="text"
              value={form.keywords}
              onChange={(e) => set("keywords", e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400"
              placeholder="entrepreneuriat, business, afrique, investissement…"
            />
            <p className="text-[10px] text-gray-400 mt-0.5">Séparés par des virgules</p>
          </div>

          {/* Image OG */}
          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">Image Open Graph (réseaux sociaux) <span className="text-gray-400 font-normal">1200×630 px, JPG/PNG</span></label>
            {form.ogImage ? (
              <div className="flex items-center gap-3 p-3 bg-white border border-blue-200 rounded-xl">
                <img src={form.ogImage} alt="OG" className="w-20 h-10 object-cover rounded border border-gray-200" />
                <p className="flex-1 text-xs text-blue-600 truncate">{form.ogImage}</p>
                <button type="button" onClick={() => set("ogImage", "")} className="text-red-400 hover:text-red-600"><X size={14} /></button>
              </div>
            ) : (
              <label className={`flex items-center gap-2 px-4 py-3 border-2 border-dashed border-gray-200 hover:border-blue-400 rounded-xl cursor-pointer transition-all text-sm text-gray-600 hover:text-blue-600 ${uploadingOg ? "opacity-50 pointer-events-none" : ""}`}>
                <ImageIcon size={16} />
                {uploadingOg ? "Upload en cours…" : "Cliquez pour uploader (JPG, PNG, WebP — max 5 Mo)"}
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadOgImage(f); e.target.value = ""; }} />
              </label>
            )}
            {ogMsg && <p className={`text-xs mt-1 ${ogMsg.startsWith("✓") ? "text-green-600" : "text-red-500"}`}>{ogMsg}</p>}
          </div>
        </>)}

      </div>

      {/* ── Footer navigation ── */}
      <div className="px-6 py-4 border-t border-green-100 bg-green-50/40 flex items-center justify-between gap-3">
        <div className="text-xs text-gray-400 flex items-center gap-1">
          {!ebookId && <><Save size={11} className="text-green-500" /> Brouillon sauvegardé</>}
        </div>
        <div className="flex items-center gap-3">
          {step > 1 && (
            <button onClick={() => setStep(s => s - 1)}
              className="flex items-center gap-2 px-5 py-2.5 border border-green-200 text-gray-700 rounded-xl text-sm hover:bg-white transition-colors">
              ← Retour
            </button>
          )}
          {step < 5 ? (
            <button
              onClick={() => { if (step === 1 && !step1Valid) return; setStep(s => s + 1); }}
              disabled={step === 1 && !step1Valid}
              className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-[#27A827] text-black font-bold rounded-xl text-sm disabled:opacity-40 transition-colors"
            >
              Suivant →
            </button>
          ) : (
            <button
              onClick={() => {
                if (!allValid || priceError) return;
                clearDraft();
                onSave(form);
              }}
              disabled={!allValid || !!priceError}
              className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-[#27A827] text-black font-bold rounded-xl text-sm disabled:opacity-40 transition-colors"
            >
              <Save size={15} /> Publier l&apos;ebook
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Formulaire Formation ─────────────────────────────────────────────────────

function FormulaireFormation({
  initial, onSave, onCancel, titreForm, extraCategories = [], adminPassword,
}: {
  initial: FormationForm;
  onSave: (d: FormationForm) => void;
  onCancel: () => void;
  titreForm: string;
  extraCategories?: string[];
  adminPassword?: string;
}) {
  const [form, setForm] = useState<FormationForm>(initial);
  const set = <K extends keyof FormationForm>(k: K, v: FormationForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));
  const valide = form.titre.trim() && form.description.trim() && form.categorie && form.prix;
  const prixError = (form.prix && form.prixOriginal && (parseInt(form.prix) || 0) >= (parseInt(form.prixOriginal) || 0))
    ? "Le prix de vente doit être inférieur au prix d'origine (barré)."
    : null;
  const [uploadingHtb, setUploadingHtb] = useState(false);
  const [htbProgress, setHtbProgress] = useState(0);
  const [uploadingPV, setUploadingPV] = useState(false);
  const [pvProgress, setPvProgress] = useState(0);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [coverMsg, setCoverMsg] = useState("");
  const [seoGeneratingF, setSeoGeneratingF] = useState(false);
  const [seoMsgF, setSeoMsgF] = useState("");
  const [uploadingOgF, setUploadingOgF] = useState(false);
  const [ogMsgF, setOgMsgF] = useState("");

  async function generateSeoFormation() {
    setSeoGeneratingF(true);
    setSeoMsgF("");
    try {
      const res = await fetch("/api/admin/generate-seo", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-password": adminPassword || "" },
        body: JSON.stringify({ title: form.titre, description: form.description, category: form.categorie, price: parseInt(form.prix) || 0, type: "formation" }),
      });
      const data = await res.json() as { metaTitle?: string; metaDescription?: string; customSlug?: string; keywords?: string; error?: string };
      if (data.error) { setSeoMsgF("Erreur : " + data.error); return; }
      if (data.metaTitle) set("metaTitle", data.metaTitle);
      if (data.metaDescription) set("metaDescription", data.metaDescription);
      if (data.customSlug) set("customSlug", data.customSlug);
      if (data.keywords) set("keywords", data.keywords);
      setSeoMsgF("✓ SEO généré avec succès !");
    } catch { setSeoMsgF("Erreur réseau"); }
    finally { setSeoGeneratingF(false); }
  }

  async function uploadOgFormation(file: File) {
    setUploadingOgF(true);
    setOgMsgF("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload-og-image", { method: "POST", headers: { "x-admin-password": adminPassword || "" }, body: fd });
      const data = await res.json() as { url?: string; error?: string };
      if (data.url) { set("ogImage", data.url); setOgMsgF("✓ Image OG uploadée"); }
      else setOgMsgF(data.error || "Erreur upload");
    } catch { setOgMsgF("Erreur réseau"); }
    finally { setUploadingOgF(false); }
  }

  async function uploadFormationCover(file: File) {
    if (!form.titre.trim()) { setCoverMsg("Saisissez d'abord le titre de la formation."); return; }
    setUploadingCover(true);
    setCoverMsg("Upload en cours…");
    const formationId = form.titre.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 40);
    const fd = new FormData();
    fd.append("formationId", formationId);
    fd.append("file", file);
    try {
      const res = await fetch("/api/admin/upload-formation-cover", {
        method: "POST",
        headers: { "x-admin-password": adminPassword ?? "" },
        body: fd,
      });
      const data = await res.json();
      if (data.url) { set("cover", `${data.url}?v=${Date.now()}`); setCoverMsg("✓ Photo de couverture enregistrée"); }
      else setCoverMsg(data.error ?? "Erreur upload");
    } catch { setCoverMsg("Erreur réseau"); }
    finally { setUploadingCover(false); }
  }

  async function deleteFormationCover() {
    if (!form.cover) return;
    const formationId = form.cover.split("/").pop()?.replace(/\.[^/.]+$/, "") ?? "";
    await fetch("/api/admin/upload-formation-cover", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", "x-admin-password": adminPassword ?? "" },
      body: JSON.stringify({ formationId }),
    }).catch(() => {});
    set("cover", "");
    setCoverMsg("");
  }

  async function uploadHowToBuy(file: File) {
    if (!adminPassword) return;
    setUploadingHtb(true);
    setHtbProgress(0);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await uploadWithProgress("/api/admin/upload-how-to-buy", fd, { "x-admin-password": adminPassword }, setHtbProgress);
      const data = await res.data() as { url?: string };
      if (data.url) set("commentAcheterUrl", data.url);
    } finally {
      setUploadingHtb(false);
    }
  }

  async function uploadProductVideo(file: File) {
    if (!adminPassword) return;
    setUploadingPV(true);
    setPvProgress(0);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await uploadWithProgress("/api/admin/upload-product-video", fd, { "x-admin-password": adminPassword }, setPvProgress);
      const data = await res.data() as { url?: string };
      if (data.url) set("videoUrl", data.url);
    } finally {
      setUploadingPV(false);
    }
  }

  return (
    <div className="p-6 bg-white border border-green-200 rounded-2xl space-y-5">
      <h3 className="text-gray-900 font-bold text-lg">{titreForm}</h3>

      <div>
        <label className={labelCls}>Titre <span className="text-green-600">*</span></label>
        <input type="text" value={form.titre} onChange={(e) => set("titre", e.target.value)} className={inputCls} placeholder="Nom de la formation..." autoFocus />
      </div>

      <div>
        <label className={labelCls}>Description <span className="text-green-600">*</span></label>
        <RichTextEditor
          value={form.description}
          onChange={(v) => set("description", v)}
          placeholder="Description complète de la formation... Ajoutez du texte, des listes et des images."
          adminPassword={useContext(AdminPasswordContext)}
          minHeight={100}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Catégorie <span className="text-green-600">*</span> <span className="text-gray-700 text-xs font-semibold">(tapez pour créer)</span></label>
          <input
            list="formation-categories-list"
            value={form.categorie}
            onChange={(e) => set("categorie", e.target.value)}
            className={inputCls}
            placeholder="Sélectionner ou saisir une catégorie..."
          />
          <datalist id="formation-categories-list">
            {[...FORMATION_CATEGORIES, ...extraCategories].filter((v, i, a) => a.indexOf(v) === i).map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
        <div>
          <label className={labelCls}>Niveau</label>
          <select value={form.niveau} onChange={(e) => set("niveau", e.target.value as FormationForm["niveau"])} className={selectCls}>
            {(["Débutant", "Intermédiaire", "Avancé"] as const).map((n) => <option key={n} value={n} className="bg-white">{n}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Instructeur</label>
          <input type="text" value={form.instructeur} onChange={(e) => set("instructeur", e.target.value)} className={inputCls} placeholder="SMART LIFE" />
        </div>
        <div>
          <label className={labelCls}>Durée</label>
          <input type="text" value={form.duree} onChange={(e) => set("duree", e.target.value)} className={inputCls} placeholder="8h" />
        </div>
        <div>
          <label className={labelCls}>Prix (FCFA) <span className="text-green-600">*</span></label>
          <input type="number" min="0" value={form.prix} onChange={(e) => set("prix", e.target.value)} className={inputCls} placeholder="25000" />
        </div>
        <div>
          <label className={labelCls}>Prix original (FCFA) <span className="text-gray-700 text-xs font-semibold">optionnel</span></label>
          <input type="number" min="0" value={form.prixOriginal} onChange={(e) => set("prixOriginal", e.target.value)} className={inputCls} placeholder="40000" />
        </div>
        <div>
          <label className={labelCls}>Modules</label>
          <input type="number" min="1" value={form.modules} onChange={(e) => set("modules", e.target.value)} className={inputCls} placeholder="5" />
        </div>
        <div>
          <label className={labelCls}>Note (1–5)</label>
          <input type="number" min="1" max="5" step="0.1" value={form.note} onChange={(e) => set("note", e.target.value)} className={inputCls} placeholder="4.5" />
        </div>
        <div>
          <label className={labelCls}>Apprenants</label>
          <input type="number" min="0" value={form.apprenants} onChange={(e) => set("apprenants", e.target.value)} className={inputCls} placeholder="0" />
        </div>
        <div>
          <label className={labelCls}>Badge</label>
          <select value={form.badge} onChange={(e) => set("badge", e.target.value)} className={selectCls}>
            <option value="" className="bg-white">Aucun</option>
            {["Bestseller", "Nouveau", "Premium"].map((b) => <option key={b} value={b} className="bg-white">{b}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Mode de formation</label>
          <select value={form.mode} onChange={(e) => set("mode", e.target.value as FormationForm["mode"])} className={selectCls}>
            <option value="both" className="bg-white">En ligne + Présentiel</option>
            <option value="online" className="bg-white">En ligne uniquement</option>
            <option value="presentiel" className="bg-white">Présentiel uniquement</option>
          </select>
        </div>
      </div>

      {prixError && (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-3 py-2">
          <AlertCircle size={15} className="flex-shrink-0" />
          {prixError}
        </div>
      )}

      {/* Décompte promo */}
      <div className="space-y-3 p-4 bg-red-50 border border-red-200 rounded-2xl">
        <label className="text-gray-900 text-sm font-bold flex items-center gap-2">⏱ Décompte de promotion spéciale</label>
        <div>
          <label className={labelCls}>Date/heure de référence <span className="text-gray-500 text-xs font-normal">(début ou 1ère fin)</span></label>
          <input type="datetime-local" value={form.promoEndDate} onChange={(e) => set("promoEndDate", e.target.value)} className={inputCls} />
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={form.promoCyclique} onChange={(e) => set("promoCyclique", e.target.checked)}
              className="w-4 h-4 accent-red-600 cursor-pointer" />
            <span className="text-gray-900 text-sm font-semibold">Boucle automatique (cycle infini)</span>
          </label>
        </div>
        {form.promoCyclique && (
          <div>
            <label className={labelCls}>Durée de chaque cycle</label>
            <div className="flex gap-2 flex-wrap">
              {[["24", "1 jour"], ["48", "2 jours"], ["72", "3 jours"], ["168", "7 jours"]].map(([val, label]) => (
                <button key={val} type="button"
                  onClick={() => set("promoDureeHeures", val)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${form.promoDureeHeures === val ? "bg-red-600 text-white border-red-600" : "bg-white text-gray-700 border-gray-300 hover:border-red-400"}`}>
                  {label}
                </button>
              ))}
              <input type="number" min="1" value={form.promoDureeHeures}
                onChange={(e) => set("promoDureeHeures", e.target.value)}
                className="w-24 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-gray-900 text-xs focus:outline-none focus:border-red-400"
                placeholder="heures" />
              <span className="text-gray-500 text-xs self-center">heures</span>
            </div>
          </div>
        )}
        {form.promoEndDate && form.promoCyclique && (
          <p className="text-red-600 text-xs font-semibold flex items-center gap-1">
            🔄 Cycle actif — se répète toutes les {form.promoDureeHeures}h. Seul l&apos;admin peut l&apos;arrêter.
          </p>
        )}
        {form.promoEndDate && !form.promoCyclique && new Date(form.promoEndDate) > new Date() && (
          <p className="text-emerald-600 text-xs font-semibold">✓ Décompte unique jusqu&apos;au {new Date(form.promoEndDate).toLocaleString("fr-FR")}</p>
        )}
        {form.promoEndDate && !form.promoCyclique && new Date(form.promoEndDate) <= new Date() && (
          <p className="text-orange-500 text-xs font-semibold">⚠ Date passée — activez la boucle ou choisissez une date future</p>
        )}
      </div>

      {/* ── Rareté & Places Restantes ── */}
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
        <p className="text-gray-700 font-semibold text-sm">📊 Rareté &amp; Places Restantes</p>
        <p className="text-gray-500 text-xs">Fixez des valeurs bloquées pour maintenir un effet de rareté permanent. Laissez vide pour masquer le bloc.</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Vendus affichés</label>
            <input type="number" min="0" value={form.vendusAffiche}
              onChange={(e) => set("vendusAffiche", e.target.value)}
              placeholder="ex: 1030" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Places restantes (bloquées)</label>
            <input type="number" min="1" value={form.placesRestantesBloquees}
              onChange={(e) => set("placesRestantesBloquees", e.target.value)}
              placeholder="ex: 3" className={inputCls} />
          </div>
        </div>
        {form.placesRestantesBloquees && (
          <p className="text-emerald-600 text-xs font-semibold">✓ Bloc rareté actif — Vendus : {form.vendusAffiche || "0"} | Restants : {form.placesRestantesBloquees}</p>
        )}
      </div>

      {/* ── Personnalisation des couleurs ── */}
      <div className="space-y-4 p-4 bg-green-50 border border-green-200 rounded-2xl">
        <div className="flex items-center justify-between">
          <label className="text-gray-900 text-sm font-bold">🎨 Couleurs des éléments</label>
          <button
            type="button"
            onClick={() => { set("cardBgColor", ""); set("cardTextColor", ""); set("priceColor", ""); set("ctaBgColor", ""); set("ctaTextColor", ""); }}
            className="text-xs text-red-400 hover:text-red-600 font-semibold"
          >
            Tout réinitialiser
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {([
            { key: "cardBgColor",   label: "Fond de la carte",   default: "#ffffff", icon: "🟦" },
            { key: "cardTextColor", label: "Texte / Titre",       default: "#111827", icon: "✏️" },
            { key: "priceColor",    label: "Prix",                default: "#111827", icon: "💰" },
            { key: "ctaBgColor",    label: "Fond du bouton CTA",  default: "#27A827", icon: "🔲" },
            { key: "ctaTextColor",  label: "Texte du bouton CTA", default: "#ffffff", icon: "🖊️" },
          ] as { key: keyof FormationForm; label: string; default: string; icon: string }[]).map(({ key, label, default: def, icon }) => (
            <div key={key} className="flex items-center gap-3 bg-white rounded-xl px-3 py-2.5 border border-green-100">
              <input
                type="color"
                value={(form[key] as string) || def}
                onChange={(e) => set(key, e.target.value)}
                className="w-9 h-9 rounded-lg border border-gray-200 cursor-pointer p-0.5 flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-700">{icon} {label}</p>
                <p className="text-[10px] text-gray-400 font-mono">{(form[key] as string) || `${def} (défaut)`}</p>
              </div>
              {(form[key] as string) && (
                <button type="button" onClick={() => set(key, "")} className="text-gray-400 hover:text-red-500 text-xs flex-shrink-0">✕</button>
              )}
            </div>
          ))}
        </div>

        {/* Aperçu mini-carte */}
        <div className="rounded-xl overflow-hidden border border-green-200 text-xs">
          <p className="text-[10px] text-gray-400 font-semibold px-2 py-1 bg-white border-b border-green-100">Aperçu</p>
          <div className="p-3 flex flex-col gap-2" style={{ backgroundColor: form.cardBgColor || "#ffffff" }}>
            <p className="font-bold text-sm truncate" style={{ color: form.cardTextColor || "#111827" }}>{form.titre || "Titre de la formation"}</p>
            <p className="font-bold text-lg" style={{ color: form.priceColor || "#111827" }}>{form.prix ? `${parseInt(form.prix).toLocaleString("fr-FR")} FCFA` : "25 000 FCFA"}</p>
            <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold text-xs w-fit" style={{ backgroundColor: form.ctaBgColor || "#27A827", color: form.ctaTextColor || "#ffffff" }}>
              Acheter la formation
            </div>
          </div>
        </div>

        {/* Palettes rapides */}
        <div>
          <p className="text-xs text-gray-500 font-semibold mb-2">Palettes rapides</p>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Nuit dorée", bg: "#1A1200", text: "#E8B800", price: "#E8B800", ctaBg: "#E8B800", ctaText: "#000000" },
              { label: "Forêt",      bg: "#052e16", text: "#86efac", price: "#86efac", ctaBg: "#27A827", ctaText: "#ffffff" },
              { label: "Océan",      bg: "#0c1a2e", text: "#7dd3fc", price: "#38bdf8", ctaBg: "#0284c7", ctaText: "#ffffff" },
              { label: "Bordeaux",   bg: "#3b0a0a", text: "#fca5a5", price: "#fca5a5", ctaBg: "#dc2626", ctaText: "#ffffff" },
              { label: "Violet",     bg: "#1e1b4b", text: "#c4b5fd", price: "#c4b5fd", ctaBg: "#7c3aed", ctaText: "#ffffff" },
              { label: "Ardoise",    bg: "#1e293b", text: "#e2e8f0", price: "#f1f5f9", ctaBg: "#334155", ctaText: "#f1f5f9" },
            ].map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => { set("cardBgColor", p.bg); set("cardTextColor", p.text); set("priceColor", p.price); set("ctaBgColor", p.ctaBg); set("ctaTextColor", p.ctaText); }}
                className="px-2.5 py-1.5 rounded-lg border border-green-200 text-xs font-semibold hover:scale-105 transition-transform"
                style={{ backgroundColor: p.bg, color: p.text }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <label className={labelCls}>Vidéo de présentation (hero) <span className="text-gray-700 text-xs font-semibold">URL YouTube / lien direct (optionnel)</span></label>
        <input
          type="url"
          value={form.videoPreview}
          onChange={(e) => set("videoPreview", e.target.value)}
          className={inputCls}
          placeholder="https://www.youtube.com/watch?v=..."
        />
        {form.videoPreview.trim() && (
          <p className="mt-1 text-xs text-[#27A827]">✓ Vidéo hero configurée — visible dans le bandeau de la formation</p>
        )}
      </div>

      {/* Vidéo corps de page */}
      <div>
        <label className={labelCls}>Vidéo de présentation (corps de page) <span className="text-gray-700 text-xs font-semibold">YouTube, Google Drive, MP4… (optionnel)</span></label>
        <div className="flex gap-2">
          <input
            type="url"
            value={form.videoUrl}
            onChange={(e) => set("videoUrl", e.target.value)}
            className={`${inputCls} flex-1`}
            placeholder="https://www.youtube.com/watch?v=… ou coller URL"
          />
          <label className={`flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-700 hover:border-gray-400 text-xs rounded-xl cursor-pointer transition-all flex-shrink-0 ${uploadingPV ? "opacity-50" : ""}`}>
            {uploadingPV ? <Loader2 size={13} className="animate-spin" /> : "📁 Upload"}
            <input type="file" accept="video/mp4,video/webm,video/quicktime,video/ogg" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadProductVideo(f); e.target.value = ""; }} />
          </label>
        </div>
        {uploadingPV && <UploadProgressBar percent={pvProgress} label="Envoi de la vidéo…" />}
        {form.videoUrl.trim() && !uploadingPV
          ? <p className="mt-1 text-xs text-[#27A827]">✓ Vidéo configurée — un lecteur s&apos;affichera en haut de la fiche formation</p>
          : !uploadingPV && <p className="text-gray-400 text-xs mt-1">Laissez vide pour ne pas afficher de lecteur vidéo</p>
        }
      </div>

      {/* Photo de couverture */}
      <div>
        <label className={labelCls}>Photo de couverture <span className="text-gray-700 text-xs font-semibold">(visible sur la carte et la page formation)</span></label>
        {form.cover ? (
          <div className="flex items-center gap-3 p-3 bg-white border border-green-200 rounded-xl">
            <img src={form.cover} alt="cover" className="w-16 h-16 object-cover rounded-lg border border-gray-200" />
            <div className="flex-1 min-w-0">
              <p className="text-green-600 text-xs font-medium truncate">{form.cover}</p>
            </div>
            <button type="button" onClick={deleteFormationCover} className="p-1.5 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50"><X size={14} /></button>
          </div>
        ) : (
          <label className={`flex items-center gap-2 px-4 py-3 border-2 border-dashed border-gray-200 hover:border-green-400 rounded-xl cursor-pointer transition-all text-sm text-gray-800 hover:text-green-600 ${uploadingCover ? "opacity-50 pointer-events-none" : ""}`}>
            <ImageIcon size={16} />
            {uploadingCover ? "Upload en cours…" : "Cliquez pour uploader une image (JPG, PNG, WebP)"}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFormationCover(f); e.target.value = ""; }} />
          </label>
        )}
        {coverMsg && !form.cover && <p className={`text-xs mt-1 ${coverMsg.startsWith("✓") ? "text-green-600" : "text-red-400"}`}>{coverMsg}</p>}
      </div>

      {/* Vidéo comment acheter */}
      <div>
        <label className={labelCls}>Vidéo &quot;Comment acheter ?&quot; <span className="text-gray-700 text-xs font-semibold">(URL ou fichier .mp4)</span></label>
        <div className="flex gap-2">
          <input type="url" value={form.commentAcheterUrl} onChange={(e) => set("commentAcheterUrl", e.target.value)} className={`${inputCls} flex-1`} placeholder="https://... ou uploader ci-dessous" />
          <label className={`flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-700 hover:border-gray-400 text-xs rounded-xl cursor-pointer transition-all flex-shrink-0 ${uploadingHtb ? "opacity-50" : ""}`}>
            {uploadingHtb ? <Loader2 size={13} className="animate-spin" /> : "📁 Upload"}
            <input type="file" accept="video/mp4,video/webm,video/quicktime,video/ogg" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadHowToBuy(f); e.target.value = ""; }} />
          </label>
        </div>
        {uploadingHtb && <UploadProgressBar percent={htbProgress} label="Envoi de la vidéo en arrière-plan…" />}
        {form.commentAcheterUrl && !uploadingHtb && <p className="text-[#27A827] text-xs mt-1">✓ {form.commentAcheterUrl.startsWith("/how-to-buy/") ? "Vidéo native hébergée sur le serveur" : "Vidéo configurée"}</p>}
      </div>

      {/* Lien WhatsApp communauté */}
      <div>
        <label className={labelCls}>Lien WhatsApp communauté <span className="text-gray-700 text-xs font-semibold">(visible après achat)</span></label>
        <input type="url" value={form.whatsappUrl} onChange={(e) => set("whatsappUrl", e.target.value)} className={inputCls} placeholder="https://chat.whatsapp.com/..." />
        {form.whatsappUrl && <p className="text-emerald-400 text-xs mt-1">✓ Lien WhatsApp configuré</p>}
      </div>

      {/* Animation CTA */}
      <div>
        <label className={labelCls}>Animation du bouton CTA</label>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {([
            { value: "pulse" as const, label: "Pulse", icon: "💓" },
            { value: "bounce" as const, label: "Bounce", icon: "⬆️" },
            { value: "shimmer" as const, label: "Shimmer", icon: "✨" },
            { value: "glow" as const, label: "Glow", icon: "🔆" },
            { value: "wiggle" as const, label: "Wiggle", icon: "👋" },
            { value: "none" as const, label: "Aucune", icon: "✋" },
          ]).map((opt) => (
            <button key={opt.value} type="button" onClick={() => set("ctaAnimation", opt.value)}
              className={`px-2 py-2 rounded-xl text-xs font-medium border transition-all text-center ${form.ctaAnimation === opt.value ? "bg-green-100 border-green-500 text-green-600" : "bg-white border-green-200 text-gray-800 hover:border-green-400"}`}>
              <div className="text-base mb-0.5">{opt.icon}</div>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Taille des cartes d'avis */}
      <div>
        <label className={labelCls}>Taille des cartes d&apos;avis clients</label>
        <div className="flex gap-3">
          {([
            { value: "small" as const, label: "Petite", desc: "Compact" },
            { value: "medium" as const, label: "Moyenne", desc: "Défaut" },
            { value: "large" as const, label: "Grande", desc: "Spacieux" },
          ]).map((opt) => (
            <button key={opt.value} type="button" onClick={() => set("reviewCardSize", opt.value)}
              className={`flex-1 px-3 py-2.5 rounded-xl border text-xs font-medium transition-all text-center ${form.reviewCardSize === opt.value ? "bg-green-100 border-green-500 text-green-600" : "bg-white border-green-200 text-gray-800 hover:border-green-400"}`}>
              <div className="font-bold">{opt.label}</div>
              <div className="opacity-60">{opt.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Onglets de description */}
      <SectionsEditor value={form.sections} onChange={(v) => set("sections", v)} adminPassword={adminPassword} />

      {/* FAQ */}
      <FAQEditor value={form.faq} onChange={(v) => set("faq", v)} />

      {/* Avis clients */}
      <AvisEditor value={form.avisClients} onChange={(v) => set("avisClients", v)} />

      {/* ── SEO ── */}
      <div className="border border-blue-200 rounded-2xl p-5 space-y-4 bg-blue-50/30">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-blue-800">🔍 Référencement (SEO)</p>
          <button
            type="button"
            onClick={generateSeoFormation}
            disabled={seoGeneratingF || !form.titre}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl disabled:opacity-40 flex items-center gap-1.5"
          >
            {seoGeneratingF ? <Loader2 size={12} className="animate-spin" /> : "✨"} Optimiser avec l&apos;IA
          </button>
        </div>
        {seoMsgF && <p className={`text-xs font-medium ${seoMsgF.startsWith("✓") ? "text-green-600" : "text-red-500"}`}>{seoMsgF}</p>}

        {/* Aperçu SERP */}
        {(form.metaTitle || form.titre) && (
          <div className="border border-gray-200 rounded-xl p-4 bg-white">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Aperçu Google</p>
            <p className="text-xs text-gray-500 mb-0.5">https://sn-group.net/formations/{form.customSlug || "votre-formation"}</p>
            <p className="text-blue-700 font-medium text-sm">{form.metaTitle || form.titre}</p>
            <p className="text-gray-600 text-xs mt-1">{form.metaDescription || stripHtml(form.description).slice(0, 155)}</p>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-gray-700">Méta Titre</label>
            <span className={`text-[10px] font-mono ${form.metaTitle.length > 60 ? "text-red-500" : form.metaTitle.length >= 50 ? "text-green-600" : "text-gray-400"}`}>{form.metaTitle.length}/60</span>
          </div>
          <input type="text" value={form.metaTitle} onChange={(e) => set("metaTitle", e.target.value)} maxLength={70}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400"
            placeholder="Titre optimisé Google (50-60 caractères)" />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-gray-700">Méta Description</label>
            <span className={`text-[10px] font-mono ${form.metaDescription.length > 160 ? "text-red-500" : form.metaDescription.length >= 150 ? "text-green-600" : "text-gray-400"}`}>{form.metaDescription.length}/160</span>
          </div>
          <textarea value={form.metaDescription} onChange={(e) => set("metaDescription", e.target.value)} maxLength={180} rows={3}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 resize-none"
            placeholder="Description Google (150-160 caractères)" />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-700 block mb-1">Slug (URL)</label>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 flex-shrink-0">/formations/</span>
            <input type="text" value={form.customSlug}
              onChange={(e) => set("customSlug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-"))}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 font-mono"
              placeholder="ma-super-formation" />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-700 block mb-1">Mots-clés</label>
          <input type="text" value={form.keywords} onChange={(e) => set("keywords", e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400"
            placeholder="entrepreneuriat, formation, business…" />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-700 block mb-1">Image Open Graph <span className="text-gray-400 font-normal">1200×630 px JPG/PNG</span></label>
          {form.ogImage ? (
            <div className="flex items-center gap-3 p-3 bg-white border border-blue-200 rounded-xl">
              <img src={form.ogImage} alt="OG" className="w-20 h-10 object-cover rounded border border-gray-200" />
              <p className="flex-1 text-xs text-blue-600 truncate">{form.ogImage}</p>
              <button type="button" onClick={() => set("ogImage", "")} className="text-red-400 hover:text-red-600"><X size={14} /></button>
            </div>
          ) : (
            <label className={`flex items-center gap-2 px-4 py-3 border-2 border-dashed border-gray-200 hover:border-blue-400 rounded-xl cursor-pointer transition-all text-sm text-gray-600 hover:text-blue-600 ${uploadingOgF ? "opacity-50 pointer-events-none" : ""}`}>
              <ImageIcon size={16} />
              {uploadingOgF ? "Upload en cours…" : "Uploader l'image OG (JPG, PNG, WebP)"}
              <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadOgFormation(f); e.target.value = ""; }} />
            </label>
          )}
          {ogMsgF && <p className={`text-xs mt-1 ${ogMsgF.startsWith("✓") ? "text-green-600" : "text-red-500"}`}>{ogMsgF}</p>}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button onClick={() => {
          if (!valide || prixError) return;
          onSave(form);
        }} disabled={!valide || !!prixError}
          className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-[#27A827] text-black font-bold rounded-xl text-sm disabled:opacity-40">
          <Save size={15} /> Enregistrer
        </button>
        <button onClick={onCancel}
          className="flex items-center gap-2 px-6 py-3 border border-gray-200 text-gray-700 rounded-xl text-sm hover:bg-green-50">
          <X size={15} /> Annuler
        </button>
      </div>
    </div>
  );
}

// ─── Composant Gestion Vidéos Formation ──────────────────────────────────────

type ModuleVideoForm = { id: string; titre: string; duree: string; url: string };
type ModuleForm = { id: string; titre: string; videos: ModuleVideoForm[] };

function GestionVideos({ formationId, formationTitre }: { formationId: string; formationTitre: string }) {
  const adminPassword = useAdminPassword();
  const [modules, setModules] = useState<ModuleForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadedVideos, setUploadedVideos] = useState<string[]>([]);

  async function fetchUploadedVideos() {
    try {
      const res = await fetch(`/api/admin/upload-video?formationId=${formationId}`, {
        headers: { "x-admin-password": adminPassword },
      });
      if (res.ok) {
        const data = await res.json();
        setUploadedVideos(data.uploaded ?? []);
      }
    } catch { /* silencieux */ }
  }

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/formation-videos", { headers: { "x-admin-password": adminPassword } })
        .then((r) => r.json())
        .then((data) => setModules(data[formationId] ?? [])),
      fetch(`/api/admin/upload-video?formationId=${formationId}`, { headers: { "x-admin-password": adminPassword } })
        .then((r) => r.json())
        .then((data) => setUploadedVideos(data.uploaded ?? [])),
    ])
      .catch(() => {})
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formationId]);

  function addModule() {
    const id = `m${Date.now()}`;
    setModules((prev) => [...prev, { id, titre: `Module ${prev.length + 1}`, videos: [] }]);
  }

  function removeModule(moduleId: string) {
    setModules((prev) => prev.filter((m) => m.id !== moduleId));
  }

  function updateModule(moduleId: string, field: "titre", value: string) {
    setModules((prev) => prev.map((m) => m.id === moduleId ? { ...m, [field]: value } : m));
  }

  function addVideo(moduleId: string) {
    const vid = { id: `v${Date.now()}`, titre: "", duree: "", url: "" };
    setModules((prev) => prev.map((m) => m.id === moduleId ? { ...m, videos: [...m.videos, vid] } : m));
  }

  function removeVideo(moduleId: string, videoId: string) {
    setModules((prev) => prev.map((m) => m.id === moduleId ? { ...m, videos: m.videos.filter((v) => v.id !== videoId) } : m));
  }

  function updateVideo(moduleId: string, videoId: string, field: keyof ModuleVideoForm, value: string) {
    setModules((prev) => prev.map((m) =>
      m.id === moduleId
        ? { ...m, videos: m.videos.map((v) => v.id === videoId ? { ...v, [field]: value } : v) }
        : m
    ));
  }

  async function save() {
    setSaving(true);
    try {
      await fetch("/api/admin/formation-videos", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-password": adminPassword },
        body: JSON.stringify({ formationId, modules }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { /* silencieux */ }
    setSaving(false);
  }

  if (loading) return <div className="py-4 text-center text-gray-800 text-sm font-semibold"><Loader2 size={16} className="animate-spin inline mr-2" />Chargement…</div>;

  return (
    <div className="mt-4 p-4 bg-white border border-green-900/30 rounded-xl space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-green-300 text-sm font-bold flex items-center gap-2"><Play size={13} /> Vidéos — {formationTitre}</p>
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 size={12} className="animate-spin" /> : saved ? <CheckCircle size={12} /> : <Save size={12} />}
          {saved ? "Sauvegardé !" : "Sauvegarder"}
        </button>
      </div>

      {modules.length === 0 ? (
        <p className="text-gray-700 text-xs font-semibold text-center py-3">Aucun module. Cliquez sur &quot;+ Module&quot; pour commencer.</p>
      ) : (
        <div className="space-y-4">
          {modules.map((mod, modIdx) => (
            <div key={mod.id} className="p-3 bg-white border border-green-200 rounded-xl space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-gray-700 text-xs font-semibold shrink-0">M{modIdx + 1}</span>
                <input
                  type="text"
                  value={mod.titre}
                  onChange={(e) => updateModule(mod.id, "titre", e.target.value)}
                  className="flex-1 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-gray-900 font-semibold text-sm focus:outline-none focus:border-green-500"
                  placeholder="Titre du module..."
                />
                <button onClick={() => removeModule(mod.id)} className="p-1.5 text-gray-800 hover:text-red-400 rounded-lg shrink-0"><Trash2 size={14} /></button>
              </div>

              {mod.videos.map((vid, vidIdx) => (
                <div key={vid.id} className="pl-6 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-900 text-xs shrink-0">V{vidIdx + 1}</span>
                    <input
                      type="text"
                      value={vid.titre}
                      onChange={(e) => updateVideo(mod.id, vid.id, "titre", e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg text-gray-900 text-xs focus:outline-none focus:border-green-500"
                      placeholder="Titre de la vidéo..."
                    />
                    <input
                      type="text"
                      value={vid.duree}
                      onChange={(e) => updateVideo(mod.id, vid.id, "duree", e.target.value)}
                      className="w-16 px-2 py-1.5 bg-green-50 border border-green-200 rounded-lg text-gray-900 text-xs focus:outline-none focus:border-green-500"
                      placeholder="12:30"
                    />
                    <button onClick={() => removeVideo(mod.id, vid.id)} className="p-1 text-gray-900 hover:text-red-400 rounded shrink-0"><X size={13} /></button>
                  </div>
                  {/* URL ou vidéo locale */}
                  {!vid.url.startsWith("local:") && (
                    <input
                      type="text"
                      value={vid.url}
                      onChange={(e) => updateVideo(mod.id, vid.id, "url", e.target.value)}
                      className="w-full pl-8 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg text-gray-700 text-xs font-semibold focus:outline-none focus:border-green-500"
                      placeholder="URL YouTube, Vimeo ou lien direct vidéo…"
                    />
                  )}
                  {/* Upload depuis PC */}
                  <div className="pl-2">
                    <UploadVideo
                      formationId={formationId}
                      videoId={vid.id}
                      uploaded={uploadedVideos.includes(vid.id)}
                      onUploaded={() => {
                        fetchUploadedVideos();
                        updateVideo(mod.id, vid.id, "url", `local:${vid.id}`);
                      }}
                      onDeleted={() => {
                        fetchUploadedVideos();
                        if (vid.url === `local:${vid.id}`) {
                          updateVideo(mod.id, vid.id, "url", "");
                        }
                      }}
                    />
                  </div>
                </div>
              ))}

              <button
                onClick={() => addVideo(mod.id)}
                className="ml-6 flex items-center gap-1.5 text-green-400 hover:text-green-300 text-xs"
              >
                <Plus size={12} /> Ajouter une vidéo
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={addModule}
        className="w-full py-2 border border-dashed border-green-700/40 hover:border-green-500 text-green-400 text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
      >
        <Plus size={13} /> Ajouter un module
      </button>
    </div>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Onglet = "tableau" | "espaces" | "consultants" | "candidatures_consultant" | "candidatures" | "ebooks" | "formations" | "annonces" | "avis" | "temoignages" | "parcours" | "motivations" | "staff" | "about";

type AdminSession = {
  password: string;
  role: AdminRole;
  nom: string;
  username: string;
};

type ServerDemande = {
  id: string;
  client: { nom: string; email: string; telephone: string; ville: string; profession?: string; capital?: string; motivation?: string };
  espaceId: string;
  espaceSlug?: string;
  espaceTitre: string;
  message: string;
  statut: "en_attente" | "validee" | "rejetee";
  noteAdmin: string;
  createdAt: string;
  updatedAt: string;
};

type ServerCandidatureConsultant = {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  ville: string;
  anneesExperience: string;
  domainesIds: string[];
  motivation: string;
  portfolioUrl?: string;
  statut: "en_attente" | "validee" | "rejetee";
  noteAdmin: string;
  createdAt: string;
  updatedAt: string;
};

// ─── Panneau Motivations Clients ──────────────────────────────────────────────

type ServerMotivation = {
  id: string; userId: string; userName: string; userEmail: string; userPhone: string;
  ebookIds: string[]; productNames: string[]; objectif: string;
  situation: string; texte: string; interetAccompagnement: string;
  date: string; lu: boolean;
};

// ─── Panel Témoignages ────────────────────────────────────────────────────────
type TemoignageAdmin = {
  id: string; type: "image" | "video" | "audio";
  imageUrl?: string; videoUrl?: string; audioUrl?: string; thumbnailUrl?: string;
  clientNom?: string; produitNom?: string; caption?: string;
  actif: boolean; ordre: number; createdAt: string;
};
type TemoignageForm = {
  type: "image" | "video" | "audio";
  imageUrl: string; videoUrl: string; audioUrl: string; thumbnailUrl: string;
  clientNom: string; produitNom: string; caption: string; actif: boolean;
};
const TEM_VIDE: TemoignageForm = { type: "image", imageUrl: "", videoUrl: "", audioUrl: "", thumbnailUrl: "", clientNom: "", produitNom: "", caption: "", actif: true };

function TemoignagesPanel({ adminPassword }: { adminPassword: string }) {
  const [items, setItems] = useState<TemoignageAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<TemoignageForm>(TEM_VIDE);
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadErr, setUploadErr] = useState("");
  const [imgProgress, setImgProgress] = useState(0);
  const [thumbProgress, setThumbProgress] = useState(0);
  const [audioProgress, setAudioProgress] = useState(0);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"tous" | "image" | "video" | "audio">("tous");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  async function fetchItems() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/temoignages", { headers: { "x-admin-password": adminPassword } });
      if (res.ok) setItems(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  }

  useEffect(() => { fetchItems(); }, []);

  async function uploadFile(
    file: File,
    field: "imageUrl" | "thumbnailUrl" | "audioUrl",
    setProgress: (p: number) => void
  ) {
    setUploadErr("");
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await uploadWithProgress("/api/admin/upload-temoignage", fd, { "x-admin-password": adminPassword }, setProgress);
      const data = await res.data() as { url?: string; error?: string };
      if (res.ok && data.url) {
        setForm((f) => ({ ...f, [field]: data.url! }));
      } else {
        setUploadErr(data.error || "Erreur upload");
        setProgress(0);
      }
    } catch {
      setUploadErr("Erreur réseau");
      setProgress(0);
    }
  }

  async function handleSave() {
    setSaving(true);
    const body = {
      ...form,
      imageUrl: form.imageUrl || undefined,
      videoUrl: form.videoUrl || undefined,
      audioUrl: form.audioUrl || undefined,
      thumbnailUrl: form.thumbnailUrl || undefined,
      clientNom: form.clientNom || undefined,
      produitNom: form.produitNom || undefined,
      caption: form.caption || undefined,
    };
    try {
      if (editId) {
        await fetch("/api/admin/temoignages", { method: "PUT", headers: { "Content-Type": "application/json", "x-admin-password": adminPassword }, body: JSON.stringify({ id: editId, ...body }) });
      } else {
        await fetch("/api/admin/temoignages", { method: "POST", headers: { "Content-Type": "application/json", "x-admin-password": adminPassword }, body: JSON.stringify(body) });
      }
      await fetchItems();
      setForm(TEM_VIDE); setEditId(null); setShowForm(false);
    } catch { /* ignore */ }
    setSaving(false);
  }

  async function toggleActif(item: TemoignageAdmin) {
    await fetch("/api/admin/temoignages", { method: "PUT", headers: { "Content-Type": "application/json", "x-admin-password": adminPassword }, body: JSON.stringify({ id: item.id, actif: !item.actif }) });
    setItems((prev) => prev.map((t) => t.id === item.id ? { ...t, actif: !t.actif } : t));
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer ce témoignage ?")) return;
    await fetch(`/api/admin/temoignages?id=${id}`, { method: "DELETE", headers: { "x-admin-password": adminPassword } });
    setItems((prev) => prev.filter((t) => t.id !== id));
  }

  function startEdit(item: TemoignageAdmin) {
    setForm({
      type: item.type,
      imageUrl: item.imageUrl || "",
      videoUrl: item.videoUrl || "",
      audioUrl: item.audioUrl || "",
      thumbnailUrl: item.thumbnailUrl || "",
      clientNom: item.clientNom || "",
      produitNom: item.produitNom || "",
      caption: item.caption || "",
      actif: item.actif,
    });
    setEditId(item.id); setShowForm(true);
  }

  function switchType(t: "image" | "video" | "audio") {
    setForm((f) => ({ ...f, type: t }));
    setUploadErr("");
    setImgProgress(0);
    setThumbProgress(0);
    setAudioProgress(0);
  }

  const canSave =
    (form.type === "image" && !!form.imageUrl) ||
    (form.type === "video" && !!form.videoUrl) ||
    (form.type === "audio" && !!form.audioUrl);

  const countImages = items.filter((i) => i.type === "image").length;
  const countVideos = items.filter((i) => i.type === "video").length;
  const countAudios = items.filter((i) => i.type === "audio").length;

  const displayed = items.filter((item) => {
    const matchType = filterType === "tous" || item.type === filterType;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      (item.clientNom || "").toLowerCase().includes(q) ||
      (item.produitNom || "").toLowerCase().includes(q) ||
      (item.caption || "").toLowerCase().includes(q);
    return matchType && matchSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900 font-black text-xl">Témoignages & Preuves sociales</h2>
          <p className="text-gray-500 text-sm mt-0.5">
            Captures WhatsApp, retours clients, vidéos — affichés sur <a href="/temoignages" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">/temoignages</a>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a href="/temoignages" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl text-xs font-medium">
            <ExternalLink size={13} /> Voir la page
          </a>
          <button onClick={() => { setForm(TEM_VIDE); setEditId(null); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-[#E8B800] hover:bg-[#27A827] text-black font-bold rounded-xl text-sm transition-colors">
            <Plus size={15} /> Ajouter
          </button>
        </div>
      </div>

      {/* Formulaire */}
      {showForm && (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 space-y-4">
          <h3 className="font-bold text-gray-900">{editId ? "Modifier le témoignage" : "Nouveau témoignage"}</h3>

          {/* Sélecteur de type */}
          <div className="flex gap-3">
            {(["image", "video", "audio"] as const).map((t) => (
              <button key={t} type="button" onClick={() => switchType(t)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-colors ${form.type === t ? "border-[#E8B800] bg-[#E8B800]/10 text-gray-900" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>
                {t === "image" ? "📷 Photo" : t === "video" ? "▶️ Vidéo" : "🎙️ Audio"}
              </button>
            ))}
          </div>

          {/* Image */}
          {form.type === "image" && (
            <div>
              <label className={labelCls}>Image (capture d&apos;écran, etc.)</label>
              <div className="flex gap-2">
                <input type="url" value={form.imageUrl} onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))} className={`${inputCls} flex-1`} placeholder="https://… ou importer ci-dessous" />
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={imgProgress > 0}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl transition-colors disabled:opacity-50 flex-shrink-0">
                  {imgProgress > 0 ? <span className="w-3.5 h-3.5 border border-gray-400 border-t-gray-700 rounded-full animate-spin" /> : <Upload size={13} />}
                  Importer
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f, "imageUrl", setImgProgress); e.target.value = ""; }} />
              </div>
              {imgProgress > 0 && <UploadProgressBar percent={imgProgress} label="Upload image…" />}
              {uploadErr && <p className="text-red-500 text-xs mt-1">{uploadErr}</p>}
              {form.imageUrl && <img src={form.imageUrl} alt="Aperçu" className="mt-2 max-h-40 rounded-xl border border-gray-200 object-contain" />}
            </div>
          )}

          {/* Vidéo */}
          {form.type === "video" && (
            <div className="space-y-3">
              <div>
                <label className={labelCls}>Lien vidéo (YouTube, Vimeo, Loom, MP4…)</label>
                <input type="url" value={form.videoUrl} onChange={(e) => setForm((f) => ({ ...f, videoUrl: e.target.value }))} className={inputCls} placeholder="https://www.youtube.com/watch?v=…" />
                {form.videoUrl && <p className="text-emerald-600 text-xs mt-1">✓ Lien vidéo configuré</p>}
              </div>
              <div>
                <label className={labelCls}>Miniature / Image de couverture (optionnel)</label>
                <div className="flex gap-2">
                  <input type="url" value={form.thumbnailUrl} onChange={(e) => setForm((f) => ({ ...f, thumbnailUrl: e.target.value }))} className={`${inputCls} flex-1`} placeholder="https://… ou importer" />
                  <button type="button" onClick={() => thumbInputRef.current?.click()} disabled={thumbProgress > 0}
                    className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl transition-colors disabled:opacity-50 flex-shrink-0">
                    {thumbProgress > 0 ? <span className="w-3.5 h-3.5 border border-gray-400 border-t-gray-700 rounded-full animate-spin" /> : <Upload size={13} />}
                    Miniature
                  </button>
                  <input ref={thumbInputRef} type="file" accept="image/*" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f, "thumbnailUrl", setThumbProgress); e.target.value = ""; }} />
                </div>
                {thumbProgress > 0 && <UploadProgressBar percent={thumbProgress} label="Upload miniature…" />}
                {form.thumbnailUrl && <img src={form.thumbnailUrl} alt="Miniature" className="mt-2 max-h-24 rounded-xl border border-gray-200 object-contain" />}
              </div>
            </div>
          )}

          {/* Audio */}
          {form.type === "audio" && (
            <div>
              <label className={labelCls}>Fichier audio (MP3, M4A, WAV, OGG — max 50 Mo)</label>
              <div className="flex gap-2">
                <input type="url" value={form.audioUrl} onChange={(e) => setForm((f) => ({ ...f, audioUrl: e.target.value }))} className={`${inputCls} flex-1`} placeholder="https://… ou importer ci-dessous" />
                <button type="button" onClick={() => audioInputRef.current?.click()} disabled={audioProgress > 0}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl transition-colors disabled:opacity-50 flex-shrink-0">
                  {audioProgress > 0 ? <span className="w-3.5 h-3.5 border border-gray-400 border-t-gray-700 rounded-full animate-spin" /> : <Upload size={13} />}
                  Importer
                </button>
                <input ref={audioInputRef} type="file" accept="audio/*,.mp3,.m4a,.wav,.ogg,.aac" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f, "audioUrl", setAudioProgress); e.target.value = ""; }} />
              </div>
              {audioProgress > 0 && <UploadProgressBar percent={audioProgress} label="Upload audio…" />}
              {uploadErr && <p className="text-red-500 text-xs mt-1">{uploadErr}</p>}
              {form.audioUrl && (
                <div className="mt-2">
                  <audio src={form.audioUrl} controls className="w-full rounded-lg" />
                </div>
              )}
            </div>
          )}

          {/* Champs communs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Nom du client (optionnel)</label>
              <input type="text" value={form.clientNom} onChange={(e) => setForm((f) => ({ ...f, clientNom: e.target.value }))} className={inputCls} placeholder="Ex: Jean-Paul K." />
            </div>
            <div>
              <label className={labelCls}>Produit associé (optionnel)</label>
              <input type="text" value={form.produitNom} onChange={(e) => setForm((f) => ({ ...f, produitNom: e.target.value }))} className={inputCls} placeholder="Ex: Guide Business Cameroun" />
            </div>
          </div>

          <div>
            <label className={labelCls}>Légende / Description (optionnel)</label>
            <textarea value={form.caption} onChange={(e) => setForm((f) => ({ ...f, caption: e.target.value }))} rows={2} className={`${inputCls} resize-none`} placeholder="Contexte ou citation du client…" />
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.actif} onChange={(e) => setForm((f) => ({ ...f, actif: e.target.checked }))} className="w-4 h-4 rounded" />
              <span className="text-sm text-gray-700 font-medium">Visible sur le site</span>
            </label>
          </div>

          <div className="flex gap-3 pt-2 border-t border-gray-200">
            <button onClick={handleSave} disabled={saving || !canSave}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#E8B800] hover:bg-[#27A827] disabled:opacity-50 text-black font-bold rounded-xl text-sm transition-colors">
              {saving ? <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <Save size={14} />}
              {editId ? "Enregistrer" : "Ajouter"}
            </button>
            <button onClick={() => { setShowForm(false); setEditId(null); setForm(TEM_VIDE); }}
              className="px-4 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-100 font-bold rounded-xl text-sm transition-colors">
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Recherche + filtres */}
      {!loading && items.length > 0 && (
        <div className="space-y-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par client, produit, description…"
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-[#E8B800] focus:ring-1 focus:ring-[#E8B800]/30"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {([
              { key: "tous" as const, label: `Tous (${items.length})` },
              ...(countImages > 0 ? [{ key: "image" as const, label: `📷 Photos (${countImages})` }] : []),
              ...(countVideos > 0 ? [{ key: "video" as const, label: `▶️ Vidéos (${countVideos})` }] : []),
              ...(countAudios > 0 ? [{ key: "audio" as const, label: `🎙️ Audios (${countAudios})` }] : []),
            ]).map(({ key, label }) => (
              <button key={key} onClick={() => setFilterType(key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${filterType === key ? "bg-[#E8B800] text-black" : "bg-white border border-gray-200 text-gray-600 hover:border-[#E8B800]/50"}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Liste */}
      {loading ? (
        <div className="flex justify-center py-10"><span className="w-6 h-6 border-2 border-[#E8B800] border-t-transparent rounded-full animate-spin" /></div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-2xl border border-gray-200">
          <ImageIcon size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">{items.length === 0 ? "Aucun témoignage ajouté" : "Aucun résultat"}</p>
          <p className="text-gray-400 text-sm mt-1">{items.length === 0 ? "Ajoutez captures, vidéos et audios pour afficher des preuves sociales." : "Modifiez votre recherche ou filtre."}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayed.map((item) => (
            <div key={item.id} className={`border rounded-2xl overflow-hidden bg-white ${item.actif ? "border-gray-200" : "border-gray-100 opacity-60"}`}>
              {/* Aperçu */}
              <div className="bg-gray-100 relative" style={{ minHeight: 100 }}>
                {item.type === "image" && item.imageUrl ? (
                  <img src={item.imageUrl} alt="" className="w-full object-cover max-h-48" />
                ) : item.type === "video" ? (
                  <div className="flex items-center justify-center h-24 bg-gray-900 relative overflow-hidden">
                    {item.thumbnailUrl && <img src={item.thumbnailUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />}
                    <Play size={28} className="text-[#E8B800] fill-[#E8B800] relative z-10" />
                  </div>
                ) : item.type === "audio" ? (
                  <div className="p-3 bg-gradient-to-br from-[#E8B800]/10 to-[#27A827]/10">
                    {item.audioUrl
                      ? <audio src={item.audioUrl} controls className="w-full" />
                      : <div className="flex items-center justify-center h-12 text-2xl">🎙️</div>
                    }
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-24 bg-gray-100">
                    <ImageIcon size={28} className="text-gray-300" />
                  </div>
                )}
                <span className={`absolute top-2 left-2 px-2 py-0.5 text-xs font-bold rounded-full ${item.actif ? "bg-emerald-100 text-emerald-700" : "bg-gray-200 text-gray-500"}`}>
                  {item.actif ? "Visible" : "Masqué"}
                </span>
                {item.type !== "audio" && (
                  <span className="absolute top-2 right-2 px-2 py-0.5 bg-black/60 text-white text-xs font-bold rounded-full">
                    {item.type === "image" ? "📷 Photo" : "▶️ Vidéo"}
                  </span>
                )}
                {item.type === "audio" && (
                  <span className="absolute top-2 right-2 px-2 py-0.5 bg-[#E8B800]/90 text-black text-xs font-bold rounded-full">
                    🎙️ Audio
                  </span>
                )}
              </div>

              {/* Infos */}
              <div className="p-3 space-y-1">
                {item.caption && <p className="text-gray-700 text-xs line-clamp-2">{item.caption}</p>}
                {item.clientNom && <p className="text-gray-900 text-xs font-bold">{item.clientNom}</p>}
                {item.produitNom && <span className="inline-block px-2 py-0.5 bg-[#E8B800]/10 text-[#E8B800] text-xs font-medium rounded-full">{item.produitNom}</span>}
              </div>

              {/* Actions */}
              <div className="flex border-t border-gray-100">
                <button onClick={() => startEdit(item)} className="flex-1 py-2 text-xs text-blue-600 hover:bg-blue-50 font-medium transition-colors flex items-center justify-center gap-1">
                  <Pencil size={11} /> Modifier
                </button>
                <div className="w-px bg-gray-100" />
                <button onClick={() => toggleActif(item)} className="flex-1 py-2 text-xs text-gray-600 hover:bg-gray-50 font-medium transition-colors flex items-center justify-center gap-1">
                  {item.actif ? <><ToggleRight size={13} className="text-emerald-500" /> Masquer</> : <><ToggleLeft size={13} /> Afficher</>}
                </button>
                <div className="w-px bg-gray-100" />
                <button onClick={() => handleDelete(item.id)} className="flex-1 py-2 text-xs text-red-500 hover:bg-red-50 font-medium transition-colors flex items-center justify-center gap-1">
                  <Trash2 size={11} /> Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Panel Motivations ────────────────────────────────────────────────────────
function MotivationsPanel({ adminPassword, onUnreadCountChange }: {
  adminPassword: string;
  onUnreadCountChange?: (count: number) => void;
}) {
  const [motivations, setMotivations] = useState<ServerMotivation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const syncUnread = (list: ServerMotivation[]) => {
    const count = list.filter((m) => !m.lu).length;
    onUnreadCountChange?.(count);
  };

  useEffect(() => {
    fetch("/api/motivations", { headers: { "x-admin-password": adminPassword } })
      .then((r) => r.json())
      .then((d) => {
        const list: ServerMotivation[] = (d.motivations ?? []).map((m: ServerMotivation) => ({ ...m, lu: m.lu ?? false }));
        setMotivations(list);
        syncUnread(list);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminPassword]);

  async function markLu(id: string, lu: boolean) {
    setTogglingId(id);
    try {
      await fetch("/api/motivations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-password": adminPassword },
        body: JSON.stringify({ id, lu }),
      });
      setMotivations((prev) => {
        const updated = prev.map((m) => m.id === id ? { ...m, lu } : m);
        syncUnread(updated);
        return updated;
      });
    } catch { /* ignore */ } finally {
      setTogglingId(null);
    }
  }

  function handleExpand(id: string) {
    const isOpening = expanded !== id;
    setExpanded(isOpening ? id : null);
    // Auto-marquer comme lu à l'ouverture
    if (isOpening) {
      const m = motivations.find((m) => m.id === id);
      if (m && !m.lu) markLu(id, true);
    }
  }

  const filtered = motivations.filter((m) => {
    const q = search.toLowerCase();
    return !q || m.userName.toLowerCase().includes(q) || m.userEmail.toLowerCase().includes(q)
      || m.productNames.join(" ").toLowerCase().includes(q) || m.texte.toLowerCase().includes(q);
  });

  const unread = motivations.filter((m) => !m.lu).length;

  if (loading) {
    return <div className="flex justify-center py-16"><span className="w-8 h-8 border-2 border-green-200 border-t-green-500 rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-5">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-gray-900 font-bold text-lg">Motivations Clients</h2>
            {unread > 0 && (
              <span className="px-2 py-0.5 bg-blue-500 text-white text-xs font-black rounded-full animate-pulse">
                {unread} non lu{unread > 1 ? "s" : ""}
              </span>
            )}
          </div>
          <p className="text-gray-500 text-xs mt-0.5">{motivations.length} reçue{motivations.length !== 1 ? "s" : ""}</p>
        </div>
        <input
          type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher…"
          className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:border-green-500 w-full sm:w-56"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          {search ? "Aucun résultat pour cette recherche." : "Aucune motivation reçue pour le moment."}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((m) => {
            const isUnread = !m.lu;
            const isExpanded = expanded === m.id;
            return (
              <div key={m.id} className={`rounded-2xl overflow-hidden shadow-sm transition-all border ${isUnread ? "border-blue-200 bg-blue-50/40" : "border-gray-200 bg-white"}`}>
                {/* Ligne principale */}
                <button
                  type="button"
                  onClick={() => handleExpand(m.id)}
                  className={`w-full text-left px-5 py-4 flex flex-wrap md:flex-nowrap items-start md:items-center gap-3 transition-colors ${isUnread ? "hover:bg-blue-50/60" : "hover:bg-gray-50"}`}
                >
                  {/* Indicateur non-lu */}
                  <div className="flex-shrink-0 self-center">
                    <span className={`block w-2.5 h-2.5 rounded-full transition-colors ${isUnread ? "bg-blue-500" : "bg-gray-200"}`} />
                  </div>

                  {/* Avatar initiale */}
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#E8B800]/20 to-[#27A827]/10 border border-[#E8B800]/30 flex items-center justify-center text-[#E8B800] font-black text-sm flex-shrink-0">
                    {(m.userName || "?").charAt(0).toUpperCase()}
                  </div>

                  {/* Nom + email */}
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm truncate ${isUnread ? "text-gray-900 font-bold" : "text-gray-900 font-semibold"}`}>
                      {m.userName || "Anonyme"}
                      {isUnread && <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-blue-500 text-white rounded-full font-black align-middle">NOUVEAU</span>}
                    </p>
                    {m.userEmail && <p className="text-gray-400 text-xs truncate">{m.userEmail}</p>}
                  </div>

                  {/* Produit(s) */}
                  <div className="min-w-0 flex-1">
                    {m.productNames.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {m.productNames.map((n, i) => (
                          <span key={i} title={n} className="text-xs px-2 py-0.5 bg-[#E8B800]/10 text-[#E8B800] border border-[#E8B800]/20 rounded-full break-words whitespace-normal">{n}</span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs italic">Produit inconnu</span>
                    )}
                  </div>

                  {/* Extrait texte */}
                  <div className="min-w-0 flex-[2] hidden md:block">
                    <p className={`text-xs truncate italic ${isUnread ? "text-gray-700" : "text-gray-500"}`}>&ldquo;{m.texte || "—"}&rdquo;</p>
                  </div>

                  {/* Date */}
                  <div className="text-gray-400 text-xs whitespace-nowrap flex-shrink-0">
                    {new Date(m.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                  </div>

                  <span className={`text-gray-400 text-xs transition-transform flex-shrink-0 ${isExpanded ? "rotate-180" : ""}`}>▾</span>
                </button>

                {/* Détail expandable */}
                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-gray-100 space-y-4 pt-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-1">Objectif</p>
                        <p className="text-gray-700 text-sm">{m.objectif || "—"}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-1">Situation</p>
                        <p className="text-gray-700 text-sm">{m.situation || "—"}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-1">Motivation</p>
                      <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{m.texte || "—"}</p>
                    </div>
                    {m.interetAccompagnement && (
                      <div>
                        <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-1">Intérêt accompagnement</p>
                        <p className="text-gray-700 text-sm">{m.interetAccompagnement}</p>
                      </div>
                    )}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100">
                      {/* Boutons contact rapide */}
                      <div className="flex flex-wrap gap-2">
                        {m.userPhone && (
                          <a
                            href={`https://wa.me/${m.userPhone.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366] hover:bg-[#20b858] text-white text-xs font-bold rounded-lg transition-colors"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                            WhatsApp
                          </a>
                        )}
                        {m.userEmail && (
                          <a
                            href={`mailto:${m.userEmail}`}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg border border-blue-200 transition-colors"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                            Email
                          </a>
                        )}
                        <div className="flex flex-wrap gap-1.5 text-xs text-gray-400 items-center">
                          {m.userPhone && <span className="font-mono">{m.userPhone}</span>}
                          {m.userPhone && m.userEmail && <span>·</span>}
                          <span>{new Date(m.date).toLocaleString("fr-FR")}</span>
                        </div>
                      </div>
                      {/* Toggle lu/non-lu */}
                      <button
                        type="button"
                        disabled={togglingId === m.id}
                        onClick={() => markLu(m.id, !m.lu)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 ${m.lu
                          ? "bg-gray-100 text-gray-500 hover:bg-blue-50 hover:text-blue-600"
                          : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${m.lu ? "bg-gray-400" : "bg-blue-500"}`} />
                        {togglingId === m.id ? "…" : m.lu ? "Marquer non lu" : "Marquer comme lu"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Panneau Parcours Client (Workflow Config) ────────────────────────────────

type WorkflowConfig = {
  motivationEnabled: boolean;
  avisEnabled: boolean;
  accompagnementEnabled: boolean;
  congratsTitle: string;
  congratsSubtitle: string;
  motivationObjectifLabel: string;
  motivationSituationLabel: string;
  motivationTexteLabel: string;
  motivationTexteplaceholder: string;
  motivationAccompagnementLabel: string;
  motivationSubmitLabel: string;
  motivationSkipLabel: string;
  successTitle: string;
  successSubtitle: string;
  downloadLabel: string;
  watchLabel: string;
  monEspaceLabel: string;
};

const WF_DEFAULTS: WorkflowConfig = {
  motivationEnabled: true,
  avisEnabled: false,
  accompagnementEnabled: true,
  congratsTitle: "Paiement confirmé ! 🎉",
  congratsSubtitle: "Avant d'accéder à votre contenu, prenez 1 minute pour nous partager vos motivations. Cela nous aide à mieux vous accompagner.",
  motivationObjectifLabel: "Quel est votre objectif principal ?",
  motivationSituationLabel: "Quelle est votre situation actuelle ?",
  motivationTexteLabel: "Qu'est-ce qui vous a motivé à effectuer cet achat ?",
  motivationTexteplaceholder: "Décrivez brièvement votre projet, vos attentes, ou ce qui vous a poussé à passer à l'action…",
  motivationAccompagnementLabel: "Seriez-vous intéressé(e) par un programme d'accompagnement personnalisé ?",
  motivationSubmitLabel: "Envoyer mes motivations",
  motivationSkipLabel: "Passer cette étape →",
  successTitle: "C'est tout bon ! 🎉",
  successSubtitle: "Votre achat est confirmé. Téléchargez vos produits ci-dessous ou retrouvez-les à tout moment dans Mon Espace.",
  downloadLabel: "Télécharger",
  watchLabel: "Visionner",
  monEspaceLabel: "Accéder à Mon Espace →",
};

function WorkflowConfigPanel({ adminPassword }: { adminPassword: string }) {
  const [cfg, setCfg] = useState<WorkflowConfig>(WF_DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/admin/workflow-config", { headers: { "x-admin-password": adminPassword } })
      .then((r) => r.json())
      .then((d) => setCfg((prev) => ({ ...prev, ...d })))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [adminPassword]);

  async function save() {
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/workflow-config", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-password": adminPassword },
        body: JSON.stringify(cfg),
      });
      const data = await res.json();
      if (data.success) { setMsg("✓ Configuration enregistrée"); }
      else { setMsg(data.error ?? "Erreur"); }
    } catch { setMsg("Erreur réseau"); }
    setSaving(false);
  }

  function Toggle({ field, label, description }: { field: keyof WorkflowConfig; label: string; description: string }) {
    const val = cfg[field] as boolean;
    return (
      <div className="flex items-start justify-between gap-4 p-4 bg-white border border-gray-200 rounded-xl">
        <div className="min-w-0">
          <p className="text-gray-900 font-semibold text-sm">{label}</p>
          <p className="text-gray-500 text-xs mt-0.5">{description}</p>
        </div>
        <button
          type="button"
          onClick={() => setCfg((c) => ({ ...c, [field]: !val }))}
          className={`flex-shrink-0 w-12 h-6 rounded-full transition-colors flex items-center px-0.5 ${val ? "bg-green-500" : "bg-gray-300"}`}
        >
          <span className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${val ? "translate-x-6" : "translate-x-0"}`} />
        </button>
      </div>
    );
  }

  function Field({ field, label, multiline }: { field: keyof WorkflowConfig; label: string; multiline?: boolean }) {
    const val = cfg[field] as string;
    return (
      <div>
        <label className="block text-gray-700 text-xs font-semibold mb-1">{label}</label>
        {multiline ? (
          <textarea
            rows={2}
            value={val}
            onChange={(e) => setCfg((c) => ({ ...c, [field]: e.target.value }))}
            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 text-sm focus:outline-none focus:border-green-500 resize-none"
          />
        ) : (
          <input
            type="text"
            value={val}
            onChange={(e) => setCfg((c) => ({ ...c, [field]: e.target.value }))}
            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 text-sm focus:outline-none focus:border-green-500"
          />
        )}
      </div>
    );
  }

  if (loading) return <div className="flex justify-center py-16"><span className="w-8 h-8 border-2 border-green-200 border-t-green-500 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-8">
      {/* Switches */}
      <div className="p-5 bg-white border border-green-200 rounded-2xl space-y-3">
        <h3 className="text-gray-900 font-bold text-base mb-4">Activation des étapes</h3>
        <Toggle field="motivationEnabled" label="Formulaire de motivation" description="Affiché juste après le paiement, avant l'accès au contenu." />
        <Toggle field="accompagnementEnabled" label="Bloc accompagnement" description="Affiche la question d'intérêt pour l'accompagnement dans le formulaire de motivation." />
        <Toggle field="avisEnabled" label="Formulaire d'avis" description="Réservé — sera affiché après le téléchargement (non encore utilisé)." />
      </div>

      {/* Messages de félicitations */}
      <div className="p-5 bg-white border border-green-200 rounded-2xl space-y-4">
        <h3 className="text-gray-900 font-bold text-base">Messages de félicitations</h3>
        <Field field="congratsTitle" label="Titre (formulaire motivation)" />
        <Field field="congratsSubtitle" label="Sous-titre (formulaire motivation)" multiline />
        <Field field="successTitle" label="Titre (page succès)" />
        <Field field="successSubtitle" label="Sous-titre (page succès)" multiline />
      </div>

      {/* Questions du formulaire */}
      <div className="p-5 bg-white border border-green-200 rounded-2xl space-y-4">
        <h3 className="text-gray-900 font-bold text-base">Questions du formulaire de motivation</h3>
        <Field field="motivationObjectifLabel" label="Question objectif" />
        <Field field="motivationSituationLabel" label="Question situation" />
        <Field field="motivationTexteLabel" label="Question motivation (texte libre)" />
        <Field field="motivationTexteplaceholder" label="Placeholder texte libre" multiline />
        <Field field="motivationAccompagnementLabel" label="Question accompagnement" multiline />
      </div>

      {/* Libellés des boutons */}
      <div className="p-5 bg-white border border-green-200 rounded-2xl space-y-4">
        <h3 className="text-gray-900 font-bold text-base">Libellés des boutons</h3>
        <Field field="motivationSubmitLabel" label="Bouton soumettre motivations" />
        <Field field="motivationSkipLabel" label="Bouton passer cette étape" />
        <Field field="downloadLabel" label="Bouton télécharger" />
        <Field field="watchLabel" label="Bouton visionner (formation)" />
        <Field field="monEspaceLabel" label="Bouton Mon Espace" />
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-sm transition-colors disabled:opacity-60"
        >
          {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
          Enregistrer
        </button>
        {msg && <span className={`text-sm font-semibold ${msg.startsWith("✓") ? "text-emerald-600" : "text-red-500"}`}>{msg}</span>}
      </div>
    </div>
  );
}

// ─── Panel À propos ──────────────────────────────────────────────────────────

type AboutConfig = {
  enabled: boolean;
  logoUrl: string;
  sectionTitle: string;
  positiveRatingsPct: number;
  totalRatings: number;
  totalCustomers: number;
  description: string;
  whatsappNumber: string;
};

const ABOUT_DEFAULTS: AboutConfig = {
  enabled: true,
  logoUrl: "/logo-smartlife.jpeg",
  sectionTitle: "À propos",
  positiveRatingsPct: 98,
  totalRatings: 780,
  totalCustomers: 32583,
  description: "Nous sommes une plateforme dédiée à votre développement personnel et entrepreneurial. Nos contenus sont conçus par des experts pour vous aider à atteindre vos objectifs.",
  whatsappNumber: "+237694176642",
};

// Interrupteur général : montrer ou masquer les formations sur tout le site.
function InterrupteurFormations({ adminPassword }: { adminPassword: string }) {
  const [actives, setActives] = useState<boolean | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/admin/site-settings", { headers: { "x-admin-password": adminPassword } })
      .then((r) => r.json())
      .then((d) => setActives(!!d.formationsActives))
      .catch(() => setActives(false));
  }, [adminPassword]);

  async function basculer() {
    if (actives === null) return;
    setEnCours(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/site-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-password": adminPassword },
        body: JSON.stringify({ formationsActives: !actives }),
      });
      const d = await res.json();
      if (d.success) {
        setActives(!!d.reglages.formationsActives);
        setMessage(d.reglages.formationsActives ? "Les formations sont de nouveau visibles sur le site." : "Les formations sont masquées sur le site.");
      } else setMessage(d.error ?? "Erreur");
    } catch { setMessage("Erreur réseau"); }
    setEnCours(false);
  }

  return (
    <div className="mb-6 rounded-2xl border-2 p-5 flex flex-col sm:flex-row sm:items-center gap-4"
      style={{ borderColor: actives ? "#27A827" : "#E8B800", background: actives ? "#f0fbf0" : "#fffbea" }}>
      <div className="flex-1">
        <p className="font-bold text-gray-900">
          {actives === null ? "Chargement…" : actives ? "Formations visibles sur le site" : "Formations masquées sur le site"}
        </p>
        <p className="text-sm text-gray-600 mt-1">
          Quand elles sont masquées, les formations n&apos;apparaissent plus dans « Souvent achetés ensemble », la recherche,
          le catalogue ni le plan du site. Les clients qui en ont déjà acheté une gardent l&apos;accès à leurs vidéos.
        </p>
        {message && <p className="text-sm font-semibold mt-2" style={{ color: "#1b7a1b" }}>{message}</p>}
      </div>
      <button onClick={basculer} disabled={enCours || actives === null}
        className="px-5 py-3 rounded-xl font-bold text-sm disabled:opacity-50"
        style={{ background: actives ? "#E8B800" : "#27A827", color: actives ? "#111" : "#fff" }}>
        {enCours ? "Enregistrement…" : actives ? "Masquer les formations" : "Réactiver les formations"}
      </button>
    </div>
  );
}

function AboutConfigPanel({ adminPassword }: { adminPassword: string }) {
  const [cfg, setCfg] = useState<AboutConfig>(ABOUT_DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/admin/about-config", { headers: { "x-admin-password": adminPassword } })
      .then((r) => r.json())
      .then((d) => setCfg((prev) => ({ ...prev, ...d })))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [adminPassword]);

  async function save() {
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/about-config", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-password": adminPassword },
        body: JSON.stringify(cfg),
      });
      const data = await res.json();
      if (data.success) setMsg("✓ Configuration enregistrée");
      else setMsg(data.error ?? "Erreur");
    } catch { setMsg("Erreur réseau"); }
    setSaving(false);
  }

  async function uploadLogo(file: File) {
    setUploadingLogo(true);
    setMsg("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload-about-logo", {
        method: "POST",
        headers: { "x-admin-password": adminPassword },
        body: fd,
      });
      const data = await res.json();
      if (data.url) {
        setCfg((c) => ({ ...c, logoUrl: data.url }));
        setMsg("✓ Logo uploadé — pensez à enregistrer");
      } else {
        setMsg(data.error ?? "Erreur upload");
      }
    } catch { setMsg("Erreur réseau"); }
    setUploadingLogo(false);
  }

  if (loading) return <div className="flex justify-center py-16"><span className="w-8 h-8 border-2 border-green-200 border-t-green-500 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      {/* Activation */}
      <div className="flex items-start justify-between gap-4 p-4 bg-white border border-gray-200 rounded-xl">
        <div>
          <p className="text-gray-900 font-semibold text-sm">Afficher le bloc « À propos »</p>
          <p className="text-gray-500 text-xs mt-0.5">Visible en bas de la page de paiement.</p>
        </div>
        <button
          type="button"
          onClick={() => setCfg((c) => ({ ...c, enabled: !c.enabled }))}
          className={`flex-shrink-0 w-12 h-6 rounded-full transition-colors flex items-center px-0.5 ${cfg.enabled ? "bg-green-500" : "bg-gray-300"}`}
        >
          <span className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${cfg.enabled ? "translate-x-6" : "translate-x-0"}`} />
        </button>
      </div>

      {/* Logo */}
      <div className="p-5 bg-white border border-green-200 rounded-2xl space-y-4">
        <h3 className="text-gray-900 font-bold text-base">Logo</h3>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={cfg.logoUrl} alt="Logo actuel" className="w-full h-full object-cover" />
          </div>
          <div className="space-y-2">
            <input
              ref={logoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/svg+xml"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadLogo(f); e.target.value = ""; }}
            />
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              disabled={uploadingLogo}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-60"
            >
              {uploadingLogo ? <><Loader2 size={14} className="animate-spin" /> Upload...</> : <><Upload size={14} /> Changer le logo</>}
            </button>
            <div>
              <label className="block text-gray-500 text-xs mb-1">Ou saisir une URL</label>
              <input
                type="text"
                value={cfg.logoUrl}
                onChange={(e) => setCfg((c) => ({ ...c, logoUrl: e.target.value }))}
                className="w-72 px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 text-sm focus:outline-none focus:border-green-500"
                placeholder="/logo-smartlife.jpeg"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Titre section */}
      <div className="p-5 bg-white border border-green-200 rounded-2xl space-y-4">
        <h3 className="text-gray-900 font-bold text-base">Titre de la section</h3>
        <div>
          <label className="block text-gray-700 text-xs font-semibold mb-1">Titre affiché</label>
          <input
            type="text"
            value={cfg.sectionTitle}
            onChange={(e) => setCfg((c) => ({ ...c, sectionTitle: e.target.value }))}
            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 text-sm focus:outline-none focus:border-green-500"
            placeholder="À propos"
          />
        </div>
      </div>

      {/* Statistiques */}
      <div className="p-5 bg-white border border-green-200 rounded-2xl space-y-4">
        <h3 className="text-gray-900 font-bold text-base">Statistiques</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-gray-700 text-xs font-semibold mb-1">Avis positifs (%)</label>
            <input
              type="number"
              min={0}
              max={100}
              value={cfg.positiveRatingsPct}
              onChange={(e) => setCfg((c) => ({ ...c, positiveRatingsPct: Number(e.target.value) }))}
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 text-sm focus:outline-none focus:border-green-500"
            />
            <p className="text-gray-400 text-xs mt-1">ex : 98</p>
          </div>
          <div>
            <label className="block text-gray-700 text-xs font-semibold mb-1">Nombre d'avis</label>
            <input
              type="number"
              min={0}
              value={cfg.totalRatings}
              onChange={(e) => setCfg((c) => ({ ...c, totalRatings: Number(e.target.value) }))}
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 text-sm focus:outline-none focus:border-green-500"
            />
            <p className="text-gray-400 text-xs mt-1">ex : 780</p>
          </div>
          <div>
            <label className="block text-gray-700 text-xs font-semibold mb-1">Nombre de clients</label>
            <input
              type="number"
              min={0}
              value={cfg.totalCustomers}
              onChange={(e) => setCfg((c) => ({ ...c, totalCustomers: Number(e.target.value) }))}
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 text-sm focus:outline-none focus:border-green-500"
            />
            <p className="text-gray-400 text-xs mt-1">ex : 32583</p>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="p-5 bg-white border border-green-200 rounded-2xl space-y-4">
        <h3 className="text-gray-900 font-bold text-base">Texte de présentation</h3>
        <textarea
          rows={4}
          value={cfg.description}
          onChange={(e) => setCfg((c) => ({ ...c, description: e.target.value }))}
          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 text-sm focus:outline-none focus:border-green-500 resize-none"
          placeholder="Description de votre marque..."
        />
      </div>

      {/* WhatsApp */}
      <div className="p-5 bg-white border border-green-200 rounded-2xl space-y-4">
        <h3 className="text-gray-900 font-bold text-base">Support WhatsApp</h3>
        <div>
          <label className="block text-gray-700 text-xs font-semibold mb-1">Numéro WhatsApp (avec indicatif)</label>
          <input
            type="text"
            value={cfg.whatsappNumber}
            onChange={(e) => setCfg((c) => ({ ...c, whatsappNumber: e.target.value }))}
            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 text-sm focus:outline-none focus:border-green-500"
            placeholder="+237694176642"
          />
          <p className="text-gray-400 text-xs mt-1">Laissez vide pour masquer la ligne de contact.</p>
        </div>
      </div>

      {/* Aperçu */}
      <div className="p-5 bg-gray-50 border border-dashed border-gray-300 rounded-2xl space-y-4">
        <h3 className="text-gray-700 font-bold text-sm">Aperçu</h3>
        <div className="p-5 bg-white border border-gray-200 rounded-xl space-y-4 max-w-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg overflow-hidden border border-gray-100 flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={cfg.logoUrl} alt="" className="w-full h-full object-cover" />
            </div>
            <span className="text-gray-900 font-bold text-sm">{cfg.sectionTitle || "À propos"}</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 bg-gray-50 rounded-lg">
              <p className="text-gray-900 font-black text-base">{cfg.positiveRatingsPct}%</p>
              <p className="text-gray-500 text-[10px]">positive ratings</p>
            </div>
            <div className="p-2 bg-gray-50 rounded-lg">
              <p className="text-gray-900 font-black text-base">{cfg.totalRatings.toLocaleString("fr-FR")}</p>
              <p className="text-gray-500 text-[10px]">total ratings</p>
            </div>
            <div className="p-2 bg-gray-50 rounded-lg">
              <p className="text-gray-900 font-black text-base">{cfg.totalCustomers.toLocaleString("fr-FR")}</p>
              <p className="text-gray-500 text-[10px]">customers</p>
            </div>
          </div>
          {cfg.description && <p className="text-gray-500 text-xs leading-relaxed line-clamp-3">{cfg.description}</p>}
          {cfg.whatsappNumber && (
            <p className="text-green-600 text-xs font-semibold">WhatsApp : {cfg.whatsappNumber}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-sm transition-colors disabled:opacity-60"
        >
          {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
          Enregistrer
        </button>
        {msg && <span className={`text-sm font-semibold ${msg.startsWith("✓") ? "text-emerald-600" : "text-red-500"}`}>{msg}</span>}
      </div>
    </div>
  );
}

export default function AdminPanelPage() {
  const store = useAccompagnementStore();
  const catalogue = useCatalogueStore();

  // Auth
  const [adminSession, setAdminSession] = useState<AdminSession | null>(null);
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Navigation — démarre sur le premier onglet autorisé par le rôle
  const [onglet, setOnglet] = useState<Onglet>("espaces");

  // États Espaces
  const [showEspaceForm, setShowEspaceForm] = useState(false);
  const [editEspaceId, setEditEspaceId] = useState<string | null>(null);
  const [confirmDeleteEspace, setConfirmDeleteEspace] = useState<string | null>(null);

  // États Consultants
  const [showConsultantForm, setShowConsultantForm] = useState(false);
  const [editConsultantId, setEditConsultantId] = useState<string | null>(null);
  const [confirmDeleteConsultant, setConfirmDeleteConsultant] = useState<string | null>(null);

  // États Candidatures
  const [filtreStatut, setFiltreStatut] = useState<"toutes" | "en_attente" | "validee" | "rejetee">("toutes");
  const [search, setSearch] = useState("");
  const [selectedServerDemande, setSelectedServerDemande] = useState<ServerDemande | null>(null);

  // Données serveur (demandes, candidatures consultants)
  const [serverDemandes, setServerDemandes] = useState<ServerDemande[]>([]);
  const [serverCandidatures, setServerCandidatures] = useState<ServerCandidatureConsultant[]>([]);
  const [selectedCandidatureConsultant, setSelectedCandidatureConsultant] = useState<ServerCandidatureConsultant | null>(null);

  type AnnouncementItem = { id: string; text: string; active: boolean; color: "yellow" | "green" | "red" | "blue" | "custom"; link?: string; linkText?: string; bgColor?: string; textColor?: string; btnBgColor?: string; btnTextColor?: string };
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [announcementSaving, setAnnouncementSaving] = useState(false);

  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [ebookSyncStatus, setEbookSyncStatus] = useState<"idle" | "syncing" | "ok" | "error">("idle");
  const [copiedEbookId, setCopiedEbookId] = useState<string | null>(null);

  type AdminReview = { id: string; productId: string; productType: string; userId: string; userName: string; rating: number; text: string; statut: "en_attente" | "approuve" | "rejete"; createdAt: string };
  const [adminReviews, setAdminReviews] = useState<AdminReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [unreadMotivationsCount, setUnreadMotivationsCount] = useState(0);

  // PDFs uploadés sur le serveur
  const [uploadedPdfs, setUploadedPdfs] = useState<string[]>([]);
  // Couvertures uploadées { ebookId: url }
  const [uploadedCovers, setUploadedCovers] = useState<Record<string, string>>({});

  const fetchUploadedPdfs = useCallback(async () => {
    if (!adminSession) return;
    try {
      const res = await fetch("/api/admin/upload", {
        headers: { "x-admin-password": adminSession.password },
      });
      if (res.ok) {
        const data = await res.json();
        setUploadedPdfs(data.uploaded ?? []);
      }
    } catch { /* silencieux */ }
  }, [adminSession]);

  const fetchUploadedCovers = useCallback(async () => {
    if (!adminSession) return;
    try {
      const res = await fetch("/api/admin/upload-cover", {
        headers: { "x-admin-password": adminSession.password },
      });
      if (res.ok) {
        const data = await res.json();
        setUploadedCovers(data.covers ?? {});
      }
    } catch { /* silencieux */ }
  }, [adminSession]);

  // Sync des consultants vers le serveur
  async function syncConsultantsToServer(consultantsList: typeof store.consultants) {
    if (!adminSession) return;
    try {
      await fetch("/api/admin/sync-consultants", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-password": adminSession.password },
        body: JSON.stringify({ consultants: consultantsList }),
      });
    } catch { /* silencieux */ }
  }

  // Sync des ebooks vers le serveur
  function clearSwDataCache() {
    try {
      if (typeof navigator !== "undefined" && navigator.serviceWorker?.controller) {
        navigator.serviceWorker.controller.postMessage({ type: "CLEAR_DATA_CACHE" });
      }
    } catch { /* silencieux */ }
  }

  async function syncEbooksToServer() {
    if (!adminSession) return;
    setEbookSyncStatus("syncing");
    try {
      const state = useCatalogueStore.getState();
      const res = await fetch("/api/admin/sync-ebooks", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-password": adminSession.password },
        body: JSON.stringify({ ebooks: state.ebooks, overrides: state.ebookOverrides, actif: state.staticEbookActif }),
      });
      if (res.ok) clearSwDataCache();
      setEbookSyncStatus(res.ok ? "ok" : "error");
      setTimeout(() => setEbookSyncStatus("idle"), 3000);
    } catch {
      setEbookSyncStatus("error");
      setTimeout(() => setEbookSyncStatus("idle"), 3000);
    }
  }

  // Sync des formations vers le serveur
  async function syncFormationsToServer() {
    if (!adminSession) return;
    try {
      const state = useCatalogueStore.getState();
      const res = await fetch("/api/admin/sync-formations", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-password": adminSession.password },
        body: JSON.stringify({ formations: state.formations, overrides: state.formationOverrides, actif: state.staticFormationActif }),
      });
      if (res.ok) clearSwDataCache();
    } catch { /* silencieux */ }
  }

  // Sync des espaces vers le serveur (persistance multi-navigateurs)
  async function syncEspacesToServer(espacesList: EspacePersonnalise[]) {
    if (!adminSession) return;
    try {
      await fetch("/api/admin/sync-espaces", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-password": adminSession.password },
        body: JSON.stringify({ espaces: espacesList }),
      });
    } catch { /* silencieux */ }
  }

  // Charger les données serveur dès que l'admin est authentifié
  useEffect(() => {
    if (adminSession) {
      fetchUploadedPdfs();
      fetchUploadedCovers();
      // NE PAS syncEspacesToServer au login : charger depuis serveur d'abord (serveur = source de vérité)
      Promise.all([
        fetch("/api/admin/sync-consultants", { headers: { "x-admin-password": adminSession.password } }).then(r => r.json()).catch(() => ({})),
        fetch(`/api/demandes?password=${adminSession.password}`).then(r => r.json()).catch(() => ({})),
        fetch(`/api/candidatures?password=${adminSession.password}`).then(r => r.json()).catch(() => ({})),
        fetch("/api/admin/sync-ebooks", { headers: { "x-admin-password": adminSession.password } }).then(r => r.json()).catch(() => ({})),
        fetch("/api/admin/sync-formations", { headers: { "x-admin-password": adminSession.password } }).then(r => r.json()).catch(() => ({})),
        fetch("/api/espaces").then(r => r.json()).catch(() => ({ espaces: [] })),
      ]).then(([cData, dData, candData, ebData, fData, espData]) => {
        if (Array.isArray(cData.consultants)) {
          useAccompagnementStore.setState({ consultants: cData.consultants });
        }
        if (Array.isArray(dData.demandes)) setServerDemandes(dData.demandes);
        if (Array.isArray(candData.candidatures)) setServerCandidatures(candData.candidatures);

        // Ebooks : serveur prioritaire ; si serveur vide → garder local + pousser vers serveur
        if (Array.isArray(ebData.ebooks)) {
          const serverHasEbookData = ebData.ebooks.length > 0 || Object.keys(ebData.overrides || {}).length > 0;
          if (serverHasEbookData) {
            useCatalogueStore.setState({ ebooks: ebData.ebooks, ebookOverrides: ebData.overrides || {}, staticEbookActif: ebData.actif || {} });
          } else {
            // Serveur vide — NE PAS écraser les overrides locaux (descriptions, prix, etc.)
            const localEbooks = useCatalogueStore.getState().ebooks;
            const localOverrides = useCatalogueStore.getState().ebookOverrides;
            if (Object.keys(ebData.actif || {}).length > 0) {
              useCatalogueStore.setState({ staticEbookActif: ebData.actif });
            }
            // Synchroniser si données locales présentes (ebooks dynamiques OU overrides statiques)
            if (localEbooks.length > 0 || Object.keys(localOverrides).length > 0) {
              setTimeout(syncEbooksToServer, 300);
            }
          }
        }

        // Formations : serveur prioritaire ; si serveur vide → garder local + pousser vers serveur
        if (Array.isArray(fData.formations)) {
          const serverHasFormationData = fData.formations.length > 0 || Object.keys(fData.overrides || {}).length > 0;
          if (serverHasFormationData) {
            useCatalogueStore.setState({ formations: fData.formations, formationOverrides: fData.overrides || {}, staticFormationActif: fData.actif || {} });
          } else {
            const localFormations = useCatalogueStore.getState().formations;
            const localFormationOverrides = useCatalogueStore.getState().formationOverrides;
            if (Object.keys(fData.actif || {}).length > 0) {
              useCatalogueStore.setState({ staticFormationActif: fData.actif });
            }
            if (localFormations.length > 0 || Object.keys(localFormationOverrides).length > 0) {
              setTimeout(syncFormationsToServer, 300);
            }
          }
        }

        // Espaces : fusionner serveur + locaux non présents sur serveur, puis resynchroniser si besoin
        const serverEspaces: EspacePersonnalise[] = espData.espaces ?? [];
        const localEspaces = useAccompagnementStore.getState().espaces;
        const serverIds = new Set(serverEspaces.map((e) => e.id));
        const localOnly = localEspaces.filter((e) => !serverIds.has(e.id));
        const merged = [...serverEspaces, ...localOnly];
        if (merged.length > 0) {
          useAccompagnementStore.setState({ espaces: merged });
          if (localOnly.length > 0) setTimeout(() => syncEspacesToServer(merged), 300);
        } else if (localEspaces.length > 0) {
          setTimeout(() => syncEspacesToServer(localEspaces), 300);
        }
      }).catch(() => {});
      // Charger annonces marketing
      fetch("/api/admin/announcement", { headers: { "x-admin-password": adminSession.password } })
        .then(r => r.json()).then(d => { if (Array.isArray(d)) setAnnouncements(d); }).catch(() => {});
      // Charger catégories personnalisées
      fetch("/api/admin/custom-categories", { headers: { "x-admin-password": adminSession.password } })
        .then(r => r.json()).then(d => { if (Array.isArray(d.categories)) setCustomCategories(d.categories); }).catch(() => {});
      // Charger les avis
      setReviewsLoading(true);
      fetch("/api/admin/reviews", { headers: { "x-admin-password": adminSession.password } })
        .then(r => r.json()).then(d => { if (Array.isArray(d.reviews)) setAdminReviews(d.reviews); }).catch(() => {}).finally(() => setReviewsLoading(false));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminSession?.password]);

  // États Ebooks
  const [showEbookForm, setShowEbookForm] = useState(false);
  const [editEbookId, setEditEbookId] = useState<string | null>(null);
  const [confirmDeleteEbook, setConfirmDeleteEbook] = useState<string | null>(null);
  const [ebookSearch, setEbookSearch] = useState("");

  // États Formations
  const [showFormationForm, setShowFormationForm] = useState(false);
  const [editFormationId, setEditFormationId] = useState<string | null>(null);
  const [confirmDeleteFormation, setConfirmDeleteFormation] = useState<string | null>(null);
  const [openVideosFormationId, setOpenVideosFormationId] = useState<string | null>(null);

  // ── Login ──
  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: loginUsername, password: loginPassword }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const session: AdminSession = {
          password: loginPassword,
          role: data.role as AdminRole,
          nom: data.nom,
          username: data.username,
        };
        setAdminSession(session);
        // Aller sur le premier onglet autorisé
        const allowedTabs = ROLE_CONFIG[data.role as AdminRole]?.tabs ?? [];
        const first = allowedTabs[0] as Onglet;
        if (first) setOnglet(first);
      } else {
        setLoginError(data.error || "Identifiants incorrects.");
      }
    } catch {
      setLoginError("Erreur réseau. Réessayez.");
    } finally {
      setLoginLoading(false);
    }
  }

  if (!adminSession) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-white border border-green-300 flex items-center justify-center text-4xl mb-4">🔐</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Administration</h1>
            <p className="text-gray-800 text-sm font-semibold">Connectez-vous pour accéder au panel</p>
          </div>
          <div className="p-8 bg-white border border-gray-200 rounded-2xl shadow-sm">
            <form onSubmit={login} className="space-y-4">
              <div>
                <label className={labelCls}><UserIcon size={14} className="inline mr-1" />Nom d&apos;utilisateur</label>
                <input type="text" value={loginUsername} onChange={(e) => { setLoginUsername(e.target.value); setLoginError(""); }} className={inputCls} placeholder="admin" autoFocus />
              </div>
              <div>
                <label className={labelCls}><Lock size={14} className="inline mr-1" />Mot de passe</label>
                <input type="password" value={loginPassword} onChange={(e) => { setLoginPassword(e.target.value); setLoginError(""); }} className={inputCls} placeholder="••••••••" />
              </div>
              {loginError && <p className="text-red-400 text-xs">{loginError}</p>}
              <button type="submit" disabled={loginLoading} className="w-full py-4 bg-green-600 hover:bg-[#27A827] text-black font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-60">
                {loginLoading ? <><span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Connexion...</> : "Accéder au panel"}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Permissions du rôle connecté
  const allowedTabs = ROLE_CONFIG[adminSession.role]?.tabs ?? [];

  // ── Données ──
  const espaces = store.espaces.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const consultants = store.consultants.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const stats = {
    espaces: espaces.filter((e) => e.actif).length,
    consultants: consultants.filter((c) => c.actif).length,
    enAttente: serverDemandes.filter((d) => d.statut === "en_attente").length,
    enAttenteCandidaturesConsultant: serverCandidatures.filter((d) => d.statut === "en_attente").length,
    validees: serverDemandes.filter((d) => d.statut === "validee").length,
  };

  const candidaturesFiltrees = serverDemandes.filter((d) => {
    const ok = filtreStatut === "toutes" || d.statut === filtreStatut;
    const q = search.toLowerCase();
    return ok && (!q || d.espaceTitre.toLowerCase().includes(q) || d.client.nom.toLowerCase().includes(q) || d.client.email.toLowerCase().includes(q));
  });

  // ── Helpers Espaces ──
  function toEspaceForm(e: EspacePersonnalise): EspaceForm {
    return { titre: e.titre, domaine: e.domaine, descriptionCourte: e.descriptionCourte || "", descriptionLongue: e.descriptionLongue || "", avantages: e.avantages?.length ? e.avantages : [""], inclus: e.inclus?.length ? e.inclus : [""], clientsSatisfaits: String(e.clientsSatisfaits), placesDisponibles: String(e.placesDisponibles), espacesSimilaires: e.espacesSimilaires || [], image: e.image || "" };
  }
  function saveEspace(form: EspaceForm) {
    const data = { titre: form.titre.trim(), domaine: form.domaine, descriptionCourte: form.descriptionCourte.trim(), descriptionLongue: form.descriptionLongue.trim(), avantages: form.avantages.filter(Boolean), inclus: form.inclus.filter(Boolean), clientsSatisfaits: parseInt(form.clientsSatisfaits) || 0, placesDisponibles: parseInt(form.placesDisponibles) || 5, espacesSimilaires: form.espacesSimilaires, image: form.image || undefined };
    if (editEspaceId) { store.modifierEspace(editEspaceId, data); setEditEspaceId(null); }
    else { store.ajouterEspace(data); setShowEspaceForm(false); }
    syncEspacesToServer(useAccompagnementStore.getState().espaces);
  }

  // ── Helpers Consultants ──
  function toConsultantForm(c: Consultant): ConsultantForm {
    return { prenom: c.prenom, clientsAccompa: String(c.clientsAccompa), entreprisesAccompa: String(c.entreprisesAccompa), domainesIds: c.domainesIds };
  }
  function saveConsultant(form: ConsultantForm) {
    const data = { prenom: form.prenom.trim(), clientsAccompa: parseInt(form.clientsAccompa) || 0, entreprisesAccompa: parseInt(form.entreprisesAccompa) || 0, domainesIds: form.domainesIds };
    if (editConsultantId) { store.modifierConsultant(editConsultantId, data); setEditConsultantId(null); }
    else { store.ajouterConsultant(data); setShowConsultantForm(false); }
    syncConsultantsToServer(useAccompagnementStore.getState().consultants);
  }

  // ── Helpers Demandes Accompagnement (serveur) ──
  async function validerDemandeServeur(id: string, note: string) {
    try {
      await fetch(`/api/demandes?password=${adminSession!.password}&id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut: "validee", noteAdmin: note }),
      });
      setServerDemandes((prev) => prev.map((d) => d.id === id ? { ...d, statut: "validee", noteAdmin: note } : d));
    } catch { /* silencieux */ }
  }

  async function rejeterDemandeServeur(id: string, note: string) {
    try {
      await fetch(`/api/demandes?password=${adminSession!.password}&id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut: "rejetee", noteAdmin: note }),
      });
      setServerDemandes((prev) => prev.map((d) => d.id === id ? { ...d, statut: "rejetee", noteAdmin: note } : d));
    } catch { /* silencieux */ }
  }

  // ── Helpers Candidatures Consultant (serveur) ──
  async function validerCandidatureServeur(id: string, note: string) {
    try {
      await fetch(`/api/candidatures?password=${adminSession!.password}&id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut: "validee", noteAdmin: note }),
      });
      setServerCandidatures((prev) => prev.map((c) => c.id === id ? { ...c, statut: "validee", noteAdmin: note } : c));
      // Recharger les consultants (candidature validée = nouveau consultant créé)
      fetch("/api/admin/sync-consultants", { headers: { "x-admin-password": adminSession!.password } })
        .then(r => r.json())
        .then(d => { if (Array.isArray(d.consultants)) useAccompagnementStore.setState({ consultants: d.consultants }); })
        .catch(() => {});
    } catch { /* silencieux */ }
  }

  async function rejeterCandidatureServeur(id: string, note: string) {
    try {
      await fetch(`/api/candidatures?password=${adminSession!.password}&id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut: "rejetee", noteAdmin: note }),
      });
      setServerCandidatures((prev) => prev.map((c) => c.id === id ? { ...c, statut: "rejetee", noteAdmin: note } : c));
    } catch { /* silencieux */ }
  }

  // ── Helpers Ebooks ──
  function toEbookForm(e: EbookAdmin): EbookForm {
    return { title: e.title, description: e.description, category: e.category, price: String(e.price), originalPrice: e.originalPrice ? String(e.originalPrice) : "", pages: String(e.pages), rating: String(e.rating), reviews: String(e.reviews), bestseller: !!e.bestseller, new: !!e.new, cover: e.cover || "", banner: e.banner || "", downloadUrl: e.downloadUrl || "", ctaLabel: e.ctaLabel || "", ctaAnimation: (e.ctaAnimation as EbookForm["ctaAnimation"]) || "pulse", reviewCardSize: (e.reviewCardSize as EbookForm["reviewCardSize"]) || "medium", faq: e.faq || [], avisClients: e.avisClients || [], sections: (e.sections as SectionForm[]) || [], commentAcheterUrl: e.commentAcheterUrl || "", whatsappUrl: e.whatsappUrl || "", coverLayout: e.coverLayout || "full", pdfPreviewUrl: e.pdfPreviewUrl || "", promoEndDate: e.promoEndDate || "", promoCyclique: e.promoCyclique ?? false, promoDureeHeures: e.promoDureeHeures ? String(e.promoDureeHeures) : "24", vendusAffiche: e.vendusAffiche != null ? String(e.vendusAffiche) : "", placesRestantesBloquees: e.placesRestantesBloquees != null ? String(e.placesRestantesBloquees) : "", cardBgColor: e.cardBgColor || "", cardTextColor: e.cardTextColor || "", priceColor: e.priceColor || "", ctaBgColor: e.ctaBgColor || "", ctaTextColor: e.ctaTextColor || "", bandeauColor: e.bandeauColor || "", coverHeight: e.coverHeight ? String(e.coverHeight) : "260", coverObjectPosition: e.coverObjectPosition || "center", coverObjectFit: e.coverObjectFit || "cover", communityBgColor: (e as { communityBgColor?: string }).communityBgColor || "", communityTextColor: (e as { communityTextColor?: string }).communityTextColor || "", audioUrl: (e as { audioUrl?: string }).audioUrl || "", videoUrl: (e as { videoUrl?: string }).videoUrl || "", metaTitle: (e as { metaTitle?: string }).metaTitle || "", metaDescription: (e as { metaDescription?: string }).metaDescription || "", keywords: (e as { keywords?: string }).keywords || "", customSlug: (e as { customSlug?: string }).customSlug || "", ogImage: (e as { ogImage?: string }).ogImage || "" };
  }
  function saveEbook(form: EbookForm) {
    const data = { title: form.title.trim(), description: form.description.trim(), category: form.category, price: parseInt(form.price) || 0, originalPrice: form.originalPrice ? parseInt(form.originalPrice) : undefined, pages: parseInt(form.pages) || 80, rating: parseFloat(form.rating) || 4.5, reviews: parseInt(form.reviews) || 0, bestseller: form.bestseller, new: form.new, cover: form.cover.trim(), ctaLabel: form.ctaLabel || undefined, ctaAnimation: form.ctaAnimation, reviewCardSize: form.reviewCardSize, sections: form.sections.filter(s => s.titre.trim()), faq: form.faq.filter(f => f.q.trim()), avisClients: form.avisClients.filter(a => a.nom.trim() && a.texte.trim()), commentAcheterUrl: form.commentAcheterUrl.trim() || undefined, whatsappUrl: form.whatsappUrl.trim() || undefined, coverLayout: form.coverLayout, pdfPreviewUrl: form.pdfPreviewUrl.trim() || undefined, downloadUrl: form.downloadUrl.trim() || undefined, promoEndDate: form.promoEndDate.trim() || undefined, promoCyclique: form.promoCyclique || undefined, promoDureeHeures: form.promoCyclique ? (parseInt(form.promoDureeHeures) || 24) : undefined, vendusAffiche: form.vendusAffiche ? (parseInt(form.vendusAffiche) || undefined) : undefined, placesRestantesBloquees: form.placesRestantesBloquees ? (parseInt(form.placesRestantesBloquees) || undefined) : undefined, cardBgColor: form.cardBgColor.trim() || undefined, cardTextColor: form.cardTextColor.trim() || undefined, priceColor: form.priceColor.trim() || undefined, ctaBgColor: form.ctaBgColor.trim() || undefined, ctaTextColor: form.ctaTextColor.trim() || undefined, bandeauColor: form.bandeauColor.trim() || undefined, coverHeight: parseInt(form.coverHeight) || undefined, coverObjectPosition: form.coverObjectPosition || undefined, coverObjectFit: form.coverObjectFit !== "cover" ? form.coverObjectFit : undefined, banner: form.banner.trim() || undefined, communityBgColor: form.communityBgColor.trim() || undefined, communityTextColor: form.communityTextColor.trim() || undefined, audioUrl: form.audioUrl.trim() || undefined, videoUrl: form.videoUrl.trim() || undefined, metaTitle: form.metaTitle.trim() || undefined, metaDescription: form.metaDescription.trim() || undefined, keywords: form.keywords.trim() || undefined, customSlug: form.customSlug.trim() || undefined, ogImage: form.ogImage.trim() || undefined };
    if (editEbookId) {
      catalogue.modifierEbook(editEbookId, data);
      catalogue.setEbookOverride(editEbookId, data);
      setEditEbookId(null);
    } else {
      catalogue.ajouterEbook(data);
      setShowEbookForm(false);
    }
    setTimeout(syncEbooksToServer, 100);
    // Sauvegarder catégorie personnalisée si nouvelle
    if (form.category && !EBOOK_CATEGORIES.includes(form.category) && !customCategories.includes(form.category)) {
      const updated = [...customCategories, form.category];
      setCustomCategories(updated);
      fetch("/api/admin/custom-categories", { method: "POST", headers: { "Content-Type": "application/json", "x-admin-password": adminSession!.password }, body: JSON.stringify({ categories: updated }) }).catch(() => {});
    }
  }

  // ── Helpers Formations ──
  function toFormationForm(f: FormationAdmin): FormationForm {
    return { titre: f.titre, description: f.description, categorie: f.categorie, instructeur: f.instructeur, duree: f.duree, modules: String(f.modules), prix: String(f.prix), prixOriginal: f.prixOriginal ? String(f.prixOriginal) : "", niveau: f.niveau, note: String(f.note), apprenants: String(f.apprenants), badge: f.badge || "", mode: (f as { mode?: "online" | "presentiel" | "both" }).mode ?? "both", videoPreview: f.videoPreview ?? "", videoUrl: (f as { videoUrl?: string }).videoUrl ?? "", cover: (f as { cover?: string }).cover ?? "", faq: f.faq || [], avisClients: f.avisClients || [], sections: (f.sections as SectionForm[]) || [], commentAcheterUrl: f.commentAcheterUrl || "", whatsappUrl: f.whatsappUrl || "", ctaAnimation: (f.ctaAnimation as FormationForm["ctaAnimation"]) || "pulse", reviewCardSize: (f.reviewCardSize as FormationForm["reviewCardSize"]) || "medium", promoEndDate: f.promoEndDate || "", promoCyclique: f.promoCyclique ?? false, promoDureeHeures: f.promoDureeHeures ? String(f.promoDureeHeures) : "24", vendusAffiche: f.vendusAffiche != null ? String(f.vendusAffiche) : "", placesRestantesBloquees: f.placesRestantesBloquees != null ? String(f.placesRestantesBloquees) : "", cardBgColor: f.cardBgColor || "", cardTextColor: f.cardTextColor || "", priceColor: f.priceColor || "", ctaBgColor: f.ctaBgColor || "", ctaTextColor: f.ctaTextColor || "", metaTitle: (f as { metaTitle?: string }).metaTitle || "", metaDescription: (f as { metaDescription?: string }).metaDescription || "", keywords: (f as { keywords?: string }).keywords || "", customSlug: (f as { customSlug?: string }).customSlug || "", ogImage: (f as { ogImage?: string }).ogImage || "" };
  }
  function saveFormation(form: FormationForm) {
    const data = { titre: form.titre.trim(), description: form.description.trim(), categorie: form.categorie, instructeur: form.instructeur.trim() || "SMART LIFE", duree: form.duree.trim(), modules: parseInt(form.modules) || 5, prix: parseInt(form.prix) || 0, prixOriginal: form.prixOriginal ? parseInt(form.prixOriginal) : undefined, niveau: form.niveau, note: parseFloat(form.note) || 4.5, apprenants: parseInt(form.apprenants) || 0, badge: form.badge || undefined, mode: form.mode, videoPreview: form.videoPreview.trim() || undefined, videoUrl: form.videoUrl.trim() || undefined, cover: form.cover.trim() || undefined, sections: form.sections.filter(s => s.titre.trim()), faq: form.faq.filter(f => f.q.trim()), avisClients: form.avisClients.filter(a => a.nom.trim() && a.texte.trim()), commentAcheterUrl: form.commentAcheterUrl.trim() || undefined, whatsappUrl: form.whatsappUrl.trim() || undefined, ctaAnimation: form.ctaAnimation, reviewCardSize: form.reviewCardSize, promoEndDate: form.promoEndDate.trim() || undefined, promoCyclique: form.promoCyclique || undefined, promoDureeHeures: form.promoCyclique ? (parseInt(form.promoDureeHeures) || 24) : undefined, vendusAffiche: form.vendusAffiche ? (parseInt(form.vendusAffiche) || undefined) : undefined, placesRestantesBloquees: form.placesRestantesBloquees ? (parseInt(form.placesRestantesBloquees) || undefined) : undefined, cardBgColor: form.cardBgColor.trim() || undefined, cardTextColor: form.cardTextColor.trim() || undefined, priceColor: form.priceColor.trim() || undefined, ctaBgColor: form.ctaBgColor.trim() || undefined, ctaTextColor: form.ctaTextColor.trim() || undefined, metaTitle: form.metaTitle.trim() || undefined, metaDescription: form.metaDescription.trim() || undefined, keywords: form.keywords.trim() || undefined, customSlug: form.customSlug.trim() || undefined, ogImage: form.ogImage.trim() || undefined };
    if (editFormationId) { catalogue.modifierFormation(editFormationId, data); setEditFormationId(null); }
    else { catalogue.ajouterFormation(data); setShowFormationForm(false); }
    setTimeout(syncFormationsToServer, 100);
    // Sauvegarder catégorie personnalisée si nouvelle
    if (form.categorie && !FORMATION_CATEGORIES.includes(form.categorie) && !customCategories.includes(form.categorie)) {
      const updated = [...customCategories, form.categorie];
      setCustomCategories(updated);
      fetch("/api/admin/custom-categories", { method: "POST", headers: { "Content-Type": "application/json", "x-admin-password": adminSession!.password }, body: JSON.stringify({ categories: updated }) }).catch(() => {});
    }
  }

  const TOUS_ONGLETS: { key: Onglet; label: string; icon: React.ReactNode; badge?: number }[] = [
    { key: "tableau", label: "Tableau de bord", icon: <BarChart2 size={16} /> },
    { key: "espaces", label: "Espaces", icon: <Building2 size={16} />, badge: espaces.length },
    { key: "consultants", label: "Consultants", icon: <UserCheck size={16} />, badge: consultants.length },
    { key: "candidatures_consultant", label: "Candidat. Consult.", icon: <ClipboardList size={16} />, badge: stats.enAttenteCandidaturesConsultant || undefined },
    { key: "candidatures", label: "Demandes Accomp.", icon: <Users size={16} />, badge: stats.enAttente || undefined },
    { key: "ebooks", label: "Ebooks", icon: <BookOpen size={16} />, badge: catalogue.ebooks.length + staticEbooks.length },
    { key: "formations", label: "Formations", icon: <Play size={16} />, badge: catalogue.formations.length + staticFormations.length },
    { key: "annonces", label: "Annonces", icon: <Megaphone size={16} /> },
    { key: "avis", label: "Avis clients", icon: <MessageSquare size={16} />, badge: adminReviews.filter(r => r.statut === "en_attente").length || undefined },
    { key: "temoignages", label: "Témoignages", icon: <Star size={16} /> },
    { key: "parcours", label: "Parcours Client", icon: <ClipboardList size={16} /> },
    { key: "motivations", label: "Motivations", icon: <MessageSquare size={16} />, badge: unreadMotivationsCount || undefined },
    { key: "staff", label: "Comptes Staff", icon: <ShieldCheck size={16} /> },
    { key: "about", label: "À propos", icon: <UserIcon size={16} /> },
  ];
  const ONGLETS = TOUS_ONGLETS.filter((o) => allowedTabs.includes(o.key));

  return (
    <AdminPasswordContext.Provider value={adminSession.password}>
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* Header */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Panel d&apos;administration</h1>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <p className="text-gray-800 text-sm font-semibold">Accompagnement entrepreneurial</p>
            <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${adminSession.role === "super_admin" ? "bg-yellow-900/20 border-yellow-700/40 text-yellow-400" : adminSession.role === "admin_manager" ? "bg-blue-900/20 border-blue-700/40 text-blue-400" : adminSession.role === "content_editor" ? "bg-green-900/20 border-green-700/40 text-green-400" : "bg-emerald-900/20 border-emerald-700/40 text-emerald-400"}`}>
              {ROLE_CONFIG[adminSession.role]?.label}
            </span>
            <span className="text-gray-700 text-xs font-semibold">{adminSession.nom}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {allowedTabs.includes("tableau") && onglet !== "tableau" && (
            <button onClick={() => setOnglet("tableau")} className="px-4 py-2 rounded-full text-sm font-bold shadow-sm" style={{ background: "#27A827", color: "#fff" }}>📊 Tableau de bord</button>
          )}
          <Link href="/" target="_blank" className="px-4 py-2 rounded-full text-sm font-bold border border-green-200 text-green-700 hover:bg-green-50">Voir le site →</Link>
          <button onClick={() => setAdminSession(null)} className="px-4 py-2 rounded-full border border-gray-200 text-gray-900 font-bold text-sm hover:bg-gray-50">Déconnexion</button>
        </div>
      </div>

      {/* Les outils restent accessibles d'un clic, rangés derrière un seul bouton */}
      <details className="mb-6 rounded-2xl border border-green-200 bg-white px-4 py-3 shadow-sm">
        <summary className="cursor-pointer text-sm font-bold text-gray-900">🧰 Tous les outils</summary>
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <Link href="/admin/ventes" className="px-4 py-2 bg-green-50 border border-green-200 hover:bg-green-100 text-green-700 rounded-xl text-sm font-medium flex items-center gap-1.5"><ShoppingBag size={15} /> Ventes</Link>
          <Link href="/admin/payment-links" className="px-4 py-2 bg-[#E8B800]/10 border border-[#E8B800]/30 hover:bg-[#E8B800]/20 text-[#D4A017] rounded-xl text-sm font-medium flex items-center gap-1.5"><Link2 size={15} /> Liens de paiement</Link>
          <Link href="/admin/packs" className="px-4 py-2 bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-700 rounded-xl text-sm font-medium flex items-center gap-1.5"><Package size={15} /> Packs</Link>
          <Link href="/admin/analytics" className="px-4 py-2 bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-600 rounded-xl text-sm font-medium flex items-center gap-1.5"><BarChart2 size={15} /> Analytique</Link>
          <Link href="/admin/automations" className="px-4 py-2 bg-yellow-50 border border-yellow-200 hover:bg-yellow-100 text-yellow-700 rounded-xl text-sm font-medium flex items-center gap-1.5">⚡ Automations</Link>
          <Link href="/admin/nouveautes" className="px-4 py-2 bg-green-50 border border-green-200 hover:bg-green-100 text-green-700 rounded-xl text-sm font-medium flex items-center gap-1.5">Nouveautés aux clients</Link>
          <Link href="/admin/popups" className="px-4 py-2 bg-purple-50 border border-purple-200 hover:bg-purple-100 text-purple-700 rounded-xl text-sm font-medium flex items-center gap-1.5">📣 Popups</Link>
          <Link href="/admin/services" className="px-4 py-2 bg-teal-50 border border-teal-200 hover:bg-teal-100 text-teal-700 rounded-xl text-sm font-medium flex items-center gap-1.5">🛠️ Services</Link>
          <Link href="/admin/pixels" className="px-4 py-2 bg-orange-50 border border-orange-200 hover:bg-orange-100 text-orange-700 rounded-xl text-sm font-medium flex items-center gap-1.5">📊 Pixels</Link>
          <Link href="/admin/ressources-gratuites" className="px-4 py-2 bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-700 rounded-xl text-sm font-medium flex items-center gap-1.5"><Gift size={15} /> Ressources Gratuites</Link>
          <Link href="/admin/contacts" className="px-4 py-2 bg-sky-50 border border-sky-200 hover:bg-sky-100 text-sky-700 rounded-xl text-sm font-medium flex items-center gap-1.5">✉️ Messages</Link>
          <Link href="/admin/avis" className="px-4 py-2 bg-yellow-50 border border-yellow-200 hover:bg-yellow-100 text-yellow-700 rounded-xl text-sm font-medium flex items-center gap-1.5"><Star size={15} /> Avis</Link>
          <Link href="/admin/reviews" className="px-4 py-2 bg-[#E8B800]/10 border border-[#E8B800]/30 hover:bg-[#E8B800]/20 text-[#E8B800] rounded-xl text-sm font-medium flex items-center gap-1.5"><MessageSquare size={15} /> Avis Consultants</Link>
          <Link href="/admin/promo-codes" className="px-4 py-2 bg-green-600 border border-green-700 hover:bg-green-700 text-white rounded-xl text-sm font-medium flex items-center gap-1.5">🏷️ Codes Promo</Link>
          <Link href="/admin/qrcodes" className="px-4 py-2 bg-gray-900 border border-gray-700 hover:bg-gray-800 text-white rounded-xl text-sm font-medium flex items-center gap-1.5">⬛ QR Codes</Link>
          <Link href="/admin/social-proof" className="px-4 py-2 bg-purple-600 border border-purple-700 hover:bg-purple-700 text-white rounded-xl text-sm font-medium flex items-center gap-1.5">🔔 Preuve Sociale</Link>
          <Link href="/admin/affiliates" className="px-4 py-2 bg-indigo-600 border border-indigo-700 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium flex items-center gap-1.5">🚀 Affiliés</Link>
          <Link href="/admin/certificates" className="px-4 py-2 bg-yellow-600 border border-yellow-700 hover:bg-yellow-700 text-white rounded-xl text-sm font-medium flex items-center gap-1.5">🎓 Certificats</Link>
          <Link href="/admin/cross-sell" className="px-4 py-2 bg-orange-600 border border-orange-700 hover:bg-orange-700 text-white rounded-xl text-sm font-medium flex items-center gap-1.5">🛒 Cross-Selling</Link>
          <Link href="/admin/vip" className="px-4 py-2 bg-purple-600 border border-purple-700 hover:bg-purple-700 text-white rounded-xl text-sm font-medium flex items-center gap-1.5">👑 SmartLife Pass</Link>
        </div>
      </details>

      {/* Stats rapides (le tableau de bord a les siennes) */}
      {onglet !== "tableau" && (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Espaces actifs", value: stats.espaces, color: "text-green-600 font-bold" },
          { label: "Consultants actifs", value: stats.consultants, color: "text-green-400" },
          { label: "En attente", value: stats.enAttente, color: "text-yellow-400" },
          { label: "Validées", value: stats.validees, color: "text-emerald-400" },
        ].map((s) => (
          <div key={s.label} className="p-4 bg-white border border-green-200 rounded-2xl text-center shadow-sm">
            <div className={`text-3xl font-bold ${s.color} mb-1`}>{s.value}</div>
            <div className="text-gray-700 text-xs font-semibold">{s.label}</div>
          </div>
        ))}
      </div>
      )}

      {/* Onglets */}
      <div className="flex gap-1 p-1 bg-white border border-green-200 rounded-2xl mb-8 overflow-x-auto" style={{ scrollbarWidth: "thin" }}>
        {ONGLETS.map((o) => (
          <button
            key={o.key}
            onClick={() => setOnglet(o.key)}
            className={`flex-shrink-0 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              onglet === o.key
                ? "bg-green-600 text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            {o.icon}
            <span className="truncate">{o.label}</span>
            {o.badge !== undefined && o.badge > 0 && (
              <span
                className={`flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded-full font-bold leading-none ${
                  onglet === o.key
                    ? "bg-white/25 text-white"
                    : o.key === "candidatures"
                    ? "bg-yellow-400 text-yellow-900"
                    : "bg-green-100 text-green-800"
                }`}
              >
                {o.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {onglet === "tableau" && (
        <TableauDeBord
          motDePasse={adminSession.password}
          nom={adminSession.nom}
          aTraiter={{
            demandes: stats.enAttente,
            candidatures: stats.enAttenteCandidaturesConsultant,
            avis: adminReviews.filter((r) => r.statut === "en_attente").length,
            motivations: unreadMotivationsCount,
          }}
          allerA={(o) => { if (allowedTabs.includes(o)) setOnglet(o as Onglet); }}
        />
      )}

      {/* ══ ONGLET ESPACES ══ */}
      {onglet === "espaces" && (
        <div>
          <VideoAccompagnementAdmin />

          {!showEspaceForm && !editEspaceId && (
            <button onClick={() => setShowEspaceForm(true)}
              className="w-full mb-6 py-4 border-2 border-dashed border-green-300 hover:border-green-500 hover:bg-green-50 text-green-600 rounded-2xl flex items-center justify-center gap-2 font-bold transition-all">
              <Plus size={20} /> Ajouter un espace d&apos;accompagnement
            </button>
          )}

          {showEspaceForm && !editEspaceId && (
            <div className="mb-6">
              <FormulaireEspace initial={ESPACE_VIDE} autresEspaces={espaces} onSave={saveEspace} onCancel={() => setShowEspaceForm(false)} titreForm="Nouvel espace" />
            </div>
          )}

          {espaces.length === 0 ? (
            <div className="text-center py-16 bg-white border border-green-100 rounded-2xl">
              <div className="text-5xl mb-3">🏢</div>
              <h3 className="text-gray-900 font-bold mb-2">Aucun espace enregistré</h3>
              <p className="text-gray-800 text-sm font-semibold">Cliquez sur le bouton ci-dessus pour créer votre premier espace.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {espaces.map((e) => (
                <div key={e.id}>
                  {editEspaceId === e.id ? (
                    <FormulaireEspace initial={toEspaceForm(e)} autresEspaces={espaces.filter((x) => x.id !== e.id)} onSave={saveEspace} onCancel={() => setEditEspaceId(null)} titreForm={`Modifier — ${e.titre}`} />
                  ) : (
                    <div className={`p-5 rounded-2xl border transition-all ${e.actif ? "bg-white border-green-200" : "bg-white/[0.01] border-gray-100 opacity-60"}`}>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1 flex-wrap">
                            <h3 className="text-gray-900 font-bold">{e.titre}</h3>
                            <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">{e.domaine}</span>
                            {!e.actif && <span className="text-xs px-2 py-0.5 bg-red-900/30 text-red-400 rounded-full border border-red-700/30">Désactivé</span>}
                          </div>
                          {e.descriptionCourte && <p className="text-gray-700 text-xs font-semibold mb-2 truncate">{e.descriptionCourte}</p>}
                          <div className="flex flex-wrap gap-x-5 gap-y-0.5 text-xs text-gray-700">
                            <span><strong className="text-gray-900">{e.clientsSatisfaits}</strong> satisfaits</span>
                            <span><strong className={e.placesDisponibles <= 2 ? "text-orange-400" : "text-white"}>{e.placesDisponibles}</strong> places</span>
                            {e.avantages?.filter(Boolean).length > 0 && <span>{e.avantages.filter(Boolean).length} avantages</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button onClick={() => { store.toggleEspaceActif(e.id); syncEspacesToServer(useAccompagnementStore.getState().espaces); }} className={`p-2 rounded-lg ${e.actif ? "text-emerald-400 hover:bg-emerald-900/30" : "text-gray-800 hover:bg-green-50"}`}>{e.actif ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}</button>
                          <button onClick={() => { setEditEspaceId(e.id); setShowEspaceForm(false); }} className="p-2 text-gray-800 hover:text-green-600 hover:bg-green-50 rounded-lg"><Pencil size={16} /></button>
                          {confirmDeleteEspace === e.id ? (
                            <div className="flex gap-1">
                              <button onClick={() => { store.supprimerEspace(e.id); setConfirmDeleteEspace(null); syncEspacesToServer(useAccompagnementStore.getState().espaces); }} className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-lg">Oui</button>
                              <button onClick={() => setConfirmDeleteEspace(null)} className="px-3 py-1 border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg">Non</button>
                            </div>
                          ) : (
                            <button onClick={() => setConfirmDeleteEspace(e.id)} className="p-2 text-gray-800 hover:text-red-400 hover:bg-red-900/20 rounded-lg"><Trash2 size={16} /></button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══ ONGLET CONSULTANTS ══ */}
      {onglet === "consultants" && (
        <div>
          <VideoConsultantAdmin />

          {!showConsultantForm && !editConsultantId && (
            <button onClick={() => setShowConsultantForm(true)}
              className="w-full mb-6 py-4 border-2 border-dashed border-green-300 hover:border-green-500 hover:bg-green-50 text-green-600 rounded-2xl flex items-center justify-center gap-2 font-bold transition-all">
              <Plus size={20} /> Ajouter un consultant
            </button>
          )}

          {showConsultantForm && !editConsultantId && (
            <div className="mb-6">
              <FormulaireConsultant initial={CONSULTANT_VIDE} espaces={espaces.filter((e) => e.actif)} onSave={saveConsultant} onCancel={() => setShowConsultantForm(false)} titreForm="Nouveau consultant" />
            </div>
          )}

          {consultants.length === 0 ? (
            <div className="text-center py-16 bg-white border border-green-100 rounded-2xl">
              <div className="text-5xl mb-3">👤</div>
              <h3 className="text-gray-900 font-bold mb-2">Aucun consultant enregistré</h3>
              <p className="text-gray-800 text-sm font-semibold">Ajoutez vos consultants pour les afficher sur le site.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {consultants.map((c) => (
                <div key={c.id}>
                  {editConsultantId === c.id ? (
                    <FormulaireConsultant initial={toConsultantForm(c)} espaces={espaces.filter((e) => e.actif)} onSave={saveConsultant} onCancel={() => setEditConsultantId(null)} titreForm={`Modifier — ${c.prenom}`} />
                  ) : (
                    <div className={`p-5 rounded-2xl border transition-all ${c.actif ? "bg-white border-green-200" : "bg-white/[0.01] border-gray-100 opacity-60"}`}>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#E8B800]/30 to-[#27A827]/10 border border-green-300 flex items-center justify-center text-green-600 font-black text-xl flex-shrink-0">
                            {c.prenom.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-gray-900 font-bold">{c.prenom}</h3>
                              {!c.actif && <span className="text-xs px-2 py-0.5 bg-red-900/30 text-red-400 rounded-full border border-red-700/30">Désactivé</span>}
                            </div>
                            <div className="flex flex-wrap gap-x-5 gap-y-0.5 text-xs text-gray-800">
                              <span><strong className="text-emerald-400">{c.clientsAccompa}</strong> client{c.clientsAccompa > 1 ? "s" : ""}</span>
                              <span><strong className="text-green-600">{c.entreprisesAccompa}</strong> entreprise{c.entreprisesAccompa > 1 ? "s" : ""}</span>
                              {c.domainesIds.length > 0 && <span className="text-gray-800">{c.domainesIds.map((id) => espaces.find((e) => e.id === id)?.titre).filter(Boolean).join(", ")}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button onClick={() => { store.toggleConsultantActif(c.id); syncConsultantsToServer(useAccompagnementStore.getState().consultants); }} className={`p-2 rounded-lg transition-colors ${c.actif ? "text-emerald-400 hover:bg-emerald-900/30" : "text-gray-800 hover:bg-green-50"}`} title={c.actif ? "Désactiver (masquer du site)" : "Réactiver"}>{c.actif ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}</button>
                          <button onClick={() => { setEditConsultantId(c.id); setShowConsultantForm(false); }} className="p-2 text-gray-800 hover:text-green-600 hover:bg-green-50 rounded-lg"><Pencil size={16} /></button>
                          {confirmDeleteConsultant === c.id ? (
                            <div className="flex gap-1">
                              <button onClick={() => { store.supprimerConsultant(c.id); setConfirmDeleteConsultant(null); syncConsultantsToServer(useAccompagnementStore.getState().consultants); }} className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-lg">Supprimer</button>
                              <button onClick={() => setConfirmDeleteConsultant(null)} className="px-3 py-1 border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg">Annuler</button>
                            </div>
                          ) : (
                            <button onClick={() => setConfirmDeleteConsultant(c.id)} className="p-2 text-gray-800 hover:text-red-400 hover:bg-red-900/20 rounded-lg" title="Supprimer définitivement"><Trash2 size={16} /></button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* ══ ONGLET CANDIDATURES CONSULTANT ══ */}
      {onglet === "candidatures_consultant" && (
        <div>
          <div className="mb-6">
            <h2 className="text-gray-900 text-xl font-bold flex items-center gap-2">
              <ClipboardList size={20} className="text-green-600" /> Candidatures Consultants
            </h2>
            <p className="text-gray-600 text-sm mt-1">Personnes ayant soumis une candidature pour rejoindre le réseau de consultants SMART LIFE.</p>
          </div>

          {serverCandidatures.length === 0 ? (
            <div className="text-center py-16 bg-white border border-green-100 rounded-2xl">
              <div className="text-5xl mb-3">⭐</div>
              <h3 className="text-gray-900 font-bold mb-2">Aucune candidature reçue</h3>
              <p className="text-gray-600 text-sm">Les candidatures consultants apparaîtront ici.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-4 mb-6 flex-wrap">
                {[
                  { label: "Total", value: serverCandidatures.length, color: "text-gray-900" },
                  { label: "En attente", value: serverCandidatures.filter(c => c.statut === "en_attente").length, color: "text-yellow-600" },
                  { label: "Validées", value: serverCandidatures.filter(c => c.statut === "validee").length, color: "text-emerald-600" },
                  { label: "Rejetées", value: serverCandidatures.filter(c => c.statut === "rejetee").length, color: "text-red-600" },
                ].map((s) => (
                  <div key={s.label} className="p-4 bg-white border border-gray-200 rounded-2xl text-center shadow-sm min-w-[90px]">
                    <div className={`text-2xl font-bold ${s.color} mb-0.5`}>{s.value}</div>
                    <div className="text-gray-500 text-xs">{s.label}</div>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                {serverCandidatures.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((c) => (
                  <div key={c.id} className="p-5 bg-white border border-green-200 rounded-2xl hover:border-green-300 transition-all">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1 flex-wrap">
                          <h3 className="text-gray-900 font-bold">{c.prenom} {c.nom}</h3>
                          <StatutBadge statut={c.statut} />
                        </div>
                        <div className="flex flex-wrap gap-x-4 text-xs text-gray-700">
                          <span>{c.email}</span>
                          <span>{c.telephone}</span>
                          <span>{c.ville}</span>
                          <span>{c.anneesExperience} d&apos;expérience</span>
                        </div>
                        <p className="text-gray-500 text-xs mt-1">{new Date(c.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {c.statut === "en_attente" && (
                          <>
                            <button onClick={() => validerCandidatureServeur(c.id, "Votre candidature a été validée. Bienvenue dans l'équipe !")} className="p-2 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white rounded-lg transition-all" title="Valider — crée le consultant"><CheckCircle size={16} /></button>
                            <button onClick={() => rejeterCandidatureServeur(c.id, "Votre candidature a été examinée mais ne correspond pas aux critères actuels.")} className="p-2 bg-red-50 hover:bg-red-600 text-red-700 hover:text-white rounded-lg transition-all" title="Rejeter"><XCircle size={16} /></button>
                          </>
                        )}
                        <button onClick={() => setSelectedCandidatureConsultant(c)} className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 hover:bg-green-50 text-gray-700 rounded-xl text-xs transition-all"><Eye size={13} /> Détails</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ══ ONGLET CANDIDATURES ACCOMPAGNEMENT ══ */}
      {onglet === "candidatures" && (
        <div>
          {/* Filtres */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-800" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-green-50 border border-green-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-green-500 text-sm font-semibold" placeholder="Rechercher par nom, email, espace..." />
            </div>
            <div className="flex gap-2 flex-wrap">
              {([["toutes", "Toutes"], ["en_attente", "En attente"], ["validee", "Validées"], ["rejetee", "Rejetées"]] as const).map(([val, label]) => (
                <button key={val} onClick={() => setFiltreStatut(val)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${filtreStatut === val ? "bg-green-600 border-green-500 text-black" : "border-green-200 text-gray-800 hover:border-green-400"}`}>
                  {label}
                  {val === "en_attente" && stats.enAttente > 0 && <span className="ml-1.5 text-xs bg-yellow-500 text-black px-1.5 py-0.5 rounded-full">{stats.enAttente}</span>}
                </button>
              ))}
            </div>
          </div>

          {candidaturesFiltrees.length === 0 ? (
            <div className="text-center py-16 bg-white border border-green-100 rounded-2xl">
              <div className="text-5xl mb-3">📋</div>
              <h3 className="text-gray-900 font-bold mb-2">Aucune demande d&apos;accompagnement</h3>
              <p className="text-gray-800 text-sm font-semibold">{serverDemandes.length === 0 ? "Aucune demande reçue pour le moment." : "Aucun résultat pour ces filtres."}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {candidaturesFiltrees.map((d) => (
                <div key={d.id} className="p-5 bg-white border border-green-200 rounded-2xl hover:border-green-300 transition-all">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <h3 className="text-gray-900 font-bold">{d.espaceTitre}</h3>
                        <StatutBadge statut={d.statut} />
                      </div>
                      <div className="flex flex-wrap gap-x-4 text-xs text-gray-800">
                        <span className="font-medium text-gray-700">{d.client.nom}</span>
                        <span>{d.client.email}</span>
                        {d.client.telephone && <span>{d.client.telephone}</span>}
                        {d.client.ville && <span>{d.client.ville}</span>}
                      </div>
                      <p className="text-gray-700 text-xs font-semibold mt-1">{new Date(d.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {d.statut === "en_attente" && (
                        <>
                          <button onClick={() => validerDemandeServeur(d.id, "Votre dossier a été validé. Notre équipe vous contactera sous 48h.")} className="p-2 bg-emerald-700/30 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-lg transition-all" title="Valider"><CheckCircle size={16} /></button>
                          <button onClick={() => rejeterDemandeServeur(d.id, "Votre dossier a été examiné mais ne correspond pas aux critères actuels.")} className="p-2 bg-red-800/30 hover:bg-red-700 text-red-400 hover:text-white rounded-lg transition-all" title="Rejeter"><XCircle size={16} /></button>
                        </>
                      )}
                      <button onClick={() => setSelectedServerDemande(d)} className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 hover:bg-green-50 text-gray-700 hover:text-white rounded-xl text-xs transition-all"><Eye size={13} /> Détails</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tableau clients */}
          {serverDemandes.length > 0 && (
            <div className="mt-12">
              <h2 className="text-gray-900 text-lg font-bold mb-5 flex items-center gap-2"><Users size={18} className="text-green-600" />Clients inscrits ({serverDemandes.length})</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      {["Nom", "Email", "Téléphone", "Ville", "Capital", "Date"].map((h) => (
                        <th key={h} className="pb-3 text-gray-700 text-xs font-semibold font-medium text-left pr-4">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {serverDemandes.map((d) => (
                      <tr key={d.id} className="border-b border-gray-100 hover:bg-green-50 transition-colors">
                        <td className="py-3 text-gray-900 font-bold pr-4">{d.client.nom}</td>
                        <td className="py-3 text-gray-700 pr-4">{d.client.email}</td>
                        <td className="py-3 text-gray-700 pr-4">{d.client.telephone || "—"}</td>
                        <td className="py-3 text-gray-700 pr-4">{d.client.ville || "—"}</td>
                        <td className="py-3 text-gray-800 pr-4">{d.client.capital || "—"}</td>
                        <td className="py-3 text-gray-700 text-xs font-semibold">{new Date(d.createdAt).toLocaleDateString("fr-FR")}</td>
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
          {!showEbookForm && !editEbookId && (
            <button onClick={() => { try { localStorage.removeItem("ebook-wizard-draft-new"); } catch { /* ignore */ } setShowEbookForm(true); }}
              className="w-full mb-6 py-4 border-2 border-dashed border-green-300 hover:border-green-500 hover:bg-green-50 text-green-600 rounded-2xl flex items-center justify-center gap-2 font-bold transition-all">
              <Plus size={20} /> Ajouter un nouvel ebook
            </button>
          )}

          {showEbookForm && !editEbookId && (
            <div className="mb-6">
              <FormulaireEbook initial={EBOOK_VIDE} onSave={saveEbook} onCancel={() => setShowEbookForm(false)} titreForm="Nouvel ebook" adminPassword={adminSession?.password} extraCategories={customCategories} />
            </div>
          )}

          {/* Barre de recherche fuzzy */}
          {!showEbookForm && !editEbookId && (
            <div className="relative mb-6">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={ebookSearch}
                onChange={(e) => setEbookSearch(e.target.value)}
                placeholder='Rechercher un ebook… ex: "élevage", "finance", "poulet"'
                className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:border-green-500 placeholder:text-gray-400 transition-colors"
              />
              {ebookSearch && (
                <button onClick={() => setEbookSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X size={15} />
                </button>
              )}
            </div>
          )}

          {/* Ebooks créés par l'admin */}
          {catalogue.ebooks.filter(e => !e.deletedAt).length > 0 && (
            <div className="mb-8">
              <h3 className="text-gray-900 font-bold mb-3 flex items-center gap-2">
                <BookOpen size={16} className="text-green-600" />Ebooks créés ({catalogue.ebooks.filter(e => !e.deletedAt && ebookFuzzyMatch(ebookSearch, e.title, e.category, e.description)).length})
                <button onClick={syncEbooksToServer} title="Synchroniser maintenant" className={`ml-2 p-1 rounded-lg text-xs flex items-center gap-1 transition-all ${ebookSyncStatus === "syncing" ? "text-yellow-400" : ebookSyncStatus === "ok" ? "text-emerald-400" : ebookSyncStatus === "error" ? "text-red-400" : "text-gray-800 hover:text-green-600"}`}>
                  <RefreshCw size={13} className={ebookSyncStatus === "syncing" ? "animate-spin" : ""} />
                  {ebookSyncStatus === "syncing" && "Sync…"}
                  {ebookSyncStatus === "ok" && "Synchronisé ✓"}
                  {ebookSyncStatus === "error" && "Erreur sync !"}
                </button>
              </h3>
              <div className="space-y-3">
                {catalogue.ebooks.filter(e => !e.deletedAt && ebookFuzzyMatch(ebookSearch, e.title, e.category, e.description)).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((e) => (
                  <div key={e.id}>
                    {editEbookId === e.id ? (
                      <FormulaireEbook initial={toEbookForm(e)} onSave={saveEbook} onCancel={() => setEditEbookId(null)} titreForm={`Modifier — ${e.title}`} adminPassword={adminSession?.password} ebookId={e.id} extraCategories={customCategories} />
                    ) : (
                      <div className={`p-5 rounded-2xl border transition-all ${e.actif ? "bg-white border-green-200" : "bg-white/[0.01] border-gray-100 opacity-60"}`}>
                        <div className="flex flex-col gap-4">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              {e.cover && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={e.cover} alt={e.title} className="w-10 h-13 object-cover rounded-lg border border-gray-200 flex-shrink-0" onError={(el) => { (el.target as HTMLImageElement).style.display = "none"; }} />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-1 flex-wrap">
                                  <h3 className="text-gray-900 font-bold truncate">{e.title}</h3>
                                  {e.bestseller && <span className="text-xs px-2 py-0.5 bg-yellow-900/30 text-yellow-400 rounded-full border border-yellow-700/30">Bestseller</span>}
                                  {e.new && <span className="text-xs px-2 py-0.5 bg-emerald-900/30 text-emerald-400 rounded-full border border-emerald-700/30">Nouveau</span>}
                                  {!e.actif && <span className="text-xs px-2 py-0.5 bg-red-900/30 text-red-400 rounded-full border border-red-700/30">Désactivé</span>}
                                  {uploadedPdfs.includes(e.id) && <span className="text-xs px-2 py-0.5 bg-emerald-900/30 text-emerald-400 rounded-full border border-emerald-700/30 flex items-center gap-1"><FileText size={10} /> PDF uploadé</span>}
                                </div>
                                <div className="flex flex-wrap gap-x-5 gap-y-0.5 text-xs text-gray-700">
                                  <span className="text-gray-800">{e.category}</span>
                                  <span><strong className="text-green-600">{e.price.toLocaleString("fr-FR")} FCFA</strong>{e.originalPrice ? <span className="line-through ml-1">{e.originalPrice.toLocaleString("fr-FR")}</span> : ""}</span>
                                  <span>{e.pages} pages · {e.rating}/5 ({e.reviews} avis)</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <button
                                title="Copier le lien"
                                onClick={() => {
                                  navigator.clipboard.writeText(`${window.location.origin}/ebooks/${e.slug}`);
                                  setCopiedEbookId(e.id);
                                  setTimeout(() => setCopiedEbookId(null), 2000);
                                }}
                                className={`p-2 rounded-lg transition-all ${copiedEbookId === e.id ? "text-emerald-400 bg-emerald-900/20" : "text-gray-800 hover:text-green-600 hover:bg-green-50"}`}
                              >
                                {copiedEbookId === e.id ? <CheckCircle size={16} /> : <Link2 size={16} />}
                              </button>
                              <a href={`/ebooks/${e.slug}`} target="_blank" title="Voir sur le site" className="p-2 text-gray-800 hover:text-green-400 hover:bg-green-900/20 rounded-lg"><ExternalLink size={16} /></a>
                              <button
                                title={!e.actif && (!e.whatsappUrl || !uploadedPdfs.includes(e.id)) ? "Ajoutez le lien WhatsApp et le fichier PDF avant d'activer" : e.actif ? "Désactiver" : "Activer"}
                                onClick={() => {
                                  if (!e.actif) {
                                    const hasPdf = uploadedPdfs.includes(e.id);
                                    if (!e.whatsappUrl || !hasPdf) {
                                      const missing = [...(!e.whatsappUrl ? ["lien WhatsApp de la communauté"] : []), ...(!hasPdf ? ["fichier PDF téléchargeable"] : [])];
                                      alert(`⚠ Éléments manquants\n\nCliquez sur "Modifier" et renseignez : ${missing.join(", ")}.`);
                                      return;
                                    }
                                  }
                                  catalogue.toggleEbookActif(e.id);
                                  setTimeout(syncEbooksToServer, 100);
                                }}
                                className={`p-2 rounded-lg ${e.actif ? "text-emerald-400 hover:bg-emerald-900/30" : (!e.whatsappUrl || !uploadedPdfs.includes(e.id)) ? "text-gray-400 cursor-not-allowed" : "text-gray-800 hover:bg-green-50"}`}
                              >
                                {e.actif ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                              </button>
                              <button onClick={() => { setEditEbookId(e.id); setShowEbookForm(false); }} className="p-2 text-gray-800 hover:text-green-600 hover:bg-green-50 rounded-lg" title="Modifier"><Pencil size={16} /></button>
                              <button
                                onClick={() => { catalogue.dupliquerEbook(e.id); setTimeout(syncEbooksToServer, 100); }}
                                className="p-2 text-gray-800 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                                title="Dupliquer cet ebook"
                              >
                                <Copy size={16} />
                              </button>
                              {confirmDeleteEbook === e.id ? (
                                <div className="flex gap-1">
                                  <button onClick={() => { catalogue.supprimerEbook(e.id); setConfirmDeleteEbook(null); setTimeout(syncEbooksToServer, 100); }} className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-lg">Oui</button>
                                  <button onClick={() => setConfirmDeleteEbook(null)} className="px-3 py-1 border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg">Non</button>
                                </div>
                              ) : (
                                <button onClick={() => setConfirmDeleteEbook(e.id)} className="p-2 text-gray-800 hover:text-red-400 hover:bg-red-900/20 rounded-lg"><Trash2 size={16} /></button>
                              )}
                            </div>
                          </div>
                          {/* Photo de couverture */}
                          <div className="pl-0 pt-2 border-t border-gray-100">
                            <p className="text-gray-700 text-xs font-semibold mb-2">Photo de couverture :</p>
                            <UploadCover
                              ebookId={e.id}
                              currentCover={uploadedCovers[e.id] ?? e.cover ?? ""}
                              onUploaded={(url) => {
                                setUploadedCovers((prev) => ({ ...prev, [e.id]: url }));
                                catalogue.modifierEbook(e.id, { cover: url });
                                catalogue.setEbookOverride(e.id, { cover: url });
                                setTimeout(syncEbooksToServer, 100);
                              }}
                              onDeleted={() => {
                                setUploadedCovers((prev) => { const n = { ...prev }; delete n[e.id]; return n; });
                                catalogue.modifierEbook(e.id, { cover: "" });
                                catalogue.setEbookOverride(e.id, { cover: "" });
                                setTimeout(syncEbooksToServer, 100);
                              }}
                            />
                          </div>
                          {/* Bannière page détail */}
                          <div className="pl-0 pt-2 border-t border-gray-100">
                            <p className="text-gray-700 text-xs font-semibold mb-2">Bannière page de détail :</p>
                            <UploadCover
                              apiPath="/api/admin/upload-banner"
                              label="Uploader la bannière"
                              ebookId={e.id}
                              currentCover={e.banner ?? ""}
                              onUploaded={(url) => {
                                catalogue.modifierEbook(e.id, { banner: url });
                                catalogue.setEbookOverride(e.id, { banner: url });
                                setTimeout(syncEbooksToServer, 100);
                              }}
                              onDeleted={() => {
                                catalogue.modifierEbook(e.id, { banner: "" });
                                catalogue.setEbookOverride(e.id, { banner: "" });
                                setTimeout(syncEbooksToServer, 100);
                              }}
                            />
                          </div>
                          {/* Upload PDF */}
                          <div className="pl-0 pt-2 border-t border-gray-100">
                            <p className="text-gray-700 text-xs font-semibold mb-2">Fichier PDF téléchargeable :</p>
                            <UploadPDF
                              ebookId={e.id}
                              ebookTitle={e.title}
                              uploaded={uploadedPdfs.includes(e.id)}
                              onDone={fetchUploadedPdfs}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ebooks statiques du catalogue */}
          <div>
            <h3 className="text-gray-900 font-bold mb-3 flex items-center gap-2">
              <BookOpen size={16} className="text-green-400" />
              Catalogue statique ({staticEbooks.filter(e => ebookFuzzyMatch(ebookSearch, e.title, e.category, e.description)).length} ebook{staticEbooks.filter(e => ebookFuzzyMatch(ebookSearch, e.title, e.category, e.description)).length > 1 ? "s" : ""})
              <span className="text-xs text-gray-800 font-normal">— cliquez sur ✏️ pour modifier description, prix et couverture</span>
            </h3>
            <div className="space-y-2">
              {staticEbooks.filter(e => ebookFuzzyMatch(ebookSearch, e.title, e.category, e.description)).map((e) => {
                const override = catalogue.ebookOverrides[e.id] || {};
                const actif = catalogue.isStaticEbookActif(e.id);
                const isEditing = editEbookId === `static-${e.id}`;
                return (
                  <div key={e.id}>
                    {isEditing ? (
                      <FormulaireEbook
                        initial={{
                          title: e.title,
                          description: (override.description as string) ?? e.description,
                          category: e.category,
                          price: String(override.price ?? e.price),
                          originalPrice: String(override.originalPrice ?? e.originalPrice ?? ""),
                          pages: String(override.pages ?? e.pages),
                          rating: String(override.rating ?? e.rating),
                          reviews: String(override.reviews ?? e.reviews),
                          bestseller: override.bestseller ?? !!e.bestseller,
                          new: override.new ?? !!e.new,
                          cover: (override.cover as string) || e.cover || "",
                          banner: (override as { banner?: string }).banner || (e as { banner?: string }).banner || "",
                          downloadUrl: (override as { downloadUrl?: string }).downloadUrl || "",
                          ctaLabel: (override as { ctaLabel?: string }).ctaLabel || e.ctaLabel || "",
                          faq: (override as { faq?: { q: string; a: string }[] }).faq || e.faq || [],
                          avisClients: (override as { avisClients?: { nom: string; note: number; texte: string }[] }).avisClients || e.avisClients || [],
                          commentAcheterUrl: (override as { commentAcheterUrl?: string }).commentAcheterUrl || e.commentAcheterUrl || "",
                          whatsappUrl: (override as { whatsappUrl?: string }).whatsappUrl || (e as { whatsappUrl?: string }).whatsappUrl || "",
                          coverLayout: ((override as { coverLayout?: "full"|"overlay"|"split"|"frame" }).coverLayout || e.coverLayout || "full") as "full"|"overlay"|"split"|"frame",
                          pdfPreviewUrl: (override as { pdfPreviewUrl?: string }).pdfPreviewUrl || e.pdfPreviewUrl || "",
                          ctaAnimation: (override as { ctaAnimation?: EbookForm["ctaAnimation"] }).ctaAnimation || "pulse",
                          reviewCardSize: (override as { reviewCardSize?: EbookForm["reviewCardSize"] }).reviewCardSize || "medium",
                          sections: (override as { sections?: SectionForm[] }).sections || [],
                          promoEndDate: (override as { promoEndDate?: string }).promoEndDate || (e as { promoEndDate?: string }).promoEndDate || "",
                          promoCyclique: (override as { promoCyclique?: boolean }).promoCyclique ?? (e as { promoCyclique?: boolean }).promoCyclique ?? false,
                          promoDureeHeures: String((override as { promoDureeHeures?: number }).promoDureeHeures || (e as { promoDureeHeures?: number }).promoDureeHeures || 24),
                          vendusAffiche: (override as { vendusAffiche?: number }).vendusAffiche != null ? String((override as { vendusAffiche?: number }).vendusAffiche) : (e as { vendusAffiche?: number }).vendusAffiche != null ? String((e as { vendusAffiche?: number }).vendusAffiche) : "",
                          placesRestantesBloquees: (override as { placesRestantesBloquees?: number }).placesRestantesBloquees != null ? String((override as { placesRestantesBloquees?: number }).placesRestantesBloquees) : (e as { placesRestantesBloquees?: number }).placesRestantesBloquees != null ? String((e as { placesRestantesBloquees?: number }).placesRestantesBloquees) : "",
                          cardBgColor: (override as { cardBgColor?: string }).cardBgColor || e.cardBgColor || "",
                          cardTextColor: (override as { cardTextColor?: string }).cardTextColor || e.cardTextColor || "",
                          priceColor: (override as { priceColor?: string }).priceColor || e.priceColor || "",
                          ctaBgColor: (override as { ctaBgColor?: string }).ctaBgColor || e.ctaBgColor || "",
                          ctaTextColor: (override as { ctaTextColor?: string }).ctaTextColor || e.ctaTextColor || "",
                          bandeauColor: (override as { bandeauColor?: string }).bandeauColor || e.bandeauColor || "",
                          coverHeight: String((override as { coverHeight?: number }).coverHeight || e.coverHeight || 260),
                          coverObjectPosition: (override as { coverObjectPosition?: string }).coverObjectPosition || e.coverObjectPosition || "center",
                          coverObjectFit: ((override as { coverObjectFit?: "cover"|"contain" }).coverObjectFit || e.coverObjectFit || "cover") as "cover"|"contain",
                          communityBgColor: (override as { communityBgColor?: string }).communityBgColor || (e as { communityBgColor?: string }).communityBgColor || "",
                          communityTextColor: (override as { communityTextColor?: string }).communityTextColor || (e as { communityTextColor?: string }).communityTextColor || "",
                          audioUrl: (override as { audioUrl?: string }).audioUrl || (e as { audioUrl?: string }).audioUrl || "",
                          videoUrl: (override as { videoUrl?: string }).videoUrl || e.videoUrl || "",
                          metaTitle: (override as { metaTitle?: string }).metaTitle || e.metaTitle || "",
                          metaDescription: (override as { metaDescription?: string }).metaDescription || e.metaDescription || "",
                          keywords: (override as { keywords?: string }).keywords || e.keywords || "",
                          customSlug: (override as { customSlug?: string }).customSlug || e.customSlug || "",
                          ogImage: (override as { ogImage?: string }).ogImage || e.ogImage || "",
                        }}
                        onSave={(form) => {
                          catalogue.setEbookOverride(e.id, {
                            description: form.description,
                            price: parseInt(form.price) || e.price,
                            originalPrice: form.originalPrice ? parseInt(form.originalPrice) : undefined,
                            cover: form.cover || e.cover,
                            banner: form.banner.trim() || undefined,
                            pages: parseInt(form.pages) || e.pages,
                            rating: parseFloat(form.rating) || e.rating,
                            reviews: parseInt(form.reviews) || e.reviews,
                            bestseller: form.bestseller,
                            new: form.new,
                            ctaLabel: form.ctaLabel || undefined,
                            faq: form.faq.filter(f => f.q.trim()),
                            avisClients: form.avisClients.filter(a => a.nom.trim() && a.texte.trim()),
                            commentAcheterUrl: form.commentAcheterUrl.trim() || undefined,
                            coverLayout: form.coverLayout,
                            pdfPreviewUrl: form.pdfPreviewUrl.trim() || undefined,
                            promoEndDate: form.promoEndDate.trim() || undefined,
                            promoCyclique: form.promoCyclique || undefined,
                            promoDureeHeures: form.promoCyclique ? (parseInt(form.promoDureeHeures) || 24) : undefined,
                            cardBgColor: form.cardBgColor.trim() || undefined,
                            cardTextColor: form.cardTextColor.trim() || undefined,
                            priceColor: form.priceColor.trim() || undefined,
                            ctaBgColor: form.ctaBgColor.trim() || undefined,
                            ctaTextColor: form.ctaTextColor.trim() || undefined,
                            bandeauColor: form.bandeauColor.trim() || undefined,
                            coverHeight: parseInt(form.coverHeight) || undefined,
                            communityBgColor: form.communityBgColor.trim() || undefined,
                            communityTextColor: form.communityTextColor.trim() || undefined,
                          });
                          setEditEbookId(null);
                          setTimeout(syncEbooksToServer, 100);
                        }}
                        onCancel={() => setEditEbookId(null)}
                        titreForm={`Modifier — ${e.title}`}
                        adminPassword={adminSession?.password}
                        extraCategories={customCategories}
                      />
                    ) : (
                      <div className={`p-4 rounded-xl border transition-all ${actif ? "bg-white border-green-100" : "bg-white/[0.01] border-gray-100 opacity-50"}`}>
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex flex-col gap-3 flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                  <h4 className="text-gray-900 text-sm font-semibold truncate">{e.title}</h4>
                                  {e.bestseller && <span className="text-xs px-1.5 py-0.5 bg-yellow-900/20 text-yellow-500 rounded-full">Bestseller</span>}
                                  {uploadedPdfs.includes(e.id) && <span className="text-xs px-1.5 py-0.5 bg-emerald-900/20 text-emerald-400 rounded-full flex items-center gap-0.5"><FileText size={9} /> PDF en ligne</span>}
                                </div>
                                <div className="flex gap-3 text-xs text-gray-700">
                                  <span>{e.price.toLocaleString("fr-FR")} FCFA</span>
                                  <span>{e.pages} p.</span>
                                  <span className="text-gray-900 truncate">{e.category.split(",")[0]}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <button
                                  title="Copier le lien"
                                  onClick={() => {
                                    navigator.clipboard.writeText(`${window.location.origin}/ebooks/${e.slug}`);
                                    setCopiedEbookId(e.id);
                                    setTimeout(() => setCopiedEbookId(null), 2000);
                                  }}
                                  className={`p-1.5 rounded-lg transition-all ${copiedEbookId === e.id ? "text-emerald-400 bg-emerald-100" : "text-gray-800 hover:text-green-600 hover:bg-green-50"}`}
                                >
                                  {copiedEbookId === e.id ? <CheckCircle size={15} /> : <Link2 size={15} />}
                                </button>
                                <a href={`/ebooks/${e.slug}`} target="_blank" title="Voir sur le site" className="p-1.5 text-gray-800 hover:text-green-600 hover:bg-green-50 rounded-lg"><ExternalLink size={15} /></a>
                                <button
                                  title={!actif && (!(catalogue.ebookOverrides[e.id] as { whatsappUrl?: string } | undefined)?.whatsappUrl || !uploadedPdfs.includes(e.id)) ? "Ajoutez le lien WhatsApp et le fichier PDF avant d'activer" : actif ? "Désactiver" : "Activer"}
                                  onClick={() => {
                                    if (!actif) {
                                      const hasWhatsapp = !!(catalogue.ebookOverrides[e.id] as { whatsappUrl?: string } | undefined)?.whatsappUrl;
                                      const hasPdf = uploadedPdfs.includes(e.id);
                                      if (!hasWhatsapp || !hasPdf) {
                                        const missing = [...(!hasWhatsapp ? ["lien WhatsApp de la communauté"] : []), ...(!hasPdf ? ["fichier PDF téléchargeable"] : [])];
                                        alert(`⚠ Éléments manquants\n\nCliquez sur "Modifier" et renseignez : ${missing.join(", ")}.`);
                                        return;
                                      }
                                    }
                                    catalogue.toggleStaticEbookActif(e.id);
                                    setTimeout(syncEbooksToServer, 100);
                                  }}
                                  className={`p-1.5 rounded-lg text-sm ${actif ? "text-emerald-400 hover:bg-emerald-900/30" : (!(catalogue.ebookOverrides[e.id] as { whatsappUrl?: string } | undefined)?.whatsappUrl || !uploadedPdfs.includes(e.id)) ? "text-gray-400 cursor-not-allowed" : "text-gray-800 hover:bg-green-50"}`}
                                >
                                  {actif ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                                </button>
                                <button onClick={() => setEditEbookId(`static-${e.id}`)} className="p-1.5 text-gray-800 hover:text-green-600 hover:bg-green-50 rounded-lg" title="Modifier la description"><Pencil size={15} /></button>
                              </div>
                            </div>
                            {/* Photo de couverture */}
                            <div className="pt-2 border-t border-gray-100">
                              <p className="text-gray-700 text-xs font-semibold mb-2">Photo de couverture :</p>
                              <UploadCover
                                ebookId={e.id}
                                currentCover={uploadedCovers[e.id] ?? e.cover ?? ""}
                                onUploaded={(url) => {
                                  setUploadedCovers((prev) => ({ ...prev, [e.id]: url }));
                                  catalogue.setEbookOverride(e.id, { cover: url });
                                  setTimeout(syncEbooksToServer, 100);
                                }}
                                onDeleted={() => {
                                  setUploadedCovers((prev) => { const n = { ...prev }; delete n[e.id]; return n; });
                                  catalogue.setEbookOverride(e.id, { cover: e.cover ?? "" });
                                  setTimeout(syncEbooksToServer, 100);
                                }}
                              />
                            </div>
                            {/* Bannière page détail */}
                            <div className="pt-2 border-t border-gray-100">
                              <p className="text-gray-700 text-xs font-semibold mb-2">Bannière page de détail :</p>
                              <UploadCover
                                apiPath="/api/admin/upload-banner"
                                label="Uploader la bannière"
                                ebookId={e.id}
                                currentCover={(catalogue.ebookOverrides[e.id] as { banner?: string })?.banner ?? ""}
                                onUploaded={(url) => {
                                  catalogue.setEbookOverride(e.id, { banner: url });
                                  setTimeout(syncEbooksToServer, 100);
                                }}
                                onDeleted={() => {
                                  catalogue.setEbookOverride(e.id, { banner: "" });
                                  setTimeout(syncEbooksToServer, 100);
                                }}
                              />
                            </div>
                            {/* Upload PDF direct */}
                            <div className="pt-2 border-t border-gray-100">
                              <p className="text-gray-700 text-xs font-semibold mb-2">Fichier PDF :</p>
                              <UploadPDF
                                ebookId={e.id}
                                ebookTitle={e.title}
                                uploaded={uploadedPdfs.includes(e.id)}
                                onDone={fetchUploadedPdfs}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Corbeille ebooks */}
          {catalogue.ebooks.filter(e => e.deletedAt).length > 0 && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-2xl">
              <h4 className="flex items-center gap-2 text-red-700 font-bold text-sm mb-3">
                <Trash2 size={14} /> Corbeille locale — {catalogue.ebooks.filter(e => e.deletedAt).length} ebook{catalogue.ebooks.filter(e => e.deletedAt).length > 1 ? "s" : ""} supprimé{catalogue.ebooks.filter(e => e.deletedAt).length > 1 ? "s" : ""}
                <span className="text-red-500 text-xs font-normal ml-1">(toujours visible sur le site public — restaurez ou supprimez définitivement)</span>
              </h4>
              <div className="space-y-2">
                {catalogue.ebooks.filter(e => e.deletedAt).map(e => (
                  <div key={e.id} className="flex items-center justify-between p-3 bg-white border border-red-200 rounded-xl gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-gray-800 text-sm font-semibold truncate">{e.title}</p>
                      <p className="text-gray-500 text-xs">Mis en corbeille le {new Date(e.deletedAt!).toLocaleDateString("fr-FR")}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => { catalogue.restaurerEbook(e.id); setTimeout(syncEbooksToServer, 100); }} className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition-all">Restaurer</button>
                      <button onClick={() => { if (confirm(`Supprimer définitivement "${e.title}" ? Cette action est irréversible.`)) { catalogue.supprimerEbookDefinitif(e.id); setTimeout(syncEbooksToServer, 100); } }} className="px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-all">Supprimer définitivement</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ ONGLET FORMATIONS ══ */}
      {onglet === "formations" && (
        <div>
          {adminSession?.password && <InterrupteurFormations adminPassword={adminSession.password} />}
          {!showFormationForm && !editFormationId && (
            <button onClick={() => setShowFormationForm(true)}
              className="w-full mb-6 py-4 border-2 border-dashed border-green-300 hover:border-green-500 hover:bg-green-50 text-green-600 rounded-2xl flex items-center justify-center gap-2 font-bold transition-all">
              <Plus size={20} /> Ajouter une nouvelle formation
            </button>
          )}

          {showFormationForm && !editFormationId && (
            <div className="mb-6">
              <FormulaireFormation initial={FORMATION_VIDE} onSave={saveFormation} onCancel={() => setShowFormationForm(false)} titreForm="Nouvelle formation" extraCategories={customCategories} adminPassword={adminSession?.password} />
            </div>
          )}

          {/* Formations créées par l'admin */}
          {catalogue.formations.filter(f => !f.deletedAt).length > 0 && (
            <div className="mb-8">
              <h3 className="text-gray-900 font-bold mb-3 flex items-center gap-2"><Play size={16} className="text-green-600" />Formations créées ({catalogue.formations.filter(f => !f.deletedAt).length})</h3>
              <div className="space-y-3">
                {catalogue.formations.filter(f => !f.deletedAt).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((f) => (
                  <div key={f.id}>
                    {editFormationId === f.id ? (
                      <FormulaireFormation initial={toFormationForm(f)} onSave={saveFormation} onCancel={() => setEditFormationId(null)} titreForm={`Modifier — ${f.titre}`} extraCategories={customCategories} adminPassword={adminSession?.password} />
                    ) : (
                      <div className={`p-5 rounded-2xl border transition-all ${f.actif ? "bg-white border-green-200" : "bg-white/[0.01] border-gray-100 opacity-60"}`}>
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1 flex-wrap">
                              <h3 className="text-gray-900 font-bold truncate">{f.titre}</h3>
                              {f.badge && <span className="text-xs px-2 py-0.5 bg-green-900/30 text-green-400 rounded-full border border-green-700/30">{f.badge}</span>}
                              {!f.actif && <span className="text-xs px-2 py-0.5 bg-red-900/30 text-red-400 rounded-full border border-red-700/30">Désactivé</span>}
                            </div>
                            <div className="flex flex-wrap gap-x-5 gap-y-0.5 text-xs text-gray-700">
                              <span className="text-gray-800">{f.categorie}</span>
                              <span><strong className="text-green-600">{f.prix.toLocaleString("fr-FR")} FCFA</strong></span>
                              <span>{f.niveau} · {f.duree} · {f.modules} modules · {f.note}/5</span>
                              <span>{f.apprenants} apprenants</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              onClick={() => setOpenVideosFormationId(openVideosFormationId === f.id ? null : f.id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-900/20 border border-green-700/30 text-green-300 text-xs rounded-xl hover:bg-green-900/40 transition-all"
                            >
                              <Play size={12} /> Vidéos
                            </button>
                            <button onClick={() => { catalogue.toggleFormationActif(f.id); setTimeout(syncFormationsToServer, 100); }} className={`p-2 rounded-lg ${f.actif ? "text-emerald-400 hover:bg-emerald-900/30" : "text-gray-800 hover:bg-green-50"}`}>{f.actif ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}</button>
                            <button onClick={() => { setEditFormationId(f.id); setShowFormationForm(false); }} className="p-2 text-gray-800 hover:text-green-600 hover:bg-green-50 rounded-lg"><Pencil size={16} /></button>
                            {confirmDeleteFormation === f.id ? (
                              <div className="flex gap-1">
                                <button onClick={() => { catalogue.supprimerFormation(f.id); setConfirmDeleteFormation(null); setTimeout(syncFormationsToServer, 100); }} className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-lg">Oui</button>
                                <button onClick={() => setConfirmDeleteFormation(null)} className="px-3 py-1 border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg">Non</button>
                              </div>
                            ) : (
                              <button onClick={() => setConfirmDeleteFormation(f.id)} className="p-2 text-gray-800 hover:text-red-400 hover:bg-red-900/20 rounded-lg"><Trash2 size={16} /></button>
                            )}
                          </div>
                        </div>
                        {openVideosFormationId === f.id && (
                          <GestionVideos formationId={f.id} formationTitre={f.titre} />
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Formations statiques du catalogue */}
          <div>
            <h3 className="text-gray-900 font-bold mb-3 flex items-center gap-2">
              <Play size={16} className="text-green-400" />
              Catalogue statique ({staticFormations.length} formations)
              <span className="text-xs text-gray-800 font-normal">— cliquez sur &quot;Vidéos&quot; pour ajouter le contenu</span>
            </h3>
            <div className="space-y-2">
              {staticFormations.map((f) => {
                const actif = catalogue.isStaticFormationActif(f.id);
                return (
                  <div key={f.id} className={`p-4 rounded-xl border transition-all ${actif ? "bg-white border-green-100" : "bg-white/[0.01] border-gray-100 opacity-50"}`}>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <h4 className="text-gray-900 text-sm font-semibold truncate">{f.titre}</h4>
                          {f.badge && <span className="text-xs px-1.5 py-0.5 bg-green-900/20 text-green-400 rounded-full">{f.badge}</span>}
                        </div>
                        <div className="flex gap-3 text-xs text-gray-700">
                          <span>{f.prix.toLocaleString("fr-FR")} FCFA</span>
                          <span>{f.niveau}</span>
                          <span>{f.duree} · {f.modules} modules</span>
                          <span className="text-gray-900">{f.categorie}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => setOpenVideosFormationId(openVideosFormationId === f.id ? null : f.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-green-900/20 border border-green-700/30 text-green-300 text-xs rounded-xl hover:bg-green-900/40 transition-all"
                        >
                          <Play size={12} /> Vidéos
                        </button>
                        <button onClick={() => { catalogue.toggleStaticFormationActif(f.id); setTimeout(syncFormationsToServer, 100); }} className={`p-1.5 rounded-lg ${actif ? "text-emerald-400 hover:bg-emerald-900/30" : "text-gray-800 hover:bg-green-50"}`}>{actif ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}</button>
                      </div>
                    </div>
                    {openVideosFormationId === f.id && (
                      <GestionVideos formationId={f.id} formationTitre={f.titre} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Corbeille formations */}
          {catalogue.formations.filter(f => f.deletedAt).length > 0 && (
            <div className="mt-6">
              <details className="group">
                <summary className="flex items-center gap-2 text-gray-800 hover:text-gray-700 cursor-pointer text-sm font-medium list-none">
                  <Trash2 size={14} /> Corbeille ({catalogue.formations.filter(f => f.deletedAt).length} formation{catalogue.formations.filter(f => f.deletedAt).length > 1 ? "s" : ""})
                </summary>
                <div className="mt-3 space-y-2">
                  {catalogue.formations.filter(f => f.deletedAt).map(f => (
                    <div key={f.id} className="flex items-center justify-between p-4 bg-red-900/10 border border-red-900/30 rounded-xl gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-gray-700 text-sm font-medium truncate">{f.titre}</p>
                        <p className="text-gray-900 text-xs">Supprimé le {new Date(f.deletedAt!).toLocaleDateString("fr-FR")}</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => { catalogue.restaurerFormation(f.id); setTimeout(syncFormationsToServer, 100); }} className="px-3 py-1.5 bg-emerald-900/30 border border-emerald-700/40 text-emerald-400 text-xs rounded-lg hover:bg-emerald-900/50 transition-all">Restaurer</button>
                        <button onClick={() => { catalogue.supprimerFormationDefinitif(f.id); setTimeout(syncFormationsToServer, 100); }} className="px-3 py-1.5 bg-red-900/30 border border-red-700/40 text-red-400 text-xs rounded-lg hover:bg-red-900/50 transition-all">Supprimer définitivement</button>
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            </div>
          )}
        </div>
      )}

      {/* ══ ONGLET ANNONCES ══ */}
      {onglet === "annonces" && allowedTabs.includes("annonces") && (
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Megaphone size={20} className="text-green-600" />
              <h2 className="text-gray-900 font-bold text-xl">Annonces marketing</h2>
            </div>
            <button
              onClick={() => setAnnouncements(a => [...a, { id: `ann-${Date.now()}`, text: "", active: false, color: "yellow" as const, link: "", linkText: "", bgColor: "#1e293b", textColor: "#ffffff", btnBgColor: "#E8B800", btnTextColor: "#000000" }])}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-green-300 text-green-600 text-sm rounded-xl hover:bg-green-100"
            >
              <Plus size={15} /> Ajouter une annonce
            </button>
          </div>
          <p className="text-gray-800 text-sm font-semibold">Plusieurs bannières peuvent être actives simultanément. Chaque annonce peut contenir un lien ou bouton cliquable.</p>

          {announcements.length === 0 && (
            <div className="text-center py-10 text-gray-800">
              <Megaphone size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Aucune annonce. Cliquez sur &quot;Ajouter une annonce&quot; pour commencer.</p>
            </div>
          )}

          <div className="space-y-4">
            {announcements.map((ann, idx) => (
              <div key={ann.id} className="p-5 bg-white border border-green-200 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 text-xs font-semibold font-mono">Annonce #{idx + 1}</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setAnnouncements(a => a.map((x, i) => i === idx ? { ...x, active: !x.active } : x))}
                      className={`p-1 rounded-lg transition-all ${ann.active ? "text-emerald-400 hover:bg-emerald-900/30" : "text-gray-800 hover:bg-green-50"}`}
                    >
                      {ann.active ? <ToggleRight size={26} /> : <ToggleLeft size={26} />}
                    </button>
                    <button onClick={() => setAnnouncements(a => a.filter((_, i) => i !== idx))} className="p-1.5 text-gray-800 hover:text-red-400 rounded-lg"><Trash2 size={14} /></button>
                  </div>
                </div>

                {/* Aperçu */}
                {ann.text.trim() && (() => {
                  const isCustom = ann.color === "custom";
                  const presetBg: Record<string, string> = { yellow: "rgba(232,184,0,0.10)", green: "rgba(16,185,129,0.10)", red: "rgba(239,68,68,0.10)", blue: "rgba(59,130,246,0.10)" };
                  const presetText: Record<string, string> = { yellow: "#ca8a04", green: "#27A827", red: "#dc2626", blue: "#2563eb" };
                  const bg = isCustom ? (ann.bgColor || "#1e293b") : presetBg[ann.color];
                  const txt = isCustom ? (ann.textColor || "#ffffff") : presetText[ann.color];
                  const btnBg = isCustom ? (ann.btnBgColor || "#E8B800") : presetText[ann.color];
                  const btnTxt = isCustom ? (ann.btnTextColor || "#000000") : "#ffffff";
                  return (
                    <div className="flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-xl border border-white/10" style={{ backgroundColor: bg, color: txt }}>
                      <Megaphone size={12} className="shrink-0" />
                      <span className="flex-1">{ann.text}</span>
                      {ann.link && <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ backgroundColor: btnBg, color: btnTxt }}>{ann.linkText || "Voir"} →</span>}
                    </div>
                  );
                })()}

                <div>
                  <label className="block text-gray-700 text-xs font-semibold mb-1.5">Message</label>
                  <textarea
                    value={ann.text}
                    onChange={(e) => setAnnouncements(a => a.map((x, i) => i === idx ? { ...x, text: e.target.value } : x))}
                    rows={2}
                    placeholder="Ex : Promotion -30% sur tous les ebooks jusqu'au 31 janvier !"
                    className="w-full px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-green-500 transition-colors text-sm resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-700 text-xs font-semibold mb-1.5">Lien (optionnel)</label>
                    <input type="url" value={ann.link || ""} onChange={(e) => setAnnouncements(a => a.map((x, i) => i === idx ? { ...x, link: e.target.value } : x))}
                      className="w-full px-3 py-2 bg-green-50 border border-green-200 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-green-500"
                      placeholder="https://... ou /ebooks" />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-xs font-semibold mb-1.5">Texte du bouton</label>
                    <input type="text" value={ann.linkText || ""} onChange={(e) => setAnnouncements(a => a.map((x, i) => i === idx ? { ...x, linkText: e.target.value } : x))}
                      className="w-full px-3 py-2 bg-green-50 border border-green-200 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-green-500"
                      placeholder="Voir l'offre" />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-gray-700 text-xs font-semibold">Couleur</label>
                  {/* Présets rapides */}
                  <div className="flex gap-2 flex-wrap">
                    {([
                      { key: "yellow", label: "Doré", bg: "rgba(232,184,0,0.10)", text: "#ca8a04", border: "#ca8a04" },
                      { key: "green",  label: "Vert",  bg: "rgba(16,185,129,0.10)", text: "#27A827", border: "#27A827" },
                      { key: "red",    label: "Rouge", bg: "rgba(239,68,68,0.10)", text: "#dc2626", border: "#dc2626" },
                      { key: "blue",   label: "Bleu",  bg: "rgba(59,130,246,0.10)", text: "#2563eb", border: "#2563eb" },
                    ] as const).map((c) => (
                      <button key={c.key} type="button"
                        onClick={() => setAnnouncements(a => a.map((x, i) => i === idx ? { ...x, color: c.key } : x))}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${ann.color === c.key ? "ring-2 ring-green-500" : ""}`}
                        style={{ backgroundColor: c.bg, color: c.text, borderColor: c.border }}
                      >
                        {c.label}
                      </button>
                    ))}
                    <button type="button"
                      onClick={() => setAnnouncements(a => a.map((x, i) => i === idx ? { ...x, color: "custom" } : x))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border border-green-300 text-green-600 hover:bg-green-50 ${ann.color === "custom" ? "ring-2 ring-green-500 bg-green-50" : ""}`}
                    >
                      🎨 Personnalisé
                    </button>
                  </div>

                  {/* Color pickers si mode personnalisé */}
                  {ann.color === "custom" && (
                    <div className="grid grid-cols-2 gap-4 p-4 bg-green-50 rounded-xl border border-green-200">
                      <div>
                        <label className="block text-gray-600 text-xs mb-1.5 font-semibold">Fond de la bannière</label>
                        <div className="flex items-center gap-2">
                          <input type="color" value={ann.bgColor || "#1e293b"}
                            onChange={(e) => setAnnouncements(a => a.map((x, i) => i === idx ? { ...x, bgColor: e.target.value } : x))}
                            className="w-9 h-9 rounded-lg border border-green-200 cursor-pointer p-0.5 bg-white" />
                          <span className="text-xs text-gray-500 font-mono">{ann.bgColor || "#1e293b"}</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-gray-600 text-xs mb-1.5 font-semibold">Couleur du texte</label>
                        <div className="flex items-center gap-2">
                          <input type="color" value={ann.textColor || "#ffffff"}
                            onChange={(e) => setAnnouncements(a => a.map((x, i) => i === idx ? { ...x, textColor: e.target.value } : x))}
                            className="w-9 h-9 rounded-lg border border-green-200 cursor-pointer p-0.5 bg-white" />
                          <span className="text-xs text-gray-500 font-mono">{ann.textColor || "#ffffff"}</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-gray-600 text-xs mb-1.5 font-semibold">Fond du bouton lien</label>
                        <div className="flex items-center gap-2">
                          <input type="color" value={ann.btnBgColor || "#E8B800"}
                            onChange={(e) => setAnnouncements(a => a.map((x, i) => i === idx ? { ...x, btnBgColor: e.target.value } : x))}
                            className="w-9 h-9 rounded-lg border border-green-200 cursor-pointer p-0.5 bg-white" />
                          <span className="text-xs text-gray-500 font-mono">{ann.btnBgColor || "#E8B800"}</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-gray-600 text-xs mb-1.5 font-semibold">Texte du bouton lien</label>
                        <div className="flex items-center gap-2">
                          <input type="color" value={ann.btnTextColor || "#000000"}
                            onChange={(e) => setAnnouncements(a => a.map((x, i) => i === idx ? { ...x, btnTextColor: e.target.value } : x))}
                            className="w-9 h-9 rounded-lg border border-green-200 cursor-pointer p-0.5 bg-white" />
                          <span className="text-xs text-gray-500 font-mono">{ann.btnTextColor || "#000000"}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {announcements.length > 0 && (
            <button
              onClick={async () => {
                setAnnouncementSaving(true);
                await fetch("/api/admin/announcement", {
                  method: "POST",
                  headers: { "Content-Type": "application/json", "x-admin-password": adminSession.password },
                  body: JSON.stringify(announcements),
                }).catch(() => {});
                setAnnouncementSaving(false);
              }}
              disabled={announcementSaving}
              className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-black font-bold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {announcementSaving ? <><Loader2 size={16} className="animate-spin" /> Sauvegarde...</> : <><Save size={16} /> Sauvegarder toutes les annonces</>}
            </button>
          )}
        </div>
      )}

      {/* ══ ONGLET AVIS ══ */}
      {onglet === "avis" && allowedTabs.includes("avis") && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <MessageSquare size={20} className="text-green-600" />
            <h2 className="text-xl font-bold text-white">Modération des avis clients</h2>
          </div>

          {reviewsLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={28} className="animate-spin text-green-600" />
            </div>
          ) : adminReviews.length === 0 ? (
            <div className="text-center py-16 text-gray-800">
              <MessageSquare size={40} className="mx-auto mb-3 opacity-30" />
              <p>Aucun avis pour le moment.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {["en_attente", "approuve", "rejete"].map((section) => {
                const sectionReviews = adminReviews.filter(r => r.statut === section);
                if (sectionReviews.length === 0) return null;
                return (
                  <div key={section}>
                    <h3 className={`text-sm font-bold mb-3 flex items-center gap-2 ${section === "en_attente" ? "text-yellow-400" : section === "approuve" ? "text-emerald-400" : "text-red-400"}`}>
                      {section === "en_attente" && <><Clock size={14} /> En attente ({sectionReviews.length})</>}
                      {section === "approuve" && <><CheckCircle size={14} /> Approuvés ({sectionReviews.length})</>}
                      {section === "rejete" && <><XCircle size={14} /> Rejetés ({sectionReviews.length})</>}
                    </h3>
                    <div className="space-y-3">
                      {sectionReviews.map(review => (
                        <div key={review.id} className="p-5 bg-white border border-green-200 rounded-2xl">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-gray-900 font-bold text-sm">{review.userName}</span>
                                <span className="text-gray-700 text-xs font-semibold">·</span>
                                <span className="text-xs text-gray-800 capitalize">{review.productType}</span>
                                <span className="text-gray-700 text-xs font-semibold">·</span>
                                <span className="text-xs text-gray-800">{new Date(review.createdAt).toLocaleDateString("fr-FR")}</span>
                              </div>
                              <div className="flex gap-0.5 mb-2">
                                {[...Array(5)].map((_, j) => (
                                  <Star key={j} size={12} className={j < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-900"} />
                                ))}
                              </div>
                              <p className="text-gray-800 text-sm leading-relaxed">{review.text}</p>
                              <p className="text-gray-700 text-xs font-semibold mt-1">Produit : <span className="text-gray-700">{review.productId}</span></p>
                            </div>
                            <div className="flex flex-col gap-2 flex-shrink-0">
                              {review.statut !== "approuve" && (
                                <button
                                  onClick={async () => {
                                    await fetch("/api/admin/reviews", { method: "PATCH", headers: { "Content-Type": "application/json", "x-admin-password": adminSession.password }, body: JSON.stringify({ id: review.id, statut: "approuve" }) });
                                    setAdminReviews(prev => prev.map(r => r.id === review.id ? { ...r, statut: "approuve" } : r));
                                  }}
                                  className="flex items-center gap-1.5 px-3 py-2 bg-black border border-gray-600 text-emerald-400 text-xs font-bold rounded-xl hover:bg-emerald-900/50 transition-colors"
                                >
                                  <ThumbsUp size={12} /> Approuver
                                </button>
                              )}
                              {review.statut !== "rejete" && (
                                <button
                                  onClick={async () => {
                                    await fetch("/api/admin/reviews", { method: "PATCH", headers: { "Content-Type": "application/json", "x-admin-password": adminSession.password }, body: JSON.stringify({ id: review.id, statut: "rejete" }) });
                                    setAdminReviews(prev => prev.map(r => r.id === review.id ? { ...r, statut: "rejete" } : r));
                                  }}
                                  className="flex items-center gap-1.5 px-3 py-2 bg-red-900/30 border border-red-700/40 text-red-400 text-xs font-bold rounded-xl hover:bg-red-900/50 transition-colors"
                                >
                                  <ThumbsDown size={12} /> Rejeter
                                </button>
                              )}
                              <button
                                onClick={async () => {
                                  if (!confirm("Supprimer définitivement cet avis ?")) return;
                                  await fetch("/api/admin/reviews", { method: "DELETE", headers: { "Content-Type": "application/json", "x-admin-password": adminSession.password }, body: JSON.stringify({ id: review.id }) });
                                  setAdminReviews(prev => prev.filter(r => r.id !== review.id));
                                }}
                                className="flex items-center gap-1.5 px-3 py-2 bg-white border border-green-200 text-gray-700 text-xs font-semibold rounded-xl hover:text-red-400 hover:border-red-700/40 transition-colors"
                              >
                                <Trash2 size={12} /> Supprimer
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══ ONGLET PARCOURS CLIENT ══ */}
      {onglet === "parcours" && allowedTabs.includes("parcours") && (
        <WorkflowConfigPanel adminPassword={adminSession.password} />
      )}

      {/* ══ ONGLET MOTIVATIONS CLIENTS ══ */}
      {onglet === "motivations" && allowedTabs.includes("motivations") && (
        <MotivationsPanel adminPassword={adminSession.password} onUnreadCountChange={setUnreadMotivationsCount} />
      )}

      {/* ══ ONGLET TÉMOIGNAGES ══ */}
      {onglet === "temoignages" && allowedTabs.includes("temoignages") && (
        <TemoignagesPanel adminPassword={adminSession.password} />
      )}

      {/* ══ ONGLET STAFF ══ */}
      {onglet === "staff" && allowedTabs.includes("staff") && (
        <GestionStaff adminPassword={adminSession.password} />
      )}

      {onglet === "about" && allowedTabs.includes("about") && (
        <AboutConfigPanel adminPassword={adminSession.password} />
      )}

      {/* Modal détail demande accompagnement */}
      {selectedServerDemande && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={(e) => { if (e.target === e.currentTarget) setSelectedServerDemande(null); }}>
          <div className="bg-white border border-gray-200 rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-gray-900 font-bold text-xl">{selectedServerDemande.espaceTitre}</h2>
                <p className="text-gray-700 text-xs font-semibold mt-1">{new Date(selectedServerDemande.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
              </div>
              <button onClick={() => setSelectedServerDemande(null)} className="text-gray-800 hover:text-white text-2xl leading-none">×</button>
            </div>
            <div className="p-6 space-y-5">
              <div className="p-5 bg-white border border-green-200 rounded-xl">
                <h3 className="text-gray-900 font-bold mb-4 flex items-center gap-2"><Users size={16} className="text-green-600" />Candidat</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {([["Nom", selectedServerDemande.client.nom], ["Email", selectedServerDemande.client.email], ["Téléphone", selectedServerDemande.client.telephone || "—"], ["Ville", selectedServerDemande.client.ville || "—"], ["Profession", selectedServerDemande.client.profession || "—"], ["Capital", selectedServerDemande.client.capital || "—"]] as [string, string][]).map(([l, v]) => (
                    <div key={l}><p className="text-gray-700 text-xs font-semibold">{l}</p><p className="text-gray-900 font-bold">{v}</p></div>
                  ))}
                </div>
              </div>
              {selectedServerDemande.client.motivation && (
                <div className="p-4 bg-white border border-green-100 rounded-xl">
                  <p className="text-gray-700 text-xs font-semibold mb-2">Motivation</p>
                  <p className="text-gray-800 text-sm leading-relaxed">{selectedServerDemande.client.motivation}</p>
                </div>
              )}
              <div className="p-4 bg-white border border-green-100 rounded-xl">
                <p className="text-gray-700 text-xs font-semibold mb-2">Message</p>
                <p className="text-gray-800 text-sm leading-relaxed">{selectedServerDemande.message}</p>
              </div>
              <div className="flex items-center gap-3"><span className="text-gray-800 text-sm font-semibold">Statut :</span><StatutBadge statut={selectedServerDemande.statut} /></div>
              {selectedServerDemande.noteAdmin && (
                <div className="p-4 bg-white border border-green-100 rounded-xl">
                  <p className="text-gray-700 text-xs font-semibold mb-2">Note admin</p>
                  <p className="text-gray-800 text-sm">{selectedServerDemande.noteAdmin}</p>
                </div>
              )}
              {selectedServerDemande.statut === "en_attente" && (
                <div className="flex gap-3">
                  <button onClick={() => { validerDemandeServeur(selectedServerDemande.id, "Votre dossier a été validé. Notre équipe vous contactera sous 48h."); setSelectedServerDemande(null); }} className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-gray-900 font-bold rounded-xl flex items-center justify-center gap-2"><CheckCircle size={16} /> Valider</button>
                  <button onClick={() => { rejeterDemandeServeur(selectedServerDemande.id, "Votre dossier a été examiné mais ne correspond pas aux critères actuels."); setSelectedServerDemande(null); }} className="flex-1 py-3 bg-red-700 hover:bg-red-600 text-gray-900 font-bold rounded-xl flex items-center justify-center gap-2"><XCircle size={16} /> Rejeter</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal détail candidature consultant */}
      {selectedCandidatureConsultant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={(e) => { if (e.target === e.currentTarget) setSelectedCandidatureConsultant(null); }}>
          <div className="bg-white border border-gray-200 rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-gray-900 font-bold text-xl">{selectedCandidatureConsultant.prenom} {selectedCandidatureConsultant.nom}</h2>
                <p className="text-gray-700 text-xs font-semibold mt-1">{new Date(selectedCandidatureConsultant.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</p>
              </div>
              <button onClick={() => setSelectedCandidatureConsultant(null)} className="text-gray-800 hover:text-white text-2xl leading-none">×</button>
            </div>
            <div className="p-6 space-y-5">
              <div className="p-5 bg-white border border-green-200 rounded-xl">
                <h3 className="text-gray-900 font-bold mb-4 flex items-center gap-2"><UserIcon size={16} className="text-green-600" />Profil</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {([["Email", selectedCandidatureConsultant.email], ["Téléphone", selectedCandidatureConsultant.telephone], ["Ville", selectedCandidatureConsultant.ville], ["Expérience", selectedCandidatureConsultant.anneesExperience]] as [string, string][]).map(([l, v]) => (
                    <div key={l}><p className="text-gray-700 text-xs font-semibold">{l}</p><p className="text-gray-900 font-bold">{v}</p></div>
                  ))}
                </div>
              </div>
              {selectedCandidatureConsultant.portfolioUrl && (
                <div className="p-4 bg-white border border-green-100 rounded-xl">
                  <p className="text-gray-700 text-xs font-semibold mb-2">Portfolio / LinkedIn</p>
                  <a href={selectedCandidatureConsultant.portfolioUrl} target="_blank" rel="noopener noreferrer" className="text-green-600 text-sm underline break-all">{selectedCandidatureConsultant.portfolioUrl}</a>
                </div>
              )}
              <div className="p-4 bg-white border border-green-100 rounded-xl">
                <p className="text-gray-700 text-xs font-semibold mb-2">Motivation</p>
                <p className="text-gray-800 text-sm leading-relaxed">{selectedCandidatureConsultant.motivation}</p>
              </div>
              <div className="flex items-center gap-3"><span className="text-gray-800 text-sm font-semibold">Statut :</span><StatutBadge statut={selectedCandidatureConsultant.statut} /></div>
              {selectedCandidatureConsultant.statut === "en_attente" && (
                <div className="flex gap-3">
                  <button onClick={() => { validerCandidatureServeur(selectedCandidatureConsultant.id, "Votre candidature a été validée. Bienvenue dans l'équipe !"); setSelectedCandidatureConsultant(null); }} className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-gray-900 font-bold rounded-xl flex items-center justify-center gap-2"><CheckCircle size={16} /> Valider</button>
                  <button onClick={() => { rejeterCandidatureServeur(selectedCandidatureConsultant.id, "Votre candidature a été examinée mais ne correspond pas aux critères actuels."); setSelectedCandidatureConsultant(null); }} className="flex-1 py-3 bg-red-700 hover:bg-red-600 text-gray-900 font-bold rounded-xl flex items-center justify-center gap-2"><XCircle size={16} /> Rejeter</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
    </AdminPasswordContext.Provider>
  );
}

// ─── Composant Gestion Staff ──────────────────────────────────────────────────

type StaffForm = { nom: string; username: string; password: string; role: AdminRole };
const STAFF_VIDE: StaffForm = { nom: "", username: "", password: "", role: "admin_manager" };

function GestionStaff({ adminPassword }: { adminPassword: string }) {
  const [accounts, setAccounts] = useState<{ id: string; username: string; nom: string; role: AdminRole; actif: boolean; createdAt: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<StaffForm>(STAFF_VIDE);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const set = (k: keyof StaffForm, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function fetchAccounts() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/admins", { headers: { "x-admin-password": adminPassword } });
      const data = await res.json();
      if (res.ok) setAccounts(data.admins ?? []);
    } catch { /* silencieux */ }
    setLoading(false);
  }

  useEffect(() => { fetchAccounts(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function creerCompte(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!form.nom.trim() || !form.username.trim() || !form.password.trim()) {
      setError("Tous les champs sont obligatoires."); return;
    }
    if (form.password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères."); return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-password": adminPassword },
        body: JSON.stringify({ nom: form.nom.trim(), username: form.username.trim(), password: form.password, role: form.role }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(`Compte "${form.nom}" créé avec succès !`);
        setForm(STAFF_VIDE);
        setShowForm(false);
        fetchAccounts();
      } else {
        setError(data.error || "Erreur lors de la création.");
      }
    } catch { setError("Erreur réseau."); }
    setSaving(false);
  }

  async function toggleActif(id: string, actif: boolean) {
    await fetch("/api/admin/admins", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-password": adminPassword },
      body: JSON.stringify({ id, actif: !actif }),
    });
    fetchAccounts();
  }

  async function supprimerCompte(id: string) {
    await fetch(`/api/admin/admins?id=${id}`, {
      method: "DELETE",
      headers: { "x-admin-password": adminPassword },
    });
    setConfirmDelete(null);
    fetchAccounts();
  }

  const inputCls = "w-full px-4 py-3 bg-white border border-green-200 rounded-xl text-gray-900 font-semibold placeholder-gray-400 focus:outline-none focus:border-green-500 transition-colors text-sm";
  const labelCls = "block text-gray-900 font-bold text-sm mb-2";
  const selectCls = "w-full px-4 py-3 bg-white border border-green-200 rounded-xl text-gray-900 font-semibold focus:outline-none focus:border-green-500 transition-colors text-sm";

  return (
    <div>
      {/* Intro */}
      <div className="mb-6 p-5 bg-white border border-green-200 rounded-2xl">
        <h2 className="text-gray-900 font-bold text-lg flex items-center gap-2 mb-1">
          <ShieldCheck size={18} className="text-green-600" /> Gestion des comptes staff
        </h2>
        <p className="text-gray-800 text-sm font-semibold">Créez des comptes pour vos collaborateurs avec des niveaux d&apos;accès définis. Seul le Super Administrateur peut gérer ces comptes.</p>
      </div>

      {/* Rôles disponibles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        {(Object.entries(ROLE_CONFIG) as [AdminRole, typeof ROLE_CONFIG[AdminRole]][]).filter(([r]) => r !== "super_admin").map(([role, cfg]) => (
          <div key={role} className="p-4 bg-white border border-green-100 rounded-xl">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${cfg.color === "text-blue-400" ? "bg-blue-900/20 border-blue-700/40 text-blue-400" : cfg.color === "text-green-400" ? "bg-green-900/20 border-green-700/40 text-green-400" : "bg-emerald-900/20 border-emerald-700/40 text-emerald-400"}`}>{cfg.label}</span>
            </div>
            <p className="text-gray-700 text-xs font-semibold">{cfg.description}</p>
            <div className="flex flex-wrap gap-1 mt-2">
              {cfg.tabs.map((t) => (
                <span key={t} className="text-xs px-2 py-0.5 bg-white text-gray-800 rounded-full">{t}</span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Bouton créer */}
      {!showForm && (
        <button onClick={() => { setShowForm(true); setError(""); setSuccess(""); }}
          className="w-full mb-6 py-4 border-2 border-dashed border-green-300 hover:border-green-500 hover:bg-green-50 text-green-600 rounded-2xl flex items-center justify-center gap-2 font-bold transition-all">
          <Plus size={20} /> Créer un nouveau compte staff
        </button>
      )}

      {/* Formulaire création */}
      {showForm && (
        <div className="mb-6 p-6 bg-white border border-green-200 rounded-2xl space-y-5">
          <h3 className="text-gray-900 font-bold text-lg flex items-center gap-2"><KeyRound size={16} className="text-green-600" /> Nouveau compte</h3>
          <form onSubmit={creerCompte} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Nom complet <span className="text-green-600">*</span></label>
                <input type="text" value={form.nom} onChange={(e) => set("nom", e.target.value)} className={inputCls} placeholder="Ex: Jean Dupont" autoFocus />
              </div>
              <div>
                <label className={labelCls}>Nom d&apos;utilisateur <span className="text-green-600">*</span></label>
                <input type="text" value={form.username} onChange={(e) => set("username", e.target.value.toLowerCase().replace(/\s/g, ""))} className={inputCls} placeholder="Ex: jeandupont" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Mot de passe <span className="text-green-600">*</span></label>
                <input type="password" value={form.password} onChange={(e) => set("password", e.target.value)} className={inputCls} placeholder="Min. 8 caractères" />
              </div>
              <div>
                <label className={labelCls}>Rôle / Niveau d&apos;accès <span className="text-green-600">*</span></label>
                <select value={form.role} onChange={(e) => set("role", e.target.value)} className={selectCls}>
                  {(Object.entries(ROLE_CONFIG) as [AdminRole, typeof ROLE_CONFIG[AdminRole]][]).filter(([r]) => r !== "super_admin").map(([role, cfg]) => (
                    <option key={role} value={role} className="bg-white">{cfg.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description du rôle sélectionné */}
            {form.role && (
              <div className="p-3 bg-white rounded-xl text-xs text-gray-700">
                <strong className="text-gray-900">{ROLE_CONFIG[form.role as AdminRole]?.label} :</strong> {ROLE_CONFIG[form.role as AdminRole]?.description}
                <div className="mt-1.5 flex flex-wrap gap-1">
                  <span className="text-gray-800">Accès aux onglets :</span>
                  {ROLE_CONFIG[form.role as AdminRole]?.tabs.map((t) => (
                    <span key={t} className="px-1.5 py-0.5 bg-white text-green-600 rounded">{t}</span>
                  ))}
                </div>
              </div>
            )}

            {error && <p className="text-red-400 text-xs">{error}</p>}
            {success && <p className="text-emerald-400 text-xs flex items-center gap-1"><CheckCircle size={12} /> {success}</p>}

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-[#27A827] text-black font-bold rounded-xl text-sm disabled:opacity-60">
                {saving ? <><span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Création...</> : <><Save size={15} /> Créer le compte</>}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setError(""); setForm(STAFF_VIDE); }}
                className="flex items-center gap-2 px-6 py-3 border border-gray-200 text-gray-700 rounded-xl text-sm hover:bg-green-50">
                <X size={15} /> Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {success && !showForm && (
        <div className="mb-4 p-3 bg-emerald-900/20 border border-emerald-700/30 rounded-xl flex items-center gap-2 text-emerald-400 text-sm">
          <CheckCircle size={14} /> {success}
        </div>
      )}

      {/* Liste des comptes */}
      {loading ? (
        <div className="text-center py-10 text-gray-800 text-sm font-semibold"><Loader2 size={16} className="animate-spin inline mr-2" />Chargement...</div>
      ) : accounts.length === 0 ? (
        <div className="text-center py-16 bg-white border border-green-100 rounded-2xl">
          <div className="text-5xl mb-3">👥</div>
          <h3 className="text-gray-900 font-bold mb-2">Aucun compte staff</h3>
          <p className="text-gray-800 text-sm font-semibold">Créez le premier compte collaborateur ci-dessus.</p>
        </div>
      ) : (
        <div>
          <h3 className="text-gray-900 font-bold mb-3 flex items-center gap-2"><Users size={16} className="text-green-600" />Comptes existants ({accounts.length})</h3>
          <div className="space-y-3">
            {accounts.map((a) => {
              const roleCfg = ROLE_CONFIG[a.role];
              const roleColorMap: Record<string, string> = {
                "text-yellow-400": "bg-yellow-900/20 border-yellow-700/40 text-yellow-400",
                "text-blue-400": "bg-blue-900/20 border-blue-700/40 text-blue-400",
                "text-green-400": "bg-green-900/20 border-green-700/40 text-green-400",
                "text-emerald-400": "bg-emerald-900/20 border-emerald-700/40 text-emerald-400",
              };
              return (
                <div key={a.id} className={`p-5 rounded-2xl border transition-all ${a.actif ? "bg-white border-green-200" : "bg-white/[0.01] border-gray-100 opacity-60"}`}>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#E8B800]/20 to-blue-900/20 border border-gray-200 flex items-center justify-center text-white font-black text-xl flex-shrink-0">
                        {a.nom.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="text-gray-900 font-bold">{a.nom}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${roleColorMap[roleCfg?.color ?? "text-blue-400"] ?? "bg-white border-green-200 text-gray-800"}`}>
                            {roleCfg?.label ?? a.role}
                          </span>
                          {!a.actif && <span className="text-xs px-2 py-0.5 bg-red-900/30 text-red-400 rounded-full border border-red-700/30">Désactivé</span>}
                        </div>
                        <div className="flex flex-wrap gap-x-4 text-xs text-gray-800">
                          <span className="flex items-center gap-1"><UserIcon size={10} /> @{a.username}</span>
                          <span>{new Date(a.createdAt).toLocaleDateString("fr-FR")}</span>
                          {roleCfg && <span className="text-gray-800">{roleCfg.description}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => toggleActif(a.id, a.actif)} className={`p-2 rounded-lg ${a.actif ? "text-emerald-400 hover:bg-emerald-900/30" : "text-gray-800 hover:bg-green-50"}`}>
                        {a.actif ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                      </button>
                      {confirmDelete === a.id ? (
                        <div className="flex gap-1">
                          <button onClick={() => supprimerCompte(a.id)} className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-lg">Oui</button>
                          <button onClick={() => setConfirmDelete(null)} className="px-3 py-1 border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg">Non</button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmDelete(a.id)} className="p-2 text-gray-800 hover:text-red-400 hover:bg-red-900/20 rounded-lg"><Trash2 size={16} /></button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
