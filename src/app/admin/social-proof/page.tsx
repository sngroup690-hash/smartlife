"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { SocialProofConfig, FakeNotif } from "@/app/api/admin/social-proof/route";

const ADMIN_PW = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? "";

const EMPTY_NOTIF: Omit<FakeNotif, "id"> = {
  type: "purchase",
  prenom: "",
  ville: "",
  produit: "",
};

export default function SocialProofAdminPage() {
  const [config, setConfig] = useState<SocialProofConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveOk, setSaveOk] = useState(false);
  const [editNotif, setEditNotif] = useState<FakeNotif | null>(null);
  const [newNotif, setNewNotif] = useState<Omit<FakeNotif, "id">>(EMPTY_NOTIF);
  const [showAdd, setShowAdd] = useState(false);
  const [tab, setTab] = useState<"general" | "notifs" | "fomo">("general");

  useEffect(() => {
    fetch("/api/admin/social-proof", {
      headers: { "x-admin-password": ADMIN_PW },
    })
      .then((r) => r.json())
      .then(setConfig);
  }, []);

  async function save(partial: Partial<SocialProofConfig>) {
    if (!config) return;
    setSaving(true);
    setSaveOk(false);
    const updated = { ...config, ...partial };
    const res = await fetch("/api/admin/social-proof", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": ADMIN_PW,
      },
      body: JSON.stringify(updated),
    });
    const data = await res.json();
    setConfig(data);
    setSaving(false);
    setSaveOk(true);
    setTimeout(() => setSaveOk(false), 2000);
  }

  async function patchNotif(action: "add" | "update" | "delete", notif: FakeNotif) {
    const res = await fetch("/api/admin/social-proof", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": ADMIN_PW,
      },
      body: JSON.stringify({ action, notif }),
    });
    const data = await res.json();
    setConfig(data);
  }

  async function resetFomo() {
    if (!config) return;
    await save({
      fomoCurrentCount: config.fomoInitialCount,
      fomoLastDecreased: new Date().toISOString(),
    });
  }

  if (!config) {
    return (
      <div className="admin-panel min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500 text-lg">Chargement…</div>
      </div>
    );
  }

  return (
    <div className="admin-panel min-h-screen bg-gray-50">
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "32px 20px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
          <Link
            href="/admin"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              color: "#6b7280",
              textDecoration: "none",
              fontSize: 14,
            }}
          >
            ← Retour
          </Link>
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#111827" }}>
              🔔 Preuve Sociale & FOMO
            </h1>
            <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 14 }}>
              Notifications pop-up pour augmenter les conversions
            </p>
          </div>
          {/* Toggle global */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: config.enabled ? "#dcfce7" : "#f3f4f6",
              padding: "8px 16px",
              borderRadius: 24,
              cursor: "pointer",
              border: `2px solid ${config.enabled ? "#27A827" : "#d1d5db"}`,
              transition: "all 0.2s",
            }}
            onClick={() => save({ enabled: !config.enabled })}
          >
            <div
              style={{
                width: 36,
                height: 20,
                background: config.enabled ? "#27A827" : "#d1d5db",
                borderRadius: 10,
                position: "relative",
                transition: "background 0.2s",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 2,
                  left: config.enabled ? 18 : 2,
                  width: 16,
                  height: 16,
                  background: "#fff",
                  borderRadius: "50%",
                  transition: "left 0.2s",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                }}
              />
            </div>
            <span style={{ fontWeight: 600, fontSize: 14, color: config.enabled ? "#27A827" : "#6b7280" }}>
              {config.enabled ? "Activé" : "Désactivé"}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            gap: 4,
            borderBottom: "2px solid #e5e7eb",
            marginBottom: 28,
          }}
        >
          {[
            { key: "general", label: "⚙️ Paramètres généraux" },
            { key: "notifs", label: "💬 Notifications simulées" },
            { key: "fomo", label: "⚡ FOMO" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as typeof tab)}
              style={{
                padding: "10px 18px",
                border: "none",
                background: "none",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: tab === t.key ? 700 : 500,
                color: tab === t.key ? "#2563eb" : "#6b7280",
                borderBottom: tab === t.key ? "2px solid #2563eb" : "2px solid transparent",
                marginBottom: -2,
                transition: "all 0.15s",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* TAB: Paramètres généraux */}
        {tab === "general" && (
          <Card title="Paramètres d'affichage">
            <Row label="Mode de notification">
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {(["fake", "real", "mixed"] as const).map((m) => (
                  <ModeButton
                    key={m}
                    active={config.mode === m}
                    label={m === "fake" ? "🎭 Simulé" : m === "real" ? "✅ Réel (DB)" : "🔀 Mixte"}
                    desc={
                      m === "fake"
                        ? "Notifications fictives configurées"
                        : m === "real"
                        ? "Vrais achats de la base de données"
                        : "Mélange des deux"
                    }
                    onClick={() => save({ mode: m })}
                  />
                ))}
              </div>
            </Row>

            <Row label="Position">
              <div style={{ display: "flex", gap: 8 }}>
                {(["bottom-left", "bottom-right"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => save({ position: p })}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 8,
                      border: `2px solid ${config.position === p ? "#2563eb" : "#e5e7eb"}`,
                      background: config.position === p ? "#eff6ff" : "#fff",
                      color: config.position === p ? "#2563eb" : "#374151",
                      fontWeight: config.position === p ? 600 : 400,
                      cursor: "pointer",
                      fontSize: 13,
                    }}
                  >
                    {p === "bottom-left" ? "↙ Bas gauche" : "↘ Bas droite"}
                  </button>
                ))}
              </div>
            </Row>

            <Row label="Délai entre les popups">
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <input
                  type="range"
                  min={5}
                  max={120}
                  step={5}
                  value={config.delayBetween}
                  onChange={(e) => setConfig({ ...config, delayBetween: +e.target.value })}
                  onMouseUp={() => save({ delayBetween: config.delayBetween })}
                  style={{ flex: 1 }}
                />
                <span
                  style={{
                    minWidth: 60,
                    textAlign: "center",
                    fontWeight: 700,
                    color: "#2563eb",
                    fontSize: 15,
                  }}
                >
                  {config.delayBetween}s
                </span>
              </div>
            </Row>

            <Row label="Durée d'affichage">
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <input
                  type="range"
                  min={2}
                  max={15}
                  step={1}
                  value={config.displayDuration}
                  onChange={(e) => setConfig({ ...config, displayDuration: +e.target.value })}
                  onMouseUp={() => save({ displayDuration: config.displayDuration })}
                  style={{ flex: 1 }}
                />
                <span
                  style={{
                    minWidth: 60,
                    textAlign: "center",
                    fontWeight: 700,
                    color: "#2563eb",
                    fontSize: 15,
                  }}
                >
                  {config.displayDuration}s
                </span>
              </div>
            </Row>

            <Row label="Afficher sur mobile">
              <Toggle
                value={config.mobileEnabled}
                onChange={(v) => save({ mobileEnabled: v })}
              />
            </Row>

            {saveOk && (
              <div
                style={{
                  marginTop: 16,
                  padding: "8px 16px",
                  background: "#dcfce7",
                  color: "#27A827",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                ✓ Enregistré avec succès
              </div>
            )}
          </Card>
        )}

        {/* TAB: Notifications simulées */}
        {tab === "notifs" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <Card title="Notifications fictives">
              <p style={{ margin: "0 0 16px", color: "#6b7280", fontSize: 13 }}>
                Ces notifications seront affichées en mode «&nbsp;Simulé&nbsp;» ou «&nbsp;Mixte&nbsp;».
              </p>

              {config.fakeNotifs.length === 0 && (
                <p style={{ color: "#9ca3af", fontStyle: "italic", fontSize: 13 }}>
                  Aucune notification configurée.
                </p>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {config.fakeNotifs.map((n) =>
                  editNotif?.id === n.id ? (
                    <NotifEditRow
                      key={n.id}
                      notif={editNotif}
                      onChange={setEditNotif}
                      onSave={() => {
                        patchNotif("update", editNotif);
                        setEditNotif(null);
                      }}
                      onCancel={() => setEditNotif(null)}
                    />
                  ) : (
                    <div
                      key={n.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "10px 14px",
                        background: "#f9fafb",
                        borderRadius: 10,
                        border: "1px solid #e5e7eb",
                      }}
                    >
                      <span style={{ fontSize: 20 }}>
                        {n.type === "purchase" ? "🛒" : "📥"}
                      </span>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontWeight: 600, color: "#111827", fontSize: 13 }}>
                          {n.prenom}
                        </span>{" "}
                        <span style={{ color: "#6b7280", fontSize: 13 }}>
                          de {n.ville} —{" "}
                          {n.type === "purchase" ? "achat" : "téléchargement"} de{" "}
                          <em>{n.produit}</em>
                        </span>
                      </div>
                      <button
                        onClick={() => setEditNotif({ ...n })}
                        style={btnStyle("blue")}
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => patchNotif("delete", n)}
                        style={btnStyle("red")}
                      >
                        Supprimer
                      </button>
                    </div>
                  )
                )}
              </div>

              {showAdd ? (
                <div style={{ marginTop: 16 }}>
                  <NotifEditRow
                    notif={{ id: "", ...newNotif }}
                    onChange={(n) => setNewNotif({ type: n.type, prenom: n.prenom, ville: n.ville, produit: n.produit })}
                    onSave={() => {
                      patchNotif("add", { id: "", ...newNotif });
                      setNewNotif(EMPTY_NOTIF);
                      setShowAdd(false);
                    }}
                    onCancel={() => {
                      setNewNotif(EMPTY_NOTIF);
                      setShowAdd(false);
                    }}
                  />
                </div>
              ) : (
                <button
                  onClick={() => setShowAdd(true)}
                  style={{
                    marginTop: 16,
                    padding: "10px 20px",
                    background: "#2563eb",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: 13,
                  }}
                >
                  + Ajouter une notification
                </button>
              )}
            </Card>
          </div>
        )}

        {/* TAB: FOMO */}
        {tab === "fomo" && (
          <Card title="Configuration FOMO">
            <Row label="Activer le FOMO">
              <Toggle
                value={config.fomoEnabled}
                onChange={(v) => save({ fomoEnabled: v })}
              />
            </Row>

            <Row label="Message FOMO">
              <input
                type="text"
                value={config.fomoMessage}
                onChange={(e) => setConfig({ ...config, fomoMessage: e.target.value })}
                onBlur={() => save({ fomoMessage: config.fomoMessage })}
                placeholder="⚡ Plus que {X} accès disponibles !"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: 8,
                  fontSize: 13,
                  color: "#111827",
                  background: "#fff",
                }}
              />
              <p style={{ margin: "4px 0 0", color: "#9ca3af", fontSize: 12 }}>
                Utilisez {"{X}"} pour afficher le compteur actuel.
              </p>
            </Row>

            <Row label="Compteur initial">
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <input
                  type="number"
                  min={1}
                  max={999}
                  value={config.fomoInitialCount}
                  onChange={(e) =>
                    setConfig({ ...config, fomoInitialCount: +e.target.value })
                  }
                  onBlur={() => save({ fomoInitialCount: config.fomoInitialCount })}
                  style={{
                    width: 80,
                    padding: "8px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    textAlign: "center",
                    color: "#111827",
                    background: "#fff",
                  }}
                />
              </div>
            </Row>

            <Row label="Compteur actuel">
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <span
                  style={{
                    fontSize: 28,
                    fontWeight: 800,
                    color: config.fomoCurrentCount <= 3 ? "#dc2626" : "#2563eb",
                  }}
                >
                  {config.fomoCurrentCount}
                </span>
                <button
                  onClick={resetFomo}
                  style={{
                    padding: "6px 14px",
                    background: "#f3f4f6",
                    border: "1px solid #d1d5db",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontSize: 12,
                    color: "#374151",
                    fontWeight: 600,
                  }}
                >
                  Réinitialiser à {config.fomoInitialCount}
                </button>
              </div>
            </Row>

            <Row label="Décrémenter automatiquement">
              <Toggle
                value={config.fomoDecreasing}
                onChange={(v) => save({ fomoDecreasing: v })}
              />
            </Row>

            <Row label="Intervalle de décrémentation">
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <input
                  type="number"
                  min={1}
                  max={1440}
                  value={config.fomoDecreaseIntervalMin}
                  onChange={(e) =>
                    setConfig({ ...config, fomoDecreaseIntervalMin: +e.target.value })
                  }
                  onBlur={() => save({ fomoDecreaseIntervalMin: config.fomoDecreaseIntervalMin })}
                  style={{
                    width: 80,
                    padding: "8px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    textAlign: "center",
                    color: "#111827",
                    background: "#fff",
                  }}
                />
                <span style={{ color: "#6b7280", fontSize: 13 }}>minutes</span>
              </div>
              <p style={{ margin: "4px 0 0", color: "#9ca3af", fontSize: 12 }}>
                Le compteur baisse de 1 toutes les X minutes automatiquement.
              </p>
            </Row>

            {/* Aperçu FOMO */}
            {config.fomoEnabled && (
              <div style={{ marginTop: 24 }}>
                <p style={{ margin: "0 0 8px", fontWeight: 600, fontSize: 13, color: "#374151" }}>
                  Aperçu :
                </p>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 10,
                    background: "linear-gradient(135deg, #ff6b35 0%, #f7c59f 100%)",
                    borderRadius: 12,
                    padding: "12px 16px",
                    boxShadow: "0 4px 20px rgba(255,107,53,0.3)",
                  }}
                >
                  <span style={{ fontSize: 22 }}>⚡</span>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#ffffff",
                    }}
                  >
                    {config.fomoMessage.replace("{X}", String(config.fomoCurrentCount))}
                  </p>
                </div>
              </div>
            )}

            {saveOk && (
              <div
                style={{
                  marginTop: 16,
                  padding: "8px 16px",
                  background: "#dcfce7",
                  color: "#27A827",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                ✓ Enregistré
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}

// --- Sub-components ---

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 12,
        border: "1px solid #e5e7eb",
        padding: "24px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      }}
    >
      <h2
        style={{
          margin: "0 0 20px",
          fontSize: 16,
          fontWeight: 700,
          color: "#111827",
          borderBottom: "1px solid #f3f4f6",
          paddingBottom: 12,
        }}
      >
        {title}
      </h2>
      {children}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        marginBottom: 20,
      }}
    >
      <label style={{ fontWeight: 600, fontSize: 13, color: "#374151" }}>{label}</label>
      {children}
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        cursor: "pointer",
      }}
      onClick={() => onChange(!value)}
    >
      <div
        style={{
          width: 44,
          height: 24,
          background: value ? "#2563eb" : "#d1d5db",
          borderRadius: 12,
          position: "relative",
          transition: "background 0.2s",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 3,
            left: value ? 22 : 3,
            width: 18,
            height: 18,
            background: "#fff",
            borderRadius: "50%",
            transition: "left 0.2s",
            boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
          }}
        />
      </div>
      <span style={{ fontSize: 13, color: value ? "#2563eb" : "#6b7280", fontWeight: 600 }}>
        {value ? "Oui" : "Non"}
      </span>
    </div>
  );
}

function ModeButton({
  active,
  label,
  desc,
  onClick,
}: {
  active: boolean;
  label: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "10px 16px",
        borderRadius: 10,
        border: `2px solid ${active ? "#2563eb" : "#e5e7eb"}`,
        background: active ? "#eff6ff" : "#fff",
        cursor: "pointer",
        textAlign: "left",
        minWidth: 140,
      }}
    >
      <div style={{ fontWeight: 700, fontSize: 13, color: active ? "#2563eb" : "#374151" }}>
        {label}
      </div>
      <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{desc}</div>
    </button>
  );
}

function NotifEditRow({
  notif,
  onChange,
  onSave,
  onCancel,
}: {
  notif: FakeNotif;
  onChange: (n: FakeNotif) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      style={{
        padding: 14,
        background: "#f0f9ff",
        border: "2px solid #2563eb",
        borderRadius: 10,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <select
          value={notif.type}
          onChange={(e) => onChange({ ...notif, type: e.target.value as "purchase" | "download" })}
          style={inputStyle}
        >
          <option value="purchase">🛒 Achat</option>
          <option value="download">📥 Téléchargement</option>
        </select>
        <input
          style={{ ...inputStyle, flex: 1, minWidth: 100 }}
          placeholder="Prénom"
          value={notif.prenom}
          onChange={(e) => onChange({ ...notif, prenom: e.target.value })}
        />
        <input
          style={{ ...inputStyle, flex: 1, minWidth: 100 }}
          placeholder="Ville"
          value={notif.ville}
          onChange={(e) => onChange({ ...notif, ville: e.target.value })}
        />
        <input
          style={{ ...inputStyle, flex: 2, minWidth: 150 }}
          placeholder="Nom du produit"
          value={notif.produit}
          onChange={(e) => onChange({ ...notif, produit: e.target.value })}
        />
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={onSave}
          style={{
            padding: "7px 18px",
            background: "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: 7,
            cursor: "pointer",
            fontWeight: 700,
            fontSize: 13,
          }}
        >
          Enregistrer
        </button>
        <button
          onClick={onCancel}
          style={{
            padding: "7px 14px",
            background: "#f3f4f6",
            color: "#374151",
            border: "1px solid #d1d5db",
            borderRadius: 7,
            cursor: "pointer",
            fontSize: 13,
          }}
        >
          Annuler
        </button>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "7px 10px",
  border: "1px solid #d1d5db",
  borderRadius: 7,
  fontSize: 13,
  color: "#111827",
  background: "#fff",
};

function btnStyle(color: "blue" | "red"): React.CSSProperties {
  return {
    padding: "5px 12px",
    background: color === "blue" ? "#eff6ff" : "#fef2f2",
    color: color === "blue" ? "#2563eb" : "#dc2626",
    border: `1px solid ${color === "blue" ? "#bfdbfe" : "#fecaca"}`,
    borderRadius: 7,
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 600,
  };
}