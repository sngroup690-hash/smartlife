"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { AffiliateSale, PayoutRequest, PayoutInfo } from "@/lib/affiliate-store";

type AffData = {
  affiliate: {
    id: string; code: string; displayName: string; email: string;
    phone?: string; payoutInfo?: PayoutInfo; minPayoutThreshold: number;
  };
  stats: {
    uses: number; totalRevenue: number; commissionRate: number;
    totalCommission: number; totalPaidOut: number; availableBalance: number;
  };
  promoCodeInfo: { code: string; discountType: string; discountValue: number; enabled: boolean } | null;
  sales: AffiliateSale[];
  payouts: PayoutRequest[];
};

function fmt(n: number) {
  return n.toLocaleString("fr-FR") + " FCFA";
}

function dateFr(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function AffiliateDashboard() {
  const router = useRouter();
  const [data, setData] = useState<AffData | null>(null);
  const [tab, setTab] = useState<"home" | "ventes" | "retrait" | "profil">("home");
  const [copied, setCopied] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutInfo, setPayoutInfo] = useState<PayoutInfo>({ method: "mobile_money", operator: "orange", number: "" });
  const [payoutError, setPayoutError] = useState("");
  const [payoutOk, setPayoutOk] = useState(false);
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileOk, setProfileOk] = useState(false);
  const [pwOld, setPwOld] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwOk, setPwOk] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);

  useEffect(() => {
    fetch("/api/affiliate/me")
      .then((r) => {
        if (r.status === 401) { router.push("/affilies/login"); return null; }
        return r.json();
      })
      .then((d) => {
        if (!d) return;
        setData(d);
        if (d.affiliate.payoutInfo) setPayoutInfo(d.affiliate.payoutInfo);
      });
  }, [router]);

  function copyCode() {
    if (!data) return;
    navigator.clipboard.writeText(data.affiliate.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  async function logout() {
    await fetch("/api/affiliate/auth", { method: "DELETE" });
    router.push("/affilies/login");
  }

  async function requestPayout() {
    if (!data) return;
    setPayoutError("");
    setPayoutOk(false);
    setPayoutLoading(true);
    const amount = parseFloat(payoutAmount);
    if (!amount || amount < data.affiliate.minPayoutThreshold) {
      setPayoutError(`Montant minimum : ${data.affiliate.minPayoutThreshold.toLocaleString("fr-FR")} FCFA`);
      setPayoutLoading(false);
      return;
    }
    const res = await fetch("/api/affiliate/payout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, payoutInfo }),
    });
    const result = await res.json();
    setPayoutLoading(false);
    if (!res.ok) { setPayoutError(result.error || "Erreur"); return; }
    setPayoutOk(true);
    setPayoutAmount("");
    // Refresh data
    const newData = await fetch("/api/affiliate/me").then(r => r.json());
    setData(newData);
  }

  async function saveProfile() {
    if (!data) return;
    setProfileSaving(true);
    await fetch("/api/affiliate/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payoutInfo, phone: payoutInfo.number }),
    });
    setProfileSaving(false);
    setProfileOk(true);
    setTimeout(() => setProfileOk(false), 2000);
  }

  async function changePassword() {
    setPwError("");
    setPwOk(false);
    if (!pwOld || !pwNew || !pwConfirm) { setPwError("Tous les champs sont requis"); return; }
    if (pwNew !== pwConfirm) { setPwError("Les mots de passe ne correspondent pas"); return; }
    if (pwNew.length < 6) { setPwError("Le mot de passe doit contenir au moins 6 caractères"); return; }
    setPwSaving(true);
    const res = await fetch("/api/affiliate/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oldPassword: pwOld, newPassword: pwNew }),
    });
    const result = await res.json();
    setPwSaving(false);
    if (!res.ok) { setPwError(result.error || "Erreur"); return; }
    setPwOk(true);
    setPwOld(""); setPwNew(""); setPwConfirm("");
    setTimeout(() => setPwOk(false), 3000);
  }

  if (!data) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ color: "#c4b5fd", fontSize: 16 }}>Chargement…</div>
      </div>
    );
  }

  const { affiliate, stats, promoCodeInfo, sales, payouts } = data;
  const pendingPayout = payouts.find((p) => p.status === "pending");
  const hasPendingPayout = !!pendingPayout;
  const canRequestPayout =
    stats.availableBalance >= affiliate.minPayoutThreshold && !hasPendingPayout;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f0c29",
        backgroundImage: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
        fontFamily: "system-ui, sans-serif",
        paddingBottom: 80,
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "rgba(255,255,255,0.04)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 10,
          backdropFilter: "blur(10px)",
        }}
      >
        <div>
          <div style={{ color: "#c4b5fd", fontSize: 12, fontWeight: 500 }}>Espace Affilié</div>
          <div style={{ color: "#ffffff", fontSize: 16, fontWeight: 800 }}>{affiliate.displayName}</div>
        </div>
        <button
          onClick={logout}
          style={{
            padding: "6px 14px",
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 8,
            color: "#c4b5fd",
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          Déconnexion
        </button>
      </div>

      <div style={{ maxWidth: 500, margin: "0 auto", padding: "0 16px" }}>

        {/* ─── TAB: HOME ─── */}
        {tab === "home" && (
          <div style={{ paddingTop: 24 }}>
            {/* Code promo highlight */}
            <div
              style={{
                background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
                borderRadius: 20,
                padding: "24px 20px",
                marginBottom: 20,
                boxShadow: "0 8px 32px rgba(124,58,237,0.4)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute", top: -20, right: -20,
                  width: 120, height: 120,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.05)",
                }}
              />
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: 500, margin: "0 0 8px", letterSpacing: "0.05em" }}>
                VOTRE CODE AFFILIÉ
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <span
                  style={{
                    fontSize: 32,
                    fontWeight: 900,
                    color: "#ffffff",
                    letterSpacing: "0.1em",
                    fontFamily: "monospace",
                  }}
                >
                  {affiliate.code}
                </span>
                {promoCodeInfo && (
                  <span
                    style={{
                      background: "rgba(255,255,255,0.15)",
                      borderRadius: 20,
                      padding: "3px 10px",
                      color: "#e9d5ff",
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    -{promoCodeInfo.discountValue}{promoCodeInfo.discountType === "percent" ? "%" : " FCFA"} client
                  </span>
                )}
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
                <button
                  onClick={copyCode}
                  style={{
                    padding: "10px 20px",
                    background: copied ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.15)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    borderRadius: 10,
                    color: "#ffffff",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    transition: "all 0.2s",
                  }}
                >
                  {copied ? "✓ Copié !" : "📋 Copier le code"}
                </button>
              </div>
            </div>

            {/* KPI Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
              <KpiCard
                icon="🛒"
                label="Ventes totales"
                value={String(stats.uses)}
                sub="avec votre code"
                color="#10b981"
              />
              <KpiCard
                icon="💰"
                label="Commission"
                value={fmt(stats.totalCommission)}
                sub={`${stats.commissionRate}% par vente`}
                color="#f59e0b"
              />
              <KpiCard
                icon="✅"
                label="Déjà payé"
                value={fmt(stats.totalPaidOut)}
                sub="retraits effectués"
                color="#6366f1"
              />
              <div
                style={{
                  background: stats.availableBalance >= affiliate.minPayoutThreshold
                    ? "linear-gradient(135deg, rgba(34,197,94,0.15), rgba(16,185,129,0.1))"
                    : "rgba(255,255,255,0.04)",
                  border: `1px solid ${stats.availableBalance >= affiliate.minPayoutThreshold ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.08)"}`,
                  borderRadius: 16,
                  padding: "16px",
                  cursor: stats.availableBalance >= affiliate.minPayoutThreshold ? "pointer" : "default",
                  transition: "all 0.2s",
                }}
                onClick={() => {
                  if (canRequestPayout) setTab("retrait");
                }}
              >
                <div style={{ fontSize: 22, marginBottom: 4 }}>💎</div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: stats.availableBalance >= affiliate.minPayoutThreshold ? "#4ade80" : "#e2e8f0",
                  }}
                >
                  {fmt(stats.availableBalance)}
                </div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                  {stats.availableBalance >= affiliate.minPayoutThreshold
                    ? "→ Demander un retrait"
                    : `Solde disponible`}
                </div>
              </div>
            </div>

            {/* Pending payout banner */}
            {hasPendingPayout && (
              <div
                style={{
                  background: "rgba(245,158,11,0.1)",
                  border: "1px solid rgba(245,158,11,0.3)",
                  borderRadius: 12,
                  padding: "12px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 16,
                }}
              >
                <span style={{ fontSize: 20 }}>⏳</span>
                <div>
                  <div style={{ color: "#fbbf24", fontSize: 13, fontWeight: 700 }}>
                    Retrait en attente
                  </div>
                  <div style={{ color: "#fcd34d", fontSize: 12 }}>
                    {fmt(pendingPayout.amount)} — En cours de traitement
                  </div>
                </div>
              </div>
            )}

            {/* Recent sales preview */}
            {sales.length > 0 && (
              <div
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 16,
                  padding: "16px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 12,
                  }}
                >
                  <span style={{ color: "#c4b5fd", fontSize: 13, fontWeight: 700 }}>
                    Dernières ventes
                  </span>
                  <button
                    onClick={() => setTab("ventes")}
                    style={{ color: "#818cf8", fontSize: 12, background: "none", border: "none", cursor: "pointer" }}
                  >
                    Tout voir →
                  </button>
                </div>
                {sales.slice(0, 3).map((s) => (
                  <SaleRow key={s.id} sale={s} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB: VENTES ─── */}
        {tab === "ventes" && (
          <div style={{ paddingTop: 24 }}>
            <h2 style={{ color: "#e2e8f0", fontSize: 18, fontWeight: 800, margin: "0 0 16px" }}>
              Historique des ventes
            </h2>
            {sales.length === 0 ? (
              <EmptyState icon="🛒" text="Aucune vente pour le moment. Partagez votre code !" />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {sales.map((s) => (
                  <div
                    key={s.id}
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 12,
                      padding: "14px 16px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 600 }}>{s.produit}</div>
                        <div style={{ color: "#64748b", fontSize: 11, marginTop: 2 }}>{dateFr(s.date)}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ color: "#4ade80", fontSize: 14, fontWeight: 700 }}>
                          +{fmt(s.commission)}
                        </div>
                        <div style={{ color: "#64748b", fontSize: 11 }}>
                          Vente : {fmt(s.amount)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB: RETRAIT ─── */}
        {tab === "retrait" && (
          <div style={{ paddingTop: 24 }}>
            <h2 style={{ color: "#e2e8f0", fontSize: 18, fontWeight: 800, margin: "0 0 4px" }}>
              Demande de retrait
            </h2>
            <p style={{ color: "#94a3b8", fontSize: 13, margin: "0 0 20px" }}>
              Solde disponible :{" "}
              <strong style={{ color: "#4ade80" }}>{fmt(stats.availableBalance)}</strong>
            </p>

            {hasPendingPayout ? (
              <div
                style={{
                  background: "rgba(245,158,11,0.1)",
                  border: "1px solid rgba(245,158,11,0.3)",
                  borderRadius: 16,
                  padding: "24px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
                <div style={{ color: "#fbbf24", fontSize: 16, fontWeight: 700, marginBottom: 6 }}>
                  Demande en cours
                </div>
                <div style={{ color: "#fcd34d", fontSize: 14 }}>
                  {fmt(pendingPayout!.amount)} — En attente de validation
                </div>
                <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 8 }}>
                  Demandé le {dateFr(pendingPayout!.requestedAt)}
                </div>
              </div>
            ) : stats.availableBalance < affiliate.minPayoutThreshold ? (
              <div
                style={{
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.2)",
                  borderRadius: 16,
                  padding: "24px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 40, marginBottom: 12 }}>💔</div>
                <div style={{ color: "#fca5a5", fontSize: 14, fontWeight: 600 }}>
                  Solde insuffisant
                </div>
                <div style={{ color: "#94a3b8", fontSize: 13, marginTop: 6 }}>
                  Minimum : {fmt(affiliate.minPayoutThreshold)}
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Amount */}
                <div>
                  <label style={{ color: "#c4b5fd", fontSize: 13, fontWeight: 600, display: "block", marginBottom: 8 }}>
                    Montant à retirer (FCFA)
                  </label>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                    {[affiliate.minPayoutThreshold, Math.floor(stats.availableBalance / 2), stats.availableBalance]
                      .filter((v, i, arr) => v > 0 && arr.indexOf(v) === i)
                      .map((v) => (
                        <button
                          key={v}
                          onClick={() => setPayoutAmount(String(v))}
                          style={{
                            padding: "6px 14px",
                            background: payoutAmount === String(v) ? "rgba(124,58,237,0.4)" : "rgba(255,255,255,0.06)",
                            border: `1px solid ${payoutAmount === String(v) ? "#7c3aed" : "rgba(255,255,255,0.12)"}`,
                            borderRadius: 8,
                            color: "#c4b5fd",
                            fontSize: 12,
                            cursor: "pointer",
                            fontWeight: 600,
                          }}
                        >
                          {v.toLocaleString("fr-FR")}
                        </button>
                      ))}
                  </div>
                  <input
                    type="number"
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    placeholder={`Min. ${affiliate.minPayoutThreshold.toLocaleString("fr-FR")}`}
                    style={{
                      width: "100%",
                      padding: "14px 16px",
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      borderRadius: 12,
                      color: "#ffffff",
                      fontSize: 16,
                      fontWeight: 700,
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                {/* Payment method — Mobile Money only */}
                <div>
                  <label style={{ color: "#c4b5fd", fontSize: 13, fontWeight: 600, display: "block", marginBottom: 8 }}>
                    📱 Mobile Money
                  </label>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ display: "flex", gap: 8 }}>
                      {(["orange", "mtn"] as const).map((op) => (
                        <button
                          key={op}
                          onClick={() => setPayoutInfo({ ...payoutInfo, operator: op })}
                          style={{
                            flex: 1,
                            padding: "10px",
                            background: payoutInfo.operator === op ? (op === "orange" ? "rgba(249,115,22,0.25)" : "rgba(234,179,8,0.2)") : "rgba(255,255,255,0.05)",
                            border: `1px solid ${payoutInfo.operator === op ? (op === "orange" ? "#f97316" : "#eab308") : "rgba(255,255,255,0.1)"}`,
                            borderRadius: 10,
                            color: payoutInfo.operator === op ? "#ffffff" : "#94a3b8",
                            fontSize: 13,
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          {op === "orange" ? "🟠 Orange Money" : "🟡 MTN MoMo"}
                        </button>
                      ))}
                    </div>
                    <input
                      type="tel"
                      placeholder="Numéro de téléphone"
                      value={payoutInfo.number || ""}
                      onChange={(e) => setPayoutInfo({ ...payoutInfo, number: e.target.value })}
                      style={inputDark}
                    />
                  </div>
                </div>

                {payoutError && (
                  <div style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "10px 14px", color: "#fca5a5", fontSize: 13 }}>
                    {payoutError}
                  </div>
                )}
                {payoutOk && (
                  <div style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 10, padding: "10px 14px", color: "#4ade80", fontSize: 13, fontWeight: 600 }}>
                    ✓ Demande envoyée ! L'équipe Smart Life va traiter votre retrait.
                  </div>
                )}

                <button
                  onClick={requestPayout}
                  disabled={payoutLoading}
                  style={{
                    padding: "15px",
                    background: payoutLoading ? "rgba(124,58,237,0.4)" : "linear-gradient(135deg, #7c3aed, #4f46e5)",
                    border: "none",
                    borderRadius: 12,
                    color: "#ffffff",
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: payoutLoading ? "not-allowed" : "pointer",
                    boxShadow: payoutLoading ? "none" : "0 4px 20px rgba(124,58,237,0.4)",
                  }}
                >
                  {payoutLoading ? "Envoi…" : "💸 Confirmer la demande de retrait"}
                </button>
              </div>
            )}

            {/* Payout history */}
            {payouts.length > 0 && (
              <div style={{ marginTop: 28 }}>
                <h3 style={{ color: "#c4b5fd", fontSize: 14, fontWeight: 700, margin: "0 0 12px" }}>
                  Historique des retraits
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {payouts.map((p) => (
                    <div
                      key={p.id}
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 10,
                        padding: "12px 14px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <div style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 600 }}>
                          {fmt(p.amount)}
                        </div>
                        <div style={{ color: "#64748b", fontSize: 11 }}>{dateFr(p.requestedAt)}</div>
                      </div>
                      <PayoutBadge status={p.status} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── TAB: PROFIL ─── */}
        {tab === "profil" && (
          <div style={{ paddingTop: 24 }}>
            <h2 style={{ color: "#e2e8f0", fontSize: 18, fontWeight: 800, margin: "0 0 20px" }}>
              Mes informations
            </h2>

            <div
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 16,
                padding: "20px",
                marginBottom: 20,
              }}
            >
              <InfoRow label="Nom" value={affiliate.displayName} />
              <InfoRow label="Email" value={affiliate.email} />
              <InfoRow label="Code affilié" value={affiliate.code} mono />
              <InfoRow label="Commission" value={`${data.stats.commissionRate}% par vente`} />
              <InfoRow label="Retrait minimum" value={fmt(affiliate.minPayoutThreshold)} />
            </div>

            <div
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 16,
                padding: "20px",
              }}
            >
              <h3 style={{ color: "#c4b5fd", fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>
                Coordonnées de paiement
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", gap: 8 }}>
                  {(["orange", "mtn"] as const).map((op) => (
                    <button
                      key={op}
                      onClick={() => setPayoutInfo({ ...payoutInfo, operator: op })}
                      style={{
                        flex: 1, padding: "10px",
                        background: payoutInfo.operator === op ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.04)",
                        border: `1px solid ${payoutInfo.operator === op ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.08)"}`,
                        borderRadius: 10,
                        color: payoutInfo.operator === op ? "#fff" : "#94a3b8",
                        fontSize: 12, fontWeight: 700, cursor: "pointer",
                      }}
                    >
                      {op === "orange" ? "🟠 Orange Money" : "🟡 MTN MoMo"}
                    </button>
                  ))}
                </div>
                <input type="tel" placeholder="Numéro Mobile Money" value={payoutInfo.number || ""} onChange={(e) => setPayoutInfo({ ...payoutInfo, number: e.target.value })} style={inputDark} />
              </div>

              {profileOk && (
                <div style={{ marginTop: 12, color: "#4ade80", fontSize: 13, fontWeight: 600 }}>✓ Enregistré</div>
              )}

              <button
                onClick={saveProfile}
                disabled={profileSaving}
                style={{
                  marginTop: 14,
                  width: "100%",
                  padding: "13px",
                  background: "rgba(124,58,237,0.3)",
                  border: "1px solid rgba(124,58,237,0.5)",
                  borderRadius: 10,
                  color: "#c4b5fd",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {profileSaving ? "Enregistrement…" : "Enregistrer"}
              </button>
            </div>

            {/* Password change */}
            <div
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 16,
                padding: "20px",
                marginTop: 16,
              }}
            >
              <h3 style={{ color: "#c4b5fd", fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>
                🔒 Changer mon mot de passe
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <input
                  type="password"
                  placeholder="Mot de passe actuel"
                  value={pwOld}
                  onChange={(e) => setPwOld(e.target.value)}
                  style={inputDark}
                />
                <input
                  type="password"
                  placeholder="Nouveau mot de passe (6 caractères min.)"
                  value={pwNew}
                  onChange={(e) => setPwNew(e.target.value)}
                  style={inputDark}
                />
                <input
                  type="password"
                  placeholder="Confirmer le nouveau mot de passe"
                  value={pwConfirm}
                  onChange={(e) => setPwConfirm(e.target.value)}
                  style={inputDark}
                />
              </div>
              {pwError && (
                <div style={{ marginTop: 10, background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "8px 12px", color: "#fca5a5", fontSize: 13 }}>
                  {pwError}
                </div>
              )}
              {pwOk && (
                <div style={{ marginTop: 10, color: "#4ade80", fontSize: 13, fontWeight: 600 }}>
                  ✓ Mot de passe modifié avec succès
                </div>
              )}
              <button
                onClick={changePassword}
                disabled={pwSaving}
                style={{
                  marginTop: 14,
                  width: "100%",
                  padding: "13px",
                  background: "rgba(239,68,68,0.2)",
                  border: "1px solid rgba(239,68,68,0.35)",
                  borderRadius: 10,
                  color: "#fca5a5",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: pwSaving ? "not-allowed" : "pointer",
                }}
              >
                {pwSaving ? "Modification…" : "Modifier le mot de passe"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "rgba(15,12,41,0.95)",
          backdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          justifyContent: "space-around",
          padding: "10px 0 max(10px, env(safe-area-inset-bottom))",
          zIndex: 20,
        }}
      >
        {[
          { key: "home", icon: "🏠", label: "Accueil" },
          { key: "ventes", icon: "📊", label: "Ventes" },
          { key: "retrait", icon: "💸", label: "Retrait" },
          { key: "profil", icon: "👤", label: "Profil" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as typeof tab)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
              padding: "4px 12px",
              position: "relative",
            }}
          >
            {t.key === "retrait" && canRequestPayout && (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  right: 8,
                  width: 8,
                  height: 8,
                  background: "#4ade80",
                  borderRadius: "50%",
                }}
              />
            )}
            <span style={{ fontSize: 20 }}>{t.icon}</span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: tab === t.key ? "#a855f7" : "#64748b",
              }}
            >
              {t.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

const inputDark: React.CSSProperties = {
  width: "100%",
  padding: "13px 14px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 10,
  color: "#ffffff",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
};

function KpiCard({ icon, label, value, sub, color }: { icon: string; label: string; value: string; sub: string; color: string }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 16,
        padding: "16px",
      }}
    >
      <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontSize: 17, fontWeight: 800, color, marginBottom: 2 }}>{value}</div>
      <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 10, color: "#475569", marginTop: 2 }}>{sub}</div>
    </div>
  );
}

function SaleRow({ sale }: { sale: AffiliateSale }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "8px 0",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <div>
        <div style={{ color: "#e2e8f0", fontSize: 12, fontWeight: 500 }}>{sale.produit}</div>
        <div style={{ color: "#475569", fontSize: 10 }}>
          {new Date(sale.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
        </div>
      </div>
      <div style={{ color: "#4ade80", fontSize: 13, fontWeight: 700 }}>
        +{sale.commission.toLocaleString("fr-FR")} FCFA
      </div>
    </div>
  );
}

function PayoutBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    pending: { bg: "rgba(245,158,11,0.15)", color: "#fbbf24", label: "⏳ En attente" },
    paid: { bg: "rgba(34,197,94,0.15)", color: "#4ade80", label: "✓ Payé" },
    rejected: { bg: "rgba(239,68,68,0.15)", color: "#f87171", label: "✗ Rejeté" },
  };
  const s = map[status] || map.pending;
  return (
    <span
      style={{
        background: s.bg,
        color: s.color,
        fontSize: 11,
        fontWeight: 700,
        padding: "4px 10px",
        borderRadius: 20,
      }}
    >
      {s.label}
    </span>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "8px 0",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <span style={{ color: "#64748b", fontSize: 13 }}>{label}</span>
      <span style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 600, fontFamily: mono ? "monospace" : "inherit" }}>
        {value}
      </span>
    </div>
  );
}

function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <div style={{ textAlign: "center", padding: "40px 20px" }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>
      <div style={{ color: "#64748b", fontSize: 14 }}>{text}</div>
    </div>
  );
}
