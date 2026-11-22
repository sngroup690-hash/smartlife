import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { hasFormationAccess } from "@/lib/purchase-guard";

const SECRET = process.env.DOWNLOAD_SECRET;

function hourBucket(): number {
  return Math.floor(Date.now() / 1000 / 3600);
}

export async function POST(req: NextRequest) {
  if (!SECRET) return NextResponse.json({ error: "Serveur non configuré" }, { status: 500 });

  const { formationId, userId } = await req.json().catch(() => ({}));
  if (!formationId || !userId) {
    return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
  }

  // Vérification côté serveur que l'utilisateur a bien acheté cette formation
  const allowed = await hasFormationAccess(userId, formationId);
  if (!allowed) {
    return NextResponse.json({ error: "Achat non trouvé" }, { status: 403 });
  }

  const bucket = hourBucket();
  const token = crypto
    .createHmac("sha256", SECRET)
    .update(`formation:${formationId}:${userId}:${bucket}`)
    .digest("hex");

  return NextResponse.json({ token });
}
