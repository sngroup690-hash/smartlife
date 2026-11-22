import { NextRequest, NextResponse } from "next/server";
import { readPromoCodes } from "@/app/api/admin/promo-codes/route";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, { limit: 20, windowMs: 5 * 60_000 });
  if (limited) return limited;

  const { code, amount, isPack } = await req.json().catch(() => ({})) as {
    code?: string; amount?: number; isPack?: boolean;
  };
  if (!code) return NextResponse.json({ error: "Code requis" }, { status: 400 });

  const clean = code.toUpperCase().replace(/\s+/g, "").trim();

  // ── Codes fidélité PTS-XXXXX ──────────────────────────────────────────────
  if (clean.startsWith("PTS-")) {
    if (isPack) {
      return NextResponse.json(
        { error: "Les points de fidélité ne s'appliquent pas sur les Packs" },
        { status: 400 }
      );
    }
    const { validateLoyaltyCode } = await import("@/lib/loyalty-store");
    const loyaltyCode = await validateLoyaltyCode(clean);
    if (!loyaltyCode) {
      return NextResponse.json({ error: "Code fidélité invalide ou déjà utilisé" }, { status: 404 });
    }
    const baseAmount = Number(amount) || 0;
    const discount = Math.round(baseAmount * loyaltyCode.discountPercent / 100);
    return NextResponse.json({
      valid: true,
      code: clean,
      discountType: "percent",
      discountValue: loyaltyCode.discountPercent,
      discount: Math.max(0, discount),
      label: `Fidélité ${loyaltyCode.discountPercent}% (${loyaltyCode.pointsUsed} pts)`,
    });
  }

  // ── Codes promo partenaires classiques ────────────────────────────────────
  const all = await readPromoCodes();
  const promo = all.find((c) => c.code === clean);

  if (!promo) return NextResponse.json({ error: "Code promo invalide" }, { status: 404 });
  if (!promo.enabled) return NextResponse.json({ error: "Ce code promo n'est plus actif" }, { status: 400 });
  if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) {
    return NextResponse.json({ error: "Ce code promo a expiré" }, { status: 400 });
  }
  if (promo.maxUses && promo.uses >= promo.maxUses) {
    return NextResponse.json({ error: "Ce code a atteint son nombre maximum d'utilisations" }, { status: 400 });
  }

  const baseAmount = Number(amount) || 0;
  const discount = promo.discountType === "percent"
    ? Math.round(baseAmount * promo.discountValue / 100)
    : Math.min(promo.discountValue, Math.max(0, baseAmount - 100));

  return NextResponse.json({
    valid: true,
    code: promo.code,
    partnerName: promo.partnerName,
    discountType: promo.discountType,
    discountValue: promo.discountValue,
    discount: Math.max(0, discount),
    label: `Code ${promo.code}${promo.partnerName ? ` — ${promo.partnerName}` : ""}`,
  });
}
