import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import { isValidAdminPassword } from "@/lib/admin-auth";

const FILE = path.join(process.cwd(), "private", "about-config.json");

export const DEFAULT_ABOUT_CONFIG = {
  enabled: true,
  logoUrl: "/logo-smartlife.jpeg",
  sectionTitle: "À propos",
  positiveRatingsPct: 98,
  totalRatings: 780,
  totalCustomers: 32583,
  description: "Nous sommes une plateforme dédiée à votre développement personnel et entrepreneurial. Nos contenus sont conçus par des experts pour vous aider à atteindre vos objectifs.",
  whatsappNumber: "+237694176642",
};

async function readConfig() {
  try {
    const raw = await readFile(FILE, "utf-8");
    return { ...DEFAULT_ABOUT_CONFIG, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_ABOUT_CONFIG };
  }
}

export async function GET(req: NextRequest) {
  const pwd = req.headers.get("x-admin-password");
  if (!isValidAdminPassword(pwd)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  return NextResponse.json(await readConfig());
}

export async function POST(req: NextRequest) {
  const pwd = req.headers.get("x-admin-password");
  if (!isValidAdminPassword(pwd)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }
  const current = await readConfig();
  const updated = { ...current, ...body };
  await mkdir(path.dirname(FILE), { recursive: true });
  await writeFile(FILE, JSON.stringify(updated, null, 2), "utf-8");
  return NextResponse.json({ success: true, config: updated });
}
