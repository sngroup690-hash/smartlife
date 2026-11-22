// Crontab VPS : */2 * * * * curl -s -H "x-admin-password: $ADMIN_PASSWORD" "http://localhost:3000/api/cron/payment-cleanup" > /dev/null 2>&1
import { NextRequest, NextResponse } from "next/server";
import { readOrders, writeOrders, confirmPurchase } from "@/lib/purchase-guard";
import { recordFailedTransaction, recordAbandonedTransaction } from "@/lib/transaction-store";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const SEBPAY_BASE = "https://newapi.sebpay.bj/api/v1";
const FIVE_MINUTES_MS = 5 * 60 * 1000;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret") || req.headers.get("x-admin-password") || "";
  if (secret !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const orders = await readOrders();
  const now = Date.now();

  const expired = orders.filter(o => now - new Date(o.createdAt).getTime() >= FIVE_MINUTES_MS);
  if (expired.length === 0) {
    return NextResponse.json({ processed: 0, message: "Aucune commande expirée" });
  }

  const publicKey = process.env.SEBPAY_PUBLIC_KEY || "";
  const secretKey = process.env.SEBPAY_SECRET_KEY || "";

  let confirmed = 0, failed = 0, abandoned = 0;
  const toRemove = new Set<string>();

  for (const order of expired) {
    // Si transactionId Sebpay disponible → interroger l'API
    if (order.transactionId && publicKey && secretKey) {
      try {
        const res = await fetch(`${SEBPAY_BASE}/collections/${order.transactionId}`, {
          headers: { "X-Public-Key": publicKey, "X-Secret-Key": secretKey },
        });
        if (res.ok) {
          const data = await res.json();
          const txStatus = String(data?.data?.status || data?.status || "").toLowerCase();

          if (["approved", "success", "completed", "paid"].includes(txStatus)) {
            await confirmPurchase(order.reference);
            confirmed++;
            toRemove.add(order.reference);
            continue;
          }

          if (["rejected", "failed", "cancelled"].includes(txStatus)) {
            await recordFailedTransaction({
              reference: order.reference,
              transactionId: order.transactionId,
              sebpayStatus: txStatus,
              amount: order.amount,
              currency: order.currency,
            }).catch(() => {});
            failed++;
            toRemove.add(order.reference);
            continue;
          }
        }
      } catch { /* Sebpay inaccessible — marquer abandonné */ }
    }

    // Pas de transactionId ou statut inconnu → abandonné
    await recordAbandonedTransaction({
      reference: order.reference,
      amount: order.amount,
      currency: order.currency,
      reason: "timeout",
    }).catch(() => {});
    abandoned++;
    toRemove.add(order.reference);
  }

  // Retirer les commandes traitées de pending-orders.json
  if (toRemove.size > 0) {
    const remaining = orders.filter(o => !toRemove.has(o.reference));
    await writeOrders(remaining);
  }

  console.log(`[payment-cleanup] confirmed=${confirmed} failed=${failed} abandoned=${abandoned}`);
  return NextResponse.json({ processed: toRemove.size, confirmed, failed, abandoned });
}
