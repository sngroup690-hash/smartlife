"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Save, RefreshCw, Trash2 } from "lucide-react";
import type { AutomationsConfig, AutomationTask } from "@/lib/automation-engine";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "panier" | "post_achat" | "bienvenue" | "journal";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: AutomationTask["status"] }) {
  const map: Record<AutomationTask["status"], string> = {
    pending: "bg-yellow-50 border-yellow-200 text-yellow-700",
    sent: "bg-emerald-50 border-emerald-200 text-emerald-700",
    failed: "bg-red-50 border-red-200 text-red-700",
    cancelled: "bg-gray-100 border-gray-200 text-gray-500",
  };
  const labels: Record<AutomationTask["status"], string> = {
    pending: "En attente",
    sent: "Envoyé",
    failed: "Échec",
    cancelled: "Annulé",
  };
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full border font-bold ${map[status]}`}>
      {labels[status]}
    </span>
  );
}

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AutomationsAdminPage() {
  const [password, setPassword] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState("");

  const [tab, setTab] = useState<Tab>("panier");
  const [config, setConfig] = useState<AutomationsConfig | null>(null);
  const [queue, setQueue] = useState<AutomationTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [saveMsg, setSaveMsg] = useState<Record<string, string>>({});

  // ── Auth ──

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setAuthError("");
    fetch("/api/admin/automations", {
      headers: { "x-admin-password": passwordInput },
    }).then((r) => {
      if (r.ok) {
        setPassword(passwordInput);
      } else {
        setAuthError("Mot de passe incorrect.");
      }
    }).catch(() => setAuthError("Erreur réseau."));
  }

  // ── Fetch ──

  const fetchConfig = useCallback(async () => {
    if (!password) return;
    const r = await fetch("/api/admin/automations", {
      headers: { "x-admin-password": password },
    });
    if (r.ok) setConfig(await r.json() as AutomationsConfig);
  }, [password]);

  const fetchQueue = useCallback(async () => {
    if (!password) return;
    setLoading(true);
    try {
      const r = await fetch("/api/admin/automations/queue", {
        headers: { "x-admin-password": password },
      });
      if (r.ok) setQueue(await r.json() as AutomationTask[]);
    } finally {
      setLoading(false);
    }
  }, [password]);

  useEffect(() => {
    if (!password) return;
    fetchConfig();
    fetchQueue();
  }, [password, fetchConfig, fetchQueue]);

  // ── Save ──

  async function saveSection(section: keyof AutomationsConfig) {
    if (!config) return;
    setSaveMsg((m) => ({ ...m, [section]: "Sauvegarde…" }));
    const r = await fetch("/api/admin/automations", {
      method: "POST",
      headers: { "x-admin-password": password, "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    setSaveMsg((m) => ({ ...m, [section]: r.ok ? "✓ Sauvegardé" : "Erreur" }));
    setTimeout(() => setSaveMsg((m) => ({ ...m, [section]: "" })), 3000);
  }

  // ── Clear queue ──

  async function clearQueue() {
    if (!confirm("Supprimer les tâches terminées (envoyées/échouées/annulées) ?")) return;
    const r = await fetch("/api/admin/automations/queue", {
      method: "DELETE",
      headers: { "x-admin-password": password },
    });
    if (r.ok) {
      const d = await r.json() as { removed: number };
      alert(`${d.removed} tâche(s) supprimée(s).`);
      fetchQueue();
    }
  }

  // ── Password form ──

  if (!password) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4 p-8 bg-white border border-gray-200 rounded-2xl shadow-sm">
          <h1 className="text-gray-900 font-bold text-xl mb-2">Automations Marketing</h1>
          <p className="text-gray-500 text-sm">Entrez le mot de passe administrateur.</p>
          <input
            type="password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            placeholder="Mot de passe admin"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-green-500"
          />
          {authError && <p className="text-red-600 text-sm">{authError}</p>}
          <button type="submit" className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl transition-colors">
            Accéder
          </button>
          <Link href="/admin" className="flex items-center gap-1.5 text-gray-400 text-sm hover:text-gray-600 mt-2">
            <ArrowLeft size={14} /> Retour au panel admin
          </Link>
        </form>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const inputCls = "w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-green-500 text-sm transition-colors";
  const labelCls = "block text-gray-700 font-bold text-sm mb-1.5";
  const sectionCard = "p-6 bg-white border border-gray-200 rounded-2xl space-y-5 shadow-sm";

  const tabs: { key: Tab; label: string }[] = [
    { key: "panier", label: "Panier abandonné" },
    { key: "post_achat", label: "Post-achat" },
    { key: "bienvenue", label: "Séquence bienvenue" },
    { key: "journal", label: "Journal" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <Link href="/admin" className="flex items-center gap-1.5 text-green-600 text-sm hover:text-green-700 mb-3 font-medium">
              <ArrowLeft size={14} /> Panel admin
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Automations Marketing</h1>
            <p className="text-green-600 text-sm mt-1 font-medium">Emails automatiques déclenchés par les actions utilisateurs.</p>
          </div>
          <button
            onClick={() => setPassword("")}
            className="px-4 py-2 bg-lime-400 hover:bg-lime-500 text-lime-900 font-bold rounded-xl text-sm transition-colors border border-lime-500"
          >
            Déconnexion
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-white border border-gray-200 rounded-2xl mb-8 flex-wrap shadow-sm">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 min-w-[120px] py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${
                tab === t.key
                  ? "bg-green-600 text-white"
                  : "text-green-700 hover:text-green-800 hover:bg-green-50"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Panier abandonné ── */}
        {tab === "panier" && (
          <div className={sectionCard}>
            <div className="flex items-center justify-between">
              <h2 className="text-gray-900 font-bold text-lg">Panier abandonné</h2>
              <label className="flex items-center gap-3 cursor-pointer">
                <span className="text-gray-500 text-sm">Activer</span>
                <button
                  type="button"
                  onClick={() =>
                    setConfig((c) =>
                      c
                        ? { ...c, abandonedCart: { ...c.abandonedCart, enabled: !c.abandonedCart.enabled } }
                        : c
                    )
                  }
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    config.abandonedCart.enabled ? "bg-green-600" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                      config.abandonedCart.enabled ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </label>
            </div>

            <p className="text-gray-500 text-sm">Emails envoyés quand un utilisateur visite la page checkout sans finaliser l&apos;achat.</p>

            <div className="border-t border-gray-100 pt-5 space-y-4">
              <h3 className="text-green-600 font-bold text-sm uppercase tracking-wide">Étape 1</h3>
              <div>
                <label className={labelCls}>Délai (heures)</label>
                <input
                  type="number"
                  min={0}
                  value={config.abandonedCart.step1DelayHours}
                  onChange={(e) =>
                    setConfig((c) =>
                      c ? { ...c, abandonedCart: { ...c.abandonedCart, step1DelayHours: Number(e.target.value) } } : c
                    )
                  }
                  className={`${inputCls} w-32`}
                />
              </div>
              <div>
                <label className={labelCls}>Sujet de l&apos;email</label>
                <input
                  type="text"
                  value={config.abandonedCart.step1Subject}
                  onChange={(e) =>
                    setConfig((c) =>
                      c ? { ...c, abandonedCart: { ...c.abandonedCart, step1Subject: e.target.value } } : c
                    )
                  }
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Corps du message (HTML — variables: {`{{firstName}}, {{productTitle}}, {{cartUrl}}`})</label>
                <textarea
                  rows={5}
                  value={config.abandonedCart.step1Body}
                  onChange={(e) =>
                    setConfig((c) =>
                      c ? { ...c, abandonedCart: { ...c.abandonedCart, step1Body: e.target.value } } : c
                    )
                  }
                  className={`${inputCls} font-mono text-xs`}
                />
                <p className="text-gray-400 text-xs mt-1">{config.abandonedCart.step1Body.length} car.</p>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-5 space-y-4">
              <h3 className="text-green-600 font-bold text-sm uppercase tracking-wide">Étape 2</h3>
              <div>
                <label className={labelCls}>Délai (heures)</label>
                <input
                  type="number"
                  min={0}
                  value={config.abandonedCart.step2DelayHours}
                  onChange={(e) =>
                    setConfig((c) =>
                      c ? { ...c, abandonedCart: { ...c.abandonedCart, step2DelayHours: Number(e.target.value) } } : c
                    )
                  }
                  className={`${inputCls} w-32`}
                />
              </div>
              <div>
                <label className={labelCls}>Sujet de l&apos;email</label>
                <input
                  type="text"
                  value={config.abandonedCart.step2Subject}
                  onChange={(e) =>
                    setConfig((c) =>
                      c ? { ...c, abandonedCart: { ...c.abandonedCart, step2Subject: e.target.value } } : c
                    )
                  }
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Corps du message (HTML)</label>
                <textarea
                  rows={5}
                  value={config.abandonedCart.step2Body}
                  onChange={(e) =>
                    setConfig((c) =>
                      c ? { ...c, abandonedCart: { ...c.abandonedCart, step2Body: e.target.value } } : c
                    )
                  }
                  className={`${inputCls} font-mono text-xs`}
                />
                <p className="text-gray-400 text-xs mt-1">{config.abandonedCart.step2Body.length} car.</p>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => saveSection("abandonedCart")}
                className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-sm transition-colors"
              >
                <Save size={15} /> Sauvegarder
              </button>
              {saveMsg.abandonedCart && (
                <span className={`text-sm font-medium ${saveMsg.abandonedCart.includes("✓") ? "text-green-600" : saveMsg.abandonedCart === "Sauvegarde…" ? "text-gray-500" : "text-red-600"}`}>
                  {saveMsg.abandonedCart}
                </span>
              )}
            </div>
          </div>
        )}

        {/* ── Post-achat ── */}
        {tab === "post_achat" && (
          <div className={sectionCard}>
            <div className="flex items-center justify-between">
              <h2 className="text-gray-900 font-bold text-lg">Email post-achat</h2>
              <label className="flex items-center gap-3 cursor-pointer">
                <span className="text-gray-500 text-sm">Activer</span>
                <button
                  type="button"
                  onClick={() =>
                    setConfig((c) =>
                      c ? { ...c, postPurchase: { ...c.postPurchase, enabled: !c.postPurchase.enabled } } : c
                    )
                  }
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    config.postPurchase.enabled ? "bg-green-600" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                      config.postPurchase.enabled ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </label>
            </div>
            <p className="text-gray-500 text-sm">Email envoyé quelques jours après un achat pour demander un avis client.</p>

            <div className="space-y-4">
              <div>
                <label className={labelCls}>Délai (jours)</label>
                <input
                  type="number"
                  min={0}
                  value={config.postPurchase.delayDays}
                  onChange={(e) =>
                    setConfig((c) =>
                      c ? { ...c, postPurchase: { ...c.postPurchase, delayDays: Number(e.target.value) } } : c
                    )
                  }
                  className={`${inputCls} w-32`}
                />
              </div>
              <div>
                <label className={labelCls}>Sujet de l&apos;email</label>
                <input
                  type="text"
                  value={config.postPurchase.subject}
                  onChange={(e) =>
                    setConfig((c) =>
                      c ? { ...c, postPurchase: { ...c.postPurchase, subject: e.target.value } } : c
                    )
                  }
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Corps du message (HTML — variables: {`{{firstName}}, {{productTitle}}, {{reviewUrl}}`})</label>
                <textarea
                  rows={6}
                  value={config.postPurchase.body}
                  onChange={(e) =>
                    setConfig((c) =>
                      c ? { ...c, postPurchase: { ...c.postPurchase, body: e.target.value } } : c
                    )
                  }
                  className={`${inputCls} font-mono text-xs`}
                />
                <p className="text-gray-400 text-xs mt-1">{config.postPurchase.body.length} car.</p>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => saveSection("postPurchase")}
                className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-sm transition-colors"
              >
                <Save size={15} /> Sauvegarder
              </button>
              {saveMsg.postPurchase && (
                <span className={`text-sm font-medium ${saveMsg.postPurchase.includes("✓") ? "text-green-600" : saveMsg.postPurchase === "Sauvegarde…" ? "text-gray-500" : "text-red-600"}`}>
                  {saveMsg.postPurchase}
                </span>
              )}
            </div>
          </div>
        )}

        {/* ── Bienvenue ── */}
        {tab === "bienvenue" && (
          <div className={sectionCard}>
            <div className="flex items-center justify-between">
              <h2 className="text-gray-900 font-bold text-lg">Séquence de bienvenue</h2>
              <label className="flex items-center gap-3 cursor-pointer">
                <span className="text-gray-500 text-sm">Activer</span>
                <button
                  type="button"
                  onClick={() =>
                    setConfig((c) =>
                      c ? { ...c, welcome: { ...c.welcome, enabled: !c.welcome.enabled } } : c
                    )
                  }
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    config.welcome.enabled ? "bg-green-600" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                      config.welcome.enabled ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </label>
            </div>
            <p className="text-gray-500 text-sm">Séquence d&apos;emails envoyés après inscription. Variables: {`{{firstName}}, {{siteUrl}}`}</p>

            {config.welcome.steps.map((step, idx) => (
              <div key={idx} className="border border-gray-200 rounded-xl p-4 space-y-3">
                <h3 className="text-green-600 font-bold text-sm uppercase tracking-wide">Étape {idx + 1}</h3>
                <div>
                  <label className={labelCls}>Délai (heures depuis inscription)</label>
                  <input
                    type="number"
                    min={0}
                    value={step.delayHours}
                    onChange={(e) =>
                      setConfig((c) => {
                        if (!c) return c;
                        const steps = [...c.welcome.steps];
                        steps[idx] = { ...steps[idx], delayHours: Number(e.target.value) };
                        return { ...c, welcome: { ...c.welcome, steps } };
                      })
                    }
                    className={`${inputCls} w-32`}
                  />
                </div>
                <div>
                  <label className={labelCls}>Sujet</label>
                  <input
                    type="text"
                    value={step.subject}
                    onChange={(e) =>
                      setConfig((c) => {
                        if (!c) return c;
                        const steps = [...c.welcome.steps];
                        steps[idx] = { ...steps[idx], subject: e.target.value };
                        return { ...c, welcome: { ...c.welcome, steps } };
                      })
                    }
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Corps (HTML)</label>
                  <textarea
                    rows={5}
                    value={step.body}
                    onChange={(e) =>
                      setConfig((c) => {
                        if (!c) return c;
                        const steps = [...c.welcome.steps];
                        steps[idx] = { ...steps[idx], body: e.target.value };
                        return { ...c, welcome: { ...c.welcome, steps } };
                      })
                    }
                    className={`${inputCls} font-mono text-xs`}
                  />
                  <p className="text-gray-400 text-xs mt-1">{step.body.length} car.</p>
                </div>
              </div>
            ))}

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => saveSection("welcome")}
                className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-sm transition-colors"
              >
                <Save size={15} /> Sauvegarder
              </button>
              {saveMsg.welcome && (
                <span className={`text-sm font-medium ${saveMsg.welcome.includes("✓") ? "text-green-600" : saveMsg.welcome === "Sauvegarde…" ? "text-gray-500" : "text-red-600"}`}>
                  {saveMsg.welcome}
                </span>
              )}
            </div>
          </div>
        )}

        {/* ── Journal ── */}
        {tab === "journal" && (
          <div className={sectionCard}>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className="text-gray-900 font-bold text-lg">Journal des tâches</h2>
              <div className="flex gap-2">
                <button
                  onClick={fetchQueue}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition-colors"
                >
                  <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Actualiser
                </button>
                <button
                  onClick={clearQueue}
                  className="flex items-center gap-1.5 px-4 py-2 border border-red-200 text-red-600 rounded-xl text-sm hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={14} /> Nettoyer
                </button>
              </div>
            </div>

            <p className="text-gray-500 text-sm">{queue.length} tâche(s) chargée(s). Affiche les 50 dernières.</p>

            {queue.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p className="text-4xl mb-3">📭</p>
                <p>Aucune tâche dans la queue.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {queue.slice(0, 50).map((task) => (
                  <div key={task.id} className="p-4 bg-gray-50 border border-gray-100 rounded-xl">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <StatusBadge status={task.status} />
                          <span className="text-gray-500 text-xs font-mono">{task.type}</span>
                        </div>
                        <p className="text-gray-900 text-sm font-medium truncate">{task.email}</p>
                        {task.data.productTitle && (
                          <p className="text-gray-500 text-xs truncate">Produit: {task.data.productTitle}</p>
                        )}
                        {task.error && (
                          <p className="text-red-600 text-xs truncate">Erreur: {task.error}</p>
                        )}
                      </div>
                      <div className="text-right text-xs text-gray-400 flex-shrink-0">
                        <p>Prévu: {fmtDate(task.executeAt)}</p>
                        {task.executedAt && <p>Exécuté: {fmtDate(task.executedAt)}</p>}
                        <p className="text-gray-300">Créé: {fmtDate(task.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
