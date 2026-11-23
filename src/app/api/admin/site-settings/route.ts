import { NextRequest, NextResponse } from "next/server";
import { isValidAdminPassword } from "@/lib/admin-auth";
import { lireReglagesSite, ecrireReglagesSite } from "@/lib/reglages-site";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isValidAdminPassword(req.headers.get("x-admin-password"))) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  return NextResponse.json(await lireReglagesSite());
}

export async function POST(req: NextRequest) {
  if (!isValidAdminPassword(req.headers.get("x-admin-password"))) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const corps = await req.json().catch(() => null);
  if (!corps || typeof corps !== "object") {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }
  return NextResponse.json({ success: true, reglages: await ecrireReglagesSite(corps) });
}
