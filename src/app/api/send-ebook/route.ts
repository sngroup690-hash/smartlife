import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { lienGroupeWhatsApp, NUMERO_WHATSAPP } from "@/lib/groupe-whatsapp";
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
          <td style="padding:12px 14px;border-bottom:1px solid #f1f2f3;color:#111827;font-size:14px;font-weight:600;">📘 ${item.title}</td>
          <td style="padding:12px 14px;border-bottom:1px solid #f1f2f3;text-align:right;white-space:nowrap;color:#008f51;font-size:12px;font-weight:700;">${item.type}</td>
        </tr>`).join("")
    : `<tr><td colspan="2" style="padding:12px 14px;color:#6b7280;font-size:13px;">Vos produits</td></tr>`;

  // Lien du groupe WhatsApp : celui du premier guide acheté qui en a un, sinon le lien par défaut.
  let lienDuGuide: string | undefined;
  try {
    const donnees = JSON.parse(await readFile(path.join(process.cwd(), "private", "ebooks-data.json"), "utf-8"));
    lienDuGuide = (ebookIds ?? []).map((id: string) =>
      donnees.overrides?.[id]?.whatsappUrl || (donnees.ebooks ?? []).find((e: { id: string }) => e.id === id)?.whatsappUrl
    ).find(Boolean);
  } catch { /* lien par défaut */ }
  const lienGroupe = lienGroupeWhatsApp(lienDuGuide, allItems[0]?.title ?? "un guide");

  const montantStr = amount && amount > 0
    ? `${amount.toLocaleString("fr-FR")} ${currency ?? "XAF"}`
    : null;

  const htmlContent = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f6f3;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f6f3;padding:24px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e3ebe3;">

        <!-- En-tête -->
        <tr>
          <td style="background:linear-gradient(135deg,#1b7a1b,#27A827);background-color:#27A827;padding:26px 30px;">
            <div style="font-size:22px;font-weight:900;color:#ffffff;">${cfg.companyName}</div>
            <div style="font-size:13px;color:#e6f6e6;margin-top:4px;">${cfg.slogan}</div>
          </td>
        </tr>

        <!-- Corps -->
        <tr>
          <td style="padding:28px 30px 8px;">
            <p style="display:inline-block;background:#e9f8ee;color:#008f51;font-size:12px;font-weight:700;padding:5px 12px;border-radius:20px;margin:0 0 16px;">✅ ACHAT CONFIRMÉ</p>
            <p style="color:#111827;font-size:18px;font-weight:700;margin:0 0 6px;">Bravo ${firstName} 🎉</p>
            <p style="color:#374151;font-size:15px;margin:0 0 22px;line-height:1.6;">
              Votre paiement est confirmé. Votre guide est prêt : téléchargez-le maintenant, il reste disponible à vie dans votre espace.
            </p>

            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;margin-bottom:22px;">
              ${produitRows}
              ${montantStr ? `<tr><td style="padding:12px 14px;background:#f9fafb;color:#6b7280;font-size:13px;font-weight:600;">Total payé</td><td style="padding:12px 14px;background:#f9fafb;text-align:right;color:#008f51;font-size:16px;font-weight:900;">${montantStr}</td></tr>` : ""}
            </table>

            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td align="center" style="padding:2px 0 6px;">
                <a href="${espaceUrl}" style="display:inline-block;background:#008f51;color:#ffffff;font-weight:700;font-size:16px;padding:15px 34px;border-radius:12px;text-decoration:none;">
                  📥 Télécharger mon guide
                </a>
              </td></tr>
            </table>
            <p style="color:#6b7280;font-size:12px;text-align:center;margin:6px 0 0;">Aucun mot de passe : ce lien vous connecte directement (valable 30 jours).</p>
          </td>
        </tr>

        <!-- Groupe WhatsApp -->
        <tr>
          <td style="padding:22px 30px 26px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffbeb;border:2px dashed #E8B800;border-radius:14px;">
              <tr><td style="padding:20px 20px 22px;text-align:center;">
                <p style="color:#b45309;font-size:13px;font-weight:800;letter-spacing:.5px;margin:0 0 6px;">⚠️ CE N'EST PAS ENCORE FINI !</p>
                <p style="color:#111827;font-size:18px;font-weight:800;margin:0 0 8px;">Rejoignez maintenant le groupe WhatsApp des visionnaires</p>
                <p style="color:#374151;font-size:14px;line-height:1.6;margin:0 0 16px;">
                  Vous venez de rejoindre un écosystème complet : le guide, la communauté WhatsApp des visionnaires et la possibilité d'être accompagné(e) par un consultant du terrain pour lancer votre activité.
                </p>
                <a href="${lienGroupe}" style="display:inline-block;background:#25D366;color:#ffffff;font-weight:800;font-size:16px;padding:14px 28px;border-radius:12px;text-decoration:none;">
                  👥 Rejoindre le groupe WhatsApp
                </a>
              </td></tr>
            </table>
            ${montantStr ? `<p style="color:#6b7280;font-size:13px;text-align:center;margin:18px 0 0;">📄 Votre facture PDF est jointe à cet e-mail.</p>` : ""}
          </td>
        </tr>

        <!-- Pied -->
        <tr>
          <td style="background:#f9fafb;border-top:1px solid #eef0f2;padding:18px 30px;">
            <p style="color:#6b7280;font-size:12px;margin:0;line-height:1.7;">
              Une difficulté pour télécharger ? Écrivez-nous sur WhatsApp au <a href="https://wa.me/${NUMERO_WHATSAPP}" style="color:#008f51;text-decoration:none;font-weight:700;">+237 694 176 642</a>
              ou à <a href="mailto:${cfg.supportEmail}" style="color:#008f51;text-decoration:none;">${cfg.supportEmail}</a>.<br>
              Si vous n'avez pas effectué cet achat, ignorez cet e-mail.
            </p>
            <p style="color:#9ca3af;font-size:11px;margin:10px 0 0;">${cfg.companyName} · ${cfg.website}</p>
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
