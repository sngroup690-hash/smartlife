import { NextRequest, NextResponse } from "next/server";
import {
  getUserPoints,
  getOrCreateReferralCode,
  generateLoyaltyCode,
  pointsToDiscountPercent,
} from "@/lib/loyalty-store";
import { readUsers } from "@/lib/purchase-guard";

export const dynamic = "force-dynamic";

// GET /api/loyalty?userId=X  → points + referral code
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId requis" }, { status: 400 });

  const users = await readUsers();
  const user = users.find((u) => u.id === userId);
  if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

  const firstName = (user as Record<string, unknown> & { firstName?: string }).firstName || "USER";
  const [points, referralCode] = await Promise.all([
    getUserPoints(userId),
    getOrCreateReferralCode(userId, firstName),
  ]);

  const discountPercent = pointsToDiscountPercent(points);

  const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || "https://smartlifecm.com").replace(/\/$/, "");

  return NextResponse.json({
    points,
    referralCode,
    discountPercent,
    canRedeem: points >= 100,
    referralUrl: `${APP_URL}/?ref=${referralCode}`,
  });
}

// POST /api/loyalty  → générer un code de réduction depuis les points
export async function POST(req: NextRequest) {
  const { userId, pointsToUse } = await req.json().catch(() => ({})) as { userId?: string; pointsToUse?: number };
  if (!userId || !pointsToUse) return NextResponse.json({ error: "userId et pointsToUse requis" }, { status: 400 });

  const multiples = [500, 400, 300, 200, 100];
  const validPoints = multiples.find((m) => m <= pointsToUse) ?? 0;
  if (!validPoints) return NextResponse.json({ error: "Minimum 100 points requis" }, { status: 400 });

  const code = await generateLoyaltyCode(userId, validPoints);
  if (!code) return NextResponse.json({ error: "Points insuffisants" }, { status: 400 });

  return NextResponse.json({
    code: code.code,
    pointsUsed: code.pointsUsed,
    discountPercent: code.discountPercent,
    label: `Fidélité ${code.discountPercent}% (${code.pointsUsed} pts)`,
  });
}
