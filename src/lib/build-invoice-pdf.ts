import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import type { InvoiceRecord } from "./invoice-store";
import { readInvoiceConfig } from "./invoice-config";

function safe(s: string): string {
  return s.replace(/[^\x00-\xFF]/g, (c) => {
    const map: Record<string, string> = {
      "—": "-", "–": "-",
      "‘": "'", "’": "'",
      "“": '"', "”": '"',
    };
    return map[c] ?? "?";
  });
}

function clip(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + "." : s;
}

function formatAmount(amount: number, currency: string): string {
  return `${amount.toLocaleString("fr-FR")} ${currency}`;
}

function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  return rgb(
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
  );
}

export async function buildInvoicePDF(invoice: InvoiceRecord): Promise<Buffer> {
  const cfg = await readInvoiceConfig();

  const doc = await PDFDocument.create();
  const W = 595, H = 842;
  const page = doc.addPage([W, H]);

  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const reg  = await doc.embedFont(StandardFonts.Helvetica);

  const NAVY   = rgb(0.05, 0.09, 0.18);
  const GOLD   = hexToRgb(cfg.primaryColor);
  const GREEN  = rgb(0.08, 0.56, 0.27);
  const WHITE  = rgb(1, 1, 1);
  const LGRAY  = rgb(0.95, 0.95, 0.95);
  const GRAY   = rgb(0.45, 0.45, 0.50);
  const DKGRAY = rgb(0.25, 0.25, 0.30);

  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: WHITE });
  page.drawRectangle({ x: 0, y: H - 90, width: W, height: 90, color: NAVY });

  const brand = safe(cfg.companyName);
  page.drawText(brand, { x: 40, y: H - 42, size: 24, font: bold, color: GOLD });

  const slogan = safe(cfg.slogan);
  page.drawText(slogan, { x: 40, y: H - 60, size: 8, font: reg, color: rgb(0.7, 0.7, 0.7) });

  const facture = "FACTURE";
  const factureW = bold.widthOfTextAtSize(facture, 28);
  page.drawText(facture, { x: W - 40 - factureW, y: H - 38, size: 28, font: bold, color: WHITE });

  const invNum = invoice.id;
  const invNumW = reg.widthOfTextAtSize(invNum, 11);
  page.drawText(invNum, { x: W - 40 - invNumW, y: H - 60, size: 11, font: reg, color: GOLD });

  page.drawRectangle({ x: 0, y: H - 93, width: W, height: 3, color: GOLD });

  let y = H - 130;

  page.drawText("Date", { x: 40, y, size: 9, font: bold, color: GRAY });
  const dateStr = new Date(invoice.createdAt).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "long", year: "numeric",
  });
  page.drawText(safe(dateStr), { x: 40, y: y - 14, size: 10, font: reg, color: DKGRAY });

  page.drawText("Ref. paiement", { x: 40, y: y - 36, size: 9, font: bold, color: GRAY });
  page.drawText(clip(safe(invoice.reference || "-"), 35), { x: 40, y: y - 50, size: 9, font: reg, color: DKGRAY });

  const clientLabel = "Facture etablie pour";
  page.drawText(clientLabel, { x: W - 200, y, size: 9, font: bold, color: GRAY });
  page.drawText(safe(clip(invoice.clientName || "Client", 30)), { x: W - 200, y: y - 14, size: 11, font: bold, color: NAVY });
  page.drawText(safe(invoice.clientEmail || ""), { x: W - 200, y: y - 28, size: 9, font: reg, color: DKGRAY });

  y -= 80;
  page.drawLine({ start: { x: 40, y }, end: { x: W - 40, y }, thickness: 1, color: LGRAY });
  y -= 20;

  page.drawRectangle({ x: 40, y: y - 4, width: W - 80, height: 26, color: NAVY });
  page.drawText("DESIGNATION", { x: 52, y: y + 6, size: 8, font: bold, color: WHITE });
  page.drawText("TYPE", { x: W - 160, y: y + 6, size: 8, font: bold, color: WHITE });
  y -= 20;

  let rowIndex = 0;
  for (const product of invoice.products) {
    const rowBg = rowIndex % 2 === 0 ? WHITE : LGRAY;
    page.drawRectangle({ x: 40, y: y - 6, width: W - 80, height: 24, color: rowBg });
    const name = safe(clip(product.name, 60));
    const type = product.type === "ebook" ? "Ebook" : product.type === "formation" ? "Formation" : "Produit";
    page.drawText(name, { x: 52, y: y + 4, size: 9, font: reg, color: DKGRAY });
    page.drawText(type, { x: W - 160, y: y + 4, size: 9, font: reg, color: GRAY });
    y -= 24;
    rowIndex++;
  }

  y -= 10;
  page.drawLine({ start: { x: 40, y }, end: { x: W - 40, y }, thickness: 1, color: LGRAY });
  y -= 18;
  page.drawRectangle({ x: W - 220, y: y - 6, width: 180, height: 30, color: GOLD });
  const totalLabel = "TOTAL PAYE";
  page.drawText(totalLabel, { x: W - 220 + 12, y: y + 8, size: 9, font: bold, color: NAVY });
  const totalStr = formatAmount(invoice.totalAmount, invoice.currency);
  const totalStrW = bold.widthOfTextAtSize(totalStr, 12);
  page.drawText(totalStr, { x: W - 40 - totalStrW, y: y + 8, size: 12, font: bold, color: NAVY });

  y -= 50;
  page.drawRectangle({ x: 40, y: y - 4, width: W - 80, height: 40, color: rgb(0.92, 1.0, 0.94) });
  page.drawLine({ start: { x: 40, y: y + 36 }, end: { x: W - 40, y: y + 36 }, thickness: 2, color: GREEN });
  page.drawLine({ start: { x: 52, y: y + 16 }, end: { x: 57, y: y + 10 }, thickness: 2, color: GREEN });
  page.drawLine({ start: { x: 57, y: y + 10 }, end: { x: 66, y: y + 22 }, thickness: 2, color: GREEN });

  const confText = safe(cfg.confirmationMessage);
  page.drawText(confText, { x: 74, y: y + 14, size: 10, font: bold, color: GREEN });

  page.drawRectangle({ x: 0, y: 0, width: W, height: 50, color: NAVY });
  const footLeft = safe(`${cfg.companyName} | ${cfg.website}`);
  page.drawText(footLeft, { x: 40, y: 28, size: 8, font: bold, color: rgb(0.7, 0.7, 0.7) });
  const footRight = safe(`${cfg.supportEmail} | ${cfg.phone}`);
  const frW = reg.widthOfTextAtSize(footRight, 8);
  page.drawText(footRight, { x: W - 40 - frW, y: 28, size: 8, font: reg, color: rgb(0.7, 0.7, 0.7) });

  const legal = safe(cfg.legalMention);
  const lW = reg.widthOfTextAtSize(legal, 7);
  page.drawText(legal, { x: (W - lW) / 2, y: 12, size: 7, font: reg, color: rgb(0.5, 0.5, 0.5) });

  return Buffer.from(await doc.save());
}