import { NextRequest, NextResponse } from "next/server";
import { readVipConfig } from "@/lib/vip-store";
import { readOrders, writeOrders } from "@/lib/purchase-guard";
import { extractClientIp } from "@/lib/geo";
import crypto from "crypto";

const SEBPAY_BASE = "https://newapi.sebpay.bj/api/v1";

function cinetpayBase(apiKey: string): string {
  return apiKey.startsWith("sk_live_") ? "https://api.cinetpay.co" : "https://api.cinetpay.net";
}

let _cpTokenCache: { value: string; expiresAt: number } | null = null;

async function getCinetpayToken(apiKey: string, apiPassword: string): Promise<string> {
  if (_cpTokenCache && Date.now() < _cpTokenCache.expiresAt) return _cpTokenCache.value;
  const res = await fetch(`${cinetpayBase(apiKey)}/v1/oauth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ api_key: apiKey, api_password: apiPassword }),
  });
  const json = await res.json();
  const token: string | undefined = json.token ?? json.data?.token ?? json.access_token;
  if (!token) throw new Error("Auth CinetPay échouée: " + JSON.stringify(json));
  _cpTokenCache = { value: token, expiresAt: Date.now() + 22 * 3_600_000 };
  return token;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Requête invalide" }, { status: 400 });

  const {
    plan,           // "monthly" | "annual"
    gateway,        // "sebpay" | "cinetpay"
    phone,          // pour sebpay
    operator,       // pour sebpay (mtn_cm, orange_cm…)
    country = "CM",
    userId,
    userName = "",
    userEmail = "",
    userPhone = "",
  } = body as {
    plan: string; gateway: string; phone?: string; operator?: string;
    country?: string; userId: string; userName?: string; userEmail?: string; userPhone?: string;
  };

  if (!userId || !plan || !["monthly", "annual"].includes(plan)) {
    return NextResponse.json({ error: "userId et plan requis" }, { status: 400 });
  }

  const cfg = await readVipConfig();
  if (!cfg.enabled) return NextResponse.json({ error: "Le SmartLife Pass est momentanément indisponible" }, { status: 503 });

  const amount = plan === "annual" ? cfg.annualPrice : cfg.monthlyPrice;
  const planLabel = plan === "annual" ? "SmartLife Pass Annuel" : "SmartLife Pass Mensuel";
  const reference = `VIP_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Enregistrer la commande en attente
  const orders = await readOrders();
  const clientIp = extractClientIp(req.headers);
  const clientUa = req.headers.get("user-agent") || "";
  orders.push({
    reference,
    userId,
    ebookIds: [],
    formationIds: [],
    amount,
    createdAt: new Date().toISOString(),
    customerIp: clientIp,
    customerUa: clientUa,
    customerName: userName || undefined,
    customerEmail: userEmail || undefined,
    customerPhone: userPhone || phone || undefined,
    currency: cfg.currency,
    productNames: { [reference]: planLabel },
    // @ts-expect-error champ VIP non défini dans le type de base
    vipPlan: plan,
  });
  await writeOrders(orders.slice(-500));

  // ── SebPay (Mobile Money) ──────────────────────────────────────────────────
  if (gateway === "sebpay" || !gateway) {
    const publicKey = process.env.SEBPAY_PUBLIC_KEY;
    const secretKey = process.env.SEBPAY_SECRET_KEY;
    if (!publicKey || !secretKey) return NextResponse.json({ error: "SebPay non configuré" }, { status: 500 });
    if (!phone || !operator) return NextResponse.json({ error: "Numéro et opérateur requis" }, { status: 400 });

    const cleanPhone = String(phone).replace(/^\+/, "").replace(/[\s\-().]/g, "");
    const res = await fetch(`${SEBPAY_BASE}/collections`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Public-Key": publicKey, "X-Secret-Key": secretKey },
      body: JSON.stringify({
        amount, currency: cfg.currency, phone: cleanPhone, operator, country,
        external_reference: reference,
        callback_url: `${appUrl}/api/webhooks/sebpay`,
      }),
    });
    const data = await res.json();
    if (!data.success) {
      let msg = data.message || "Erreur SebPay";
      const raw: string = data.errors?.error ?? "";
      const j = raw.indexOf("{");
      if (j !== -1) {
        try { const p = JSON.parse(raw.slice(j)); msg = p?.error?.message || p?.message || msg; } catch { /* */ }
      }
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const transactionId: string | undefined = data.data?.transaction_id;
    if (transactionId) {
      const ords = await readOrders();
      const i = ords.findIndex(o => o.reference === reference);
      if (i !== -1) { ords[i].transactionId = transactionId; await writeOrders(ords); }
    }

    return NextResponse.json({ transactionId, reference, status: data.data?.status });
  }

  // ── CinetPay (Carte bancaire) ──────────────────────────────────────────────
  if (gateway === "cinetpay") {
    const apiKey = process.env.CINETPAY_API_KEY;
    const apiPassword = process.env.CINETPAY_API_PASSWORD;
    if (!apiKey || !apiPassword) return NextResponse.json({ error: "CinetPay non configuré" }, { status: 500 });
    if (!userEmail) return NextResponse.json({ error: "Email requis pour CinetPay" }, { status: 400 });

    let token: string;
    try { token = await getCinetpayToken(apiKey, apiPassword); }
    catch { return NextResponse.json({ error: "Authentification CinetPay échouée" }, { status: 502 }); }

    const [firstName = "Client", ...rest] = (userName || "Client SmartLife").split(" ");
    const lastName = rest.join(" ") || "SmartLife";

    const res = await fetch(`${cinetpayBase(apiKey)}/v1/payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        currency: cfg.currency,
        merchant_transaction_id: reference,
        amount,
        lang: "fr",
        designation: planLabel,
        client_email: userEmail,
        client_first_name: firstName,
        client_last_name: lastName,
        ...(userPhone ? { client_phone_number: userPhone } : {}),
        success_url: `${appUrl}/dashboard?tab=vip&vip=activated`,
        failed_url: `${appUrl}/dashboard?tab=vip&vip=failed`,
        notify_url: `${appUrl}/api/webhooks/cinetpay`,
      }),
    });
    const data = await res.json();
    const paymentUrl: string | undefined = data.payment_url ?? data.data?.payment_url;
    if (!paymentUrl) return NextResponse.json({ error: data.message ?? "URL de paiement introuvable" }, { status: 400 });

    return NextResponse.json({ url: paymentUrl, reference });
  }

  return NextResponse.json({ error: "Gateway non supportée" }, { status: 400 });
}
