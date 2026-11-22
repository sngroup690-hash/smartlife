import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import { hacherCode, verifierCode, minutesDeBlocage, noterEchec, effacerEchecs } from "@/lib/securite-compte";

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

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { firstName, lastName, email, phone, password } = body;

  if (!firstName || !lastName || !email || !password) {
    return NextResponse.json({ error: "Champs requis manquants." }, { status: 400 });
  }

  const emailLower = (email as string).trim().toLowerCase();
  const users = await readUsers();
  const idx = users.findIndex((u) => (u.email as string).toLowerCase() === emailLower);

  if (idx !== -1) {
    const existing = users[idx];
    if (existing.hasPassword === true) {
      // Compte protégé : il faut son vrai code PIN.
      const bloque = minutesDeBlocage(emailLower);
      if (bloque > 0) {
        return NextResponse.json({ error: `Trop d'essais. Réessaie dans ${bloque} minute${bloque > 1 ? "s" : ""}.`, code: "WRONG_PIN" }, { status: 429 });
      }
      if (!verifierCode(existing.password, String(password))) {
        noterEchec(emailLower);
        return NextResponse.json(
          { error: "Un compte existe déjà avec cet email. Vérifiez votre code PIN.", code: "WRONG_PIN" },
          { status: 401 }
        );
      }
      effacerEchecs(emailLower);
      const { password: _p, ...pub } = existing;
      return NextResponse.json({ success: true, user: pub, existing: true });
    }
    // Compte sans code : on permet d'acheter, sans dévoiler les anciens achats ni fixer de code sans preuve.
    // Le client créera son code dans « Mon espace » avec le code reçu par e-mail.
    return NextResponse.json({
      success: true,
      existing: true,
      user: {
        id: existing.id, firstName: existing.firstName, lastName: existing.lastName, email: existing.email,
        phone: (phone as string)?.trim() || "", ebooksAchetes: [], formationsAchetees: [],
      },
    });
  }

  // Nouveau compte
  const newUser = {
    id: crypto.randomUUID(),
    firstName: (firstName as string).trim(),
    lastName: (lastName as string).trim(),
    email: emailLower,
    phone: (phone as string)?.trim() || "",
    password: hacherCode(String(password)),
    hasPassword: true,
    ebooksAchetes: [],
    formationsAchetees: [],
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  await writeUsers(users);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  fetch(`${appUrl}/api/automations/track`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event: "register",
      userId: newUser.id,
      email: newUser.email,
      firstName: newUser.firstName,
      data: {},
    }),
  }).catch(() => {});

  const { password: _p, ...pub } = newUser;
  return NextResponse.json({ success: true, user: pub, existing: false });
}
