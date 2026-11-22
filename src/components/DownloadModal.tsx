"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X, Lock, Phone, Mail, ChevronRight, Loader2,
  CheckCircle, AlertCircle, Zap, ShieldCheck, Infinity as Illimite, Users,
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
  ebook?: { id: string; title: string; price: number; cover?: string; originalPrice?: number; ventes?: number };
  /** Interface générique ebook/formation */
  item?: QuickCheckoutItem;
  onClose: () => void;
}

const inputCls =
  "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-[15px] placeholder-gray-400 focus:outline-none focus:border-[#008f51] focus:ring-2 focus:ring-[#008f51]/15 focus:bg-white transition-all";
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
    fetch("/api/social-proof/commande", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prenom: currentUser?.firstName || form.firstName, produit: item.title }),
    }).catch(() => {});

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
        {/* ── En-tête : où en est l'acheteur ── */}
        <div className="px-5 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-gray-900 font-bold text-[17px]">Plus qu&apos;une étape 🎉</h2>
            <button type="button" onClick={onClose} aria-label="Fermer"
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-all">
              <X size={16} />
            </button>
          </div>
          <div className="mt-3 flex items-center gap-2 text-[11px] font-semibold">
            <span className="flex items-center gap-1 text-[#008f51]"><span className="w-5 h-5 rounded-full bg-[#008f51] text-[#fff] flex items-center justify-center">1</span>Vos infos</span>
            <span className="flex-1 h-px bg-gray-200" />
            <span className="flex items-center gap-1 text-gray-400"><span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center">2</span>Paiement</span>
            <span className="flex-1 h-px bg-gray-200" />
            <span className="flex items-center gap-1 text-gray-400"><span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center">3</span>{item.type === "ebook" ? "Guide reçu" : "Accès"}</span>
          </div>
        </div>

        {/* ── Résumé produit ── */}
        <div className="px-5 py-4 bg-[#f3fbf6] border-b border-[#008f51]/10 flex items-center gap-3">
          {ebook?.cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={ebook.cover} alt="" className="w-14 h-14 rounded-lg object-cover flex-shrink-0 border border-white shadow-sm" />
          ) : (
            <div className="w-14 h-14 rounded-lg bg-[#008f51]/10 flex items-center justify-center flex-shrink-0 text-2xl">{item.type === "ebook" ? "📖" : "🎬"}</div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-gray-900 font-semibold text-[14px] leading-snug line-clamp-2">{item.title}</p>
            <p className="mt-1 flex items-center gap-1 text-[12px] font-semibold text-[#008f51]">
              <Zap size={12} className="fill-[#008f51]" /> {item.type === "ebook" ? "Livraison instantanée · PDF" : "Accès immédiat"}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            {ebook?.originalPrice && ebook.originalPrice > item.price && (
              <p className="text-[12px] text-gray-400 line-through"><PriceTag amount={ebook.originalPrice} /></p>
            )}
            <p className="text-[#e30026] font-bold text-lg leading-tight"><PriceTag amount={item.price} /></p>
          </div>
        </div>
        {ebook?.originalPrice && ebook.originalPrice > item.price && (
          <p className="px-5 py-2 text-[12px] text-center font-semibold text-[#b45309] bg-[#fffbeb] border-b border-[#fde68a]">
            🎁 Vous économisez <PriceTag amount={ebook.originalPrice - item.price} /> aujourd&apos;hui
          </p>
        )}

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
                  {item.type === "ebook" ? "Votre guide arrive ici en quelques secondes après le paiement" : "Votre accès sera envoyé ici"}
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
            <p className="text-gray-400 text-[11px] mt-1">Pour payer par Mobile Money et recevoir le guide sur WhatsApp</p>
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
            className="w-full py-4 bg-[#008f51] hover:bg-[#007a45] font-bold rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-[15px] shadow-lg shadow-[#008f51]/25 mt-1 cta-respire"
            style={{ color: "#ffffff" }}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Redirection en cours…
              </>
            ) : (
              <>
                <Lock size={15} />
                {item.type === "ebook" ? "Recevoir mon guide" : "Accéder maintenant"} —&nbsp;<PriceTag amount={item.price} />
                <ChevronRight size={16} />
              </>
            )}
          </button>

          {/* Options de paiement */}
          <PaymentBadges className="pt-1" />

          <div className="flex flex-wrap justify-center gap-2 pt-1">
            {[
              { icone: <Zap size={15} className="text-[#008f51]" />, texte: "Livraison instantanée" },
              { icone: <ShieldCheck size={15} className="text-[#008f51]" />, texte: "Paiement sécurisé" },
              { icone: <Illimite size={15} className="text-[#008f51]" />, texte: "Accès à vie" },
              { icone: <Users size={15} className="text-[#008f51]" />, texte: "Groupe WhatsApp privé" },
              { icone: <CheckCircle size={15} className="text-[#008f51]" />, texte: "Accompagnement possible" },
            ].map((g) => (
              <div key={g.texte} className="flex flex-col items-center gap-1 rounded-xl bg-gray-50 py-2.5 px-1 text-center">
                {g.icone}
                <span className="text-[11px] font-semibold text-gray-700 leading-tight">{g.texte}</span>
              </div>
            ))}
          </div>
          {(ebook?.ventes ?? 0) > 0 && (
            <p className="text-center text-[12px] text-gray-500 pb-1">
              🔥 <strong className="text-gray-800">{ebook!.ventes!.toLocaleString("fr-FR")}</strong> personnes ont déjà acheté ce guide
            </p>
          )}
          <a
            href={`https://wa.me/237694176642?text=${encodeURIComponent(`Bonjour Smart Life, j'ai payé le guide « ${item.title} » et je souhaite le recevoir.`)}`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-start gap-2.5 rounded-xl border border-[#25D366]/40 bg-[#25D366]/5 p-3 text-[12px] leading-snug text-[#20252b]"
          >
            <span className="text-[18px] leading-none">💬</span>
            <span>
              Une difficulté après votre paiement ? Écrivez-nous sur WhatsApp au{" "}
              <strong className="text-[#128C4A] whitespace-nowrap">+237 694 176 642</strong> et nous vous envoyons votre guide tout de suite.
            </span>
          </a>
        </form>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
