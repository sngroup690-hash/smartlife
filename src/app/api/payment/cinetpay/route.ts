import { NextRequest, NextResponse } from "next/server";
import { readOrders, writeOrders } from "@/lib/purchase-guard";
import { extractClientIp } from "@/lib/geo";
import { getCinetpayToken, cinetpayBaseUrl } from "@/lib/cinetpay-token";

const COUNTRY_CURRENCY: Record<string, string> = {
  SN: "XOF", CI: "XOF", BF: "XOF", ML: "XOF", GN: "GNF",
  CD: "CDF", GH: "GHS", KE: "KES", TZ: "TZS", CM: "XAF",
  TG: "XOF", BJ: "XOF", GA: "XAF", CF: "XAF",
};

export async function POST(req: NextRequest) {
  const {
    amount, customer, reference,
    countryCode = "CM",
    userId, ebookIds = [], formationIds = [],
    paymentLinkId, paymentLinkName, payLinkSuccessUrl,
    promoCode, referralCode,
  } = await req.json();

  const apiKey = process.env.CINETPAY_API_KEY;
  const apiPassword = process.env.CINETPAY_API_PASSWORD;

  if (!apiKey || !apiPassword) {
    return NextResponse.json(
      { error: "CinetPay non configuré (CINETPAY_API_KEY / CINETPAY_API_PASSWORD manquants)" },
      { status: 500 }
    );
  }

  // Enregistrer la commande en attente AVANT la redirection
  if (reference && userId) {
    const orders = await readOrders();
    const existing = orders.filter((o) => o.reference !== reference);
    const clientIp = extractClientIp(req.headers);
    const clientUa = req.headers.get("user-agent") || "";
    const orderCurrency = COUNTRY_CURRENCY[countryCode] ?? "XAF";
    existing.push({
      reference, userId, ebookIds, formationIds, amount, createdAt: new Date().toISOString(),
      customerIp: clientIp, customerUa: clientUa,
      customerEmail: customer?.email || "", customerName: `${customer?.firstName || ""} ${customer?.lastName || ""}`.trim(),
      customerPhone: customer?.phone || "", currency: orderCurrency,
      ...(paymentLinkId ? { paymentLinkId, paymentLinkName: paymentLinkName || paymentLinkId } : {}),
      ...(promoCode ? { promoCode: String(promoCode).toUpperCase().trim() } : {}),
      ...(referralCode ? { referralCode: String(referralCode).toUpperCase().trim() } : {}),
    });
    await writeOrders(existing.slice(-500));
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const currency = COUNTRY_CURRENCY[countryCode] ?? "XAF";

  let token: string;
  try {
    token = await getCinetpayToken(apiKey, apiPassword);
  } catch (err) {
    console.error("CinetPay auth error:", err);
    return NextResponse.json({ error: "Authentification CinetPay échouée" }, { status: 502 });
  }

  const res = await fetch(`${cinetpayBaseUrl(apiKey)}/v1/payment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      currency,
      merchant_transaction_id: reference,
      amount,
      lang: "fr",
      designation: "Commande SMART LIFE",
      client_email: customer.email,
      client_first_name: customer.firstName,
      client_last_name: customer.lastName,
      ...(customer.phone ? { client_phone_number: customer.phone } : {}),
      success_url: payLinkSuccessUrl || `${appUrl}/checkout/success?gateway=cinetpay&ref=${reference}`,
      failed_url: `${appUrl}/checkout/cancel`,
      notify_url: `${appUrl}/api/webhooks/cinetpay`,
    }),
  });

  const data = await res.json();

  // Response: { payment_url, payment_token } or { data: { payment_url } }
  const paymentUrl: string | undefined = data.payment_url ?? data.data?.payment_url;
  if (!paymentUrl) {
    console.error("CinetPay payment error:", data);
    return NextResponse.json({ error: data.message ?? "URL de paiement introuvable" }, { status: 400 });
  }

  return NextResponse.json({ url: paymentUrl });
}
