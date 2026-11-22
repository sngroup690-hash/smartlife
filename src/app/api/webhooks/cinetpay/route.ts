import { NextRequest, NextResponse } from "next/server";
import { readOrders, confirmPurchase } from "@/lib/purchase-guard";
import { getCinetpayToken, cinetpayBaseUrl } from "@/lib/cinetpay-token";
import { sendCapiEvent } from "@/lib/facebook-capi";
import { enregistrerAchat, enregistrerEchec } from "@/lib/smart-crm";

// CinetPay envoie le webhook en form-urlencoded OU JSON selon les versions
async function parseBody(req: NextRequest): Promise<Record<string, string>> {
  const ct = req.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    return req.json().catch(() => ({}));
  }
  const text = await req.text().catch(() => "");
  const result: Record<string, string> = {};
  for (const pair of text.split("&")) {
    const [k, v] = pair.split("=");
    if (k) result[decodeURIComponent(k)] = decodeURIComponent(v ?? "");
  }
  return result;
}

export async function POST(req: NextRequest) {
  const body = await parseBody(req);
  const { cpm_trans_id, cpm_result, cpm_amount, cpm_currency } = body;

  // CinetPay: cpm_result === "00" = succès
  if (cpm_result === "00" && cpm_trans_id) {
    const apiKey = process.env.CINETPAY_API_KEY;
    const apiPassword = process.env.CINETPAY_API_PASSWORD;

    if (apiKey && apiPassword) {
      try {
        const token = await getCinetpayToken(apiKey, apiPassword);
        const verifyRes = await fetch(
          `${cinetpayBaseUrl(apiKey)}/v1/payment/${encodeURIComponent(cpm_trans_id)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const verify = await verifyRes.json();
        // Status can be at root or nested in data
        const status: string | undefined = verify.status ?? verify.data?.status;

        if (status === "ACCEPTED") {
          // Lire la commande avant confirmation (elle est supprimée après)
          const orders = await readOrders();
          const order = orders.find((o) => o.reference === cpm_trans_id);

          const confirmed = await confirmPurchase(cpm_trans_id);
          if (confirmed) {
            console.log(`✅ CinetPay — achat confirmé: ref=${cpm_trans_id} montant=${cpm_amount} ${cpm_currency}`);
            // Smart CRM — contact du téléphone + fiche CRM
            if (order) {
              const noms = Object.values(order.productNames || {});
              enregistrerAchat({
                email: order.customerEmail || "",
                nom: order.customerName || null,
                telephone: order.customerPhone || null,
                produits: noms.join(", ") || "Achat Smart Life",
                montant: parseFloat(cpm_amount || "0"),
              }).catch(() => {});
            }
            // CAPI Purchase — même event_id que le pixel côté client → déduplication Facebook
            sendCapiEvent(
              "Purchase",
              `purchase_${cpm_trans_id}`,
              { email: order?.customerEmail, phone: order?.customerPhone },
              {
                value: parseFloat(cpm_amount || "0"),
                currency: cpm_currency || "XAF",
                contentIds: order?.ebookIds?.length ? order.ebookIds : undefined,
              }
            ).catch(() => {});
          } else {
            console.warn(`⚠️ CinetPay — paiement vérifié mais commande introuvable: ref=${cpm_trans_id}`);
          }
        } else {
          console.warn("CinetPay: statut non accepté:", status, verify.message);
        }
      } catch (err) {
        console.error("CinetPay vérification échouée:", err);
      }
    }
  } else if (cpm_result && cpm_result !== "00") {
    console.warn(`CinetPay: paiement échoué — cpm_result=${cpm_result} ref=${cpm_trans_id}`);
    // Smart CRM — noter l'échec pour relance
    if (cpm_trans_id) {
      const orders = await readOrders();
      const order = orders.find((o) => o.reference === cpm_trans_id);
      if (order?.customerEmail) {
        const noms = Object.values(order.productNames || {});
        enregistrerEchec({
          email: order.customerEmail,
          nom: order.customerName || null,
          telephone: order.customerPhone || null,
          produits: noms.join(", ") || "Achat Smart Life",
        }).catch(() => {});
      }
    }
  }

  // CinetPay attend toujours HTTP 200 — sinon il réessaie indéfiniment
  return NextResponse.json({ received: true });
}
