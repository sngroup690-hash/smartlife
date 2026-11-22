import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { isValidAdminPassword } from "@/lib/admin-auth";

const ESPACES_FILE = path.join(process.cwd(), "private", "espaces.json");

export async function POST(req: NextRequest) {
  const pwd = req.headers.get("x-admin-password");
  if (!isValidAdminPassword(pwd)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || !Array.isArray(body.espaces)) {
    return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
  }

  await mkdir(path.dirname(ESPACES_FILE), { recursive: true });
  await writeFile(ESPACES_FILE, JSON.stringify(body.espaces, null, 2), "utf-8");

  return NextResponse.json({ success: true });
}
