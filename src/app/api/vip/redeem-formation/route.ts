import { NextRequest, NextResponse } from "next/server";
import { redeemFormationCredit } from "@/lib/vip-store";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.userId || !body?.formationId) {
    return NextResponse.json({ error: "userId et formationId requis" }, { status: 400 });
  }
  const result = await redeemFormationCredit(body.userId, body.formationId);
  if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ success: true });
}
