"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft, Plus, Pencil, Trash2, Save, X, Gift,
  FileText, Play, Users, CheckCircle, AlertCircle, Loader2,
  ToggleLeft, ToggleRight, Download, ExternalLink, Upload, Image as ImageIcon,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

type CommunityType = "whatsapp" | "telegram" | "zoom" | "autre";

type Ressource = {
  id: string;
  slug: string;
  titre: string;
  description: string;
  imageUrl?: string;
  actif: boolean;
  hasPdf: boolean;
  pdfUrl?: string;
  pdfNom?: string;
  hasVideo: boolean;
  videoUrl?: string;
  videoTitre?: string;
  hasCommunity: boolean;
  communityUrl?: string;
  communityLabel?: string;
  communityType?: CommunityType;
  createdAt: string;
  updatedAt: string;
};

type Lead = {
  id: string;
  ressourceId: string;
  ressourceTitre: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  createdAt: string;
};

// ── Styles ─────────────────────────────────────────────────────────────────────

const inputCls =
  "w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:border-[#E8B800] focus:bg-white transition-colors placeholder-gray-400";

const EMPTY_FORM = {
  titre: "",
  description: "",
  imageUrl: "",
  actif: true,
  hasPdf: false,
  pdfUrl: "",
  pdfNom: "",
  hasVideo: false,
  videoUrl: "",
  videoTitre: "",
  hasCommunity: false,
  communityUrl: "",
  communityLabel: "",
  communityType: "autre" as CommunityType,
};

function detectCommunityType(url: string): CommunityType {
  if (url.includes("whatsapp")) return "whatsapp";
  if (url.includes("t.me") || url.includes("telegram")) return "telegram";
  if (url.includes("zoom.us") || url.includes("zoom.com")) return "zoom";
  return "autre";
}

const COMMUNITY_ICONS: Record<CommunityType, string> = {
  whatsapp: "💬",
  telegram: "✈️",
  zoom: "📹",
  autre: "🔗",
};

// ── Auth gate ──────────────────────────────────────────────────────────────────

export default function RessourcesGratuitesAdminPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState("");

  function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    if (password === (process.env.NEXT_PUBLIC_ADMIN_PASSWORD || (process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? ""))) {
      setAuthed(true);
    } else {
      setAuthError("Mot de passe incorrect.");
    }
  }

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-sm p-8 bg-white border border-gray-200 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <Gift size={24} className="text-[#E8B800]" />
            <h1 className="text-xl font-bold text-gray-900">Admin — Ressources Gratuites</h1>
          </div>
          <form onSubmit={handleAuth} className="space-y-4">
            <input
              type="password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputCls} placeholder="Mot de passe admin" autoFocus
            />
            {authError && <p className="text-red-500 text-xs">{authError}</p>}
            <button type="submit"
              className="w-full py-3 bg-[#E8B800] hover:bg-[#27A827] text-black font-bold rounded-xl text-sm transition-colors">
              Accéder
            </button>
          </form>
          <div className="mt-4 text-center">
            <Link href="/admin" className="text-gray-500 text-xs hover:text-gray-700">← Retour admin</Link>
          </div>
        </div>
      </div>
    );
  }

  return <RessourcesAdmin password={password} />;
}

// ── Composant principal ────────────────────────────────────────────────────────

function RessourcesAdmin({ password }: { password: string }) {
  const [ressources, setRessources] = useState<Ressource[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [activeTab, setActiveTab] = useState<"ressources" | "leads">("ressources");
  const [filterRessource, setFilterRessource] = useState("");
  const [uploadingImg, setUploadingImg] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const imgRef = useRef<HTMLInputElement>(null);
  const pdfRef = useRef<HTMLInputElement>(null);

  const pw = `?password=${encodeURIComponent(password)}`;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [r1, r2] = await Promise.all([
        fetch(`/api/admin/ressources-gratuites${pw}`).then((r) => r.json()),
        fetch(`/api/admin/leads${pw}`).then((r) => r.json()),
      ]);
      setRessources(r1.ressources ?? []);
      setLeads(r2.leads ?? []);
    } catch { setError("Erreur de chargement."); }
    setLoading(false);
  }, [pw]);

  useEffect(() => { load(); }, [load]);

  function flash(msg: string, isError = false) {
    if (isError) setError(msg); else setSuccess(msg);
    setTimeout(() => { setError(""); setSuccess(""); }, 3000);
  }

  function openCreate() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setShowForm(true);
  }

  function openEdit(r: Ressource) {
    setEditingId(r.id);
    setForm({
      titre: r.titre,
      description: r.description,
      imageUrl: r.imageUrl || "",
      actif: r.actif,
      hasPdf: r.hasPdf,
      pdfUrl: r.pdfUrl || "",
      pdfNom: r.pdfNom || "",
      hasVideo: r.hasVideo,
      videoUrl: r.videoUrl || "",
      videoTitre: r.videoTitre || "",
      hasCommunity: r.hasCommunity,
      communityUrl: r.communityUrl || "",
      communityLabel: r.communityLabel || "",
      communityType: r.communityType || "autre",
    });
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.titre.trim()) { flash("Le titre est requis.", true); return; }
    if (!form.hasPdf && !form.hasVideo && !form.hasCommunity) {
      flash("Activez au moins un type de contenu (PDF, Vidéo ou Communauté).", true); return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        ...(editingId ? { id: editingId } : {}),
        communityType: form.hasCommunity
          ? (form.communityType || detectCommunityType(form.communityUrl))
          : undefined,
      };
      const res = await fetch(
        `/api/admin/ressources-gratuites${pw}`,
        { method: editingId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }
      );
      const data = await res.json();
      if (!res.ok) { flash(data.error || "Erreur.", true); return; }
      flash(editingId ? "Ressource modifiée." : "Ressource créée.");
      setShowForm(false);
      load();
    } catch { flash("Erreur réseau.", true); }
    setSaving(false);
  }

  async function toggleActif(r: Ressource) {
    await fetch(`/api/admin/ressources-gratuites${pw}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: r.id, actif: !r.actif }),
    });
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette ressource ?")) return;
    await fetch(`/api/admin/ressources-gratuites${pw}&id=${id}`, { method: "DELETE" });
    flash("Ressource supprimée.");
    load();
  }

  async function uploadFile(
    file: File,
    setUploading: (v: boolean) => void,
    onDone: (url: string) => void,
  ) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/admin/upload`, {
        method: "POST", body: fd,
        headers: { "x-admin-password": password },
      });
      const data = await res.json();
      if (data.url) onDone(data.url);
      else flash("Erreur d'upload.", true);
    } catch { flash("Erreur d'upload.", true); }
    setUploading(false);
  }

  function exportCsv() {
    const filtered = filterRessource ? leads.filter((l) => l.ressourceId === filterRessource) : leads;
    const url = `/api/admin/leads${pw}&export=csv${filterRessource ? `&ressourceId=${filterRessource}` : ""}`;
    window.open(url, "_blank");
  }

  const filteredLeads = filterRessource ? leads.filter((l) => l.ressourceId === filterRessource) : leads;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-gray-400 hover:text-gray-600 text-sm flex items-center gap-1.5">
              <ArrowLeft size={15} /> Admin
            </Link>
            <span className="text-gray-300">/</span>
            <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Gift size={18} className="text-[#E8B800]" /> Ressources Gratuites
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <a href="/ressources-gratuites" target="_blank"
              className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl text-xs font-medium">
              <ExternalLink size={13} /> Voir page
            </a>
            <button onClick={openCreate}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#E8B800] hover:bg-[#27A827] text-black font-bold rounded-xl text-sm transition-colors">
              <Plus size={15} /> Nouvelle ressource
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Alerts */}
        {success && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm mb-4">
            <CheckCircle size={15} /> {success}
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm mb-4">
            <AlertCircle size={15} /> {error}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-white border border-gray-200 rounded-2xl mb-6 w-fit">
          {(["ressources", "leads"] as const).map((t) => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`px-5 py-2 rounded-xl text-sm font-medium transition-all capitalize ${activeTab === t ? "bg-[#E8B800] text-black shadow-sm" : "text-gray-600 hover:bg-gray-50"}`}>
              {t === "ressources" ? `Ressources (${ressources.length})` : `Leads (${leads.length})`}
            </button>
          ))}
        </div>

        {/* ── Onglet Ressources ── */}
        {activeTab === "ressources" && (
          <>
            {loading ? (
              <div className="flex justify-center py-16">
                <Loader2 size={28} className="animate-spin text-gray-400" />
              </div>
            ) : ressources.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <Gift size={40} className="mx-auto mb-3 opacity-30" />
                <p className="font-medium">Aucune ressource gratuite.</p>
                <button onClick={openCreate}
                  className="mt-4 px-5 py-2.5 bg-[#E8B800] text-black font-bold rounded-xl text-sm">
                  Créer la première
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {ressources.map((r) => (
                  <RessourceRow
                    key={r.id} r={r}
                    leadsCount={leads.filter((l) => l.ressourceId === r.id).length}
                    onEdit={() => openEdit(r)}
                    onToggle={() => toggleActif(r)}
                    onDelete={() => handleDelete(r.id)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Onglet Leads ── */}
        {activeTab === "leads" && (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <select value={filterRessource} onChange={(e) => setFilterRessource(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-700 bg-gray-50 focus:outline-none focus:border-[#E8B800]">
                  <option value="">Toutes les ressources</option>
                  {ressources.map((r) => (
                    <option key={r.id} value={r.id}>{r.titre}</option>
                  ))}
                </select>
                <span className="text-sm text-gray-500">{filteredLeads.length} contact{filteredLeads.length > 1 ? "s" : ""}</span>
              </div>
              <button onClick={exportCsv}
                className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-sm transition-colors">
                <Download size={14} /> Exporter CSV
              </button>
            </div>
            {filteredLeads.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Users size={32} className="mx-auto mb-2 opacity-30" />
                <p>Aucun lead pour le moment.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-400 border-b border-gray-100 bg-gray-50">
                      <th className="text-left px-4 py-3">Contact</th>
                      <th className="text-left px-4 py-3">Email</th>
                      <th className="text-left px-4 py-3">Téléphone</th>
                      <th className="text-left px-4 py-3">Ressource</th>
                      <th className="text-left px-4 py-3">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeads.slice().reverse().map((l) => (
                      <tr key={l.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-900">{l.prenom} {l.nom}</td>
                        <td className="px-4 py-3 text-gray-600">{l.email}</td>
                        <td className="px-4 py-3 text-gray-600">{l.telephone}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-full text-xs font-medium">
                            {l.ressourceTitre}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                          {new Date(l.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Formulaire modal ── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-6">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <Gift size={18} className="text-[#E8B800]" />
                {editingId ? "Modifier la ressource" : "Nouvelle ressource gratuite"}
              </h2>
              <button onClick={() => setShowForm(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-5">
              {/* Infos de base */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Informations générales</h3>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Titre *</label>
                  <input value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })}
                    className={inputCls} placeholder="Ex : Guide Gratuit — Lancer son Entreprise" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Description courte</label>
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={2} className={`${inputCls} resize-none`}
                    placeholder="Décrivez brièvement ce que vous offrez..." />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Image de couverture (URL)</label>
                  <div className="flex gap-2">
                    <input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                      className={inputCls} placeholder="https://..." />
                    <input ref={imgRef} type="file" accept="image/*" className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) uploadFile(f, setUploadingImg, (url) => setForm((prev) => ({ ...prev, imageUrl: url })));
                      }} />
                    <button type="button" onClick={() => imgRef.current?.click()}
                      disabled={uploadingImg}
                      className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl text-xs whitespace-nowrap">
                      {uploadingImg ? <Loader2 size={13} className="animate-spin" /> : <ImageIcon size={13} />}
                      Upload
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setForm({ ...form, actif: !form.actif })}>
                    {form.actif
                      ? <ToggleRight size={24} className="text-green-500" />
                      : <ToggleLeft size={24} className="text-gray-400" />}
                  </button>
                  <span className="text-sm text-gray-700">{form.actif ? "Ressource active (visible)" : "Ressource inactive (masquée)"}</span>
                </div>
              </div>

              {/* Contenus */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Contenus accessibles</h3>

                {/* PDF */}
                <div className={`border rounded-xl p-4 transition-colors ${form.hasPdf ? "border-blue-200 bg-blue-50/50" : "border-gray-200"}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <input type="checkbox" id="hasPdf" checked={form.hasPdf}
                      onChange={(e) => setForm({ ...form, hasPdf: e.target.checked })}
                      className="w-4 h-4 accent-blue-600" />
                    <label htmlFor="hasPdf" className="flex items-center gap-2 text-sm font-semibold text-gray-800 cursor-pointer">
                      <FileText size={15} className="text-blue-600" /> Téléchargement PDF / Fichier
                    </label>
                  </div>
                  {form.hasPdf && (
                    <div className="space-y-2 pl-7">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">URL du fichier</label>
                        <div className="flex gap-2">
                          <input value={form.pdfUrl} onChange={(e) => setForm({ ...form, pdfUrl: e.target.value })}
                            className={inputCls} placeholder="https://... ou /uploads/mon-fichier.pdf" />
                          <input ref={pdfRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.zip" className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) uploadFile(f, setUploadingPdf, (url) => {
                                setForm((prev) => ({ ...prev, pdfUrl: url, pdfNom: prev.pdfNom || f.name }));
                              });
                            }} />
                          <button type="button" onClick={() => pdfRef.current?.click()}
                            disabled={uploadingPdf}
                            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl text-xs whitespace-nowrap bg-white">
                            {uploadingPdf ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                            Upload
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Nom du fichier affiché</label>
                        <input value={form.pdfNom} onChange={(e) => setForm({ ...form, pdfNom: e.target.value })}
                          className={inputCls} placeholder="Ex : Guide-Complet-Entreprise.pdf" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Vidéo */}
                <div className={`border rounded-xl p-4 transition-colors ${form.hasVideo ? "border-purple-200 bg-purple-50/50" : "border-gray-200"}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <input type="checkbox" id="hasVideo" checked={form.hasVideo}
                      onChange={(e) => setForm({ ...form, hasVideo: e.target.checked })}
                      className="w-4 h-4 accent-purple-600" />
                    <label htmlFor="hasVideo" className="flex items-center gap-2 text-sm font-semibold text-gray-800 cursor-pointer">
                      <Play size={15} className="text-purple-600" /> Vidéo / Formation gratuite
                    </label>
                  </div>
                  {form.hasVideo && (
                    <div className="space-y-2 pl-7">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">URL de la vidéo (YouTube, Vimeo, lien direct)</label>
                        <input value={form.videoUrl} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                          className={inputCls} placeholder="https://youtube.com/watch?v=... ou https://..." />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Titre de la vidéo</label>
                        <input value={form.videoTitre} onChange={(e) => setForm({ ...form, videoTitre: e.target.value })}
                          className={inputCls} placeholder="Ex : Introduction à l'entrepreneuriat" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Communauté / Live */}
                <div className={`border rounded-xl p-4 transition-colors ${form.hasCommunity ? "border-green-200 bg-green-50/50" : "border-gray-200"}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <input type="checkbox" id="hasCommunity" checked={form.hasCommunity}
                      onChange={(e) => setForm({ ...form, hasCommunity: e.target.checked })}
                      className="w-4 h-4 accent-green-600" />
                    <label htmlFor="hasCommunity" className="flex items-center gap-2 text-sm font-semibold text-gray-800 cursor-pointer">
                      <Users size={15} className="text-green-600" /> Lien Communauté / Live / Événement
                    </label>
                  </div>
                  {form.hasCommunity && (
                    <div className="space-y-2 pl-7">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Lien (WhatsApp, Telegram, Zoom…)</label>
                        <input value={form.communityUrl}
                          onChange={(e) => {
                            const url = e.target.value;
                            setForm({ ...form, communityUrl: url, communityType: detectCommunityType(url) });
                          }}
                          className={inputCls} placeholder="https://chat.whatsapp.com/... ou https://t.me/..." />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Label du bouton</label>
                        <input value={form.communityLabel} onChange={(e) => setForm({ ...form, communityLabel: e.target.value })}
                          className={inputCls} placeholder="Ex : Rejoindre le groupe WhatsApp" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Type</label>
                        <select value={form.communityType}
                          onChange={(e) => setForm({ ...form, communityType: e.target.value as CommunityType })}
                          className={inputCls}>
                          <option value="whatsapp">💬 WhatsApp</option>
                          <option value="telegram">✈️ Telegram</option>
                          <option value="zoom">📹 Zoom</option>
                          <option value="autre">🔗 Autre</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-5 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm hover:bg-gray-50">
                  Annuler
                </button>
                <button type="submit" disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#E8B800] hover:bg-[#27A827] text-black font-bold rounded-xl text-sm transition-colors disabled:opacity-50">
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  {editingId ? "Enregistrer" : "Créer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Ligne ressource ────────────────────────────────────────────────────────────

function RessourceRow({
  r, leadsCount, onEdit, onToggle, onDelete,
}: {
  r: Ressource; leadsCount: number;
  onEdit: () => void; onToggle: () => void; onDelete: () => void;
}) {
  const COMMUNITY_ICONS: Record<string, string> = {
    whatsapp: "💬", telegram: "✈️", zoom: "📹", autre: "🔗",
  };

  return (
    <div className={`bg-white border rounded-2xl shadow-sm p-4 flex items-start gap-4 transition-all ${r.actif ? "border-gray-200" : "border-gray-100 opacity-60"}`}>
      {r.imageUrl ? (
        <img src={r.imageUrl} alt={r.titre} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
      ) : (
        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center flex-shrink-0">
          <Gift size={24} className="text-amber-600" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h3 className="font-bold text-gray-900 text-sm">{r.titre}</h3>
            {r.description && <p className="text-gray-500 text-xs mt-0.5 line-clamp-1">{r.description}</p>}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${r.actif ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-gray-50 border-gray-200 text-gray-500"}`}>
              {r.actif ? "Actif" : "Inactif"}
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 border border-blue-200 text-blue-700">
              {leadsCount} lead{leadsCount > 1 ? "s" : ""}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-2 flex-wrap">
          {r.hasPdf && (
            <span className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
              <FileText size={11} /> PDF
            </span>
          )}
          {r.hasVideo && (
            <span className="flex items-center gap-1 text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
              <Play size={11} /> Vidéo
            </span>
          )}
          {r.hasCommunity && (
            <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
              {COMMUNITY_ICONS[r.communityType || "autre"]} {r.communityLabel || "Communauté"}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button onClick={onToggle} title={r.actif ? "Désactiver" : "Activer"}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors">
          {r.actif ? <ToggleRight size={18} className="text-green-500" /> : <ToggleLeft size={18} />}
        </button>
        <button onClick={onEdit}
          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors">
          <Pencil size={15} />
        </button>
        <button onClick={onDelete}
          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors">
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}