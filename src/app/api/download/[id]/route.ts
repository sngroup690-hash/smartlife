import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import crypto from "crypto";
import path from "path";

const SECRET = process.env.DOWNLOAD_SECRET;
const EBOOKS_DIR = path.join(process.cwd(), "private", "ebooks");
const URLS_FILE = path.join(process.cwd(), "private", "ebook-urls.json");

function hourBucket(): number {
  return Math.floor(Date.now() / 1000 / 3600);
}

function makeToken(ebookId: string, userId: string, bucket: number): string {
  return crypto
    .createHmac("sha256", SECRET!)
    .update(`${ebookId}:${userId}:${bucket}`)
    .digest("hex");
}

function isValidToken(ebookId: string, userId: string, token: string): boolean {
  const bucket = hourBucket();
  // Accepter le bucket courant et le précédent (token généré en fin d'heure)
  return (
    crypto.timingSafeEqual(Buffer.from(makeToken(ebookId, userId, bucket), "hex"), Buffer.from(token, "hex")) ||
    crypto.timingSafeEqual(Buffer.from(makeToken(ebookId, userId, bucket - 1), "hex"), Buffer.from(token, "hex"))
  );
}

function readEbookUrls(): Record<string, string> {
  try {
    const raw = require("fs").readFileSync(URLS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!SECRET) {
    return NextResponse.json({ error: "Serveur non configuré" }, { status: 500 });
  }

  const { id: ebookId } = await params;
  const uid = req.nextUrl.searchParams.get("uid");
  const token = req.nextUrl.searchParams.get("token");

  if (!ebookId || !uid || !token) {
    return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
  }

  // Sécuriser les IDs contre path traversal
  const safeEbookId = ebookId.replace(/[^a-zA-Z0-9_-]/g, "");
  const safeUid = uid.replace(/[^a-zA-Z0-9_-]/g, "");
  if (!safeEbookId || !safeUid) {
    return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
  }

  // Vérifier que le token a bien la longueur d'un hex HMAC-SHA256
  if (!/^[a-f0-9]{64}$/.test(token)) {
    return NextResponse.json({ error: "Token invalide" }, { status: 403 });
  }

  // Vérification cryptographique du token
  if (!isValidToken(safeEbookId, safeUid, token)) {
    return NextResponse.json({ error: "Token expiré ou invalide" }, { status: 403 });
  }

  // Priorité 1 : URL externe (Google Drive, etc.) configurée par l'admin
  const ebookUrls = readEbookUrls();
  if (ebookUrls[ebookId]) {
    return NextResponse.redirect(ebookUrls[ebookId]);
  }

  // Priorité 2 : Fichier PDF local
  const filePath = path.join(EBOOKS_DIR, `${safeEbookId}.pdf`);
  try {
    const buffer = await readFile(filePath);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeEbookId}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "Fichier introuvable" }, { status: 404 });
  }
}
