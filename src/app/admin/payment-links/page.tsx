"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Plus, Trash2, Copy, Check, ToggleLeft, ToggleRight,
  Link2, ExternalLink, ArrowLeft, Loader2, AlertCircle, MousePointerClick,
  CreditCard, Smartphone, Settings,
} from "lucide-react";
import type { PaymentLink } from "@/app/api/admin/payment-links/route";

const ADMIN_PW = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? "";
const SITE = process.env.NEXT_PUBLIC_APP_URL || "https://smartlifecm.com";

function formatPrice(n: number) {
  return new Intl.NumberFormat("fr-FR").format(n) + " FCFA";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function PaymentLinksPage() {
  // ── Config gateway ────────────────────────────────────────────────────────
  const [gatewayCfg, setGatewayCfg] = useState<{ cinetpay: boolean; sebpay: boolean } | null>(null);
  const [gatewayError, setGatewayError] = useState("");
  const [gatewaySaving, setGatewaySaving] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/gateway-config?password=${ADMIN_PW}`)
      .then((r) => r.json()).then(setGatewayCfg).catch(() => {});
  }, []);

  const toggleGateway = async (key: "cinetpay" | "sebpay") => {
    if (!gatewayCfg) return;
    setGatewayError("");
    setGatewaySaving(true);
    const next = { ...gatewayCfg, [key]: !gatewayCfg[key] };
    const res = await fetch(`/api/admin/gateway-config?password=${ADMIN_PW}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
    const data = await res.json();
    if (res.ok) setGatewayCfg(data);
    else setGatewayError(data.error || "Erreur lors de la mise à jour.");
    setGatewaySaving(false);
  };

  // ── Liens de paiement ─────────────────────────────────────────────────────
  const [links, setLinks] = useState<PaymentLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Création
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  // Copie
  const [copied, setCopied] = useState<string | null>(null);

  const fetchLinks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/payment-links?password=${ADMIN_PW}`);
      const data = await res.json();
      setLinks(data.links || []);
    } catch {
      setError("Impossible de charger les liens.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLinks(); }, [fetchLinks]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(price);
    if (!name.trim() || isNaN(priceNum) || priceNum <= 0) {
      setCreateError("Nom et prix valide requis.");
      return;
    }
    setCreateError("");
    setCreating(true);
    try {
      const res = await fetch(`/api/admin/payment-links?password=${ADMIN_PW}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), price: priceNum, description: description.trim() || undefined }),
      });
      const data = await res.json();
      if (data.link) {
        setLinks((prev) => [data.link, ...prev]);
        setName(""); setPrice(""); setDescription("");
      } else {
        setCreateError(data.error || "Erreur lors de la création.");
      }
    } catch {
      setCreateError("Erreur réseau.");
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (link: PaymentLink) => {
    const res = await fetch(`/api/admin/payment-links?password=${ADMIN_PW}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: link.id, active: !link.active }),
    });
    const data = await res.json();
    if (data.link) setLinks((prev) => prev.map((l) => (l.id === link.id ? data.link : l)));
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce lien de paiement ? Cette action est irréversible.")) return;
    await fetch(`/api/admin/payment-links?password=${ADMIN_PW}&id=${id}`, { method: "DELETE" });
    setLinks((prev) => prev.filter((l) => l.id !== id));
  };

  const copyLink = (id: string) => {
    const url = `${SITE}/pay/${id}`;
    navigator.clipboard.writeText(url);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#f9f8f5] p-4 md:p-8">
      <div className="max-w-3xl mx-auto">

        {/* En-tête */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin" className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
            <ArrowLeft size={18} className="text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
              <Link2 size={22} className="text-[#E8B800]" /> Liens de paiement direct
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">Créez et partagez des liens de paiement express via WhatsApp ou email.</p>
          </div>
        </div>

        {/* ── Configuration des moyens de paiement ── */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 mb-6">
          <h2 className="font-black text-gray-900 text-base mb-1 flex items-center gap-2">
            <Settings size={16} className="text-[#E8B800]" /> Moyens de paiement actifs
          </h2>
          <p className="text-gray-400 text-xs mb-5">Activez ou désactivez les passerelles sur tout le site (checkout + liens de paiement). Au moins une doit rester active.</p>

          {!gatewayCfg && (
            <div className="flex items-center gap-2 text-gray-400 text-sm"><Loader2 size={15} className="animate-spin" /> Chargement…</div>
          )}

          {gatewayCfg && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* CinetPay */}
              <div className={`rounded-2xl border-2 p-5 transition-all ${gatewayCfg.cinetpay ? "border-[#E8B800] bg-[#E8B800]/5" : "border-gray-200 bg-gray-50 opacity-70"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${gatewayCfg.cinetpay ? "bg-[#E8B800]/15" : "bg-gray-100"}`}>
                      <CreditCard size={20} className={gatewayCfg.cinetpay ? "text-[#E8B800]" : "text-gray-400"} />
                    </div>
                    <div>
                      <p className="font-black text-gray-900 text-sm">CinetPay</p>
                      <p className="text-gray-500 text-xs">Carte bancaire &amp; Mobile — 14 pays</p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleGateway("cinetpay")}
                    disabled={gatewaySaving}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-50 ${gatewayCfg.cinetpay ? "bg-[#E8B800]" : "bg-gray-300"}`}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${gatewayCfg.cinetpay ? "translate-x-5" : "translate-x-0"}`} />
                  </button>
                </div>
                <div className="mt-3">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${gatewayCfg.cinetpay ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {gatewayCfg.cinetpay ? "✓ Actif" : "✗ Désactivé"}
                  </span>
                </div>
              </div>

              {/* Sebpay */}
              <div className={`rounded-2xl border-2 p-5 transition-all ${gatewayCfg.sebpay ? "border-emerald-400 bg-emerald-50/50" : "border-gray-200 bg-gray-50 opacity-70"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${gatewayCfg.sebpay ? "bg-emerald-100" : "bg-gray-100"}`}>
                      <Smartphone size={20} className={gatewayCfg.sebpay ? "text-emerald-600" : "text-gray-400"} />
                    </div>
                    <div>
                      <p className="font-black text-gray-900 text-sm">Sebpay</p>
                      <p className="text-gray-500 text-xs">Mobile Money direct — 20 pays</p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleGateway("sebpay")}
                    disabled={gatewaySaving}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-50 ${gatewayCfg.sebpay ? "bg-emerald-500" : "bg-gray-300"}`}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${gatewayCfg.sebpay ? "translate-x-5" : "translate-x-0"}`} />
                  </button>
                </div>
                <div className="mt-3">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${gatewayCfg.sebpay ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {gatewayCfg.sebpay ? "✓ Actif" : "✗ Désactivé"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {gatewayError && (
            <p className="mt-3 flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              <AlertCircle size={14} /> {gatewayError}
            </p>
          )}

          {gatewayCfg && (
            <p className="mt-4 text-gray-400 text-xs">
              {gatewayCfg.cinetpay && gatewayCfg.sebpay && "Les deux moyens de paiement sont proposés au client."}
              {gatewayCfg.cinetpay && !gatewayCfg.sebpay && "Seule CinetPay (carte / mobile) est proposée — Sebpay masqué partout."}
              {!gatewayCfg.cinetpay && gatewayCfg.sebpay && "Seul Sebpay (Mobile Money) est proposé — CinetPay masqué partout."}
            </p>
          )}
        </div>

        {/* Formulaire de création */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 mb-6">
          <h2 className="font-black text-gray-900 text-base mb-4 flex items-center gap-2">
            <Plus size={16} className="text-[#27A827]" /> Créer un nouveau lien
          </h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">Nom du produit / service *</label>
                <input
                  type="text" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Consultation stratégique"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:border-[#E8B800] transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">Prix (FCFA) *</label>
                <input
                  type="number" min="1" value={price} onChange={(e) => setPrice(e.target.value)}
                  placeholder="Ex: 25000"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:border-[#E8B800] transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">Description courte (optionnel)</label>
              <input
                type="text" value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Session d'1h avec un expert"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:border-[#E8B800] transition-colors"
              />
            </div>
            {createError && (
              <p className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                <AlertCircle size={14} /> {createError}
              </p>
            )}
            <button
              type="submit" disabled={creating}
              className="px-6 py-3 bg-gradient-to-r from-[#E8B800] to-[#27A827] text-black font-black text-sm rounded-xl transition-all hover:shadow-md disabled:opacity-60 flex items-center gap-2"
            >
              {creating ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
              Créer le lien
            </button>
          </form>
        </div>

        {/* Liste */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-black text-gray-900 text-base">Liens existants ({links.length})</h2>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-[#E8B800]" />
            </div>
          )}

          {!loading && error && (
            <div className="p-6 text-center text-red-500 text-sm">{error}</div>
          )}

          {!loading && !error && links.length === 0 && (
            <div className="p-10 text-center">
              <Link2 size={32} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">Aucun lien créé pour l&apos;instant.</p>
            </div>
          )}

          {!loading && links.map((link, i) => {
            const url = `${SITE}/pay/${link.id}`;
            return (
              <div key={link.id} className={`px-6 py-5 ${i < links.length - 1 ? "border-b border-gray-100" : ""}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${link.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {link.active ? "Actif" : "Inactif"}
                      </span>
                      {link.clicks > 0 && (
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <MousePointerClick size={11} /> {link.clicks} clic{link.clicks > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    <p className="font-black text-gray-900 text-sm truncate">{link.name}</p>
                    {link.description && <p className="text-gray-500 text-xs mt-0.5 truncate">{link.description}</p>}
                    <p className="text-[#27A827] font-black text-base mt-1">{formatPrice(link.price)}</p>
                    <p className="text-gray-400 text-xs mt-1 font-mono truncate">{url}</p>
                    <p className="text-gray-400 text-xs mt-0.5">Créé le {formatDate(link.createdAt)}</p>
                  </div>

                  <div className="flex flex-col gap-2 shrink-0">
                    {/* Copier */}
                    <button
                      onClick={() => copyLink(link.id)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors border ${
                        copied === link.id
                          ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                          : "bg-gray-50 border-gray-200 text-gray-700 hover:border-[#E8B800] hover:text-[#E8B800]"
                      }`}
                    >
                      {copied === link.id ? <><Check size={12} /> Copié !</> : <><Copy size={12} /> Copier</>}
                    </button>

                    {/* Ouvrir */}
                    <a
                      href={`/pay/${link.id}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 transition-colors"
                    >
                      <ExternalLink size={12} /> Prévisualiser
                    </a>

                    {/* Toggle actif/inactif */}
                    <button
                      onClick={() => handleToggle(link)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      {link.active ? <ToggleRight size={12} className="text-green-500" /> : <ToggleLeft size={12} />}
                      {link.active ? "Désactiver" : "Activer"}
                    </button>

                    {/* Supprimer */}
                    <button
                      onClick={() => handleDelete(link.id)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition-colors"
                    >
                      <Trash2 size={12} /> Supprimer
                    </button>
                  </div>
                </div>

                {/* Boutons de partage rapide */}
                {link.active && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <a
                      href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Bonjour ! Voici votre lien de paiement pour "${link.name}" (${new Intl.NumberFormat("fr-FR").format(link.price)} FCFA) : ${url}`)}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366] hover:bg-[#20b858] text-white text-xs font-bold rounded-xl transition-colors"
                    >
                      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                      Envoyer via WhatsApp
                    </a>
                    <a
                      href={`mailto:?subject=${encodeURIComponent(`Lien de paiement : ${link.name}`)}&body=${encodeURIComponent(`Bonjour,\n\nVoici votre lien de paiement pour "${link.name}" (${new Intl.NumberFormat("fr-FR").format(link.price)} FCFA) :\n\n${url}\n\nCordialement,\nSmart Life`)}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors"
                    >
                      📧 Envoyer par email
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}