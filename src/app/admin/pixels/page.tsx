"use client";

import { useState } from "react";
import { Save, Eye, EyeOff, CheckCircle, AlertCircle, ArrowLeft, ExternalLink, Zap, ShoppingCart, MousePointer, CreditCard, Package, Server } from "lucide-react";
import Link from "next/link";

type PixelsConfig = {
  facebook: { enabled: boolean; pixelId: string; capiToken?: string };
  tiktok: { enabled: boolean; pixelId: string };
  googleAds: { enabled: boolean; conversionId: string; conversionLabel: string };
};

const DEFAULT: PixelsConfig = {
  facebook: { enabled: false, pixelId: "", capiToken: "" },
  tiktok: { enabled: false, pixelId: "" },
  googleAds: { enabled: false, conversionId: "", conversionLabel: "" },
};

/** Extrait l'ID numérique depuis un code pixel collé (script complet, URL ou ID brut) */
function extractFbPixelId(raw: string): string {
  const trimmed = raw.trim();
  // ID brut numérique
  if (/^\d{10,20}$/.test(trimmed)) return trimmed;
  // fbq('init', '1234567890') dans un script
  const fromInit = trimmed.match(/fbq\s*\(\s*['"]init['"]\s*,\s*['"](\d{10,20})['"]/);
  if (fromInit) return fromInit[1];
  // URL facebook.com/tr?id=...
  const fromUrl = trimmed.match(/[?&]id=(\d{10,20})/);
  if (fromUrl) return fromUrl[1];
  // Cas: n.queue.push(['init','ID'])
  const fromPush = trimmed.match(/['"](\d{10,20})['"]/);
  if (fromPush) return fromPush[1];
  return trimmed;
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${checked ? "bg-green-500" : "bg-gray-300"}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? "translate-x-6" : "translate-x-0"}`} />
      </button>
      <span className={`text-sm font-medium ${checked ? "text-green-600" : "text-gray-500"}`}>{label}</span>
    </label>
  );
}

function FieldGroup({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-gray-700 text-sm font-medium mb-1">{label}</label>
      {hint && <p className="text-gray-400 text-xs mb-2">{hint}</p>}
      {children}
    </div>
  );
}

const inputCls = "w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-green-500 transition-colors font-mono";

const EVENTS = [
  { icon: MousePointer, label: "PageView", desc: "Déclenché sur chaque page visitée — base de tout tracking Facebook", color: "text-blue-600", bg: "bg-blue-50" },
  { icon: Package, label: "ViewContent", desc: "Page produit ebook ou formation consultée", color: "text-purple-600", bg: "bg-purple-50" },
  { icon: ShoppingCart, label: "AddToCart", desc: "Utilisateur arrive sur la page de paiement", color: "text-orange-600", bg: "bg-orange-50" },
  { icon: CreditCard, label: "InitiateCheckout", desc: "Utilisateur clique sur « Payer » — optimise les campagnes de conversion", color: "text-yellow-700", bg: "bg-yellow-50" },
  { icon: Zap, label: "Purchase", desc: "Achat confirmé avec le montant exact — remonte dans Gestionnaire de publicités comme « Achat sur le site »", color: "text-green-600", bg: "bg-green-50" },
];

export default function AdminPixelsPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState("");

  const [config, setConfig] = useState<PixelsConfig>(DEFAULT);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [showIds, setShowIds] = useState(false);
  const [fbRawInput, setFbRawInput] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setAuthError("");
    const res = await fetch("/api/admin/pixels", { headers: { "x-admin-password": password } });
    if (res.ok) {
      const data = await res.json();
      const merged = { ...DEFAULT, ...data };
      setConfig(merged);
      // Pré-remplir le champ brut si un ID est déjà sauvegardé
      if (merged.facebook?.pixelId) setFbRawInput(merged.facebook.pixelId);
      setAuthed(true);
    } else {
      setAuthError("Mot de passe incorrect.");
    }
  }

  function handleFbRawChange(raw: string) {
    setFbRawInput(raw);
    const extracted = extractFbPixelId(raw);
    setConfig((prev) => ({ ...prev, facebook: { ...prev.facebook, pixelId: extracted } }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSaved(false);
    try {
      const res = await fetch("/api/admin/pixels", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-password": password },
        body: JSON.stringify(config),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Erreur lors de la sauvegarde");
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <h1 className="text-gray-900 text-2xl font-bold text-center mb-8">Pixels Marketing</h1>
          <form onSubmit={handleLogin} className="space-y-4 p-8 bg-white border border-gray-200 rounded-2xl shadow-sm">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mot de passe admin"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-green-500"
            />
            {authError && <p className="text-red-600 text-sm">{authError}</p>}
            <button type="submit" className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-colors">
              Accéder
            </button>
            <Link href="/admin" className="flex items-center gap-1.5 text-gray-400 text-sm hover:text-gray-600 mt-2">
              <ArrowLeft size={14} /> Retour au panel admin
            </Link>
          </form>
        </div>
      </div>
    );
  }

  const validFbPixelId = /^\d{1,20}$/.test(config.facebook.pixelId ?? "");

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors text-sm">
            <ArrowLeft size={16} /> Admin
          </Link>
          <h1 className="text-gray-900 font-bold text-lg">Pixels Marketing</h1>
        </div>
        <button
          type="button"
          onClick={() => setShowIds(!showIds)}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          {showIds ? <EyeOff size={13} /> : <Eye size={13} />}
          {showIds ? "Masquer les IDs" : "Afficher les IDs"}
        </button>
      </div>

      <form onSubmit={handleSave} className="max-w-2xl mx-auto px-6 py-10 space-y-8">

        {/* ── Tableau des événements automatiques ── */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={16} className="text-green-600" />
            <h2 className="text-gray-900 font-bold">Événements envoyés automatiquement à Facebook</h2>
          </div>
          <p className="text-gray-500 text-sm">
            Dès que votre Pixel ID est configuré, ces 5 événements se déclenchent automatiquement sans aucune action supplémentaire.
            C&apos;est ce qui permet à Facebook Ads d&apos;afficher les <strong>« Achats sur le site »</strong> dans vos campagnes.
          </p>
          <div className="space-y-2">
            {EVENTS.map(({ icon: Icon, label, desc, color, bg }) => (
              <div key={label} className={`flex items-start gap-3 p-3 rounded-xl border border-transparent ${bg}`}>
                <div className={`w-7 h-7 rounded-lg bg-white flex items-center justify-center flex-shrink-0 shadow-sm`}>
                  <Icon size={14} className={color} />
                </div>
                <div>
                  <span className={`text-xs font-bold font-mono ${color}`}>{label}</span>
                  <p className="text-gray-600 text-xs mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Facebook ── */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h2 className="text-gray-900 font-bold">Facebook Pixel</h2>
                <div className="flex items-center gap-3">
                  {config.facebook.enabled && validFbPixelId && (
                    <a
                      href={`https://www.facebook.com/events_manager2/list/pixel/${config.facebook.pixelId}/overview`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 transition-colors font-medium"
                    >
                      Vérifier dans Events Manager <ExternalLink size={10} />
                    </a>
                  )}
                  <a href="https://business.facebook.com/events_manager" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-600 transition-colors">
                    Créer un pixel <ExternalLink size={10} />
                  </a>
                </div>
              </div>
              <p className="text-gray-500 text-xs mt-0.5">Facebook Ads, Instagram Ads — suivi des conversions et remarketing</p>
            </div>
          </div>

          <Toggle
            checked={config.facebook.enabled}
            onChange={(v) => setConfig({ ...config, facebook: { ...config.facebook, enabled: v } })}
            label={config.facebook.enabled ? "Activé" : "Désactivé"}
          />

          {config.facebook.enabled && (
            <div className="space-y-3">
              <FieldGroup
                label="Pixel ID ou code Facebook"
                hint="Collez directement votre Pixel ID (ex : 1234567890) OU le code complet fourni par Facebook — l'ID sera extrait automatiquement."
              >
                <textarea
                  rows={3}
                  value={fbRawInput}
                  onChange={(e) => handleFbRawChange(e.target.value)}
                  placeholder={"Collez ici votre Pixel ID ou le code complet :\n1234567890123456\n— ou —\nfbq('init', '1234567890123456')"}
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-green-500 transition-colors font-mono resize-none"
                />
              </FieldGroup>

              {/* Affichage de l'ID extrait */}
              {config.facebook.pixelId && (
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${validFbPixelId ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
                  {validFbPixelId ? (
                    <>
                      <CheckCircle size={14} className="text-green-600 flex-shrink-0" />
                      <span className="text-green-700">
                        ID détecté : <strong className="font-mono">{showIds ? config.facebook.pixelId : config.facebook.pixelId.replace(/\d(?=\d{4})/g, "•")}</strong>
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
                      <span className="text-red-600">ID invalide — doit être uniquement des chiffres (10 à 20 caractères)</span>
                    </>
                  )}
                </div>
              )}

              <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl">
                <p className="text-blue-700 text-xs leading-relaxed">
                  <strong>Comment trouver votre Pixel ID :</strong> Gestionnaire de publicités Facebook → Menu (☰) → Gestionnaire d&apos;événements → Sources de données → votre Pixel → Paramètres → copiez l&apos;ID (16 chiffres environ).
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── API Conversions Facebook (CAPI) ── */}
        {config.facebook.enabled && (
          <div className="bg-white border border-blue-200 rounded-2xl p-6 space-y-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                <Server size={18} className="text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h2 className="text-gray-900 font-bold">API Conversions Facebook (CAPI)</h2>
                  <a
                    href="https://business.facebook.com/events_manager2/list/pixel"
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 font-medium"
                  >
                    Obtenir le token <ExternalLink size={10} />
                  </a>
                </div>
                <p className="text-gray-500 text-xs mt-0.5">
                  Envoie les événements directement depuis le serveur — contourne les bloqueurs de pubs et iOS 14+
                </p>
              </div>
            </div>

            <div className="p-3 bg-green-50 border border-green-200 rounded-xl">
              <p className="text-green-700 text-xs leading-relaxed">
                <strong>Pourquoi configurer la CAPI ?</strong> Le pixel seul peut manquer jusqu&apos;à 30% des événements à cause des bloqueurs de publicités et des restrictions iOS. La CAPI envoie les mêmes événements depuis votre serveur — Facebook les fusionne automatiquement sans double comptage grâce à un identifiant unique.
              </p>
            </div>

            <FieldGroup
              label="Token d'accès CAPI"
              hint="Gestionnaire d'événements → votre Pixel → Paramètres → API Conversions → « Générer un token d'accès »"
            >
              <input
                type={showIds ? "text" : "password"}
                value={config.facebook.capiToken ?? ""}
                onChange={(e) =>
                  setConfig({ ...config, facebook: { ...config.facebook, capiToken: e.target.value } })
                }
                placeholder={config.facebook.capiToken?.startsWith("****") ? config.facebook.capiToken : "EAAxxxxxxxxxxxxxxx..."}
                className={inputCls}
              />
            </FieldGroup>

            {config.facebook.capiToken && !config.facebook.capiToken.startsWith("****") && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-green-50 border border-green-200">
                <CheckCircle size={14} className="text-green-600 flex-shrink-0" />
                <span className="text-green-700 text-xs">Token saisi — sera chiffré après sauvegarde</span>
              </div>
            )}
            {config.facebook.capiToken?.startsWith("****") && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-green-50 border border-green-200">
                <CheckCircle size={14} className="text-green-600 flex-shrink-0" />
                <span className="text-green-700 text-xs">Token CAPI configuré (se termine par <strong className="font-mono">{config.facebook.capiToken}</strong>)</span>
              </div>
            )}

            <div className="space-y-1.5">
              {[
                { label: "Purchase", desc: "Envoyé depuis le webhook de paiement avec email + téléphone hashés", active: true },
                { label: "ViewContent", desc: "Envoyé depuis le navigateur via relay serveur avec IP + UA", active: true },
                { label: "AddToCart", desc: "Envoyé depuis le navigateur via relay serveur", active: true },
                { label: "InitiateCheckout", desc: "Envoyé depuis le navigateur via relay serveur", active: true },
              ].map(({ label, desc, active }) => (
                <div key={label} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                  <div className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${active ? "bg-green-500" : "bg-gray-300"}`} />
                  <div>
                    <span className="text-xs font-bold font-mono text-gray-800">{label}</span>
                    <p className="text-gray-500 text-xs">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TikTok ── */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#111"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V9.29a8.16 8.16 0 0 0 4.77 1.52V7.35a4.85 4.85 0 0 1-1-.66z"/></svg>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h2 className="text-gray-900 font-bold">TikTok Pixel</h2>
                <a href="https://ads.tiktok.com/i18n/events_manager" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors">
                  Créer un pixel <ExternalLink size={10} />
                </a>
              </div>
              <p className="text-gray-500 text-xs mt-0.5">TikTok Ads — suivi des événements pour optimiser vos campagnes</p>
            </div>
          </div>
          <Toggle
            checked={config.tiktok.enabled}
            onChange={(v) => setConfig({ ...config, tiktok: { ...config.tiktok, enabled: v } })}
            label={config.tiktok.enabled ? "Activé" : "Désactivé"}
          />
          {config.tiktok.enabled && (
            <FieldGroup label="Pixel ID" hint="Trouvez votre Pixel ID dans TikTok Ads Manager → Événements → Événements web">
              <input
                type={showIds ? "text" : "password"}
                value={config.tiktok.pixelId}
                onChange={(e) => setConfig({ ...config, tiktok: { ...config.tiktok, pixelId: e.target.value } })}
                placeholder="Ex : CXXXXXXXXXXXXXXX"
                className={inputCls}
              />
            </FieldGroup>
          )}
        </div>

        {/* ── Google Ads ── */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h2 className="text-gray-900 font-bold">Google Ads</h2>
                <a href="https://ads.google.com/aw/conversions" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-600 transition-colors">
                  Créer une conversion <ExternalLink size={10} />
                </a>
              </div>
              <p className="text-gray-500 text-xs mt-0.5">Google Ads — balise de conversion pour mesurer le ROI de vos campagnes</p>
            </div>
          </div>
          <Toggle
            checked={config.googleAds.enabled}
            onChange={(v) => setConfig({ ...config, googleAds: { ...config.googleAds, enabled: v } })}
            label={config.googleAds.enabled ? "Activé" : "Désactivé"}
          />
          {config.googleAds.enabled && (
            <>
              <FieldGroup label="ID de conversion" hint="Format : AW-XXXXXXXXXX — trouvez-le dans Outils → Suivi des conversions">
                <input
                  type={showIds ? "text" : "password"}
                  value={config.googleAds.conversionId}
                  onChange={(e) => setConfig({ ...config, googleAds: { ...config.googleAds, conversionId: e.target.value } })}
                  placeholder="Ex : AW-1234567890"
                  className={inputCls}
                />
              </FieldGroup>
              <FieldGroup label="Libellé de conversion" hint="Format : XXXXXXXXXXX — visible dans les détails de la conversion">
                <input
                  type={showIds ? "text" : "password"}
                  value={config.googleAds.conversionLabel}
                  onChange={(e) => setConfig({ ...config, googleAds: { ...config.googleAds, conversionLabel: e.target.value } })}
                  placeholder="Ex : AbCdEfGhIjK"
                  className={inputCls}
                />
              </FieldGroup>
            </>
          )}
        </div>

        {/* Statut */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
            <AlertCircle size={16} className="text-red-600 flex-shrink-0" />
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}
        {saved && (
          <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
            <CheckCircle size={16} className="text-green-600 flex-shrink-0" />
            <p className="text-green-700 text-sm font-medium">
              Configuration sauvegardée — les 5 événements sont actifs sur le site. Vérifiez dans le Gestionnaire d&apos;événements Facebook que les événements arrivent bien.
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <><Save size={16} /> Sauvegarder la configuration</>
          )}
        </button>
      </form>
    </div>
  );
}
