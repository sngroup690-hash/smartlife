import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const FILE = path.join(process.cwd(), "private", "social-proof.json");

export type FakeNotif = {
  id: string;
  type: "purchase" | "download";
  prenom: string;
  ville: string;
  produit: string;
};

export type SocialProofConfig = {
  enabled: boolean;
  position: "bottom-left" | "bottom-right";
  delayBetween: number;       // secondes entre deux popups
  displayDuration: number;    // secondes d'affichage
  mobileEnabled: boolean;
  mode: "real" | "fake" | "mixed";
  fakeNotifs: FakeNotif[];
  // FOMO
  fomoEnabled: boolean;
  fomoMessage: string;
  fomoInitialCount: number;
  fomoCurrentCount: number;
  fomoDecreasing: boolean;
  fomoDecreaseIntervalMin: number;
  fomoLastDecreased: string;
};

export const DEFAULT_CONFIG: SocialProofConfig = {
  enabled: false,
  position: "bottom-left",
  delayBetween: 20,
  displayDuration: 5,
  mobileEnabled: false,
  mode: "fake",
  fakeNotifs: [
    { id: "1", type: "purchase", prenom: "Marie", ville: "Douala", produit: "Guide Investissement" },
    { id: "2", type: "purchase", prenom: "Jean-Paul", ville: "Yaoundé", produit: "Formation Business" },
    { id: "3", type: "download", prenom: "Sandrine", ville: "Abidjan", produit: "PDF Gratuit" },
    { id: "4", type: "purchase", prenom: "Patrick", ville: "Bafoussam", produit: "Pack Premium" },
    { id: "5", type: "download", prenom: "Nathalie", ville: "Paris", produit: "Guide Immigration" },
  ],
  fomoEnabled: false,
  fomoMessage: "⚡ Plus que {X} accès disponibles pour cette offre !",
  fomoInitialCount: 12,
  fomoCurrentCount: 12,
  fomoDecreasing: true,
  fomoDecreaseIntervalMin: 10,
  fomoLastDecreased: new Date().toISOString(),
};

export async function readSPConfig(): Promise<SocialProofConfig> {
  try {
    const raw = await readFile(FILE, "utf-8");
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

async function writeSPConfig(config: SocialProofConfig) {
  await mkdir(path.dirname(FILE), { recursive: true });
  await writeFile(FILE, JSON.stringify(config, null, 2));
}

function auth(req: NextRequest) {
  const pw = req.headers.get("x-admin-password") || req.nextUrl.searchParams.get("password");
  return pw === ADMIN_PASSWORD;
}

export async function GET(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  return NextResponse.json(await readSPConfig());
}

export async function POST(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const body = await req.json() as Partial<SocialProofConfig>;
  const current = await readSPConfig();
  const updated = { ...current, ...body };
  await writeSPConfig(updated);
  return NextResponse.json(updated);
}

// PATCH : ajouter / modifier / supprimer une fakeNotif
export async function PATCH(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { action, notif } = await req.json() as { action: "add" | "update" | "delete"; notif: FakeNotif };
  const config = await readSPConfig();

  if (action === "add") {
    config.fakeNotifs.push({ ...notif, id: crypto.randomUUID() });
  } else if (action === "update") {
    const idx = config.fakeNotifs.findIndex(n => n.id === notif.id);
    if (idx !== -1) config.fakeNotifs[idx] = notif;
  } else if (action === "delete") {
    config.fakeNotifs = config.fakeNotifs.filter(n => n.id !== notif.id);
  }

  await writeSPConfig(config);
  return NextResponse.json(config);
}
