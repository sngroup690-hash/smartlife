import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

const FILE = path.join(process.cwd(), "private", "consultant-reviews.json");

export type ConsultantReview = {
  id: string;
  consultantId: string;
  auteur: string;
  note: number;
  contenu: string;
  statut: "en_attente" | "validee" | "rejetee";
  createdAt: string;
};

export async function readConsultantReviews(): Promise<ConsultantReview[]> {
  try {
    const raw = await readFile(FILE, "utf-8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function writeConsultantReviews(data: ConsultantReview[]): Promise<void> {
  await mkdir(path.dirname(FILE), { recursive: true });
  await writeFile(FILE, JSON.stringify(data, null, 2), "utf-8");
}

// GET ?consultantId=xxx → avis validés pour un consultant
export async function GET(req: NextRequest) {
  const consultantId = req.nextUrl.searchParams.get("consultantId");
  const all = await readConsultantReviews();
  const filtered = all.filter(
    (r) => r.statut === "validee" && (!consultantId || r.consultantId === consultantId)
  );
  return NextResponse.json(filtered, { headers: { "Cache-Control": "no-store" } });
}

// POST → soumettre un nouvel avis (statut en_attente par défaut)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { consultantId, auteur, note, contenu } = body;

    if (!consultantId || !String(auteur || "").trim() || !String(contenu || "").trim() || !note) {
      return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
    }

    const all = await readConsultantReviews();
    const review: ConsultantReview = {
      id: `crv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      consultantId: String(consultantId),
      auteur: String(auteur).trim().slice(0, 100),
      note: Math.min(5, Math.max(1, Number(note))),
      contenu: String(contenu).trim().slice(0, 1000),
      statut: "en_attente",
      createdAt: new Date().toISOString(),
    };

    all.push(review);
    await writeConsultantReviews(all);
    return NextResponse.json({ ok: true, review });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
