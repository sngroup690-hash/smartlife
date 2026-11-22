import { NextRequest, NextResponse } from "next/server";
import {
  getActiveVipSub, readVipConfig,
  isVipActive, readVipSubscriptions,
} from "@/lib/vip-store";

/** GET /api/vip?userId=X  → statut abonnement + config */
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId requis" }, { status: 400 });

  const [cfg, subs] = await Promise.all([readVipConfig(), readVipSubscriptions()]);

  // Vérifier + actualiser les crédits formation
  const subIdx = subs.findIndex(s => s.userId === userId);
  let sub = subIdx !== -1 ? subs[subIdx] : null;

  if (sub && isVipActive(sub)) {
    // Refresh crédits formation
    const now = new Date();
    const last = sub.formationCreditGrantedAt ? new Date(sub.formationCreditGrantedAt) : new Date(sub.startDate);
    const diff = (now.getFullYear() - last.getFullYear()) * 12 + (now.getMonth() - last.getMonth());
    if (diff > 0) {
      sub.formationCredits += diff;
      sub.formationCreditGrantedAt = now.toISOString();
      subs[subIdx] = sub;
      const { writeVipSubscriptions } = await import("@/lib/vip-store");
      await writeVipSubscriptions(subs).catch(() => {});
    }
  }

  const active = sub ? isVipActive(sub) : false;

  return NextResponse.json({
    enabled: cfg.enabled,
    active,
    plan: active ? sub!.plan : null,
    expiresAt: active ? sub!.expiresAt : null,
    formationCredits: active ? sub!.formationCredits : 0,
    redeemedFormationIds: active ? sub!.redeemedFormationIds : [],
    communityLink: active ? cfg.communityLink : null,
    communityType: cfg.communityType,
    monthlyPrice: cfg.monthlyPrice,
    annualPrice: cfg.annualPrice,
    currency: cfg.currency,
  });
}
