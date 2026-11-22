import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const FILE = path.join(process.cwd(), "private", "payment-links.json");

export type PaymentLink = {
  id: string;
  name: string;
  price: number;
  description?: string;
  active: boolean;
  createdAt: string;
  clicks: number;
};

async function readLinks(): Promise<PaymentLink[]> {
  try {
    const raw = await readFile(FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeLinks(links: PaymentLink[]) {
  await mkdir(path.dirname(FILE), { recursive: true });
  await writeFile(FILE, JSON.stringify(links, null, 2), "utf-8");
}

function auth(req: NextRequest): boolean {
  const pw = req.nextUrl.searchParams.get("password") ||
    req.headers.get("x-admin-password");
  return pw === ADMIN_PASSWORD;
}

export async function GET(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const links = await readLinks();
  return NextResponse.json({ links });
}

export async function POST(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { name, price, description } = await req.json();
  if (!name || typeof price !== "number" || price <= 0) {
    return NextResponse.json({ error: "Nom et prix requis" }, { status: 400 });
  }
  const links = await readLinks();
  const id = `pl-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
  const link: PaymentLink = {
    id, name: String(name).trim(), price,
    description: description ? String(description).trim() : undefined,
    active: true, createdAt: new Date().toISOString(), clicks: 0,
  };
  links.unshift(link);
  await writeLinks(links);
  return NextResponse.json({ link });
}

export async function PATCH(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id, name, price, description, active } = await req.json();
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });
  const links = await readLinks();
  const idx = links.findIndex((l) => l.id === id);
  if (idx === -1) return NextResponse.json({ error: "Lien introuvable" }, { status: 404 });
  if (name !== undefined) links[idx].name = String(name).trim();
  if (price !== undefined && typeof price === "number" && price > 0) links[idx].price = price;
  if (description !== undefined) links[idx].description = description ? String(description).trim() : undefined;
  if (active !== undefined) links[idx].active = Boolean(active);
  await writeLinks(links);
  return NextResponse.json({ link: links[idx] });
}

export async function DELETE(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });
  const links = await readLinks();
  const filtered = links.filter((l) => l.id !== id);
  await writeLinks(filtered);
  return NextResponse.json({ ok: true });
}
