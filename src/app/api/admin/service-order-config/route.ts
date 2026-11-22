import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";

const FILE = path.join(process.cwd(), "private", "service-order-config.json");

export type ServiceOrderConfig = {
  confirmationMessage: string;
  whatsappNumber: string;
  redirectUrl: string;
  redirectDelay: number;
};

const DEFAULT: ServiceOrderConfig = {
  confirmationMessage:
    "Merci pour votre commande ! Contactez notre équipe sur WhatsApp au {whatsapp} avec votre numéro de commande #{numero_commande} pour démarrer votre séance.",
  whatsappNumber: "+237697000000",
  redirectUrl: "",
  redirectDelay: 5,
};

async function readConfig(): Promise<ServiceOrderConfig> {
  try {
    const raw = await readFile(FILE, "utf-8");
    return { ...DEFAULT, ...JSON.parse(raw) };
  } catch {
    return DEFAULT;
  }
}

export async function GET() {
  return NextResponse.json(await readConfig(), {
    headers: { "Cache-Control": "no-store, must-revalidate" },
  });
}

export async function POST(req: NextRequest) {
  const pwd = req.headers.get("x-admin-password");
  if (pwd !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  try {
    const body = (await req.json()) as Partial<ServiceOrderConfig>;
    const current = await readConfig();
    const updated: ServiceOrderConfig = { ...current, ...body };
    await mkdir(path.dirname(FILE), { recursive: true });
    await writeFile(FILE, JSON.stringify(updated, null, 2), "utf-8");
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
