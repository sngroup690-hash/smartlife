import { NextRequest, NextResponse } from "next/server";
import {
  readAffiliates, readPayouts, writePayouts, verifyToken,
  type PayoutInfo,
} from "@/lib/affiliate-store";
import { readPromoCodes } from "@/app/api/admin/promo-codes/route";
import crypto from "crypto";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";

const NOTIF_FILE = path.join(process.cwd(), "private", "admin-notifications.json");

type AdminNotif = {
  id: string;
  type: "payout_request";
  affiliateName: string;
  code: string;
  amount: number;
  payoutInfo: PayoutInfo;
  requestedAt: string;
  read: boolean;
};

async function pushNotification(notif: AdminNotif) {
  let list: AdminNotif[] = [];
  try { list = JSON.parse(await readFile(NOTIF_FILE, "utf-8")); } catch { /* first run */ }
  list.push(notif);
  await mkdir(path.dirname(NOTIF_FILE), { recursive: true });
  await writeFile(NOTIF_FILE, JSON.stringify(list, null, 2), "utf-8");
}

async function getAuthAffiliate(req: NextRequest) {
  const token = req.cookies.get("aff_token")?.value;
  if (!token) return null;
  const affiliateId = verifyToken(token);
  if (!affiliateId) return null;
  const all = await readAffiliates();
  const aff = all.find((a) => a.id === affiliateId);
  if (!aff || !aff.enabled) return null;
  return aff;
}

export async function POST(req: NextRequest) {
  const aff = await getAuthAffiliate(req);
  if (!aff) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { amount, payoutInfo } = await req.json() as { amount: number; payoutInfo: PayoutInfo };

  const codes = await readPromoCodes();
  const promoCode = codes.find((c) => c.code === aff.code);
  const totalCommission = promoCode?.totalCommission || 0;
  const availableBalance = Math.max(0, totalCommission - aff.totalPaidOut);
  const threshold = aff.minPayoutThreshold || 5000;

  if (availableBalance < threshold)
    return NextResponse.json({ error: `Solde insuffisant. Minimum : ${threshold.toLocaleString("fr-FR")} FCFA` }, { status: 400 });
  if (amount > availableBalance)
    return NextResponse.json({ error: "Montant supérieur au solde disponible" }, { status: 400 });
  if (amount < threshold)
    return NextResponse.json({ error: `Montant minimum : ${threshold.toLocaleString("fr-FR")} FCFA` }, { status: 400 });

  // Check no other pending payout
  const allPayouts = await readPayouts();
  const hasPending = allPayouts.some(
    (p) => p.affiliateId === aff.id && p.status === "pending"
  );
  if (hasPending)
    return NextResponse.json({ error: "Vous avez déjà une demande en attente." }, { status: 409 });

  const payout = {
    id: crypto.randomUUID(),
    affiliateId: aff.id,
    affiliateName: aff.displayName,
    code: aff.code,
    amount,
    payoutInfo: payoutInfo || aff.payoutInfo || { method: "mobile_money" as const },
    status: "pending" as const,
    requestedAt: new Date().toISOString(),
  };

  allPayouts.push(payout);
  await writePayouts(allPayouts);

  await pushNotification({
    id: crypto.randomUUID(),
    type: "payout_request",
    affiliateName: aff.displayName,
    code: aff.code,
    amount,
    payoutInfo: payout.payoutInfo,
    requestedAt: payout.requestedAt,
    read: false,
  });

  return NextResponse.json({ ok: true, payout });
}
