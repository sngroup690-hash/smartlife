"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft, Save, Crown, CheckCircle, XCircle, Clock,
  RefreshCw, Loader2, Users, Settings, AlertCircle,
} from "lucide-react";
import type { VipConfig, VipSubscription } from "@/lib/vip-store";

const ADMIN_PASSWORD_KEY = "sl_admin_pw";

function getAdminPw(): string {
  try { return localStorage.getItem(ADMIN_PASSWORD_KEY) || ""; } catch { return ""; }
}

// ── Password gate ──────────────────────────────────────────────────────────────

function PasswordGate({ onAuth }: { onAuth: (pw: string) => void }) {
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");

  async function handle(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/admin/vip`, {
      headers: { "x-admin-password": pw },
    });
    if (res.ok) { onAuth(pw); }
    else setError("Mot de passe incorrect");
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <form onSubmit={handle} className="w-full max-w-sm space-y-4">
        <div className="text-center mb-6">
          <Crown size={40} className="text-purple-600 mx-auto mb-3" />
          <h1 className="text-gray-900 font-bold text-2xl">Admin — SmartLife Pass</h1>
        </div>
        <input
          type="password" value={pw} onChange={e => setPw(e.target.value)}
          placeholder="Mot de passe admin"
          className="w-full px-4 py-3 border border-green-300 rounded-xl text-gray-900 focus:outline-none focus:border-green-500"
          autoFocus
        />
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        <button type="submit" className="w-full py-3 bg-gradient-to-r from-purple-600 to-purple-800 text-white font-bold rounded-xl">
          Accéder
        </button>
        <div className="text-center">
          <Link href="/admin" className="text-gray-400 text-sm hover:text-gray-600">← Retour au panel</Link>
        </div>
      </form>
    </div>
  );
}

// ── Types enrichis ─────────────────────────────────────────────────────────────

type EnrichedSub = VipSubscription & { isActive: boolean; daysLeft: number };

// ── Page principale ────────────────────────────────────────────────────────────

function VipAdminPage({ adminPw }: { adminPw: string }) {
  const [config, setConfig] = useState<VipConfig | null>(null);
  const [subs, setSubs] = useState<EnrichedSub[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Config form state
  const [enabled, setEnabled] = useState(true);
  const [monthlyPrice, setMonthlyPrice] = useState(5000);
  const [annualPrice, setAnnualPrice] = useState(45000);
  const [communityLink, setCommunityLink] = useState("");
  const [communityType, setCommunityType] = useState<"whatsapp" | "telegram" | "discord" | "other">("whatsapp");
  const [currency, setCurrency] = useState("XAF");

  // Extend modal
  const [extendTarget, setExtendTarget] = useState<string | null>(null);
  const [extendMonths, setExtendMonths] = useState(1);

  const headers = { "Content-Type": "application/json", "x-admin-password": adminPw };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/vip", { headers: { "x-admin-password": adminPw } });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setConfig(data.config);
      setSubs(data.subscriptions || []);
      setEnabled(data.config.enabled ?? true);
      setMonthlyPrice(data.config.monthlyPrice ?? 5000);
      setAnnualPrice(data.config.annualPrice ?? 45000);
      setCommunityLink(data.config.communityLink ?? "");
      setCommunityType(data.config.communityType ?? "whatsapp");
      setCurrency(data.config.currency ?? "XAF");
    } catch {
      setMsg({ type: "err", text: "Erreur lors du chargement" });
    } finally {
      setLoading(false);
    }
  }, [adminPw]);

  useEffect(() => { load(); }, [load]);

  async function saveConfig() {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/vip", {
        method: "POST",
        headers,
        body: JSON.stringify({
          action: "updateConfig",
          config: { enabled, monthlyPrice, annualPrice, communityLink, communityType, currency },
        }),
      });
      if (!res.ok) throw new Error();
      setMsg({ type: "ok", text: "Configuration sauvegardée" });
      await load();
    } catch {
      setMsg({ type: "err", text: "Erreur lors de la sauvegarde" });
    } finally {
      setSaving(false);
    }
  }

  async function doAction(action: string, userId: string, extra?: Record<string, unknown>) {
    setActionLoading(userId + action);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/vip", {
        method: "POST",
        headers,
        body: JSON.stringify({ action, userId, ...extra }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Erreur");
      setMsg({ type: "ok", text: `Action "${action}" effectuée` });
      await load();
    } catch (e) {
      setMsg({ type: "err", text: e instanceof Error ? e.message : "Erreur" });
    } finally {
      setActionLoading(null);
      setExtendTarget(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-purple-600" />
      </div>
    );
  }

  const activeSubs = subs.filter(s => s.isActive);
  const expiredSubs = subs.filter(s => !s.isActive);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-gray-400 hover:text-gray-700">
            <ArrowLeft size={20} />
          </Link>
          <Crown size={24} className="text-purple-600" />
          <h1 className="text-gray-900 font-bold text-xl">SmartLife Pass — Administration</h1>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
        >
          <RefreshCw size={14} /> Actualiser
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">

        {/* Message feedback */}
        {msg && (
          <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${
            msg.type === "ok" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
          }`}>
            {msg.type === "ok" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            {msg.text}
          </div>
        )}

        {/* Stats rapides */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total abonnés", value: subs.length, color: "purple" },
            { label: "Abonnements actifs", value: activeSubs.length, color: "green" },
            { label: "Expirés / annulés", value: expiredSubs.length, color: "gray" },
            { label: "Crédits formation", value: subs.reduce((a, s) => a + (s.formationCredits || 0), 0), color: "blue" },
          ].map(stat => (
            <div key={stat.label} className="bg-white border border-gray-200 rounded-2xl p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Configuration */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <Settings size={20} className="text-purple-600" />
            <h2 className="text-gray-900 font-bold text-lg">Configuration du Pass VIP</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Activer/désactiver */}
            <div className="sm:col-span-2 flex items-center gap-3">
              <label className="font-semibold text-gray-700 text-sm">Activer le SmartLife Pass</label>
              <button
                onClick={() => setEnabled(!enabled)}
                className={`relative w-12 h-6 rounded-full transition-colors ${enabled ? "bg-purple-600" : "bg-gray-300"}`}
              >
                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${enabled ? "left-7" : "left-1"}`} />
              </button>
              <span className={`text-xs font-bold ${enabled ? "text-green-600" : "text-gray-400"}`}>
                {enabled ? "Actif" : "Désactivé"}
              </span>
            </div>

            {/* Prix mensuel */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Prix mensuel ({currency})</label>
              <input
                type="number" value={monthlyPrice} onChange={e => setMonthlyPrice(Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-purple-400"
              />
            </div>

            {/* Prix annuel */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Prix annuel ({currency})</label>
              <input
                type="number" value={annualPrice} onChange={e => setAnnualPrice(Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-purple-400"
              />
            </div>

            {/* Devise */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Devise</label>
              <select
                value={currency} onChange={e => setCurrency(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-purple-400"
              >
                {["XAF", "XOF", "EUR", "USD"].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>

            {/* Type de communauté */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Plateforme communauté</label>
              <select
                value={communityType} onChange={e => setCommunityType(e.target.value as typeof communityType)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-purple-400"
              >
                {(["whatsapp", "telegram", "discord", "other"] as const).map(t => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>

            {/* Lien communauté */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Lien du groupe privé</label>
              <input
                type="url" value={communityLink} onChange={e => setCommunityLink(e.target.value)}
                placeholder="https://chat.whatsapp.com/..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-purple-400"
              />
              <p className="text-xs text-gray-400 mt-1">Lien visible uniquement pour les membres VIP actifs</p>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={saveConfig}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl disabled:opacity-60"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Sauvegarder
            </button>
          </div>
        </div>

        {/* Abonnés actifs */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <Users size={20} className="text-green-600" />
            <h2 className="text-gray-900 font-bold text-lg">Abonnés actifs ({activeSubs.length})</h2>
          </div>

          {activeSubs.length === 0 ? (
            <p className="text-center text-gray-400 py-8">Aucun abonné actif pour l&apos;instant</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    {["Nom / Email", "Plan", "Expire le", "Jours restants", "Crédits formation", "Actions"].map(h => (
                      <th key={h} className="text-left py-2 px-3 text-gray-500 font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activeSubs.map(sub => (
                    <SubRow
                      key={sub.id}
                      sub={sub}
                      actionLoading={actionLoading}
                      onExtend={(uid) => { setExtendTarget(uid); setExtendMonths(1); }}
                      onCancel={(uid) => doAction("cancel", uid)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Abonnés expirés/annulés */}
        {expiredSubs.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <Clock size={20} className="text-gray-400" />
              <h2 className="text-gray-900 font-bold text-lg">Expirés / Annulés ({expiredSubs.length})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    {["Nom / Email", "Plan", "Expiré le", "Statut", "Actions"].map(h => (
                      <th key={h} className="text-left py-2 px-3 text-gray-500 font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {expiredSubs.map(sub => (
                    <SubRow
                      key={sub.id}
                      sub={sub}
                      actionLoading={actionLoading}
                      onExtend={(uid) => { setExtendTarget(uid); setExtendMonths(1); }}
                      onCancel={(uid) => doAction("cancel", uid)}
                      onActivate={(uid) => doAction("activate", uid)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* Modal prolongation */}
      {extendTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <h3 className="text-gray-900 font-bold text-lg mb-4">Prolonger l&apos;abonnement</h3>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre de mois</label>
            <input
              type="number" min={1} max={24} value={extendMonths}
              onChange={e => setExtendMonths(Number(e.target.value))}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 mb-4 focus:outline-none focus:border-purple-400"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setExtendTarget(null)}
                className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-600 font-semibold"
              >
                Annuler
              </button>
              <button
                onClick={() => doAction("extend", extendTarget, { months: extendMonths })}
                disabled={actionLoading !== null}
                className="flex-1 py-3 bg-purple-600 text-white font-bold rounded-xl disabled:opacity-60"
              >
                {actionLoading ? <Loader2 size={16} className="animate-spin mx-auto" /> : "Prolonger"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Ligne abonné ───────────────────────────────────────────────────────────────

function SubRow({
  sub, actionLoading, onExtend, onCancel, onActivate,
}: {
  sub: EnrichedSub;
  actionLoading: string | null;
  onExtend: (uid: string) => void;
  onCancel: (uid: string) => void;
  onActivate?: (uid: string) => void;
}) {
  const busy = (suf: string) => actionLoading === sub.userId + suf;

  return (
    <tr className="border-b border-gray-50 hover:bg-gray-50">
      <td className="py-3 px-3">
        <p className="font-semibold text-gray-900">{sub.userName || sub.userId}</p>
        <p className="text-xs text-gray-400">{sub.userEmail}</p>
        {sub.userPhone && <p className="text-xs text-gray-400">{sub.userPhone}</p>}
      </td>
      <td className="py-3 px-3">
        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
          sub.plan === "annual" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
        }`}>
          {sub.plan === "annual" ? "Annuel" : "Mensuel"}
        </span>
      </td>
      <td className="py-3 px-3 text-gray-600 text-xs">
        {new Date(sub.expiresAt).toLocaleDateString("fr-FR")}
      </td>
      <td className="py-3 px-3">
        {sub.isActive ? (
          <span className="flex items-center gap-1 text-green-600 font-semibold">
            <CheckCircle size={14} /> {sub.daysLeft}j
          </span>
        ) : (
          <span className="flex items-center gap-1 text-red-400 text-xs">
            <XCircle size={14} /> {sub.status}
          </span>
        )}
      </td>
      {sub.isActive && (
        <td className="py-3 px-3 text-center font-bold text-purple-700">{sub.formationCredits}</td>
      )}
      {!sub.isActive && (
        <td className="py-3 px-3">
          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
            sub.status === "cancelled" ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-500"
          }`}>
            {sub.status}
          </span>
        </td>
      )}
      <td className="py-3 px-3">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onExtend(sub.userId)}
            disabled={busy("extend")}
            className="px-2 py-1 text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg font-semibold disabled:opacity-50"
          >
            +Prolonger
          </button>
          {sub.isActive && (
            <button
              onClick={() => onCancel(sub.userId)}
              disabled={busy("cancel")}
              className="px-2 py-1 text-xs bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg font-semibold disabled:opacity-50"
            >
              {busy("cancel") ? "…" : "Annuler"}
            </button>
          )}
          {!sub.isActive && onActivate && (
            <button
              onClick={() => onActivate(sub.userId)}
              disabled={busy("activate")}
              className="px-2 py-1 text-xs bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-lg font-semibold disabled:opacity-50"
            >
              {busy("activate") ? "…" : "Réactiver"}
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

// ── Export ─────────────────────────────────────────────────────────────────────

export default function AdminVipPageRoot() {
  const [adminPw, setAdminPw] = useState<string | null>(null);

  useEffect(() => {
    const stored = getAdminPw();
    if (stored) {
      fetch("/api/admin/vip", { headers: { "x-admin-password": stored } })
        .then(r => { if (r.ok) setAdminPw(stored); })
        .catch(() => {});
    }
  }, []);

  if (!adminPw) return <PasswordGate onAuth={(pw) => { localStorage.setItem(ADMIN_PASSWORD_KEY, pw); setAdminPw(pw); }} />;
  return <VipAdminPage adminPw={adminPw} />;
}
