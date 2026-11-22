import { NextRequest, NextResponse } from "next/server";
import {
  readAffiliates, writeAffiliates, readAffiliateSales, readPayouts, verifyToken, hashPassword,
} from "@/lib/affiliate-store";
import { readPromoCodes } from "@/app/api/admin/promo-codes/route";

async function getAffiliate(req: NextRequest) {
  const token = req.cookies.get("aff_token")?.value;
  if (!token) return null;
  const affiliateId = verifyToken(token);
  if (!affiliateId) return null;
  const all = await readAffiliates();
  const aff = all.find((a) => a.id === affiliateId);
  if (!aff || !aff.enabled) return null;
  return { aff, all };
}

export async function GET(req: NextRequest) {
  const result = await getAffiliate(req);
  if (!result) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const { aff } = result;

  const codes = await readPromoCodes();
  const promoCode = codes.find((c) => c.code === aff.code);

  const totalCommission = promoCode?.totalCommission || 0;
  const availableBalance = Math.max(0, totalCommission - aff.totalPaidOut);

  const sales = (await readAffiliateSales(aff.code)).reverse().slice(0, 200);
  const payouts = (await readPayouts()).filter((p) => p.affiliateId === aff.id).reverse();

  return NextResponse.json({
    affiliate: {
      id: aff.id,
      code: aff.code,
      displayName: aff.displayName,
      email: aff.email,
      phone: aff.phone,
      payoutInfo: aff.payoutInfo,
      minPayoutThreshold: aff.minPayoutThreshold || 5000,
    },
    stats: {
      uses: promoCode?.uses || 0,
      totalRevenue: promoCode?.totalRevenue || 0,
      commissionRate: promoCode?.commissionRate || 0,
      totalCommission,
      totalPaidOut: aff.totalPaidOut,
      availableBalance,
    },
    promoCodeInfo: promoCode
      ? {
          code: promoCode.code,
          discountType: promoCode.discountType,
          discountValue: promoCode.discountValue,
          enabled: promoCode.enabled,
        }
      : null,
    sales,
    payouts,
  });
}

export async function PATCH(req: NextRequest) {
  const result = await getAffiliate(req);
  if (!result) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const { aff, all } = result;

  const body = await req.json();
  const idx = all.findIndex((a) => a.id === aff.id);

  if (body.payoutInfo !== undefined) all[idx].payoutInfo = body.payoutInfo;
  if (body.phone !== undefined) all[idx].phone = String(body.phone);

  if (body.newPassword !== undefined) {
    if (!body.oldPassword)
      return NextResponse.json({ error: "Ancien mot de passe requis" }, { status: 400 });
    if (all[idx].passwordHash !== hashPassword(String(body.oldPassword)))
      return NextResponse.json({ error: "Ancien mot de passe incorrect" }, { status: 403 });
    const np = String(body.newPassword);
    if (np.length < 6)
      return NextResponse.json({ error: "Le mot de passe doit contenir au moins 6 caractères" }, { status: 400 });
    all[idx].passwordHash = hashPassword(np);
  }

  await writeAffiliates(all);
  return NextResponse.json({ ok: true });
}
