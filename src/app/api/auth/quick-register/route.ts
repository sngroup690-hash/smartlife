import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import { randomUUID } from "crypto";
import path from "path";

const USERS_FILE = path.join(process.cwd(), "private", "users.json");

async function readUsers(): Promise<Record<string, unknown>[]> {
  try {
    return JSON.parse(await readFile(USERS_FILE, "utf-8"));
  } catch {
    return [];
  }
}

async function writeUsers(users: unknown[]) {
  await mkdir(path.dirname(USERS_FILE), { recursive: true });
  await writeFile(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
}

// Enregistrement rapide sans PIN — utilisé par le QuickCheckoutModal.
// Pour un email existant : retourne l'utilisateur sans vérification de PIN.
// Pour un nouvel email : crée le compte avec un mot de passe aléatoire (accès via lien magique).
export async function POST(req: NextRequest) {
  const body = await req.json() as { firstName?: string; lastName?: string; email?: string; phone?: string };
  const { firstName, lastName, email, phone } = body;

  if (!firstName?.trim() || !lastName?.trim() || !email?.trim()) {
    return NextResponse.json({ error: "Champs requis manquants." }, { status: 400 });
  }

  const emailLower = email.trim().toLowerCase();
  const users = await readUsers();
  const idx = users.findIndex((u) => (u.email as string).toLowerCase() === emailLower);

  if (idx !== -1) {
    // Compte existant : on ne modifie rien sans preuve (pas même le téléphone).
    // Sans code PIN, on ne dévoile jamais les achats ni les données d'un compte existant :
    // seulement de quoi rattacher la nouvelle commande au bon compte.
    const u = users[idx] as Record<string, unknown>;
    return NextResponse.json({
      success: true,
      existing: true,
      user: { id: u.id, firstName: u.firstName, lastName: u.lastName, email: u.email, phone: phone?.trim() || "", ebooksAchetes: [], formationsAchetees: [], hasPassword: u.hasPassword },
    });
  }

  // Nouveau compte avec mot de passe aléatoire (l'utilisateur accède via lien magique)
  const newUser = {
    id: randomUUID(),
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    email: emailLower,
    phone: phone?.trim() ?? "",
    password: randomUUID(),
    hasPassword: false,
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
    body: JSON.stringify({ event: "register", userId: newUser.id, email: newUser.email, firstName: newUser.firstName, data: {} }),
  }).catch(() => {});

  const { password: _p, ...pub } = newUser;
  return NextResponse.json({ success: true, user: pub, existing: false });
}
