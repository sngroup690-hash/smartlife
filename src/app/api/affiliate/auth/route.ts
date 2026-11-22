import { NextRequest, NextResponse } from "next/server";
import { readAffiliates, writeAffiliates, hashPassword, createToken } from "@/lib/affiliate-store";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  if (!email || !password)
    return NextResponse.json({ error: "Email et mot de passe requis" }, { status: 400 });

  const all = await readAffiliates();
  const aff = all.find((a) => a.email && a.email.toLowerCase() === String(email).toLowerCase().trim());

  if (!aff) return NextResponse.json({ error: "Adresse email non reconnue" }, { status: 401 });
  if (!aff.enabled)
    return NextResponse.json({ error: "Compte désactivé. Contactez l'administrateur." }, { status: 403 });
  if (aff.passwordHash !== hashPassword(String(password)))
    return NextResponse.json({ error: "Mot de passe incorrect" }, { status: 401 });

  const idx = all.findIndex((a) => a.id === aff.id);
  all[idx].lastLogin = new Date().toISOString();
  await writeAffiliates(all);

  const token = createToken(aff.id);
  const res = NextResponse.json({
    ok: true,
    affiliate: { id: aff.id, code: aff.code, displayName: aff.displayName },
  });
  res.cookies.set("aff_token", token, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60,
    path: "/",
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set("aff_token", "", { maxAge: 0, path: "/" });
  return res;
}
