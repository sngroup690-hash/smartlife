"use client";

import { useState, useEffect } from "react";
import { Star, Check, X, Trash2, Pencil, RefreshCw, Lock, Loader2, ChevronDown, Plus } from "lucide-react";

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? "";
const inputCls = "w-full px-4 py-2.5 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[#E8B800] transition-colors text-sm";
const labelCls = "block text-gray-400 text-xs mb-1.5";

type ConsultantReview = {
  id: string;
  consultantId: string;
  auteur: string;
  note: number;
  contenu: string;
  statut: "en_attente" | "validee" | "rejetee";
  createdAt: string;
};

type ConsultantLight = { id: string; prenom: string; nom?: string };

function Stars({ note }: { note: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={13}
          className={i <= note ? "text-[#E8B800] fill-[#E8B800]" : "text-gray-600"}
        />
      ))}
    </div>
  );
}

const STATUT_CONFIG = {
  en_attente: { label: "En attente",  cls: "bg-amber-900/30 text-amber-400 border-amber-700/30" },
  validee:    { label: "Validé",       cls: "bg-emerald-900/30 text-emerald-400 border-emerald-700/30" },
  rejetee:    { label: "Rejeté",       cls: "bg-red-900/30 text-red-400 border-red-700/30" },
};

export default function AdminReviewsPage() {
  const [authed, setAuthed] = useState(false);
  const [pwd, setPwd] = useState("");
  const [pwdError, setPwdError] = useState(false);

  const [reviews, setReviews] = useState<ConsultantReview[]>([]);
  const [consultants, setConsultants] = useState<ConsultantLight[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);

  const [filtreStatut, setFiltreStatut] = useState<string>("tous");
  const [filtreConsultant, setFiltreConsultant] = useState<string>("tous");
  const [editId, setEditId] = useState<string | null>(null);
  const [editContenu, setEditContenu] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Création manuelle
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ consultantId: "", auteur: "", note: 5, contenu: "", createdAt: "" });
  const [createSaving, setCreateSaving] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createHover, setCreateHover] = useState(0);

  async function loadData() {
    setLoading(true);
    try {
      const [rR, rC] = await Promise.all([
        fetch(`/api/admin/consultant-reviews?password=${ADMIN_PASSWORD}`).then((r) => r.json()),
        fetch(`/api/admin/consultants?password=${ADMIN_PASSWORD}`).then((r) => r.json()),
      ]);
      const sorted = (rR.reviews ?? []).sort(
        (a: ConsultantReview, b: ConsultantReview) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setReviews(sorted);
      setConsultants(rC.consultants ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (authed) loadData(); }, [authed]);

  function login(e: React.FormEvent) {
    e.preventDefault();
    if (pwd === ADMIN_PASSWORD) { setAuthed(true); setPwdError(false); }
    else setPwdError(true);
  }

  async function handleStatut(id: string, statut: "validee" | "rejetee") {
    setSaving(id);
    try {
      const r = await fetch(`/api/admin/consultant-reviews?password=${ADMIN_PASSWORD}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, statut }),
      });
      if (r.ok) {
        setReviews((prev) => prev.map((rv) => rv.id === id ? { ...rv, statut } : rv));
      }
    } finally {
      setSaving(null);
    }
  }

  async function handleEdit(id: string) {
    setSaving(id);
    try {
      const r = await fetch(`/api/admin/consultant-reviews?password=${ADMIN_PASSWORD}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, contenu: editContenu.trim() }),
      });
      if (r.ok) {
        setReviews((prev) => prev.map((rv) => rv.id === id ? { ...rv, contenu: editContenu.trim() } : rv));
        setEditId(null);
      }
    } finally {
      setSaving(null);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!createForm.consultantId || !createForm.auteur.trim() || !createForm.contenu.trim()) {
      setCreateError("Consultant, auteur et commentaire sont obligatoires.");
      return;
    }
    setCreateSaving(true);
    setCreateError("");
    try {
      const body: Record<string, unknown> = {
        consultantId: createForm.consultantId,
        auteur: createForm.auteur.trim(),
        note: createForm.note,
        contenu: createForm.contenu.trim(),
        statut: "validee",
      };
      if (createForm.createdAt) body.createdAt = new Date(createForm.createdAt).toISOString();
      const r = await fetch(`/api/admin/consultant-reviews?password=${ADMIN_PASSWORD}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (r.ok) {
        setCreateForm({ consultantId: "", auteur: "", note: 5, contenu: "", createdAt: "" });
        setShowCreate(false);
        await loadData();
      } else {
        const d = await r.json();
        setCreateError(d.error || "Erreur lors de la création.");
      }
    } catch {
      setCreateError("Erreur réseau.");
    } finally {
      setCreateSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setSaving(id);
    try {
      const r = await fetch(
        `/api/admin/consultant-reviews?password=${ADMIN_PASSWORD}&id=${id}`,
        { method: "DELETE" }
      );
      if (r.ok) {
        setReviews((prev) => prev.filter((rv) => rv.id !== id));
        setConfirmDelete(null);
      }
    } finally {
      setSaving(null);
    }
  }

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-[#E8B800]/10 border border-[#E8B800]/30 flex items-center justify-center text-3xl mb-4">⭐</div>
            <h1 className="text-2xl font-bold text-white mb-1">Avis Consultants</h1>
            <p className="text-gray-500 text-sm">Modération des avis clients</p>
          </div>
          <div className="p-8 bg-white/[0.03] border border-white/10 rounded-2xl">
            <form onSubmit={login} className="space-y-4">
              <div>
                <label className={labelCls}><Lock size={12} className="inline mr-1" />Mot de passe</label>
                <input type="password" value={pwd}
                  onChange={(e) => { setPwd(e.target.value); setPwdError(false); }}
                  className={inputCls} placeholder="••••••••" autoFocus />
                {pwdError && <p className="text-red-400 text-xs mt-2">Mot de passe incorrect.</p>}
              </div>
              <button type="submit" className="w-full py-3 bg-[#E8B800] text-black font-bold rounded-xl">Accéder</button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const pending = reviews.filter((r) => r.statut === "en_attente");
  const validated = reviews.filter((r) => r.statut === "validee");

  const filtered = reviews.filter((r) => {
    if (filtreStatut !== "tous" && r.statut !== filtreStatut) return false;
    if (filtreConsultant !== "tous" && r.consultantId !== filtreConsultant) return false;
    return true;
  });

  function consultantName(id: string): string {
    const c = consultants.find((x) => x.id === id);
    if (!c) return id;
    return c.prenom + (c.nom ? ` ${c.nom}` : "");
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">

      {/* Header */}
      <div className="flex items-center justify-between mb-10 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Avis Consultants</h1>
          <p className="text-gray-500 text-sm">
            {pending.length} en attente · {validated.length} validé{validated.length > 1 ? "s" : ""} · {reviews.length} total
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={loadData} className="p-2 border border-white/20 text-gray-400 rounded-xl hover:bg-white/5">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
          <a href="/admin/consultants" className="px-4 py-2 bg-white/5 border border-white/20 hover:bg-white/10 text-gray-300 rounded-xl text-sm">
            ← Consultants
          </a>
          <button onClick={() => setAuthed(false)} className="px-4 py-2 border border-white/20 text-gray-400 rounded-xl text-sm">
            Déconnexion
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "En attente", value: pending.length, cls: "text-amber-400", bg: "bg-amber-900/10 border-amber-700/20" },
          { label: "Validés", value: validated.length, cls: "text-emerald-400", bg: "bg-emerald-900/10 border-emerald-700/20" },
          { label: "Rejetés", value: reviews.filter(r => r.statut === "rejetee").length, cls: "text-red-400", bg: "bg-red-900/10 border-red-700/20" },
        ].map((stat) => (
          <div key={stat.label} className={`p-4 rounded-2xl border text-center ${stat.bg}`}>
            <div className={`text-3xl font-bold ${stat.cls}`}>{stat.value}</div>
            <div className="text-gray-500 text-xs mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Créer un avis manuellement */}
      <div className="mb-6">
        <button
          onClick={() => { setShowCreate((v) => !v); setCreateError(""); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#E8B800]/10 border border-[#E8B800]/30 hover:bg-[#E8B800]/20 text-[#E8B800] font-bold rounded-xl text-sm transition-all"
        >
          <Plus size={15} /> Créer un avis manuellement
          {showCreate ? <ChevronDown size={14} className="rotate-180 transition-transform" /> : <ChevronDown size={14} className="transition-transform" />}
        </button>

        {showCreate && (
          <form onSubmit={handleCreate} className="mt-4 p-5 bg-white/[0.03] border border-[#E8B800]/20 rounded-2xl space-y-4">
            <h3 className="text-white font-bold text-sm">Nouvel avis — publié directement</h3>

            {/* Consultant */}
            <div>
              <label className={labelCls}>Consultant *</label>
              <div className="relative">
                <select
                  value={createForm.consultantId}
                  onChange={(e) => setCreateForm((f) => ({ ...f, consultantId: e.target.value }))}
                  className={inputCls}
                >
                  <option value="" className="bg-gray-900">— Choisir un consultant —</option>
                  {consultants.map((c) => (
                    <option key={c.id} value={c.id} className="bg-gray-900">
                      {c.prenom}{c.nom ? ` ${c.nom}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Auteur */}
              <div>
                <label className={labelCls}>Nom du client *</label>
                <input
                  type="text" value={createForm.auteur}
                  onChange={(e) => setCreateForm((f) => ({ ...f, auteur: e.target.value }))}
                  placeholder="Ex: Marie Dupont"
                  className={inputCls}
                />
              </div>

              {/* Date */}
              <div>
                <label className={labelCls}>Date (optionnel)</label>
                <input
                  type="date" value={createForm.createdAt}
                  onChange={(e) => setCreateForm((f) => ({ ...f, createdAt: e.target.value }))}
                  className={inputCls}
                />
              </div>
            </div>

            {/* Note étoiles */}
            <div>
              <label className={labelCls}>Note *</label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <button
                    key={i} type="button"
                    onClick={() => setCreateForm((f) => ({ ...f, note: i }))}
                    onMouseEnter={() => setCreateHover(i)}
                    onMouseLeave={() => setCreateHover(0)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star size={26} className={i <= (createHover || createForm.note) ? "text-[#E8B800] fill-[#E8B800]" : "text-gray-600"} />
                  </button>
                ))}
                <span className="text-gray-400 text-sm ml-2">{createForm.note}/5</span>
              </div>
            </div>

            {/* Commentaire */}
            <div>
              <label className={labelCls}>Commentaire *</label>
              <textarea
                value={createForm.contenu}
                onChange={(e) => setCreateForm((f) => ({ ...f, contenu: e.target.value }))}
                rows={3}
                placeholder="Témoignage du client…"
                className={inputCls + " resize-none"}
              />
            </div>

            {createError && <p className="text-red-400 text-xs">{createError}</p>}

            <div className="flex gap-3">
              <button
                type="submit" disabled={createSaving}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#E8B800] text-black font-bold rounded-xl text-sm disabled:opacity-40"
              >
                {createSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                Publier l&apos;avis
              </button>
              <button
                type="button" onClick={() => { setShowCreate(false); setCreateError(""); }}
                className="px-4 py-2.5 border border-white/20 text-gray-400 rounded-xl text-sm"
              >
                Annuler
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-2 bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2">
          <span className="text-gray-500 text-xs">Statut :</span>
          {(["tous", "en_attente", "validee", "rejetee"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFiltreStatut(s)}
              className={`text-xs px-3 py-1 rounded-lg transition-all ${
                filtreStatut === s
                  ? "bg-[#E8B800] text-black font-bold"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {s === "tous" ? "Tous" : STATUT_CONFIG[s].label}
            </button>
          ))}
        </div>

        {consultants.length > 0 && (
          <div className="flex items-center gap-2 bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2">
            <span className="text-gray-500 text-xs">Consultant :</span>
            <div className="relative">
              <select
                value={filtreConsultant}
                onChange={(e) => setFiltreConsultant(e.target.value)}
                className="bg-transparent text-white text-xs focus:outline-none appearance-none pr-4"
              >
                <option value="tous" className="bg-gray-900">Tous</option>
                {consultants.map((c) => (
                  <option key={c.id} value={c.id} className="bg-gray-900">
                    {c.prenom}{c.nom ? ` ${c.nom}` : ""}
                  </option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            </div>
          </div>
        )}
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-[#E8B800]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white/[0.02] border border-white/8 rounded-2xl">
          <div className="text-5xl mb-4">📭</div>
          <h3 className="text-white font-bold text-xl mb-2">Aucun avis</h3>
          <p className="text-gray-500 text-sm">Aucun avis ne correspond aux filtres sélectionnés.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((rv) => (
            <div
              key={rv.id}
              className={`p-5 rounded-2xl border transition-all ${
                rv.statut === "en_attente"
                  ? "bg-amber-900/5 border-amber-700/20"
                  : rv.statut === "validee"
                  ? "bg-white/[0.03] border-white/10"
                  : "bg-red-900/5 border-red-800/20 opacity-60"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Auteur + note + statut */}
                  <div className="flex items-center flex-wrap gap-2 mb-2">
                    <span className="text-white font-bold text-sm">{rv.auteur}</span>
                    <Stars note={rv.note} />
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUT_CONFIG[rv.statut].cls}`}>
                      {STATUT_CONFIG[rv.statut].label}
                    </span>
                    <span className="text-gray-600 text-xs">
                      pour <span className="text-gray-400">{consultantName(rv.consultantId)}</span>
                    </span>
                    <span className="text-gray-700 text-xs">
                      {new Date(rv.createdAt).toLocaleDateString("fr-FR")}
                    </span>
                  </div>

                  {/* Contenu */}
                  {editId === rv.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={editContenu}
                        onChange={(e) => setEditContenu(e.target.value)}
                        rows={3}
                        className={inputCls + " resize-none"}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(rv.id)}
                          disabled={saving === rv.id}
                          className="flex items-center gap-1 px-3 py-1.5 bg-[#E8B800] text-black text-xs font-bold rounded-lg disabled:opacity-40"
                        >
                          {saving === rv.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                          Sauvegarder
                        </button>
                        <button
                          onClick={() => setEditId(null)}
                          className="flex items-center gap-1 px-3 py-1.5 border border-white/20 text-gray-400 text-xs rounded-lg"
                        >
                          <X size={12} /> Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-300 text-sm leading-relaxed">{rv.contenu}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-1.5 flex-shrink-0">
                  {rv.statut !== "validee" && (
                    <button
                      onClick={() => handleStatut(rv.id, "validee")}
                      disabled={saving === rv.id}
                      className="flex items-center gap-1 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-all disabled:opacity-40"
                    >
                      {saving === rv.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                      Valider
                    </button>
                  )}
                  {rv.statut !== "rejetee" && (
                    <button
                      onClick={() => handleStatut(rv.id, "rejetee")}
                      disabled={saving === rv.id}
                      className="flex items-center gap-1 px-3 py-1.5 bg-red-800/50 hover:bg-red-700 text-red-300 text-xs rounded-lg transition-all disabled:opacity-40"
                    >
                      <X size={12} /> Rejeter
                    </button>
                  )}
                  {editId !== rv.id && (
                    <button
                      onClick={() => { setEditId(rv.id); setEditContenu(rv.contenu); }}
                      className="flex items-center gap-1 px-3 py-1.5 border border-white/10 text-gray-500 hover:text-[#E8B800] text-xs rounded-lg transition-all"
                    >
                      <Pencil size={12} /> Éditer
                    </button>
                  )}
                  {confirmDelete === rv.id ? (
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleDelete(rv.id)}
                        className="px-2 py-1 bg-red-600 text-white text-xs font-bold rounded-lg"
                      >
                        Oui
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="px-2 py-1 border border-white/20 text-gray-400 text-xs rounded-lg"
                      >
                        Non
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(rv.id)}
                      className="flex items-center gap-1 px-3 py-1.5 text-gray-700 hover:text-red-400 text-xs rounded-lg transition-all"
                    >
                      <Trash2 size={12} /> Supprimer
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}