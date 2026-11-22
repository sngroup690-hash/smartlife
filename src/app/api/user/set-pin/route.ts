import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import { rateLimit } from "@/lib/rate-limit";
import { hacherCode, verifierCode, validerCodeEmail, minutesDeBlocage, noterEchec, effacerEchecs } from "@/lib/securite-compte";

export const dynamic = "force-dynamic";

const USERS_FILE = path.join(process.cwd(), "private", "users.json");

async function readUsers(): Promise<Record<string, unknown>[]> {
  try {
    const raw = await readFile(USERS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeUsers(users: unknown[]) {
  await mkdir(path.dirname(USERS_FILE), { recursive: true });
  await writeFile(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
}

// Créer ou changer le code PIN d'un compte. Il faut une preuve :
// - soit le code PIN actuel (pour le changer),
// - soit le code à 6 chiffres reçu par e-mail (première création ou code oublié).
export async function POST(req: NextRequest) {
  const limite = rateLimit(req, { limit: 10, windowMs: 15 * 60_000 });
  if (limite) return limite;

  const body = await req.json().catch(() => null) as { email?: string; pin?: string; ancienCode?: string; codeEmail?: string } | null;
  if (!body?.email || !body?.pin) {
    return NextResponse.json({ error: "Email et code requis." }, { status: 400 });
  }
  const email = String(body.email).trim().toLowerCase();
  const pin = String(body.pin).trim();
  if (!/^\d{4,6}$/.test(pin)) {
    return NextResponse.json({ error: "Le code doit contenir entre 4 et 6 chiffres." }, { status: 400 });
  }
  const bloque = minutesDeBlocage(email);
  if (bloque > 0) {
    return NextResponse.json({ error: `Trop d'essais. Réessaie dans ${bloque} minute${bloque > 1 ? "s" : ""}.` }, { status: 429 });
  }

  const users = await readUsers();
  const idx = users.findIndex((u) => String(u.email ?? "").toLowerCase() === email);
  if (idx === -1) {
    return NextResponse.json({ error: "Compte introuvable." }, { status: 404 });
  }

  const user = users[idx];
  const preuveAncienCode = !!body.ancienCode && user.hasPassword === true && verifierCode(user.password, String(body.ancienCode));
  const preuveEmail = !preuveAncienCode && !!body.codeEmail && await validerCodeEmail(email, String(body.codeEmail));
  if (!preuveAncienCode && !preuveEmail) {
    if (body.ancienCode || body.codeEmail) noterEchec(email);
    return NextResponse.json(
      { error: body.codeEmail ? "Code reçu par e-mail incorrect ou expiré." : "Pour ta sécurité, confirme avec le code reçu par e-mail.", besoinCodeEmail: true },
      { status: 403 },
    );
  }

  effacerEchecs(email);
  users[idx] = { ...user, password: hacherCode(pin), hasPassword: true };
  await writeUsers(users);
  return NextResponse.json({ success: true });
}
