import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import { isValidAdminPassword } from "@/lib/admin-auth";

const FILE = path.join(process.cwd(), "private", "consultants.json");

export async function GET(req: NextRequest) {
  const pwd = req.headers.get("x-admin-password");
  if (!isValidAdminPassword(pwd)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  try {
    const raw = await readFile(FILE, "utf-8");
    const consultants = JSON.parse(raw);
    return NextResponse.json({ consultants: Array.isArray(consultants) ? consultants : [] });
  } catch {
    return NextResponse.json({ consultants: [] });
  }
}

export async function POST(req: NextRequest) {
  const pwd = req.headers.get("x-admin-password");
  if (!isValidAdminPassword(pwd)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || !Array.isArray(body.consultants)) {
    return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
  }

  await mkdir(path.dirname(FILE), { recursive: true });
  await writeFile(FILE, JSON.stringify(body.consultants, null, 2), "utf-8");

  return NextResponse.json({ success: true });
}
