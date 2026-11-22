import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";

const FILE = path.join(process.cwd(), "private", "contacts.json");
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

async function readAll(): Promise<Record<string, unknown>[]> {
  try {
    const raw = await readFile(FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, email, subject, message } = body;

  if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
    return NextResponse.json({ error: "Champs requis manquants." }, { status: 400 });
  }

  const all = await readAll();
  const entry = {
    id: crypto.randomUUID(),
    name: String(name).trim(),
    email: String(email).trim().toLowerCase(),
    subject: String(subject).trim(),
    message: String(message).trim(),
    createdAt: new Date().toISOString(),
    read: false,
  };
  all.push(entry);

  await mkdir(path.dirname(FILE), { recursive: true });
  await writeFile(FILE, JSON.stringify(all, null, 2), "utf-8");

  return NextResponse.json({ success: true });
}

export async function GET(req: NextRequest) {
  const pw = req.headers.get("x-admin-password");
  if (pw !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const all = await readAll();
  return NextResponse.json(all);
}
