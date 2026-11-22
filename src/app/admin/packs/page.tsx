"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft, Plus, Pencil, Trash2, Save, X, Package,
  BookOpen, Play, CheckCircle, AlertCircle, Loader2, Upload, ImageIcon,
  Copy, Check, ExternalLink,
} from "lucide-react";
import { ebooks as staticEbooks } from "@/lib/data";
import { FORMATIONS as staticFormations } from "@/lib/formations-data";

// ── Types ──────────────────────────────────────────────────────────────────────

type PackItem = { type: "ebook" | "formation"; id: string; title: string };
type StatutPack = "actif" | "inactif" | "brouillon";

type Pack = {
  id: string;
  slug?: string;
  nom: string;
  description: string;
  prix: number;
  image?: string;
  videoUrl?: string;
  ordre: number;
  statut: StatutPack;
  items: PackItem[];
  createdAt: string;
  updatedAt: string;
};

const SITE = "https://smartlifecm.com";

type AvailableItem = { id: string; title: string; type: "ebook" | "formation"; prix: number };

// ── Helpers ────────────────────────────────────────────────────────────────────

const inputCls =
  "w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:border-[#E8B800] focus:bg-white transition-colors placeholder-gray-400";

const STATUT_CFG: Record<StatutPack, { label: string; cls: string }> = {
  actif:     { label: "Actif",     cls: "bg-emerald-50 border-emerald-200 text-emerald-700" },
  inactif:   { label: "Inactif",   cls: "bg-red-50 border-red-200 text-red-600" },
  brouillon: { label: "Brouillon", cls: "bg-yellow-50 border-yellow-200 text-yellow-700" },
};

const STATUT_CYCLE: StatutPack[] = ["actif", "inactif", "brouillon"];
const nextStatut = (s: StatutPack): StatutPack =>
  STATUT_CYCLE[(STATUT_CYCLE.indexOf(s) + 1) % STATUT_CYCLE.length];

const EMPTY: {
  nom: string; description: string; prix: string; image: string; videoUrl: string;
  ordre: string; statut: StatutPack; items: PackItem[];
} = {
  nom: "", description: "", prix: "", image: "", videoUrl: "",
  ordre: "", statut: "brouillon", items: [],
};

// ── Auth gate ──────────────────────────────────────────────────────────────────

export default function AdminPacksPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState("");

  function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    if (password === (process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? "")) setAuthed(true);
    else setAuthError("Mot de passe incorrect.");
  }

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-sm p-8 bg-white border border-gray-200 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <Package size={24} className="text-[#E8B800]" />
            <h1 className="text-xl font-bold text-gray-900">Admin — Packs</h1>
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
            <Link href="/admin" className="text-gray-500 text-xs hover:text-gray-700 transition-colors">← Retour admin</Link>
          </div>
        </div>
      </div>
    );
  }

  return <PacksAdmin password={password} />;
}

// ── Dashboard ──────────────────────────────────────────────────────────────────

function PacksAdmin({ password }: { password: string }) {
  const [packs, setPacks]     = useState<Pack[]>([]);
  const [available, setAvailable] = useState<AvailableItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Pack | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm]       = useState(EMPTY);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState("");
  const [searchItems, setSearchItems] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  // ID temporaire pour l'upload avant création (réinitialisé à chaque "Créer")
  const tempUploadId = useRef(`tmp-${Date.now()}`);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [packsRes, ebooksRes, formationsRes] = await Promise.all([
        fetch(`/api/admin/packs?password=${password}`),
        fetch("/api/ebooks"),
        fetch("/api/formations"),
      ]);
      const pd = await packsRes.json();
      const ed = await ebooksRes.json();
      const fd = await formationsRes.json();

      setPacks((pd.packs || []).sort((a: Pack, b: Pack) => a.ordre - b.ordre));

      // Merge static + dynamic ebooks
      const dynEbooks: AvailableItem[] = (ed.ebooks || []).map(
        (e: { id: string; title?: string; price?: number }) => ({
          id: e.id, title: e.title || e.id, type: "ebook" as const, prix: e.price || 0,
        })
      );
      const staticEbookItems: AvailableItem[] = staticEbooks
        .filter((s) => !dynEbooks.some((d) => d.id === s.id))
        .map((s) => ({ id: s.id, title: s.title, type: "ebook" as const, prix: s.price }));

      // Merge static + dynamic formations
      const dynFormations: AvailableItem[] = (fd.formations || []).map(
        (f: { id: string; titre?: string; prix?: number }) => ({
          id: f.id, title: f.titre || f.id, type: "formation" as const, prix: f.prix || 0,
        })
      );
      const staticFormationItems: AvailableItem[] = staticFormations
        .filter((s) => !dynFormations.some((d) => d.id === s.id))
        .map((s) => ({ id: s.id, title: s.titre, type: "formation" as const, prix: s.prix }));

      setAvailable([
        ...staticEbookItems, ...dynEbooks,
        ...staticFormationItems, ...dynFormations,
      ]);
    } catch {
      setError("Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [password]);

  useEffect(() => { load(); }, [load]);

  function startCreate() {
    tempUploadId.current = `tmp-${Date.now()}`;
    setForm({ ...EMPTY, ordre: String(packs.length + 1) });
    setCreating(true);
    setEditing(null);
    setError("");
    setUploadError("");
    setSearchItems("");
  }

  function startEdit(pack: Pack) {
    setForm({
      nom: pack.nom, description: pack.description,
      prix: String(pack.prix), image: pack.image || "", videoUrl: pack.videoUrl || "",
      ordre: String(pack.ordre), statut: pack.statut, items: pack.items,
    });
    setEditing(pack);
    setCreating(false);
    setError("");
    setUploadError("");
    setSearchItems("");
  }

  function cancelForm() {
    setCreating(false);
    setEditing(null);
    setError("");
  }

  function toggleItem(item: AvailableItem) {
    const exists = form.items.some((i) => i.id === item.id);
    setForm((f) => ({
      ...f,
      items: exists
        ? f.items.filter((i) => i.id !== item.id)
        : [...f.items, { type: item.type, id: item.id, title: item.title }],
    }));
  }

  async function handleSave() {
    if (!form.nom.trim()) { setError("Le nom est requis."); return; }
    if (!form.prix || isNaN(Number(form.prix))) { setError("Le prix est requis."); return; }
    if (form.items.length < 3) { setError("Sélectionnez au minimum 3 contenus."); return; }
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...(editing ? { id: editing.id } : {}),
        nom: form.nom.trim(),
        description: form.description.trim(),
        prix: Number(form.prix),
        image: form.image.trim() || "",
        videoUrl: form.videoUrl.trim() || undefined,
        ordre: Number(form.ordre) || 1,
        statut: form.statut,
        items: form.items,
      };
      const res = await fetch(`/api/admin/packs?password=${password}`, {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Erreur serveur");
      setSuccess(editing ? "Pack mis à jour !" : "Pack créé !");
      await load();
      cancelForm();
      setTimeout(() => setSuccess(""), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  async function handleBannerUpload(file: File) {
    const packId = editing ? editing.id : tempUploadId.current;
    setUploading(true);
    setUploadError("");
    try {
      const fd = new globalThis.FormData();
      fd.append("packId", packId);
      fd.append("file", file);
      const res = await fetch(`/api/admin/upload-pack-banner?password=${password}`, {
        method: "POST",
        body: fd,
      });
      const json = await res.json() as { success?: boolean; url?: string; error?: string };
      if (json.success && json.url) {
        setForm((f) => ({ ...f, image: json.url! + "?t=" + Date.now() }));
      } else {
        setUploadError(json.error || "Erreur lors de l'upload.");
      }
    } catch {
      setUploadError("Erreur réseau.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string, nom: string) {
    if (!confirm(`Supprimer le pack "${nom}" ?`)) return;
    try {
      await fetch(`/api/admin/packs?password=${password}&id=${id}`, { method: "DELETE" });
      await load();
      setSuccess("Pack supprimé.");
      setTimeout(() => setSuccess(""), 3000);
    } catch { setError("Erreur lors de la suppression"); }
  }

  function copyShareLink(pack: Pack) {
    if (!pack.slug) return;
    navigator.clipboard.writeText(`${SITE}/packs/${pack.slug}`).then(() => {
      setCopiedId(pack.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }

  async function toggleStatut(pack: Pack) {
    try {
      await fetch(`/api/admin/packs?password=${password}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: pack.id, statut: nextStatut(pack.statut) }),
      });
      await load();
    } catch { setError("Erreur"); }
  }

  const isFormOpen = creating || !!editing;
  const filteredAvailable = available.filter((i) =>
    i.title.toLowerCase().includes(searchItems.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
              <ArrowLeft size={18} className="text-gray-600" />
            </Link>
            <Package size={20} className="text-[#E8B800]" />
            <h1 className="text-lg font-bold text-gray-900">Gestion des Packs</h1>
            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">{packs.length}</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/packs" target="_blank"
              className="px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
              Voir la page →
            </Link>
            <button onClick={startCreate}
              className="flex items-center gap-2 px-4 py-2 bg-[#E8B800] hover:bg-[#27A827] text-black font-bold rounded-xl text-sm transition-colors">
              <Plus size={16} /> Créer un pack
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Feedback */}
        {success && (
          <div className="mb-5 flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm">
            <CheckCircle size={15} /> {success}
          </div>
        )}

        <div className={`grid grid-cols-1 ${isFormOpen ? "lg:grid-cols-5" : ""} gap-8`}>
          {/* ── Liste ── */}
          <div className={isFormOpen ? "lg:col-span-2" : ""}>
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 size={32} className="animate-spin text-[#E8B800]" />
              </div>
            ) : packs.length === 0 && !isFormOpen ? (
              <div className="text-center py-20 bg-white border border-gray-200 rounded-2xl">
                <Package size={40} className="text-gray-300 mx-auto mb-4" />
                <h3 className="text-gray-900 font-bold mb-2">Aucun pack créé</h3>
                <p className="text-gray-500 text-sm mb-5">Créez votre premier pack pour commencer.</p>
                <button onClick={startCreate}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#E8B800] text-black font-bold rounded-xl text-sm">
                  <Plus size={16} /> Créer un pack
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {packs.map((pack) => {
                  const cfg = STATUT_CFG[pack.statut];
                  const ebooksCount = pack.items.filter((i) => i.type === "ebook").length;
                  const formationsCount = pack.items.filter((i) => i.type === "formation").length;
                  return (
                    <div key={pack.id}
                      className={`bg-white border rounded-2xl p-5 flex items-start gap-4 transition-colors ${editing?.id === pack.id ? "border-[#E8B800]" : "border-gray-200"}`}>
                      {pack.image ? (
                        <img src={pack.image} alt={pack.nom}
                          className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#E8B800]/20 to-[#27A827]/20 flex items-center justify-center flex-shrink-0">
                          <Package size={24} className="text-[#E8B800]" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="text-gray-900 font-bold text-sm leading-tight truncate">{pack.nom}</h3>
                          <button onClick={() => toggleStatut(pack)}
                            className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-bold border cursor-pointer hover:opacity-70 transition-opacity ${cfg.cls}`}>
                            {cfg.label}
                          </button>
                        </div>
                        {pack.description && (
                          <p className="text-gray-500 text-xs line-clamp-1 mb-2">{pack.description}</p>
                        )}
                        <div className="flex items-center flex-wrap gap-3 text-xs text-gray-500">
                          {ebooksCount > 0 && (
                            <span className="flex items-center gap-1">
                              <BookOpen size={10} className="text-blue-500" />
                              {ebooksCount} ebook{ebooksCount > 1 ? "s" : ""}
                            </span>
                          )}
                          {formationsCount > 0 && (
                            <span className="flex items-center gap-1">
                              <Play size={10} className="text-purple-500" />
                              {formationsCount} formation{formationsCount > 1 ? "s" : ""}
                            </span>
                          )}
                          <span className="font-semibold text-gray-900 ml-auto">
                            {pack.prix.toLocaleString("fr-FR")} FCFA
                          </span>
                        </div>
                        {/* Lien de partage */}
                        {pack.slug && (
                          <div className="mt-2 flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5">
                            <span className="text-gray-400 text-xs truncate flex-1 font-mono">
                              /packs/{pack.slug}
                            </span>
                            <button
                              onClick={() => copyShareLink(pack)}
                              title="Copier le lien"
                              className={`flex-shrink-0 p-1 rounded transition-colors ${copiedId === pack.id ? "text-emerald-600" : "text-gray-400 hover:text-[#E8B800]"}`}
                            >
                              {copiedId === pack.id ? <Check size={12} /> : <Copy size={12} />}
                            </button>
                            <Link href={`/packs/${pack.slug}`} target="_blank"
                              title="Voir la page"
                              className="flex-shrink-0 p-1 text-gray-400 hover:text-[#E8B800] rounded transition-colors">
                              <ExternalLink size={12} />
                            </Link>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-1.5 flex-shrink-0">
                        <button onClick={() => startEdit(pack)}
                          className="p-1.5 text-gray-400 hover:text-[#E8B800] hover:bg-[#E8B800]/10 rounded-lg transition-colors">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => handleDelete(pack.id, pack.nom)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Formulaire ── */}
          {isFormOpen && (
            <div className="lg:col-span-3">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-gray-900 font-bold">
                    {creating ? "Créer un pack" : `Modifier — ${editing?.nom}`}
                  </h2>
                  <button onClick={cancelForm}
                    className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors">
                    <X size={16} />
                  </button>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                    <AlertCircle size={15} /> {error}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Nom */}
                  <div className="sm:col-span-2">
                    <label className="block text-gray-700 text-xs font-semibold mb-1.5">
                      Nom du pack <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={form.nom}
                      onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
                      className={inputCls} placeholder="Pack Essentiel Entrepreneuriat"
                    />
                  </div>

                  {/* Description */}
                  <div className="sm:col-span-2">
                    <label className="block text-gray-700 text-xs font-semibold mb-1.5">Description</label>
                    <textarea
                      rows={3} value={form.description}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                      className={`${inputCls} resize-none`}
                      placeholder="Tout ce qu'il vous faut pour lancer votre business…"
                    />
                  </div>

                  {/* Prix */}
                  <div>
                    <label className="block text-gray-700 text-xs font-semibold mb-1.5">
                      Prix (FCFA) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number" min="0" value={form.prix}
                      onChange={(e) => setForm((f) => ({ ...f, prix: e.target.value }))}
                      className={inputCls} placeholder="15000"
                    />
                  </div>

                  {/* Ordre */}
                  <div>
                    <label className="block text-gray-700 text-xs font-semibold mb-1.5">Ordre d'affichage</label>
                    <input
                      type="number" min="1" value={form.ordre}
                      onChange={(e) => setForm((f) => ({ ...f, ordre: e.target.value }))}
                      className={inputCls} placeholder="1"
                    />
                  </div>

                  {/* Bannière / Image */}
                  <div className="sm:col-span-2">
                    <label className="block text-gray-700 text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                      <ImageIcon size={12} className="text-[#E8B800]" />
                      Bannière du pack
                      <span className="text-gray-400 font-normal">(recommandé : 1200×600 px, ratio 2:1)</span>
                    </label>

                    {/* Zone upload */}
                    <input
                      ref={bannerInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleBannerUpload(f);
                        e.target.value = "";
                      }}
                    />

                    {form.image ? (
                      /* Aperçu avec boutons */
                      <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-100">
                        <img
                          src={form.image}
                          alt="Bannière"
                          className="w-full object-contain max-h-52"
                          style={{ background: "linear-gradient(135deg,#f5f5f5,#eee)" }}
                        />
                        <div className="absolute top-2 right-2 flex gap-2">
                          <button
                            type="button"
                            onClick={() => bannerInputRef.current?.click()}
                            disabled={uploading}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-black/60 hover:bg-black/80 text-white text-xs font-bold rounded-lg backdrop-blur-sm transition-colors disabled:opacity-50"
                          >
                            {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                            {uploading ? "Upload…" : "Changer"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setForm((f) => ({ ...f, image: "" }))}
                            className="flex items-center gap-1 px-2 py-1.5 bg-red-500/80 hover:bg-red-600 text-white text-xs rounded-lg transition-colors"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Zone de dépôt / click */
                      <button
                        type="button"
                        onClick={() => bannerInputRef.current?.click()}
                        disabled={uploading}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          const f = e.dataTransfer.files?.[0];
                          if (f) handleBannerUpload(f);
                        }}
                        className="w-full flex flex-col items-center justify-center gap-2 py-8 border-2 border-dashed border-gray-300 hover:border-[#E8B800] hover:bg-[#E8B800]/5 rounded-xl text-gray-400 hover:text-[#E8B800] transition-all disabled:opacity-50 cursor-pointer"
                      >
                        {uploading ? (
                          <>
                            <Loader2 size={28} className="animate-spin text-[#E8B800]" />
                            <span className="text-sm font-medium text-[#E8B800]">Upload en cours…</span>
                          </>
                        ) : (
                          <>
                            <Upload size={28} />
                            <div className="text-center">
                              <p className="text-sm font-semibold">Cliquer ou glisser-déposer une image</p>
                              <p className="text-xs mt-0.5">JPG, PNG, WebP — max 15 Mo</p>
                            </div>
                          </>
                        )}
                      </button>
                    )}

                    {uploadError && (
                      <p className="flex items-center gap-1 mt-1.5 text-red-500 text-xs">
                        <AlertCircle size={12} /> {uploadError}
                      </p>
                    )}
                  </div>

                  {/* Vidéo */}
                  <div className="sm:col-span-2">
                    <label className="block text-gray-700 text-xs font-semibold mb-1.5">Vidéo de présentation <span className="text-gray-400 font-normal">(YouTube, Google Drive, MP4… — optionnel)</span></label>
                    <input
                      type="url"
                      value={form.videoUrl}
                      onChange={(e) => setForm((f) => ({ ...f, videoUrl: e.target.value }))}
                      className={inputCls}
                      placeholder="https://www.youtube.com/watch?v=… ou https://drive.google.com/…"
                    />
                    {form.videoUrl.trim()
                      ? <p className="text-emerald-600 text-xs mt-1">✓ Vidéo configurée — un lecteur s&apos;affichera sur la fiche pack</p>
                      : <p className="text-gray-400 text-xs mt-1">Laissez vide pour ne pas afficher de lecteur vidéo</p>
                    }
                  </div>

                  {/* Statut */}
                  <div>
                    <label className="block text-gray-700 text-xs font-semibold mb-1.5">Statut</label>
                    <select
                      value={form.statut}
                      onChange={(e) => setForm((f) => ({ ...f, statut: e.target.value as StatutPack }))}
                      className={inputCls}
                    >
                      <option value="brouillon">Brouillon</option>
                      <option value="actif">Actif</option>
                      <option value="inactif">Inactif</option>
                    </select>
                  </div>
                </div>

                {/* ── Sélecteur de contenus ── */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-gray-700 text-xs font-semibold">
                      Contenus inclus <span className="text-red-500">*</span>
                      <span className="text-gray-400 font-normal ml-1">(min. 3)</span>
                    </label>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${form.items.length >= 3 ? "bg-emerald-50 text-emerald-600" : "bg-orange-50 text-orange-500"}`}>
                      {form.items.length} sélectionné{form.items.length > 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* Chips des items sélectionnés */}
                  {form.items.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3 p-3 bg-gray-50 rounded-xl">
                      {form.items.map((item) => (
                        <span key={item.id}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${item.type === "ebook" ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-purple-50 border-purple-200 text-purple-700"}`}>
                          {item.type === "ebook" ? <BookOpen size={10} /> : <Play size={10} />}
                          <span className="max-w-[120px] truncate">{item.title}</span>
                          <button
                            onClick={() => setForm((f) => ({ ...f, items: f.items.filter((i) => i.id !== item.id) }))}
                            className="ml-0.5 hover:text-red-500 transition-colors flex-shrink-0">
                            <X size={10} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Recherche + liste */}
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="p-2.5 bg-gray-50 border-b border-gray-200">
                      <input
                        value={searchItems}
                        onChange={(e) => setSearchItems(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#E8B800] placeholder-gray-400"
                        placeholder="Rechercher un ebook ou une formation…"
                      />
                    </div>
                    <div className="max-h-56 overflow-y-auto divide-y divide-gray-50">
                      {filteredAvailable.length === 0 ? (
                        <p className="text-gray-400 text-xs text-center py-6">Aucun contenu trouvé</p>
                      ) : filteredAvailable.map((item) => {
                        const selected = form.items.some((i) => i.id === item.id);
                        return (
                          <label key={item.id}
                            className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${selected ? "bg-[#E8B800]/5" : "hover:bg-gray-50"}`}>
                            <input type="checkbox" checked={selected} onChange={() => toggleItem(item)}
                              className="accent-[#E8B800] w-4 h-4 flex-shrink-0" />
                            <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-bold ${item.type === "ebook" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
                              {item.type === "ebook" ? "Guide" : "Formation"}
                            </span>
                            <span className="flex-1 text-gray-900 text-sm truncate">{item.title}</span>
                            <span className="text-gray-400 text-xs flex-shrink-0">
                              {item.prix.toLocaleString("fr-FR")} F
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Save */}
                <button onClick={handleSave} disabled={saving}
                  className="w-full py-3 bg-[#E8B800] hover:bg-[#27A827] text-black font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {saving ? "Enregistrement…" : (editing ? "Enregistrer les modifications" : "Créer le pack")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}