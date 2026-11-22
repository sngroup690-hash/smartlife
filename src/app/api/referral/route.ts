import { NextRequest, NextResponse } from "next/server";
import { findUserByReferralCode } from "@/lib/loyalty-store";

export const dynamic = "force-dynamic";

// GET /api/referral?code=JEAN  → infos sur le parrain (pour afficher "Invité par Jean")
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code")?.toUpperCase();
  if (!code) return NextResponse.json({ valid: false });

  const user = await findUserByReferralCode(code);
  if (!user) return NextResponse.json({ valid: false });

  const u = user as Record<string, unknown> & { firstName?: string; lastName?: string };
  return NextResponse.json({
    valid: true,
    firstName: u.firstName || "",
    displayName: u.firstName || "Un ami",
  });
}

// POST /api/referral  → pose le cookie de parrainage (appelé par ReferralTracker côté client)
export async function POST(req: NextRequest) {
  const { code } = await req.json().catch(() => ({})) as { code?: string };
  if (!code) return NextResponse.json({ ok: false });

  const clean = code.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
  const user = await findUserByReferralCode(clean);
  if (!user) return NextResponse.json({ valid: false, ok: false });

  const res = NextResponse.json({ ok: true, valid: true });
  res.cookies.set("sl_ref", clean, {
    httpOnly: false,
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 jours
    sameSite: "lax",
  });
  return res;
}
