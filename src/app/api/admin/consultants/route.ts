import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

const FILE = path.join(process.cwd(), "private", "consultants.json");
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

type ConsultantServer = {
  id: string;
  prenom: string;
  nom?: string;
  ville?: string;
  anneesExperience?: string;
  motivation?: string;
  portfolioUrl?: string;
  clientsAccompa: number;
  entreprisesAccompa: number;
  domainesIds: string[];
  actif: boolean;
  createdAt: string;
  updatedAt: string;
};

async function readConsultants(): Promise<ConsultantServer[]> {
  try {
    const raw = await readFile(FILE, "utf-8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function writeConsultants(data: ConsultantServer[]): Promise<void> {
  await mkdir(path.dirname(FILE), { recursive: true });
  await writeFile(FILE, JSON.stringify(data, null, 2), "utf-8");
}

function auth(req: NextRequest): boolean {
  return req.nextUrl.searchParams.get("password") === ADMIN_PASSWORD;
}

export async function GET(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  return NextResponse.json({ consultants: await readConsultants() });
}

export async function POST(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const body = await req.json();
  const consultants = await readConsultants();
  const now = new Date().toISOString();
  const consultant: ConsultantServer = {
    id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    prenom: String(body.prenom ?? "").trim(),
    nom: String(body.nom ?? "").trim() || undefined,
    ville: String(body.ville ?? "").trim() || undefined,
    anneesExperience: String(body.anneesExperience ?? "").trim() || undefined,
    motivation: String(body.motivation ?? "").trim() || undefined,
    portfolioUrl: String(body.portfolioUrl ?? "").trim() || undefined,
    clientsAccompa: Number(body.clientsAccompa) || 0,
    entreprisesAccompa: Number(body.entreprisesAccompa) || 0,
    domainesIds: Array.isArray(body.domainesIds) ? body.domainesIds : [],
    actif: true,
    createdAt: now,
    updatedAt: now,
  };
  consultants.push(consultant);
  await writeConsultants(consultants);
  return NextResponse.json({ consultant });
}

export async function PUT(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const body = await req.json();
  const { id, ...updates } = body;
  const consultants = await readConsultants();
  const idx = consultants.findIndex((c) => c.id === id);
  if (idx === -1) return NextResponse.json({ error: "Non trouvé" }, { status: 404 });
  consultants[idx] = { ...consultants[idx], ...updates, id, updatedAt: new Date().toISOString() };
  await writeConsultants(consultants);
  return NextResponse.json({ consultant: consultants[idx] });
}

export async function DELETE(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID manquant" }, { status: 400 });
  const consultants = await readConsultants();
  await writeConsultants(consultants.filter((c) => c.id !== id));
  return NextResponse.json({ ok: true });
}
