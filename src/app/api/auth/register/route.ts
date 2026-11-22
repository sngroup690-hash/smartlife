import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import { hacherCode } from "@/lib/securite-compte";

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

  const users = await readUsers();
  const exists = users.some(
    (u) => (u.email as string).toLowerCase() === email.toLowerCase()
  );
  if (exists) {
    return NextResponse.json(
      { error: "Un compte avec cet email existe déjà." },
      { status: 409 }
    );
  }

  const newUser = {
    id: crypto.randomUUID(),
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    email: email.trim().toLowerCase(),
    phone: phone?.trim() || "",
    password: hacherCode(String(password)),
    hasPassword: true,
    ebooksAchetes: [],
    formationsAchetees: [],
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  await writeUsers(users);

  // Fire & forget: schedule welcome automation sequence
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

  const { password: _pwd, ...userPublic } = newUser;
  return NextResponse.json({ success: true, user: userPublic });
}
