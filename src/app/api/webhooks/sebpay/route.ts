import { NextRequest, NextResponse } from "next/server";
import { readOrders, confirmPurchase } from "@/lib/purchase-guard";
import { recordFailedTransaction } from "@/lib/transaction-store";
import { sendCapiEvent } from "@/lib/facebook-capi";
import { enregistrerAchat, enregistrerEchec } from "@/lib/smart-crm";

const SEBPAY_BASE = "https://newapi.sebpay.bj/api/v1";
const SUCCESS_STATUSES = ["approved", "success", "completed", "paid"];

export async function POST(req: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ received: true });
  }

  const { transaction_id, external_reference, status, amount, currency } = body as {
    transaction_id?: string;
    external_reference?: string;
    status?: string;
    amount?: number;
    currency?: string;
  };

  const normalizedStatus = String(status || "").toLowerCase();

  if (SUCCESS_STATUSES.includes(normalizedStatus) && external_reference) {
    // 1. La référence doit exister dans nos commandes en attente
    const orders = await readOrders();
    const order = orders.find((o) => o.reference === external_reference);
    if (!order) {
      console.log(`Sebpay webhook — référence inconnue ou déjà traitée: ref=${external_reference}`);
      return NextResponse.json({ received: true });
    }

    // 2. transaction_id requis pour pouvoir vérifier côté Sebpay
    if (!transaction_id) {
      console.warn(`Sebpay webhook — transaction_id manquant, ignoré: ref=${external_reference}`);
      return NextResponse.json({ received: true });
    }

    // 3. Vérifier le statut réel auprès de l'API Sebpay avant de confirmer
    const publicKey = process.env.SEBPAY_PUBLIC_KEY;
    const secretKey = process.env.SEBPAY_SECRET_KEY;

    if (!publicKey || !secretKey) {
      console.error("Sebpay webhook — clés API manquantes, impossible de vérifier");
      return NextResponse.json({ received: true });
    }

    try {
      const txRes = await fetch(`${SEBPAY_BASE}/collections/${transaction_id}`, {
        headers: { "X-Public-Key": publicKey, "X-Secret-Key": secretKey },
      });

      if (!txRes.ok) {
        console.warn(`Sebpay webhook — vérification API échouée (${txRes.status}): txn=${transaction_id}`);
        return NextResponse.json({ received: true });
      }

      const txData = await txRes.json();
      const realStatus = String(txData?.data?.status || txData?.status || "").toLowerCase();

      if (!SUCCESS_STATUSES.includes(realStatus)) {
        console.warn(`Sebpay webhook rejeté — API: "${realStatus}" ≠ webhook: "${status}": ref=${external_reference}`);
        return NextResponse.json({ received: true });
      }
    } catch (err) {
      console.error(`Sebpay webhook — erreur vérification API: txn=${transaction_id}`, err);
      return NextResponse.json({ received: true });
    }

    const confirmed = await confirmPurchase(external_reference);
    if (confirmed) {
      console.log(`✅ Sebpay — achat confirmé: ref=${external_reference} txn=${transaction_id} montant=${amount} ${currency}`);
      // Smart CRM — contact du téléphone + fiche CRM
      const noms = Object.values(order.productNames || {});
      enregistrerAchat({
        email: order.customerEmail || "",
        nom: order.customerName || null,
        telephone: order.customerPhone || null,
        produits: noms.join(", ") || "Achat Smart Life",
        montant: typeof amount === "number" ? amount : parseFloat(String(amount || "0")),
      }).catch(() => {});
      // CAPI Purchase — même event_id que le pixel côté client → déduplication Facebook
      sendCapiEvent(
        "Purchase",
        `purchase_${external_reference}`,
        { email: order.customerEmail, phone: order.customerPhone },
        {
          value: typeof amount === "number" ? amount : parseFloat(String(amount || "0")),
          currency: String(currency || "XAF"),
          contentIds: order.ebookIds?.length ? order.ebookIds : undefined,
        }
      ).catch(() => {});
    } else {
      console.warn(`⚠️ Sebpay — paiement vérifié mais commande introuvable: ref=${external_reference}`);
    }
  } else if (["rejected", "failed", "cancelled"].includes(normalizedStatus)) {
    console.warn(`Sebpay: paiement échoué — ref=${external_reference} txn=${transaction_id} status=${status}`);
    // Smart CRM — noter l'échec pour relance
    if (external_reference) {
      const orders = await readOrders();
      const failedOrder = orders.find((o) => o.reference === external_reference);
      if (failedOrder?.customerEmail) {
        const noms = Object.values(failedOrder.productNames || {});
        enregistrerEchec({
          email: failedOrder.customerEmail,
          nom: failedOrder.customerName || null,
          telephone: failedOrder.customerPhone || null,
          produits: noms.join(", ") || "Achat Smart Life",
        }).catch(() => {});
      }
      await recordFailedTransaction({
        reference: external_reference,
        transactionId: transaction_id,
        sebpayStatus: String(status || "failed"),
        amount: amount,
        currency: currency,
      }).catch(err => console.error("recordFailedTransaction error:", err));
    }
  } else {
    console.log(`Sebpay webhook reçu: status=${status} ref=${external_reference}`);
  }

  return NextResponse.json({ received: true });
}
