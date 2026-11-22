import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const FILE = path.join(process.cwd(), "private", "qrcodes.json");

export type QRCodeEntry = {
  id: string;
  code: string;
  nom: string;
  targetUrl: string;
  discountType: "none" | "percent" | "fixed";
  discountValue: number;
  discountLabel: string;
  scans: number;
  createdAt: string;
  updatedAt: string;
};

function auth(req: NextRequest) {
  const header = req.headers.get("x-admin-password");
  const query = req.nextUrl.searchParams.get("password");
  return header === ADMIN_PASSWORD || query === ADMIN_PASSWORD;
}

function genCode(): string {
  return Math.random().toString(36).slice(2, 10);
}

async function readAll(): Promise<QRCodeEntry[]> {
  try {
    return JSON.parse(await readFile(FILE, "utf-8")).qrcodes || [];
  } catch { return []; }
}

async function writeAll(items: QRCodeEntry[]) {
  await mkdir(path.dirname(FILE), { recursive: true });
  await writeFile(FILE, JSON.stringify({ qrcodes: items }, null, 2), "utf-8");
}

export async function GET(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  return NextResponse.json({ qrcodes: await readAll() });
}

export async function POST(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const body = await req.json();
  const all = await readAll();
  let code = genCode();
  while (all.some((q) => q.code === code)) code = genCode();
  const entry: QRCodeEntry = {
    id: `qr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    code,
    nom: String(body.nom || "QR Code"),
    targetUrl: String(body.targetUrl || "/"),
    discountType: (["none", "percent", "fixed"].includes(body.discountType) ? body.discountType : "none") as QRCodeEntry["discountType"],
    discountValue: Number(body.discountValue) || 0,
    discountLabel: String(body.discountLabel || ""),
    scans: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  all.push(entry);
  await writeAll(all);
  return NextResponse.json({ qrcode: entry });
}

export async function PUT(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const body = await req.json();
  const all = await readAll();
  const idx = all.findIndex((q) => q.id === body.id);
  if (idx === -1) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  all[idx] = {
    ...all[idx],
    ...(body.nom !== undefined && { nom: String(body.nom) }),
    ...(body.targetUrl !== undefined && { targetUrl: String(body.targetUrl) }),
    ...(body.discountType !== undefined && { discountType: body.discountType }),
    ...(body.discountValue !== undefined && { discountValue: Number(body.discountValue) }),
    ...(body.discountLabel !== undefined && { discountLabel: String(body.discountLabel) }),
    updatedAt: new Date().toISOString(),
  };
  await writeAll(all);
  return NextResponse.json({ qrcode: all[idx] });
}

export async function DELETE(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });
  await writeAll((await readAll()).filter((q) => q.id !== id));
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.json({ error: "code requis" }, { status: 400 });
  const all = await readAll();
  const idx = all.findIndex((q) => q.code === code);
  if (idx === -1) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  all[idx].scans = (all[idx].scans || 0) + 1;
  all[idx].updatedAt = new Date().toISOString();
  await writeAll(all);
  return NextResponse.json({ qrcode: all[idx] });
}
