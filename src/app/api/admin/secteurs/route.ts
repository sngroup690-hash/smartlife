import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import { isValidAdminPassword } from "@/lib/admin-auth";

const FILE = path.join(process.cwd(), "private", "secteurs.json");

export const DEFAULT_SECTEURS = [
  "Services", "Agriculture", "Commerce", "Restauration",
  "Beauté", "Alimentaire", "Santé & Bien-être", "Éducation",
  "Transport", "Artisanat", "Numérique", "Élevage", "BTP",
  "Finance", "Immobilier", "Entrepreneuriat", "Marketing", "Autre",
];

async function readSecteurs(): Promise<string[]> {
  try {
    const raw = await readFile(FILE, "utf-8");
    const data = JSON.parse(raw);
    if (Array.isArray(data) && data.length > 0) return data;
    return DEFAULT_SECTEURS;
  } catch {
    return DEFAULT_SECTEURS;
  }
}

export async function GET() {
  return NextResponse.json({ secteurs: await readSecteurs() });
}

export async function POST(req: NextRequest) {
  const pwd = req.headers.get("x-admin-password");
  if (!isValidAdminPassword(pwd)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  if (!Array.isArray(body?.secteurs)) {
    return NextResponse.json({ error: "Format invalide" }, { status: 400 });
  }
  const secteurs: string[] = body.secteurs.filter((s: unknown) => typeof s === "string" && s.trim()).map((s: string) => s.trim());
  if (secteurs.length === 0) return NextResponse.json({ error: "Liste vide" }, { status: 400 });
  await mkdir(path.dirname(FILE), { recursive: true });
  await writeFile(FILE, JSON.stringify(secteurs, null, 2), "utf-8");
  return NextResponse.json({ success: true, secteurs });
}
