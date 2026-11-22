"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Save, CheckCircle, AlertCircle, FileText, RefreshCw } from "lucide-react";
import type { InvoiceConfig } from "@/lib/invoice-config";

const FIELDS: { key: keyof InvoiceConfig; label: string; placeholder: string; type?: string }[] = [
  { key: "companyName",         label: "Nom de l'entreprise",       placeholder: "SMART LIFE" },
  { key: "slogan",              label: "Slogan",                    placeholder: "La plateforme des entrepreneurs africains" },
  { key: "website",             label: "Site web",                  placeholder: "smartlifecm.com" },
  { key: "supportEmail",        label: "Email de support",          placeholder: "support@smartlifecm.com" },
  { key: "phone",               label: "Téléphone",                 placeholder: "+237 694 176 642" },
  { key: "confirmationMessage", label: "Message de confirmation",   placeholder: "Paiement confirme - Merci pour votre achat !" },
  { key: "legalMention",        label: "Mention légale",            placeholder: "Ce document est une facture electronique valant justificatif de paiement." },
  { key: "primaryColor",        label: "Couleur principale",        placeholder: "#E8B800", type: "color" },
];

export default function InvoiceConfigClient() {
  const [form, setForm] = useState<InvoiceConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [error, setError] = useState("");

  const adminPw = typeof window !== "undefined"
    ? (sessionStorage.getItem("adminPassword") ?? localStorage.getItem("adminPassword") ?? "")
    : "";

  useEffect(() => {
    fetch("/api/admin/invoice-config", {
      headers: { "x-admin-password": adminPw },
    })
      .then((r) => r.json())
      .then((data) => { setForm(data); setLoading(false); })
      .catch(() => { setError("Impossible de charger la config."); setLoading(false); });
  }, [adminPw]);

  async function handleSave() {
    if (!form) return;
    setSaving(true);
    setStatus("idle");
    try {
      const res = await fetch("/api/admin/invoice-config", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-password": adminPw },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      setStatus("success");
      setTimeout(() => setStatus("idle"), 3000);
    } catch {
      setStatus("error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <RefreshCw className="w-6 h-6 animate-spin text-yellow-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4">
        <Link href="/admin" className="text-gray-500 hover:text-gray-800 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-yellow-500" />
          <h1 className="text-lg font-bold text-gray-900">Personnalisation de la facture</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
          <p className="text-sm text-gray-500">
            Ces informations apparaissent sur le PDF de facture envoyé aux clients après chaque achat.
          </p>

          {form && FIELDS.map(({ key, label, placeholder, type }) => (
            <div key={key}>
              <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
              {type === "color" ? (
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className="w-12 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    placeholder={placeholder}
                    className="flex-1 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-yellow-400 transition-colors font-mono"
                  />
                </div>
              ) : (
                <input
                  type="text"
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  placeholder={placeholder}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-yellow-400 transition-colors"
                />
              )}
            </div>
          ))}

          {/* Aperçu couleur */}
          {form && (
            <div className="mt-2 rounded-xl overflow-hidden border border-gray-100">
              <div
                className="px-4 py-3 flex items-center justify-between"
                style={{ backgroundColor: "#0d1730" }}
              >
                <div>
                  <span className="font-bold text-base" style={{ color: form.primaryColor }}>
                    {form.companyName}
                  </span>
                  <p className="text-xs text-gray-400 mt-0.5">{form.slogan}</p>
                </div>
                <span className="text-white font-bold text-lg">FACTURE</span>
              </div>
              <div
                className="h-1"
                style={{ backgroundColor: form.primaryColor }}
              />
              <div className="bg-gray-50 px-4 py-2 text-xs text-gray-400 flex justify-between">
                <span>{form.companyName} | {form.website}</span>
                <span>{form.supportEmail}</span>
              </div>
            </div>
          )}

          {/* Bouton */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-colors"
            style={{ backgroundColor: form?.primaryColor ?? "#E8B800", color: "#000" }}
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : status === "success" ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? "Sauvegarde..." : status === "success" ? "Sauvegardé !" : "Sauvegarder"}
          </button>

          {status === "error" && (
            <p className="text-center text-red-500 text-sm flex items-center justify-center gap-1">
              <AlertCircle className="w-4 h-4" />
              Erreur lors de la sauvegarde.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
