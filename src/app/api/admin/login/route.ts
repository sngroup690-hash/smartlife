import { NextRequest, NextResponse } from "next/server";
import { getAdminByCredentials } from "@/lib/admin-auth";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, { limit: 5, windowMs: 15 * 60_000 });
  if (limited) return limited;

  const body = await req.json().catch(() => null);
  const { username = "", password = "" } = body ?? {};

  if (!password) {
    return NextResponse.json({ error: "Mot de passe requis" }, { status: 400 });
  }

  const admin = getAdminByCredentials(username, password);

  if (!admin) {
    return NextResponse.json({ error: "Identifiants invalides" }, { status: 401 });
  }

  return NextResponse.json({
    success: true,
    role: admin.role,
    nom: admin.nom,
    username: admin.username,
  });
}
