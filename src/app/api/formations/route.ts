import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

const FILE = path.join(process.cwd(), "private", "formations-data.json");

export async function GET() {
  try {
    const raw = await readFile(FILE, "utf-8");
    const data = JSON.parse(raw);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ formations: [], overrides: {}, actif: {} });
  }
}
