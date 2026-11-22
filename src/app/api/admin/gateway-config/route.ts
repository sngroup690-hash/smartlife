import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const FILE = path.join(process.cwd(), "private", "gateway-config.json");

export type GatewayConfig = {
  cinetpay: boolean;
  sebpay: boolean;
};

const DEFAULT: GatewayConfig = { cinetpay: true, sebpay: true };

async function read(): Promise<GatewayConfig> {
  try {
    const raw = await readFile(FILE, "utf-8");
    return { ...DEFAULT, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT };
  }
}

async function write(cfg: GatewayConfig) {
  await mkdir(path.dirname(FILE), { recursive: true });
  await writeFile(FILE, JSON.stringify(cfg, null, 2), "utf-8");
}

function auth(req: NextRequest) {
  const pwd = req.nextUrl.searchParams.get("password") || req.headers.get("x-admin-password");
  return pwd === ADMIN_PASSWORD;
}

export async function GET(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  return NextResponse.json(await read());
}

export async function POST(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const body = await req.json() as Partial<GatewayConfig>;
  const current = await read();
  const updated: GatewayConfig = {
    cinetpay: typeof body.cinetpay === "boolean" ? body.cinetpay : current.cinetpay,
    sebpay:   typeof body.sebpay   === "boolean" ? body.sebpay   : current.sebpay,
  };
  // Empêcher de tout désactiver
  if (!updated.cinetpay && !updated.sebpay) {
    return NextResponse.json({ error: "Au moins un moyen de paiement doit rester actif." }, { status: 400 });
  }
  await write(updated);
  return NextResponse.json(updated);
}
