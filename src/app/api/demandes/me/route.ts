import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

const FILE = path.join(process.cwd(), "private", "demandes.json");

async function readAll(): Promise<Record<string, unknown>[]> {
  try {
    const raw = await readFile(FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email")?.toLowerCase().trim();
  if (!email) return NextResponse.json({ demandes: [] });
  const all = await readAll();
  const mine = all.filter(
    (d) => ((d.client as Record<string, string>)?.email ?? "").toLowerCase() === email
  );
  return NextResponse.json({ demandes: mine });
}
