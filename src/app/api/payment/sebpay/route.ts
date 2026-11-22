import { NextRequest, NextResponse } from "next/server";
import { readOrders, writeOrders, confirmPurchase } from "@/lib/purchase-guard";
import { extractClientIp } from "@/lib/geo";

const SEBPAY_BASE = "https://newapi.sebpay.bj/api/v1";

export async function POST(req: NextRequest) {
  const {
    amount, phone, operator, country = "CM",
    reference, userId, ebookIds = [], formationIds = [],
    customerName = "", customerEmail = "", customerPhone = "",
    productNames = {},
    paymentLinkId, paymentLinkName,
    promoCode, referralCode,
  } = await req.json();

  const publicKey = process.env.SEBPAY_PUBLIC_KEY;
  const secretKey = process.env.SEBPAY_SECRET_KEY;

  if (!publicKey || !secretKey) {
    return NextResponse.json({ error: "Sebpay non configuré" }, { status: 500 });
  }
  if (!phone || !operator) {
    return NextResponse.json({ error: "Numéro et opérateur requis" }, { status: 400 });
  }

  // Enregistrer la commande en attente AVANT l'appel Sebpay
  if (reference && userId) {
    const orders = await readOrders();
    const existing = orders.filter((o) => o.reference !== reference);
    const clientIp = extractClientIp(req.headers);
    const clientUa = req.headers.get("user-agent") || "";
    existing.push({
      reference, userId, ebookIds, formationIds, amount, createdAt: new Date().toISOString(),
      customerIp: clientIp, customerUa: clientUa, currency: "XAF",
      customerName: customerName || undefined,
      customerEmail: customerEmail || undefined,
      customerPhone: customerPhone || phone || undefined,
      productNames: Object.keys(productNames).length > 0 ? productNames : undefined,
      ...(paymentLinkId ? { paymentLinkId, paymentLinkName: paymentLinkName || paymentLinkId } : {}),
      ...(promoCode ? { promoCode: String(promoCode).toUpperCase().trim() } : {}),
      ...(referralCode ? { referralCode: String(referralCode).toUpperCase().trim() } : {}),
    });
    await writeOrders(existing.slice(-500));
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const cleanPhone = String(phone).replace(/^\+/, "").replace(/[\s\-().]/g, "");

  const res = await fetch(`${SEBPAY_BASE}/collections`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Public-Key": publicKey,
      "X-Secret-Key": secretKey,
    },
    body: JSON.stringify({
      amount,
      currency: "XAF",
      phone: cleanPhone,
      operator,
      country,
      external_reference: reference,
      callback_url: `${appUrl}/api/webhooks/sebpay`,
    }),
  });

  const data = await res.json();
  console.log("Sebpay collection response:", JSON.stringify(data));

  if (!data.success) {
    // Extraire le vrai message depuis data.errors.error (contient du JSON imbriqué)
    let userMessage = data.message || "Erreur Sebpay";
    const rawError: string = data.errors?.error ?? "";
    const jsonStart = rawError.indexOf("{");
    if (jsonStart !== -1) {
      try {
        const inner = JSON.parse(rawError.slice(jsonStart));
        if (inner?.error?.message) userMessage = inner.error.message;
        else if (inner?.message) userMessage = inner.message;
      } catch { /* garder le message d'origine */ }
    }
    return NextResponse.json({ error: userMessage }, { status: 400 });
  }

  // Stocker le transaction_id Sebpay dans la commande pour pouvoir interroger
  // l'API Sebpay directement lors du polling (fallback si webhook non reçu)
  const transactionId: string | undefined = data.data?.transaction_id;
  if (transactionId && reference) {
    const orders = await readOrders();
    const idx = orders.findIndex((o) => o.reference === reference);
    if (idx !== -1) {
      orders[idx].transactionId = transactionId;
      await writeOrders(orders);
    }
  }

  return NextResponse.json({
    transaction_id: transactionId,
    status: data.data?.status,
    provider_link: data.data?.provider_link || null,
    reference,
  });
}

/** Vérifie si une commande a été confirmée.
 *  Stratégie : webhook (supprime la commande de pending) OU vérification directe Sebpay. */
export async function GET(req: NextRequest) {
  const ref = new URL(req.url).searchParams.get("ref");
  if (!ref) return NextResponse.json({ error: "ref requis" }, { status: 400 });

  const orders = await readOrders();
  const order = orders.find((o) => o.reference === ref);

  // Commande absente de pending-orders.json = déjà confirmée par webhook
  if (!order) {
    return NextResponse.json({ pending: false, confirmed: true });
  }

  // Toujours en attente — vérifier directement chez Sebpay si on a le transaction_id
  if (order.transactionId) {
    try {
      const publicKey = process.env.SEBPAY_PUBLIC_KEY;
      const secretKey = process.env.SEBPAY_SECRET_KEY;

      const txRes = await fetch(`${SEBPAY_BASE}/collections/${order.transactionId}`, {
        headers: {
          "X-Public-Key": publicKey || "",
          "X-Secret-Key": secretKey || "",
        },
      });

      if (txRes.ok) {
        const txData = await txRes.json();
        const txStatus = String(txData?.data?.status || txData?.status || "").toLowerCase();

        if (["approved", "success", "completed", "paid"].includes(txStatus)) {
          // Paiement confirmé côté Sebpay — confirmer l'achat maintenant
          await confirmPurchase(ref);
          return NextResponse.json({ pending: false, confirmed: true });
        }
      }
    } catch {
      // Sebpay API inaccessible — continuer avec la logique webhook habituelle
    }
  }

  return NextResponse.json({ pending: true, confirmed: false });
}
