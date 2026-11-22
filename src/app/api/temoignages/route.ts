import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import type { Temoignage } from "@/app/api/admin/temoignages/route";

const FILE = path.join(process.cwd(), "private", "temoignages-data.json");

export async function GET() {
  try {
    const all: Temoignage[] = JSON.parse(await readFile(FILE, "utf-8"));
    const active = all
      .filter((t) => t.actif)
      .sort((a, b) => a.ordre - b.ordre);
    return NextResponse.json(active, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json([], { headers: { "Cache-Control": "no-store" } });
  }
}
