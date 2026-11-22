import { NextRequest, NextResponse } from "next/server";
import {
  readAffiliates, writeAffiliates, readPayouts, writePayouts,
} from "@/lib/affiliate-store";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

function auth(req: NextRequest) {
  const h = req.headers.get("x-admin-password");
  const q = req.nextUrl.searchParams.get("password");
  return h === ADMIN_PASSWORD || q === ADMIN_PASSWORD;
}

export async function GET(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const payouts = await readPayouts();
  return NextResponse.json(payouts.slice().reverse());
}

export async function PATCH(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id, status, note } = await req.json() as {
    id: string;
    status: "paid" | "rejected";
    note?: string;
  };

  const payouts = await readPayouts();
  const idx = payouts.findIndex((p) => p.id === id);
  if (idx === -1) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const prev = payouts[idx].status;
  payouts[idx].status = status;
  payouts[idx].processedAt = new Date().toISOString();
  if (note !== undefined) payouts[idx].note = note;
  await writePayouts(payouts);

  // If marking as paid, increment totalPaidOut on the affiliate
  if (status === "paid" && prev !== "paid") {
    const all = await readAffiliates();
    const affIdx = all.findIndex((a) => a.id === payouts[idx].affiliateId);
    if (affIdx !== -1) {
      all[affIdx].totalPaidOut = (all[affIdx].totalPaidOut || 0) + payouts[idx].amount;
      await writeAffiliates(all);
    }
  }

  return NextResponse.json(payouts[idx]);
}
