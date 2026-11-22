import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import { isValidAdminPassword } from "@/lib/admin-auth";

const FILE = path.join(process.cwd(), "private", "temoignages-data.json");

export type Temoignage = {
  id: string;
  type: "image" | "video" | "audio";
  imageUrl?: string;
  videoUrl?: string;
  audioUrl?: string;
  thumbnailUrl?: string;
  clientNom?: string;
  produitNom?: string;
  caption?: string;
  actif: boolean;
  ordre: number;
  createdAt: string;
};

async function readData(): Promise<Temoignage[]> {
  try {
    return JSON.parse(await readFile(FILE, "utf-8"));
  } catch {
    return [];
  }
}

async function writeData(data: Temoignage[]) {
  await mkdir(path.dirname(FILE), { recursive: true });
  await writeFile(FILE, JSON.stringify(data, null, 2), "utf-8");
}

export async function GET(req: NextRequest) {
  const pwd = req.headers.get("x-admin-password");
  if (!isValidAdminPassword(pwd)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  return NextResponse.json(await readData());
}

export async function POST(req: NextRequest) {
  const pwd = req.headers.get("x-admin-password");
  if (!isValidAdminPassword(pwd)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Données invalides" }, { status: 400 });

  const all = await readData();
  const validType = ["image", "video", "audio"].includes(body.type) ? body.type : "image";
  const entry: Temoignage = {
    id: crypto.randomUUID(),
    type: validType,
    imageUrl: body.imageUrl?.trim() || undefined,
    videoUrl: body.videoUrl?.trim() || undefined,
    audioUrl: body.audioUrl?.trim() || undefined,
    thumbnailUrl: body.thumbnailUrl?.trim() || undefined,
    clientNom: body.clientNom?.trim() || undefined,
    produitNom: body.produitNom?.trim() || undefined,
    caption: body.caption?.trim() || undefined,
    actif: body.actif !== false,
    ordre: body.ordre ?? all.length,
    createdAt: new Date().toISOString(),
  };
  all.push(entry);
  await writeData(all);
  return NextResponse.json(entry);
}

export async function PUT(req: NextRequest) {
  const pwd = req.headers.get("x-admin-password");
  if (!isValidAdminPassword(pwd)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body?.id) return NextResponse.json({ error: "id requis" }, { status: 400 });

  const all = await readData();
  const idx = all.findIndex((t) => t.id === body.id);
  if (idx === -1) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const validType = body.type && ["image", "video", "audio"].includes(body.type) ? body.type : all[idx].type;
  all[idx] = {
    ...all[idx],
    type: validType,
    imageUrl: body.imageUrl?.trim() || undefined,
    videoUrl: body.videoUrl?.trim() || undefined,
    audioUrl: body.audioUrl?.trim() || undefined,
    thumbnailUrl: body.thumbnailUrl?.trim() || undefined,
    clientNom: body.clientNom?.trim() || undefined,
    produitNom: body.produitNom?.trim() || undefined,
    caption: body.caption?.trim() || undefined,
    actif: body.actif !== undefined ? body.actif : all[idx].actif,
    ordre: body.ordre !== undefined ? body.ordre : all[idx].ordre,
  };
  await writeData(all);
  return NextResponse.json(all[idx]);
}

export async function DELETE(req: NextRequest) {
  const pwd = req.headers.get("x-admin-password");
  if (!isValidAdminPassword(pwd)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });

  const all = await readData();
  const filtered = all.filter((t) => t.id !== id);
  if (filtered.length === all.length) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  await writeData(filtered);
  return NextResponse.json({ success: true });
}
