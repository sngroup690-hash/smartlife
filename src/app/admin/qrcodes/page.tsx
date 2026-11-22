"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft, Plus, Pencil, Trash2, Save, X, QrCode,
  Download, Copy, Check, ExternalLink, Loader2, BarChart2,
  AlertCircle, RefreshCw, Percent, DollarSign,
} from "lucide-react";
import { ebooks as staticEbooks } from "@/lib/data";
import { FORMATIONS as staticFormations } from "@/lib/formations-data";

const SITE = "https://smartlifecm.com";
const ADMIN_PWD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? "";

// ── Types ──────────────────────────────────────────────────────────────────────

type DiscountType = "none" | "percent" | "fixed";

type QRCodeEntry = {
  id: string;
  code: string;
  nom: string;
  targetUrl: string;
  discountType: DiscountType;
  discountValue: number;
  discountLabel: string;
  scans: number;
  createdAt: string;
  updatedAt: string;
};

type ProductItem = { label: string; url: string };

const EMPTY_FORM = {
  nom: "",
  targetUrl: "",
  discountType: "none" as DiscountType,
  discountValue: "",
  discountLabel: "",
  productCategory: "custom" as string,
  productId: "",
};

// ── Styles ─────────────────────────────────────────────────────────────────────

const inputCls = "w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:border-[#E8B800] focus:bg-white transition-colors placeholder-gray-400";
const selectCls = "w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:border-[#E8B800] focus:bg-white transition-colors";

// ── QR Image Generator ─────────────────────────────────────────────────────────

function useQRCode(url: string) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [svgStr, setSvgStr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!url) { setDataUrl(null); setSvgStr(null); return; }
    let cancelled = false;
    setLoading(true);
    import("qrcode").then(async (QRCode) => {
      if (cancelled) return;
      try {
        const SIZE = 400;

        // 1) Générer le QR en data URL (fond potentiellement transparent)
        const rawDataUrl = await QRCode.default.toDataURL(url, {
          width: SIZE, margin: 2,
          color: { dark: "#000000", light: "#ffffff" },
        });

        // 2) Recomposer sur un canvas blanc pour garantir fond blanc opaque
        const img = new Image();
        img.src = rawDataUrl;
        await new Promise<void>((res) => { img.onload = () => res(); });
        const canvas = document.createElement("canvas");
        canvas.width = SIZE;
        canvas.height = SIZE;
        const ctx = canvas.getContext("2d")!;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, SIZE, SIZE);
        ctx.drawImage(img, 0, 0, SIZE, SIZE);
        const png = canvas.toDataURL("image/png");

        // 3) SVG avec fond blanc explicite
        const svg = await QRCode.default.toString(url, {
          type: "svg", margin: 2,
          color: { dark: "#000000", light: "#ffffff" },
        });

        if (!cancelled) { setDataUrl(png); setSvgStr(svg); }
      } catch {}
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [url]);

  return { dataUrl, svgStr, loading };
}

// ── Auth Gate ──────────────────────────────────────────────────────────────────

export default function AdminQRCodesPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState("");

  function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    if (password === ADMIN_PWD) setAuthed(true);
    else setAuthError("Mot de passe incorrect.");
  }

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-sm p-8 bg-white border border-gray-200 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <QrCode size={24} className="text-[#E8B800]" />
            <h1 className="text-xl font-bold text-gray-900">Admin — QR Codes</h1>
          </div>
          <form onSubmit={handleAuth} className="space-y-4">
            <input
              type="password"
              placeholder="Mot de passe admin"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputCls}
              autoFocus
            />
            {authError && <p className="text-red-500 text-sm">{authError}</p>}
            <button type="submit" className="w-full py-2.5 bg-[#E8B800] hover:bg-[#D4A017] text-black font-bold rounded-xl text-sm transition-colors">
              Accéder
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <QRCodesAdmin />;
}

// ── Main Admin Component ───────────────────────────────────────────────────────

function QRCodesAdmin() {
  const [qrcodes, setQrcodes] = useState<QRCodeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [copied, setCopied] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [products, setProducts] = useState<Record<string, ProductItem[]>>({});

  // Build product list from static data
  useEffect(() => {
    const ebookItems: ProductItem[] = staticEbooks.map((e) => ({
      label: e.title,
      url: `/ebooks/${e.slug}`,
    }));
    const formationItems: ProductItem[] = staticFormations.map((f) => ({
      label: f.titre,
      url: `/formation/${f.id}`,
    }));

    // Fetch dynamic ebooks/formations/services/packs
    async function fetchAll() {
      try {
        const [dynEbooks, dynFormations, svcs, packs, ressources] = await Promise.all([
          fetch("/api/admin/sync-ebooks", { headers: { "x-admin-password": ADMIN_PWD } }).then((r) => r.json()).catch(() => ({ ebooks: [] })),
          fetch("/api/admin/sync-formations", { headers: { "x-admin-password": ADMIN_PWD } }).then((r) => r.json()).catch(() => ({ formations: [] })),
          fetch("/api/admin/services", { headers: { "x-admin-password": ADMIN_PWD } }).then((r) => r.json()).catch(() => []),
          fetch(`/api/admin/packs?password=${ADMIN_PWD}`).then((r) => r.json()).catch(() => ({ packs: [] })),
          fetch(`/api/admin/ressources-gratuites?password=${ADMIN_PWD}`).then((r) => r.json()).catch(() => ({ ressources: [] })),
        ]);

        const dynEbookItems: ProductItem[] = (dynEbooks.ebooks || []).map((e: { title: string; slug?: string; id: string }) => ({
          label: e.title,
          url: `/ebooks/${e.slug || e.id}`,
        }));
        const dynFormationItems: ProductItem[] = (dynFormations.formations || []).map((f: { titre: string; id: string }) => ({
          label: f.titre,
          url: `/formation/${f.id}`,
        }));
        const svcItems: ProductItem[] = (Array.isArray(svcs) ? svcs : []).map((s: { nom: string; slug: string }) => ({
          label: s.nom,
          url: `/services/${s.slug}`,
        }));
        const packItems: ProductItem[] = (packs.packs || []).map((p: { nom: string; slug: string }) => ({
          label: p.nom,
          url: `/packs/${p.slug}`,
        }));
        const ressourceItems: ProductItem[] = (ressources.ressources || []).filter((r: { actif: boolean }) => r.actif).map((r: { titre: string; slug: string }) => ({
          label: r.titre,
          url: `/ressources-gratuites/${r.slug}`,
        }));

        setProducts({
          ebook: [...ebookItems, ...dynEbookItems],
          formation: [...formationItems, ...dynFormationItems],
          service: svcItems,
          pack: packItems,
          ressource: ressourceItems,
        });
      } catch {}
    }

    setProducts({ ebook: ebookItems, formation: formationItems, service: [], pack: [], ressource: [] });
    fetchAll();
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/qrcodes?password=${ADMIN_PWD}`);
      const data = await res.json();
      setQrcodes(data.qrcodes || []);
    } catch {
      setError("Erreur de chargement.");
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setForm({ ...EMPTY_FORM });
    setEditId(null);
    setShowForm(true);
  }

  function openEdit(q: QRCodeEntry) {
    setForm({
      nom: q.nom,
      targetUrl: q.targetUrl,
      discountType: q.discountType,
      discountValue: String(q.discountValue),
      discountLabel: q.discountLabel,
      productCategory: "custom",
      productId: "",
    });
    setEditId(q.id);
    setShowForm(true);
  }

  function handleProductSelect(category: string, productUrl: string) {
    setForm((f) => ({ ...f, productCategory: category, productId: productUrl, targetUrl: productUrl }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nom.trim()) { setError("Le nom est obligatoire."); return; }
    if (!form.targetUrl.trim()) { setError("L'URL de destination est obligatoire."); return; }
    setSaving(true);
    setError("");
    try {
      const payload = {
        id: editId,
        nom: form.nom.trim(),
        targetUrl: form.targetUrl.trim(),
        discountType: form.discountType,
        discountValue: Number(form.discountValue) || 0,
        discountLabel: form.discountLabel.trim(),
      };
      const res = await fetch(`/api/admin/qrcodes?password=${ADMIN_PWD}`, {
        method: editId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error || "Erreur"); setSaving(false); return; }
      await load();
      setShowForm(false);
      setEditId(null);
    } catch {
      setError("Erreur réseau.");
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    setDeleteId(null);
    await fetch(`/api/admin/qrcodes?password=${ADMIN_PWD}&id=${id}`, { method: "DELETE" });
    await load();
  }

  function copyUrl(code: string) {
    const url = `${SITE}/qr/${code}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(code);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="p-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-100 transition-colors">
              <ArrowLeft size={16} className="text-gray-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <QrCode size={22} className="text-[#E8B800]" />
                QR Codes Dynamiques
              </h1>
              <p className="text-gray-500 text-sm mt-0.5">Créez des QR codes de campagne avec tracking et promo automatique</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={load} className="p-2 border border-gray-200 rounded-xl bg-white hover:bg-gray-100 transition-colors" title="Actualiser">
              <RefreshCw size={15} className="text-gray-600" />
            </button>
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#E8B800] hover:bg-[#D4A017] text-black font-bold rounded-xl text-sm transition-colors"
            >
              <Plus size={15} /> Nouveau QR Code
            </button>
          </div>
        </div>

        {/* Form */}
        {showForm && (
          <QRCodeForm
            form={form}
            setForm={setForm}
            products={products}
            onProductSelect={handleProductSelect}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditId(null); setError(""); }}
            saving={saving}
            error={error}
            editId={editId}
          />
        )}

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-[#E8B800]" />
          </div>
        ) : qrcodes.length === 0 ? (
          <div className="text-center py-20">
            <QrCode size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 font-semibold">Aucun QR code créé</p>
            <p className="text-gray-400 text-sm mt-1 mb-6">Créez votre premier QR code de campagne</p>
            <button onClick={openCreate} className="inline-flex items-center gap-2 px-6 py-3 bg-[#E8B800] hover:bg-[#D4A017] text-black font-bold rounded-xl text-sm">
              <Plus size={15} /> Créer un QR Code
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {qrcodes.map((q) => (
              <QRCodeCard
                key={q.id}
                q={q}
                copied={copied}
                onCopy={copyUrl}
                onEdit={openEdit}
                onDelete={(id) => setDeleteId(id)}
                deleteId={deleteId}
                onConfirmDelete={handleDelete}
                onCancelDelete={() => setDeleteId(null)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── QR Code Form ───────────────────────────────────────────────────────────────

function QRCodeForm({
  form,
  setForm,
  products,
  onProductSelect,
  onSave,
  onCancel,
  saving,
  error,
  editId,
}: {
  form: typeof EMPTY_FORM;
  setForm: React.Dispatch<React.SetStateAction<typeof EMPTY_FORM>>;
  products: Record<string, ProductItem[]>;
  onProductSelect: (cat: string, url: string) => void;
  onSave: (e: React.FormEvent) => void;
  onCancel: () => void;
  saving: boolean;
  error: string;
  editId: string | null;
}) {
  const previewUrl = form.targetUrl.trim() ? `${SITE}/qr/APERCU` : "";

  return (
    <div className="mb-8 p-6 bg-white border border-gray-200 rounded-2xl shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-gray-900">
          {editId ? "Modifier le QR Code" : "Nouveau QR Code"}
        </h2>
        <button onClick={onCancel} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg">
          <X size={18} />
        </button>
      </div>

      <form onSubmit={onSave}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {/* Left — Config */}
          <div className="space-y-5">
            {/* Nom */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nom du QR Code <span className="text-red-400">*</span></label>
              <input
                type="text"
                value={form.nom}
                onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
                placeholder="Ex: Campagne Vidéo Août 2026"
                className={inputCls}
              />
            </div>

            {/* Page de destination */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Page de destination <span className="text-red-400">*</span></label>
              <select
                value={form.productCategory}
                onChange={(e) => {
                  const cat = e.target.value;
                  setForm((f) => ({ ...f, productCategory: cat, productId: "", ...(cat === "custom" ? {} : { targetUrl: "" }) }));
                }}
                className={selectCls}
              >
                <option value="custom">URL personnalisée</option>
                <option value="ebook">Ebook</option>
                <option value="formation">Formation</option>
                <option value="service">Service</option>
                <option value="pack">Pack</option>
                <option value="ressource">Ressource Gratuite</option>
              </select>

              {form.productCategory !== "custom" ? (
                <select
                  value={form.productId}
                  onChange={(e) => onProductSelect(form.productCategory, e.target.value)}
                  className={`${selectCls} mt-2`}
                >
                  <option value="">— Choisir —</option>
                  {(products[form.productCategory] || []).map((p) => (
                    <option key={p.url} value={p.url}>{p.label}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={form.targetUrl}
                  onChange={(e) => setForm((f) => ({ ...f, targetUrl: e.target.value }))}
                  placeholder="Ex: /ebooks/mon-guide ou https://..."
                  className={`${inputCls} mt-2`}
                />
              )}
              {form.targetUrl && (
                <p className="text-xs text-gray-400 mt-1 truncate">→ {form.targetUrl}</p>
              )}
            </div>

            {/* Promo */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Code Promo / Réduction (optionnel)</label>
              <div className="flex gap-2 mb-2">
                {(["none", "percent", "fixed"] as DiscountType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, discountType: t, discountValue: t === "none" ? "" : f.discountValue }))}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-colors ${
                      form.discountType === t
                        ? "bg-[#E8B800] border-[#D4A017] text-black"
                        : "bg-gray-50 border-gray-200 text-gray-600 hover:border-[#E8B800]"
                    }`}
                  >
                    {t === "none" && "Aucune"}
                    {t === "percent" && <><Percent size={11} /> Pourcentage</>}
                    {t === "fixed" && <><DollarSign size={11} /> Montant fixe</>}
                  </button>
                ))}
              </div>

              {form.discountType !== "none" && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="number"
                        value={form.discountValue}
                        onChange={(e) => setForm((f) => ({ ...f, discountValue: e.target.value }))}
                        placeholder={form.discountType === "percent" ? "20" : "1000"}
                        min={0}
                        max={form.discountType === "percent" ? 100 : undefined}
                        className={inputCls}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-semibold">
                        {form.discountType === "percent" ? "%" : "FCFA"}
                      </span>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={form.discountLabel}
                    onChange={(e) => setForm((f) => ({ ...f, discountLabel: e.target.value }))}
                    placeholder={`Ex: TCHOP10 — Réduction ${form.discountType === "percent" ? `${form.discountValue || "X"}%` : `${form.discountValue || "X"} FCFA`}`}
                    className={inputCls}
                  />
                  <p className="text-xs text-gray-400">Ce libellé apparaît dans le panier lors de l&apos;achat.</p>
                </div>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                <AlertCircle size={15} /> {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#E8B800] hover:bg-[#D4A017] disabled:opacity-60 text-black font-bold rounded-xl text-sm transition-colors"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {editId ? "Mettre à jour" : "Créer le QR Code"}
              </button>
              <button type="button" onClick={onCancel} className="px-5 py-2.5 border border-gray-200 text-gray-600 font-semibold rounded-xl text-sm hover:bg-gray-50 transition-colors">
                Annuler
              </button>
            </div>
          </div>

          {/* Right — QR Preview */}
          <div className="flex flex-col items-center justify-start pt-2">
            <p className="text-sm font-semibold text-gray-600 mb-3 self-start">Aperçu du QR Code</p>
            {previewUrl ? (
              <div className="text-center">
                <QRPreviewImage url={previewUrl} />
                <p className="text-xs text-gray-400 mt-2">Le code final sera généré après création.</p>
              </div>
            ) : (
              <div className="w-48 h-48 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50 text-center px-4">
                <QrCode size={32} className="text-gray-300 mb-2" />
                <p className="text-xs text-gray-400">Saisissez une URL pour voir l&apos;aperçu</p>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

function QRPreviewImage({ url }: { url: string }) {
  const { dataUrl } = useQRCode(url);
  if (!dataUrl) return null;
  return (
    <div style={{ background: "#ffffff", borderRadius: "1rem", border: "1px solid #e5e7eb", display: "inline-block" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={dataUrl} alt="QR Code Preview" style={{ width: 192, height: 192, display: "block", borderRadius: "1rem" }} />
    </div>
  );
}

// ── QR Code Card ───────────────────────────────────────────────────────────────

function QRCodeCard({
  q,
  copied,
  onCopy,
  onEdit,
  onDelete,
  deleteId,
  onConfirmDelete,
  onCancelDelete,
}: {
  q: QRCodeEntry;
  copied: string | null;
  onCopy: (code: string) => void;
  onEdit: (q: QRCodeEntry) => void;
  onDelete: (id: string) => void;
  deleteId: string | null;
  onConfirmDelete: (id: string) => void;
  onCancelDelete: () => void;
}) {
  const qrUrl = `${SITE}/qr/${q.code}`;
  const { dataUrl, svgStr } = useQRCode(qrUrl);

  function downloadPng() {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `qrcode-${q.nom.toLowerCase().replace(/\s+/g, "-")}.png`;
    a.click();
  }

  function downloadSvg() {
    if (!svgStr) return;
    // Inject white background rect if not already present
    const withBg = svgStr.includes('fill="#fff"') || svgStr.includes("fill='#fff'")
      ? svgStr
      : svgStr.replace("<svg ", `<svg style="background:#ffffff" `);
    const blob = new Blob([withBg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `qrcode-${q.nom.toLowerCase().replace(/\s+/g, "-")}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-5 bg-white border border-gray-200 rounded-2xl shadow-sm">
      <div className="flex items-start gap-5">
        {/* QR Image */}
        <div className="flex-shrink-0">
          {dataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <div style={{ background: "#ffffff", borderRadius: "0.75rem", border: "1px solid #e5e7eb", display: "inline-block" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={dataUrl} alt={q.nom} style={{ width: 112, height: 112, display: "block", borderRadius: "0.75rem" }} />
            </div>
          ) : (
            <div className="w-28 h-28 flex items-center justify-center bg-gray-50 rounded-xl border border-gray-200">
              <Loader2 size={20} className="animate-spin text-gray-300" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h3 className="text-gray-900 font-bold text-base">{q.nom}</h3>
              <p className="text-gray-500 text-xs mt-0.5 truncate max-w-xs">→ {q.targetUrl}</p>
            </div>
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-xl">
              <BarChart2 size={13} className="text-[#E8B800]" />
              <span className="text-gray-800 font-bold text-sm">{q.scans}</span>
              <span className="text-gray-400 text-xs">scan{q.scans !== 1 ? "s" : ""}</span>
            </div>
          </div>

          {/* Promo badge */}
          {q.discountType !== "none" && q.discountValue > 0 && (
            <span className="inline-flex items-center gap-1 mt-2 px-2.5 py-1 bg-green-50 border border-green-200 text-green-700 text-xs font-bold rounded-full">
              {q.discountType === "percent" ? <Percent size={10} /> : <DollarSign size={10} />}
              {q.discountType === "percent" ? `${q.discountValue}%` : `${q.discountValue} FCFA`}
              {q.discountLabel && ` — ${q.discountLabel}`}
            </span>
          )}

          {/* URL */}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <code className="text-xs bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-lg text-gray-600 truncate max-w-xs">
              {qrUrl}
            </code>
            <button
              onClick={() => onCopy(q.code)}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 border border-gray-200 hover:border-[#E8B800] text-gray-600 text-xs rounded-lg transition-colors"
            >
              {copied === q.code ? <Check size={11} className="text-green-500" /> : <Copy size={11} />}
              {copied === q.code ? "Copié!" : "Copier"}
            </button>
            <a
              href={qrUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 border border-gray-200 hover:border-blue-300 text-gray-600 text-xs rounded-lg transition-colors"
            >
              <ExternalLink size={11} /> Tester
            </a>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 mt-4 flex-wrap">
            {/* Download PNG */}
            <button
              onClick={downloadPng}
              disabled={!dataUrl}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-xl disabled:opacity-50 transition-colors"
            >
              <Download size={12} /> PNG
            </button>
            {/* Download SVG */}
            <button
              onClick={downloadSvg}
              disabled={!svgStr}
              className="flex items-center gap-1.5 px-3 py-2 bg-purple-50 border border-purple-200 hover:bg-purple-100 text-purple-700 text-xs font-semibold rounded-xl disabled:opacity-50 transition-colors"
            >
              <Download size={12} /> SVG
            </button>
            {/* Edit */}
            <button
              onClick={() => onEdit(q)}
              className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-700 text-xs font-semibold rounded-xl transition-colors"
            >
              <Pencil size={12} /> Modifier
            </button>
            {/* Delete */}
            {deleteId === q.id ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-500 font-semibold">Confirmer la suppression ?</span>
                <button onClick={() => onConfirmDelete(q.id)} className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-xl transition-colors">Oui, supprimer</button>
                <button onClick={onCancelDelete} className="px-3 py-2 border border-gray-200 text-gray-600 text-xs font-semibold rounded-xl hover:bg-gray-50 transition-colors">Annuler</button>
              </div>
            ) : (
              <button
                onClick={() => onDelete(q.id)}
                className="flex items-center gap-1.5 px-3 py-2 bg-red-50 border border-red-200 hover:bg-red-100 text-red-600 text-xs font-semibold rounded-xl transition-colors"
              >
                <Trash2 size={12} /> Supprimer
              </button>
            )}
          </div>
        </div>
      </div>

      <p className="text-gray-400 text-xs mt-3 border-t border-gray-100 pt-3">
        Créé le {new Date(q.createdAt).toLocaleDateString("fr-FR")} · Mis à jour le {new Date(q.updatedAt).toLocaleDateString("fr-FR")}
      </p>
    </div>
  );
}