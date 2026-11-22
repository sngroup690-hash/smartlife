"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { pixelPurchase } from "@/lib/pixel-events";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, Send } from "lucide-react";
import { useUserStore } from "@/lib/user-store";
import { useCartStore } from "@/lib/store";
import { ebooks as TOUS_LES_EBOOKS } from "@/lib/data";
import { FORMATIONS } from "@/lib/formations-data";
import type { DEFAULT_CONFIG } from "@/app/api/admin/workflow-config/route";
import PostPurchaseCrossSell from "@/components/PostPurchaseCrossSell";

type WorkflowConfig = typeof DEFAULT_CONFIG;

// ─── Formulaire motivation ────────────────────────────────────────────────────

const OBJECTIFS = [
  "Lancer mon propre business",
  "Développer mon projet existant",
  "Améliorer mes compétences",
  "Trouver de nouvelles sources de revenus",
  "Me reconvertir professionnellement",
  "Curiosité / culture générale",
  "Autre",
];

const SITUATIONS = [
  "Entrepreneur / Chef d'entreprise",
  "Employé(e) en recherche d'évolution",
  "Étudiant(e)",
  "Sans emploi / en reconversion",
  "Fonctionnaire",
  "Retraité(e)",
  "Autre",
];

const INTERET_ACCOMPAGNEMENT = [
  "Oui, je suis très intéressé(e)",
  "Peut-être, j'aimerais en savoir plus",
  "Non, pas pour le moment",
];

function MotivationForm({ onSubmit, cfg, currentUser, ebookIds, formationIds }: {
  onSubmit: () => void;
  cfg: WorkflowConfig;
  currentUser: { id: string; firstName: string; lastName: string; email: string; phone?: string } | null;
  ebookIds: string[];
  formationIds: string[];
}) {
  const { ajouterMotivation } = useUserStore();
  const [form, setForm] = useState({
    objectif: "",
    situation: "",
    texte: "",
    interetAccompagnement: "",
  });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    ajouterMotivation({ ...form, ebookIds });

    // Persistance serveur (fire & forget)
    const productNames = ebookIds.map((id) => {
      const eb = TOUS_LES_EBOOKS.find((e) => e.id === id);
      return eb?.title ?? id;
    });
    fetch("/api/motivations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: currentUser?.id ?? "",
        userName: currentUser ? `${currentUser.firstName} ${currentUser.lastName}`.trim() : "Anonyme",
        userEmail: currentUser?.email ?? "",
        userPhone: currentUser?.phone ?? "",
        ebookIds,
        formationIds,
        productNames,
        ...form,
      }),
    }).catch(() => {});

    await new Promise((r) => setTimeout(r, 400));
    setLoading(false);
    onSubmit();
  }

  const selectCls =
    "w-full px-4 py-3 bg-gray-50 border border-green-500 rounded-xl text-gray-900 focus:outline-none focus:border-green-600 focus:bg-white transition-colors text-sm";
  const inputCls =
    "w-full px-4 py-3 bg-gray-50 border border-green-500 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-green-600 focus:bg-white transition-colors text-sm resize-none";

  return (
    <div className="max-w-xl mx-auto px-4 py-16">
      <div className="text-center mb-10">
        <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-4">
          <CheckCircle size={32} className="text-emerald-600" />
        </div>
        <h1 className="text-gray-900 text-2xl font-bold mb-2">{cfg.congratsTitle}</h1>
        <p className="text-gray-600 text-sm">{cfg.congratsSubtitle}</p>
      </div>

      <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-5">

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              {cfg.motivationObjectifLabel} <span className="text-[#E8B800]">*</span>
            </label>
            <select required value={form.objectif} onChange={(e) => setForm({ ...form, objectif: e.target.value })}
              className={selectCls}>
              <option value="" className="bg-[#0e0e1a]">Choisir un objectif…</option>
              {OBJECTIFS.map((o) => (
                <option key={o} value={o} className="bg-[#0e0e1a]">{o}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              {cfg.motivationSituationLabel} <span className="text-[#E8B800]">*</span>
            </label>
            <select required value={form.situation} onChange={(e) => setForm({ ...form, situation: e.target.value })}
              className={selectCls}>
              <option value="" className="bg-[#0e0e1a]">Choisir une situation…</option>
              {SITUATIONS.map((s) => (
                <option key={s} value={s} className="bg-[#0e0e1a]">{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              {cfg.motivationTexteLabel} <span className="text-[#E8B800]">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={form.texte}
              onChange={(e) => setForm({ ...form, texte: e.target.value })}
              className={inputCls}
              placeholder={cfg.motivationTexteplaceholder}
            />
          </div>

          {cfg.accompagnementEnabled && (
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                {cfg.motivationAccompagnementLabel}
              </label>
              <div className="space-y-2">
                {INTERET_ACCOMPAGNEMENT.map((option) => (
                  <label key={option}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      form.interetAccompagnement === option
                        ? "border-[#E8B800]/60 bg-[#E8B800]/10"
                        : "border-gray-200 hover:border-gray-300"
                    }`}>
                    <input
                      type="radio"
                      name="interet"
                      value={option}
                      checked={form.interetAccompagnement === option}
                      onChange={() => setForm({ ...form, interetAccompagnement: option })}
                      className="accent-[#E8B800]"
                    />
                    <span className="text-gray-700 text-sm">{option}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-[#E8B800] to-[#27A827] hover:from-[#27A827] hover:to-[#E8B800] text-black font-bold rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-60"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            ) : (
              <><Send size={16} /> {cfg.motivationSubmitLabel}</>
            )}
          </button>

          <button type="button" onClick={onSubmit}
            className="w-full text-center text-gray-600 text-xs hover:text-gray-400 transition-colors py-2">
            {cfg.motivationSkipLabel}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Contenu principal ────────────────────────────────────────────────────────

const DEFAULT_CFG: WorkflowConfig = {
  motivationEnabled: true,
  avisEnabled: false,
  accompagnementEnabled: true,
  congratsTitle: "Paiement confirmé ! 🎉",
  congratsSubtitle: "Avant d'accéder à votre contenu, prenez 1 minute pour nous partager vos motivations. Cela nous aide à mieux vous accompagner.",
  motivationObjectifLabel: "Quel est votre objectif principal ?",
  motivationSituationLabel: "Quelle est votre situation actuelle ?",
  motivationTexteLabel: "Qu'est-ce qui vous a motivé à effectuer cet achat ?",
  motivationTexteplaceholder: "Décrivez brièvement votre projet, vos attentes, ou ce qui vous a poussé à passer à l'action…",
  motivationAccompagnementLabel: "Seriez-vous intéressé(e) par un programme d'accompagnement personnalisé ?",
  motivationSubmitLabel: "Envoyer mes motivations",
  motivationSkipLabel: "Passer cette étape →",
  successTitle: "C'est tout bon ! 🎉",
  successSubtitle: "Votre achat est confirmé. Téléchargez vos produits ci-dessous ou retrouvez-les à tout moment dans Mon Espace.",
  downloadLabel: "Télécharger",
  watchLabel: "Visionner",
  monEspaceLabel: "Accéder à Mon Espace →",
};

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref") ?? "";

  const {
    pendingEbookIds, ajouterEbooksAchetes, clearPendingEbookIds,
    pendingFormationIds, ajouterFormationsAchetees, clearPendingFormationIds,
    currentUser, setDownloadToken,
  } = useUserStore();
  const { clearCart } = useCartStore();
  const processed = useRef(false);
  const [step, setStep] = useState<"motivation" | "crosssell">("motivation");
  const [purchasedEbookIds, setPurchasedEbookIds] = useState<string[]>([]);
  const [purchasedFormationIds, setPurchasedFormationIds] = useState<string[]>([]);
  const [purchaseAmount, setPurchaseAmount] = useState<number>(0);
  const [purchaseCurrency, setPurchaseCurrency] = useState<string>("XAF");
  const [wfConfig, setWfConfig] = useState<WorkflowConfig>(DEFAULT_CFG);

  useEffect(() => {
    fetch("/api/workflow-config")
      .then((r) => r.json())
      .then((d) => setWfConfig((prev) => ({ ...prev, ...d })))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    // Pixel Purchase — localStorage survit au retour depuis la passerelle externe
    try {
      const amount = parseFloat(localStorage.getItem("sl_pending_amount") || "0");
      const savedCurrency = localStorage.getItem("sl_pending_currency") || "XAF";
      const ids: string[] = JSON.parse(localStorage.getItem("sl_pending_ids") || "[]");
      // eventId identique au webhook CAPI → Facebook déduplique automatiquement
      if (amount > 0) pixelPurchase(amount, "XAF", ids, ref ? `purchase_${ref}` : undefined);
      if (amount > 0) setPurchaseAmount(amount);
      if (savedCurrency) setPurchaseCurrency(savedCurrency);
      localStorage.removeItem("sl_pending_amount");
      localStorage.removeItem("sl_pending_currency");
      localStorage.removeItem("sl_pending_ids");
    } catch { /* silencieux */ }

    // Confirmer l'achat côté serveur
    if (ref && currentUser?.id) {
      fetch("/api/user/confirm-purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference: ref, userId: currentUser.id }),
      }).catch(() => {});
    }

    // Formations achetées
    if (pendingFormationIds.length > 0) {
      setPurchasedFormationIds([...pendingFormationIds]);
      ajouterFormationsAchetees(pendingFormationIds);
      clearPendingFormationIds();
    }

    // Ebooks achetés
    if (pendingEbookIds.length > 0) {
      setPurchasedEbookIds([...pendingEbookIds]);
      ajouterEbooksAchetes(pendingEbookIds);

      // Générer tokens de téléchargement
      if (currentUser?.id) {
        pendingEbookIds.forEach((ebookId) => {
          fetch("/api/download-token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ebookId, userId: currentUser.id, email: currentUser.email }),
          })
            .then((r) => r.json())
            .then((data) => {
              if (data.token) setDownloadToken(ebookId, data.token);
            })
            .catch(() => {});
        });
      }

      clearPendingEbookIds();
    }

    clearCart();

    // Lien magique — permet au client de retrouver ses achats après fermeture du site
    if (currentUser?.email) {
      const ebookIdsCopy = pendingEbookIds.length > 0 ? [...pendingEbookIds] : [];
      const formationIdsCopy = pendingFormationIds.length > 0 ? [...pendingFormationIds] : [];
      if (ebookIdsCopy.length > 0 || formationIdsCopy.length > 0) {
        fetch("/api/auth/magic-link", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: currentUser.id,
            email: currentUser.email,
            ebookIds: ebookIdsCopy,
            formationIds: formationIdsCopy,
          }),
        })
          .then((r) => r.json())
          .then((data) => {
            if (!data.token) return;
            const ebookTitles = ebookIdsCopy.map((id) => {
              const eb = TOUS_LES_EBOOKS.find((e) => e.id === id);
              return eb?.title ?? id;
            });
            const formationTitles = formationIdsCopy.map((id) => {
              const f = FORMATIONS.find((f) => f.id === id);
              return f?.titre ?? id;
            });
            fetch("/api/send-ebook", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: currentUser.email,
                firstName: currentUser.firstName || "Cher(e) client(e)",
                ebookIds: ebookIdsCopy,
                ebookTitles,
                formationTitles,
                magicToken: data.token,
                amount: purchaseAmount,
                currency: purchaseCurrency,
                reference: ref,
              }),
            }).catch(() => {});
          })
          .catch(() => {});
      }
    }

    // Traçage acheteur — IP + empreinte appareil pour reconnaissance future
    try {
      const ua = navigator.userAgent;
      const sc = `${window.screen.width}x${window.screen.height}`;
      const lang = navigator.language;
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const str = `${ua}|${sc}|${lang}|${tz}`;
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
      }
      const fingerprint = Math.abs(hash).toString(36);
      localStorage.setItem("sl_buyer_fp", fingerprint);
      fetch("/api/checkout/track-buyer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fingerprint }),
      }).catch(() => {});
    } catch { /* silencieux */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redirection vers Mon Espace après motivation (ou si désactivée)
  // On utilise window.location.replace pour un full reload qui garantit la
  // réhydratation Zustand depuis localStorage (fix iOS Safari / WebView)
  useEffect(() => {
    if (!wfConfig.motivationEnabled && step === "motivation") {
      window.location.replace("/mon-espace");
    }
  }, [wfConfig.motivationEnabled]); // eslint-disable-line

  function handleAfterMotivation() {
    if (purchasedEbookIds.length > 0 || purchasedFormationIds.length > 0) {
      setStep("crosssell");
    } else {
      window.location.replace("/mon-espace");
    }
  }

  if (step === "crosssell") {
    return (
      <PostPurchaseCrossSell
        purchasedEbookIds={purchasedEbookIds}
        purchasedFormationIds={purchasedFormationIds}
        userId={currentUser?.id}
        onSkip={() => window.location.replace("/mon-espace")}
      />
    );
  }

  if (step === "motivation") {
    if (!wfConfig.motivationEnabled) {
      return (
        <div className="flex items-center justify-center min-h-[70vh]">
          <div className="w-10 h-10 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
        </div>
      );
    }
    return <MotivationForm onSubmit={handleAfterMotivation} cfg={wfConfig} currentUser={currentUser} ebookIds={purchasedEbookIds} formationIds={purchasedFormationIds} />;
  }

  return null;
}

// ─── Export ───────────────────────────────────────────────────────────────────

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[70vh]">
          <div className="w-10 h-10 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
