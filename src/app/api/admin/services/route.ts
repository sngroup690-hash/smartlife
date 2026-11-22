import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { readDynamicServices, type DynamicService } from "@/lib/services-data";

const FILE = path.join(process.cwd(), "private", "services-data.json");

async function write(svcs: DynamicService[]) {
  await mkdir(path.dirname(FILE), { recursive: true });
  await writeFile(FILE, JSON.stringify(svcs, null, 2), "utf-8");
}

function checkAuth(req: NextRequest) {
  const h = req.headers.get("x-admin-password");
  return h !== null && h === process.env.ADMIN_PASSWORD;
}

function slugify(str: string) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  return NextResponse.json(await readDynamicServices());
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  try {
    const body = await req.json() as Partial<DynamicService>;
    const svcs = await readDynamicServices();

    if (body.id) {
      const idx = svcs.findIndex((s) => s.id === body.id);
      if (idx === -1) return NextResponse.json({ error: "Service introuvable" }, { status: 404 });
      svcs[idx] = { ...svcs[idx], ...body } as DynamicService;
      await write(svcs);
      return NextResponse.json({ success: true, service: svcs[idx] });
    }

    const newSvc: DynamicService = {
      id: crypto.randomUUID(),
      slug: body.slug || slugify(body.title || "service"),
      title: body.title || "Nouveau service",
      description: body.description || "",
      longDescription: body.longDescription || "",
      icon: body.icon || "🛠️",
      imageUrl: body.imageUrl,
      startingPrice: body.startingPrice || 0,
      deliveryTime: body.deliveryTime || "3-5 jours",
      features: body.features || [],
      packages: body.packages || [],
      enabled: body.enabled ?? true,
      createdAt: new Date().toISOString(),
      briefLabel: body.briefLabel,
    };
    svcs.push(newSvc);
    await write(svcs);
    return NextResponse.json({ success: true, service: newSvc });
  } catch {
    return NextResponse.json({ error: "Erreur sauvegarde" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });
  const svcs = await readDynamicServices();
  const filtered = svcs.filter((s) => s.id !== id);
  if (filtered.length === svcs.length) return NextResponse.json({ error: "Service introuvable" }, { status: 404 });
  await write(filtered);
  return NextResponse.json({ success: true });
}
