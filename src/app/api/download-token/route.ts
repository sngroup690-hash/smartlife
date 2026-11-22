import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { hasEbookAccess } from "@/lib/purchase-guard";

const SECRET = process.env.DOWNLOAD_SECRET;

function hourBucket(): number {
  return Math.floor(Date.now() / 1000 / 3600);
}

export async function POST(req: NextRequest) {
  if (!SECRET) {
    return NextResponse.json({ error: "Serveur non configuré" }, { status: 500 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.ebookId || !body?.userId) {
    return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
  }

  const { ebookId, userId, email } = body as { ebookId: string; userId: string; email?: string };

  // Vérification côté serveur : achat direct OU abonnement VIP actif
  const [purchased, vipSub] = await Promise.all([
    hasEbookAccess(userId, ebookId, email),
    import("@/lib/vip-store").then(m => m.getActiveVipSub(userId)).catch(() => null),
  ]);
  if (!purchased && !vipSub) {
    return NextResponse.json({ error: "Achat non trouvé" }, { status: 403 });
  }

  const bucket = hourBucket();
  const token = crypto
    .createHmac("sha256", SECRET)
    .update(`${ebookId}:${userId}:${bucket}`)
    .digest("hex");

  return NextResponse.json({ token, expiresIn: 3600 });
}
