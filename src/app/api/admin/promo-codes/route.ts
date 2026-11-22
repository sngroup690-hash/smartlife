import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const FILE = path.join(process.cwd(), "private", "promo-codes.json");

export type PromoCode = {
  id: string;
  code: string;
  nom: string;
  partnerName: string;
  partnerEmail: string;
  discountType: "percent" | "fixed";
  discountValue: number;
  commissionRate: number;
  maxUses?: number;
  expiresAt?: string;
  enabled: boolean;
  uses: number;
  totalRevenue: number;
  totalCommission: number;
  createdAt: string;
  updatedAt: string;
};

function auth(req: NextRequest) {
  const h = req.headers.get("x-admin-password");
  const q = req.nextUrl.searchParams.get("password");
  return h === ADMIN_PASSWORD || q === ADMIN_PASSWORD;
}

export async function readPromoCodes(): Promise<PromoCode[]> {
  try {
    return JSON.parse(await readFile(FILE, "utf-8")).codes || [];
  } catch { return []; }
}

export async function writePromoCodes(codes: PromoCode[]) {
  await mkdir(path.dirname(FILE), { recursive: true });
  await writeFile(FILE, JSON.stringify({ codes }, null, 2), "utf-8");
}

export async function GET(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  return NextResponse.json({ codes: await readPromoCodes() });
}

export async function POST(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const body = await req.json();
  const all = await readPromoCodes();
  const code = String(body.code || "").toUpperCase().replace(/\s+/g, "").trim();
  if (!code) return NextResponse.json({ error: "Le code est requis" }, { status: 400 });
  if (all.some((c) => c.code === code)) return NextResponse.json({ error: "Ce code existe déjà" }, { status: 409 });
  const entry: PromoCode = {
    id: `pc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    code,
    nom: String(body.nom || code),
    partnerName: String(body.partnerName || ""),
    partnerEmail: String(body.partnerEmail || ""),
    discountType: body.discountType === "fixed" ? "fixed" : "percent",
    discountValue: Math.max(0, Number(body.discountValue) || 0),
    commissionRate: Math.max(0, Math.min(100, Number(body.commissionRate) || 0)),
    maxUses: body.maxUses ? Math.max(1, Number(body.maxUses)) : undefined,
    expiresAt: body.expiresAt || undefined,
    enabled: body.enabled !== false,
    uses: 0,
    totalRevenue: 0,
    totalCommission: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  all.push(entry);
  await writePromoCodes(all);
  return NextResponse.json({ code: entry });
}

export async function PUT(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const body = await req.json();
  const all = await readPromoCodes();
  const idx = all.findIndex((c) => c.id === body.id);
  if (idx === -1) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  const newCode = body.code ? String(body.code).toUpperCase().replace(/\s+/g, "").trim() : all[idx].code;
  if (newCode !== all[idx].code && all.some((c) => c.code === newCode)) {
    return NextResponse.json({ error: "Ce code existe déjà" }, { status: 409 });
  }
  all[idx] = {
    ...all[idx],
    code: newCode,
    ...(body.nom !== undefined && { nom: String(body.nom) }),
    ...(body.partnerName !== undefined && { partnerName: String(body.partnerName) }),
    ...(body.partnerEmail !== undefined && { partnerEmail: String(body.partnerEmail) }),
    ...(body.discountType !== undefined && { discountType: body.discountType }),
    ...(body.discountValue !== undefined && { discountValue: Math.max(0, Number(body.discountValue)) }),
    ...(body.commissionRate !== undefined && { commissionRate: Math.max(0, Math.min(100, Number(body.commissionRate))) }),
    ...(body.maxUses !== undefined && { maxUses: body.maxUses ? Math.max(1, Number(body.maxUses)) : undefined }),
    ...(body.expiresAt !== undefined && { expiresAt: body.expiresAt || undefined }),
    ...(body.enabled !== undefined && { enabled: Boolean(body.enabled) }),
    updatedAt: new Date().toISOString(),
  };
  await writePromoCodes(all);
  return NextResponse.json({ code: all[idx] });
}

export async function DELETE(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });
  await writePromoCodes((await readPromoCodes()).filter((c) => c.id !== id));
  return NextResponse.json({ ok: true });
}
