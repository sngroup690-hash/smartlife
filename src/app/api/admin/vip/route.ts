import { NextRequest, NextResponse } from "next/server";
import {
  readVipConfig, writeVipConfig,
  readVipSubscriptions, writeVipSubscriptions,
  adminCancelSubscription, adminExtendSubscription, isVipActive,
} from "@/lib/vip-store";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

function auth(req: NextRequest): boolean {
  const h = req.headers.get("x-admin-password");
  const q = req.nextUrl.searchParams.get("password");
  return h === ADMIN_PASSWORD || q === ADMIN_PASSWORD;
}

export async function GET(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const [cfg, subs] = await Promise.all([readVipConfig(), readVipSubscriptions()]);
  const now = new Date();

  const enriched = subs.map(s => ({
    ...s,
    isActive: isVipActive(s),
    daysLeft: isVipActive(s) ? Math.ceil((new Date(s.expiresAt).getTime() - now.getTime()) / 86_400_000) : 0,
  }));

  return NextResponse.json({ config: cfg, subscriptions: enriched });
}

export async function POST(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { action, config, userId, months } = body as {
    action?: string;
    config?: Partial<import("@/lib/vip-store").VipConfig>;
    userId?: string;
    months?: number;
  };

  // Mise à jour de la config
  if (action === "updateConfig" && config) {
    const current = await readVipConfig();
    await writeVipConfig({ ...current, ...config });
    return NextResponse.json({ success: true });
  }

  // Annuler un abonnement
  if (action === "cancel" && userId) {
    const ok = await adminCancelSubscription(userId);
    return NextResponse.json({ success: ok });
  }

  // Prolonger un abonnement
  if (action === "extend" && userId && months) {
    const ok = await adminExtendSubscription(userId, months);
    return NextResponse.json({ success: ok });
  }

  // Activer manuellement un abonnement
  if (action === "activate" && userId) {
    const subs = await readVipSubscriptions();
    const idx = subs.findIndex(s => s.userId === userId);
    if (idx !== -1) {
      const sub = subs[idx];
      const base = new Date();
      base.setMonth(base.getMonth() + 1);
      sub.expiresAt = base.toISOString();
      sub.status = "active";
      subs[idx] = sub;
      await writeVipSubscriptions(subs);
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: "Abonné introuvable" }, { status: 404 });
  }

  return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
}
