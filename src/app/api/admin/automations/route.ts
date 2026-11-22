import { NextRequest, NextResponse } from "next/server";
import { readConfig, writeConfig, type AutomationsConfig } from "@/lib/automation-engine";

// GET /api/admin/automations — return current config
export async function GET() {
  const config = await readConfig();
  return NextResponse.json(config);
}

// POST /api/admin/automations — save new config
export async function POST(req: NextRequest) {
  const adminPassword = req.headers.get("x-admin-password");
  if (!adminPassword || adminPassword !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const body = await req.json() as AutomationsConfig;
    await writeConfig(body);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erreur sauvegarde config" }, { status: 500 });
  }
}
