import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";
const NO_STORE = { headers: { "Cache-Control": "no-store" } };
const FILE = path.join(process.cwd(), "private", "ressources-gratuites.json");

export async function GET() {
  try {
    const data = JSON.parse(await readFile(FILE, "utf-8"));
    const ressources = (data.ressources ?? []).filter((r: { actif: boolean }) => r.actif);
    return NextResponse.json({ ressources }, NO_STORE);
  } catch {
    return NextResponse.json({ ressources: [] }, NO_STORE);
  }
}
