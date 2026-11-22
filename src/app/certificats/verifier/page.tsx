"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

type CertData = {
  id: string;
  userName: string;
  formationTitle: string;
  level: string;
  completedAt: string;
  issuedAt: string;
  valid: boolean;
};

export default function VerifyCertificatePage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0f1729 0%, #1a2744 100%)" }} />}>
      <VerifyInner />
    </Suspense>
  );
}

function VerifyInner() {
  const params = useSearchParams();
  const certId = params.get("id") || "";
  const [cert, setCert] = useState<CertData | null>(null);
  const [status, setStatus] = useState<"loading" | "valid" | "invalid" | "not_found">("loading");

  useEffect(() => {
    if (!certId) { setStatus("invalid"); return; }
    fetch(`/api/certificats/verifier?id=${encodeURIComponent(certId)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.valid && d.cert) { setCert(d.cert); setStatus("valid"); }
        else if (d.invalidated) setStatus("invalid");
        else setStatus("not_found");
      })
      .catch(() => setStatus("not_found"));
  }, [certId]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0f1729 0%, #1a2744 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div style={{ width: "100%", maxWidth: 480 }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ color: "#D4A017", fontSize: 13, fontWeight: 700, letterSpacing: "0.15em", marginBottom: 4 }}>
            SMART LIFE
          </div>
          <h1 style={{ color: "#ffffff", fontSize: 22, fontWeight: 800, margin: 0 }}>
            Vérification de Certificat
          </h1>
          <p style={{ color: "#94a3b8", fontSize: 13, margin: "6px 0 0" }}>
            Authenticité & validité du certificat
          </p>
        </div>

        <div
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 20,
            padding: "28px 24px",
            textAlign: "center",
          }}
        >
          {status === "loading" && (
            <div style={{ color: "#94a3b8", fontSize: 14 }}>Vérification en cours…</div>
          )}

          {status === "valid" && cert && (
            <>
              <div style={{ fontSize: 52, marginBottom: 12 }}>🎓</div>
              <div
                style={{
                  display: "inline-block",
                  background: "rgba(34,197,94,0.15)",
                  border: "1px solid rgba(34,197,94,0.35)",
                  borderRadius: 30,
                  padding: "6px 20px",
                  color: "#4ade80",
                  fontSize: 13,
                  fontWeight: 700,
                  marginBottom: 20,
                }}
              >
                ✓ Certificat valide et authentique
              </div>

              <div style={{ marginBottom: 20 }}>
                <p style={{ color: "#94a3b8", fontSize: 11, margin: "0 0 4px" }}>DÉCERNÉ À</p>
                <p style={{ color: "#ffffff", fontSize: 20, fontWeight: 800, margin: 0 }}>{cert.userName}</p>
              </div>

              <div
                style={{
                  background: "rgba(255,255,255,0.04)",
                  borderRadius: 12,
                  padding: "16px",
                  marginBottom: 20,
                  textAlign: "left",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                <InfoRow label="Formation" value={cert.formationTitle} />
                <InfoRow label="Niveau" value={cert.level} />
                <InfoRow label="Complété le" value={new Date(cert.completedAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })} />
                <InfoRow label="Délivré le" value={new Date(cert.issuedAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })} />
                <InfoRow label="N° de certificat" value={cert.id} mono />
              </div>

              <p style={{ color: "#64748b", fontSize: 11 }}>
                Ce certificat a été délivré par Smart Life — smartlifecm.com
              </p>
            </>
          )}

          {status === "invalid" && (
            <>
              <div style={{ fontSize: 52, marginBottom: 12 }}>⚠️</div>
              <div
                style={{
                  display: "inline-block",
                  background: "rgba(239,68,68,0.15)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  borderRadius: 30,
                  padding: "6px 20px",
                  color: "#f87171",
                  fontSize: 13,
                  fontWeight: 700,
                  marginBottom: 16,
                }}
              >
                ✗ Certificat invalidé
              </div>
              <p style={{ color: "#94a3b8", fontSize: 13 }}>
                Ce certificat a été révoqué par Smart Life.
              </p>
            </>
          )}

          {status === "not_found" && (
            <>
              <div style={{ fontSize: 52, marginBottom: 12 }}>🔍</div>
              <div
                style={{
                  display: "inline-block",
                  background: "rgba(100,116,139,0.15)",
                  border: "1px solid rgba(100,116,139,0.3)",
                  borderRadius: 30,
                  padding: "6px 20px",
                  color: "#94a3b8",
                  fontSize: 13,
                  fontWeight: 700,
                  marginBottom: 16,
                }}
              >
                Certificat introuvable
              </div>
              <p style={{ color: "#94a3b8", fontSize: 13 }}>
                Ce numéro ne correspond à aucun certificat dans notre registre.<br />
                Vérifiez que l&apos;identifiant est correct.
              </p>
            </>
          )}
        </div>

        <div style={{ textAlign: "center", marginTop: 20 }}>
          <Link href="/" style={{ color: "#D4A017", fontSize: 13, textDecoration: "none" }}>
            ← Retour à Smart Life
          </Link>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
      <span style={{ color: "#64748b", fontSize: 12 }}>{label}</span>
      <span style={{
        color: "#e2e8f0", fontSize: 12, fontWeight: 600,
        fontFamily: mono ? "monospace" : "inherit",
        textAlign: "right", flex: 1,
      }}>
        {value}
      </span>
    </div>
  );
}
