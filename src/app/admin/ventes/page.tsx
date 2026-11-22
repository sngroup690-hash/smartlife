"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ShoppingBag, TrendingUp, XCircle, Clock, ArrowLeft, RefreshCw,
  Download, Phone, MessageCircle, Search, CheckCircle, AlertCircle,
  Users, DollarSign,
} from "lucide-react";
import type { UnifiedTransaction, TransactionStatus } from "@/lib/transaction-store";

// ── Types ──────────────────────────────────────────────────────────────────────

type Kpis = {
  total: number; successful: number; failed: number;
  abandoned: number; pending: number; revenue: number;
};

// ── Utilitaires ────────────────────────────────────────────────────────────────

function formatPrice(n: number) {
  return n >= 1000 ? `${Math.round(n / 1000)} K FCFA` : `${n} FCFA`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function formatWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("00237")) return digits.slice(2);
  if (digits.startsWith("237")) return digits;
  return "237" + digits;
}

function waMessage(t: UnifiedTransaction): string {
  const name = t.customerName || "Client";
  const product = t.product || "ce produit";
  if (t.status === "failed") {
    return `Bonjour ${name}, votre paiement pour "${product}" n'a pas abouti. Souhaitez-vous réessayer ou avez-vous besoin d'aide ? 💳`;
  }
  if (t.status === "abandoned" || t.status === "pending") {
    return `Bonjour ${name}, nous avons remarqué que vous n'avez pas finalisé votre achat de "${product}". Avez-vous des questions ? 😊`;
  }
  return `Bonjour ${name}, merci pour votre achat de "${product}". Comment puis-je vous aider ?`;
}

// ── Composants ─────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: TransactionStatus }) {
  const cfg: Record<TransactionStatus, { cls: string; icon: React.ReactNode; label: string }> = {
    successful: {
      cls: "bg-emerald-50 border border-emerald-200 text-emerald-700",
      icon: <CheckCircle size={11} />,
      label: "Réussi",
    },
    failed: {
      cls: "bg-red-50 border border-red-200 text-red-600",
      icon: <XCircle size={11} />,
      label: "Échoué",
    },
    abandoned: {
      cls: "bg-gray-100 border border-gray-200 text-gray-600",
      icon: <AlertCircle size={11} />,
      label: "Abandonné",
    },
    pending: {
      cls: "bg-yellow-50 border border-yellow-200 text-yellow-700",
      icon: <Clock size={11} />,
      label: "En attente",
    },
  };
  const { cls, icon, label } = cfg[status] ?? cfg.pending;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${cls}`}>
      {icon} {label}
    </span>
  );
}

function KpiCard({
  icon, label, value, sub, color = "text-green-600",
}: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string; color?: string;
}) {
  return (
    <div className="p-5 bg-white border border-gray-200 rounded-2xl shadow-sm">
      <div className="flex items-center gap-2 text-gray-400 text-xs font-medium mb-3">{icon} {label}</div>
      <div className={`text-2xl font-extrabold ${color} mb-0.5`}>{value}</div>
      {sub && <div className="text-gray-400 text-xs">{sub}</div>}
    </div>
  );
}

const STATUS_TABS: { key: TransactionStatus | "all"; label: string }[] = [
  { key: "all", label: "Toutes" },
  { key: "successful", label: "Réussies" },
  { key: "failed", label: "Échouées" },
  { key: "abandoned", label: "Abandonnées" },
  { key: "pending", label: "En attente" },
];

function toIso(d: Date) { return d.toISOString().slice(0, 10); }
function daysAgo(n: number) { return toIso(new Date(Date.now() - n * 86400000)); }

// ── Page principale ────────────────────────────────────────────────────────────

export default function VentesPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState("");

  const [data, setData] = useState<UnifiedTransaction[]>([]);
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [loading, setLoading] = useState(false);

  const [tab, setTab] = useState<TransactionStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState(daysAgo(30));
  const [to, setTo] = useState(toIso(new Date()));

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setAuthError("");
    const res = await fetch("/api/admin/login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) setAuthed(true);
    else setAuthError("Mot de passe incorrect");
  }

  const fetchData = useCallback(async (pw: string, f: string, t: string) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/transactions?password=${encodeURIComponent(pw)}&from=${f}&to=${t}`
      );
      if (res.ok) {
        const json = await res.json();
        setData(json.transactions ?? []);
        setKpis(json.kpis ?? null);
      }
    } catch { /* silent */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!authed) return;
    fetchData(password, from, to);
  }, [authed, password, from, to, fetchData]);

  function handleExportCsv() {
    const params = new URLSearchParams({
      password,
      format: "csv",
      from,
      to,
      ...(tab !== "all" ? { status: tab } : {}),
    });
    window.open(`/api/admin/transactions?${params}`, "_blank");
  }

  // ── Filtrage local ──
  const filtered = data.filter(t => {
    if (tab !== "all" && t.status !== tab) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !t.customerName.toLowerCase().includes(q) &&
        !t.customerEmail.toLowerCase().includes(q) &&
        !t.customerPhone.includes(q) &&
        !t.product.toLowerCase().includes(q) &&
        !t.reference.toLowerCase().includes(q)
      ) return false;
    }
    return true;
  });

  // ── Login ──
  if (!authed) {
    return (
      <div className="min-h-screen bg-[#f9f8f5] flex items-center justify-center px-4">
        <div className="bg-white border border-gray-200 rounded-2xl shadow p-8 w-full max-w-sm">
          <div className="flex items-center gap-3 mb-6">
            <ShoppingBag size={24} className="text-green-600" />
            <h1 className="text-xl font-bold text-gray-900">Ventes & Clients</h1>
          </div>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Mot de passe admin" autoFocus
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 text-sm focus:outline-none focus:border-green-500"
            />
            {authError && <p className="text-red-500 text-xs">{authError}</p>}
            <button type="submit" className="py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-colors">
              Accéder au dashboard
            </button>
          </form>
          <Link href="/admin" className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 mt-4 justify-center">
            <ArrowLeft size={12} /> Retour au panneau admin
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9f8f5]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="flex items-center gap-1.5 text-gray-400 hover:text-gray-600 text-sm">
              <ArrowLeft size={15} /> Admin
            </Link>
            <span className="text-gray-300">/</span>
            <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <ShoppingBag size={18} className="text-green-600" /> Ventes & Clients
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchData(password, from, to)}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl text-xs font-medium transition-colors disabled:opacity-50"
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Actualiser
            </button>
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-medium transition-colors"
            >
              <Download size={13} /> Exporter CSV
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">

        {/* KPI Cards */}
        {kpis && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <KpiCard
              icon={<DollarSign size={14} />} label="Revenus" color="text-green-600"
              value={formatPrice(kpis.revenue)}
              sub={`${kpis.successful} vente${kpis.successful > 1 ? "s" : ""}`}
            />
            <KpiCard
              icon={<CheckCircle size={14} />} label="Réussies" color="text-emerald-600"
              value={kpis.successful}
            />
            <KpiCard
              icon={<XCircle size={14} />} label="Échouées" color="text-red-500"
              value={kpis.failed}
            />
            <KpiCard
              icon={<AlertCircle size={14} />} label="Abandonnées" color="text-gray-600"
              value={kpis.abandoned}
            />
            <KpiCard
              icon={<Clock size={14} />} label="En attente" color="text-yellow-600"
              value={kpis.pending}
            />
            <KpiCard
              icon={<Users size={14} />} label="Total transactions" color="text-blue-600"
              value={kpis.total}
            />
          </div>
        )}

        {/* Filtres */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Recherche */}
            <div className="relative flex-1 min-w-48">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Nom, email, téléphone, produit…"
                className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:border-green-400 bg-gray-50"
              />
            </div>
            {/* Dates */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="text-xs text-gray-400">Du</span>
              <input
                type="date" value={from} onChange={e => setFrom(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:border-green-400"
              />
              <span className="text-xs text-gray-400">au</span>
              <input
                type="date" value={to} onChange={e => setTo(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:border-green-400"
              />
            </div>
            {/* Raccourcis date */}
            <div className="flex gap-1">
              {[
                { label: "7J", days: 7 },
                { label: "30J", days: 30 },
                { label: "90J", days: 90 },
              ].map(r => (
                <button
                  key={r.label}
                  onClick={() => { setFrom(daysAgo(r.days)); setTo(toIso(new Date())); }}
                  className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Onglets statut */}
          <div className="flex gap-1 mt-3 border-t border-gray-100 pt-3 overflow-x-auto">
            {STATUS_TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                  tab === t.key
                    ? "bg-green-600 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {t.label}
                {t.key !== "all" && kpis && (
                  <span className="ml-1.5 opacity-70">
                    ({kpis[t.key as keyof Kpis] as number})
                  </span>
                )}
                {t.key === "all" && kpis && (
                  <span className="ml-1.5 opacity-70">({kpis.total})</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tableau */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm gap-2">
              <RefreshCw size={16} className="animate-spin" /> Chargement…
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400 text-sm gap-2">
              <TrendingUp size={32} className="opacity-30" />
              <span>Aucune transaction trouvée</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Client</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Téléphone</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Produit</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Montant</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map(t => {
                    const wa = formatWhatsApp(t.customerPhone);
                    const msg = waMessage(t);
                    return (
                      <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                        {/* Date */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-gray-800 font-medium text-xs">{formatDate(t.ts)}</div>
                          <div className="text-gray-400 text-xs">{formatTime(t.ts)}</div>
                        </td>
                        {/* Client */}
                        <td className="px-4 py-3 max-w-48">
                          <div className="text-gray-800 font-semibold text-sm truncate">
                            {t.customerName || <span className="text-gray-400 italic">—</span>}
                          </div>
                          <div className="text-gray-500 text-xs truncate">{t.customerEmail || "—"}</div>
                        </td>
                        {/* Téléphone */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-gray-700 text-xs font-mono">{t.customerPhone || "—"}</span>
                        </td>
                        {/* Produit */}
                        <td className="px-4 py-3 max-w-56">
                          <span className="text-gray-700 text-xs line-clamp-2">{t.product || "—"}</span>
                        </td>
                        {/* Montant */}
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <span className="text-gray-800 font-bold text-sm">{t.amount.toLocaleString("fr-FR")} FCFA</span>
                        </td>
                        {/* Statut */}
                        <td className="px-4 py-3 text-center">
                          <StatusBadge status={t.status} />
                        </td>
                        {/* Actions */}
                        <td className="px-4 py-3 text-center">
                          {t.customerPhone ? (
                            <div className="flex items-center justify-center gap-2">
                              <a
                                href={`tel:+${formatWhatsApp(t.customerPhone)}`}
                                title="Appeler"
                                className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors"
                              >
                                <Phone size={14} />
                              </a>
                              {wa && (
                                <a
                                  href={`https://wa.me/${wa}?text=${encodeURIComponent(msg)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="WhatsApp"
                                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-green-50 hover:bg-green-100 text-green-600 transition-colors"
                                >
                                  <MessageCircle size={14} />
                                </a>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-300 text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {filtered.length > 0 && (
          <p className="text-xs text-gray-400 text-right">
            {filtered.length} transaction{filtered.length > 1 ? "s" : ""}
            {tab !== "all" ? ` (${STATUS_TABS.find(s => s.key === tab)?.label?.toLowerCase()})` : ""}
          </p>
        )}
      </div>
    </div>
  );
}
