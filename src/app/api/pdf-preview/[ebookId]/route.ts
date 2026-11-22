import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import { PDFDocument } from "pdf-lib";

const DIR = path.join(process.cwd(), "private", "pdf-previews");
const EBOOKS_DIR = path.join(process.cwd(), "private", "ebooks");
const URLS_FILE = path.join(process.cwd(), "private", "ebook-urls.json");
const PAGES_APERCU = 3;
const TAILLE_MAX = 80 * 1024 * 1024;

// Guides sans PDF connu : on ne recherche pas à chaque visite (10 minutes de pause).
const absents = new Map<string, number>();
const enCours = new Map<string, Promise<Buffer | null>>();

function lienDirect(url: string): string {
  const drive = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=)([^/?&]+)/);
  if (drive) return `https://drive.google.com/uc?export=download&id=${drive[1]}`;
  if (url.includes("dropbox.com")) return url.replace(/([?&])dl=0/, "$1dl=1");
  return url;
}

async function pdfComplet(id: string): Promise<Buffer | null> {
  try { return await readFile(path.join(EBOOKS_DIR, `${id}.pdf`)); } catch { /* pas de fichier local */ }
  let liens: Record<string, string> = {};
  try { liens = JSON.parse(await readFile(URLS_FILE, "utf-8")); } catch { /* aucun lien enregistré */ }
  const url = liens[id];
  if (!url) return null;
  const rep = await fetch(lienDirect(url), { redirect: "follow", signal: AbortSignal.timeout(60_000) });
  if (!rep.ok) return null;
  const octets = Buffer.from(await rep.arrayBuffer());
  if (octets.length > TAILLE_MAX || octets.subarray(0, 5).toString() !== "%PDF-") return null;
  return octets;
}

async function fabriquerApercu(id: string): Promise<Buffer | null> {
  const complet = await pdfComplet(id);
  if (!complet) return null;
  const source = await PDFDocument.load(complet, { ignoreEncryption: true });
  const apercu = await PDFDocument.create();
  const nb = Math.min(PAGES_APERCU, source.getPageCount());
  const pages = await apercu.copyPages(source, Array.from({ length: nb }, (_, i) => i));
  pages.forEach((p) => apercu.addPage(p));
  const octets = Buffer.from(await apercu.save());
  await mkdir(DIR, { recursive: true });
  await writeFile(path.join(DIR, `${id}.pdf`), octets);
  return octets;
}

function reponsePdf(buffer: Buffer) {
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "inline",
      "Cache-Control": "public, max-age=86400",
    },
  });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ ebookId: string }> }
) {
  const { ebookId } = await params;
  const id = ebookId.replace(/[^a-zA-Z0-9_-]/g, "");
  if (!id) return NextResponse.json({ error: "ID invalide" }, { status: 400 });

  try {
    return reponsePdf(await readFile(path.join(DIR, `${id}.pdf`)));
  } catch { /* aperçu pas encore fabriqué */ }

  if ((absents.get(id) ?? 0) > Date.now()) {
    return NextResponse.json({ error: "Aperçu non disponible" }, { status: 404 });
  }
  let travail = enCours.get(id);
  if (!travail) {
    travail = fabriquerApercu(id).catch(() => null).finally(() => enCours.delete(id));
    enCours.set(id, travail);
  }
  const apercu = await travail;
  if (!apercu) {
    absents.set(id, Date.now() + 10 * 60_000);
    return NextResponse.json({ error: "Aperçu non disponible" }, { status: 404 });
  }
  return reponsePdf(apercu);
}
