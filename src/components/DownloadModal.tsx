"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X, Lock, Phone, Mail, ChevronRight, Loader2,
  CheckCircle, AlertCircle,
} from "lucide-react";
import { PaymentBadges } from "@/components/PaymentBadges";
import { PriceTag } from "@/components/PriceTag";
import { useUserStore } from "@/lib/user-store";
import { pixelInitiateCheckout } from "@/lib/pixel-events";

export interface QuickCheckoutItem {
  type: "ebook" | "formation";
  id: string;
  title: string;
  price: number;
}

interface Props {
  /** Rétrocompatibilité — utilisé par EbookCard et EbookLandingPageClient */
  ebook?: { id: string; title: string; price: number };
  /** Interface générique ebook/formation */
  item?: QuickCheckoutItem;
  onClose: () => void;
}

const inputCls =
  "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-[#E8B800] focus:bg-white transition-all";
const labelCls =
  "block text-gray-600 text-xs font-semibold mb-1.5";

export default function DownloadModal({ ebook, item: itemProp, onClose }: Props) {
  const item: QuickCheckoutItem = itemProp ?? (ebook
    ? { type: "ebook", id: ebook.id, title: ebook.title, price: ebook.price }
    : { type: "ebook", id: "", title: "", price: 0 });

  const {
    isLoggedIn, currentUser, loginFromServer,
    setPendingEbookIds, setPendingFormationIds,
  } = useUserStore();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = "hidden";
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", fn);
    };
  }, [onClose]);

  // Pré-remplissage si connecté
  useEffect(() => {
    if (isLoggedIn && currentUser) {
      setForm({
        firstName: currentUser.firstName ?? "",
        lastName: currentUser.lastName ?? "",
        email: currentUser.email ?? "",
        phone: currentUser.phone ?? "",
      });
    }
  }, [isLoggedIn, currentUser]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // ── 1. Obtenir un compte utilisateur ──
      let userId: string;
      let customer: { firstName: string; lastName: string; email: string; phone: string };

      if (isLoggedIn && currentUser) {
        userId = currentUser.id;
        customer = {
          firstName: currentUser.firstName,
          lastName: currentUser.lastName,
          email: currentUser.email,
          phone: form.phone.trim() || currentUser.phone || "",
        };
      } else {
        const regRes = await fetch("/api/auth/quick-register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName: form.firstName.trim(),
            lastName: form.lastName.trim(),
            email: form.email.trim().toLowerCase(),
            phone: form.phone.trim(),
          }),
        });
        const regData = await regRes.json() as {
          success?: boolean;
          error?: string;
          user?: { id: string; firstName: string; lastName: string; email: string; phone: string; hasPassword?: boolean };
        };
        if (!regRes.ok || !regData.user) {
          setError(regData.error ?? "Erreur lors de l'enregistrement.");
          setLoading(false);
          return;
        }
        userId = regData.user.id;
        customer = {
          firstName: regData.user.firstName,
          lastName: regData.user.lastName,
          email: regData.user.email,
          phone: regData.user.phone,
        };
        loginFromServer({ ...regData.user, hasPassword: regData.user.hasPassword ?? false });
      }

      // ── 2. Préparer les IDs de commande ──
      const ebookIds = item.type === "ebook" ? [item.id] : [];
      const formationIds = item.type === "formation" ? [item.id] : [];

      // ── 3. Suivi pixel + localStorage ──
      pixelInitiateCheckout(item.price, "XAF", [item.id], 1);
      localStorage.setItem("sl_pending_amount", String(item.price));
      localStorage.setItem("sl_pending_ids", JSON.stringify([item.id]));
      if (item.type === "ebook") setPendingEbookIds(ebookIds);
      else setPendingFormationIds(formationIds);

      // ── 4. Référence unique ──
      const reference = `SL-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

      // ── 5. Config passerelle ──
      const gatewayCfg = await fetch("/api/gateway-config")
        .then((r) => r.json())
        .catch(() => ({ cinetpay: true, sebpay: false })) as { cinetpay: boolean; sebpay: boolean };

      if (gatewayCfg.cinetpay !== false) {
        // CinetPay → page de paiement sécurisée (Orange Money, MTN, Carte, Crypto…)
        const payRes = await fetch("/api/payment/cinetpay", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: item.price,
            customer,
            reference,
            userId,
            ebookIds,
            formationIds,
          }),
        });
        const payData = await payRes.json() as { url?: string; error?: string };

        if (!payRes.ok || !payData.url) {
          // Fallback : CinetPay non configuré → accès direct
          if (ebookIds.length) setPendingEbookIds(ebookIds);
          if (formationIds.length) setPendingFormationIds(formationIds);
          window.location.href = `/checkout/success?gateway=cinetpay&ref=${reference}`;
          return;
        }
        window.location.href = payData.url;
      } else {
        // Sebpay ou aucun : repli sur la page checkout complète
        window.location.href = `/checkout?${item.type === "ebook" ? "eid" : "fid"}=${item.id}&titre=${encodeURIComponent(item.title)}&prix=${item.price}`;
      }
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : "Erreur de connexion. Réessayez.");
    }
  }

  if (!mounted) return null;

  const modal = (
    <div
      className="fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ zIndex: 9990 }}
      onClick={onClose}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Card */}
      <div
        className="relative w-full sm:max-w-md bg-white sm:rounded-2xl rounded-t-3xl shadow-2xl overflow-hidden"
        style={{ maxHeight: "96vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── En-tête ── */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Lock size={15} className="text-[#E8B800]" />
            <h2 className="text-gray-900 font-bold text-base">Finaliser votre achat</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Résumé produit ── */}
        <div className="px-6 py-4 bg-[#fffbeb] border-b border-[#E8B800]/20 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#E8B800]/20 flex items-center justify-center flex-shrink-0 text-lg">
              {item.type === "ebook" ? "📖" : "🎬"}
            </div>
            <div className="min-w-0">
              <p className="text-gray-900 font-semibold text-sm leading-snug line-clamp-2">{item.title}</p>
              <p className="text-gray-500 text-xs mt-0.5">
                {item.type === "ebook" ? "Ebook · Livraison par email" : "Formation · Accès immédiat"}
              </p>
            </div>
          </div>
          <p className="text-gray-900 font-bold text-xl flex-shrink-0">
            <PriceTag amount={item.price} />
          </p>
        </div>

        {/* ── Formulaire ── */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">

          {/* Bandeau utilisateur connecté */}
          {isLoggedIn && currentUser && (
            <div className="flex items-center gap-2.5 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
              <CheckCircle size={16} className="text-emerald-600 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-emerald-800 font-semibold text-sm">
                  {currentUser.firstName} {currentUser.lastName}
                </p>
                <p className="text-emerald-600 text-xs truncate">{currentUser.email}</p>
              </div>
            </div>
          )}

          {/* Champs identité — non-connectés uniquement */}
          {!isLoggedIn && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Prénom <span className="text-red-500">*</span></label>
                  <input
                    required
                    type="text"
                    autoComplete="given-name"
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    className={inputCls}
                    placeholder="Jean"
                  />
                </div>
                <div>
                  <label className={labelCls}>Nom <span className="text-red-500">*</span></label>
                  <input
                    required
                    type="text"
                    autoComplete="family-name"
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    className={inputCls}
                    placeholder="Dupont"
                  />
                </div>
              </div>

              <div>
                <label className={labelCls}>
                  <span className="flex items-center gap-1">
                    <Mail size={10} /> Adresse email <span className="text-red-500">*</span>
                  </span>
                </label>
                <input
                  required
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={inputCls}
                  placeholder="jean@exemple.com"
                />
                <p className="text-gray-400 text-[11px] mt-1">
                  {item.type === "ebook" ? "L'ebook sera envoyé à cette adresse après paiement" : "Votre accès sera envoyé ici"}
                </p>
              </div>
            </>
          )}

          {/* Téléphone — toujours visible */}
          <div>
            <label className={labelCls}>
              <span className="flex items-center gap-1">
                <Phone size={10} /> Numéro WhatsApp <span className="text-red-500">*</span>
              </span>
            </label>
            <input
              required
              type="tel"
              autoComplete="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className={inputCls}
              placeholder="+237 6XX XXX XXX"
            />
            <p className="text-gray-400 text-[11px] mt-1">Utilisé pour le paiement Mobile Money</p>
          </div>

          {/* Erreur */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
              <AlertCircle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-600 text-xs leading-relaxed">{error}</p>
            </div>
          )}

          {/* Bouton principal */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-[#E8B800] to-[#27A827] hover:brightness-105 text-black font-bold rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-[15px] shadow-lg shadow-[#E8B800]/25 mt-1"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Redirection en cours…
              </>
            ) : (
              <>
                <Lock size={15} />
                Payer maintenant —&nbsp;<PriceTag amount={item.price} />
                <ChevronRight size={16} />
              </>
            )}
          </button>

          {/* Options de paiement */}
          <PaymentBadges className="pt-1" />

          <p className="text-center text-gray-400 text-[11px] flex items-center justify-center gap-1 pb-1">
            <Mail size={10} />
            {item.type === "ebook"
              ? "Ebook livré immédiatement après confirmation du paiement"
              : "Accès à la formation activé immédiatement"}
          </p>
        </form>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
