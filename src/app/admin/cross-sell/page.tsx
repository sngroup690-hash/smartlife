"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Plus, Trash2, ToggleLeft, ToggleRight, Search, BookOpen, Play, Loader2, CheckCircle } from "lucide-react";
import type { CrossSellConfig, CrossSellProductConfig, ManualAssoc } from "@/lib/cross-sell-store";

const ADMIN_PASSWORD_KEY = "sl_admin_pw";

function getAdminPw(): string {
  try { return localStorage.getItem(ADMIN_PASSWORD_KEY) || ""; } catch { return ""; }
}

type ProductInfo = {
  id: string;
  type: "ebook" | "formation";
  title: string;
  category?: string;
  cover?: string;
  slug?: string;
};

// ── Password gate ──────────────────────────────────────────────────────────────

function PasswordGate({ onAuth }: { onAuth: (pw: string) => void }) {
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  async function handle(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/cross-sell?adminConfig=true&password=${encodeURIComponent(pw)}`);
    if (res.ok) { onAuth(pw); }
    else setError("Mot de passe incorrect");
  }
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <form onSubmit={handle} className="w-full max-w-sm space-y-4">
        <h1 className="text-gray-900 font-bold text-2xl text-center mb-6">Admin — Cross-Selling</h1>
        <input
          type="password" value={pw} onChange={e => setPw(e.target.value)}
          placeholder="Mot de passe admin"
          className="w-full px-4 py-3 border border-green-300 rounded-xl text-gray-900 focus:outline-none focus:border-green-500"
          autoFocus
        />
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        <button type="submit" className="w-full py-3 bg-gradient-to-r from-[#E8B800] to-[#27A827] text-black font-bold rounded-xl">
          Accéder
        </button>
        <div className="text-center">
          <Link href="/admin" className="text-gray-400 text-sm hover:text-gray-600">← Retour au panel</Link>
        </div>
      </form>
    </div>
  );
}

// ── Product picker modal ───────────────────────────────────────────────────────

function ProductPicker({
  onSelect,
  onClose,
  products,
  excluded,
}: {
  onSelect: (p: ProductInfo) => void;
  onClose: () => void;
  products: ProductInfo[];
  excluded: string[];
}) {
  const [q, setQ] = useState("");
  const filtered = products.filter(p =>
    !excluded.includes(p.id) &&
    (!q || p.title.toLowerCase().includes(q.toLowerCase()) || p.category?.toLowerCase().includes(q.toLowerCase()))
  );
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-gray-100 flex items-center gap-3">
          <Search size={16} className="text-gray-400 flex-shrink-0" />
          <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Rechercher un produit…"
            className="flex-1 text-sm text-gray-900 outline-none" />
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xs font-bold px-2 py-1 rounded">✕</button>
        </div>
        <div className="overflow-y-auto flex-1">
          {filtered.length === 0 && <p className="text-gray-400 text-sm text-center py-8">Aucun produit trouvé</p>}
          {filtered.map(p => (
            <button key={p.id} onClick={() => { onSelect(p); onClose(); }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-0">
              <div className="w-10 h-10 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                {p.cover ? <img src={p.cover} alt="" className="w-full h-full object-cover" /> :
                  <div className="w-full h-full flex items-center justify-center">
                    {p.type === "ebook" ? <BookOpen size={16} className="text-gray-400" /> : <Play size={16} className="text-gray-400" />}
                  </div>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{p.title}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${p.type === "ebook" ? "bg-[#E8B800]/15 text-[#b88a00]" : "bg-green-100 text-green-700"}`}>
                    {p.type === "ebook" ? "Ebook" : "Formation"}
                  </span>
                  {p.category && <span className="text-xs text-gray-400">{p.category}</span>}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Product config row ─────────────────────────────────────────────────────────

function ProductRow({
  product,
  cfg,
  allProducts,
  onChange,
  onRemove,
}: {
  product: ProductInfo;
  cfg: CrossSellProductConfig;
  allProducts: ProductInfo[];
  onChange: (c: CrossSellProductConfig) => void;
  onRemove: () => void;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const manualIds = cfg.manualIds || [];
  const excluded = [product.id, ...manualIds.map(a => a.id)];
  const enabled = cfg.enabled !== false;

  function addManual(p: ProductInfo) {
    if (manualIds.length >= 3) return;
    onChange({ ...cfg, manualIds: [...manualIds, { id: p.id, type: p.type }] });
  }

  function removeManual(id: string) {
    onChange({ ...cfg, manualIds: manualIds.filter(a => a.id !== id) });
  }

  return (
    <div className={`border rounded-2xl p-4 transition-colors ${enabled ? "border-gray-200 bg-white" : "border-gray-100 bg-gray-50 opacity-60"}`}>
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
          {product.cover ? <img src={product.cover} alt="" className="w-full h-full object-cover" /> :
            <div className="w-full h-full flex items-center justify-center">
              {product.type === "ebook" ? <BookOpen size={16} className="text-gray-400" /> : <Play size={16} className="text-gray-400" />}
            </div>}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900 truncate">{product.title}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${product.type === "ebook" ? "bg-[#E8B800]/15 text-[#b88a00]" : "bg-green-100 text-green-700"}`}>
              {product.type === "ebook" ? "Ebook" : "Formation"}
            </span>
            {product.category && <span className="text-xs text-gray-400">{product.category}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={() => onChange({ ...cfg, enabled: !enabled })} className="text-gray-400 hover:text-gray-700">
            {enabled ? <ToggleRight size={22} className="text-green-500" /> : <ToggleLeft size={22} />}
          </button>
          <button onClick={onRemove} className="text-gray-300 hover:text-red-500 transition-colors">
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {enabled && (
        <div className="space-y-3 pl-13">
          {/* Mode */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 font-semibold w-14 flex-shrink-0">Mode</span>
            <div className="flex gap-2">
              {(["auto", "manual"] as const).map(m => (
                <button key={m} onClick={() => onChange({ ...cfg, mode: m })}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${cfg.mode === m ? "bg-[#E8B800] border-[#E8B800] text-black" : "border-gray-200 text-gray-600 hover:border-[#E8B800]"}`}>
                  {m === "auto" ? "🤖 Automatique" : "✏️ Manuel"}
                </button>
              ))}
            </div>
          </div>

          {/* Manual associations */}
          {cfg.mode === "manual" && (
            <div>
              <p className="text-xs text-gray-500 font-semibold mb-2">Produits associés (max 3)</p>
              <div className="space-y-1.5">
                {manualIds.map(assoc => {
                  const p = allProducts.find(x => x.id === assoc.id);
                  return (
                    <div key={assoc.id} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${assoc.type === "ebook" ? "bg-[#E8B800]/15 text-[#b88a00]" : "bg-green-100 text-green-700"}`}>
                        {assoc.type === "ebook" ? "E" : "F"}
                      </span>
                      <span className="text-xs text-gray-700 flex-1 truncate">{p?.title ?? assoc.id}</span>
                      <button onClick={() => removeManual(assoc.id)} className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  );
                })}
                {manualIds.length < 3 && (
                  <button onClick={() => setShowPicker(true)}
                    className="flex items-center gap-1.5 text-xs text-[#E8B800] hover:text-[#d4a700] font-semibold mt-1">
                    <Plus size={13} /> Ajouter un produit
                  </button>
                )}
              </div>
              {showPicker && (
                <ProductPicker
                  onSelect={addManual}
                  onClose={() => setShowPicker(false)}
                  products={allProducts}
                  excluded={excluded}
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function CrossSellAdminPage() {
  const [pw, setPw] = useState<string | null>(null);
  const [cfg, setCfg] = useState<CrossSellConfig | null>(null);
  const [allProducts, setAllProducts] = useState<ProductInfo[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [filterQ, setFilterQ] = useState("");

  useEffect(() => {
    const stored = getAdminPw();
    if (stored) tryAuth(stored);
  }, []);

  async function tryAuth(password: string) {
    const res = await fetch(`/api/cross-sell?adminConfig=true&password=${encodeURIComponent(password)}`);
    if (res.ok) {
      const data: CrossSellConfig = await res.json();
      setCfg(data);
      setPw(password);
      try { localStorage.setItem(ADMIN_PASSWORD_KEY, password); } catch { /* */ }
      loadProducts();
    }
  }

  async function loadProducts() {
    const storedPw = getAdminPw();
    const headers = storedPw ? { "x-admin-password": storedPw } : undefined;
    const [ebRes, fmRes] = await Promise.all([
      fetch("/api/admin/catalogue?type=ebooks", { headers }).catch(() => null),
      fetch("/api/admin/catalogue?type=formations", { headers }).catch(() => null),
    ]);
    const products: ProductInfo[] = [];
    if (ebRes?.ok) {
      const d = await ebRes.json().catch(() => ({}));
      const list = d.ebooks ?? d ?? [];
      for (const e of list) {
        if (e.id) products.push({ id: e.id, type: "ebook", title: e.title ?? e.titre ?? e.id, category: e.category ?? e.categorie, cover: e.cover, slug: e.slug });
      }
    }
    if (fmRes?.ok) {
      const d = await fmRes.json().catch(() => ({}));
      const list = d.formations ?? d ?? [];
      for (const f of list) {
        if (f.id) products.push({ id: f.id, type: "formation", title: f.titre ?? f.title ?? f.id, category: f.categorie ?? f.category, cover: f.cover });
      }
    }
    setAllProducts(products);
  }

  const save = useCallback(async () => {
    if (!cfg || !pw) return;
    setSaving(true);
    await fetch("/api/cross-sell", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-password": pw },
      body: JSON.stringify(cfg),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }, [cfg, pw]);

  if (!pw || !cfg) return <PasswordGate onAuth={pw => tryAuth(pw)} />;

  const configuredIds = Object.keys(cfg.products);
  const filteredConfigured = configuredIds.filter(id => {
    const p = allProducts.find(x => x.id === id);
    if (!p) return true;
    return !filterQ || p.title.toLowerCase().includes(filterQ.toLowerCase());
  });
  const addableProducts = allProducts.filter(p => !configuredIds.includes(p.id));

  function updateProductCfg(id: string, productCfg: CrossSellProductConfig) {
    setCfg(prev => prev ? { ...prev, products: { ...prev.products, [id]: productCfg } } : prev);
  }

  function removeProductCfg(id: string) {
    setCfg(prev => {
      if (!prev) return prev;
      const products = { ...prev.products };
      delete products[id];
      return { ...prev, products };
    });
  }

  function addProduct(p: ProductInfo) {
    setCfg(prev => prev ? { ...prev, products: { ...prev.products, [p.id]: { enabled: true, mode: "auto", manualIds: [] } } } : prev);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-gray-400 hover:text-gray-700 transition-colors">
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-gray-900 font-bold text-lg leading-tight">Cross-Selling</h1>
              <p className="text-gray-400 text-xs">Recommandations de produits complémentaires</p>
            </div>
          </div>
          <button
            onClick={save}
            disabled={saving}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
              saved ? "bg-emerald-500 text-white" : "bg-[#E8B800] hover:bg-[#d4a700] text-black"
            }`}
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : saved ? <CheckCircle size={15} /> : <Save size={15} />}
            {saved ? "Sauvegardé !" : "Enregistrer"}
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">

        {/* Paramètres globaux */}
        <section className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="text-gray-900 font-bold text-base mb-5">Paramètres globaux</h2>
          <div className="space-y-5">

            {/* Enable module */}
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <p className="text-sm font-semibold text-gray-900">Module actif</p>
                <p className="text-xs text-gray-400">Afficher les recommandations sur toutes les fiches produit</p>
              </div>
              <button onClick={() => setCfg(c => c ? { ...c, enabled: !c.enabled } : c)}>
                {cfg.enabled
                  ? <ToggleRight size={28} className="text-green-500" />
                  : <ToggleLeft size={28} className="text-gray-300" />}
              </button>
            </div>

            {/* Post-purchase */}
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <p className="text-sm font-semibold text-gray-900">Offre post-achat</p>
                <p className="text-xs text-gray-400">Afficher une offre complémentaire après chaque achat</p>
              </div>
              <button onClick={() => setCfg(c => c ? { ...c, postPurchaseEnabled: !c.postPurchaseEnabled } : c)}>
                {cfg.postPurchaseEnabled
                  ? <ToggleRight size={28} className="text-green-500" />
                  : <ToggleLeft size={28} className="text-gray-300" />}
              </button>
            </div>

            {/* Post-purchase discount */}
            {cfg.postPurchaseEnabled && (
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Remise post-achat</p>
                  <p className="text-xs text-gray-400">Pourcentage de réduction affiché sur l&apos;offre complémentaire</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number" min={5} max={50} step={5}
                    value={cfg.postPurchaseDiscount}
                    onChange={e => setCfg(c => c ? { ...c, postPurchaseDiscount: parseInt(e.target.value) || 20 } : c)}
                    className="w-20 px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-900 text-center font-bold focus:outline-none focus:border-green-400"
                  />
                  <span className="text-gray-500 text-sm font-semibold">%</span>
                </div>
              </div>
            )}

            {/* Default mode */}
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">Mode par défaut</p>
                <p className="text-xs text-gray-400">Algorithme appliqué si aucune configuration spécifique</p>
              </div>
              <div className="flex gap-2">
                {(["auto", "manual"] as const).map(m => (
                  <button key={m} onClick={() => setCfg(c => c ? { ...c, defaultMode: m } : c)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${cfg.defaultMode === m ? "bg-[#E8B800] border-[#E8B800] text-black" : "border-gray-200 text-gray-600 hover:border-[#E8B800]"}`}>
                    {m === "auto" ? "🤖 Auto" : "✏️ Manuel"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Configurations par produit */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-gray-900 font-bold text-base">
              Configurations par produit
              {configuredIds.length > 0 && <span className="ml-2 text-xs font-normal text-gray-400">({configuredIds.length})</span>}
            </h2>
            <button
              onClick={() => setShowAddProduct(true)}
              className="flex items-center gap-1.5 text-sm font-bold text-[#E8B800] hover:text-[#d4a700] transition-colors"
            >
              <Plus size={15} /> Configurer un produit
            </button>
          </div>

          {configuredIds.length > 3 && (
            <div className="relative mb-4">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={filterQ} onChange={e => setFilterQ(e.target.value)}
                placeholder="Filtrer les produits configurés…"
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-green-400 bg-white"
              />
            </div>
          )}

          {filteredConfigured.length === 0 && (
            <div className="bg-white border border-dashed border-gray-200 rounded-2xl p-8 text-center">
              <p className="text-gray-400 text-sm">
                {configuredIds.length === 0
                  ? "Aucun produit configuré. Le mode automatique s'applique à tous."
                  : "Aucun résultat pour ce filtre."}
              </p>
            </div>
          )}

          <div className="space-y-3">
            {filteredConfigured.map(id => {
              const p = allProducts.find(x => x.id === id) ?? {
                id, type: "ebook" as const, title: id, category: undefined, cover: undefined, slug: undefined,
              };
              return (
                <ProductRow
                  key={id}
                  product={p}
                  cfg={cfg.products[id] || {}}
                  allProducts={allProducts}
                  onChange={c => updateProductCfg(id, c)}
                  onRemove={() => removeProductCfg(id)}
                />
              );
            })}
          </div>
        </section>

        <p className="text-center text-gray-400 text-xs pb-4">
          Les produits sans configuration utilisent le mode « {cfg.defaultMode} » par défaut.
        </p>
      </div>

      {showAddProduct && (
        <ProductPicker
          onSelect={p => { addProduct(p); setShowAddProduct(false); }}
          onClose={() => setShowAddProduct(false)}
          products={addableProducts}
          excluded={[]}
        />
      )}
    </div>
  );
}
