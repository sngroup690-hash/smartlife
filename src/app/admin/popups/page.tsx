"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Pencil, Trash2, Save, X, Upload, ImageIcon, Percent, DollarSign, Tag, Globe, Zap, Users, ChevronDown, ChevronUp } from "lucide-react";
import type { Popup } from "@/app/api/admin/popups/route";
import type { BuyerBannerConfig } from "@/app/api/admin/buyer-banner/route";

// ─── Defaults ─────────────────────────────────────────────────────────────────

const EMPTY_POPUP: Omit<Popup, "id" | "createdAt"> = {
  name: "",
  enabled: false,
  type: "popup",
  trigger: "immediate",
  triggerDelay: 3,
  triggerScrollPercent: 50,
  pages: ["all"],
  audience: "all",
  showOnce: false,
  startDate: "",
  endDate: "",
  title: "",
  content: "",
  ctaText: "",
  ctaUrl: "",
  hasCountdown: false,
  countdownEnd: "",
  bgColor: "#1a1a2e",
  textColor: "#ffffff",
  accentColor: "#E8B800",
  imageUrl: "",
  discountType: "none",
  discountValue: 0,
  discountLabel: "",
  mobileExitDelay: 8,
};

// Common page slugs for quick-add
const COMMON_PAGES = [
  { label: "Ebooks", value: "/ebooks" },
  { label: "Formations", value: "/formation" },
  { label: "Packs", value: "/packs" },
  { label: "Accueil", value: "/" },
  { label: "Checkout", value: "/checkout" },
  { label: "Dashboard", value: "/dashboard" },
];

// ─── Styles ───────────────────────────────────────────────────────────────────

const inputCls =
  "w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-green-500 text-sm transition-colors";
const labelCls = "block text-gray-700 font-bold text-xs mb-1.5 uppercase tracking-wide";

// ─── Image Upload Field ───────────────────────────────────────────────────────

function ImageUploadField({
  value,
  onChange,
  password,
}: {
  value: string;
  onChange: (url: string) => void;
  password: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [urlMode, setUrlMode] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setUploadError("");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch("/api/admin/upload-image", {
        method: "POST",
        headers: { "x-admin-password": password },
        body: fd,
      });
      const data = await r.json() as { url?: string; error?: string };
      if (!r.ok || !data.url) {
        setUploadError(data.error || "Erreur upload");
        return;
      }
      onChange(data.url);
    } catch {
      setUploadError("Erreur réseau");
    } finally {
      setUploading(false);
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) handleFile(file);
  }

  function applyUrl() {
    const url = urlInput.trim();
    if (url) { onChange(url); setUrlMode(false); setUrlInput(""); }
  }

  return (
    <div className="space-y-2">
      <label className={labelCls}>Image (optionnel)</label>

      {value ? (
        /* Aperçu avec actions */
        <div className="relative w-full h-36 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 group">
          <img src={value} alt="Aperçu" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-2 right-2 w-7 h-7 bg-black/60 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors"
          >
            <X size={13} />
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="absolute bottom-2 right-2 flex items-center gap-1.5 px-3 py-1.5 bg-black/60 hover:bg-black/80 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-60"
          >
            <Upload size={11} /> Changer
          </button>
        </div>
      ) : (
        /* Zone drag-and-drop */
        <div
          className={`relative flex flex-col items-center justify-center gap-2 w-full h-36 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${
            dragging
              ? "border-green-500 bg-green-50"
              : "border-gray-300 bg-gray-50 hover:border-green-400 hover:bg-green-50/50"
          }`}
          onDrop={onDrop}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onClick={() => !uploading && fileRef.current?.click()}
        >
          {uploading ? (
            <span className="w-8 h-8 border-2 border-green-400 border-t-green-700 rounded-full animate-spin" />
          ) : (
            <>
              <Upload size={24} className="text-gray-400" />
              <div className="text-center pointer-events-none">
                <p className="text-sm text-gray-600 font-medium">Glisser une image ici</p>
                <p className="text-xs text-gray-400">ou <span className="underline text-green-600">cliquer pour choisir</span></p>
              </div>
              <p className="text-xs text-gray-400">JPG, PNG, WebP, GIF, SVG — max 5 Mo</p>
            </>
          )}
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
        className="hidden"
        onChange={onFileChange}
      />

      {/* Option URL externe */}
      {!value && (
        <div>
          <button
            type="button"
            onClick={() => setUrlMode(!urlMode)}
            className="text-xs text-gray-400 hover:text-green-600 underline transition-colors"
          >
            {urlMode ? "▲ Masquer" : "▼ Utiliser une URL externe à la place"}
          </button>
          {urlMode && (
            <div className="flex gap-2 mt-1.5">
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && applyUrl()}
                className={inputCls}
                placeholder="https://exemple.com/image.jpg"
                autoFocus
              />
              <button
                type="button"
                onClick={applyUrl}
                className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-xl transition-colors flex-shrink-0"
              >
                OK
              </button>
            </div>
          )}
        </div>
      )}

      {uploadError && <p className="text-red-500 text-xs">{uploadError}</p>}
    </div>
  );
}

// ─── Pages Field ──────────────────────────────────────────────────────────────

function PagesField({
  value,
  onChange,
}: {
  value: string[];
  onChange: (pages: string[]) => void;
}) {
  const [customInput, setCustomInput] = useState("");
  const isAll = value.includes("all");
  const selectedPages = value.filter((p) => p !== "all");

  function setAll() {
    onChange(["all"]);
  }

  function addPage(slug: string) {
    if (value.includes(slug)) return;
    onChange([...value.filter((p) => p !== "all"), slug]);
  }

  function removePage(slug: string) {
    const next = value.filter((p) => p !== slug);
    onChange(next.length > 0 ? next : ["all"]);
  }

  function togglePage(slug: string) {
    if (value.includes(slug)) removePage(slug);
    else addPage(slug);
  }

  function addCustom() {
    let slug = customInput.trim();
    if (!slug) return;
    if (!slug.startsWith("/")) slug = "/" + slug;
    if (!value.includes(slug)) addPage(slug);
    setCustomInput("");
  }

  const customTags = selectedPages.filter((p) => !COMMON_PAGES.some((cp) => cp.value === p));

  return (
    <div className="space-y-3">
      <div>
        <label className={labelCls}>Pages ciblées</label>
        <p className="text-gray-400 text-xs mt-0.5">
          Choisissez <strong>Tout le site</strong> ou sélectionnez/ajoutez des pages spécifiques.
        </p>
      </div>

      {/* Quick-add buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={setAll}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
            isAll
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-white text-gray-500 border-gray-200 hover:border-blue-400 hover:text-blue-600"
          }`}
        >
          <Globe size={10} /> Tout le site
        </button>
        {COMMON_PAGES.map((p) => {
          const active = value.includes(p.value);
          return (
            <button
              key={p.value}
              type="button"
              onClick={() => togglePage(p.value)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                active
                  ? "bg-green-600 text-white border-green-600"
                  : "bg-white text-gray-500 border-gray-200 hover:border-green-400 hover:text-green-600"
              }`}
            >
              {p.label}
              {active && <X size={9} />}
            </button>
          );
        })}
      </div>

      {/* Tags des pages personnalisées */}
      {customTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {customTags.map((slug) => (
            <span
              key={slug}
              className="flex items-center gap-1 px-2.5 py-1 bg-green-50 border border-green-200 text-green-800 text-xs rounded-lg font-mono"
            >
              {slug}
              <button type="button" onClick={() => removePage(slug)} className="hover:text-red-600 transition-colors ml-0.5">
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input slug personnalisé */}
      <div className="flex gap-2">
        <input
          type="text"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustom(); } }}
          className={inputCls}
          placeholder="Ex : /page-ebook  ou  /produit/mon-pack"
        />
        <button
          type="button"
          onClick={addCustom}
          className="flex items-center gap-1 px-4 py-2.5 bg-gray-100 hover:bg-green-50 border border-gray-300 hover:border-green-400 text-gray-600 hover:text-green-700 font-bold text-sm rounded-xl transition-colors flex-shrink-0"
        >
          <Plus size={14} /> Ajouter
        </button>
      </div>
    </div>
  );
}

// ─── Discount Field ───────────────────────────────────────────────────────────

function DiscountField({
  discountType,
  discountValue,
  discountLabel,
  onChange,
}: {
  discountType: Popup["discountType"];
  discountValue: number;
  discountLabel: string;
  onChange: (t: Popup["discountType"], v: number, l: string) => void;
}) {
  return (
    <div className="space-y-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
      <div className="flex items-center gap-2 mb-1">
        <Zap size={14} className="text-amber-600" />
        <span className="text-amber-800 font-bold text-sm">Réduction automatique au clic</span>
      </div>
      <p className="text-amber-700 text-xs">
        Quand le visiteur clique sur le bouton CTA, la réduction s&apos;applique automatiquement au checkout — sans saisie de code.
      </p>

      {/* Type selector */}
      <div>
        <label className={labelCls}>Type de réduction</label>
        <div className="flex gap-2 flex-wrap">
          {([
            { id: "none",    label: "Aucune",         icon: <X size={12} /> },
            { id: "percent", label: "Pourcentage (%)", icon: <Percent size={12} /> },
            { id: "fixed",   label: "Montant fixe",   icon: <DollarSign size={12} /> },
          ] as const).map(({ id, label, icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id, discountValue, discountLabel)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
                discountType === id
                  ? "bg-amber-600 text-white border-amber-600"
                  : "bg-white text-gray-500 border-gray-200 hover:border-amber-400"
              }`}
            >
              {icon} {label}
            </button>
          ))}
        </div>
      </div>

      {discountType !== "none" && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>
                {discountType === "percent" ? "Valeur (%)" : "Montant (FCFA)"}
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  max={discountType === "percent" ? 100 : undefined}
                  value={discountValue}
                  onChange={(e) => onChange(discountType, Number(e.target.value), discountLabel)}
                  className={`${inputCls} pr-12`}
                  placeholder={discountType === "percent" ? "20" : "1000"}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">
                  {discountType === "percent" ? "%" : "F"}
                </span>
              </div>
            </div>
            <div>
              <label className={labelCls}>Libellé affiché au checkout</label>
              <input
                type="text"
                value={discountLabel}
                onChange={(e) => onChange(discountType, discountValue, e.target.value)}
                className={inputCls}
                placeholder={`Ex: Promo popup -${discountValue}%`}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 bg-white rounded-xl border border-amber-200">
            <Tag size={13} className="text-amber-600" />
            <p className="text-amber-700 text-xs">
              Le visiteur verra : <strong className="text-amber-900">
                {discountLabel || `Réduction ${discountType === "percent" ? `${discountValue}%` : `${discountValue} FCFA`}`}
              </strong> appliquée automatiquement sur son total.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Form Component ───────────────────────────────────────────────────────────

function PopupForm({
  initial,
  onSave,
  onCancel,
  password,
}: {
  initial: Partial<Popup>;
  onSave: (popup: Popup) => void;
  onCancel: () => void;
  password: string;
}) {
  const [form, setForm] = useState<Omit<Popup, "id" | "createdAt">>({
    ...EMPTY_POPUP,
    ...initial,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  async function handleSave() {
    if (!form.name.trim()) { setError("Le nom est requis."); return; }
    setSaving(true);
    setError("");
    try {
      const body = initial.id ? { ...form, id: initial.id } : form;
      const r = await fetch("/api/admin/popups", {
        method: "POST",
        headers: { "x-admin-password": password, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) { setError("Erreur sauvegarde."); return; }
      const data = await r.json() as { popup: Popup };
      onSave(data.popup);
    } catch {
      setError("Erreur réseau.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 bg-white border border-gray-200 rounded-2xl space-y-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-gray-900 font-bold text-base">
          {initial.id ? "Modifier le popup" : "Nouveau popup"}
        </h3>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
          <X size={18} />
        </button>
      </div>

      {/* Nom interne */}
      <div>
        <label className={labelCls}>Nom interne</label>
        <input type="text" value={form.name} onChange={(e) => set("name", e.target.value)} className={inputCls} placeholder="Ex: Promo Noël ebooks" />
      </div>

      {/* Type */}
      <div>
        <label className={labelCls}>Type d&apos;affichage</label>
        <div className="flex gap-2 flex-wrap">
          {(["popup", "banner_top", "banner_bottom"] as const).map((t) => (
            <button key={t} type="button" onClick={() => set("type", t)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${
                form.type === t
                  ? "border-green-500 bg-green-50 text-green-700"
                  : "border-gray-200 text-gray-500 hover:border-gray-300 bg-white"
              }`}>
              {t === "popup" ? "Popup centré" : t === "banner_top" ? "Barre haute" : "Barre basse"}
            </button>
          ))}
        </div>
      </div>

      {/* Déclencheur */}
      <div>
        <label className={labelCls}>Déclencheur</label>
        <div className="flex gap-2 flex-wrap">
          {(["immediate", "delay", "exit_intent", "scroll"] as const).map((t) => (
            <button key={t} type="button" onClick={() => set("trigger", t)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${
                form.trigger === t
                  ? "border-green-500 bg-green-50 text-green-700"
                  : "border-gray-200 text-gray-500 hover:border-gray-300 bg-white"
              }`}>
              {t === "immediate" ? "Immédiat" : t === "delay" ? "Délai" : t === "exit_intent" ? "Exit intent" : "Scroll"}
            </button>
          ))}
        </div>
        {form.trigger === "exit_intent" && (
          <div className="mt-2 space-y-2">
            <p className="text-xs text-gray-400">
              🖥️ Desktop : mouvement souris vers la barre d&apos;adresse · 📱 Mobile : scroll rapide vers le haut
            </p>
            <div>
              <label className={labelCls}>Délai de secours mobile (secondes)</label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={3}
                  max={60}
                  value={form.mobileExitDelay}
                  onChange={(e) => set("mobileExitDelay", Number(e.target.value))}
                  className={`${inputCls} w-28`}
                />
                <p className="text-xs text-gray-400 flex-1">
                  Si le scroll n&apos;est pas détecté, le popup s&apos;affiche automatiquement après ce délai.
                </p>
              </div>
            </div>
          </div>
        )}
        {form.trigger === "delay" && (
          <div className="mt-2">
            <label className={labelCls}>Délai (secondes)</label>
            <input type="number" min={0} value={form.triggerDelay} onChange={(e) => set("triggerDelay", Number(e.target.value))} className={`${inputCls} w-32`} />
          </div>
        )}
        {form.trigger === "scroll" && (
          <div className="mt-2">
            <label className={labelCls}>Défilement (% de la page)</label>
            <input type="number" min={0} max={100} value={form.triggerScrollPercent} onChange={(e) => set("triggerScrollPercent", Number(e.target.value))} className={`${inputCls} w-32`} />
          </div>
        )}
      </div>

      {/* Pages ciblées */}
      <PagesField value={form.pages} onChange={(p) => set("pages", p)} />

      {/* Audience */}
      <div>
        <label className={labelCls}>Audience</label>
        <select value={form.audience} onChange={(e) => set("audience", e.target.value as Popup["audience"])} className={inputCls}>
          <option value="all">Tous les visiteurs</option>
          <option value="new_visitors">Nouveaux visiteurs</option>
          <option value="logged_in">Connectés seulement</option>
          <option value="not_logged_in">Non connectés seulement</option>
        </select>
      </div>

      {/* Show once */}
      <div className="flex items-center gap-3">
        <input type="checkbox" id="showOnce" checked={form.showOnce} onChange={(e) => set("showOnce", e.target.checked)} className="w-4 h-4 accent-green-500" />
        <label htmlFor="showOnce" className="text-gray-700 text-sm cursor-pointer">Afficher une seule fois par visiteur</label>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Date de début (optionnel)</label>
          <input type="datetime-local" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Date de fin (optionnel)</label>
          <input type="datetime-local" value={form.endDate} onChange={(e) => set("endDate", e.target.value)} className={inputCls} />
        </div>
      </div>

      {/* Image */}
      <ImageUploadField
        value={form.imageUrl}
        onChange={(url) => set("imageUrl", url)}
        password={password}
      />

      {/* Titre */}
      <div>
        <label className={labelCls}>Titre du popup</label>
        <input type="text" value={form.title} onChange={(e) => set("title", e.target.value)} className={inputCls} placeholder="Ex: 🎁 Offre spéciale — 20% de réduction !" />
      </div>

      {/* Contenu */}
      <div>
        <label className={labelCls}>Texte du message</label>
        <textarea rows={3} value={form.content} onChange={(e) => set("content", e.target.value)} className={inputCls} placeholder="Décrivez votre offre…" />
      </div>

      {/* CTA */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Texte du bouton CTA</label>
          <input type="text" value={form.ctaText} onChange={(e) => set("ctaText", e.target.value)} className={inputCls} placeholder="Ex: J'en profite maintenant →" />
        </div>
        <div>
          <label className={labelCls}>URL du bouton CTA</label>
          <input type="text" value={form.ctaUrl} onChange={(e) => set("ctaUrl", e.target.value)} className={inputCls} placeholder="/ebooks  ou  /checkout" />
        </div>
      </div>

      {/* Réduction automatique */}
      <DiscountField
        discountType={form.discountType}
        discountValue={form.discountValue}
        discountLabel={form.discountLabel}
        onChange={(t, v, l) => setForm((f) => ({ ...f, discountType: t, discountValue: v, discountLabel: l }))}
      />

      {/* Countdown */}
      <div className="flex items-center gap-3">
        <input type="checkbox" id="hasCountdown" checked={form.hasCountdown} onChange={(e) => set("hasCountdown", e.target.checked)} className="w-4 h-4 accent-green-500" />
        <label htmlFor="hasCountdown" className="text-gray-700 text-sm cursor-pointer">Afficher un compte à rebours</label>
      </div>
      {form.hasCountdown && (
        <div>
          <label className={labelCls}>Fin du compte à rebours</label>
          <input type="datetime-local" value={form.countdownEnd} onChange={(e) => set("countdownEnd", e.target.value)} className={inputCls} />
        </div>
      )}

      {/* Couleurs */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { key: "bgColor" as const, label: "Fond" },
          { key: "textColor" as const, label: "Texte" },
          { key: "accentColor" as const, label: "Accent / CTA" },
        ].map(({ key, label }) => (
          <div key={key}>
            <label className={labelCls}>{label}</label>
            <div className="flex items-center gap-2">
              <input type="color" value={form[key] as string} onChange={(e) => set(key, e.target.value)} className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer bg-transparent flex-shrink-0" />
              <input type="text" value={form[key] as string} onChange={(e) => set(key, e.target.value)} className={`${inputCls} flex-1`} />
            </div>
          </div>
        ))}
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="flex items-center gap-3 pt-2">
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-sm transition-colors disabled:opacity-60">
          <Save size={15} /> {saving ? "Sauvegarde…" : "Sauvegarder"}
        </button>
        <button onClick={onCancel}
          className="px-5 py-2.5 border border-gray-200 text-gray-500 rounded-xl text-sm hover:bg-gray-50 transition-colors">
          Annuler
        </button>
      </div>
    </div>
  );
}

// ─── Buyer Banner Editor ──────────────────────────────────────────────────────

const BUYER_BANNER_DEFAULTS: BuyerBannerConfig = {
  enabled: true,
  title: "Félicitations pour votre achat !",
  subtitle: "Découvrez notre accompagnement personnalisé pour booster votre projet.",
  ctaText: "Découvrir l'accompagnement",
  ctaUrl: "/accompagnement",
  bgColor: "#1a2e1a",
  textColor: "#ffffff",
  ctaBgColor: "#E8B800",
  ctaTextColor: "#000000",
};

function BuyerBannerEditor({ password }: { password: string }) {
  const [open, setOpen] = useState(false);
  const [cfg, setCfg] = useState<BuyerBannerConfig>(BUYER_BANNER_DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/admin/buyer-banner")
      .then((r) => r.json())
      .then((d) => setCfg((prev) => ({ ...prev, ...(d as BuyerBannerConfig) })))
      .catch(() => {});
  }, []);

  function set<K extends keyof BuyerBannerConfig>(k: K, v: BuyerBannerConfig[K]) {
    setCfg((f) => ({ ...f, [k]: v }));
  }

  async function save() {
    setSaving(true); setMsg("");
    try {
      const r = await fetch("/api/admin/buyer-banner", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-password": password },
        body: JSON.stringify(cfg),
      });
      if (r.ok) setMsg("✓ Bannière sauvegardée !");
      else setMsg("Erreur lors de la sauvegarde.");
    } catch { setMsg("Erreur réseau."); }
    finally { setSaving(false); setTimeout(() => setMsg(""), 3000); }
  }

  const previewBg = cfg.bgColor || "#1a2e1a";
  const previewText = cfg.textColor || "#ffffff";
  const previewCtaBg = cfg.ctaBgColor || "#E8B800";
  const previewCtaText = cfg.ctaTextColor || "#000000";

  return (
    <div className="mb-8 border border-amber-200 rounded-2xl overflow-hidden bg-white shadow-sm">
      {/* Header de la section */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-6 py-4 bg-amber-50 hover:bg-amber-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center">
            <Users size={16} className="text-amber-700" />
          </div>
          <div className="text-left">
            <p className="font-bold text-gray-900 text-sm">Bannière Anciens Acheteurs</p>
            <p className="text-xs text-gray-500">Affichée aux visiteurs reconnus comme acheteurs (IP / appareil)</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${cfg.enabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
            {cfg.enabled ? "Active" : "Désactivée"}
          </span>
          {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </div>
      </button>

      {open && (
        <div className="p-6 space-y-5 border-t border-amber-100">
          {msg && (
            <div className={`px-4 py-2 rounded-xl text-sm font-medium ${msg.startsWith("✓") ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-600"}`}>
              {msg}
            </div>
          )}

          {/* Activation */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div
              onClick={() => set("enabled", !cfg.enabled)}
              className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 cursor-pointer ${cfg.enabled ? "bg-green-500" : "bg-gray-300"}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${cfg.enabled ? "translate-x-5" : ""}`} />
            </div>
            <span className="text-sm font-medium text-gray-700">{cfg.enabled ? "Bannière activée" : "Bannière désactivée"}</span>
          </div>

          {/* Textes */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className={labelCls}>Titre de la bannière</label>
              <input type="text" value={cfg.title} onChange={(e) => set("title", e.target.value)}
                className={inputCls} placeholder="Félicitations pour votre achat !" />
            </div>
            <div>
              <label className={labelCls}>Sous-titre <span className="font-normal text-gray-400">(optionnel)</span></label>
              <input type="text" value={cfg.subtitle} onChange={(e) => set("subtitle", e.target.value)}
                className={inputCls} placeholder="Découvrez notre accompagnement…" />
            </div>
          </div>

          {/* CTA */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Texte du bouton CTA</label>
              <input type="text" value={cfg.ctaText} onChange={(e) => set("ctaText", e.target.value)}
                className={inputCls} placeholder="Découvrir l'accompagnement" />
            </div>
            <div>
              <label className={labelCls}>Lien du bouton CTA</label>
              <input type="text" value={cfg.ctaUrl} onChange={(e) => set("ctaUrl", e.target.value)}
                className={inputCls} placeholder="/accompagnement" />
            </div>
          </div>

          {/* Couleurs */}
          <div>
            <label className={labelCls}>Couleurs</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {([
                ["bgColor", "Fond bannière"],
                ["textColor", "Texte"],
                ["ctaBgColor", "Fond bouton"],
                ["ctaTextColor", "Texte bouton"],
              ] as [keyof BuyerBannerConfig, string][]).map(([key, label]) => (
                <div key={key}>
                  <p className="text-[11px] text-gray-500 mb-1.5">{label}</p>
                  <div className="flex items-center gap-2 p-2 border border-gray-200 rounded-xl bg-white">
                    <input type="color" value={String(cfg[key])} onChange={(e) => set(key, e.target.value)}
                      className="w-7 h-7 rounded-lg border-0 cursor-pointer bg-transparent p-0" />
                    <input type="text" value={String(cfg[key])} onChange={(e) => set(key, e.target.value)}
                      className="flex-1 text-xs font-mono text-gray-700 bg-transparent focus:outline-none min-w-0" maxLength={7} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Aperçu en direct */}
          <div>
            <label className={labelCls}>Aperçu</label>
            <div className="rounded-xl overflow-hidden border border-gray-200">
              <div className="px-4 py-3 flex items-center justify-between gap-4" style={{ backgroundColor: previewBg }}>
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: previewCtaBg + "33" }}>
                    <span style={{ color: previewCtaBg }} className="text-xs">✨</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: previewText }}>🎉 {cfg.title || "Titre"}</p>
                    {cfg.subtitle && <p className="text-xs opacity-75" style={{ color: previewText }}>{cfg.subtitle}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg"
                    style={{ backgroundColor: previewCtaBg, color: previewCtaText }}>
                    {cfg.ctaText || "CTA"} →
                  </span>
                  <span style={{ color: previewText }} className="text-xs opacity-60">✕</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bouton sauvegarder */}
          <div className="flex justify-end">
            <button onClick={save} disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-sm disabled:opacity-40">
              {saving ? <span className="animate-spin">⏳</span> : <Save size={14} />}
              Enregistrer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PopupsAdminPage() {
  const [password, setPassword] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState("");

  const [popups, setPopups] = useState<Popup[]>([]);
  const [editing, setEditing] = useState<Popup | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setAuthError("");
    fetch("/api/admin/popups", { headers: { "x-admin-password": passwordInput } })
      .then((r) => {
        if (r.ok) setPassword(passwordInput);
        else setAuthError("Mot de passe incorrect.");
      })
      .catch(() => setAuthError("Erreur réseau."));
  }

  const fetchPopups = useCallback(async () => {
    if (!password) return;
    setLoading(true);
    try {
      const r = await fetch("/api/admin/popups", { headers: { "x-admin-password": password } });
      if (r.ok) setPopups(await r.json() as Popup[]);
    } finally {
      setLoading(false);
    }
  }, [password]);

  useEffect(() => { if (password) fetchPopups(); }, [password, fetchPopups]);

  async function toggleEnabled(popup: Popup) {
    const updated = { ...popup, enabled: !popup.enabled };
    const r = await fetch("/api/admin/popups", {
      method: "POST",
      headers: { "x-admin-password": password, "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
    if (r.ok) setPopups((prev) => prev.map((p) => (p.id === popup.id ? { ...p, enabled: !p.enabled } : p)));
  }

  async function deletePopup(id: string) {
    if (!confirm("Supprimer ce popup ?")) return;
    const r = await fetch(`/api/admin/popups?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { "x-admin-password": password },
    });
    if (r.ok) setPopups((prev) => prev.filter((p) => p.id !== id));
  }

  function handleSaved(popup: Popup) {
    setPopups((prev) => {
      const idx = prev.findIndex((p) => p.id === popup.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = popup; return next; }
      return [...prev, popup];
    });
    setShowForm(false);
    setEditing(null);
  }

  // ── Login form ──────────────────────────────────────────────────────────────
  if (!password) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4 p-8 bg-white border border-gray-200 rounded-2xl shadow-sm">
          <h1 className="text-gray-900 font-bold text-xl">Gestion des Popups</h1>
          <p className="text-gray-500 text-sm">Entrez le mot de passe administrateur.</p>
          <input type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)}
            placeholder="Mot de passe admin"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-green-500" />
          {authError && <p className="text-red-600 text-sm">{authError}</p>}
          <button type="submit" className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl transition-colors">Accéder</button>
          <Link href="/admin" className="flex items-center gap-1.5 text-gray-400 text-sm hover:text-gray-600 mt-2"><ArrowLeft size={14} /> Retour au panel admin</Link>
        </form>
      </div>
    );
  }

  const typeLabel: Record<Popup["type"], string> = {
    popup: "Popup", banner_top: "Barre haute", banner_bottom: "Barre basse",
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <Link href="/admin" className="flex items-center gap-1.5 text-gray-400 text-sm hover:text-gray-600 mb-3">
              <ArrowLeft size={14} /> Panel admin
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Popups & Banners</h1>
            <p className="text-gray-500 text-sm mt-1">Gérez les messages promotionnels et les réductions automatiques.</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => { setEditing(null); setShowForm(true); }}
              className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-sm transition-colors">
              <Plus size={15} /> Nouveau popup
            </button>
            <button onClick={() => setPassword("")}
              className="px-4 py-2 border border-gray-200 text-gray-500 rounded-xl text-sm hover:bg-gray-100">
              Déconnexion
            </button>
          </div>
        </div>

        {/* ── Bannière Acheteurs ── */}
        <BuyerBannerEditor password={password} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ── Liste ── */}
          <div className="space-y-3">
            <h2 className="text-gray-500 font-bold text-sm uppercase tracking-wide mb-4">
              {popups.length} popup{popups.length !== 1 ? "s" : ""} configuré{popups.length !== 1 ? "s" : ""}
            </h2>

            {loading && (
              <div className="flex justify-center py-10">
                <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {!loading && popups.length === 0 && (
              <div className="text-center py-16 text-gray-400">
                <p className="text-4xl mb-3">📣</p>
                <p>Aucun popup configuré.</p>
              </div>
            )}

            {popups.map((popup) => (
              <div key={popup.id}
                className={`p-5 rounded-2xl border transition-all ${
                  popup.enabled ? "bg-white border-gray-200 shadow-sm" : "bg-gray-50 border-gray-100 opacity-60"
                }`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-gray-900 font-bold text-sm truncate">{popup.name}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full border border-green-200 text-green-700 bg-green-50 font-medium">
                        {typeLabel[popup.type]}
                      </span>
                      {popup.enabled
                        ? <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold">Actif</span>
                        : <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 border border-gray-200 text-gray-500 font-bold">Inactif</span>
                      }
                      {popup.discountType !== "none" && popup.discountValue > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 font-bold flex items-center gap-1">
                          <Zap size={9} />
                          {popup.discountType === "percent"
                            ? `-${popup.discountValue}%`
                            : `-${popup.discountValue} F`
                          }
                        </span>
                      )}
                    </div>
                    {popup.title && <p className="text-gray-500 text-xs truncate">{popup.title}</p>}
                    <p className="text-gray-400 text-xs mt-0.5">
                      {popup.trigger} · {popup.pages.join(", ")}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => toggleEnabled(popup)}
                      className={`p-2 rounded-lg text-xs transition-colors ${
                        popup.enabled ? "text-emerald-600 hover:bg-emerald-50" : "text-gray-400 hover:bg-gray-100"
                      }`}
                      title={popup.enabled ? "Désactiver" : "Activer"}>
                      {popup.enabled ? "●" : "○"}
                    </button>
                    <button onClick={() => { setEditing(popup); setShowForm(true); }}
                      className="p-2 text-gray-400 hover:text-green-600 rounded-lg hover:bg-green-50 transition-colors" title="Modifier">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => deletePopup(popup.id)}
                      className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors" title="Supprimer">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Formulaire ── */}
          <div>
            {showForm ? (
              <PopupForm
                initial={editing ?? {}}
                password={password}
                onSave={handleSaved}
                onCancel={() => { setShowForm(false); setEditing(null); }}
              />
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl">
                <div className="text-center">
                  <p className="text-3xl mb-2">✦</p>
                  <p>Sélectionnez un popup à modifier</p>
                  <p className="text-sm mt-1">ou créez-en un nouveau</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
