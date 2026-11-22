import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";

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
    const existingPwd = (existing.password as string) || "";
    // Si le compte a déjà un PIN, vérifier qu'il correspond
    if (existingPwd && existingPwd !== password) {
      return NextResponse.json(
        { error: "Un compte existe déjà avec cet email. Vérifiez votre code PIN.", code: "WRONG_PIN" },
        { status: 401 }
      );
    }
    // Pas de PIN ou PIN correct → mettre à jour et retourner
    users[idx] = {
      ...existing,
      firstName: (firstName as string).trim(),
      lastName: (lastName as string).trim(),
      phone: (phone as string)?.trim() || existing.phone,
      password,
      hasPassword: true,
    };
    await writeUsers(users);
    const { password: _p, ...pub } = users[idx];
    return NextResponse.json({ success: true, user: pub, existing: true });
  }

  // Nouveau compte
  const newUser = {
    id: crypto.randomUUID(),
    firstName: (firstName as string).trim(),
    lastName: (lastName as string).trim(),
    email: emailLower,
    phone: (phone as string)?.trim() || "",
    password,
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
