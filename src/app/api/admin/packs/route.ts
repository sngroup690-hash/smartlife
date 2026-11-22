import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";

import { assurerPacksProposes } from "@/lib/packs-proposes";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const FILE = path.join(process.cwd(), "private", "packs-data.json");

export type PackItem = { type: "ebook" | "formation"; id: string; title: string };
export type Pack = {
  id: string;
  slug: string;
  nom: string;
  description: string;
  prix: number;
  image?: string;
  videoUrl?: string;
  ordre: number;
  statut: "actif" | "inactif" | "brouillon";
  items: PackItem[];
  createdAt: string;
  updatedAt: string;
};

function toSlug(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

function uniqueSlug(base: string, packs: Pack[], excludeId?: string): string {
  const existing = packs.filter((p) => p.id !== excludeId).map((p) => p.slug);
  let slug = base;
  let i = 2;
  while (existing.includes(slug)) slug = `${base}-${i++}`;
  return slug;
}

async function readPacks(): Promise<Pack[]> {
  try {
    return JSON.parse(await readFile(FILE, "utf-8")).packs || [];
  } catch { return []; }
}

async function writePacks(packs: Pack[]) {
  await mkdir(path.dirname(FILE), { recursive: true });
  await writeFile(FILE, JSON.stringify({ packs, packsProposesImportes: true }, null, 2), "utf-8");
}

function auth(req: NextRequest) {
  return req.nextUrl.searchParams.get("password") === ADMIN_PASSWORD;
}

export async function GET(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  await assurerPacksProposes().catch(() => 0);
  return NextResponse.json({ packs: await readPacks() });
}

export async function POST(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const body = await req.json();
  const packs = await readPacks();
  const nom = String(body.nom || "");
  const slug = uniqueSlug(toSlug(nom), packs);
  const pack: Pack = {
    id: `pack-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    slug,
    nom,
    description: String(body.description || ""),
    prix: Number(body.prix) || 0,
    image: body.image || undefined,
    videoUrl: body.videoUrl || undefined,
    ordre: Number(body.ordre) || packs.length + 1,
    statut: (["actif", "inactif", "brouillon"].includes(body.statut) ? body.statut : "brouillon") as Pack["statut"],
    items: Array.isArray(body.items) ? body.items : [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  packs.push(pack);
  await writePacks(packs);
  return NextResponse.json({ pack });
}

export async function PUT(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const body = await req.json();
  const packs = await readPacks();
  const idx = packs.findIndex((p) => p.id === body.id);
  if (idx === -1) return NextResponse.json({ error: "Pack introuvable" }, { status: 404 });
  const updatedNom = body.nom !== undefined ? String(body.nom) : packs[idx].nom;
  // Génère un slug seulement si le pack n'en a pas encore
  const existingSlug = packs[idx].slug || uniqueSlug(toSlug(updatedNom), packs, body.id);
  packs[idx] = {
    ...packs[idx],
    slug: existingSlug,
    ...(body.nom !== undefined && { nom: updatedNom }),
    ...(body.description !== undefined && { description: String(body.description) }),
    ...(body.prix !== undefined && { prix: Number(body.prix) }),
    ...(body.image !== undefined && { image: body.image || undefined }),
    ...(body.videoUrl !== undefined && { videoUrl: body.videoUrl || undefined }),
    ...(body.ordre !== undefined && { ordre: Number(body.ordre) }),
    ...(body.statut !== undefined && { statut: body.statut }),
    ...(body.items !== undefined && { items: body.items }),
    updatedAt: new Date().toISOString(),
  };
  await writePacks(packs);
  return NextResponse.json({ pack: packs[idx] });
}

export async function DELETE(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });
  await writePacks((await readPacks()).filter((p) => p.id !== id));
  return NextResponse.json({ ok: true });
}
