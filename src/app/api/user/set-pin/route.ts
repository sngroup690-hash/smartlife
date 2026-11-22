import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";

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

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.email || !body?.pin) {
    return NextResponse.json({ error: "Email et code requis." }, { status: 400 });
  }
  const pin = String(body.pin).trim();
  if (!/^\d{4,6}$/.test(pin)) {
    return NextResponse.json({ error: "Le code doit contenir entre 4 et 6 chiffres." }, { status: 400 });
  }
  const users = await readUsers();
  const idx = users.findIndex(
    (u) => (u.email as string).toLowerCase() === String(body.email).toLowerCase()
  );
  if (idx === -1) {
    return NextResponse.json({ error: "Compte introuvable." }, { status: 404 });
  }
  users[idx] = { ...users[idx], password: pin, hasPassword: true };
  await writeUsers(users);
  return NextResponse.json({ success: true });
}
