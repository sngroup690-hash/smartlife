"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Lock, Save, X, Loader2, RefreshCw } from "lucide-react";

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? "";
const inputCls = "w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[#E8B800] transition-colors text-sm";
const labelCls = "block text-gray-400 text-sm mb-2";

type ConsultantServer = {
  id: string;
  prenom: string;
  nom?: string;
  ville?: string;
  anneesExperience?: string;
  motivation?: string;
  portfolioUrl?: string;
  clientsAccompa: number;
  entreprisesAccompa: number;
  domainesIds: string[];
  actif: boolean;
  createdAt: string;
  updatedAt: string;
};

type FormData = {
  prenom: string; nom: string; ville: string; anneesExperience: string;
  motivation: string; portfolioUrl: string;
  clientsAccompa: string; entreprisesAccompa: string; domainesIds: string[];
};

const FORM_VIDE: FormData = {
  prenom: "", nom: "", ville: "", anneesExperience: "", motivation: "", portfolioUrl: "",
  clientsAccompa: "0", entreprisesAccompa: "0", domainesIds: [],
};

type EspaceLight = { id: string; titre: string };

function FormulaireConsultant({
  initial, onSave, onCancel, titreForm, espaces, saving,
}: {
  initial: FormData;
  onSave: (d: FormData) => void;
  onCancel: () => void;
  titreForm: string;
  espaces: EspaceLight[];
  saving: boolean;
}) {
  const [form, setForm] = useState<FormData>(initial);
  const set = (k: keyof FormData, v: string | string[]) => setForm((f) => ({ ...f, [k]: v }));

  function toggleDomaine(id: string) {
    const curr = form.domainesIds;
    set("domainesIds", curr.includes(id) ? curr.filter((x) => x !== id) : [...curr, id]);
  }

  return (
    <div className="p-6 bg-white/[0.03] border border-[#E8B800]/30 rounded-2xl space-y-5">
      <h3 className="text-white font-bold text-lg">{titreForm}</h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Prénom <span className="text-[#E8B800]">*</span></label>
          <input type="text" value={form.prenom}
            onChange={(e) => set("prenom", e.target.value)}
            className={inputCls} placeholder="Ex: Jean" autoFocus />
          <p className="text-gray-600 text-xs mt-1">Affiché publiquement.</p>
        </div>
        <div>
          <label className={labelCls}>Nom (confidentiel)</label>
          <input type="text" value={form.nom}
            onChange={(e) => set("nom", e.target.value)}
            className={inputCls} placeholder="Ex: Dupont" />
          <p className="text-gray-600 text-xs mt-1">Flou sur la page publique.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Ville</label>
          <input type="text" value={form.ville}
            onChange={(e) => set("ville", e.target.value)}
            className={inputCls} placeholder="Ex: Yaoundé" />
        </div>
        <div>
          <label className={labelCls}>Années d&apos;expérience</label>
          <input type="text" value={form.anneesExperience}
            onChange={(e) => set("anneesExperience", e.target.value)}
            className={inputCls} placeholder="Ex: 5 ans d'expérience" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Clients accompagnés</label>
          <input type="number" min="0" value={form.clientsAccompa}
            onChange={(e) => set("clientsAccompa", e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Entreprises accompagnées</label>
          <input type="number" min="0" value={form.entreprisesAccompa}
            onChange={(e) => set("entreprisesAccompa", e.target.value)} className={inputCls} />
        </div>
      </div>

      <div>
        <label className={labelCls}>Présentation / Motivation</label>
        <textarea value={form.motivation}
          onChange={(e) => set("motivation", e.target.value)}
          rows={3} className={inputCls}
          placeholder="Décrivez l'expérience et les valeurs de ce consultant..." />
      </div>

      <div>
        <label className={labelCls}>URL Portfolio / LinkedIn</label>
        <input type="url" value={form.portfolioUrl}
          onChange={(e) => set("portfolioUrl", e.target.value)}
          className={inputCls} placeholder="https://linkedin.com/in/..." />
      </div>

      {espaces.length > 0 && (
        <div>
          <label className={labelCls}>Secteurs d&apos;expertise</label>
          <div className="flex flex-wrap gap-2">
            {espaces.map((e) => (
              <button key={e.id} type="button" onClick={() => toggleDomaine(e.id)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                  form.domainesIds.includes(e.id)
                    ? "bg-[#E8B800] border-[#E8B800] text-black"
                    : "border-white/20 text-gray-400 hover:border-white/40"
                }`}>
                {form.domainesIds.includes(e.id) && "✓ "}{e.titre}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button onClick={() => form.prenom.trim() && onSave(form)}
          disabled={!form.prenom.trim() || saving}
          className="flex items-center gap-2 px-6 py-3 bg-[#E8B800] hover:bg-[#27A827] text-black font-bold rounded-xl transition-all disabled:opacity-40 text-sm">
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          Enregistrer
        </button>
        <button onClick={onCancel}
          className="flex items-center gap-2 px-6 py-3 border border-white/20 hover:bg-white/5 text-gray-400 rounded-xl transition-all text-sm">
          <X size={15} /> Annuler
        </button>
      </div>
    </div>
  );
}

export default function AdminConsultantsPage() {
  const [authed, setAuthed] = useState(false);
  const [pwd, setPwd] = useState("");
  const [pwdError, setPwdError] = useState(false);

  const [consultants, setConsultants] = useState<ConsultantServer[]>([]);
  const [espaces, setEspaces] = useState<EspaceLight[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    try {
      const [rC, rE] = await Promise.all([
        fetch(`/api/admin/consultants?password=${ADMIN_PASSWORD}`).then((r) => r.json()),
        fetch("/api/espaces").then((r) => r.json()),
      ]);
      setConsultants((rC.consultants ?? []).sort(
        (a: ConsultantServer, b: ConsultantServer) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
      setEspaces((rE.espaces ?? []).filter((e: { actif?: boolean }) => e.actif !== false));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (authed) loadData();
  }, [authed]);

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
            <p className="text-gray-500 text-sm">Gestion des consultants</p>
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
              <button type="submit" className="w-full py-3 bg-[#E8B800] text-black font-bold rounded-xl">Accéder</button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  function toForm(c: ConsultantServer): FormData {
    return {
      prenom: c.prenom,
      nom: c.nom ?? "",
      ville: c.ville ?? "",
      anneesExperience: c.anneesExperience ?? "",
      motivation: c.motivation ?? "",
      portfolioUrl: c.portfolioUrl ?? "",
      clientsAccompa: String(c.clientsAccompa),
      entreprisesAccompa: String(c.entreprisesAccompa),
      domainesIds: c.domainesIds,
    };
  }

  async function handleAjouter(form: FormData) {
    setSaving(true);
    try {
      const r = await fetch(`/api/admin/consultants?password=${ADMIN_PASSWORD}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prenom: form.prenom.trim(),
          nom: form.nom.trim() || undefined,
          ville: form.ville.trim() || undefined,
          anneesExperience: form.anneesExperience.trim() || undefined,
          motivation: form.motivation.trim() || undefined,
          portfolioUrl: form.portfolioUrl.trim() || undefined,
          clientsAccompa: parseInt(form.clientsAccompa) || 0,
          entreprisesAccompa: parseInt(form.entreprisesAccompa) || 0,
          domainesIds: form.domainesIds,
        }),
      });
      if (r.ok) {
        const data = await r.json();
        setConsultants((prev) => [data.consultant, ...prev]);
        setShowForm(false);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleModifier(id: string, form: FormData) {
    setSaving(true);
    try {
      const r = await fetch(`/api/admin/consultants?password=${ADMIN_PASSWORD}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          prenom: form.prenom.trim(),
          nom: form.nom.trim() || undefined,
          ville: form.ville.trim() || undefined,
          anneesExperience: form.anneesExperience.trim() || undefined,
          motivation: form.motivation.trim() || undefined,
          portfolioUrl: form.portfolioUrl.trim() || undefined,
          clientsAccompa: parseInt(form.clientsAccompa) || 0,
          entreprisesAccompa: parseInt(form.entreprisesAccompa) || 0,
          domainesIds: form.domainesIds,
        }),
      });
      if (r.ok) {
        const data = await r.json();
        setConsultants((prev) => prev.map((c) => (c.id === id ? data.consultant : c)));
        setEditId(null);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActif(c: ConsultantServer) {
    const r = await fetch(`/api/admin/consultants?password=${ADMIN_PASSWORD}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: c.id, actif: !c.actif }),
    });
    if (r.ok) {
      setConsultants((prev) => prev.map((x) => (x.id === c.id ? { ...x, actif: !c.actif } : x)));
    }
  }

  async function handleSupprimer(id: string) {
    const r = await fetch(`/api/admin/consultants?password=${ADMIN_PASSWORD}&id=${id}`, { method: "DELETE" });
    if (r.ok) {
      setConsultants((prev) => prev.filter((c) => c.id !== id));
      setConfirmDelete(null);
    }
  }

  const actifs = consultants.filter((c) => c.actif);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      <div className="flex items-center justify-between mb-10 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Consultants</h1>
          <p className="text-gray-500 text-sm">
            {consultants.length} enregistré{consultants.length > 1 ? "s" : ""} · {actifs.length} actif{actifs.length > 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button onClick={loadData} className="p-2 border border-white/20 text-gray-400 rounded-xl hover:bg-white/5 transition-all">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
          <a href="/admin/espaces" className="px-4 py-2 bg-white/5 border border-white/20 hover:bg-white/10 text-gray-300 rounded-xl text-sm transition-all">🏢 Espaces</a>
          <a href="/admin/accompagnement" className="px-4 py-2 border border-white/20 text-gray-400 rounded-xl text-sm">Candidatures</a>
          <a href="/admin/reviews" className="px-4 py-2 bg-[#E8B800]/10 border border-[#E8B800]/30 hover:bg-[#E8B800]/20 text-[#E8B800] font-bold rounded-xl text-sm flex items-center gap-1.5">⭐ Avis consultants</a>
          <button onClick={() => setAuthed(false)} className="px-4 py-2 border border-white/20 text-gray-400 rounded-xl text-sm">Déconnexion</button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-[#E8B800]" />
        </div>
      ) : (
        <>
          {!showForm && (
            <button onClick={() => { setShowForm(true); setEditId(null); }}
              className="w-full mb-8 py-4 border-2 border-dashed border-[#E8B800]/40 hover:border-[#E8B800] hover:bg-[#E8B800]/5 text-[#E8B800] rounded-2xl flex items-center justify-center gap-2 font-bold transition-all">
              <Plus size={20} /> Ajouter un consultant
            </button>
          )}

          {showForm && (
            <div className="mb-8">
              <FormulaireConsultant
                initial={FORM_VIDE} espaces={espaces} saving={saving}
                onSave={handleAjouter} onCancel={() => setShowForm(false)}
                titreForm="Nouveau consultant"
              />
            </div>
          )}

          {consultants.length === 0 ? (
            <div className="text-center py-20 bg-white/[0.02] border border-white/8 rounded-2xl">
              <div className="text-6xl mb-4">👤</div>
              <h3 className="text-white font-bold text-xl mb-2">Aucun consultant enregistré</h3>
              <p className="text-gray-500 text-sm">Ajoutez vos consultants pour les afficher sur le site.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {consultants.map((c) => (
                <div key={c.id}>
                  {editId === c.id ? (
                    <FormulaireConsultant
                      initial={toForm(c)} espaces={espaces} saving={saving}
                      onSave={(form) => handleModifier(c.id, form)}
                      onCancel={() => setEditId(null)}
                      titreForm={`Modifier — ${c.prenom}`}
                    />
                  ) : (
                    <div className={`p-5 rounded-2xl border transition-all ${c.actif ? "bg-white/[0.03] border-white/10" : "bg-white/[0.01] border-white/5 opacity-60"}`}>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#E8B800]/30 to-[#27A827]/10 border border-[#E8B800]/30 flex items-center justify-center text-[#E8B800] font-black text-2xl flex-shrink-0">
                            {c.prenom.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-0.5">
                              <h3 className="text-white font-bold text-base">{c.prenom}{c.nom && <span className="text-gray-600 font-normal ml-1">{c.nom}</span>}</h3>
                              {!c.actif && <span className="text-xs px-2 py-0.5 bg-red-900/30 border border-red-700/30 text-red-400 rounded-full">Désactivé</span>}
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-500">
                              {c.ville && <span>📍 {c.ville}</span>}
                              {c.anneesExperience && <span>⏱ {c.anneesExperience}</span>}
                              <span>
                                <strong className="text-emerald-400">{c.clientsAccompa}</strong> clients ·{" "}
                                <strong className="text-[#E8B800]">{c.entreprisesAccompa}</strong> entreprises
                              </span>
                            </div>
                            {c.domainesIds.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {c.domainesIds.map((id) => {
                                  const e = espaces.find((x) => x.id === id);
                                  return e ? (
                                    <span key={id} className="text-xs px-2 py-0.5 bg-[#E8B800]/10 text-[#E8B800] rounded-full">{e.titre}</span>
                                  ) : null;
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button onClick={() => handleToggleActif(c)}
                            className={`p-2 rounded-lg transition-all ${c.actif ? "text-emerald-400 hover:bg-emerald-900/30" : "text-gray-600 hover:bg-white/5"}`}>
                            {c.actif ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                          </button>
                          <button onClick={() => { setEditId(c.id); setShowForm(false); }}
                            className="p-2 text-gray-500 hover:text-[#E8B800] hover:bg-[#E8B800]/10 rounded-lg transition-all">
                            <Pencil size={16} />
                          </button>
                          {confirmDelete === c.id ? (
                            <div className="flex items-center gap-1">
                              <button onClick={() => handleSupprimer(c.id)}
                                className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-lg">Confirmer</button>
                              <button onClick={() => setConfirmDelete(null)}
                                className="px-3 py-1 border border-white/20 text-gray-400 text-xs rounded-lg">Non</button>
                            </div>
                          ) : (
                            <button onClick={() => setConfirmDelete(c.id)}
                              className="p-2 text-gray-600 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-all">
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

          {actifs.length > 0 && (
            <div className="mt-10 p-5 bg-emerald-900/10 border border-emerald-700/20 rounded-2xl flex items-center justify-between gap-4">
              <p className="text-white font-semibold text-sm">
                {actifs.length} consultant{actifs.length > 1 ? "s" : ""} visible{actifs.length > 1 ? "s" : ""} sur le site
              </p>
              <a href="/nos-consultants" target="_blank"
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-bold rounded-xl">
                Voir la page →
              </a>
            </div>
          )}
        </>
      )}
    </div>
  );
}