import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

const FILE = path.join(process.cwd(), "private", "consultants.json");

export async function GET() {
  try {
    const raw = await readFile(FILE, "utf-8");
    const consultants = JSON.parse(raw);
    if (Array.isArray(consultants)) {
      // Seuls les consultants actifs sont visibles publiquement
      return NextResponse.json({ consultants: consultants.filter((c: { actif?: boolean }) => c.actif !== false) });
    }
  } catch { /* fichier absent */ }

  return NextResponse.json({ consultants: [] });
}
