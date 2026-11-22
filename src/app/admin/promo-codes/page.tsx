"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft, Plus, Pencil, Trash2, Save, X, Tag,
  Users, BarChart2, Loader2, AlertCircle, RefreshCw,
  ToggleLeft, ToggleRight, Percent, DollarSign, CheckCircle,
  TrendingUp, Award,
} from "lucide-react";

const ADMIN_PWD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? "";

// ── Types ──────────────────────────────────────────────────────────────────────

type DiscountType = "percent" | "fixed";

type PromoCode = {
  id: string;
  code: string;
  nom: string;
  partnerName: string;
  partnerEmail: string;
  discountType: DiscountType;
  discountValue: number;
  commissionRate: number;
  maxUses?: number;
  expiresAt?: string;
  enabled: boolean;
  uses: number;
  totalRevenue: number;
  totalCommission: number;
  createdAt: string;
  updatedAt: string;
};

const EMPTY_FORM = {
  code: "",
  nom: "",
  partnerName: "",
  partnerEmail: "",
  discountType: "percent" as DiscountType,
  discountValue: "",
  commissionRate: "",
  maxUses: "",
  expiresAt: "",
  enabled: true,
};

// ── Styles ─────────────────────────────────────────────────────────────────────

const inputCls = "w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:border-[#E8B800] focus:bg-white transition-colors placeholder-gray-400";
const labelCls = "block text-sm font-semibold text-gray-700 mb-1.5";

function fmt(n: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n));
}

// ── Auth Gate ──────────────────────────────────────────────────────────────────

export default function AdminPromoCodesPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState("");

  function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    if (password === ADMIN_PWD) setAuthed(true);
    else setAuthError("Mot de passe incorrect.");
  }

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-sm p-8 bg-white border border-gray-200 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <Tag size={24} className="text-[#E8B800]" />
            <h1 className="text-xl font-bold text-gray-900">Admin — Codes Promo</h1>
          </div>
          <form onSubmit={handleAuth} className="space-y-4">
            <input type="password" placeholder="Mot de passe admin" value={password}
              onChange={(e) => setPassword(e.target.value)} className={inputCls} autoFocus />
            {authError && <p className="text-red-500 text-sm">{authError}</p>}
            <button type="submit" className="w-full py-2.5 bg-[#E8B800] hover:bg-[#D4A017] text-black font-bold rounded-xl text-sm">
              Accéder
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <PromoCodesAdmin />;
}

// ── Main Component ─────────────────────────────────────────────────────────────

function PromoCodesAdmin() {
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/promo-codes?password=${ADMIN_PWD}`);
      const data = await res.json();
      setCodes(data.codes || []);
    } catch { setError("Erreur de chargement."); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setForm({ ...EMPTY_FORM });
    setEditId(null);
    setShowForm(true);
    setError("");
  }

  function openEdit(c: PromoCode) {
    setForm({
      code: c.code,
      nom: c.nom,
      partnerName: c.partnerName,
      partnerEmail: c.partnerEmail,
      discountType: c.discountType,
      discountValue: String(c.discountValue),
      commissionRate: String(c.commissionRate),
      maxUses: c.maxUses ? String(c.maxUses) : "",
      expiresAt: c.expiresAt ? c.expiresAt.slice(0, 10) : "",
      enabled: c.enabled,
    });
    setEditId(c.id);
    setShowForm(true);
    setError("");
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const code = form.code.trim().toUpperCase();
    if (!code) { setError("Le code est obligatoire."); return; }
    if (!form.discountValue || Number(form.discountValue) <= 0) { setError("La réduction doit être > 0."); return; }
    setSaving(true);
    setError("");
    try {
      const payload = {
        id: editId,
        code,
        nom: form.nom.trim() || code,
        partnerName: form.partnerName.trim(),
        partnerEmail: form.partnerEmail.trim(),
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        commissionRate: Number(form.commissionRate) || 0,
        maxUses: form.maxUses ? Number(form.maxUses) : undefined,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
        enabled: form.enabled,
      };
      const res = await fetch(`/api/admin/promo-codes?password=${ADMIN_PWD}`, {
        method: editId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error || "Erreur"); setSaving(false); return; }
      await load();
      setShowForm(false);
      setEditId(null);
    } catch { setError("Erreur réseau."); }
    setSaving(false);
  }

  async function toggleEnabled(c: PromoCode) {
    await fetch(`/api/admin/promo-codes?password=${ADMIN_PWD}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: c.id, enabled: !c.enabled }),
    });
    await load();
  }

  async function handleDelete(id: string) {
    setDeleteId(null);
    await fetch(`/api/admin/promo-codes?password=${ADMIN_PWD}&id=${id}`, { method: "DELETE" });
    await load();
  }

  // ── Stats globales ──
  const totalUses = codes.reduce((s, c) => s + c.uses, 0);
  const totalRevenue = codes.reduce((s, c) => s + c.totalRevenue, 0);
  const totalCommission = codes.reduce((s, c) => s + c.totalCommission, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="p-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-100 transition-colors">
              <ArrowLeft size={16} className="text-gray-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Tag size={22} className="text-[#E8B800]" /> Codes Promo & Partenaires
              </h1>
              <p className="text-gray-500 text-sm mt-0.5">Gérez vos codes promo influenceurs avec suivi des commissions</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={load} className="p-2 border border-gray-200 rounded-xl bg-white hover:bg-gray-100 transition-colors">
              <RefreshCw size={15} className="text-gray-600" />
            </button>
            <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-[#E8B800] hover:bg-[#D4A017] text-black font-bold rounded-xl text-sm transition-colors">
              <Plus size={15} /> Nouveau Code
            </button>
          </div>
        </div>

        {/* Stats globales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Codes actifs", value: codes.filter(c => c.enabled).length, icon: <Tag size={18} />, color: "text-[#E8B800]" },
            { label: "Total utilisations", value: totalUses, icon: <Users size={18} />, color: "text-blue-600" },
            { label: "CA généré (FCFA)", value: fmt(totalRevenue), icon: <TrendingUp size={18} />, color: "text-emerald-600" },
            { label: "Commissions dues (FCFA)", value: fmt(totalCommission), icon: <Award size={18} />, color: "text-purple-600" },
          ].map((s) => (
            <div key={s.label} className="p-4 bg-white border border-gray-200 rounded-2xl shadow-sm">
              <div className={`${s.color} mb-2`}>{s.icon}</div>
              <div className="text-2xl font-bold text-gray-900">{s.value}</div>
              <div className="text-gray-500 text-xs mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Form */}
        {showForm && (
          <PromoForm
            form={form}
            setForm={setForm}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditId(null); setError(""); }}
            saving={saving}
            error={error}
            editId={editId}
          />
        )}

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-[#E8B800]" />
          </div>
        ) : codes.length === 0 ? (
          <div className="text-center py-20">
            <Tag size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 font-semibold">Aucun code promo créé</p>
            <p className="text-gray-400 text-sm mt-1 mb-6">Créez votre premier code pour vos partenaires</p>
            <button onClick={openCreate} className="inline-flex items-center gap-2 px-6 py-3 bg-[#E8B800] text-black font-bold rounded-xl text-sm">
              <Plus size={15} /> Créer un Code Promo
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {codes.map((c) => (
              <PromoCodeCard
                key={c.id}
                c={c}
                onEdit={openEdit}
                onToggle={toggleEnabled}
                onDelete={(id) => setDeleteId(id)}
                deleteId={deleteId}
                onConfirmDelete={handleDelete}
                onCancelDelete={() => setDeleteId(null)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Form ───────────────────────────────────────────────────────────────────────

function PromoForm({
  form, setForm, onSave, onCancel, saving, error, editId,
}: {
  form: typeof EMPTY_FORM;
  setForm: React.Dispatch<React.SetStateAction<typeof EMPTY_FORM>>;
  onSave: (e: React.FormEvent) => void;
  onCancel: () => void;
  saving: boolean;
  error: string;
  editId: string | null;
}) {
  return (
    <div className="mb-8 p-6 bg-white border border-gray-200 rounded-2xl shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-gray-900">{editId ? "Modifier le code" : "Nouveau Code Promo"}</h2>
        <button onClick={onCancel} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"><X size={18} /></button>
      </div>

      <form onSubmit={onSave}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

          {/* Code */}
          <div>
            <label className={labelCls}>Code Promo <span className="text-red-400">*</span></label>
            <input type="text" value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase().replace(/\s+/g, "") }))}
              placeholder="TCHOP10" className={`${inputCls} uppercase font-mono font-bold tracking-wider`} />
            <p className="text-gray-400 text-xs mt-1">En majuscules, sans espace</p>
          </div>

          {/* Nom interne */}
          <div>
            <label className={labelCls}>Nom interne</label>
            <input type="text" value={form.nom}
              onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
              placeholder="Ex: Code Partenaire Tchop" className={inputCls} />
          </div>

          {/* Partenaire */}
          <div>
            <label className={labelCls}>Nom du partenaire / influenceur</label>
            <input type="text" value={form.partnerName}
              onChange={(e) => setForm((f) => ({ ...f, partnerName: e.target.value }))}
              placeholder="Ex: Romuald Nguemguang" className={inputCls} />
          </div>

          {/* Email partenaire */}
          <div>
            <label className={labelCls}>Email du partenaire</label>
            <input type="email" value={form.partnerEmail}
              onChange={(e) => setForm((f) => ({ ...f, partnerEmail: e.target.value }))}
              placeholder="partenaire@email.com" className={inputCls} />
          </div>

          {/* Réduction */}
          <div>
            <label className={labelCls}>Type de réduction <span className="text-red-400">*</span></label>
            <div className="flex gap-2 mb-2">
              {(["percent", "fixed"] as DiscountType[]).map((t) => (
                <button key={t} type="button"
                  onClick={() => setForm((f) => ({ ...f, discountType: t }))}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-colors flex-1 justify-center ${
                    form.discountType === t ? "bg-[#E8B800] border-[#D4A017] text-black" : "bg-gray-50 border-gray-200 text-gray-600 hover:border-[#E8B800]"
                  }`}
                >
                  {t === "percent" ? <><Percent size={11} /> Pourcentage</> : <><DollarSign size={11} /> Montant fixe</>}
                </button>
              ))}
            </div>
            <div className="relative">
              <input type="number" value={form.discountValue}
                onChange={(e) => setForm((f) => ({ ...f, discountValue: e.target.value }))}
                placeholder={form.discountType === "percent" ? "10" : "1000"}
                min={0} max={form.discountType === "percent" ? 100 : undefined}
                className={inputCls} />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-semibold">
                {form.discountType === "percent" ? "%" : "FCFA"}
              </span>
            </div>
          </div>

          {/* Commission */}
          <div>
            <label className={labelCls}>Taux de commission partenaire</label>
            <div className="relative">
              <input type="number" value={form.commissionRate}
                onChange={(e) => setForm((f) => ({ ...f, commissionRate: e.target.value }))}
                placeholder="50" min={0} max={100} className={inputCls} />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-semibold">%</span>
            </div>
            <p className="text-gray-400 text-xs mt-1">% du montant final dû au partenaire (ex: 50%)</p>
          </div>

          {/* Max utilisations */}
          <div>
            <label className={labelCls}>Nombre max d&apos;utilisations</label>
            <input type="number" value={form.maxUses}
              onChange={(e) => setForm((f) => ({ ...f, maxUses: e.target.value }))}
              placeholder="Illimité (laisser vide)" min={1} className={inputCls} />
          </div>

          {/* Date d'expiration */}
          <div>
            <label className={labelCls}>Date d&apos;expiration</label>
            <input type="date" value={form.expiresAt}
              onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
              className={inputCls} />
          </div>

          {/* Statut */}
          <div className="sm:col-span-2">
            <label className={labelCls}>Statut</label>
            <button type="button" onClick={() => setForm((f) => ({ ...f, enabled: !f.enabled }))}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-colors ${
                form.enabled ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-gray-100 border-gray-200 text-gray-500"
              }`}
            >
              {form.enabled ? <ToggleRight size={18} className="text-emerald-600" /> : <ToggleLeft size={18} />}
              {form.enabled ? "Actif — les clients peuvent utiliser ce code" : "Inactif — code désactivé"}
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
            <AlertCircle size={15} /> {error}
          </div>
        )}

        <div className="flex gap-3 mt-5">
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#E8B800] hover:bg-[#D4A017] disabled:opacity-60 text-black font-bold rounded-xl text-sm transition-colors">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {editId ? "Mettre à jour" : "Créer le Code"}
          </button>
          <button type="button" onClick={onCancel}
            className="px-5 py-2.5 border border-gray-200 text-gray-600 font-semibold rounded-xl text-sm hover:bg-gray-50 transition-colors">
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Card ───────────────────────────────────────────────────────────────────────

function PromoCodeCard({
  c, onEdit, onToggle, onDelete, deleteId, onConfirmDelete, onCancelDelete,
}: {
  c: PromoCode;
  onEdit: (c: PromoCode) => void;
  onToggle: (c: PromoCode) => void;
  onDelete: (id: string) => void;
  deleteId: string | null;
  onConfirmDelete: (id: string) => void;
  onCancelDelete: () => void;
}) {
  const commission = c.totalRevenue > 0 && c.commissionRate > 0
    ? Math.round(c.totalRevenue * c.commissionRate / 100)
    : c.totalCommission;

  const isExpired = c.expiresAt && new Date(c.expiresAt) < new Date();
  const maxReached = c.maxUses && c.uses >= c.maxUses;

  return (
    <div className={`p-5 bg-white border rounded-2xl shadow-sm ${!c.enabled ? "opacity-60" : ""} ${isExpired || maxReached ? "border-orange-200" : "border-gray-200"}`}>
      <div className="flex items-start justify-between gap-4 flex-wrap">

        {/* Code + Partner */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap mb-1">
            <span className="font-mono font-bold text-lg text-gray-900 bg-gray-100 px-3 py-1 rounded-lg tracking-wider">
              {c.code}
            </span>
            <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${
              c.enabled && !isExpired && !maxReached
                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                : "bg-gray-100 border-gray-200 text-gray-500"
            }`}>
              {!c.enabled ? "Désactivé" : isExpired ? "Expiré" : maxReached ? "Limite atteinte" : "Actif"}
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-600 font-semibold">
              {c.discountType === "percent" ? <Percent size={11} /> : <DollarSign size={11} />}
              {c.discountType === "percent" ? `${c.discountValue}% de remise` : `${fmt(c.discountValue)} FCFA de remise`}
            </span>
          </div>
          {c.partnerName && (
            <p className="text-gray-600 text-sm font-semibold flex items-center gap-1.5">
              <Users size={13} className="text-[#E8B800]" /> {c.partnerName}
              {c.partnerEmail && <span className="text-gray-400 font-normal">· {c.partnerEmail}</span>}
            </p>
          )}
          {c.nom !== c.code && <p className="text-gray-400 text-xs mt-0.5">{c.nom}</p>}
          {c.expiresAt && (
            <p className={`text-xs mt-0.5 ${isExpired ? "text-red-400" : "text-gray-400"}`}>
              {isExpired ? "Expiré le" : "Expire le"} {new Date(c.expiresAt).toLocaleDateString("fr-FR")}
            </p>
          )}
          {c.maxUses && (
            <p className="text-gray-400 text-xs mt-0.5">
              {c.uses}/{c.maxUses} utilisations max
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 flex-shrink-0">
          <div className="text-center p-3 bg-blue-50 border border-blue-100 rounded-xl min-w-[72px]">
            <div className="text-blue-700 font-bold text-xl">{c.uses}</div>
            <div className="text-blue-500 text-xs mt-0.5">utilisation{c.uses !== 1 ? "s" : ""}</div>
          </div>
          <div className="text-center p-3 bg-emerald-50 border border-emerald-100 rounded-xl min-w-[90px]">
            <div className="text-emerald-700 font-bold text-base">{fmt(c.totalRevenue)}</div>
            <div className="text-emerald-500 text-xs mt-0.5">CA (FCFA)</div>
          </div>
          <div className="text-center p-3 bg-purple-50 border border-purple-100 rounded-xl min-w-[90px]">
            <div className="text-purple-700 font-bold text-base">{fmt(commission)}</div>
            <div className="text-purple-500 text-xs mt-0.5">Commission {c.commissionRate > 0 ? `(${c.commissionRate}%)` : ""}</div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100 flex-wrap">
        <button onClick={() => onToggle(c)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-colors ${
            c.enabled ? "bg-gray-50 border-gray-200 text-gray-600 hover:border-orange-300" : "bg-emerald-50 border-emerald-200 text-emerald-700"
          }`}
        >
          {c.enabled ? <><ToggleLeft size={13} /> Désactiver</> : <><ToggleRight size={13} className="text-emerald-600" /> Activer</>}
        </button>
        <button onClick={() => onEdit(c)}
          className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-700 text-xs font-semibold rounded-xl transition-colors">
          <Pencil size={12} /> Modifier
        </button>
        {deleteId === c.id ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-red-500 font-semibold">Confirmer la suppression ?</span>
            <button onClick={() => onConfirmDelete(c.id)} className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-xl transition-colors">Oui</button>
            <button onClick={onCancelDelete} className="px-3 py-2 border border-gray-200 text-gray-600 text-xs font-semibold rounded-xl hover:bg-gray-50 transition-colors">Annuler</button>
          </div>
        ) : (
          <button onClick={() => onDelete(c.id)}
            className="flex items-center gap-1.5 px-3 py-2 bg-red-50 border border-red-200 hover:bg-red-100 text-red-600 text-xs font-semibold rounded-xl transition-colors">
            <Trash2 size={12} /> Supprimer
          </button>
        )}

        {c.totalRevenue > 0 && c.commissionRate > 0 && (
          <span className="ml-auto flex items-center gap-1.5 text-xs text-purple-600 font-semibold bg-purple-50 border border-purple-100 px-3 py-2 rounded-xl">
            <Award size={12} /> Commission à verser : {fmt(commission)} FCFA
          </span>
        )}
        {c.uses > 0 && (
          <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
            <CheckCircle size={12} /> {c.uses} vente{c.uses > 1 ? "s" : ""} via ce code
          </span>
        )}
      </div>
    </div>
  );
}