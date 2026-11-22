import { NextRequest, NextResponse } from "next/server";
import {
  readAffiliates, writeAffiliates, hashPassword,
  type AffiliateAccount,
} from "@/lib/affiliate-store";
import { readPromoCodes } from "@/app/api/admin/promo-codes/route";
import crypto from "crypto";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

function auth(req: NextRequest) {
  const h = req.headers.get("x-admin-password");
  const q = req.nextUrl.searchParams.get("password");
  return h === ADMIN_PASSWORD || q === ADMIN_PASSWORD;
}

export async function GET(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const all = await readAffiliates();
  const promoCodes = await readPromoCodes().catch(() => []);
  return NextResponse.json(all.map((a) => {
    const promo = promoCodes.find((p) => p.code === a.code);
    const totalCommission = promo?.totalCommission || 0;
    return {
      ...a,
      passwordHash: undefined,
      uses: promo?.uses || 0,
      totalRevenue: promo?.totalRevenue || 0,
      commissionRate: promo?.commissionRate || 0,
      totalCommission,
      availableBalance: Math.max(0, totalCommission - (a.totalPaidOut || 0)),
    };
  }));
}

export async function POST(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const body = await req.json();

  const { code, password, displayName, email, phone, commissionRate, minPayoutThreshold } = body;
  if (!code || !password || !displayName)
    return NextResponse.json({ error: "code, password et displayName sont requis" }, { status: 400 });

  const all = await readAffiliates();
  if (all.some((a) => a.code.toUpperCase() === String(code).toUpperCase().trim()))
    return NextResponse.json({ error: "Un compte avec ce code existe déjà" }, { status: 409 });

  const entry: AffiliateAccount = {
    id: crypto.randomUUID(),
    code: String(code).toUpperCase().trim(),
    passwordHash: hashPassword(String(password)),
    displayName: String(displayName),
    email: String(email || ""),
    phone: phone ? String(phone) : undefined,
    enabled: true,
    totalPaidOut: 0,
    minPayoutThreshold: Number(minPayoutThreshold) || 5000,
    createdAt: new Date().toISOString(),
  };

  all.push(entry);
  await writeAffiliates(all);
  return NextResponse.json({ ...entry, passwordHash: undefined });
}

export async function PUT(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const body = await req.json();
  const all = await readAffiliates();
  const idx = all.findIndex((a) => a.id === body.id);
  if (idx === -1) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  if (body.displayName !== undefined) all[idx].displayName = String(body.displayName);
  if (body.email !== undefined) all[idx].email = String(body.email);
  if (body.phone !== undefined) all[idx].phone = body.phone ? String(body.phone) : undefined;
  if (body.enabled !== undefined) all[idx].enabled = Boolean(body.enabled);
  if (body.minPayoutThreshold !== undefined)
    all[idx].minPayoutThreshold = Math.max(0, Number(body.minPayoutThreshold));
  if (body.password) all[idx].passwordHash = hashPassword(String(body.password));

  await writeAffiliates(all);
  return NextResponse.json({ ...all[idx], passwordHash: undefined });
}

export async function DELETE(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });
  await writeAffiliates((await readAffiliates()).filter((a) => a.id !== id));
  return NextResponse.json({ ok: true });
}
