"use client";

import { useState, useEffect } from "react";
import { ShieldCheck, Loader2, Check, Copy, Phone, Mail, User, CreditCard, AlertCircle } from "lucide-react";
import type { PaymentLink } from "@/app/api/admin/payment-links/route";
import { detectOperator } from "@/lib/operator-detection";
import { geoFromPhone } from "@/lib/phone-geo";
import { useCurrencyStore } from "@/lib/currency-store";

// ─── Pays et opérateurs (identiques au checkout principal) ───────────────────

type Operator = { id: string; label: string; color: string };
type Country = { code: string; name: string; operators: Operator[] };

const COUNTRIES: Country[] = [
  { code: "CM", name: "🇨🇲 Cameroun", operators: [
    { id: "mtn",    label: "MTN",    color: "bg-yellow-400 text-yellow-900" },
    { id: "orange", label: "Orange", color: "bg-orange-500 text-white" },
  ]},
  { code: "CG", name: "🇨🇬 Congo-Brazzaville", operators: [
    { id: "mtn", label: "MTN", color: "bg-yellow-400 text-yellow-900" },
  ]},
  { code: "GA", name: "🇬🇦 Gabon", operators: [
    { id: "airtel", label: "Airtel", color: "bg-red-500 text-white" },
    { id: "moov",   label: "Moov",   color: "bg-blue-600 text-white" },
  ]},
  { code: "CD", name: "🇨🇩 RD Congo", operators: [
    { id: "airtel", label: "Airtel",  color: "bg-red-500 text-white" },
    { id: "orange", label: "Orange",  color: "bg-orange-500 text-white" },
    { id: "vodacom", label: "Vodacom", color: "bg-red-700 text-white" },
  ]},
  { code: "TD", name: "🇹🇩 Tchad", operators: [
    { id: "airtel", label: "Airtel", color: "bg-red-500 text-white" },
    { id: "moov",   label: "Moov",   color: "bg-blue-600 text-white" },
  ]},
  { code: "BJ", name: "🇧🇯 Bénin", operators: [
    { id: "mtn",  label: "MTN",  color: "bg-yellow-400 text-yellow-900" },
    { id: "moov", label: "Moov", color: "bg-blue-600 text-white" },
  ]},
  { code: "BF", name: "🇧🇫 Burkina Faso", operators: [
    { id: "orange", label: "Orange", color: "bg-orange-500 text-white" },
    { id: "moov",   label: "Moov",   color: "bg-blue-600 text-white" },
  ]},
  { code: "CI", name: "🇨🇮 Côte d'Ivoire", operators: [
    { id: "mtn",    label: "MTN",    color: "bg-yellow-400 text-yellow-900" },
    { id: "orange", label: "Orange", color: "bg-orange-500 text-white" },
    { id: "moov",   label: "Moov",   color: "bg-blue-600 text-white" },
  ]},
  { code: "GN", name: "🇬🇳 Guinée", operators: [
    { id: "mtn",    label: "MTN",    color: "bg-yellow-400 text-yellow-900" },
    { id: "orange", label: "Orange", color: "bg-orange-500 text-white" },
  ]},
  { code: "ML", name: "🇲🇱 Mali", operators: [
    { id: "orange", label: "Orange", color: "bg-orange-500 text-white" },
    { id: "moov",   label: "Moov",   color: "bg-blue-600 text-white" },
  ]},
  { code: "SN", name: "🇸🇳 Sénégal", operators: [
    { id: "orange", label: "Orange",  color: "bg-orange-500 text-white" },
    { id: "wav",    label: "Wave",    color: "bg-sky-400 text-white" },
  ]},
  { code: "TG", name: "🇹🇬 Togo", operators: [
    { id: "moov",  label: "Moov",  color: "bg-blue-600 text-white" },
    { id: "togocel", label: "Togocel", color: "bg-green-600 text-white" },
  ]},
];


// ─── Types ───────────────────────────────────────────────────────────────────

type Channel = "cinetpay" | "sebpay";

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

// ─── Composant principal ─────────────────────────────────────────────────────

export default function PayLinkClient({ link }: { link: PaymentLink }) {
  const convert = useCurrencyStore((s) => s.convert);
  const [form, setForm] = useState<FormData>({ firstName: "", lastName: "", email: "", phone: "" });
  const [channel, setChannel] = useState<Channel>("cinetpay");
  const [country, setCountry] = useState("CM");
  const [operator, setOperator] = useState("");
  const [operatorManual, setOperatorManual] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Config des passerelles activées par l'admin
  const [gatewayCfg, setGatewayCfg] = useState<{ cinetpay: boolean; sebpay: boolean }>({ cinetpay: true, sebpay: true });
  useEffect(() => {
    fetch("/api/gateway-config").then((r) => r.json()).then((cfg) => {
      setGatewayCfg(cfg);
      if (!cfg.cinetpay && cfg.sebpay) setChannel("sebpay");
      if (cfg.cinetpay && !cfg.sebpay) setChannel("cinetpay");
    }).catch(() => {});
  }, []);

  // Sebpay polling
  const [sebpayPending, setSebpayPending] = useState(false);
  const [sebpayRef, setSebpayRef] = useState("");
  const [sebpayElapsed, setSebpayElapsed] = useState(0);
  const [showHelp, setShowHelp] = useState(false);

  const countryObj = COUNTRIES.find((c) => c.code === country) ?? COUNTRIES[0];

  useEffect(() => { setOperator(""); setOperatorManual(false); }, [country]);

  // Auto-détection opérateur selon le numéro saisi
  useEffect(() => {
    if (operatorManual) return;
    if (!form.phone || form.phone.replace(/[\s\-().+]/g, "").length < 8) return;
    const detectedGeo = geoFromPhone(form.phone);
    const countryToUse = detectedGeo?.countryCode ?? country;
    if (detectedGeo?.countryCode && detectedGeo.countryCode !== country) {
      const exists = COUNTRIES.some((c) => c.code === detectedGeo.countryCode);
      if (exists) setCountry(detectedGeo.countryCode);
    }
    const op = detectOperator(form.phone, countryToUse);
    if (op) setOperator(op);
  }, [form.phone]); // eslint-disable-line

  // Polling Sebpay
  useEffect(() => {
    if (!sebpayPending || !sebpayRef) return;
    setSebpayElapsed(0);
    const interval = setInterval(async () => {
      setSebpayElapsed((prev) => {
        const next = prev + 5;
        if (next >= 60) { setShowHelp(true); clearInterval(interval); }
        return next;
      });
      try {
        const res = await fetch(`/api/payment/sebpay?ref=${sebpayRef}`);
        const data = await res.json();
        if (data.confirmed) {
          clearInterval(interval);
          window.location.href = `/pay/success?name=${encodeURIComponent(link.name)}&amount=${link.price}`;
        }
      } catch { /* retry */ }
    }, 5000);
    return () => clearInterval(interval);
  }, [sebpayPending, sebpayRef, link.name, link.price]);

  const remaining = Math.max(0, 60 - sebpayElapsed);

  const validate = () => {
    if (!form.firstName.trim() || !form.lastName.trim()) return "Prénom et nom requis";
    if (!form.email.trim() || !form.email.includes("@")) return "Email valide requis";
    if (!form.phone.trim()) return "Numéro de téléphone requis";
    if (channel === "sebpay" && !operator) return "Choisissez un opérateur mobile";
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setError("");
    setLoading(true);

    const reference = `SL-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    const userId = `guest-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";

    try {
      if (channel === "cinetpay") {
        const res = await fetch("/api/payment/cinetpay", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: link.price,
            customer: { firstName: form.firstName, lastName: form.lastName, email: form.email, phone: form.phone },
            reference,
            countryCode: country,
            userId,
            ebookIds: [],
            formationIds: [],
            paymentLinkId: link.id,
            paymentLinkName: link.name,
            payLinkSuccessUrl: `${window.location.origin}/pay/success?name=${encodeURIComponent(link.name)}&amount=${link.price}`,
          }),
        });
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
        } else {
          setError(data.error || "Erreur lors de la création du paiement");
        }
      } else {
        const res = await fetch("/api/payment/sebpay", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: link.price,
            phone: form.phone,
            operator,
            country,
            reference,
            userId,
            ebookIds: [],
            formationIds: [],
            customerName: `${form.firstName} ${form.lastName}`.trim(),
            customerEmail: form.email,
            customerPhone: form.phone,
            paymentLinkId: link.id,
            paymentLinkName: link.name,
          }),
        });
        const data = await res.json();
        if (data.transaction_id) {
          setSebpayRef(reference);
          setSebpayPending(true);
          setShowHelp(false);
        } else {
          setError(data.error || "Erreur Sebpay");
        }
      }
    } catch {
      setError("Erreur réseau, veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  // ─── Écran d'attente Sebpay ───────────────────────────────────────────────

  if (sebpayPending) {
    return (
      <div className="min-h-screen bg-[#f9f8f5] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-lg p-8 w-full max-w-md text-center space-y-6">
          <div className="w-16 h-16 bg-[#E8B800]/10 rounded-full flex items-center justify-center mx-auto">
            <Phone size={28} className="text-[#E8B800]" />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900">Confirmez sur votre téléphone</h2>
            <p className="text-gray-500 text-sm mt-1">Validez le paiement Mobile Money reçu sur <strong className="text-gray-700">{form.phone}</strong></p>
          </div>

          {!showHelp ? (
            <div className="space-y-3">
              <div className="text-3xl font-black text-[#E8B800]">{remaining}s</div>
              <p className="text-gray-400 text-xs">Vérification automatique en cours…</p>
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div
                  className="bg-[#E8B800] h-1.5 rounded-full transition-all duration-5000"
                  style={{ width: `${Math.max(0, 100 - (sebpayElapsed / 60) * 100)}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-left">
                <p className="text-amber-800 text-sm font-bold mb-1">Paiement non détecté automatiquement</p>
                <p className="text-amber-700 text-xs">Si vous avez déjà payé, votre accès sera validé dans quelques minutes. Besoin d&apos;aide ?</p>
              </div>
              <div className="flex gap-3">
                <a
                  href={`https://api.whatsapp.com/send?phone=237694176642&text=Bonjour%2C%20j%27ai%20effectué%20un%20paiement%20pour%20%22${encodeURIComponent(link.name)}%22%20(ref%3A%20${sebpayRef})%20mais%20je%20n%27ai%20pas%20de%20confirmation.`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex-1 py-3 bg-[#25D366] hover:bg-[#20b858] text-white text-sm font-bold rounded-xl transition-colors text-center"
                >
                  WhatsApp
                </a>
                <a
                  href={`mailto:support@smartlifecm.com?subject=Aide%20paiement%20${encodeURIComponent(link.name)}&body=Ref%3A%20${sebpayRef}`}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold rounded-xl transition-colors text-center"
                >
                  Email
                </a>
              </div>
            </div>
          )}

          <p className="text-gray-400 text-xs">Réf. de paiement : <code className="font-mono">{sebpayRef}</code></p>
        </div>
      </div>
    );
  }

  // ─── Formulaire principal ─────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#f9f8f5] flex items-center justify-center p-4 py-10">
      <div className="w-full max-w-lg">

        {/* Header produit */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-4 text-center">
          <div className="inline-flex items-center gap-2 bg-[#E8B800]/10 text-[#E8B800] text-xs font-bold px-3 py-1.5 rounded-full mb-3">
            <CreditCard size={12} /> Paiement sécurisé
          </div>
          <h1 className="text-xl font-black text-gray-900 mb-1">{link.name}</h1>
          {link.description && <p className="text-gray-500 text-sm mb-3">{link.description}</p>}
          <div className="text-3xl font-black text-[#27A827]">{convert(link.price)}</div>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 space-y-5">
          <h2 className="font-black text-gray-900 text-base flex items-center gap-2">
            <User size={16} className="text-[#E8B800]" /> Vos informations
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">Prénom *</label>
              <input
                type="text" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                placeholder="Jean" required
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:border-[#E8B800] transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">Nom *</label>
              <input
                type="text" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                placeholder="Dupont" required
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:border-[#E8B800] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5"><Mail size={11} className="inline mr-1" />Email *</label>
            <input
              type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="jean@example.com" required
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:border-[#E8B800] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5"><Phone size={11} className="inline mr-1" />Téléphone *</label>
            <input
              type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+237 6XX XXX XXX" required
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:border-[#E8B800] transition-colors"
            />
          </div>

          {/* Mode de paiement */}
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-2">Mode de paiement *</label>
            {/* Les deux actifs : afficher le choix */}
            {gatewayCfg.cinetpay && gatewayCfg.sebpay && (
              <div className="grid grid-cols-2 gap-2">
                {(["cinetpay", "sebpay"] as Channel[]).map((ch) => (
                  <button
                    key={ch} type="button"
                    onClick={() => setChannel(ch)}
                    className={`py-3 px-4 rounded-xl border-2 text-sm font-bold transition-all text-center ${
                      channel === ch
                        ? "border-[#E8B800] bg-[#E8B800]/8 text-gray-900"
                        : "border-gray-200 text-gray-500 hover:border-gray-300"
                    }`}
                  >
                    {ch === "cinetpay" ? "💳 Carte / Mobile" : "📱 Mobile Money"}
                  </button>
                ))}
              </div>
            )}
            {/* Un seul actif : badge informatif */}
            {gatewayCfg.cinetpay && !gatewayCfg.sebpay && (
              <div className="flex items-center gap-2 p-3 bg-[#E8B800]/8 border border-[#E8B800]/30 rounded-xl">
                <CreditCard size={16} className="text-[#E8B800] shrink-0" />
                <span className="text-sm font-bold text-gray-800">Carte &amp; Mobile Money — CinetPay</span>
              </div>
            )}
            {!gatewayCfg.cinetpay && gatewayCfg.sebpay && (
              <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <Phone size={16} className="text-emerald-600 shrink-0" />
                <span className="text-sm font-bold text-gray-800">Mobile Money (Orange, MTN, Wave…)</span>
              </div>
            )}
          </div>

          {/* Sebpay — pays + opérateur */}
          {channel === "sebpay" && (
            <div className="space-y-3 bg-gray-50 rounded-2xl p-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">Pays</label>
                <select
                  value={country} onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:border-[#E8B800] bg-white transition-colors"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">Opérateur *</label>
                <div className="flex flex-wrap gap-2">
                  {countryObj.operators.map((op) => (
                    <button
                      key={op.id} type="button"
                      onClick={() => { setOperator(op.id); setOperatorManual(true); }}
                      className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border-2 ${
                        operator === op.id
                          ? `${op.color} border-transparent`
                          : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      {op.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Erreur */}
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm">
              <AlertCircle size={15} className="shrink-0" /> {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit" disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-[#E8B800] to-[#27A827] hover:from-[#27A827] hover:to-[#E8B800] text-black font-black text-base rounded-2xl transition-all shadow-lg shadow-[#E8B800]/20 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 size={18} className="animate-spin" /> Traitement…</> : `Payer ${convert(link.price)}`}
          </button>

          <div className="flex items-center justify-center gap-3 text-gray-400 text-xs pt-1">
            <span className="flex items-center gap-1"><ShieldCheck size={12} /> Paiement sécurisé</span>
            <span>•</span>
            <span>Données chiffrées</span>
          </div>
        </form>

        <p className="text-center text-gray-400 text-xs mt-4">
          Propulsé par <span className="font-bold text-[#E8B800]">Smart Life</span>
        </p>
      </div>
    </div>
  );
}
