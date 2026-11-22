import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const FILE = path.join(process.cwd(), "private", "ressources-gratuites.json");

export type RessourceGratuite = {
  id: string;
  slug: string;
  titre: string;
  description: string;
  imageUrl?: string;
  actif: boolean;

  hasPdf: boolean;
  pdfUrl?: string;
  pdfNom?: string;

  hasVideo: boolean;
  videoUrl?: string;
  videoTitre?: string;

  hasCommunity: boolean;
  communityUrl?: string;
  communityLabel?: string;
  communityType?: "whatsapp" | "telegram" | "zoom" | "autre";

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

function uniqueSlug(base: string, list: RessourceGratuite[], excludeId?: string): string {
  const existing = list.filter((r) => r.id !== excludeId).map((r) => r.slug);
  let slug = base || "ressource";
  let i = 2;
  while (existing.includes(slug)) slug = `${base}-${i++}`;
  return slug;
}

async function readAll(): Promise<RessourceGratuite[]> {
  try {
    return JSON.parse(await readFile(FILE, "utf-8")).ressources ?? [];
  } catch { return []; }
}

async function writeAll(ressources: RessourceGratuite[]) {
  await mkdir(path.dirname(FILE), { recursive: true });
  await writeFile(FILE, JSON.stringify({ ressources }, null, 2), "utf-8");
}

function auth(req: NextRequest) {
  return req.nextUrl.searchParams.get("password") === ADMIN_PASSWORD;
}

export async function GET(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  return NextResponse.json({ ressources: await readAll() });
}

export async function POST(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const body = await req.json();
  const list = await readAll();
  const slugBase = toSlug(String(body.titre || ""));
  const ressource: RessourceGratuite = {
    id: `rg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    slug: uniqueSlug(slugBase, list),
    titre: String(body.titre || ""),
    description: String(body.description || ""),
    imageUrl: body.imageUrl || undefined,
    actif: body.actif !== false,

    hasPdf: Boolean(body.hasPdf),
    pdfUrl: body.pdfUrl || undefined,
    pdfNom: body.pdfNom || undefined,

    hasVideo: Boolean(body.hasVideo),
    videoUrl: body.videoUrl || undefined,
    videoTitre: body.videoTitre || undefined,

    hasCommunity: Boolean(body.hasCommunity),
    communityUrl: body.communityUrl || undefined,
    communityLabel: body.communityLabel || undefined,
    communityType: body.communityType || undefined,

    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  list.push(ressource);
  await writeAll(list);
  return NextResponse.json({ ressource });
}

export async function PUT(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const body = await req.json();
  const list = await readAll();
  const idx = list.findIndex((r) => r.id === body.id);
  if (idx === -1) return NextResponse.json({ error: "Ressource introuvable" }, { status: 404 });
  list[idx] = {
    ...list[idx],
    ...(body.titre !== undefined && { titre: String(body.titre) }),
    ...(body.description !== undefined && { description: String(body.description) }),
    ...(body.imageUrl !== undefined && { imageUrl: body.imageUrl || undefined }),
    ...(body.actif !== undefined && { actif: Boolean(body.actif) }),
    ...(body.hasPdf !== undefined && { hasPdf: Boolean(body.hasPdf) }),
    ...(body.pdfUrl !== undefined && { pdfUrl: body.pdfUrl || undefined }),
    ...(body.pdfNom !== undefined && { pdfNom: body.pdfNom || undefined }),
    ...(body.hasVideo !== undefined && { hasVideo: Boolean(body.hasVideo) }),
    ...(body.videoUrl !== undefined && { videoUrl: body.videoUrl || undefined }),
    ...(body.videoTitre !== undefined && { videoTitre: body.videoTitre || undefined }),
    ...(body.hasCommunity !== undefined && { hasCommunity: Boolean(body.hasCommunity) }),
    ...(body.communityUrl !== undefined && { communityUrl: body.communityUrl || undefined }),
    ...(body.communityLabel !== undefined && { communityLabel: body.communityLabel || undefined }),
    ...(body.communityType !== undefined && { communityType: body.communityType || undefined }),
    updatedAt: new Date().toISOString(),
  };
  await writeAll(list);
  return NextResponse.json({ ressource: list[idx] });
}

export async function DELETE(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });
  await writeAll((await readAll()).filter((r) => r.id !== id));
  return NextResponse.json({ ok: true });
}
