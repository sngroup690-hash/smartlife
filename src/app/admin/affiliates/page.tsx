"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { AffiliateAccount, PayoutRequest } from "@/lib/affiliate-store";

const ADMIN_PW = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? "";
const H = { "Content-Type": "application/json", "x-admin-password": ADMIN_PW };

type AffWithStats = Omit<AffiliateAccount, "passwordHash"> & {
  uses?: number;
  totalRevenue?: number;
  commissionRate?: number;
  totalCommission?: number;
  availableBalance?: number;
};

const EMPTY_FORM = {
  displayName: "", email: "", code: "", password: "", phone: "",
  minPayoutThreshold: 5000,
};

function fmt(n: number) { return (n || 0).toLocaleString("fr-FR") + " FCFA"; }

export default function AdminAffiliatesPage() {
  const [affiliates, setAffiliates] = useState<AffWithStats[]>([]);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [tab, setTab] = useState<"affiliates" | "payouts">("affiliates");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveOk, setSaveOk] = useState(false);
  const [error, setError] = useState("");
  const [processingPayout, setProcessingPayout] = useState<string | null>(null);
  const [payoutNote, setPayoutNote] = useState("");
  const [showNoteFor, setShowNoteFor] = useState<string | null>(null);
  const [newPayoutNotifs, setNewPayoutNotifs] = useState<{ id: string; affiliateName: string; code: string; amount: number; payoutInfo: { method: string; operator?: string; number?: string }; requestedAt: string }[]>([]);

  useEffect(() => {
    loadAll();
    loadNotifications();
  }, []);

  async function loadNotifications() {
    const res = await fetch("/api/admin/notifications", { headers: { "x-admin-password": ADMIN_PW } });
    if (!res.ok) return;
    const data = await res.json();
    setNewPayoutNotifs(data.notifications || []);
  }

  async function markNotifsRead() {
    if (newPayoutNotifs.length === 0) return;
    await fetch("/api/admin/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-password": ADMIN_PW },
      body: JSON.stringify({ ids: newPayoutNotifs.map((n) => n.id) }),
    });
    setNewPayoutNotifs([]);
  }

  async function loadAll() {
    const [affRes, payRes] = await Promise.all([
      fetch("/api/admin/affiliates", { headers: { "x-admin-password": ADMIN_PW } }),
      fetch("/api/admin/affiliates/payouts", { headers: { "x-admin-password": ADMIN_PW } }),
    ]);
    const affData = await affRes.json();
    const payData = await payRes.json();
    setAffiliates(affData);
    setPayouts(payData);
  }

  async function save() {
    setError("");
    setSaving(true);
    const url = "/api/admin/affiliates";
    const method = editId ? "PUT" : "POST";
    const body = editId
      ? { id: editId, displayName: form.displayName, email: form.email, phone: form.phone, minPayoutThreshold: form.minPayoutThreshold, ...(form.password ? { password: form.password } : {}) }
      : form;
    const res = await fetch(url, { method, headers: H, body: JSON.stringify(body) });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error || "Erreur"); return; }
    setSaveOk(true);
    setTimeout(() => setSaveOk(false), 2000);
    setShowForm(false);
    setForm(EMPTY_FORM);
    setEditId(null);
    loadAll();
  }

  async function toggleEnabled(aff: AffWithStats) {
    await fetch("/api/admin/affiliates", {
      method: "PUT",
      headers: H,
      body: JSON.stringify({ id: aff.id, enabled: !aff.enabled }),
    });
    loadAll();
  }

  async function deleteAffiliate(id: string) {
    if (!confirm("Supprimer cet affilié ?")) return;
    await fetch(`/api/admin/affiliates?id=${id}`, { method: "DELETE", headers: { "x-admin-password": ADMIN_PW } });
    loadAll();
  }

  async function processPayout(id: string, status: "paid" | "rejected") {
    setProcessingPayout(id);
    await fetch("/api/admin/affiliates/payouts", {
      method: "PATCH",
      headers: H,
      body: JSON.stringify({ id, status, note: payoutNote }),
    });
    setProcessingPayout(null);
    setShowNoteFor(null);
    setPayoutNote("");
    loadAll();
  }

  const pendingPayouts = payouts.filter((p) => p.status === "pending");

  return (
    <div className="admin-panel min-h-screen bg-gray-50">
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 20px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
          <Link href="/admin" style={{ color: "#6b7280", textDecoration: "none", fontSize: 14 }}>
            ← Retour
          </Link>
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#111827" }}>
              🚀 Gestion des Affiliés
            </h1>
            <p style={{ margin: "2px 0 0", color: "#6b7280", fontSize: 13 }}>
              {affiliates.length} affilié(s) — {pendingPayouts.length} retrait(s) en attente
            </p>
          </div>
          <button
            onClick={() => { setShowForm(true); setEditId(null); setForm(EMPTY_FORM); }}
            style={{
              padding: "10px 20px",
              background: "#7c3aed",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              cursor: "pointer",
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            + Créer un affilié
          </button>
        </div>

        {/* Notification banner for new payout requests */}
        {newPayoutNotifs.length > 0 && (
          <div
            style={{
              background: "linear-gradient(135deg, #fef3c7, #fde68a)",
              border: "1px solid #f59e0b",
              borderRadius: 12,
              padding: "14px 18px",
              marginBottom: 20,
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
            }}
          >
            <span style={{ fontSize: 22, flexShrink: 0 }}>🔔</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, color: "#92400e", fontSize: 14, marginBottom: 6 }}>
                {newPayoutNotifs.length} nouvelle{newPayoutNotifs.length > 1 ? "s" : ""} demande{newPayoutNotifs.length > 1 ? "s" : ""} de retrait
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {newPayoutNotifs.map((n) => (
                  <div key={n.id} style={{ fontSize: 12, color: "#78350f" }}>
                    · <strong>{n.affiliateName}</strong> ({n.code}) — {n.amount.toLocaleString("fr-FR")} FCFA
                    {n.payoutInfo?.operator ? ` via ${n.payoutInfo.operator === "orange" ? "Orange Money" : "MTN MoMo"} ${n.payoutInfo.number || ""}` : ""}
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={() => { setTab("payouts"); markNotifsRead(); }}
              style={{
                padding: "8px 14px",
                background: "#f59e0b",
                border: "none",
                borderRadius: 8,
                color: "#fff",
                fontWeight: 700,
                fontSize: 12,
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              Traiter →
            </button>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, borderBottom: "2px solid #e5e7eb", marginBottom: 24 }}>
          {[
            { key: "affiliates", label: `👥 Affiliés (${affiliates.length})` },
            { key: "payouts", label: `💸 Retraits${pendingPayouts.length > 0 ? ` (${pendingPayouts.length} ⚡)` : ""}` },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key as typeof tab); if (t.key === "payouts") markNotifsRead(); }}
              style={{
                padding: "10px 18px",
                border: "none",
                background: "none",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: tab === t.key ? 700 : 500,
                color: tab === t.key ? "#7c3aed" : "#6b7280",
                borderBottom: tab === t.key ? "2px solid #7c3aed" : "2px solid transparent",
                marginBottom: -2,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Create/Edit Form */}
        {showForm && (
          <div
            style={{
              background: "#fff",
              border: "2px solid #7c3aed",
              borderRadius: 14,
              padding: 24,
              marginBottom: 24,
            }}
          >
            <h3 style={{ margin: "0 0 20px", color: "#111827", fontSize: 16, fontWeight: 700 }}>
              {editId ? "Modifier l'affilié" : "Créer un compte affilié"}
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Field label="Nom affiché *" value={form.displayName} onChange={(v) => setForm({ ...form, displayName: v })} placeholder="ex: Romuald N." />
              <Field label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} placeholder="email@exemple.com" />
              {!editId && (
                <>
                  <Field label="Code affilié *" value={form.code} onChange={(v) => setForm({ ...form, code: v.toUpperCase() })} placeholder="ex: TCHOP10" mono />
                  <Field label="Mot de passe *" value={form.password} onChange={(v) => setForm({ ...form, password: v })} placeholder="Mot de passe initial" type="password" />
                </>
              )}
              {editId && (
                <Field label="Nouveau mot de passe (laisser vide = inchangé)" value={form.password} onChange={(v) => setForm({ ...form, password: v })} placeholder="Laisser vide" type="password" />
              )}
              <Field label="Téléphone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="+237 6xx xxx xxx" />
              <div>
                <label style={{ fontWeight: 600, fontSize: 13, color: "#374151", display: "block", marginBottom: 6 }}>
                  Seuil de retrait minimum (FCFA)
                </label>
                <input
                  type="number"
                  value={form.minPayoutThreshold}
                  onChange={(e) => setForm({ ...form, minPayoutThreshold: Number(e.target.value) })}
                  style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, color: "#111827", background: "#fff", boxSizing: "border-box" }}
                />
              </div>
            </div>

            {error && <p style={{ color: "#dc2626", fontSize: 13, marginTop: 12 }}>{error}</p>}
            {saveOk && <p style={{ color: "#27A827", fontSize: 13, marginTop: 12, fontWeight: 600 }}>✓ Enregistré !</p>}

            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              <button
                onClick={save}
                disabled={saving}
                style={{ padding: "10px 24px", background: "#7c3aed", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13 }}
              >
                {saving ? "…" : editId ? "Mettre à jour" : "Créer le compte"}
              </button>
              <button
                onClick={() => { setShowForm(false); setEditId(null); setForm(EMPTY_FORM); setError(""); }}
                style={{ padding: "10px 18px", background: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: 8, cursor: "pointer", fontSize: 13 }}
              >
                Annuler
              </button>
            </div>
          </div>
        )}

        {/* AFFILIATES TAB */}
        {tab === "affiliates" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {affiliates.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px", color: "#9ca3af" }}>
                Aucun affilié. Cliquez sur &quot;Créer un affilié&quot; pour commencer.
              </div>
            )}
            {affiliates.map((aff) => (
              <div
                key={aff.id}
                style={{
                  background: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 14,
                  padding: "18px 20px",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                  opacity: aff.enabled ? 1 : 0.6,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      fontSize: 18,
                      fontWeight: 800,
                      flexShrink: 0,
                    }}
                  >
                    {aff.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: "#111827", fontSize: 15 }}>{aff.displayName}</div>
                    <div style={{ color: "#6b7280", fontSize: 12 }}>{aff.email}</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div
                      style={{
                        fontFamily: "monospace",
                        fontSize: 15,
                        fontWeight: 800,
                        color: "#7c3aed",
                        background: "#f5f3ff",
                        padding: "4px 12px",
                        borderRadius: 8,
                      }}
                    >
                      {aff.code}
                    </div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 11, color: "#9ca3af" }}>Ventes</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{aff.uses || 0}</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 11, color: "#9ca3af" }}>Commission</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#7c3aed" }}>{fmt(aff.totalCommission || 0)}</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 11, color: "#9ca3af" }}>Solde dispo.</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: (aff.availableBalance || 0) > 0 ? "#27A827" : "#9ca3af" }}>{fmt(aff.availableBalance || 0)}</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 11, color: "#9ca3af" }}>Payé</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{fmt(aff.totalPaidOut)}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button
                      onClick={() => toggleEnabled(aff)}
                      style={{
                        padding: "6px 14px",
                        background: aff.enabled ? "#dcfce7" : "#fef2f2",
                        color: aff.enabled ? "#27A827" : "#dc2626",
                        border: `1px solid ${aff.enabled ? "#bbf7d0" : "#fecaca"}`,
                        borderRadius: 8,
                        cursor: "pointer",
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      {aff.enabled ? "✓ Actif" : "✗ Désactivé"}
                    </button>
                    <button
                      onClick={() => {
                        setEditId(aff.id);
                        setForm({ ...EMPTY_FORM, displayName: aff.displayName, email: aff.email, phone: aff.phone || "", minPayoutThreshold: aff.minPayoutThreshold || 5000 });
                        setShowForm(true);
                      }}
                      style={{ padding: "6px 14px", background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", borderRadius: 8, cursor: "pointer", fontSize: 12 }}
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => deleteAffiliate(aff.id)}
                      style={{ padding: "6px 12px", background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 8, cursor: "pointer", fontSize: 12 }}
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {aff.lastLogin && (
                  <div style={{ marginTop: 10, color: "#9ca3af", fontSize: 11 }}>
                    Dernière connexion : {new Date(aff.lastLogin).toLocaleString("fr-FR")}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* PAYOUTS TAB */}
        {tab === "payouts" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {payouts.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px", color: "#9ca3af" }}>
                Aucune demande de retrait pour le moment.
              </div>
            )}
            {payouts.map((p) => (
              <div
                key={p.id}
                style={{
                  background: "#fff",
                  border: `1px solid ${p.status === "pending" ? "#fbbf24" : "#e5e7eb"}`,
                  borderRadius: 14,
                  padding: "18px 20px",
                  boxShadow: p.status === "pending" ? "0 2px 8px rgba(251,191,36,0.15)" : "0 1px 4px rgba(0,0,0,0.05)",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14, flexWrap: "wrap" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 700, color: "#111827", fontSize: 15 }}>{p.affiliateName}</span>
                      <span
                        style={{
                          fontFamily: "monospace",
                          fontSize: 12,
                          fontWeight: 700,
                          color: "#7c3aed",
                          background: "#f5f3ff",
                          padding: "2px 8px",
                          borderRadius: 6,
                        }}
                      >
                        {p.code}
                      </span>
                      <PayoutStatus status={p.status} />
                    </div>
                    <div style={{ marginTop: 6, color: "#374151", fontSize: 14 }}>
                      <strong style={{ color: "#7c3aed", fontSize: 16 }}>
                        {fmt(p.amount)}
                      </strong>{" "}
                      — Demandé le {new Date(p.requestedAt).toLocaleDateString("fr-FR")}
                    </div>
                    <div style={{ marginTop: 6, color: "#6b7280", fontSize: 12 }}>
                      {p.payoutInfo.method === "mobile_money"
                        ? `📱 ${p.payoutInfo.operator?.toUpperCase()} : ${p.payoutInfo.number}`
                        : `🏦 ${p.payoutInfo.bankName} — ${p.payoutInfo.accountName} — ${p.payoutInfo.bankAccount}`}
                    </div>
                    {p.note && (
                      <div style={{ marginTop: 6, color: "#374151", fontSize: 12, fontStyle: "italic" }}>
                        Note : {p.note}
                      </div>
                    )}
                  </div>

                  {p.status === "pending" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 160 }}>
                      {showNoteFor === p.id ? (
                        <>
                          <input
                            type="text"
                            placeholder="Note (optionnel)"
                            value={payoutNote}
                            onChange={(e) => setPayoutNote(e.target.value)}
                            style={{ padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: 7, fontSize: 12, color: "#111827" }}
                          />
                          <button
                            onClick={() => processPayout(p.id, "paid")}
                            disabled={processingPayout === p.id}
                            style={{ padding: "8px 14px", background: "#dcfce7", color: "#27A827", border: "1px solid #bbf7d0", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12 }}
                          >
                            {processingPayout === p.id ? "…" : "✓ Marquer comme payé"}
                          </button>
                          <button
                            onClick={() => processPayout(p.id, "rejected")}
                            disabled={processingPayout === p.id}
                            style={{ padding: "8px 14px", background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12 }}
                          >
                            ✗ Rejeter
                          </button>
                          <button onClick={() => setShowNoteFor(null)} style={{ padding: "5px", background: "none", border: "none", color: "#9ca3af", fontSize: 12, cursor: "pointer" }}>
                            Annuler
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setShowNoteFor(p.id)}
                          style={{ padding: "9px 16px", background: "#7c3aed", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12 }}
                        >
                          Traiter ce retrait
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({
  label, value, onChange, placeholder, type = "text", mono = false,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; mono?: boolean;
}) {
  return (
    <div>
      <label style={{ fontWeight: 600, fontSize: 13, color: "#374151", display: "block", marginBottom: 6 }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          padding: "9px 12px",
          border: "1px solid #d1d5db",
          borderRadius: 8,
          fontSize: 14,
          color: "#111827",
          background: "#fff",
          boxSizing: "border-box",
          fontFamily: mono ? "monospace" : "inherit",
          fontWeight: mono ? 700 : 400,
        }}
      />
    </div>
  );
}

function PayoutStatus({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    pending: { bg: "#fef3c7", color: "#92400e", label: "⏳ En attente" },
    paid: { bg: "#dcfce7", color: "#166534", label: "✓ Payé" },
    rejected: { bg: "#fee2e2", color: "#991b1b", label: "✗ Rejeté" },
  };
  const s = map[status] || map.pending;
  return (
    <span
      style={{
        background: s.bg, color: s.color,
        fontSize: 11, fontWeight: 700,
        padding: "3px 10px", borderRadius: 20,
      }}
    >
      {s.label}
    </span>
  );
}