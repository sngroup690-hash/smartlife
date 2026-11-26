import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const FILE = path.join(process.cwd(), "private", "evaluations_consultant.json");

async function readAll(): Promise<Record<string, unknown>[]> {
  try {
    const raw = await readFile(FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeAll(data: unknown[]) {
  await mkdir(path.dirname(FILE), { recursive: true });
  await writeFile(FILE, JSON.stringify(data, null, 2), "utf-8");
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { nom, email, telephone, reponses, scoreTech, scorePeda, pctTech, pctPeda, pctGlobal, verdict } = body;

  if (!nom || !email || !reponses || reponses.length !== 14) {
    return NextResponse.json({ error: "Données incomplètes." }, { status: 400 });
  }

  const all = await readAll();
  const entry = {
    id: crypto.randomUUID(),
    nom: nom.trim(),
    email: email.trim().toLowerCase(),
    telephone: telephone?.trim() || "",
    reponses,
    scoreTech,
    scorePeda,
    pctTech,
    pctPeda,
    pctGlobal,
    verdict,
    lu: false,
    createdAt: new Date().toISOString(),
  };
  all.push(entry);
  await writeAll(all);

  return NextResponse.json({ success: true, id: entry.id });
}

export async function GET(req: NextRequest) {
  const pwd = req.nextUrl.searchParams.get("password");
  if (pwd !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const all = await readAll();
  return NextResponse.json({ evaluations: all.reverse() });
}

export async function PATCH(req: NextRequest) {
  const pwd = req.nextUrl.searchParams.get("password");
  const id = req.nextUrl.searchParams.get("id");
  if (pwd !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  if (!id) {
    return NextResponse.json({ error: "ID requis." }, { status: 400 });
  }

  const body = await req.json();
  const all = await readAll();
  const idx = all.findIndex((e) => e.id === id);
  if (idx === -1) {
    return NextResponse.json({ error: "Évaluation introuvable." }, { status: 404 });
  }

  all[idx] = { ...all[idx], ...body, updatedAt: new Date().toISOString() };
  await writeAll(all);

  return NextResponse.json({ success: true });
}
