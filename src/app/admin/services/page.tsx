"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Plus, Edit2, Trash2, Eye, EyeOff, Save, X, ArrowLeft,
  Loader2, Package, CheckCircle, ExternalLink, GripVertical,
  ChevronDown, ChevronUp, Lock,
} from "lucide-react";
import type { DynamicService, DynamicServicePackage } from "@/lib/services-data";
import { services as staticServices } from "@/lib/data";

// ─── Auth ──────────────────────────────────────────────────────────────────────

function AuthGate({ onAuth, authFailed }: { onAuth: (pwd: string) => void; authFailed?: boolean }) {
  const [pwd, setPwd] = useState("");
  const [err, setErr] = useState(false);
  function submit() {
    if (pwd.trim()) { onAuth(pwd.trim()); setErr(false); }
    else setErr(true);
  }
  const showError = err || authFailed;
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
        <div className="text-4xl text-center mb-4">🔐</div>
        <h1 className="text-xl font-bold text-gray-900 text-center mb-6">Accès Administration</h1>
        <input
          type="password"
          value={pwd}
          onChange={(e) => { setPwd(e.target.value); }}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Mot de passe admin"
          className={`w-full px-4 py-3 border rounded-xl mb-4 focus:outline-none ${showError ? "border-red-400" : "border-gray-200 focus:border-green-400"}`}
        />
        {showError && <p className="text-red-500 text-xs mb-3">{authFailed && !err ? "Mot de passe incorrect." : "Mot de passe requis."}</p>}
        <button onClick={submit} className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl">
          Accéder
        </button>
        <Link href="/admin" className="block text-center text-xs text-gray-400 mt-4 hover:text-gray-600">← Retour au panel</Link>
      </div>
    </div>
  );
}

// ─── Types form ────────────────────────────────────────────────────────────────

type PkgForm = { name: string; price: string; deliveryTime: string; features: string; popular: boolean };

type ServiceForm = {
  title: string;
  description: string;
  longDescription: string;
  icon: string;
  imageUrl: string;
  videoUrl: string;
  startingPrice: string;
  deliveryTime: string;
  features: string;
  briefLabel: string;
  enabled: boolean;
  packages: PkgForm[];
};

type OrderConfig = {
  confirmationMessage: string;
  whatsappNumber: string;
  redirectUrl: string;
  redirectDelay: number;
};

const DEFAULT_ORDER_CONFIG: OrderConfig = {
  confirmationMessage:
    "Merci pour votre commande ! Contactez notre équipe sur WhatsApp au {whatsapp} avec votre numéro de commande #{numero_commande} pour démarrer votre séance.",
  whatsappNumber: "+237697000000",
  redirectUrl: "",
  redirectDelay: 5,
};

const EMPTY_FORM: ServiceForm = {
  title: "", description: "", longDescription: "",
  icon: "🛠️", imageUrl: "", videoUrl: "", startingPrice: "", deliveryTime: "3-5 jours",
  features: "", briefLabel: "", enabled: true,
  packages: [{ name: "Starter", price: "", deliveryTime: "3-5 jours", features: "", popular: false }],
};

const EMPTY_PKG: PkgForm = { name: "", price: "", deliveryTime: "3-5 jours", features: "", popular: false };

const ICON_SUGGESTIONS = ["🛠️","🎨","📝","🎬","📣","💡","🚀","📱","🌐","💼","🎙️","📊","📦","🛒","✍️","🖌️","📸","🎵","🔊","💬","⚡","🔧","🏆","💎"];

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-400";
const labelCls = "block text-xs font-semibold text-gray-700 mb-1";

// ─── Package Builder ──────────────────────────────────────────────────────────

function PackageBuilder({ packages, onChange }: { packages: PkgForm[]; onChange: (p: PkgForm[]) => void }) {
  function set(i: number, k: keyof PkgForm, v: string | boolean) {
    const updated = packages.map((p, idx) => idx === i ? { ...p, [k]: v } : p);
    onChange(updated);
  }
  function add() { onChange([...packages, { ...EMPTY_PKG }]); }
  function remove(i: number) { onChange(packages.filter((_, idx) => idx !== i)); }
  function moveUp(i: number) {
    if (i === 0) return;
    const arr = [...packages];
    [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];
    onChange(arr);
  }

  return (
    <div className="space-y-3">
      {packages.map((pkg, i) => (
        <div key={i} className={`border rounded-xl p-4 space-y-3 ${pkg.popular ? "border-yellow-400 bg-yellow-50/50" : "border-gray-200 bg-gray-50/50"}`}>
          <div className="flex items-center gap-2 mb-2">
            <button type="button" onClick={() => moveUp(i)} className="text-gray-400 hover:text-gray-600 disabled:opacity-30" disabled={i === 0}>
              <ChevronUp size={14} />
            </button>
            <GripVertical size={14} className="text-gray-300" />
            <span className="text-xs font-bold text-gray-600">Forfait {i + 1}</span>
            <div className="flex-1" />
            <label className="flex items-center gap-1.5 text-xs text-yellow-600 font-medium cursor-pointer">
              <input type="checkbox" checked={pkg.popular} onChange={(e) => set(i, "popular", e.target.checked)} className="w-3.5 h-3.5 accent-yellow-500" />
              Populaire
            </label>
            {packages.length > 1 && (
              <button type="button" onClick={() => remove(i)} className="text-red-400 hover:text-red-600">
                <Trash2 size={13} />
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Nom du forfait</label>
              <input type="text" value={pkg.name} onChange={(e) => set(i, "name", e.target.value)} className={inputCls} placeholder="Starter, Pro, Business…" />
            </div>
            <div>
              <label className={labelCls}>Prix (FCFA)</label>
              <input type="number" value={pkg.price} onChange={(e) => set(i, "price", e.target.value)} className={inputCls} placeholder="25000" />
            </div>
          </div>
          <div>
            <label className={labelCls}>Délai de livraison</label>
            <input type="text" value={pkg.deliveryTime} onChange={(e) => set(i, "deliveryTime", e.target.value)} className={inputCls} placeholder="3-5 jours" />
          </div>
          <div>
            <label className={labelCls}>Fonctionnalités <span className="font-normal text-gray-400">(une par ligne)</span></label>
            <textarea
              value={pkg.features}
              onChange={(e) => set(i, "features", e.target.value)}
              rows={3}
              className={`${inputCls} resize-none`}
              placeholder={"Livraison rapide\nFichiers sources inclus\nRévisions illimitées"}
            />
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="w-full py-2 border-2 border-dashed border-gray-200 hover:border-green-400 text-gray-400 hover:text-green-600 text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
      >
        <Plus size={13} /> Ajouter un forfait
      </button>
    </div>
  );
}

// ─── Service Form ──────────────────────────────────────────────────────────────

function ServiceEditor({
  initial, adminPassword, onSave, onCancel, title,
}: {
  initial: ServiceForm;
  adminPassword: string;
  onSave: () => void;
  onCancel: () => void;
  title: string;
}) {
  const [form, setForm] = useState<ServiceForm>(initial);
  const set = <K extends keyof ServiceForm>(k: K, v: ServiceForm[K]) => setForm((f) => ({ ...f, [k]: v }));
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [uploadingImg, setUploadingImg] = useState(false);
  const [showIcons, setShowIcons] = useState(false);

  async function uploadImage(file: File) {
    setUploadingImg(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/admin/upload-og-image", { method: "POST", headers: { "x-admin-password": adminPassword }, body: fd });
      const data = await res.json() as { url?: string; error?: string };
      if (data.url) set("imageUrl", data.url);
      else setErr(data.error || "Erreur upload");
    } catch { setErr("Erreur réseau"); }
    finally { setUploadingImg(false); }
  }

  async function save() {
    if (!form.title.trim()) { setErr("Le titre est requis."); return; }
    setSaving(true); setErr("");
    const pkgs: DynamicServicePackage[] = form.packages
      .filter((p) => p.name.trim())
      .map((p) => ({
        name: p.name.trim(),
        price: parseInt(p.price) || 0,
        deliveryTime: p.deliveryTime.trim() || "3-5 jours",
        features: p.features.split("\n").map((f) => f.trim()).filter(Boolean),
        popular: p.popular,
      }));

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      longDescription: form.longDescription.trim(),
      icon: form.icon.trim() || "🛠️",
      imageUrl: form.imageUrl.trim() || undefined,
      videoUrl: form.videoUrl.trim() || undefined,
      startingPrice: parseInt(form.startingPrice) || 0,
      deliveryTime: form.deliveryTime.trim() || "3-5 jours",
      features: form.features.split("\n").map((f) => f.trim()).filter(Boolean),
      packages: pkgs,
      enabled: form.enabled,
      briefLabel: form.briefLabel.trim() || undefined,
    };

    try {
      const res = await fetch("/api/admin/services", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-password": adminPassword },
        body: JSON.stringify(initial.title ? { ...payload, id: (initial as unknown as { id?: string }).id } : payload),
      });
      if (!res.ok) { const d = await res.json() as { error?: string }; setErr(d.error || "Erreur"); return; }
      onSave();
    } catch { setErr("Erreur réseau"); }
    finally { setSaving(false); }
  }

  return (
    <div className="bg-white border border-green-200 rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-green-100 flex items-center justify-between">
        <h3 className="font-bold text-gray-900">{title}</h3>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
      </div>

      <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
        {err && <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-2">{err}</p>}

        {/* Titre + Icône */}
        <div className="grid grid-cols-[1fr_auto] gap-3">
          <div>
            <label className={labelCls}>Titre du service <span className="text-red-500">*</span></label>
            <input type="text" value={form.title} onChange={(e) => set("title", e.target.value)} className={inputCls} placeholder="Ex: Création de logo, Rédaction web…" autoFocus />
          </div>
          <div>
            <label className={labelCls}>Icône</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowIcons((v) => !v)}
                className="w-14 h-10 border border-gray-200 rounded-xl text-xl hover:border-green-400 transition-colors flex items-center justify-center"
              >
                {form.icon}
              </button>
              {showIcons && (
                <div className="absolute top-11 right-0 bg-white border border-gray-200 rounded-xl p-3 shadow-xl z-20 w-64 grid grid-cols-8 gap-1">
                  {ICON_SUGGESTIONS.map((emoji) => (
                    <button key={emoji} type="button" onClick={() => { set("icon", emoji); setShowIcons(false); }}
                      className="text-xl hover:bg-gray-100 rounded-lg p-1 transition-colors">{emoji}</button>
                  ))}
                  <div className="col-span-8 mt-2 pt-2 border-t border-gray-100">
                    <input type="text" value={form.icon} onChange={(e) => set("icon", e.target.value)}
                      className={`${inputCls} text-sm`} placeholder="Ou saisir un emoji…" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Description courte */}
        <div>
          <label className={labelCls}>Description courte <span className="text-gray-400 font-normal">(affichée sur les cartes)</span></label>
          <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={2} className={`${inputCls} resize-none`}
            placeholder="Une phrase percutante qui résume le service…" />
        </div>

        {/* Description longue */}
        <div>
          <label className={labelCls}>Description complète <span className="text-gray-400 font-normal">(page détail)</span></label>
          <textarea value={form.longDescription} onChange={(e) => set("longDescription", e.target.value)} rows={4} className={`${inputCls} resize-none`}
            placeholder="Description détaillée pour la page du service…" />
        </div>

        {/* Image */}
        <div>
          <label className={labelCls}>Image d&apos;illustration <span className="text-gray-400 font-normal">(optionnel)</span></label>
          {form.imageUrl ? (
            <div className="flex items-center gap-3 p-3 border border-green-200 rounded-xl bg-green-50/30">
              <img src={form.imageUrl} alt="" className="w-20 h-14 object-cover rounded-lg border border-gray-200" />
              <p className="flex-1 text-xs text-green-700 truncate">{form.imageUrl}</p>
              <button type="button" onClick={() => set("imageUrl", "")} className="text-red-400 hover:text-red-600"><X size={14} /></button>
            </div>
          ) : (
            <label className={`flex items-center gap-2 px-4 py-3 border-2 border-dashed border-gray-200 hover:border-green-400 rounded-xl cursor-pointer transition-all text-sm text-gray-500 ${uploadingImg ? "opacity-50 pointer-events-none" : ""}`}>
              {uploadingImg ? <Loader2 size={15} className="animate-spin" /> : "🖼️"}
              {uploadingImg ? "Upload en cours…" : "Uploader une image (ou saisir une URL ci-dessous)"}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f); e.target.value = ""; }} />
            </label>
          )}
          {!form.imageUrl && (
            <input type="url" value={form.imageUrl} onChange={(e) => set("imageUrl", e.target.value)}
              className={`${inputCls} mt-2`} placeholder="https://... (URL externe)" />
          )}
        </div>

        {/* Vidéo */}
        <div>
          <label className={labelCls}>Vidéo de présentation <span className="text-gray-400 font-normal">(YouTube, Google Drive, MP4… — optionnel)</span></label>
          <input type="url" value={form.videoUrl} onChange={(e) => set("videoUrl", e.target.value)}
            className={inputCls} placeholder="https://www.youtube.com/watch?v=… ou https://drive.google.com/…" />
          {form.videoUrl.trim()
            ? <p className="text-green-600 text-xs mt-1">✓ Vidéo configurée — un lecteur s&apos;affichera sur la page service</p>
            : <p className="text-gray-400 text-xs mt-1">Laissez vide pour ne pas afficher de lecteur vidéo</p>
          }
        </div>

        {/* Prix + Délai */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Prix de base (FCFA) <span className="text-red-500">*</span></label>
            <input type="number" value={form.startingPrice} onChange={(e) => set("startingPrice", e.target.value)} className={inputCls} placeholder="15000" />
          </div>
          <div>
            <label className={labelCls}>Délai de livraison</label>
            <input type="text" value={form.deliveryTime} onChange={(e) => set("deliveryTime", e.target.value)} className={inputCls} placeholder="3-5 jours" />
          </div>
        </div>

        {/* Fonctionnalités */}
        <div>
          <label className={labelCls}>Points forts / Fonctionnalités <span className="text-gray-400 font-normal">(une par ligne)</span></label>
          <textarea value={form.features} onChange={(e) => set("features", e.target.value)} rows={4} className={`${inputCls} resize-none`}
            placeholder={"Livrables haute qualité\nRévisions incluses\nSupport WhatsApp\nFichiers sources fournis"} />
        </div>

        {/* Étiquette brief */}
        <div>
          <label className={labelCls}>Label du champ brief <span className="text-gray-400 font-normal">(formulaire de commande)</span></label>
          <input type="text" value={form.briefLabel} onChange={(e) => set("briefLabel", e.target.value)} className={inputCls}
            placeholder="Ex: Décrivez votre projet en détail, votre style, vos références…" />
        </div>

        {/* Forfaits */}
        <div>
          <label className={labelCls}>Forfaits / Packages</label>
          <PackageBuilder packages={form.packages} onChange={(p) => set("packages", p)} />
        </div>

        {/* Statut */}
        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => set("enabled", !form.enabled)}
              className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${form.enabled ? "bg-green-500" : "bg-gray-300"}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.enabled ? "translate-x-5" : ""}`} />
            </div>
            <span className="text-sm font-medium text-gray-700">{form.enabled ? "Service activé (visible publiquement)" : "Service désactivé (caché)"}</span>
          </label>
        </div>
      </div>

      <div className="px-6 py-4 border-t border-green-100 bg-green-50/30 flex items-center justify-between gap-3">
        <button onClick={onCancel} className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm hover:bg-white">
          <X size={14} /> Annuler
        </button>
        <button onClick={save} disabled={saving || !form.title.trim()}
          className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-sm disabled:opacity-40">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Enregistrer
        </button>
      </div>
    </div>
  );
}

// ─── Service Card ──────────────────────────────────────────────────────────────

function ServiceCard({
  service, onEdit, onToggle, onDelete,
}: {
  service: DynamicService;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const [confirmDel, setConfirmDel] = useState(false);

  return (
    <div className={`bg-white border rounded-2xl p-5 transition-all ${service.enabled ? "border-green-200 shadow-sm" : "border-gray-200 opacity-60"}`}>
      <div className="flex items-start gap-4">
        {service.imageUrl ? (
          <img src={service.imageUrl} alt="" className="w-14 h-14 object-cover rounded-xl border border-gray-200 flex-shrink-0" />
        ) : (
          <div className="w-14 h-14 rounded-xl bg-green-50 border border-green-200 flex items-center justify-center text-2xl flex-shrink-0">
            {service.icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-gray-900 text-sm">{service.title}</h3>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${service.enabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
              {service.enabled ? "Actif" : "Inactif"}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{service.description}</p>
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
            <span className="text-green-700 font-bold">{service.startingPrice.toLocaleString("fr-FR")} FCFA</span>
            <span>⏱ {service.deliveryTime}</span>
            <span><Package size={10} className="inline mr-0.5" />{service.packages.length} forfait{service.packages.length > 1 ? "s" : ""}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100 flex-wrap">
        <button onClick={onEdit} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-medium">
          <Edit2 size={12} /> Modifier
        </button>
        <button onClick={onToggle} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${service.enabled ? "bg-gray-50 hover:bg-gray-100 text-gray-600" : "bg-green-50 hover:bg-green-100 text-green-700"}`}>
          {service.enabled ? <><EyeOff size={12} /> Désactiver</> : <><Eye size={12} /> Activer</>}
        </button>
        <Link href={`/services/${service.slug}`} target="_blank"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg text-xs font-medium">
          <ExternalLink size={12} /> Voir
        </Link>
        <div className="flex-1" />
        {confirmDel ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-red-600 font-medium">Confirmer ?</span>
            <button onClick={() => setConfirmDel(false)} className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 border border-gray-200 rounded-lg">Non</button>
            <button onClick={() => { setConfirmDel(false); onDelete(); }} className="text-xs text-white bg-red-500 hover:bg-red-600 px-2 py-1 rounded-lg">Supprimer</button>
          </div>
        ) : (
          <button onClick={() => setConfirmDel(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg text-xs font-medium">
            <Trash2 size={12} /> Supprimer
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Static Service Card (lecture seule) ──────────────────────────────────────

const STATIC_ICON_MAP: Record<string, string> = {
  Mic: "🎙️",
  Video: "🎬",
  ShoppingBag: "🛒",
};

function StaticServiceCard({ service }: { service: (typeof staticServices)[0] }) {
  const emoji = STATIC_ICON_MAP[service.icon] ?? "🛠️";
  return (
    <div className="bg-white border border-blue-200 rounded-2xl p-5 opacity-90">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-2xl flex-shrink-0">
          {emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-gray-900 text-sm">{service.title}</h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-100 text-blue-700 flex items-center gap-1">
              <Lock size={8} /> Statique
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-green-100 text-green-700">Actif</span>
          </div>
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{service.description}</p>
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
            <span className="text-green-700 font-bold">{service.startingPrice.toLocaleString("fr-FR")} FCFA</span>
            <span>⏱ {service.deliveryTime}</span>
            <span><Package size={10} className="inline mr-0.5" />{service.packages.length} forfaits</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
        <Link href={`/services/${service.slug}`} target="_blank"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg text-xs font-medium">
          <ExternalLink size={12} /> Voir la page
        </Link>
        <span className="text-xs text-gray-400 ml-2">Ce service est défini dans le code source — non modifiable depuis l&apos;admin.</span>
      </div>
    </div>
  );
}

// ─── Helper : DynamicService → ServiceForm ────────────────────────────────────

function toForm(s: DynamicService): ServiceForm & { id: string } {
  return {
    id: s.id,
    title: s.title,
    description: s.description,
    longDescription: s.longDescription,
    icon: s.icon,
    imageUrl: s.imageUrl || "",
    videoUrl: s.videoUrl || "",
    startingPrice: String(s.startingPrice),
    deliveryTime: s.deliveryTime,
    features: s.features.join("\n"),
    briefLabel: s.briefLabel || "",
    enabled: s.enabled,
    packages: s.packages.map((p) => ({
      name: p.name,
      price: String(p.price),
      deliveryTime: p.deliveryTime,
      features: p.features.join("\n"),
      popular: !!p.popular,
    })),
  };
}

// ─── Page principale ───────────────────────────────────────────────────────────

export default function AdminServicesPage() {
  const [adminPwd, setAdminPwd] = useState<string | null>(null);
  const [authFailed, setAuthFailed] = useState(false);
  const [services, setServices] = useState<DynamicService[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [msg, setMsg] = useState("");
  const [orderConfig, setOrderConfig] = useState<OrderConfig>(DEFAULT_ORDER_CONFIG);
  const [orderConfigSaving, setOrderConfigSaving] = useState(false);
  const [orderConfigMsg, setOrderConfigMsg] = useState("");

  const load = useCallback(async (pwd: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/services", { headers: { "x-admin-password": pwd } });
      if (!res.ok) { setAdminPwd(null); return; }
      setServices(await res.json() as DynamicService[]);
    } finally { setLoading(false); }
  }, []);

  async function handleAuth(pwd: string) {
    const res = await fetch("/api/admin/services", { headers: { "x-admin-password": pwd } });
    if (!res.ok) { setAuthFailed(true); return; }
    setAuthFailed(false);
    setAdminPwd(pwd);
    setServices(await res.json() as DynamicService[]);
    try {
      const cfgRes = await fetch("/api/admin/service-order-config", { cache: "no-store" });
      if (cfgRes.ok) setOrderConfig(await cfgRes.json() as OrderConfig);
    } catch {}
  }

  async function saveOrderConfig() {
    if (!adminPwd) return;
    setOrderConfigSaving(true);
    try {
      const res = await fetch("/api/admin/service-order-config", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-password": adminPwd },
        body: JSON.stringify(orderConfig),
      });
      if (res.ok) {
        setOrderConfigMsg("✓ Configuration enregistrée !");
        setTimeout(() => setOrderConfigMsg(""), 3000);
      }
    } catch {}
    finally { setOrderConfigSaving(false); }
  }

  async function toggle(svc: DynamicService) {
    if (!adminPwd) return;
    await fetch("/api/admin/services", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-password": adminPwd },
      body: JSON.stringify({ id: svc.id, enabled: !svc.enabled }),
    });
    await load(adminPwd);
  }

  async function del(id: string) {
    if (!adminPwd) return;
    await fetch(`/api/admin/services?id=${id}`, { method: "DELETE", headers: { "x-admin-password": adminPwd } });
    await load(adminPwd);
    setMsg("✓ Service supprimé");
    setTimeout(() => setMsg(""), 3000);
  }

  if (!adminPwd) return <AuthGate onAuth={handleAuth} authFailed={authFailed} />;

  const filtered = services.filter((s) =>
    !search || s.title.toLowerCase().includes(search.toLowerCase()) || s.description.toLowerCase().includes(search.toLowerCase())
  );

  const editing = editId ? services.find((s) => s.id === editId) : null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* Header */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-gray-400 hover:text-gray-600"><ArrowLeft size={20} /></Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestion des Services</h1>
            <p className="text-gray-500 text-sm">
              {staticServices.length + services.length} service{staticServices.length + services.length > 1 ? "s" : ""} au total
              · {staticServices.length} statique{staticServices.length > 1 ? "s" : ""}
              · {services.filter((s) => s.enabled).length} dynamique{services.filter((s) => s.enabled).length > 1 ? "s" : ""} actif{services.filter((s) => s.enabled).length > 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/services" target="_blank"
            className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-600 rounded-xl text-sm font-medium">
            <ExternalLink size={14} /> Page publique
          </Link>
          <button
            onClick={() => { setCreating(true); setEditId(null); }}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-sm"
          >
            <Plus size={15} /> Créer un service
          </button>
        </div>
      </div>

      {msg && (
        <div className="mb-5 px-4 py-3 bg-green-50 border border-green-200 text-green-700 text-sm font-medium rounded-xl">
          {msg}
        </div>
      )}

      {/* ── Configuration post-commande ── */}
      <div className="mb-8 bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">⚙️ Configuration post-commande</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Message et redirection affichés après la soumission d&apos;un formulaire de service
          </p>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className={labelCls}>
              Message de confirmation{" "}
              <span className="font-normal text-gray-400">
                (variables : {"{prenom}"}, {"{nom}"}, {"{numero_commande}"}, {"{whatsapp}"})
              </span>
            </label>
            <textarea
              value={orderConfig.confirmationMessage}
              onChange={(e) => setOrderConfig((c) => ({ ...c, confirmationMessage: e.target.value }))}
              rows={4}
              className={`${inputCls} resize-none`}
              placeholder="Merci {prenom} ! Contactez-nous sur WhatsApp au {whatsapp} avec le numéro #{numero_commande}."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Numéro WhatsApp</label>
              <input
                type="tel"
                value={orderConfig.whatsappNumber}
                onChange={(e) => setOrderConfig((c) => ({ ...c, whatsappNumber: e.target.value }))}
                className={inputCls}
                placeholder="+237697000000"
              />
            </div>
            <div>
              <label className={labelCls}>
                Délai avant redirection (secondes){" "}
                <span className="font-normal text-gray-400">· 0 = immédiat, -1 = désactivé</span>
              </label>
              <input
                type="number"
                min={-1}
                max={30}
                value={orderConfig.redirectDelay}
                onChange={(e) => setOrderConfig((c) => ({ ...c, redirectDelay: parseInt(e.target.value) || 0 }))}
                className={inputCls}
                placeholder="5"
              />
            </div>
          </div>
          <div>
            <label className={labelCls}>
              URL de redirection{" "}
              <span className="font-normal text-gray-400">
                (Calendly, WhatsApp, etc. — laisser vide pour désactiver la redirection)
              </span>
            </label>
            <input
              type="url"
              value={orderConfig.redirectUrl}
              onChange={(e) => setOrderConfig((c) => ({ ...c, redirectUrl: e.target.value }))}
              className={inputCls}
              placeholder="https://calendly.com/smartlife/30min"
            />
          </div>
          {orderConfigMsg && (
            <p className="text-green-600 text-sm font-medium">{orderConfigMsg}</p>
          )}
          <div className="flex justify-end">
            <button
              onClick={saveOrderConfig}
              disabled={orderConfigSaving}
              className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-sm disabled:opacity-40"
            >
              {orderConfigSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Enregistrer la configuration
            </button>
          </div>
        </div>
      </div>

      {/* Formulaire création */}
      {creating && !editId && (
        <div className="mb-8">
          <ServiceEditor
            initial={EMPTY_FORM}
            adminPassword={adminPwd}
            title="Créer un nouveau service"
            onSave={async () => { setCreating(false); await load(adminPwd); setMsg("✓ Service créé avec succès !"); setTimeout(() => setMsg(""), 3000); }}
            onCancel={() => setCreating(false)}
          />
        </div>
      )}

      {/* Formulaire édition */}
      {editId && editing && (
        <div className="mb-8">
          <ServiceEditor
            initial={toForm(editing)}
            adminPassword={adminPwd}
            title={`Modifier : ${editing.title}`}
            onSave={async () => { setEditId(null); await load(adminPwd); setMsg("✓ Service mis à jour !"); setTimeout(() => setMsg(""), 3000); }}
            onCancel={() => setEditId(null)}
          />
        </div>
      )}

      {/* Recherche */}
      <div className="mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un service…"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-400"
        />
      </div>

      {/* Services statiques (lecture seule) */}
      {(!search || staticServices.some((s) => s.title.toLowerCase().includes(search.toLowerCase()) || s.description.toLowerCase().includes(search.toLowerCase()))) && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Lock size={13} className="text-blue-500" />
            <h2 className="text-sm font-bold text-blue-700">Services intégrés (code source)</h2>
            <span className="text-xs text-blue-400">— non modifiables depuis l&apos;admin</span>
          </div>
          <div className="grid gap-4">
            {staticServices
              .filter((s) => !search || s.title.toLowerCase().includes(search.toLowerCase()) || s.description.toLowerCase().includes(search.toLowerCase()))
              .map((svc) => <StaticServiceCard key={svc.id} service={svc} />)}
          </div>
        </div>
      )}

      {/* Services dynamiques */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Plus size={13} className="text-green-600" />
          <h2 className="text-sm font-bold text-green-700">Services créés depuis l&apos;admin</h2>
        </div>
        {loading ? (
          <div className="text-center py-16 text-gray-400"><Loader2 size={24} className="animate-spin mx-auto mb-3" />Chargement…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white border border-dashed border-gray-200 rounded-2xl">
            <div className="text-5xl mb-4">🛠️</div>
            <p className="text-gray-500 text-sm">{search ? "Aucun résultat pour cette recherche." : "Aucun service créé. Cliquez sur \"Créer un service\"."}</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filtered.map((svc) => (
              <ServiceCard
                key={svc.id}
                service={svc}
                onEdit={() => { setEditId(svc.id); setCreating(false); }}
                onToggle={() => toggle(svc)}
                onDelete={() => del(svc.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
