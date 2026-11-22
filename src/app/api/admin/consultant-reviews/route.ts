import { NextRequest, NextResponse } from "next/server";
import { readConsultantReviews, writeConsultantReviews } from "@/app/api/consultant-reviews/route";
import { isValidAdminPassword } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

function auth(req: NextRequest): boolean {
  const h = req.headers.get("x-admin-password");
  const q = req.nextUrl.searchParams.get("password");
  return isValidAdminPassword(h) || isValidAdminPassword(q);
}

// GET → tous les avis consultants (admin)
export async function GET(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const consultantId = req.nextUrl.searchParams.get("consultantId");
  const statut = req.nextUrl.searchParams.get("statut");
  let all = await readConsultantReviews();
  if (consultantId) all = all.filter((r) => r.consultantId === consultantId);
  if (statut) all = all.filter((r) => r.statut === statut);
  return NextResponse.json({ reviews: all });
}

// PUT → modifier un avis (statut, contenu)
export async function PUT(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const body = await req.json();
  const { id, ...updates } = body;
  if (!id) return NextResponse.json({ error: "ID manquant" }, { status: 400 });
  const all = await readConsultantReviews();
  const idx = all.findIndex((r) => r.id === id);
  if (idx === -1) return NextResponse.json({ error: "Avis introuvable" }, { status: 404 });
  all[idx] = { ...all[idx], ...updates, id };
  await writeConsultantReviews(all);
  return NextResponse.json({ review: all[idx] });
}

// POST → créer manuellement un avis (admin, statut validee par défaut)
export async function POST(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const body = await req.json();
  const { consultantId, auteur, note, contenu, statut, createdAt } = body;
  if (!consultantId || !String(auteur || "").trim() || !String(contenu || "").trim() || !note) {
    return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
  }
  const all = await readConsultantReviews();
  const review = {
    id: `crv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    consultantId: String(consultantId),
    auteur: String(auteur).trim().slice(0, 100),
    note: Math.min(5, Math.max(1, Number(note))),
    contenu: String(contenu).trim().slice(0, 1000),
    statut: (statut === "en_attente" || statut === "rejetee" ? statut : "validee") as "validee" | "en_attente" | "rejetee",
    createdAt: createdAt || new Date().toISOString(),
  };
  all.push(review);
  await writeConsultantReviews(all);
  return NextResponse.json({ ok: true, review });
}

// DELETE → supprimer un avis
export async function DELETE(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID manquant" }, { status: 400 });
  const all = await readConsultantReviews();
  await writeConsultantReviews(all.filter((r) => r.id !== id));
  return NextResponse.json({ ok: true });
}
