import { NextRequest, NextResponse } from "next/server";
import { confirmPurchase, readOrders } from "@/lib/purchase-guard";

export const dynamic = "force-dynamic";

const SEBPAY_BASE = "https://newapi.sebpay.bj/api/v1";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.reference || !body?.userId) {
    return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
  }

  const { reference, userId } = body as { reference: string; userId: string };

  const orders = await readOrders();
  const order = orders.find((o) => o.reference === reference);
  if (!order) {
    // Déjà traitée par le webhook — considéré comme succès
    return NextResponse.json({ confirmed: true, alreadyProcessed: true });
  }
  if (order.userId !== userId) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  // Pour les paiements Sebpay : vérifier le statut réel avant de confirmer
  if (order.transactionId) {
    const publicKey = process.env.SEBPAY_PUBLIC_KEY;
    const secretKey = process.env.SEBPAY_SECRET_KEY;
    if (!publicKey || !secretKey) {
      return NextResponse.json({ error: "Configuration paiement manquante" }, { status: 500 });
    }
    try {
      const txRes = await fetch(`${SEBPAY_BASE}/collections/${order.transactionId}`, {
        headers: { "X-Public-Key": publicKey, "X-Secret-Key": secretKey },
      });
      if (!txRes.ok) {
        return NextResponse.json({ confirmed: false, pending: true });
      }
      const txData = await txRes.json();
      const txStatus = String(txData?.data?.status ?? txData?.status ?? "").toLowerCase();
      if (!["approved", "success", "completed", "paid"].includes(txStatus)) {
        return NextResponse.json({ confirmed: false, pending: true });
      }
    } catch {
      return NextResponse.json({ confirmed: false, pending: true });
    }
  } else {
    // Pas de transactionId (CinetPay) : le webhook est la source de vérité.
    // La commande est encore en attente — ne pas confirmer manuellement.
    return NextResponse.json({ confirmed: false, pending: true });
  }

  const confirmed = await confirmPurchase(reference);
  return NextResponse.json({ confirmed });
}
