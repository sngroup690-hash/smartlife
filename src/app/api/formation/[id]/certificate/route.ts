import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, rgb, StandardFonts, degrees } from "pdf-lib";
import { readFile } from "fs/promises";
import path from "path";
import { readUsers } from "@/lib/purchase-guard";
import { hasFormationAccess } from "@/lib/purchase-guard";
import { issueCertificate, readCertConfig, certVerifyToken } from "@/lib/certificate-store";
import { FORMATIONS } from "@/lib/formations-data";
import type { Formation } from "@/lib/formations-data";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://smartlifecm.com";

function clip(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 2) + "..." : s;
}

// Supprime les caractères hors WinAnsi (> U+00FF) pour éviter les erreurs pdf-lib
function safe(s: string): string {
  return s.replace(/[^\x00-\xFF]/g, (c) => {
    if (c === "—" || c === "–") return "-";
    if (c === "‘" || c === "’") return "'";
    if (c === "“" || c === "”") return '"';
    return "?";
  });
}

async function buildCertificatePDF(
  certId: string,
  userName: string,
  formationTitle: string,
  level: string,
  completedDate: string,
  issuedDate: string,
  signatoryName: string,
  signatoryTitle: string,
  orgName: string,
  footerText: string,
): Promise<Buffer> {
  // Sanitiser tous les textes dynamiques avant embedding
  userName = safe(userName);
  formationTitle = safe(formationTitle);
  signatoryName = safe(signatoryName);
  signatoryTitle = safe(signatoryTitle);
  orgName = safe(orgName);
  footerText = safe(footerText);

  const doc = await PDFDocument.create();
  // Paysage A4
  const W = 842, H = 595;
  const page = doc.addPage([W, H]);

  const bold     = await doc.embedFont(StandardFonts.HelveticaBold);
  const reg      = await doc.embedFont(StandardFonts.Helvetica);
  const timesBold = await doc.embedFont(StandardFonts.TimesRomanBold);
  const times    = await doc.embedFont(StandardFonts.TimesRoman);

  // ── Palette ──────────────────────────────────────────────────────────────────
  const NAVY    = rgb(0.05, 0.09, 0.18);
  const GOLD    = rgb(0.83, 0.63, 0.05);
  const GOLD2   = rgb(0.91, 0.72, 0.00);
  const GREEN   = rgb(0.08, 0.56, 0.27);
  const WHITE   = rgb(1, 1, 1);
  const LGRAY   = rgb(0.97, 0.96, 0.93);
  const GRAY    = rgb(0.45, 0.45, 0.50);
  const CREAM   = rgb(0.99, 0.98, 0.95);

  // ── Fond crème ───────────────────────────────────────────────────────────────
  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: CREAM });

  // ── Cadre décoratif double ────────────────────────────────────────────────────
  const M = 18;
  page.drawRectangle({ x: M, y: M, width: W - 2*M, height: H - 2*M, borderColor: GOLD, borderWidth: 2.5, color: CREAM });
  page.drawRectangle({ x: M+6, y: M+6, width: W - 2*(M+6), height: H - 2*(M+6), borderColor: GOLD, borderWidth: 0.8, color: CREAM });

  // ── Coins dorés ──────────────────────────────────────────────────────────────
  const cornerSize = 20;
  for (const [cx, cy] of [[M, M+cornerSize], [M, H-M], [W-M, M+cornerSize], [W-M, H-M]]) {
    page.drawLine({ start: { x: cx, y: cy }, end: { x: cx, y: cy - cornerSize }, thickness: 2.5, color: GOLD2 });
    const dx = cx === M ? cornerSize : -cornerSize;
    page.drawLine({ start: { x: cx, y: cy - cornerSize }, end: { x: cx + dx, y: cy - cornerSize }, thickness: 2.5, color: GOLD2 });
  }

  // ── Bandeau supérieur ─────────────────────────────────────────────────────────
  page.drawRectangle({ x: M+7, y: H-M-7-50, width: W-2*(M+7), height: 50, color: NAVY });
  page.drawRectangle({ x: M+7, y: H-M-7-53, width: W-2*(M+7), height: 3, color: GOLD });

  // Nom organisation
  const orgW = bold.widthOfTextAtSize(orgName, 20);
  page.drawText(orgName, { x: (W - orgW) / 2, y: H-M-7-35, size: 20, font: bold, color: GOLD });

  // Numéro certificat (discret en haut à droite)
  const certIdLabel = `N° ${certId}`;
  const cidW = reg.widthOfTextAtSize(certIdLabel, 8);
  page.drawText(certIdLabel, { x: W - M - 7 - cidW - 6, y: H-M-7-20, size: 8, font: reg, color: GOLD, opacity: 0.9 });

  // ── Corps principal ───────────────────────────────────────────────────────────
  let y = H - M - 7 - 50 - 28;

  // Titre du certificat
  const title1 = "CERTIFICAT";
  const title2 = "DE RÉUSSITE";
  const t1w = timesBold.widthOfTextAtSize(title1, 34);
  const t2w = bold.widthOfTextAtSize(title2, 22);
  page.drawText(title1, { x: (W - t1w) / 2, y, size: 34, font: timesBold, color: NAVY });
  y -= 32;
  page.drawText(title2, { x: (W - t2w) / 2, y, size: 22, font: bold, color: GOLD });
  y -= 10;

  // Ligne décorative or
  const lineW = 180;
  page.drawLine({ start: { x: (W - lineW) / 2, y }, end: { x: (W + lineW) / 2, y }, thickness: 1.5, color: GOLD });
  page.drawEllipse({ x: W / 2, y, xScale: 4, yScale: 4, color: GOLD });
  y -= 22;

  // "Décerné à"
  const decerneLabel = "Décerné à";
  const dlW = times.widthOfTextAtSize(decerneLabel, 12);
  page.drawText(decerneLabel, { x: (W - dlW) / 2, y, size: 12, font: times, color: GRAY });
  y -= 32;

  // Nom de l'apprenant (gros)
  const nameText = clip(userName || "-", 40);
  const nameSize = nameText.length > 28 ? 28 : 34;
  const nameW = timesBold.widthOfTextAtSize(nameText, nameSize);
  page.drawText(nameText, { x: (W - nameW) / 2, y, size: nameSize, font: timesBold, color: NAVY });
  y -= nameSize + 6;

  // Ligne sous le nom
  page.drawLine({ start: { x: (W - nameW) / 2, y }, end: { x: (W + nameW) / 2, y }, thickness: 1, color: GOLD, opacity: 0.5 });
  y -= 22;

  // Phrase centrale
  const phrase = "Pour avoir suivi et complété avec succès la formation :";
  const phraseW = reg.widthOfTextAtSize(phrase, 11);
  page.drawText(phrase, { x: (W - phraseW) / 2, y, size: 11, font: reg, color: GRAY });
  y -= 22;

  // Titre formation
  const formTitle = clip(formationTitle, 70);
  const ftSize = formTitle.length > 50 ? 15 : 18;
  const ftW = bold.widthOfTextAtSize(formTitle, ftSize);
  page.drawText(formTitle, { x: (W - ftW) / 2, y, size: ftSize, font: bold, color: NAVY });
  y -= ftSize + 10;

  // Niveau + Date de complétion
  const metaText = `Niveau : ${level}   ·   Complété le ${completedDate}`;
  const metaW = reg.widthOfTextAtSize(metaText, 10);
  page.drawText(metaText, { x: (W - metaW) / 2, y, size: 10, font: reg, color: GRAY });
  y -= 26;

  // ── Zone signatures ───────────────────────────────────────────────────────────
  const sigY = M + 7 + 60;
  const sigLineW = 160;

  // Signature gauche — Signataire
  const sigLX = M + 50;
  page.drawLine({ start: { x: sigLX, y: sigY + 18 }, end: { x: sigLX + sigLineW, y: sigY + 18 }, thickness: 1, color: GOLD, opacity: 0.6 });
  // Nom signataire stylisé (simuler signature)
  const sigNameParts = signatoryName.split(" ");
  const sigDisplay = sigNameParts.map((w, i) => i === 0 ? w : w[0] + ".").join(" ");
  page.drawText(sigDisplay, { x: sigLX + 8, y: sigY + 22, size: 13, font: timesBold, color: NAVY, opacity: 0.85 });
  page.drawText(clip(signatoryName, 28), { x: sigLX + sigLineW/2 - bold.widthOfTextAtSize(clip(signatoryName, 28), 9)/2, y: sigY + 6, size: 9, font: bold, color: NAVY });
  page.drawText(clip(signatoryTitle, 32), { x: sigLX + sigLineW/2 - reg.widthOfTextAtSize(clip(signatoryTitle, 32), 8)/2, y: sigY - 4, size: 8, font: reg, color: GRAY });

  // Tampon / Sceau central
  // Cercle extérieur
  page.drawEllipse({ x: W/2, y: sigY + 14, xScale: 38, yScale: 38, borderColor: NAVY, borderWidth: 2, color: CREAM });
  page.drawEllipse({ x: W/2, y: sigY + 14, xScale: 30, yScale: 30, borderColor: GOLD, borderWidth: 1.2, color: CREAM });
  // Texte dans le sceau — ASCII uniquement (WinAnsi safe)
  const sealText = "CERTIFIE";
  const stW = bold.widthOfTextAtSize(sealText, 7.5);
  page.drawText(sealText, { x: W/2 - stW/2, y: sigY + 18, size: 7.5, font: bold, color: NAVY });
  const slText = "SMART LIFE";
  const slW = bold.widthOfTextAtSize(slText, 6);
  page.drawText(slText, { x: W/2 - slW/2, y: sigY + 9, size: 6, font: bold, color: GOLD });
  // Checkmark vectoriel (lignes) — évite le caractère Unicode U+2713 non supporté par WinAnsi
  page.drawLine({ start: { x: W/2 - 4, y: sigY + 28 }, end: { x: W/2 - 1, y: sigY + 24 }, thickness: 2, color: GREEN });
  page.drawLine({ start: { x: W/2 - 1, y: sigY + 24 }, end: { x: W/2 + 6, y: sigY + 32 }, thickness: 2, color: GREEN });

  // Date droite
  const dateLX = W - M - 50 - sigLineW;
  page.drawLine({ start: { x: dateLX, y: sigY + 18 }, end: { x: dateLX + sigLineW, y: sigY + 18 }, thickness: 1, color: GOLD, opacity: 0.6 });
  const dateLabel = "Date de délivrance";
  const dlLW = reg.widthOfTextAtSize(dateLabel, 9);
  page.drawText(issuedDate, { x: dateLX + sigLineW/2 - bold.widthOfTextAtSize(issuedDate, 10)/2, y: sigY + 22, size: 10, font: bold, color: NAVY });
  page.drawText(dateLabel, { x: dateLX + sigLineW/2 - dlLW/2, y: sigY + 6, size: 9, font: reg, color: GRAY });

  // ── Pied de page ──────────────────────────────────────────────────────────────
  page.drawRectangle({ x: M+7, y: M+7, width: W-2*(M+7), height: 22, color: NAVY });
  const ftW2 = reg.widthOfTextAtSize(clip(footerText, 100), 7.5);
  page.drawText(clip(footerText, 100), { x: (W - ftW2) / 2, y: M + 13, size: 7.5, font: reg, color: WHITE, opacity: 0.7 });
  // Verify URL
  const verifyUrl = `${APP_URL}/certificats/verifier?id=${certId}`;
  const vW = reg.widthOfTextAtSize(verifyUrl, 7);
  page.drawText(verifyUrl, { x: W - M - 7 - vW - 4, y: M + 7 + 24, size: 7, font: reg, color: GRAY, opacity: 0.6 });

  // ── Filigrane discret ─────────────────────────────────────────────────────────
  const wm = "SMART LIFE";
  const wmSize = 52;
  const wmW = bold.widthOfTextAtSize(wm, wmSize);
  page.drawText(wm, {
    x: (W - wmW) / 2, y: (H - wmSize) / 2 - 20,
    size: wmSize, font: bold, color: GOLD, opacity: 0.04,
    rotate: degrees(-20),
  });

  return Buffer.from(await doc.save());
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: formationId } = await params;
  const body = await req.json() as { userId: string; completedAt?: string };
  const { userId, completedAt } = body;

  if (!userId) return NextResponse.json({ error: "userId requis" }, { status: 400 });

  // Vérifier l'accès à la formation
  const hasAccess = await hasFormationAccess(userId, formationId);
  if (!hasAccess) return NextResponse.json({ error: "Formation non achetée" }, { status: 403 });

  // Récupérer les infos de la formation (statiques + dynamiques via fichier JSON)
  let formation: Formation | undefined = FORMATIONS.find((f) => f.id === formationId);
  if (!formation) {
    try {
      const raw = await readFile(path.join(process.cwd(), "private", "formations-data.json"), "utf-8");
      const data = JSON.parse(raw);
      const dynamicFormations: Formation[] = (data.formations || []).filter(
        (f: Formation & { actif?: boolean }) => f.actif !== false
      );
      formation = dynamicFormations.find((f) => f.id === formationId);
    } catch { /* fichier absent */ }
  }
  const formationTitle = formation?.titre || formationId;
  const level = formation?.niveau || "Intermediaire";

  // Récupérer les infos utilisateur
  const users = await readUsers();
  const user = users.find((u) => u.id === userId);
  const firstName = (user as { firstName?: string })?.firstName || "";
  const lastName = (user as { lastName?: string })?.lastName || "";
  const userName = `${firstName} ${lastName}`.trim() || "Apprenant";
  const userEmail = (user?.email as string) || "";

  // Émettre le certificat (idempotent)
  const cert = await issueCertificate({
    userId,
    userName,
    userEmail,
    formationId,
    formationTitle,
    level,
    completedAt: completedAt || new Date().toISOString(),
  });

  const token = certVerifyToken(cert.id, userId);

  return NextResponse.json({
    certId: cert.id,
    downloadUrl: `/api/formation/${formationId}/certificate?uid=${encodeURIComponent(userId)}&token=${token}&certId=${encodeURIComponent(cert.id)}`,
    cert,
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: formationId } = await params;
  const uid = req.nextUrl.searchParams.get("uid");
  const token = req.nextUrl.searchParams.get("token");
  const certId = req.nextUrl.searchParams.get("certId");

  // Route de téléchargement direct via query params
  if (uid && token && certId) {
    const expectedToken = certVerifyToken(certId, uid);
    if (token !== expectedToken) {
      return new NextResponse("Lien invalide", { status: 403 });
    }

    const { readCertificates } = await import("@/lib/certificate-store");
    const certs = await readCertificates();
    const cert = certs.find((c) => c.id === certId && c.valid);
    if (!cert) return new NextResponse("Certificat introuvable ou invalidé", { status: 404 });

    const config = await readCertConfig();
    const completedDate = new Date(cert.completedAt).toLocaleDateString("fr-FR", {
      day: "2-digit", month: "long", year: "numeric",
    });
    const issuedDate = new Date(cert.issuedAt).toLocaleDateString("fr-FR", {
      day: "2-digit", month: "long", year: "numeric",
    });

    const pdf = await buildCertificatePDF(
      cert.id, cert.userName, cert.formationTitle, cert.level,
      completedDate, issuedDate,
      config.signatoryName, config.signatoryTitle,
      config.organizationName, config.footerText,
    );

    const filename = `Certificat-SmartLife-${cert.id}.pdf`;
    return new NextResponse(pdf as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
        "Content-Length": pdf.length.toString(),
        "Cache-Control": "private, no-store",
      },
    });
  }

  // Vérifier si l'utilisateur a déjà un certificat pour cette formation
  const checkUid = req.nextUrl.searchParams.get("checkUid");
  if (checkUid) {
    const { readCertificates } = await import("@/lib/certificate-store");
    const certs = await readCertificates();
    const cert = certs.find((c) => c.userId === checkUid && c.formationId === formationId && c.valid);
    if (cert) {
      const tk = certVerifyToken(cert.id, checkUid);
      return NextResponse.json({
        exists: true,
        certId: cert.id,
        downloadUrl: `/api/formation/${formationId}/certificate?uid=${encodeURIComponent(checkUid)}&token=${tk}&certId=${encodeURIComponent(cert.id)}`,
      });
    }
    return NextResponse.json({ exists: false });
  }

  return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
}
