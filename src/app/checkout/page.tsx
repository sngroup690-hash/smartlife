"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useCartStore } from "@/lib/store";
import { useUserStore } from "@/lib/user-store";
import { formatPrice } from "@/lib/data";
import { PriceTag } from "@/components/PriceTag";
import { useCurrencyStore } from "@/lib/currency-store";
import {
  Lock, ShoppingCart, AlertCircle, CreditCard, Monitor,
  CheckCircle, Clock, Trash2, Tag, X as XIcon, ChevronDown, ChevronRight
} from "lucide-react";
import { PaymentBadges } from "@/components/PaymentBadges";
import Link from "next/link";
import { pixelAddToCart, pixelInitiateCheckout } from "@/lib/pixel-events";
import { detectOperator } from "@/lib/operator-detection";
import { geoFromPhone } from "@/lib/phone-geo";

type Operator = { id: string; label: string; color: string };
type Country = { code: string; name: string; operators: Operator[] };

const SEBPAY_COUNTRIES: Country[] = [
  { code: "CM", name: "🇨🇲 Cameroun", operators: [
    { id: "orange", label: "Orange", color: "bg-orange-500 text-white" },
    { id: "mtn",    label: "MTN",    color: "bg-yellow-400 text-yellow-900" },
  ]},
  { code: "CG", name: "🇨🇬 Congo-Brazzaville", operators: [
    { id: "mtn",    label: "MTN",    color: "bg-yellow-400 text-yellow-900" },
    { id: "airtel", label: "Airtel", color: "bg-red-500 text-white" },
  ]},
  { code: "GA", name: "🇬🇦 Gabon", operators: [
    { id: "airtel", label: "Airtel", color: "bg-red-500 text-white" },
    { id: "moov",   label: "Moov",   color: "bg-blue-500 text-white" },
  ]},
  { code: "CD", name: "🇨🇩 RD Congo", operators: [
    { id: "airtel", label: "Airtel",  color: "bg-red-500 text-white" },
    { id: "orange", label: "Orange",  color: "bg-orange-500 text-white" },
    { id: "mpesa",  label: "M-Pesa",  color: "bg-green-600 text-white" },
  ]},
  { code: "TD", name: "🇹🇩 Tchad", operators: [
    { id: "airtel", label: "Airtel", color: "bg-red-500 text-white" },
    { id: "moov",   label: "Moov",   color: "bg-blue-500 text-white" },
  ]},
  { code: "BJ", name: "🇧🇯 Bénin", operators: [
    { id: "mtn",  label: "MTN",  color: "bg-yellow-400 text-yellow-900" },
    { id: "moov", label: "Moov", color: "bg-blue-500 text-white" },
  ]},
  { code: "BF", name: "🇧🇫 Burkina Faso", operators: [
    { id: "orange", label: "Orange", color: "bg-orange-500 text-white" },
    { id: "moov",   label: "Moov",   color: "bg-blue-500 text-white" },
  ]},
  { code: "CI", name: "🇨🇮 Côte d'Ivoire", operators: [
    { id: "mtn",    label: "MTN",    color: "bg-yellow-400 text-yellow-900" },
    { id: "orange", label: "Orange", color: "bg-orange-500 text-white" },
    { id: "wav",    label: "Wave",   color: "bg-sky-500 text-white" },
    { id: "moov",   label: "Moov",   color: "bg-blue-500 text-white" },
  ]},
  { code: "GM", name: "🇬🇲 Gambie", operators: [
    { id: "africell", label: "Africell", color: "bg-purple-500 text-white" },
  ]},
  { code: "GN", name: "🇬🇳 Guinée", operators: [
    { id: "mtn",    label: "MTN",    color: "bg-yellow-400 text-yellow-900" },
    { id: "orange", label: "Orange", color: "bg-orange-500 text-white" },
  ]},
  { code: "GW", name: "🇬🇼 Guinée-Bissau", operators: [
    { id: "mtn",    label: "MTN",    color: "bg-yellow-400 text-yellow-900" },
    { id: "orange", label: "Orange", color: "bg-orange-500 text-white" },
  ]},
  { code: "ML", name: "🇲🇱 Mali", operators: [
    { id: "orange", label: "Orange", color: "bg-orange-500 text-white" },
    { id: "moov",   label: "Moov",   color: "bg-blue-500 text-white" },
  ]},
  { code: "NE", name: "🇳🇪 Niger", operators: [
    { id: "airtel", label: "Airtel", color: "bg-red-500 text-white" },
    { id: "moov",   label: "Moov",   color: "bg-blue-500 text-white" },
  ]},
  { code: "SN", name: "🇸🇳 Sénégal", operators: [
    { id: "orange", label: "Orange", color: "bg-orange-500 text-white" },
    { id: "wav",    label: "Wave",   color: "bg-sky-500 text-white" },
    { id: "free",   label: "Free",   color: "bg-red-600 text-white" },
  ]},
  { code: "TG", name: "🇹🇬 Togo", operators: [
    { id: "togocom", label: "Togocom", color: "bg-green-600 text-white" },
    { id: "moov",    label: "Moov",    color: "bg-blue-500 text-white" },
  ]},
];

const OPERATOR_LOGOS: Record<string, string> = {
  orange: "/payment-logos/orange-money.png",
  mtn:    "/payment-logos/mtn-momo.png",
  wav:    "/payment-logos/wave.png",
};

const OPERATOR_LABELS: Record<string, string> = {
  orange:   "Orange Money",
  mtn:      "MTN Mobile Money",
  wav:      "Wave",
  moov:     "Moov Money",
  airtel:   "Airtel Money",
  mpesa:    "M-Pesa",
  free:     "Free Money",
  africell: "Africell Money",
  togocom:  "Togocom Money",
};

function maskPhone(p: string): string {
  if (!p) return "";
  const c = p.replace(/[\s\-().+]/g, "");
  if (c.length <= 4) return "••••";
  return c.slice(0, 3) + "•".repeat(Math.max(0, c.length - 5)) + c.slice(-2);
}

function CheckoutContent() {
  const searchParams = useSearchParams();
  const { items, totalPrice, clearCart, removeItem } = useCartStore();
  const {
    isLoggedIn, currentUser,
    ajouterEbooksAchetes, setPendingEbookIds,
    ajouterFormationsAchetees, setPendingFormationIds,
    loginFromServer,
  } = useUserStore();
  const convert = useCurrencyStore((s) => s.convert);

  const [loading, setLoading] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  const [gateway, setGateway] = useState<"CINETPAY" | "SEBPAY">("CINETPAY");
  const [gatewayCfg, setGatewayCfg] = useState<{ cinetpay: boolean; sebpay: boolean }>({ cinetpay: true, sebpay: true });
  useEffect(() => {
    fetch("/api/gateway-config").then((r) => r.json()).then((cfg) => {
      setGatewayCfg(cfg);
      if (!cfg.cinetpay && cfg.sebpay) setGateway("SEBPAY");
      if (cfg.cinetpay && !cfg.sebpay) setGateway("CINETPAY");
    }).catch(() => {});
  }, []);

  const [geoCountryCode, setGeoCountryCode] = useState<string | null>(null);
  const geoFetchedRef = useRef(false);
  const [gatewayManual, setGatewayManual] = useState(false);
  const [countryManual, setCountryManual] = useState(false);
  const [operatorManual, setOperatorManual] = useState(false);

  useEffect(() => {
    if (geoFetchedRef.current) return;
    geoFetchedRef.current = true;
    fetch("/api/geo")
      .then((r) => r.json())
      .then((geo: { countryCode?: string }) => {
        if (!geo?.countryCode) return;
        const cc = geo.countryCode;
        setGeoCountryCode(cc);
        const isSebpay = SEBPAY_COUNTRIES.some((c) => c.code === cc);
        if (isSebpay && !gatewayManual) {
          setGateway("SEBPAY");
          if (!countryManual) setSebpayCountry(cc);
        }
      })
      .catch(() => {});
  }, []); // eslint-disable-line

  const [phone, setPhone] = useState(currentUser?.phone ?? "");
  const [packItems, setPackItems] = useState<Array<{ type: "ebook" | "formation"; id: string; title: string }>>([]);

  const [regFirstName, setRegFirstName] = useState("");
  const [regLastName, setRegLastName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regError, setRegError] = useState("");

  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoLabel, setPromoLabel] = useState("");
  const [promoInput, setPromoInput] = useState("");
  const [promoValidating, setPromoValidating] = useState(false);
  const [promoError, setPromoError] = useState("");
  const [activePromoCode, setActivePromoCode] = useState("");
  const [promoOpen, setPromoOpen] = useState(false);

  const [referralCode, setReferralCode] = useState("");
  const [referralParrainName, setReferralParrainName] = useState("");

  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [loyaltyLoaded, setLoyaltyLoaded] = useState(false);
  const [loyaltyGenerating, setLoyaltyGenerating] = useState(false);

  const [alreadyOwnedNames, setAlreadyOwnedNames] = useState<string[]>([]);
  const [ownershipChecking, setOwnershipChecking] = useState(false);

  // Orqex UI states
  const [headerOpen, setHeaderOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [methodPhone, setMethodPhone] = useState(currentUser?.phone ?? "");

  async function ensureAccount(): Promise<{ id: string; firstName: string; lastName: string; email: string; phone: string } | null> {
    if (isLoggedIn && currentUser) return currentUser;
    setRegError("");
    if (!regFirstName.trim()) { setRegError("Le prénom est requis."); return null; }
    if (!regLastName.trim()) { setRegError("Le nom est requis."); return null; }
    if (!regEmail.trim() || !regEmail.includes("@")) { setRegError("Adresse email invalide."); return null; }

    const res = await fetch("/api/auth/quick-register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: regFirstName.trim(),
        lastName:  regLastName.trim(),
        email:     regEmail.trim().toLowerCase(),
        phone:     methodPhone.trim() || phone.trim(),
      }),
    });

    const data = await res.json().catch(() => ({})) as {
      error?: string;
      user?: { id: string; firstName: string; lastName: string; email: string; phone: string; hasPassword: boolean };
    };

    if (!res.ok) { setRegError(data.error || "Erreur lors de la création du compte."); return null; }
    loginFromServer({ ...data.user!, hasPassword: false });
    return data.user!;
  }

  const [sebpayCountry, setSebpayCountry] = useState("CM");
  const [sebpayOperator, setSebpayOperator] = useState("");
  const [sebpayPending, setSebpayPending] = useState(false);
  const [sebpayRef, setSebpayRef] = useState("");
  const [sebpayElapsed, setSebpayElapsed] = useState(0);
  const [sebpayChecking, setSebpayChecking] = useState(false);

  useEffect(() => {
    if (!phone || phone.replace(/[\s\-().+]/g, "").length < 8) return;
    const detectedGeo = geoFromPhone(phone);
    const countryToUse = detectedGeo?.countryCode ?? geoCountryCode ?? sebpayCountry;
    if (!countryToUse) return;
    const isSebpay = SEBPAY_COUNTRIES.some((c) => c.code === countryToUse);
    if (isSebpay) {
      if (!countryManual) setSebpayCountry(countryToUse);
      if (!gatewayManual) setGateway("SEBPAY");
    }
    if (!operatorManual) {
      const op = detectOperator(phone, countryToUse);
      if (op) setSebpayOperator(op);
    }
  }, [phone]); // eslint-disable-line

  useEffect(() => {
    if (!sebpayPending || !sebpayRef) return;
    setSebpayElapsed(0);
    const interval = setInterval(async () => {
      setSebpayElapsed((prev) => {
        const next = prev + 5;
        if (next >= 60) clearInterval(interval);
        return next;
      });
      try {
        const res = await fetch(`/api/payment/sebpay?ref=${sebpayRef}`);
        const data = await res.json();
        if (data.confirmed) {
          clearInterval(interval);
          window.location.href = `/checkout/success?gateway=sebpay&ref=${sebpayRef}`;
        }
      } catch { /* retry */ }
    }, 5000);
    return () => clearInterval(interval);
  }, [sebpayPending, sebpayRef]);

  async function handleManualCheck() {
    if (!sebpayRef || sebpayChecking) return;
    setSebpayChecking(true);
    try {
      const res = await fetch(`/api/payment/sebpay?ref=${sebpayRef}`);
      const data = await res.json();
      if (data.confirmed) window.location.href = `/checkout/success?gateway=sebpay&ref=${sebpayRef}`;
      else setSebpayChecking(false);
    } catch { setSebpayChecking(false); }
  }

  const fid = searchParams.get("fid");
  const eid = searchParams.get("eid");
  const packId = searchParams.get("packId");
  const directTitre = searchParams.get("titre") ?? "Produit";
  const directPrix = parseInt(searchParams.get("prix") ?? "0", 10);
  const isDirectFormation = !!fid && directPrix > 0;
  const isDirectEbook = !!eid && directPrix > 0;
  const isDirectPack = !!packId && directPrix > 0;
  const isDirect = isDirectFormation || isDirectEbook || isDirectPack;

  useEffect(() => {
    if (!packId) return;
    fetch(`/api/packs?id=${packId}`)
      .then((r) => r.json())
      .then((d) => { if (d.pack?.items) setPackItems(d.pack.items); })
      .catch(() => {});
  }, [packId]);

  useEffect(() => {
    if (!isLoggedIn || !currentUser) return;
    if (isDirectPack && packItems.length === 0) return;
    checkOwnershipByEmail(currentUser.email);
  }, [isLoggedIn, currentUser?.email, packItems]); // eslint-disable-line

  const cartTotal = totalPrice();
  const total = isDirect ? directPrix : cartTotal;
  const referralDiscount = referralCode ? Math.round(total * 0.10) : 0;

  useEffect(() => {
    if (total <= 0) return;
    try {
      const raw = localStorage.getItem("sl_popup_promo");
      if (!raw) return;
      const p = JSON.parse(raw) as { type: "percent" | "fixed"; value: number; label?: string };
      const disc = p.type === "percent" ? Math.round(total * p.value / 100) : Math.min(p.value, total - 100);
      setPromoDiscount(Math.max(0, disc));
      setPromoLabel(p.label || "Réduction");
    } catch {}
  }, [total]);

  useEffect(() => {
    try {
      const cookieRef = document.cookie.split(";").find((c) => c.trim().startsWith("sl_ref="))?.split("=")[1]?.trim();
      if (!cookieRef) return;
      setReferralCode(cookieRef);
      fetch(`/api/referral?code=${encodeURIComponent(cookieRef)}`)
        .then((r) => r.json())
        .then((d) => { if (d.valid && d.displayName) setReferralParrainName(d.displayName); })
        .catch(() => {});
    } catch {}
  }, []);

  useEffect(() => {
    if (!isLoggedIn || !currentUser || loyaltyLoaded) return;
    fetch(`/api/loyalty?userId=${encodeURIComponent(currentUser.id)}`)
      .then((r) => r.json())
      .then((d) => { if (typeof d.points === "number") setLoyaltyPoints(d.points); })
      .catch(() => {})
      .finally(() => setLoyaltyLoaded(true));
  }, [isLoggedIn, currentUser, loyaltyLoaded]);

  const finalTotal = Math.max(100, total - promoDiscount - referralDiscount);

  useEffect(() => {
    if (total === 0) return;
    const title = isDirect ? directTitre : items.map((i) => i.title).join(", ");
    const id = fid ?? eid ?? "cart";
    pixelAddToCart(title, id, total);
    localStorage.setItem("sl_pending_amount", String(total));
    localStorage.setItem("sl_pending_ids", JSON.stringify(
      isDirect ? (fid ? [fid] : eid ? [eid] : []) : items.map((i) => i.id)
    ));
    if (isLoggedIn && currentUser) {
      fetch("/api/automations/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "cart_add", userId: currentUser.id, email: currentUser.email,
          firstName: currentUser.firstName || "",
          data: { productTitle: title, cartUrl: `${window.location.origin}/checkout` },
        }),
      }).catch(() => {});
    }
  }, [total]); // eslint-disable-line

  const redirectParam = isDirect
    ? `?redirect=${encodeURIComponent(`/checkout?${fid ? `fid=${fid}` : `eid=${eid}`}&titre=${directTitre}&prix=${directPrix}`)}`
    : "?redirect=/checkout";

  function buildNameMap(): Record<string, string> {
    if (isDirectPack) return Object.fromEntries(packItems.map((i) => [i.id, i.title]));
    if (isDirect) return { [eid ?? fid ?? ""]: directTitre };
    return Object.fromEntries(items.map((i) => [i.id, i.title]));
  }

  function buildOrderIds() {
    if (isDirectPack) {
      return {
        ebookIds: packItems.filter((i) => i.type === "ebook").map((i) => i.id),
        formationIds: packItems.filter((i) => i.type === "formation").map((i) => i.id),
      };
    }
    const ebookIds: string[] = isDirect ? (isDirectEbook ? [eid!] : []) : items.filter((i) => i.type === "ebook").map((i) => i.id);
    const formationIds: string[] = isDirect ? (isDirectFormation ? [fid!] : []) : items.filter((i) => i.type === "formation").map((i) => i.id);
    return { ebookIds, formationIds };
  }

  async function checkOwnershipByEmail(email: string) {
    const { ebookIds, formationIds } = buildOrderIds();
    if (!email || (ebookIds.length === 0 && formationIds.length === 0)) return;
    setOwnershipChecking(true);
    try {
      const params = new URLSearchParams({ email: email.trim().toLowerCase() });
      if (ebookIds.length) params.set("ebookIds", ebookIds.join(","));
      if (formationIds.length) params.set("formationIds", formationIds.join(","));
      const res = await fetch(`/api/user/check-owns?${params}`);
      if (!res.ok) return;
      const data = await res.json() as { owned: string[] };
      if (data.owned?.length > 0) {
        const nameMap = buildNameMap();
        setAlreadyOwnedNames(data.owned.map((id) => nameMap[id] ?? id));
      } else {
        setAlreadyOwnedNames([]);
      }
    } catch { /* silent */ }
    finally { setOwnershipChecking(false); }
  }

  async function validatePromoCode() {
    const code = promoInput.trim().toUpperCase();
    if (!code) return;
    setPromoValidating(true);
    setPromoError("");
    try {
      const res = await fetch("/api/promo/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, amount: total, isPack: isDirectPack }),
      });
      const data = await res.json() as { error?: string; discount?: number; label?: string; code?: string };
      if (!res.ok) { setPromoError(data.error || "Code invalide"); setPromoValidating(false); return; }
      setPromoDiscount(data.discount || 0);
      setPromoLabel(data.label || `Code ${code}`);
      setActivePromoCode(data.code || code);
      setPromoInput("");
      try { localStorage.removeItem("sl_popup_promo"); } catch {}
    } catch {
      setPromoError("Erreur de vérification. Réessayez.");
    }
    setPromoValidating(false);
  }

  async function applyLoyaltyPoints() {
    if (!currentUser || loyaltyPoints < 100) return;
    setLoyaltyGenerating(true);
    try {
      const res = await fetch("/api/loyalty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, pointsToUse: loyaltyPoints }),
      });
      const data = await res.json() as { code?: string; discount?: number; label?: string; error?: string };
      if (!res.ok || !data.code) { setPromoError(data.error || "Impossible d'utiliser les points."); return; }
      setPromoDiscount(Math.round(total * (data.discount || 0) / 100));
      setPromoLabel(data.label || "Fidélité");
      setActivePromoCode(data.code);
    } catch { setPromoError("Erreur. Réessayez."); }
    finally { setLoyaltyGenerating(false); }
  }

  function removePromoCode() {
    setActivePromoCode(""); setPromoDiscount(0); setPromoLabel(""); setPromoError("");
  }

  // ── Core payment functions ──

  async function doCinetPayCore(
    user: { id: string; firstName: string; lastName: string; email: string; phone: string },
    phoneNum: string,
    ch: "MOBILE_MONEY" | "CREDIT_CARD"
  ) {
    const reference = `SL-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    const { ebookIds, formationIds } = buildOrderIds();
    localStorage.setItem("sl_pending_amount", String(finalTotal));
    localStorage.setItem("sl_pending_ids", JSON.stringify([...ebookIds, ...formationIds]));
    pixelInitiateCheckout(finalTotal, "XAF", [...ebookIds, ...formationIds], ebookIds.length + formationIds.length || 1);
    setPendingEbookIds(ebookIds);
    setPendingFormationIds(formationIds);
    try {
      const res = await fetch("/api/payment/cinetpay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: finalTotal,
          customer: { firstName: user.firstName, lastName: user.lastName, email: user.email, phone: phoneNum.trim() },
          reference, channels: ch, userId: user.id, ebookIds, formationIds,
          ...(activePromoCode ? { promoCode: activePromoCode } : {}),
          ...(referralCode ? { referralCode } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || "Erreur lors de l'initiation du paiement");
      if (!isDirect) clearCart();
      try { localStorage.removeItem("sl_popup_promo"); } catch {}
      window.location.href = data.url;
    } catch (err) {
      setLoading(false);
      const msg = err instanceof Error ? err.message : "Erreur de connexion";
      if (msg.includes("non configuré") || msg.includes("manquant")) {
        const { ebookIds: eIds, formationIds: fIds } = buildOrderIds();
        if (eIds.length > 0) ajouterEbooksAchetes(eIds);
        if (fIds.length > 0) ajouterFormationsAchetees(fIds);
        if (!isDirect) clearCart();
        window.location.href = `/checkout/success?gateway=cinetpay&ref=${reference}`;
        return;
      }
      setPaymentError(msg);
    }
  }

  async function doSebpayCore(
    user: { id: string; firstName: string; lastName: string; email: string; phone: string },
    phoneNum: string,
    operator: string,
    country: string
  ) {
    const reference = `SL-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    const { ebookIds, formationIds } = buildOrderIds();
    localStorage.setItem("sl_pending_amount", String(finalTotal));
    localStorage.setItem("sl_pending_ids", JSON.stringify([...ebookIds, ...formationIds]));
    pixelInitiateCheckout(finalTotal, "XAF", [...ebookIds, ...formationIds], ebookIds.length + formationIds.length || 1);
    setPendingEbookIds(ebookIds);
    setPendingFormationIds(formationIds);
    try {
      const res = await fetch("/api/payment/sebpay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: finalTotal, phone: phoneNum.trim(), operator, country, reference,
          userId: user.id, ebookIds, formationIds,
          customerName: `${user.firstName} ${user.lastName}`.trim(),
          customerEmail: user.email, customerPhone: phoneNum.trim(),
          productNames: isDirect
            ? { ...(eid ? { [eid]: directTitre } : {}), ...(fid ? { [fid]: directTitre } : {}) }
            : Object.fromEntries(items.map(i => [i.id, i.title])),
          ...(activePromoCode ? { promoCode: activePromoCode } : {}),
          ...(referralCode ? { referralCode } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur Sebpay");
      if (!isDirect) clearCart();
      try { localStorage.removeItem("sl_popup_promo"); } catch {}
      if (data.provider_link) { window.location.href = data.provider_link; return; }
      setLoading(false);
      setSebpayRef(reference);
      setSebpayPending(true);
    } catch (err) {
      setLoading(false);
      setPaymentError(err instanceof Error ? err.message : "Erreur de connexion");
    }
  }

  async function handleMethodPay(method: string, phoneToUse: string) {
    setPaymentError("");
    if (!phoneToUse.trim()) { setPaymentError("Entrez votre numéro de téléphone."); return; }
    setLoading(true);
    const user = await ensureAccount();
    if (!user) { setLoading(false); return; }
    setPhone(phoneToUse);
    if (method === "card") {
      await doCinetPayCore(user, phoneToUse, "CREDIT_CARD");
    } else {
      await doSebpayCore(user, phoneToUse, method, sebpayCountry);
    }
  }

  // ── Empty cart ──
  if (!isDirect && items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-20 h-20 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center mb-6">
          <ShoppingCart size={36} className="text-gray-400" />
        </div>
        <h1 className="text-gray-900 text-2xl font-bold mb-2">Votre panier est vide</h1>
        <p className="text-gray-500 mb-6">Ajoutez des produits avant de passer commande.</p>
        <Link href="/ebooks" className="px-6 py-3 bg-[#E8B800] text-black font-bold rounded-xl">
          Découvrir les Ebooks
        </Link>
      </div>
    );
  }

  // ── Sebpay pending screen ──
  if (sebpayPending) {
    const countryData = SEBPAY_COUNTRIES.find((c) => c.code === sebpayCountry);
    const operatorLabel = countryData?.operators.find((o) => o.id === sebpayOperator)?.label ?? sebpayOperator;
    const productLabel = isDirect ? directTitre : items.map((i) => i.title).join(", ") || "Produit";
    const showHelp = sebpayElapsed >= 60;
    const supportWhatsApp = `+237694176642`;
    const supportEmail = `contact@smartlifecm.com`;
    const waMessage = encodeURIComponent(
      `Bonjour, j'ai un problème avec mon paiement.\n\n` +
      `📦 Produit : ${productLabel}\n🔖 Référence : ${sebpayRef}\n` +
      `💳 Opérateur : ${operatorLabel} — ${phone}\n💰 Montant : ${convert(finalTotal)}\n\n` +
      `Je n'ai pas reçu l'invite de paiement après 1 minute. Pouvez-vous m'aider ?`
    );
    const mailSubject = encodeURIComponent(`Problème paiement — Réf. ${sebpayRef}`);
    const mailBody = encodeURIComponent(
      `Bonjour,\n\nJ'ai un problème avec mon paiement :\n\nProduit : ${productLabel}\n` +
      `Référence : ${sebpayRef}\nOpérateur : ${operatorLabel} — ${phone}\nMontant : ${convert(finalTotal)}\n\n` +
      `Je n'ai pas reçu l'invite de paiement après 1 minute d'attente.\n\nMerci de m'aider.`
    );
    const remaining = Math.max(0, 60 - sebpayElapsed);
    const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
    const ss = String(remaining % 60).padStart(2, "0");

    return (
      <div className="max-w-md mx-auto px-4 py-16 flex flex-col items-center text-center gap-6">
        <div className="w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center">
          <Clock size={36} className="text-emerald-500 animate-pulse" />
        </div>
        <div>
          <h2 className="text-gray-900 text-2xl font-bold mb-2">Confirme sur ton téléphone</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            Une demande de paiement a été envoyée au<br />
            <strong className="text-gray-900">{phone}</strong> via <strong className="text-gray-900">{operatorLabel}</strong>.
          </p>
        </div>
        <div className="w-full p-4 bg-amber-50 border border-amber-200 rounded-xl text-left space-y-2">
          <p className="text-amber-800 font-bold text-sm">Comment confirmer :</p>
          <ol className="text-amber-700 text-sm space-y-1 list-decimal pl-4">
            <li>Attends la notification ou le message USSD</li>
            <li>Saisis ton code PIN {operatorLabel} pour confirmer</li>
            <li>Ton accès sera livré par email immédiatement</li>
          </ol>
        </div>
        {!showHelp && (
          <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Vérification en cours… <span className="text-gray-400 text-xs tabular-nums ml-2">{mm}:{ss}</span>
          </div>
        )}
        <p className="text-gray-400 text-xs">
          Montant : <strong><PriceTag amount={finalTotal} /></strong> · Réf. : <strong>{sebpayRef}</strong>
        </p>
        {sebpayElapsed >= 20 && !showHelp && (
          <button onClick={handleManualCheck} disabled={sebpayChecking}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-all disabled:opacity-60">
            {sebpayChecking ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Vérification…</span> : "J'ai confirmé mon paiement →"}
          </button>
        )}
        {showHelp && (
          <div className="w-full rounded-2xl border-2 border-orange-300 bg-orange-50 p-5 text-left space-y-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">⚠️</span>
              <div>
                <p className="text-orange-800 font-bold text-sm">Vous n&apos;avez pas reçu l&apos;invite ?</p>
                <p className="text-orange-700 text-xs mt-1 leading-relaxed">Cela peut arriver en cas de réseau instable. Notre équipe est disponible pour vous aider.</p>
              </div>
            </div>
            <div className="space-y-2">
              <a href={`https://wa.me/${supportWhatsApp}?text=${waMessage}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2.5 w-full py-3 px-4 bg-[#25D366] hover:bg-[#1ebe5c] text-white font-bold text-sm rounded-xl transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                Contacter le support WhatsApp
              </a>
              <a href={`mailto:${supportEmail}?subject=${mailSubject}&body=${mailBody}`}
                className="flex items-center justify-center gap-2.5 w-full py-3 px-4 bg-white hover:bg-gray-50 text-gray-700 font-bold text-sm rounded-xl border border-gray-200 transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                Envoyer un e-mail de support
              </a>
            </div>
            <button onClick={handleManualCheck} disabled={sebpayChecking}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-all disabled:opacity-60">
              {sebpayChecking ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Vérification…</span> : "J'ai quand même confirmé →"}
            </button>
            <p className="text-orange-600 text-xs text-center">Référence : <strong>{sebpayRef}</strong></p>
          </div>
        )}
        <button onClick={() => { setSebpayPending(false); setLoading(false); }} className="text-gray-500 text-xs hover:text-gray-700 underline">
          ← Annuler et réessayer
        </button>
      </div>
    );
  }

  // ── Orqex-style checkout UI ──
  const currentCountryOps = SEBPAY_COUNTRIES.find((c) => c.code === sebpayCountry)?.operators ?? [];
  const recentOpId = (isLoggedIn && currentUser?.phone)
    ? (detectOperator(currentUser.phone, sebpayCountry) || "")
    : "";

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <div className="max-w-lg mx-auto px-4 pt-4 pb-10 space-y-3">

        {/* ── 1. Header accordion — résumé commande ── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => setHeaderOpen((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-smartlife.jpeg" alt="SmartLife" className="h-8 w-8 rounded-lg object-cover flex-shrink-0" />
              <span className="font-bold text-gray-900 text-sm">Smart life</span>
            </div>
            <div className="flex items-center gap-2">
              {(promoDiscount > 0 || referralDiscount > 0) && (
                <span className="text-gray-400 text-xs line-through"><PriceTag amount={total} /></span>
              )}
              <span className="text-gray-900 font-bold text-sm"><PriceTag amount={finalTotal} /></span>
              <ChevronDown size={15} className={`text-gray-400 transition-transform duration-200 flex-shrink-0 ${headerOpen ? "rotate-180" : ""}`} />
            </div>
          </button>

          {headerOpen && (
            <div className="px-5 pb-5 pt-4 border-t border-gray-100 space-y-3">
              {isDirectPack ? (
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#E8B800]/10 flex items-center justify-center flex-shrink-0 text-base">📦</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 font-semibold text-sm">{directTitre}</p>
                    <p className="text-gray-400 text-xs">{packItems.length} contenu{packItems.length > 1 ? "s" : ""} inclus</p>
                  </div>
                  <p className="text-gray-900 font-bold text-sm flex-shrink-0"><PriceTag amount={directPrix} /></p>
                </div>
              ) : isDirect ? (
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1A1200] to-[#2D1A00] flex items-center justify-center flex-shrink-0 text-base">
                    {isDirectEbook ? "📖" : <Monitor size={18} className="text-[#E8B800]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 font-semibold text-sm leading-snug">{directTitre}</p>
                    <p className="text-gray-400 text-xs">{isDirectEbook ? "Ebook · Livraison par email" : "Formation · Accès immédiat"}</p>
                  </div>
                  <p className="text-gray-900 font-bold text-sm flex-shrink-0"><PriceTag amount={directPrix} /></p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 text-sm">
                        {item.type === "ebook" ? "📖" : "🎬"}
                      </div>
                      <p className="flex-1 text-gray-700 text-sm leading-snug">{item.title}</p>
                      <p className="text-gray-900 font-semibold text-sm flex-shrink-0">{formatPrice(item.price * item.quantity)}</p>
                      <button onClick={() => removeItem(item.id)} className="p-1 text-gray-300 hover:text-red-500 transition-colors flex-shrink-0">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-3 border-t border-gray-100 space-y-1.5">
                {referralDiscount > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-green-700 text-xs font-bold">🤝 Parrainage {referralParrainName ? `(${referralParrainName})` : ""} -10%</span>
                    <span className="text-green-700 font-bold text-xs">-<PriceTag amount={referralDiscount} /></span>
                  </div>
                )}
                {promoDiscount > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-green-700 text-xs font-bold flex items-center gap-1">🎁 {promoLabel}</span>
                    <span className="text-green-700 font-bold text-xs">-<PriceTag amount={promoDiscount} /></span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-bold text-sm">Total</span>
                  <span className="text-gray-900 font-bold text-base"><PriceTag amount={finalTotal} /></span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── 2. Anti-doublon ── */}
        {ownershipChecking && (
          <div className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-2xl text-gray-500 text-sm shadow-sm">
            <span className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin flex-shrink-0" />
            Vérification de votre compte…
          </div>
        )}
        {alreadyOwnedNames.length > 0 && (
          <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl shadow-sm">
            <div className="flex items-start gap-3">
              <AlertCircle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-amber-900 font-bold text-sm">
                  Vous possédez déjà {alreadyOwnedNames.length === 1 ? "ce produit" : "ces produits"} !
                </p>
                <p className="text-amber-800 text-xs mt-1">
                  <span className="font-semibold">{alreadyOwnedNames.join(", ")}</span> est déjà dans votre bibliothèque.
                </p>
                <Link href="/mon-espace" className="inline-flex items-center gap-1 mt-2 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition-all">
                  Accéder à Mon Espace →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ── 3. Points fidélité ── */}
        {isLoggedIn && loyaltyLoaded && loyaltyPoints >= 100 && !activePromoCode && (
          <div className="p-4 bg-white border border-purple-200 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p className="text-purple-800 font-bold text-sm flex items-center gap-1.5">⭐ {loyaltyPoints} points fidélité</p>
                <p className="text-purple-600 text-xs">Valeur : {Math.min(50, Math.floor(loyaltyPoints / 100) * 10)}% de réduction</p>
              </div>
              <button type="button" onClick={applyLoyaltyPoints} disabled={loyaltyGenerating}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex-shrink-0">
                {loyaltyGenerating ? "…" : "Utiliser"}
              </button>
            </div>
          </div>
        )}

        {/* ── 4. Code promo accordion ── */}
        {activePromoCode ? (
          <div className="flex items-center justify-between px-4 py-3 bg-white border border-green-200 rounded-2xl shadow-sm">
            <div className="flex items-center gap-2">
              <CheckCircle size={15} className="text-green-600 flex-shrink-0" />
              <div>
                <p className="text-green-800 font-bold text-sm">{activePromoCode} ✓</p>
                <p className="text-green-600 text-xs">{promoLabel}</p>
              </div>
            </div>
            <button onClick={removePromoCode} className="p-1 text-gray-400 hover:text-red-500 transition-colors">
              <XIcon size={14} />
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <button type="button" onClick={() => setPromoOpen((v) => !v)}
              className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50/50 transition-colors">
              <span className="flex items-center gap-2 text-gray-500 text-sm">
                <Tag size={13} className="text-[#E8B800]" />
                Code promo ou parrainage
              </span>
              <span className="text-gray-400 text-base font-bold leading-none">{promoOpen ? "−" : "+"}</span>
            </button>
            {promoOpen && (
              <div className="px-5 pb-4 border-t border-gray-100">
                <div className="flex gap-2 mt-3">
                  <input type="text" value={promoInput}
                    onChange={(e) => { setPromoInput(e.target.value.toUpperCase()); setPromoError(""); }}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); validatePromoCode(); } }}
                    placeholder="Ex: TCHOP10"
                    className="flex-1 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-[#E8B800] uppercase" />
                  <button type="button" onClick={validatePromoCode} disabled={promoValidating || !promoInput.trim()}
                    className="px-4 py-2.5 bg-[#E8B800] hover:bg-[#D4A017] disabled:opacity-50 text-black font-bold text-sm rounded-xl flex-shrink-0">
                    {promoValidating ? <span className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin inline-block" /> : "Appliquer"}
                  </button>
                </div>
                {promoError && <p className="flex items-center gap-1.5 mt-2 text-red-500 text-xs"><AlertCircle size={11} /> {promoError}</p>}
              </div>
            )}
          </div>
        )}

        {/* ── 5. Infos si non connecté ── */}
        {!isLoggedIn && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4 space-y-3">
            <p className="text-gray-400 text-xs font-medium uppercase tracking-wide">Vos informations</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-600 text-xs font-medium mb-1">Prénom *</label>
                <input type="text" value={regFirstName} onChange={(e) => setRegFirstName(e.target.value)}
                  placeholder="Jean"
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-[#E8B800]" />
              </div>
              <div>
                <label className="block text-gray-600 text-xs font-medium mb-1">Nom *</label>
                <input type="text" value={regLastName} onChange={(e) => setRegLastName(e.target.value)}
                  placeholder="Dupont"
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-[#E8B800]" />
              </div>
            </div>
            <div>
              <label className="block text-gray-600 text-xs font-medium mb-1">Email *</label>
              <input type="email" value={regEmail}
                onChange={(e) => { setRegEmail(e.target.value); setAlreadyOwnedNames([]); }}
                onBlur={() => { if (regEmail.includes("@") && regEmail.includes(".")) checkOwnershipByEmail(regEmail); }}
                placeholder="jean@example.com"
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-[#E8B800]" />
            </div>
            {regError && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                <AlertCircle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-600 text-xs">{regError}</p>
              </div>
            )}
          </div>
        )}

        {/* ── 6. Pays ── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4">
          <p className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-2">Pays</p>
          <select
            value={sebpayCountry}
            onChange={(e) => { setSebpayCountry(e.target.value); setSebpayOperator(""); setCountryManual(true); setSelectedMethod(null); }}
            className="w-full bg-transparent text-gray-900 font-medium text-sm focus:outline-none cursor-pointer"
          >
            {SEBPAY_COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* ── 7. Moyens de paiement ── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <p className="text-gray-900 font-bold text-sm px-5 pt-4 pb-3">Choisissez un moyen de paiement</p>

          {/* Utilisé récemment */}
          {isLoggedIn && currentUser?.phone && recentOpId && (
            <>
              <p className="text-gray-400 text-xs px-5 mb-2 font-medium">Utilisé récemment</p>
              <div className="flex items-center px-5 py-3 gap-3 border-t border-gray-100">
                {OPERATOR_LOGOS[recentOpId] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={OPERATOR_LOGOS[recentOpId]} alt={recentOpId} className="h-7 w-auto object-contain flex-shrink-0" style={{ maxWidth: 56 }} />
                ) : (
                  <div className={`h-7 w-7 rounded-full ${currentCountryOps.find(o => o.id === recentOpId)?.color ?? "bg-gray-300"} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                    {recentOpId[0]?.toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 font-medium text-sm leading-snug">{OPERATOR_LABELS[recentOpId] ?? recentOpId}</p>
                  <p className="text-gray-400 text-xs">{maskPhone(currentUser.phone)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleMethodPay(recentOpId, currentUser.phone!)}
                  disabled={loading || alreadyOwnedNames.length > 0}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl flex-shrink-0 flex items-center gap-1.5 transition-colors"
                >
                  {loading
                    ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <><Lock size={11} /> Payer</>
                  }
                </button>
              </div>
              <div className="flex items-center gap-3 px-5 py-2.5">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-gray-400 text-xs">ou payer avec</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>
            </>
          )}

          {/* Lignes opérateurs Sebpay (dynamiques selon pays) */}
          {currentCountryOps.map((op) => (
            <div key={op.id} className="border-t border-gray-100">
              <button
                type="button"
                onClick={() => { setSelectedMethod(selectedMethod === op.id ? null : op.id); setMethodPhone(""); setPaymentError(""); }}
                className="w-full flex items-center px-5 py-4 gap-3 hover:bg-gray-50/70 transition-colors"
              >
                {OPERATOR_LOGOS[op.id] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={OPERATOR_LOGOS[op.id]} alt={op.label} className="h-7 w-auto object-contain flex-shrink-0" style={{ maxWidth: 60 }} />
                ) : (
                  <div className={`h-7 w-7 rounded-full ${op.color} flex items-center justify-center text-xs font-bold flex-shrink-0`}>
                    {op.label[0]}
                  </div>
                )}
                <span className="flex-1 text-left font-medium text-gray-900 text-sm">
                  {OPERATOR_LABELS[op.id] ?? `${op.label} Mobile Money`}
                </span>
                <ChevronRight size={15} className={`text-gray-400 flex-shrink-0 transition-transform duration-200 ${selectedMethod === op.id ? "rotate-90" : ""}`} />
              </button>

              {selectedMethod === op.id && (
                <div className="px-5 pb-4 pt-1 space-y-3 border-t border-gray-50 bg-gray-50/40">
                  <input
                    type="tel"
                    value={methodPhone}
                    onChange={(e) => { setMethodPhone(e.target.value); setPaymentError(""); }}
                    placeholder="+237 6XX XXX XXX"
                    autoFocus
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-emerald-400 transition-colors"
                  />
                  {paymentError && (
                    <p className="text-red-500 text-xs flex items-center gap-1.5">
                      <AlertCircle size={11} /> {paymentError}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => handleMethodPay(op.id, methodPhone)}
                    disabled={loading || !methodPhone.trim() || alreadyOwnedNames.length > 0}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
                  >
                    {loading
                      ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      : <><Lock size={13} /> Payer {convert(finalTotal)}</>
                    }
                  </button>
                </div>
              )}
            </div>
          ))}

          {/* Carte bancaire via CinetPay */}
          {gatewayCfg.cinetpay && (
            <div className="border-t border-gray-100">
              <button
                type="button"
                onClick={() => { setSelectedMethod(selectedMethod === "card" ? null : "card"); setMethodPhone(""); setPaymentError(""); }}
                className="w-full flex items-center px-5 py-4 gap-3 hover:bg-gray-50/70 transition-colors"
              >
                <div className="flex gap-1 items-center flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/payment-logos/visa.svg" alt="Visa" className="h-5 w-auto" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/payment-logos/mastercard.svg" alt="Mastercard" className="h-5 w-auto" />
                </div>
                <span className="flex-1 text-left font-medium text-gray-900 text-sm">Carte bancaire</span>
                <ChevronRight size={15} className={`text-gray-400 flex-shrink-0 transition-transform duration-200 ${selectedMethod === "card" ? "rotate-90" : ""}`} />
              </button>

              {selectedMethod === "card" && (
                <div className="px-5 pb-4 pt-1 space-y-3 border-t border-gray-50 bg-gray-50/40">
                  <input
                    type="tel"
                    value={methodPhone}
                    onChange={(e) => { setMethodPhone(e.target.value); setPaymentError(""); }}
                    placeholder="+237 6XX XXX XXX"
                    autoFocus
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-[#E8B800] transition-colors"
                  />
                  {paymentError && (
                    <p className="text-red-500 text-xs flex items-center gap-1.5">
                      <AlertCircle size={11} /> {paymentError}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => handleMethodPay("card", methodPhone)}
                    disabled={loading || !methodPhone.trim() || alreadyOwnedNames.length > 0}
                    className="w-full py-3.5 bg-[#E8B800] hover:bg-[#D4A017] disabled:opacity-50 text-black font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
                  >
                    {loading
                      ? <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      : <><Lock size={13} /> Payer {convert(finalTotal)}</>
                    }
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Cryptomonnaies — bientôt */}
          <div className="border-t border-gray-100">
            <div className="flex items-center px-5 py-4 gap-3 opacity-40 cursor-not-allowed">
              <div className="h-7 w-7 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 text-sm font-bold flex-shrink-0">₿</div>
              <span className="flex-1 font-medium text-gray-900 text-sm">Cryptomonnaies</span>
              <span className="text-gray-400 text-xs bg-gray-100 px-2 py-0.5 rounded-full flex-shrink-0">Bientôt</span>
            </div>
          </div>

          {/* Badges */}
          <div className="px-5 pb-4 pt-2 border-t border-gray-100">
            <PaymentBadges size="xs" />
          </div>
        </div>

      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-[#E8B800] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
