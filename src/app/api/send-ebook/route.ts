import { NextRequest, NextResponse } from "next/server";
import { ebooks as STATIC_EBOOKS } from "@/lib/data";
import { FORMATIONS } from "@/lib/formations-data";
import { createInvoice } from "@/lib/invoice-store";
import { buildInvoicePDF } from "@/lib/build-invoice-pdf";
import { readInvoiceConfig } from "@/lib/invoice-config";

export async function POST(req: NextRequest) {
  const {
    email, firstName, ebookIds, ebookTitles, formationTitles, magicToken,
    amount, currency, reference,
  } = await req.json() as {
    email: string;
    firstName: string;
    ebookIds: string[];
    ebookTitles: string[];
    formationTitles?: string[];
    magicToken?: string;
    amount?: number;
    currency?: string;
    reference?: string;
  };

  if (!email || (!ebookIds?.length && !magicToken)) {
    return NextResponse.json({ error: "email requis" }, { status: 400 });
  }

  const cfg = await readInvoiceConfig();

  const ebookItems = (ebookTitles?.length ? ebookTitles : (ebookIds ?? []).map((id) => id)).map((t) => ({ title: t, type: "Ebook" }));
  const formationItems = (formationTitles ?? []).map((t) => ({ title: t, type: "Formation" }));
  const allItems = [...ebookItems, ...formationItems];

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const espaceUrl = magicToken
    ? `${appUrl}/mon-espace?token=${encodeURIComponent(magicToken)}`
    : `${appUrl}/mon-espace`;

  const produitRows = allItems.length
    ? allItems.map((item) => `
        <tr>
          <td style="padding: 10px 14px; border-bottom: 1px solid #1e1e2e;">
            <span style="color: #ffffff; font-size: 14px;">${item.title}</span>
          </td>
          <td style="padding: 10px 14px; border-bottom: 1px solid #1e1e2e; text-align: right; white-space: nowrap;">
            <span style="background: #1e1e35; color: ${cfg.primaryColor}; font-size: 11px; padding: 2px 8px; border-radius: 20px; font-weight: 600;">${item.type}</span>
          </td>
        </tr>`).join("")
    : `<tr><td colspan="2" style="padding: 12px 14px; color: #888; font-size: 13px;">Vos produits</td></tr>`;

  const montantStr = amount && amount > 0
    ? `${amount.toLocaleString("fr-FR")} ${currency ?? "XAF"}`
    : null;

  const htmlContent = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#0d0d18;border-radius:16px;overflow:hidden;">

        <!-- Header -->
        <tr>
          <td style="background:#0d1730;padding:28px 36px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <div style="font-size:22px;font-weight:900;color:${cfg.primaryColor};letter-spacing:1px;">${cfg.companyName}</div>
                  <div style="font-size:12px;color:#8899aa;margin-top:3px;">${cfg.slogan}</div>
                </td>
                <td align="right">
                  <div style="background:${cfg.primaryColor};color:#000;font-size:11px;font-weight:700;padding:5px 12px;border-radius:20px;">ACHAT CONFIRMÉ ✓</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr><td style="height:3px;background:${cfg.primaryColor};"></td></tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px 36px;">
            <p style="color:#ccccdd;font-size:16px;margin:0 0 6px;">Bonjour <strong style="color:#ffffff;">${firstName}</strong>,</p>
            <p style="color:#8899aa;font-size:14px;margin:0 0 28px;line-height:1.6;">
              Merci pour votre achat ! Votre commande a bien été confirmée et vos produits sont prêts à être téléchargés.
            </p>

            <!-- Produits -->
            <div style="margin-bottom:28px;">
              <p style="color:${cfg.primaryColor};font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin:0 0 10px;">Produits achetés</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a14;border-radius:10px;overflow:hidden;border:1px solid #1e1e2e;">
                <thead>
                  <tr style="background:#111125;">
                    <th style="padding:10px 14px;text-align:left;color:#667;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;">Désignation</th>
                    <th style="padding:10px 14px;text-align:right;color:#667;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;">Type</th>
                  </tr>
                </thead>
                <tbody>
                  ${produitRows}
                </tbody>
                ${montantStr ? `
                <tfoot>
                  <tr style="background:#111125;">
                    <td style="padding:12px 14px;color:#8899aa;font-size:13px;font-weight:600;">Total payé</td>
                    <td style="padding:12px 14px;text-align:right;color:${cfg.primaryColor};font-size:16px;font-weight:900;">${montantStr}</td>
                  </tr>
                </tfoot>` : ""}
              </table>
            </div>

            <!-- CTA -->
            <p style="color:#8899aa;font-size:14px;margin:0 0 20px;line-height:1.6;">
              Cliquez sur le bouton ci-dessous pour accéder directement à vos téléchargements&nbsp;— aucun mot de passe requis&nbsp;:
            </p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="padding:4px 0 8px;">
                  <a href="${espaceUrl}"
                     style="display:inline-block;background:${cfg.primaryColor};color:#000000;font-weight:700;font-size:15px;padding:14px 36px;border-radius:10px;text-decoration:none;">
                    📥 Accéder à mes produits
                  </a>
                </td>
              </tr>
            </table>
            <p style="color:#556;font-size:12px;text-align:center;margin:8px 0 0;">Ce lien est valable 30 jours et vous connecte automatiquement.</p>

            ${montantStr ? `
            <p style="color:#667;font-size:13px;text-align:center;margin-top:24px;padding-top:20px;border-top:1px solid #1a1a28;">
              📄 Votre facture PDF est jointe à cet email.
            </p>` : ""}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#060610;padding:20px 36px;">
            <p style="color:#445;font-size:12px;margin:0;line-height:1.7;">
              Si vous n'avez pas effectué cet achat, ignorez cet email.<br>
              Pour toute question&nbsp;: <a href="mailto:${cfg.supportEmail}" style="color:${cfg.primaryColor};text-decoration:none;">${cfg.supportEmail}</a>
              &nbsp;|&nbsp; ${cfg.phone}
            </p>
            <p style="color:#334;font-size:11px;margin:10px 0 0;">${cfg.companyName} &nbsp;|&nbsp; ${cfg.website}</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  // ── Génération de la facture PDF ──────────────────────────────────────────
  let invoicePdfBase64: string | null = null;
  let invoiceId: string | null = null;

  if (amount && amount > 0) {
    try {
      // Construire la liste des produits pour la facture
      const products = [
        ...(ebookIds ?? []).map((id, i) => ({
          name: ebookTitles?.[i] ?? (STATIC_EBOOKS.find((e) => e.id === id)?.title ?? id),
          type: "ebook" as const,
        })),
        ...(formationTitles ?? []).map((titre) => ({
          name: titre,
          type: "formation" as const,
        })),
      ];

      const invoice = await createInvoice({
        reference: reference ?? "",
        clientName: firstName,
        clientEmail: email,
        products,
        totalAmount: amount,
        currency: currency ?? "XAF",
      });

      invoiceId = invoice.id;
      const pdfBuffer = await buildInvoicePDF(invoice);
      invoicePdfBase64 = pdfBuffer.toString("base64");

      console.log(`🧾 Facture générée : ${invoiceId} pour ${email}`);
    } catch (err) {
      console.error("Erreur génération facture:", err);
    }
  }

  // Log développement
  console.log(`\n📧 EMAIL à envoyer`);
  console.log(`   À: ${email} (${firstName})`);
  console.log(`   Produits: ${allItems.map((i) => i.title).join(", ")}`);
  if (invoiceId) console.log(`   Facture: ${invoiceId}\n`);

  const resendKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM ?? "noreply@smartlifecm.com";

  if (resendKey) {
    try {
      const payload: Record<string, unknown> = {
        from: fromEmail,
        to: [email],
        subject: `${cfg.companyName} — Votre achat est confirmé !`,
        html: htmlContent,
      };

      // Joindre la facture PDF si générée
      if (invoicePdfBase64 && invoiceId) {
        payload.attachments = [
          {
            filename: `Facture-${invoiceId}.pdf`,
            content: invoicePdfBase64,
            content_type: "application/pdf",
          },
        ];
      }

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        console.error("Resend error:", err);
        return NextResponse.json({ sent: false, error: "Erreur envoi email" }, { status: 500 });
      }

      console.log(`✅ Email envoyé via Resend à ${email}${invoiceId ? ` (facture ${invoiceId})` : ""}`);
      return NextResponse.json({ sent: true, invoiceId });
    } catch (err) {
      console.error("Erreur réseau Resend:", err);
      return NextResponse.json({ sent: false, error: "Erreur réseau" }, { status: 500 });
    }
  }

  console.log("ℹ️  RESEND_API_KEY non configuré — email simulé en mode développement");
  return NextResponse.json({ sent: true, dev: true, invoiceId });
}
