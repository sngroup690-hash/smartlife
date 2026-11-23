"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowRight, Clock, CheckCircle, XCircle, AlertCircle,
  LogOut, Star, Send, MessageSquare, Lock, Eye, EyeOff,
  BookOpen, Users, Download, Shield, Mail, User,
  Play, ExternalLink, ChevronDown, ChevronUp, Headphones, WifiOff, X, Bookmark,
  PenLine, ClipboardList,
} from "lucide-react";
import PwaInstallPrompt from "@/components/PwaInstallPrompt";
import EspaceMarketing, { BienvenueEspace } from "./EspaceMarketing";
import {
  savePdfOffline,
  getPdfOffline,
  deletePdfOffline,
  listOfflinePdfs,
} from "@/lib/offline-storage";
import { useUserStore } from "@/lib/user-store";
import { useAccompagnementStore, EspacePersonnalise, CandidatureConsultant, DemandeAccompagnement, StatutDemande } from "@/lib/accompagnement-store";
import { ebooks as TOUS_LES_EBOOKS, formatPrice } from "@/lib/data";
import { FORMATIONS } from "@/lib/formations-data";

const inputCls =
  "w-full px-4 py-3 bg-[var(--g-doux)] border border-[var(--g-ligne)] rounded-[10px] text-[var(--g-encre)] placeholder-[#a9aeb5] focus:outline-none focus:border-[var(--g-encre)] focus:bg-white transition-colors text-sm";

// ─── Lecteur audio ebook ──────────────────────────────────────────────────────

function EbookAudioPlayer({ url, title }: { url: string; title: string }) {
  const [open, setOpen] = useState(false);
  const isDirectAudio = /\.(mp3|m4a|ogg|aac|wav|flac)(\?|#|$)/i.test(url) || url.startsWith("/audio/");
  const isSoundCloud = url.includes("soundcloud.com");
  const scEmbed = isSoundCloud
    ? `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23E8B800&auto_play=false&hide_related=false&show_comments=false&show_user=true&show_reposts=false&show_teaser=false`
    : null;
  return (
    <div className="px-4 pb-3 bg-gray-50 border-t border-gray-100">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 w-full py-2 px-3 bg-[var(--g-jaune-doux)] hover:bg-[#fbeeb8] text-[#3d3a1f] text-xs font-semibold rounded-lg transition-colors">
        <Headphones size={13} />
        {open ? "Fermer la version audio" : "Écouter la version audio"}
        {open ? <ChevronUp size={11} className="ml-auto" /> : <ChevronDown size={11} className="ml-auto" />}
      </button>
      {open && (
        <div className="mt-2 rounded-lg overflow-hidden">
          <p className="text-gray-600 text-xs mb-2 font-medium">{title}</p>
          {isDirectAudio ? (
            <audio src={url} controls className="w-full" />
          ) : scEmbed ? (
            <iframe width="100%" height="120" scrolling="no" frameBorder="no" allow="autoplay" src={scEmbed} className="rounded-lg" />
          ) : (
            <a href={url} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-[var(--g-vert)] hover:bg-[var(--g-vert-profond)] text-white text-xs font-semibold rounded-lg transition-colors">
              <Headphones size={13} /> Ouvrir la version audio <ExternalLink size={12} />
            </a>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Badge statut ─────────────────────────────────────────────────────────────

function StatutBadge({ statut }: { statut: string }) {
  if (statut === "validee")
    return (
      <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-md">
        <CheckCircle size={12} /> Validée
      </span>
    );
  if (statut === "rejetee")
    return (
      <span className="flex items-center gap-1.5 px-3 py-1 bg-red-50 border border-red-200 text-red-600 text-xs font-semibold rounded-md">
        <XCircle size={12} /> Rejetée
      </span>
    );
  return (
    <span className="flex items-center gap-1.5 px-3 py-1 bg-yellow-50 border border-yellow-200 text-yellow-600 text-xs font-semibold rounded-md">
      <Clock size={12} /> En attente
    </span>
  );
}

// ─── Étoiles ──────────────────────────────────────────────────────────────────

function StarRating({ value, onChange, readonly = false }: {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
}) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = readonly ? star <= value : star <= (hovered || value);
        return (
          <button key={star} type="button" disabled={readonly}
            onClick={() => onChange?.(star)}
            onMouseEnter={() => !readonly && setHovered(star)}
            onMouseLeave={() => !readonly && setHovered(0)}
            className={`text-2xl transition-colors ${readonly ? "cursor-default" : "cursor-pointer"} ${filled ? "text-[#E8B800]" : "text-[#cfd5cf]"}`}>
            ★
          </button>
        );
      })}
    </div>
  );
}

const NOTE_LABELS: Record<number, string> = {
  1: "Très décevant", 2: "Insuffisant", 3: "Correct", 4: "Très bien", 5: "Excellent !",
};

// ─── Formulaire avis produit ──────────────────────────────────────────────────

type UserReview = {
  productId: string;
  productType: string;
  rating: number;
  text: string;
  statut: string;
};

function ProductReviewForm({
  productId, productType, userId, userName, existingReview, onReviewSubmitted,
}: {
  productId: string;
  productType: "ebook" | "formation";
  userId: string;
  userName: string;
  existingReview: UserReview | null;
  onReviewSubmitted?: (review: UserReview) => void;
}) {
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  if (existingReview) {
    const badge = existingReview.statut === "approuve"
      ? <span className="flex items-center gap-1.5 text-emerald-600 text-xs font-medium"><CheckCircle size={12} /> Avis publié</span>
      : existingReview.statut === "rejete"
      ? <span className="flex items-center gap-1.5 text-red-500 text-xs font-medium"><XCircle size={12} /> Non approuvé</span>
      : <span className="flex items-center gap-1.5 text-emerald-600 text-xs font-medium"><CheckCircle size={12} /> Merci pour votre avis !</span>;
    return (
      <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
        <div className="flex items-center gap-2">
          <StarRating value={existingReview.rating} readonly />
          <span className="text-[var(--g-gris)] text-xs font-medium">{NOTE_LABELS[existingReview.rating]}</span>
        </div>
        {existingReview.text && <p className="text-gray-600 text-xs italic">&ldquo;{existingReview.text}&rdquo;</p>}
        {badge}
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
        <CheckCircle size={14} className="text-emerald-600 flex-shrink-0" />
        <p className="text-emerald-700 text-xs font-medium">Merci pour votre avis !</p>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, productType, userId, userName, rating, text }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erreur."); setLoading(false); return; }
      const newReview: UserReview = { productId, productType, rating, text, statut: "en_attente" };
      onReviewSubmitted?.(newReview);
      setDone(true);
    } catch {
      setError("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex items-center gap-3">
        <StarRating value={rating} onChange={setRating} />
        {rating > 0 && <span className="text-[var(--g-gris)] text-xs font-medium">{NOTE_LABELS[rating]}</span>}
      </div>
      <textarea rows={3} value={text} onChange={(e) => setText(e.target.value)}
        className={`${inputCls} resize-none`}
        placeholder="Partagez votre expérience (optionnel)…" />
      {error && <p className="text-red-400 text-xs">{error}</p>}
      <button type="submit" disabled={rating === 0 || loading}
        className="g-btn w-full !h-11 !text-[14px] disabled:opacity-40">
        {loading ? <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <><Send size={13} /> Soumettre mon avis</>}
      </button>
    </form>
  );
}

// ─── Formulaire motivation produit ───────────────────────────────────────────

function ProductMotivationForm({ productId, productLabel, onSaved }: {
  productId: string;
  productLabel: string;
  onSaved?: () => void;
}) {
  const { ajouterMotivation, currentUser } = useUserStore();
  const [text, setText] = useState("");
  const [saved, setSaved] = useState(false);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    ajouterMotivation({
      ebookIds: [productId],
      objectif: "",
      situation: "",
      texte: text.trim(),
      interetAccompagnement: "",
    });
    // Persistance serveur — visible dans l'onglet admin Motivations
    fetch("/api/motivations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: currentUser?.id ?? "",
        userName: currentUser ? `${currentUser.firstName} ${currentUser.lastName}`.trim() : "Anonyme",
        userEmail: currentUser?.email ?? "",
        ebookIds: [productId],
        productNames: [productLabel],
        objectif: "",
        situation: "",
        texte: text.trim(),
        interetAccompagnement: "",
      }),
    }).catch(() => {});
    setSaved(true);
    setTimeout(() => onSaved?.(), 800);
  }

  if (saved) {
    return (
      <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
        <CheckCircle size={14} className="text-emerald-600" />
        <p className="text-emerald-700 text-xs font-medium">Motivation enregistrée !</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-3">
      <p className="text-gray-600 text-xs">Qu&apos;est-ce qui vous a motivé à acheter <span className="font-medium">{productLabel}</span> ?</p>
      <textarea rows={3} value={text} onChange={(e) => setText(e.target.value)}
        className={`${inputCls} resize-none`}
        placeholder="Votre motivation, vos objectifs…" />
      <button type="submit" disabled={!text.trim()}
        className="g-btn g-btn-noir w-full !h-11 !text-[14px] disabled:opacity-40">
        <Send size={13} /> Enregistrer
      </button>
    </form>
  );
}

// ─── Formulaire avis consultant ───────────────────────────────────────────────

function AvisForm({ demandeId, espaceTitre }: { demandeId: string; espaceTitre: string }) {
  const { donnerAvis } = useAccompagnementStore();
  const [note, setNote] = useState(0);
  const [avis, setAvis] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (note === 0) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    donnerAvis(demandeId, note, avis);
    setLoading(false);
    setDone(true);
  }

  if (done) {
    return (
      <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
        <CheckCircle size={18} className="text-emerald-600 flex-shrink-0" />
        <p className="text-emerald-700 text-sm font-medium">Merci pour votre avis !</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 p-5 bg-[var(--g-jaune-doux)] rounded-xl space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <MessageSquare size={16} className="text-[var(--g-vert)]" />
        <h4 className="text-gray-900 font-semibold text-sm">Évaluez votre consultant — {espaceTitre}</h4>
      </div>
      <div>
        <p className="text-gray-500 text-xs mb-2">Votre note *</p>
        <div className="flex items-center gap-3">
          <StarRating value={note} onChange={setNote} />
          {note > 0 && <span className="text-[var(--g-gris)] text-sm font-medium">{NOTE_LABELS[note]}</span>}
        </div>
      </div>
      <div>
        <label className="block text-gray-500 text-xs mb-2">Votre avis (optionnel)</label>
        <textarea rows={3} value={avis} onChange={(e) => setAvis(e.target.value)}
          className={`${inputCls} resize-none`}
          placeholder={`Comment s'est passé votre accompagnement dans le programme ${espaceTitre} ?`} />
      </div>
      <button type="submit" disabled={note === 0 || loading}
        className="g-btn w-full !text-[14px] disabled:opacity-40">
        {loading ? <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <><Send size={14} /> Envoyer</>}
      </button>
    </form>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function MonEspacePage() {
  const userStore = useUserStore();
  const accompStore = useAccompagnementStore();

  // Fallback : si la réhydratation Zustand échoue (mode privé, quota localStorage dépassé)
  // on débloque l'UI après 1 seconde pour éviter le spinner infini
  useEffect(() => {
    if (userStore._hasHydrated) return;
    const t = setTimeout(() => {
      if (!userStore._hasHydrated) userStore._setHasHydrated(true);
    }, 1000);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-login via lien magique (?token=xxx envoyé par email après achat)
  const [magicLinkLoading, setMagicLinkLoading] = useState(false);
  useEffect(() => {
    if (!userStore._hasHydrated || userStore.isLoggedIn) return;
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (!token) return;
    setMagicLinkLoading(true);
    fetch(`/api/auth/magic-link?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((data: { valid: boolean; user?: { id: string; firstName: string; lastName: string; email: string; phone: string; ebooksAchetes: string[]; formationsAchetees: string[] } }) => {
        if (data.valid && data.user) {
          userStore.setServerSession(data.user);
          window.history.replaceState({}, "", "/mon-espace");
        }
      })
      .catch(() => {})
      .finally(() => setMagicLinkLoading(false));
  }, [userStore._hasHydrated]); // eslint-disable-line react-hooks/exhaustive-deps

  const [fetchingToken, setFetchingToken] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  // Auth states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [showPinCreation, setShowPinCreation] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [loginError, setLoginError] = useState("");
  // Code à 6 chiffres reçu par e-mail (preuve d'accès à la boîte)
  const [codeEmail, setCodeEmail] = useState("");
  const [codeEnvoye, setCodeEnvoye] = useState(false);
  const [envoiCode, setEnvoiCode] = useState(false);
  const [infoCode, setInfoCode] = useState("");

  // Création mot de passe (section compte)
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [pwdError, setPwdError] = useState("");
  const [pwdSuccess, setPwdSuccess] = useState(false);

  // Recherche produits
  const [searchQuery, setSearchQuery] = useState("");

  // Bannière PIN dismissible
  const [dismissedPinBanner, setDismissedPinBanner] = useState(false);

  // Lecteur PDF hors-ligne
  const [pdfReader, setPdfReader] = useState<{ id: string; url: string; title: string } | null>(null);

  // Avis consultant
  const [avisOuvert, setAvisOuvert] = useState<string | null>(null);

  // Produits — collapsibles
  const [motivationOpen, setMotivationOpen] = useState<Record<string, boolean>>({});
  const [reviewOpen, setReviewOpen] = useState<Record<string, boolean>>({});

  // Données serveur
  const [serverEspaces, setServerEspaces] = useState<EspacePersonnalise[] | null>(null);
  const [serverDemandes, setServerDemandes] = useState<Record<string, unknown>[] | null>(null);
  const [serverCC, setServerCC] = useState<CandidatureConsultant[] | null>(null);
  const [serverConsultants, setServerConsultants] = useState<{ id: string; prenom: string; nom?: string; ville?: string; anneesExperience?: string; clientsAccompa: number; entreprisesAccompa: number; domainesIds: string[]; actif: boolean }[] | null>(null);
  const [dynamicEbooks, setDynamicEbooks] = useState<Array<{ id: string; title: string; category: string; pages: number; price: number; slug?: string; whatsappUrl?: string; audioUrl?: string; cover?: string; originalPrice?: number; ventes?: number }>>([]);
  const [ebookOverrides, setEbookOverrides] = useState<Record<string, { whatsappUrl?: string; audioUrl?: string }>>({});

  // Pré-charger le cache localStorage pour usage hors-ligne (avant les appels API)
  useEffect(() => {
    try {
      const cached = localStorage.getItem("sl-dyn-ebooks");
      if (cached) setDynamicEbooks(JSON.parse(cached));
      const ovr = localStorage.getItem("sl-ebook-overrides");
      if (ovr) setEbookOverrides(JSON.parse(ovr));
    } catch {}
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const [formationsDetailData, setFormationsDetailData] = useState<Array<{ id: string; titre: string; whatsappUrl?: string }>>([]);
  const [userReviews, setUserReviews] = useState<UserReview[]>([]);

  // PWA / hors-ligne
  const [isOnline, setIsOnline] = useState(true);
  const [offlinePdfs, setOfflinePdfs] = useState<Record<string, boolean>>({});
  const [savingOffline, setSavingOffline] = useState<string | null>(null);
  const [offlineError, setOfflineError] = useState<string | null>(null);

  useEffect(() => {
    const userEmail = userStore.currentUser?.email;
    const userId = userStore.currentUser?.id;
    if (!userStore.isLoggedIn || !userEmail) return;

    fetch("/api/espaces")
      .then((r) => r.json())
      .then((data) => setServerEspaces(data.espaces ?? null))
      .catch(() => {});
    fetch(`/api/demandes/me?email=${encodeURIComponent(userEmail)}`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data.demandes)) setServerDemandes(data.demandes); })
      .catch(() => {});
    fetch(`/api/candidatures/me?email=${encodeURIComponent(userEmail)}`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data.candidatures)) setServerCC(data.candidatures as CandidatureConsultant[]); })
      .catch(() => {});
    fetch("/api/consultants")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data.consultants)) setServerConsultants(data.consultants); })
      .catch(() => {});
    fetch(`/api/user/ebooks?email=${encodeURIComponent(userEmail)}`)
      .then((r) => r.json())
      .then((data) => {
        const currentEbooks = userStore.ebooksAchetes;
        const newEbooks = (data.ebookIds as string[] | undefined)?.filter(
          (id) => !currentEbooks.includes(id)
        ) ?? [];
        if (newEbooks.length > 0) userStore.ajouterEbooksAchetes(newEbooks);
        const currentForms = userStore.formationsAchetees;
        const newForms = (data.formationIds as string[] | undefined)?.filter(
          (id) => !currentForms.includes(id)
        ) ?? [];
        if (newForms.length > 0) userStore.ajouterFormationsAchetees(newForms);
      })
      .catch(() => {});

    // Ebooks dynamiques + overrides (pour slug, whatsappUrl, audioUrl)
    // Snapshot des IDs achetés AVANT l'appel async pour préserver les métadonnées
    const snapshotPurchasedIds = new Set([
      ...(userStore.getUserByEmail(userEmail)?.ebooksAchetes ?? []),
      ...userStore.ebooksAchetes,
    ]);
    fetch("/api/ebooks?slim=1")
      .then((r) => r.json())
      .then((data) => {
        const ovr = (data.overrides ?? {}) as Record<string, { whatsappUrl?: string; audioUrl?: string }>;
        setEbookOverrides(ovr);
        const list = (data.ebooks ?? []) as Array<{
          id: string; title?: string; category?: string; pages?: number;
          price?: number; slug?: string; whatsappUrl?: string; audioUrl?: string;
          cover?: string; originalPrice?: number; ventes?: number;
        }>;
        const mapped = list.map((e) => ({
          id: e.id,
          title: e.title ?? e.id,
          category: e.category ?? "Ebook",
          pages: e.pages ?? 0,
          price: e.price ?? 0,
          slug: e.slug,
          whatsappUrl: e.whatsappUrl,
          audioUrl: e.audioUrl,
          cover: e.cover,
          originalPrice: e.originalPrice,
          ventes: e.ventes,
        }));
        // Préserver les métadonnées des ebooks achetés retirés du catalogue par l'admin
        const newIds = new Set(mapped.map((e) => e.id));
        let preserved: typeof mapped = [];
        try {
          const cachedRaw = localStorage.getItem("sl-dyn-ebooks");
          if (cachedRaw) {
            const cachedList: typeof mapped = JSON.parse(cachedRaw);
            preserved = cachedList.filter((e) => snapshotPurchasedIds.has(e.id) && !newIds.has(e.id));
          }
        } catch {}
        const merged = [...mapped, ...preserved];
        setDynamicEbooks(merged);
        // Cache pour usage hors-ligne
        try {
          localStorage.setItem("sl-dyn-ebooks", JSON.stringify(merged));
          localStorage.setItem("sl-ebook-overrides", JSON.stringify(ovr));
        } catch {}
      })
      .catch(() => {}); // Fallback déjà chargé depuis localStorage au montage

    // Formations — titres et whatsappUrl
    fetch("/api/formations")
      .then((r) => r.json())
      .then((data) => {
        const overrides = (data.overrides ?? {}) as Record<string, Record<string, unknown>>;
        const dynamic = (data.formations ?? []) as Array<Record<string, unknown>>;
        const staticDetails = FORMATIONS.map((f) => ({
          id: f.id,
          titre: (overrides[f.id]?.titre as string) || f.titre,
          whatsappUrl: overrides[f.id]?.whatsappUrl as string | undefined,
        }));
        const dynamicIds = new Set(staticDetails.map((f) => f.id));
        const dynamicDetails = dynamic
          .filter((f) => !dynamicIds.has(f.id as string))
          .map((f) => ({
            id: f.id as string,
            titre: f.titre as string,
            whatsappUrl: f.whatsappUrl as string | undefined,
          }));
        setFormationsDetailData([...staticDetails, ...dynamicDetails]);
      })
      .catch(() => {});

    // Avis déjà soumis par l'utilisateur
    if (userId) {
      fetch(`/api/reviews?userId=${encodeURIComponent(userId)}`)
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data.reviews)) {
            setUserReviews(data.reviews.map((r: Record<string, unknown>) => ({
              productId: r.productId as string,
              productType: r.productType as string,
              rating: r.rating as number,
              text: r.text as string,
              statut: r.statut as string,
            })));
          }
        })
        .catch(() => {});
    }
  }, [userStore.isLoggedIn]);

  /* Suivi connexion réseau */
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const up = () => setIsOnline(true);
    const down = () => setIsOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, []);

  /* Chargement de la liste des PDFs déjà sauvegardés hors-ligne */
  useEffect(() => {
    if (!userStore.isLoggedIn) return;
    listOfflinePdfs()
      .then((ids) => {
        const map: Record<string, boolean> = {};
        ids.forEach((id) => { map[id] = true; });
        setOfflinePdfs(map);
      })
      .catch(() => {});
  }, [userStore.isLoggedIn]);

  // ── Étape 1 : Vérifier l'email ──
  async function handleCheckEmail(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");

    // Un client qui a payé entre avec son adresse e-mail seule : pas de code à créer ni à recevoir.
    setEmailLoading(true);
    try {
      const res = await fetch("/api/auth/acces-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.user) {
        userStore.setServerSession({
          id: data.user.id,
          firstName: data.user.firstName ?? "",
          lastName: data.user.lastName ?? "",
          email: data.user.email,
          phone: "",
          ebooksAchetes: data.user.ebooksAchetes ?? [],
          formationsAchetees: data.user.formationsAchetees ?? [],
        });
        return;
      }
      setLoginError(data.error ?? "Aucun achat trouvé pour cet e-mail. Vérifie l'adresse utilisée lors du paiement.");
    } catch {
      setLoginError("Erreur réseau. Vérifie ta connexion et réessaie.");
    } finally {
      setEmailLoading(false);
    }
  }

  // ── Envoyer un code à 6 chiffres par e-mail ──
  async function demanderCode(adresse: string = email) {
    setEnvoiCode(true);
    setInfoCode("");
    setPwdError("");
    try {
      const res = await fetch("/api/auth/code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: adresse }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setCodeEnvoye(true);
        setInfoCode(`Code envoyé à ${adresse}. Regarde aussi dans les « Spams » ou « Promotions ».`);
      } else {
        setPwdError(data.error ?? "Le code n'a pas pu être envoyé.");
        if (res.status === 429) setCodeEnvoye(true);
      }
    } catch {
      setPwdError("Erreur réseau. Vérifie ta connexion et réessaie.");
    } finally {
      setEnvoiCode(false);
    }
  }

  // ── Entrer avec le code reçu par e-mail (et choisir son code PIN) ──
  async function handleCreateLoginPin(e: React.FormEvent) {
    e.preventDefault();
    setPwdError("");
    if (!/^\d{6}$/.test(codeEmail)) { setPwdError("Entre le code à 6 chiffres reçu par e-mail."); return; }
    if (newPwd.length < 4) { setPwdError("Choisis un code PIN d'au moins 4 chiffres."); return; }
    if (newPwd !== confirmPwd) { setPwdError("Les deux codes PIN ne correspondent pas."); return; }
    setPinLoading(true);
    try {
      const res = await fetch("/api/auth/connexion-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: codeEmail, nouveauPin: newPwd }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setPwdError(data.error ?? "Erreur serveur."); return; }
      userStore.setServerSession({
        id: data.user.id,
        firstName: data.user.firstName ?? "",
        lastName: data.user.lastName ?? "",
        email: data.user.email,
        phone: data.user.phone ?? "",
        ebooksAchetes: data.user.ebooksAchetes ?? [],
        formationsAchetees: data.user.formationsAchetees ?? [],
      });
    } catch {
      setPwdError("Erreur réseau. Vérifie ta connexion et réessaie.");
    } finally {
      setPinLoading(false);
    }
  }

  // ── Étape 2 : Connexion avec mot de passe ──
  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");

    // Essayer le store local en premier (mot de passe déjà connu localement)
    const localOk = userStore.login(email, password);
    if (localOk) return;

    // Fallback serveur — connexion cross-device
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        const data = await res.json();
        userStore.setServerSession({
          id: data.user.id,
          firstName: data.user.firstName ?? "",
          lastName: data.user.lastName ?? "",
          email: data.user.email,
          phone: data.user.phone ?? "",
          ebooksAchetes: data.user.ebooksAchetes ?? [],
          formationsAchetees: data.user.formationsAchetees ?? [],
        });
        return;
      }
      if (res.status === 429) {
        const d = await res.json().catch(() => ({}));
        setLoginError(d.error ?? "Trop d'essais. Réessaie plus tard ou demande un code par e-mail.");
        return;
      }
    } catch { /* erreur réseau */ }

    setLoginError("Code incorrect. Tu peux aussi recevoir un code par e-mail juste en dessous.");
  }

  // ── Créer mot de passe ──
  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault();
    setPwdError("");
    if (!/^\d{6}$/.test(codeEmail)) { setPwdError("Entre d'abord le code à 6 chiffres reçu par e-mail."); return; }
    if (newPwd.length < 4) { setPwdError("Minimum 4 chiffres."); return; }
    if (newPwd !== confirmPwd) { setPwdError("Les codes ne correspondent pas."); return; }
    setPinLoading(true);
    try {
      const res = await fetch("/api/user/set-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userStore.currentUser!.email, pin: newPwd, codeEmail }),
      });
      const data = await res.json();
      if (!res.ok) { setPwdError(data.error ?? "Erreur."); return; }
      setPwdSuccess(true);
    } catch {
      setPwdError("Erreur réseau.");
    } finally {
      setPinLoading(false);
    }
  }

  // ── Garde d'hydratation Zustand (iOS Safari / bfcache fix) ──────────────────
  if (!userStore._hasHydrated || magicLinkLoading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="w-10 h-10 border-2 border-[var(--g-ligne)] border-t-[var(--g-vert)] rounded-full animate-spin" />
      </div>
    );
  }

  // ── Vue non connectée ──────────────────────────────────────────────────────
  if (!userStore.isLoggedIn) {
    return (
      <div className="max-w-md mx-auto px-4 py-24">
        <div className="text-center mb-10">
          <div className="w-16 h-16 mx-auto rounded-full bg-[var(--g-vert-doux)] flex items-center justify-center mb-6">
            <User size={30} className="text-[var(--g-vert)]" />
          </div>
          <h1 className="text-[34px] sm:text-[40px] font-semibold tracking-[-0.03em] leading-tight text-[var(--g-encre)] mb-3">Mon Espace</h1>
          <p className="text-gray-600 text-sm">
            Retrouvez vos ebooks achetés, vos formations, vos candidatures et nos consultants.
          </p>
        </div>

        <div className="p-8 bg-white border border-[var(--g-ligne)] rounded-[18px] space-y-4">

          {showPinCreation ? (
            <form onSubmit={handleCreateLoginPin} className="space-y-4">
              <div className="text-center pb-1">
                <Mail size={26} className="text-[var(--g-vert)] mx-auto mb-2" />
                <h3 className="text-gray-900 font-bold text-base">Entre le code reçu par e-mail</h3>
                <p className="text-gray-600 text-xs mt-1">
                  Nous venons d&apos;envoyer un code à 6 chiffres à <span className="font-semibold text-gray-900">{email}</span>.
                </p>
              </div>
              <input required type="text" inputMode="numeric" autoComplete="one-time-code"
                value={codeEmail}
                onChange={(e) => { setCodeEmail(e.target.value.replace(/\D/g, "").slice(0, 6)); setPwdError(""); }}
                className={`${inputCls} tracking-[0.5em] text-center text-2xl font-mono font-bold`}
                placeholder="000000" maxLength={6} autoFocus />
              {infoCode && <p className="text-[#1e7a1e] text-xs text-center">{infoCode}</p>}
              <button type="button" onClick={() => demanderCode()} disabled={envoiCode}
                className="w-full text-center text-[#1e7a1e] text-xs font-bold underline underline-offset-2 disabled:opacity-50">
                {envoiCode ? "Envoi en cours…" : codeEnvoye ? "Je n'ai rien reçu : renvoyer le code" : "Recevoir le code par e-mail"}
              </button>
              <div className="pt-2 border-t border-gray-100">
                <p className="text-gray-900 font-bold text-sm text-center">Choisis ton code PIN</p>
                <p className="text-gray-500 text-xs text-center mt-0.5">Tu l&apos;utiliseras pour revenir dans ton espace sans attendre d&apos;e-mail.</p>
              </div>
              <div className="relative">
                <input required type={showPwd ? "text" : "password"} inputMode="numeric"
                  value={newPwd}
                  onChange={(e) => { setNewPwd(e.target.value.replace(/\D/g, "").slice(0, 6)); setPwdError(""); }}
                  className={`${inputCls} pr-11 tracking-widest text-center text-lg font-mono`}
                  placeholder="Nouveau code PIN" maxLength={6} />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                  {showPwd ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              <input required type="password" inputMode="numeric"
                value={confirmPwd}
                onChange={(e) => { setConfirmPwd(e.target.value.replace(/\D/g, "").slice(0, 6)); setPwdError(""); }}
                className={`${inputCls} tracking-widest text-center text-lg font-mono`}
                placeholder="Confirmer le code" maxLength={6} />
              {pwdError && (
                <p className="text-red-400 text-xs flex items-center gap-1">
                  <AlertCircle size={12} /> {pwdError}
                </p>
              )}
              <button type="submit" disabled={pinLoading}
                className="g-btn w-full !h-[52px] disabled:opacity-60">
                {pinLoading
                  ? <span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  : <><Lock size={16} /> Accéder à mon espace</>}
              </button>
              <button type="button" onClick={() => { setShowPinCreation(false); setNewPwd(""); setConfirmPwd(""); setPwdError(""); setCodeEmail(""); setCodeEnvoye(false); setInfoCode(""); }}
                className="w-full text-center text-gray-600 text-xs hover:text-gray-400 py-1">
                ← Utiliser un autre email
              </button>
            </form>
          ) : !showPasswordField ? (
            <form onSubmit={handleCheckEmail} className="space-y-4">
              <div>
                <label className="block text-gray-700 text-sm mb-2">
                  Email <span className="text-[var(--g-vert)]">*</span>
                </label>
                <input required type="email" value={email}
                  onChange={(e) => { setEmail(e.target.value); setLoginError(""); }}
                  className={inputCls} placeholder="jean@exemple.com" />
                {loginError && (
                  <p className="text-red-400 text-xs mt-2 flex items-start gap-1.5">
                    <AlertCircle size={13} className="flex-shrink-0 mt-0.5" /> {loginError}
                  </p>
                )}
              </div>
              <button type="submit" disabled={emailLoading}
                className="g-btn w-full !h-[52px] disabled:opacity-60">
                {emailLoading
                  ? <span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  : <><Mail size={16} /> Accéder à mon espace</>}
              </button>
            </form>
          ) : (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div>
                <p className="text-gray-600 text-sm mb-4">
                  Connexion pour <span className="text-gray-900 font-medium">{email}</span>
                </p>
                <label className="block text-gray-700 text-sm mb-2">
                  Code PIN ou mot de passe <span className="text-[var(--g-vert)]">*</span>
                </label>
                <div className="relative">
                  <input required type={showPwd ? "text" : "password"} value={password}
                    onChange={(e) => { setPassword(e.target.value); setLoginError(""); }}
                    className={`${inputCls} pr-11`} placeholder="••••••••" autoFocus />
                  <button type="button" onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-900">
                    {showPwd ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                {loginError && (
                  <p className="text-red-400 text-xs mt-2 flex items-center gap-1.5">
                    <AlertCircle size={13} /> {loginError}
                  </p>
                )}
              </div>
              <button type="submit"
                className="g-btn w-full !h-[52px]">
                <Lock size={16} /> Se connecter
              </button>
              <button type="button"
                onClick={() => { setShowPasswordField(false); setPassword(""); setLoginError(""); setShowPinCreation(true); demanderCode(); }}
                className="w-full rounded-[10px] border border-[var(--g-vert)] py-3 text-sm font-semibold text-[var(--g-vert)] hover:bg-[var(--g-vert-doux)] transition-colors">
                Code oublié ? Recevoir un code par e-mail
              </button>
              <button type="button" onClick={() => { setShowPasswordField(false); setPassword(""); setLoginError(""); }}
                className="w-full text-center text-gray-600 text-xs hover:text-gray-400 transition-colors py-1">
                ← Utiliser un autre email
              </button>
            </form>
          )}

          <div className="pt-4 border-t border-gray-100 text-center">
            <p className="text-gray-600 text-xs mb-2">Pas encore de compte ?</p>
            <Link href="/ebooks"
              className="g-lien text-sm">
              Découvrir nos produits <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Dashboard connecté ─────────────────────────────────────────────────────
  const currentUser = userStore.currentUser!;
  const storedUser = userStore.getUserByEmail(currentUser.email);

  // Ebooks achetés
  const ebooksAchetesIds = [...new Set([
    ...(storedUser?.ebooksAchetes ?? []),
    ...userStore.ebooksAchetes,
  ])];
  const allEbooks = [
    ...TOUS_LES_EBOOKS,
    ...dynamicEbooks.filter((d) => !TOUS_LES_EBOOKS.some((s) => s.id === d.id)),
  ];
  const purchaseDates = userStore.purchaseDates;
  const ebooksPurchased = allEbooks
    .filter((e) => ebooksAchetesIds.includes(e.id))
    .sort((a, b) => {
      const da = purchaseDates[a.id] ? new Date(purchaseDates[a.id]).getTime() : ebooksAchetesIds.indexOf(a.id);
      const db = purchaseDates[b.id] ? new Date(purchaseDates[b.id]).getTime() : ebooksAchetesIds.indexOf(b.id);
      return db - da;
    });
  const downloadTokens = userStore.downloadTokens;

  // Formations achetées
  const formationsAchetesIds = [...new Set([
    ...(storedUser?.formationsAchetees ?? []),
    ...userStore.formationsAchetees,
  ])];
  const formationsPurchased = formationsAchetesIds
    .map((id) => {
      const detail = formationsDetailData.find((f) => f.id === id);
      const staticF = FORMATIONS.find((f) => f.id === id);
      return {
        id,
        titre: detail?.titre ?? staticF?.titre ?? "Formation",
        whatsappUrl: detail?.whatsappUrl,
      };
    })
    .sort((a, b) => {
      const da = purchaseDates[a.id] ? new Date(purchaseDates[a.id]).getTime() : formationsAchetesIds.indexOf(a.id);
      const db = purchaseDates[b.id] ? new Date(purchaseDates[b.id]).getTime() : formationsAchetesIds.indexOf(b.id);
      return db - da;
    });

  // Filtrage par recherche
  const q = searchQuery.toLowerCase().trim();
  const ebooksFiltered = q ? ebooksPurchased.filter((e) => e.title.toLowerCase().includes(q)) : ebooksPurchased;
  const formationsFiltered = q ? formationsPurchased.filter((f) => f.titre.toLowerCase().includes(q)) : formationsPurchased;

  // Helpers
  function getEbookSlug(ebookId: string): string {
    const s = TOUS_LES_EBOOKS.find((e) => e.id === ebookId);
    if (s?.slug) return s.slug;
    const d = dynamicEbooks.find((e) => e.id === ebookId);
    return d?.slug ?? ebookId;
  }
  function getEbookWhatsappUrl(ebookId: string): string | undefined {
    const d = dynamicEbooks.find((e) => e.id === ebookId);
    if (d?.whatsappUrl) return d.whatsappUrl;
    return ebookOverrides[ebookId]?.whatsappUrl;
  }
  function getEbookAudioUrl(ebookId: string): string | undefined {
    const d = dynamicEbooks.find((e) => e.id === ebookId);
    if (d?.audioUrl) return d.audioUrl;
    return ebookOverrides[ebookId]?.audioUrl;
  }

  async function getDownloadUrl(ebookId: string): Promise<string | null> {
    if (downloadTokens[ebookId]) {
      return `/api/download/${ebookId}?uid=${currentUser.id}&token=${downloadTokens[ebookId]}`;
    }
    setFetchingToken(ebookId);
    try {
      const res = await fetch("/api/download-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ebookId, userId: currentUser.id, email: currentUser.email }),
      });
      const data = await res.json();
      if (data.token) {
        userStore.setDownloadToken(ebookId, data.token);
        return `/api/download/${ebookId}?uid=${currentUser.id}&token=${data.token}`;
      }
    } catch {
      // ignore
    } finally {
      setFetchingToken(null);
    }
    return null;
  }

  async function handleDownload(ebookId: string) {
    setDownloadError(null);
    const url = await getDownloadUrl(ebookId);
    if (url) window.location.href = url;
    else setDownloadError("Impossible de générer le lien. Contactez le support si le problème persiste.");
  }

  async function saveEbookOffline(ebookId: string, ebookTitle: string) {
    setOfflineError(null);
    setSavingOffline(ebookId);
    try {
      const url = await getDownloadUrl(ebookId);
      if (!url) throw new Error("Token indisponible");
      const res = await fetch(url);
      if (!res.ok) throw new Error("Téléchargement échoué");
      const data = await res.arrayBuffer();
      await savePdfOffline(ebookId, ebookTitle, data);
      setOfflinePdfs((prev) => ({ ...prev, [ebookId]: true }));
    } catch {
      setOfflineError("Impossible de sauvegarder. Vérifiez votre connexion et réessayez.");
    } finally {
      setSavingOffline(null);
    }
  }

  async function openOfflineEbook(ebookId: string) {
    const data = await getPdfOffline(ebookId);
    if (!data) return;
    const blob = new Blob([data], { type: "application/pdf" });
    const blobUrl = URL.createObjectURL(blob);
    const title = allEbooks.find((e) => e.id === ebookId)?.title ?? "E-book";
    setPdfReader({ id: ebookId, url: blobUrl, title });
  }

  function closePdfReader() {
    if (pdfReader) URL.revokeObjectURL(pdfReader.url);
    setPdfReader(null);
  }

  async function deleteOfflineEbook(ebookId: string) {
    await deletePdfOffline(ebookId);
    setOfflinePdfs((prev) => {
      const next = { ...prev };
      delete next[ebookId];
      return next;
    });
  }

  const hasPassword = storedUser?.hasPassword ?? false;

  // Espaces actifs
  const espacesActifs = (serverEspaces ?? accompStore.espaces).filter((e) => e.actif);

  // Candidatures accompagnement
  const accompClient = accompStore.clients.find(
    (c) => c.email.toLowerCase() === currentUser.email.toLowerCase()
  );
  const demandesLocales: DemandeAccompagnement[] = accompClient
    ? accompStore.getDemandesClient(accompClient.id)
    : [];
  const demandesFinales: DemandeAccompagnement[] = serverDemandes !== null
    ? serverDemandes.map((d) => ({
        id: d.id as string,
        clientId: currentUser.email,
        espaceId: d.espaceId as string,
        espaceSlug: ((d.espaceSlug ?? d.espaceId) as string),
        espaceTitre: d.espaceTitre as string,
        message: d.message as string,
        statut: d.statut as StatutDemande,
        noteAdmin: ((d.noteAdmin ?? "") as string),
        createdAt: d.createdAt as string,
        updatedAt: d.updatedAt as string,
      }))
    : demandesLocales;
  const demandes = demandesFinales;
  const validees = demandes.filter((d) => d.statut === "validee");
  const nonNotees = validees.filter((d) => !d.noteConsultant);

  // Consultants actifs
  const consultants = serverConsultants !== null
    ? serverConsultants.filter((c) => c.actif !== false)
    : accompStore.consultants.filter((c) => c.actif);

  // Candidature consultant
  const candidaturesConsultant: CandidatureConsultant[] = serverCC !== null
    ? serverCC
    : accompStore.getCandidaturesConsultantByEmail(currentUser.email);

  const totalProduits = ebooksPurchased.length + formationsPurchased.length;

  // Favoris
  const savedEbooksList = allEbooks.filter((e) => userStore.isInWishlist(e.id, "ebook"));
  const savedFormationsList = formationsDetailData.filter((f) => userStore.isInWishlist(f.id, "formation"));
  const totalFiltered = ebooksFiltered.length + formationsFiltered.length;

  return (
    <>
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">

      <PwaInstallPrompt />

      {/* Bandeau hors-ligne */}
      {!isOnline && (
        <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
          <WifiOff size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <span>
            <strong>Mode hors-ligne</strong> — Vous n&apos;avez pas de connexion Internet. Vous pouvez lire les PDFs sauvegardés. Le paiement et le téléchargement nécessitent une connexion.
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-[34px] sm:text-[40px] font-semibold tracking-[-0.03em] leading-tight text-[var(--g-encre)] mb-1">Mon Espace</h1>
          <p className="text-gray-600">
            Bonjour, <span className="text-gray-900 font-semibold">{currentUser.firstName} {currentUser.lastName}</span>
          </p>
          <p className="text-gray-600 text-sm flex items-center gap-1 mt-0.5">
            <Mail size={12} /> {currentUser.email}
          </p>
        </div>
        <button onClick={userStore.logout}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-900 rounded-xl text-sm transition-all">
          <LogOut size={14} /> Déconnexion
        </button>
      </div>

      <BienvenueEspace prenom={currentUser.firstName} achetes={ebooksPurchased} nbFormations={formationsPurchased.length} />

      {/* Rappel notation */}
      {nonNotees.length > 0 && (
        <div className="p-4 bg-[var(--g-jaune-doux)] rounded-2xl flex items-start gap-3">
          <Star size={18} className="text-[var(--g-encre)] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-gray-900 text-sm font-semibold mb-0.5">
              {nonNotees.length} programme{nonNotees.length > 1 ? "s" : ""} à évaluer
            </p>
            <p className="text-gray-600 text-xs">Votre avis aide nos membres à choisir leur accompagnement.</p>
          </div>
        </div>
      )}

      {/* ── Mes Produits ── */}
      <section className="bg-white border border-[var(--g-ligne)] rounded-[18px] p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[var(--g-encre)] text-[22px] font-semibold tracking-[-0.02em] flex items-center gap-2">
            <BookOpen size={20} className="text-[var(--g-vert)]" />
            Mes Produits ({totalProduits})
          </h2>
          <Link href="/ebooks"
            className="g-lien flex-shrink-0 text-[14.5px]">
            Voir le catalogue <ArrowRight size={13} />
          </Link>
        </div>

        {totalProduits > 1 && (
          <div className="relative mb-6">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher parmi mes produits…"
              className="w-full pl-10 pr-4 py-2.5 bg-[var(--g-doux)] border border-transparent rounded-[10px] text-sm text-[var(--g-encre)] placeholder-[#a9aeb5] focus:outline-none focus:border-[var(--g-encre)] focus:bg-white transition-colors"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            {searchQuery && (
              <button onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
            )}
          </div>
        )}

        {downloadError && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl mb-4">
            <AlertCircle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-600 text-xs">{downloadError}</p>
          </div>
        )}

        {totalProduits === 0 ? (
          <div className="text-center py-12 bg-[var(--g-doux)] rounded-2xl">
            <BookOpen size={36} className="text-[var(--g-gris)] mx-auto mb-4" />
            <h3 className="text-[var(--g-encre)] font-semibold mb-2">Aucun produit acheté</h3>
            <p className="text-gray-600 text-sm mb-5">Vos ebooks et formations apparaîtront ici après achat.</p>
            <Link href="/ebooks"
              className="g-btn !text-[14px]">
              Découvrir les produits <ArrowRight size={13} />
            </Link>
          </div>
        ) : totalFiltered === 0 ? (
          <div className="text-center py-10 bg-gray-50 border border-gray-100 rounded-2xl">
            <p className="text-gray-500 text-sm">Aucun produit ne correspond à &ldquo;{searchQuery}&rdquo;.</p>
          </div>
        ) : (
          <div className="space-y-8">

            {/* Message erreur sauvegarde hors-ligne */}
            {offlineError && (
              <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                <XCircle size={15} className="flex-shrink-0" />
                <span>{offlineError}</span>
                <button onClick={() => setOfflineError(null)} className="ml-auto text-red-400 hover:text-red-700">×</button>
              </div>
            )}

            {/* Ebooks */}
            {ebooksFiltered.length > 0 && (
              <div>
                <h3 className="text-[14px] font-semibold text-[var(--g-vert)] mb-3 flex items-center gap-2">
                  <BookOpen size={14} className="text-[var(--g-vert)]" /> Ebooks ({ebooksFiltered.length})
                </h3>
                <div className="space-y-3">
                  {ebooksFiltered.map((ebook) => {
                    const wUrl = getEbookWhatsappUrl(ebook.id);
                    const audioUrl = getEbookAudioUrl(ebook.id);
                    const ebookSlug = getEbookSlug(ebook.id);
                    const existingReview = userReviews.find((r) => r.productId === ebook.id) ?? null;
                    return (
                      <div key={ebook.id} className="border border-gray-200 rounded-xl overflow-hidden">
                        {/* Ligne principale */}
                        <div className="flex items-center gap-4 p-4 bg-gray-50">
                          <div className="w-10 h-10 rounded-lg bg-[var(--g-vert-doux)] flex items-center justify-center flex-shrink-0">
                            <BookOpen size={18} className="text-[var(--g-vert)]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-gray-900 text-sm font-semibold line-clamp-1">{ebook.title}</p>
                            <p className="text-gray-500 text-xs">{ebook.category} · {ebook.pages} pages · <span className="text-[var(--g-encre)] font-medium">{formatPrice(ebook.price)}</span></p>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-1.5 flex-shrink-0">
                            <Link href={`/ebooks/${ebookSlug}`}
                              className="flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-gray-100 border border-gray-200 text-gray-800 text-xs font-bold rounded-lg transition-colors">
                              <ExternalLink size={11} /> Accéder
                            </Link>
                            <button
                              onClick={() => handleDownload(ebook.id)}
                              disabled={fetchingToken === ebook.id || !isOnline}
                              className="flex items-center gap-1 px-3 py-1.5 bg-[var(--g-jaune)] hover:bg-[var(--g-jaune-fonce)] disabled:opacity-60 text-[var(--g-encre)] text-xs font-semibold rounded-lg transition-colors">
                              {fetchingToken === ebook.id
                                ? <span className="w-3 h-3 border border-black/30 border-t-black rounded-full animate-spin" />
                                : <Download size={11} />}
                              Télécharger
                            </button>
                          </div>
                        </div>

                        {/* Accès hors-ligne */}
                        <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex items-center gap-2 min-h-[36px]">
                          {offlinePdfs[ebook.id] ? (
                            <>
                              <CheckCircle size={11} className="text-emerald-500 flex-shrink-0" />
                              <span className="text-xs text-emerald-600 font-medium flex-1">Sauvegardé hors-ligne</span>
                              <button
                                onClick={() => openOfflineEbook(ebook.id)}
                                className="px-2 py-1 text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors">
                                Lire
                              </button>
                              <button
                                onClick={() => deleteOfflineEbook(ebook.id)}
                                className="px-2 py-1 text-xs text-red-500 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors">
                                Supprimer
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => saveEbookOffline(ebook.id, ebook.title)}
                              disabled={savingOffline === ebook.id || !isOnline}
                              className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-700 disabled:opacity-40 transition-colors">
                              {savingOffline === ebook.id
                                ? <span className="w-3 h-3 border border-gray-400 border-t-gray-600 rounded-full animate-spin" />
                                : <Download size={11} />}
                              {savingOffline === ebook.id ? "Sauvegarde en cours…" : "Sauvegarder hors-ligne"}
                            </button>
                          )}
                        </div>

                        {/* Version audio */}
                        {audioUrl && (
                          <EbookAudioPlayer url={audioUrl} title={ebook.title} />
                        )}

                        {/* Communauté WhatsApp */}
                        {wUrl && (
                          <div className="px-4 pb-3 bg-gray-50 border-t border-gray-100">
                            <a href={wUrl} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-2 w-full py-2 px-3 bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-[#25D366] text-xs font-bold rounded-lg transition-colors">
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                              Rejoindre la communauté WhatsApp
                            </a>
                          </div>
                        )}

                        {/* Toggles motivation / avis */}
                        <div className="flex border-t border-gray-100 bg-white">
                          <button
                            onClick={() => setMotivationOpen((prev) => ({ ...prev, [ebook.id]: !prev[ebook.id] }))}
                            className="flex-1 py-2 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1">
                            <PenLine size={12} /> Ma motivation
                            {motivationOpen[ebook.id] ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                          </button>
                          <div className="w-px bg-gray-100" />
                          <button
                            onClick={() => setReviewOpen((prev) => ({ ...prev, [ebook.id]: !prev[ebook.id] }))}
                            className="flex-1 py-2 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1">
                            <Star size={12} /> {existingReview ? "Mon avis" : "Donner un avis"}
                            {reviewOpen[ebook.id] ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                          </button>
                        </div>

                        {motivationOpen[ebook.id] && (
                          <div className="p-4 border-t border-gray-100 bg-white">
                            <ProductMotivationForm
                              productId={ebook.id}
                              productLabel={ebook.title}
                              onSaved={() => setMotivationOpen((prev) => ({ ...prev, [ebook.id]: false }))}
                            />
                          </div>
                        )}
                        {reviewOpen[ebook.id] && (
                          <div className="p-4 border-t border-gray-100 bg-white">
                            <ProductReviewForm
                              productId={ebook.id}
                              productType="ebook"
                              userId={currentUser.id}
                              userName={`${currentUser.firstName} ${currentUser.lastName}`}
                              existingReview={existingReview}
                              onReviewSubmitted={(r) => setUserReviews((prev) => [...prev, r])}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Formations */}
            {formationsFiltered.length > 0 && (
              <div>
                <h3 className="text-[14px] font-semibold text-[var(--g-vert)] mb-3 flex items-center gap-2">
                  <Play size={14} className="text-blue-600" /> Formations ({formationsFiltered.length})
                </h3>
                <div className="space-y-3">
                  {formationsFiltered.map((formation) => {
                    const existingReview = userReviews.find((r) => r.productId === formation.id) ?? null;
                    return (
                      <div key={formation.id} className="border border-gray-200 rounded-xl overflow-hidden">
                        {/* Ligne principale */}
                        <div className="flex items-center gap-4 p-4 bg-blue-50/40">
                          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                            <Play size={18} className="text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-gray-900 text-sm font-semibold line-clamp-1">{formation.titre}</p>
                            <p className="text-blue-600 text-xs font-medium">Formation débloquée</p>
                          </div>
                          <Link href={`/formation/${formation.id}/watch`}
                            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors flex-shrink-0">
                            <Play size={12} /> Visionner
                          </Link>
                        </div>

                        {/* Communauté WhatsApp */}
                        {formation.whatsappUrl && (
                          <div className="px-4 pb-3 bg-blue-50/40 border-t border-blue-100/50">
                            <a href={formation.whatsappUrl} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-2 w-full py-2 px-3 bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-[#25D366] text-xs font-bold rounded-lg transition-colors">
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                              Rejoindre la communauté WhatsApp
                            </a>
                          </div>
                        )}

                        {/* Toggles */}
                        <div className="flex border-t border-gray-100 bg-white">
                          <button
                            onClick={() => setMotivationOpen((prev) => ({ ...prev, [formation.id]: !prev[formation.id] }))}
                            className="flex-1 py-2 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1">
                            <PenLine size={12} /> Ma motivation
                            {motivationOpen[formation.id] ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                          </button>
                          <div className="w-px bg-gray-100" />
                          <button
                            onClick={() => setReviewOpen((prev) => ({ ...prev, [formation.id]: !prev[formation.id] }))}
                            className="flex-1 py-2 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1">
                            <Star size={12} /> {existingReview ? "Mon avis" : "Donner un avis"}
                            {reviewOpen[formation.id] ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                          </button>
                        </div>

                        {motivationOpen[formation.id] && (
                          <div className="p-4 border-t border-gray-100 bg-white">
                            <ProductMotivationForm
                              productId={formation.id}
                              productLabel={formation.titre}
                              onSaved={() => setMotivationOpen((prev) => ({ ...prev, [formation.id]: false }))}
                            />
                          </div>
                        )}
                        {reviewOpen[formation.id] && (
                          <div className="p-4 border-t border-gray-100 bg-white">
                            <ProductReviewForm
                              productId={formation.id}
                              productType="formation"
                              userId={currentUser.id}
                              userName={`${currentUser.firstName} ${currentUser.lastName}`}
                              existingReview={existingReview}
                              onReviewSubmitted={(r) => setUserReviews((prev) => [...prev, r])}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      <EspaceMarketing achetes={ebooksPurchased} tous={allEbooks} />

      {/* ── Mes Favoris ── */}
      {(savedEbooksList.length > 0 || savedFormationsList.length > 0) && (
        <section className="bg-white border border-[var(--g-ligne)] rounded-[18px] p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[var(--g-encre)] text-[22px] font-semibold tracking-[-0.02em] flex items-center gap-2">
              <Bookmark size={20} className="text-[var(--g-vert)]" />
              Mes Favoris ({savedEbooksList.length + savedFormationsList.length})
            </h2>
            <Link href="/ebooks"
              className="g-lien flex-shrink-0 text-[14.5px]">
              Explorer <ArrowRight size={13} />
            </Link>
          </div>

          <div className="space-y-6">
            {savedEbooksList.length > 0 && (
              <div>
                <h3 className="text-[14px] font-semibold text-[var(--g-vert)] mb-3 flex items-center gap-2">
                  <BookOpen size={14} className="text-[var(--g-vert)]" /> Ebooks ({savedEbooksList.length})
                </h3>
                <div className="space-y-2">
                  {savedEbooksList.map((ebook) => {
                    const ebookSlug = getEbookSlug(ebook.id);
                    return (
                      <div key={ebook.id} className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-xl">
                        <div className="w-9 h-9 rounded-lg bg-[var(--g-vert-doux)] flex items-center justify-center flex-shrink-0">
                          <BookOpen size={16} className="text-[var(--g-vert)]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-900 text-sm font-semibold line-clamp-1">{ebook.title}</p>
                          <p className="text-gray-500 text-xs">{ebook.category} · {formatPrice(ebook.price)}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Link href={`/ebooks/${ebookSlug}`}
                            className="px-3 py-1.5 bg-[var(--g-jaune)] hover:bg-[var(--g-jaune-fonce)] text-[var(--g-encre)] text-xs font-semibold rounded-lg transition-colors">
                            Voir
                          </Link>
                          <button
                            onClick={() => userStore.toggleWishlist(ebook.id, "ebook")}
                            title="Retirer des favoris"
                            className="p-1.5 text-gray-400 hover:text-red-500 transition-colors">
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {savedFormationsList.length > 0 && (
              <div>
                <h3 className="text-[14px] font-semibold text-[var(--g-vert)] mb-3 flex items-center gap-2">
                  <Play size={14} className="text-blue-600" /> Formations ({savedFormationsList.length})
                </h3>
                <div className="space-y-2">
                  {savedFormationsList.map((formation) => (
                    <div key={formation.id} className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-xl">
                      <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <Play size={16} className="text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-900 text-sm font-semibold line-clamp-1">{formation.titre}</p>
                        <p className="text-blue-600 text-xs font-medium">Formation</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Link href={`/formation/${formation.id}`}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors">
                          Voir
                        </Link>
                        <button
                          onClick={() => userStore.toggleWishlist(formation.id, "formation")}
                          title="Retirer des favoris"
                          className="p-1.5 text-gray-400 hover:text-red-500 transition-colors">
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Consultants disponibles ── */}
      <section className="bg-white border border-[var(--g-ligne)] rounded-[18px] p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[var(--g-encre)] text-[22px] font-semibold tracking-[-0.02em] flex items-center gap-2">
            <Users size={20} className="text-[var(--g-vert)]" />
            Nos consultants disponibles ({consultants.length})
          </h2>
          <Link href="/accompagnement"
            className="g-lien flex-shrink-0 text-[14.5px]">
            Voir les programmes <ArrowRight size={13} />
          </Link>
        </div>

        {consultants.length === 0 ? (
          <div className="text-center py-10 bg-[var(--g-doux)] rounded-2xl">
            <User size={32} className="text-[var(--g-gris)] mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Aucun consultant disponible pour le moment.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {consultants.map((consultant) => {
              const domainesConsultant = espacesActifs
                .filter((e) => consultant.domainesIds.includes(e.id))
                .map((e) => e.titre);
              return (
                <div key={consultant.id}
                  className="p-5 bg-white border border-[var(--g-ligne)] rounded-[16px] hover:border-[var(--g-gris-clair)] transition-colors">
                  <div className="w-12 h-12 rounded-full bg-[var(--g-vert-doux)] flex items-center justify-center mb-4 text-lg font-semibold text-[var(--g-vert)]">
                    {consultant.prenom.charAt(0).toUpperCase()}
                  </div>
                  <h3 className="text-[var(--g-encre)] font-semibold mb-1">{consultant.prenom}</h3>
                  <p className="text-gray-500 text-xs mb-3">Consultant SMART LIFE</p>

                  <div className="flex gap-3 mb-3">
                    <div className="text-center">
                      <p className="text-[var(--g-encre)] font-semibold text-lg tabular-nums">{consultant.clientsAccompa}</p>
                      <p className="text-gray-600 text-xs">Clients</p>
                    </div>
                    <div className="w-px bg-gray-200" />
                    <div className="text-center">
                      <p className="text-[var(--g-encre)] font-semibold text-lg tabular-nums">{consultant.entreprisesAccompa}</p>
                      <p className="text-gray-600 text-xs">Entreprises</p>
                    </div>
                  </div>

                  {domainesConsultant.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {domainesConsultant.slice(0, 3).map((d) => (
                        <span key={d}
                          className="px-2 py-0.5 bg-[var(--g-doux)] text-[var(--g-gris)] text-xs rounded-md truncate max-w-[120px]">
                          {d}
                        </span>
                      ))}
                      {domainesConsultant.length > 3 && (
                        <span className="text-gray-600 text-xs">+{domainesConsultant.length - 3}</span>
                      )}
                    </div>
                  )}

                  <div className="mt-4">
                    <span className="flex items-center gap-1.5 text-xs font-medium text-[var(--g-vert)]">
                      <span className="w-2 h-2 rounded-full bg-[var(--g-vert-vif)]" />
                      Disponible
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Candidature Consultant ── */}
      <section className="bg-white border border-[var(--g-ligne)] rounded-[18px] p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[var(--g-encre)] text-[22px] font-semibold tracking-[-0.02em] flex items-center gap-2">
            <Star size={20} className="text-[var(--g-vert)]" />
            Devenir Consultant
          </h2>
          {candidaturesConsultant.length === 0 && (
            <Link href="/devenir-consultant"
              className="g-lien flex-shrink-0 text-[14.5px]">
              Postuler <ArrowRight size={13} />
            </Link>
          )}
        </div>

        {candidaturesConsultant.length === 0 ? (
          <div className="p-6 bg-[var(--g-jaune-doux)] rounded-[16px] flex flex-col sm:flex-row items-center gap-5">
            <div className="w-14 h-14 rounded-[14px] bg-white flex items-center justify-center flex-shrink-0">
              <Star size={24} className="text-[var(--g-vert)]" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-[var(--g-encre)] font-semibold tracking-[-0.01em] mb-1">Rejoignez notre réseau de consultants</h3>
              <p className="text-gray-600 text-sm">
                Vous avez une expertise entrepreneuriale ? Postulez pour accompagner nos membres.
                Votre profil sera validé par notre équipe avant publication.
              </p>
            </div>
            <Link href="/devenir-consultant"
              className="g-btn g-btn-noir flex-shrink-0 !text-[14px]">
              Postuler maintenant
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {candidaturesConsultant.map((cc) => (
              <div key={cc.id} className="p-6 bg-white border border-[var(--g-ligne)] rounded-[16px]">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-[14px] bg-[var(--g-vert-doux)] flex items-center justify-center text-[var(--g-vert)] font-semibold text-xl flex-shrink-0">
                      {cc.prenom.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-[var(--g-encre)] font-semibold">{cc.prenom} {cc.nom}</h3>
                      <p className="text-gray-600 text-xs">
                        Candidature envoyée le{" "}
                        {new Date(cc.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                  <StatutBadge statut={cc.statut} />
                </div>

                {cc.statut === "en_attente" && (
                  <p className="text-gray-600 text-xs flex items-center gap-1">
                    <Clock size={11} /> Notre équipe examine votre candidature. Vous serez contacté(e) sous 48–72h.
                  </p>
                )}

                {cc.noteAdmin && (
                  <div className={`p-4 rounded-xl border text-sm mt-3 ${
                    cc.statut === "validee"
                      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                      : "bg-red-50 border-red-200 text-red-600"
                  }`}>
                    <p className="text-xs opacity-70 mb-1">Message de l&apos;administrateur :</p>
                    {cc.noteAdmin}
                  </div>
                )}

                {cc.statut === "validee" && (
                  <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2">
                    <CheckCircle size={15} className="text-emerald-600" />
                    <p className="text-emerald-700 text-xs font-medium">
                      Votre profil est maintenant visible dans la section consultants.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Programmes disponibles ── */}
      <section className="bg-white border border-[var(--g-ligne)] rounded-[18px] p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[var(--g-encre)] text-[22px] font-semibold tracking-[-0.02em] flex items-center gap-2">
            <ArrowRight size={20} className="text-[var(--g-vert)]" />
            Programmes d&apos;accompagnement ({espacesActifs.length})
          </h2>
          <Link href="/accompagnement"
            className="g-lien flex-shrink-0 text-[14.5px]">
            Tout voir <ArrowRight size={13} />
          </Link>
        </div>

        {espacesActifs.length === 0 ? (
          <div className="text-center py-10 bg-[var(--g-doux)] rounded-2xl">
            <p className="text-gray-500 text-sm">Aucun programme disponible pour le moment.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {espacesActifs.map((espace) => {
              const dejaPostule = demandesFinales.some((d) => d.espaceId === espace.id);
              return (
                <div key={espace.id} className="p-5 bg-[var(--g-doux)] border border-transparent rounded-[16px] hover:border-[var(--g-ligne)] transition-colors flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-[var(--g-encre)] font-semibold text-sm leading-tight">{espace.titre}</h3>
                    <span className="text-[11px] px-2 py-0.5 bg-white text-[var(--g-gris)] rounded-md whitespace-nowrap flex-shrink-0">{espace.domaine}</span>
                  </div>
                  {espace.descriptionCourte && (
                    <p className="text-gray-500 text-xs line-clamp-2 flex-1">{espace.descriptionCourte}</p>
                  )}
                  <div className="flex items-center justify-between mt-auto pt-1">
                    <span className="text-xs text-gray-600">{espace.placesDisponibles} place{espace.placesDisponibles > 1 ? "s" : ""}</span>
                    {dejaPostule ? (
                      <span className="flex items-center gap-1.5 text-[var(--g-vert)] text-xs font-medium">
                        <CheckCircle size={12} /> Postulé
                      </span>
                    ) : (
                      <Link href={`/accompagnement/${espace.id}`}
                        className="inline-flex items-center gap-1 px-4 py-1.5 bg-[var(--g-vert)] hover:bg-[var(--g-vert-profond)] text-white text-xs font-semibold rounded-lg transition-colors">
                        Postuler <ArrowRight size={12} />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Mes candidatures ── */}
      <section className="bg-white border border-[var(--g-ligne)] rounded-[18px] p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[var(--g-encre)] text-[22px] font-semibold tracking-[-0.02em]">
            Mes candidatures ({demandes.length})
          </h2>
          <Link href="/accompagnement"
            className="g-lien flex-shrink-0 text-[14.5px]">
            Voir les espaces <ArrowRight size={14} />
          </Link>
        </div>

        {demandes.length === 0 ? (
          <div className="text-center py-14 bg-[var(--g-doux)] rounded-2xl">
            <ClipboardList size={36} className="text-[var(--g-vert)] mx-auto mb-4" />
            <h3 className="text-[var(--g-encre)] font-semibold tracking-[-0.01em] text-lg mb-2">Aucune candidature</h3>
            <p className="text-gray-600 mb-5 text-sm">
              Postulez à un espace d&apos;accompagnement pour le voir ici.
            </p>
            <Link href="/accompagnement"
              className="g-btn !text-[14px]">
              Explorer les espaces <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {demandes.map((d) => (
              <div key={d.id} className="p-6 bg-white border border-[var(--g-ligne)] rounded-[16px]">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-[var(--g-encre)] font-semibold tracking-[-0.01em] text-lg mb-1">{d.espaceTitre}</h3>
                    <p className="text-gray-600 text-xs">
                      Soumise le{" "}
                      {new Date(d.createdAt).toLocaleDateString("fr-FR", {
                        day: "numeric", month: "long", year: "numeric",
                      })}
                    </p>
                  </div>
                  <StatutBadge statut={d.statut} />
                </div>

                <div className="p-4 bg-gray-50 rounded-xl mb-4">
                  <p className="text-gray-600 text-xs mb-1">Votre message</p>
                  <p className="text-gray-700 text-sm leading-relaxed">{d.message}</p>
                </div>

                {d.noteAdmin && (
                  <div className={`p-4 rounded-xl border text-sm mb-4 ${
                    d.statut === "validee"
                      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                      : "bg-red-50 border-red-200 text-red-600"
                  }`}>
                    <p className="text-xs opacity-70 mb-1">Réponse de l&apos;administrateur :</p>
                    {d.noteAdmin}
                  </div>
                )}

                {d.statut === "en_attente" && (
                  <p className="text-gray-600 text-xs flex items-center gap-1">
                    <Clock size={11} /> Notre équipe vous contactera sous 48–72h.
                  </p>
                )}

                {d.statut === "rejetee" && (
                  <Link href={`/accompagnement/${d.espaceSlug}`}
                    className="g-lien text-xs">
                    Repostuler <ArrowRight size={12} />
                  </Link>
                )}

                {d.statut === "validee" && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    {d.noteConsultant ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <StarRating value={d.noteConsultant} readonly />
                          <span className="text-[var(--g-gris)] text-sm font-medium">{NOTE_LABELS[d.noteConsultant]}</span>
                          <span className="text-gray-600 text-xs ml-auto">
                            {d.avisDate
                              ? new Date(d.avisDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
                              : ""}
                          </span>
                        </div>
                        {d.avisClient && (
                          <p className="text-gray-600 text-sm bg-gray-50 rounded-xl p-3 leading-relaxed">
                            &ldquo;{d.avisClient}&rdquo;
                          </p>
                        )}
                      </div>
                    ) : (
                      <>
                        <button onClick={() => setAvisOuvert(avisOuvert === d.id ? null : d.id)}
                          className="flex items-center gap-2 text-sm text-[var(--g-vert)] hover:underline underline-offset-4 font-semibold">
                          <Star size={15} />
                          {avisOuvert === d.id ? "Fermer ▲" : "Donner mon avis sur ce programme ▼"}
                        </button>
                        {avisOuvert === d.id && (
                          <AvisForm demandeId={d.id} espaceTitre={d.espaceTitre} />
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Footer CTA Accompagnement ── */}
      <section className="p-6 sm:p-8 bg-[var(--g-vert-doux)] rounded-[18px] text-center">
        <h2 className="text-[var(--g-encre)] text-[24px] font-semibold tracking-[-0.02em] mb-2">Prêt à aller plus loin ?</h2>
        <p className="text-gray-600 text-sm mb-6 max-w-md mx-auto leading-relaxed">
          Nos experts en accompagnement entrepreneurial vous guident de la création à la mise en œuvre de votre projet.
          Découvrez nos 8 programmes personnalisés.
        </p>
        {!isOnline && (
          <p className="text-amber-700 text-xs font-medium mb-4 flex items-center justify-center gap-1.5">
            <WifiOff size={12} /> Une connexion Internet est requise pour accéder au paiement et à l&apos;accompagnement.
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/accompagnement"
            onClick={(e) => { if (!isOnline) { e.preventDefault(); } }}
            className={`g-btn !text-[14px] ${!isOnline ? "opacity-50 cursor-not-allowed" : ""}`}>
            Postuler pour un accompagnement <ArrowRight size={14} />
          </Link>
          <Link href="/nos-consultants"
            onClick={(e) => { if (!isOnline) { e.preventDefault(); } }}
            className={`g-btn-ghost bg-white !text-[14px] ${!isOnline ? "opacity-50 cursor-not-allowed" : ""}`}>
            Voir nos consultants
          </Link>
        </div>
      </section>

    </div>

    {/* ── Lecteur PDF hors-ligne ── */}
    {pdfReader && (
      <div className="fixed inset-0 z-50 bg-gray-950 flex flex-col">
        <div className="flex items-center gap-3 px-4 py-3 bg-gray-900 border-b border-gray-800 flex-shrink-0">
          <button
            onClick={closePdfReader}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg transition-colors"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
          <span className="text-white text-sm font-medium flex-1 truncate">{pdfReader.title}</span>
          <a
            href={pdfReader.url}
            download={`${pdfReader.title}.pdf`}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 rounded-lg transition-colors"
          >
            <Download size={12} /> Télécharger
          </a>
        </div>
        <embed
          src={pdfReader.url}
          type="application/pdf"
          className="flex-1 w-full border-0 bg-white"
        />
      </div>
    )}
    </>
  );
}
