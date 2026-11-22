import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const URLS_FILE = path.join(process.cwd(), "private", "ebook-urls.json");

function readUrls(): Record<string, string> {
  try {
    return JSON.parse(fs.readFileSync(URLS_FILE, "utf-8"));
  } catch {
    return {};
  }
}

function writeUrls(data: Record<string, string>) {
  fs.writeFileSync(URLS_FILE, JSON.stringify(data, null, 2), "utf-8");
}

// GET — lire tous les liens (admin uniquement)
export async function GET(req: NextRequest) {
  const pwd = req.headers.get("x-admin-password");
  if (pwd !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  return NextResponse.json(readUrls());
}

// POST — sauvegarder un lien Drive pour un ebook
export async function POST(req: NextRequest) {
  const pwd = req.headers.get("x-admin-password");
  if (pwd !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.ebookId) {
    return NextResponse.json({ error: "ebookId manquant" }, { status: 400 });
  }

  const urls = readUrls();

  if (body.driveUrl === "" || body.driveUrl === null) {
    // Supprimer le lien
    delete urls[body.ebookId];
  } else if (body.driveUrl) {
    urls[body.ebookId] = body.driveUrl;
  }

  writeUrls(urls);
  return NextResponse.json({ success: true });
}
