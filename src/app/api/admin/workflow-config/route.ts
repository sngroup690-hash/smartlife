import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import { isValidAdminPassword } from "@/lib/admin-auth";

const FILE = path.join(process.cwd(), "private", "workflow-config.json");

export const DEFAULT_CONFIG = {
  motivationEnabled: true,
  avisEnabled: false,
  accompagnementEnabled: true,
  congratsTitle: "Paiement confirmé ! 🎉",
  congratsSubtitle: "Avant d'accéder à votre contenu, prenez 1 minute pour nous partager vos motivations. Cela nous aide à mieux vous accompagner.",
  motivationObjectifLabel: "Quel est votre objectif principal ?",
  motivationSituationLabel: "Quelle est votre situation actuelle ?",
  motivationTexteLabel: "Qu'est-ce qui vous a motivé à effectuer cet achat ?",
  motivationTexteplaceholder: "Décrivez brièvement votre projet, vos attentes, ou ce qui vous a poussé à passer à l'action…",
  motivationAccompagnementLabel: "Seriez-vous intéressé(e) par un programme d'accompagnement personnalisé ?",
  motivationSubmitLabel: "Envoyer mes motivations",
  motivationSkipLabel: "Passer cette étape →",
  successTitle: "C'est tout bon ! 🎉",
  successSubtitle: "Votre achat est confirmé. Téléchargez vos produits ci-dessous ou retrouvez-les à tout moment dans Mon Espace.",
  downloadLabel: "Télécharger",
  watchLabel: "Visionner",
  monEspaceLabel: "Accéder à Mon Espace →",
};

async function readConfig() {
  try {
    const raw = await readFile(FILE, "utf-8");
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_CONFIG };
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
