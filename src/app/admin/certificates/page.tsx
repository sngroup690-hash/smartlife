"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { CertificateRecord, CertificateConfig } from "@/lib/certificate-types";
import { DEFAULT_CERT_CONFIG } from "@/lib/certificate-types";

const ADMIN_PW = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? "";
const H = { "Content-Type": "application/json", "x-admin-password": ADMIN_PW };

export default function AdminCertificatesPage() {
  const [certs, setCerts] = useState<CertificateRecord[]>([]);
  const [config, setConfig] = useState<CertificateConfig>(DEFAULT_CERT_CONFIG);
  const [tab, setTab] = useState<"registry" | "settings">("registry");
  const [search, setSearch] = useState("");
  const [savingConfig, setSavingConfig] = useState(false);
  const [configOk, setConfigOk] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    const [certsRes, cfgRes] = await Promise.all([
      fetch("/api/admin/certificates", { headers: { "x-admin-password": ADMIN_PW } }),
      fetch("/api/admin/certificates/config", { headers: { "x-admin-password": ADMIN_PW } }),
    ]);
    setCerts(await certsRes.json());
    setConfig(await cfgRes.json());
  }

  async function toggleValidity(cert: CertificateRecord) {
    setTogglingId(cert.id);
    await fetch("/api/admin/certificates", {
      method: "PATCH",
      headers: H,
      body: JSON.stringify({ id: cert.id, valid: !cert.valid }),
    });
    setTogglingId(null);
    loadAll();
  }

  async function saveConfig() {
    setSavingConfig(true);
    await fetch("/api/admin/certificates/config", {
      method: "POST",
      headers: H,
      body: JSON.stringify(config),
    });
    setSavingConfig(false);
    setConfigOk(true);
    setTimeout(() => setConfigOk(false), 2000);
  }

  const filtered = certs.filter(
    (c) =>
      !search ||
      c.userName.toLowerCase().includes(search.toLowerCase()) ||
      c.formationTitle.toLowerCase().includes(search.toLowerCase()) ||
      c.id.toLowerCase().includes(search.toLowerCase()) ||
      c.userEmail.toLowerCase().includes(search.toLowerCase())
  );

  const validCount = certs.filter((c) => c.valid).length;
  const invalidCount = certs.filter((c) => !c.valid).length;

  return (
    <div className="admin-panel min-h-screen bg-gray-50">
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 20px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
          <Link href="/admin" style={{ color: "#6b7280", textDecoration: "none", fontSize: 14 }}>
            ← Retour
          </Link>
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#111827" }}>
              🎓 Registre des Certificats
            </h1>
            <p style={{ margin: "2px 0 0", color: "#6b7280", fontSize: 13 }}>
              {validCount} valide(s) · {invalidCount} révoqué(s) · {certs.length} total
            </p>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
          {[
            { icon: "🎓", label: "Total délivrés", value: certs.length, color: "#7c3aed" },
            { icon: "✅", label: "Valides", value: validCount, color: "#27A827" },
            { icon: "🚫", label: "Révoqués", value: invalidCount, color: "#dc2626" },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                padding: "16px",
                textAlign: "center",
                boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
              }}
            >
              <div style={{ fontSize: 24, marginBottom: 4 }}>{s.icon}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, borderBottom: "2px solid #e5e7eb", marginBottom: 24 }}>
          {[
            { key: "registry", label: "📋 Registre" },
            { key: "settings", label: "⚙️ Modèle & Paramètres" },
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
                color: tab === t.key ? "#7c3aed" : "#6b7280",
                borderBottom: tab === t.key ? "2px solid #7c3aed" : "2px solid transparent",
                marginBottom: -2,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* REGISTRY */}
        {tab === "registry" && (
          <>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom, email, formation, ID..."
              style={{
                width: "100%",
                padding: "12px 16px",
                border: "1px solid #d1d5db",
                borderRadius: 10,
                fontSize: 14,
                marginBottom: 16,
                color: "#111827",
                background: "#fff",
                boxSizing: "border-box",
              }}
            />

            {filtered.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px", color: "#9ca3af" }}>
                {search ? "Aucun résultat pour cette recherche." : "Aucun certificat délivré pour le moment."}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {filtered.map((cert) => (
                <div
                  key={cert.id}
                  style={{
                    background: "#fff",
                    border: `1px solid ${cert.valid ? "#e5e7eb" : "#fecaca"}`,
                    borderRadius: 12,
                    padding: "16px 20px",
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    flexWrap: "wrap",
                    opacity: cert.valid ? 1 : 0.65,
                    boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                  }}
                >
                  {/* Icon */}
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: "50%",
                      background: cert.valid ? "#f5f3ff" : "#fef2f2",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 20,
                      flexShrink: 0,
                    }}
                  >
                    {cert.valid ? "🎓" : "🚫"}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 700, color: "#111827", fontSize: 14 }}>{cert.userName}</span>
                      <span style={{ color: "#6b7280", fontSize: 12 }}>{cert.userEmail}</span>
                      <span
                        style={{
                          fontFamily: "monospace",
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#7c3aed",
                          background: "#f5f3ff",
                          padding: "2px 8px",
                          borderRadius: 6,
                        }}
                      >
                        {cert.id}
                      </span>
                    </div>
                    <div style={{ color: "#374151", fontSize: 13, marginTop: 3 }}>
                      {cert.formationTitle}
                    </div>
                    <div style={{ color: "#9ca3af", fontSize: 11, marginTop: 2 }}>
                      Complété le {new Date(cert.completedAt).toLocaleDateString("fr-FR")} · Délivré le {new Date(cert.issuedAt).toLocaleDateString("fr-FR")} · Niveau : {cert.level}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <a
                      href={`/certificats/verifier?id=${cert.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: "6px 14px",
                        background: "#eff6ff",
                        color: "#2563eb",
                        border: "1px solid #bfdbfe",
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 600,
                        textDecoration: "none",
                      }}
                    >
                      Vérifier
                    </a>
                    <button
                      onClick={() => toggleValidity(cert)}
                      disabled={togglingId === cert.id}
                      style={{
                        padding: "6px 14px",
                        background: cert.valid ? "#fef2f2" : "#dcfce7",
                        color: cert.valid ? "#dc2626" : "#27A827",
                        border: `1px solid ${cert.valid ? "#fecaca" : "#bbf7d0"}`,
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      {togglingId === cert.id ? "…" : cert.valid ? "Révoquer" : "Réactiver"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* SETTINGS */}
        {tab === "settings" && (
          <div
            style={{
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: 14,
              padding: "28px",
              boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
            }}
          >
            <h2 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700, color: "#111827" }}>
              Personnalisation du Certificat
            </h2>
            <p style={{ margin: "0 0 24px", color: "#6b7280", fontSize: 13 }}>
              Ces informations apparaissent sur tous les certificats générés.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
              <CfgField
                label="Nom de l'organisation"
                value={config.organizationName}
                onChange={(v) => setConfig({ ...config, organizationName: v })}
                placeholder="SMART LIFE"
              />
              <CfgField
                label="URL du site"
                value={config.websiteUrl}
                onChange={(v) => setConfig({ ...config, websiteUrl: v })}
                placeholder="https://smartlifecm.com"
              />
              <CfgField
                label="Nom du signataire"
                value={config.signatoryName}
                onChange={(v) => setConfig({ ...config, signatoryName: v })}
                placeholder="Smart Life"
              />
              <CfgField
                label="Titre du signataire"
                value={config.signatoryTitle}
                onChange={(v) => setConfig({ ...config, signatoryTitle: v })}
                placeholder="Fondateur & Directeur Pédagogique"
              />
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ fontWeight: 600, fontSize: 13, color: "#374151", display: "block", marginBottom: 6 }}>
                  Texte du pied de page
                </label>
                <textarea
                  value={config.footerText}
                  onChange={(e) => setConfig({ ...config, footerText: e.target.value })}
                  rows={2}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: 8,
                    fontSize: 13,
                    color: "#111827",
                    background: "#fff",
                    boxSizing: "border-box",
                    resize: "vertical",
                  }}
                />
              </div>
            </div>

            {configOk && (
              <p style={{ color: "#27A827", fontSize: 13, fontWeight: 600, margin: "16px 0 0" }}>✓ Enregistré !</p>
            )}

            <button
              onClick={saveConfig}
              disabled={savingConfig}
              style={{
                marginTop: 20,
                padding: "11px 28px",
                background: "#7c3aed",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                cursor: "pointer",
                fontWeight: 700,
                fontSize: 14,
                opacity: savingConfig ? 0.6 : 1,
              }}
            >
              {savingConfig ? "Enregistrement…" : "Enregistrer les paramètres"}
            </button>

            {/* Preview note */}
            <div
              style={{
                marginTop: 24,
                padding: "14px 16px",
                background: "#fffbeb",
                border: "1px solid #fde68a",
                borderRadius: 10,
                fontSize: 13,
                color: "#92400e",
              }}
            >
              💡 Le design du certificat est généré automatiquement par le système. Les informations ci-dessus personnalisent le texte du signataire, le tampon et le pied de page. Le certificat inclut toujours le nom de l&apos;apprenant, la formation, la date et le numéro unique.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CfgField({ label, value, onChange, placeholder }: {
  label: string; value: string;
  onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div>
      <label style={{ fontWeight: 600, fontSize: 13, color: "#374151", display: "block", marginBottom: 6 }}>
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          padding: "9px 12px",
          border: "1px solid #d1d5db",
          borderRadius: 8,
          fontSize: 13,
          color: "#111827",
          background: "#fff",
          boxSizing: "border-box",
        }}
      />
    </div>
  );
}