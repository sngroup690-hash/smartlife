import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile } from "fs/promises";
import path from "path";
import { rateLimit } from "@/lib/rate-limit";
import { validerCodeEmail, hacherCode, minutesDeBlocage, noterEchec, effacerEchecs } from "@/lib/securite-compte";

export const dynamic = "force-dynamic";

const USERS_FILE = path.join(process.cwd(), "private", "users.json");

// POST /api/auth/connexion-code { email, code, nouveauPin? }
// Connexion avec le code à 6 chiffres reçu par e-mail : c'est la preuve que la personne a accès à la boîte.
// Si « nouveauPin » est fourni, il devient le code PIN du compte pour les prochaines fois.
export async function POST(req: NextRequest) {
  const limite = rateLimit(req, { limit: 10, windowMs: 15 * 60_000 });
  if (limite) return limite;

  const body = await req.json().catch(() => null) as { email?: string; code?: string; nouveauPin?: string } | null;
  const email = String(body?.email ?? "").trim().toLowerCase();
  const code = String(body?.code ?? "").trim();
  const nouveauPin = body?.nouveauPin ? String(body.nouveauPin).trim() : "";
  if (!email || !/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: "Entre le code à 6 chiffres reçu par e-mail." }, { status: 400 });
  }
  if (nouveauPin && !/^\d{4,6}$/.test(nouveauPin)) {
    return NextResponse.json({ error: "Le code PIN doit contenir entre 4 et 6 chiffres." }, { status: 400 });
  }
  const bloque = minutesDeBlocage(email);
  if (bloque > 0) {
    return NextResponse.json({ error: `Trop d'essais. Réessaie dans ${bloque} minute${bloque > 1 ? "s" : ""}.` }, { status: 429 });
  }

  if (!(await validerCodeEmail(email, code))) {
    noterEchec(email);
    return NextResponse.json({ error: "Code incorrect ou expiré. Demande un nouveau code." }, { status: 401 });
  }

  let users: Record<string, unknown>[] = [];
  try { users = JSON.parse(await readFile(USERS_FILE, "utf-8")); } catch { /* aucun compte */ }
  const idx = users.findIndex((u) => String(u.email ?? "").toLowerCase() === email);
  if (idx === -1) return NextResponse.json({ error: "Compte introuvable." }, { status: 404 });

  effacerEchecs(email);
  if (nouveauPin) {
    users[idx] = { ...users[idx], password: hacherCode(nouveauPin), hasPassword: true };
    await writeFile(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
  }
  const { password: _p, ...user } = users[idx];
  return NextResponse.json({ success: true, user });
}
