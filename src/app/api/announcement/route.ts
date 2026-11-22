import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

const FILE = path.join(process.cwd(), "private", "announcements.json");
const FILE_OLD = path.join(process.cwd(), "private", "announcement.json");

const NO_STORE = { "Cache-Control": "no-store, must-revalidate" };

export async function GET() {
  try {
    const raw = await readFile(FILE, "utf-8");
    return NextResponse.json(JSON.parse(raw), { headers: NO_STORE });
  } catch {
    // Backward compat: try old single-announcement file
    try {
      const old = await readFile(FILE_OLD, "utf-8");
      const single = JSON.parse(old);
      if (single && single.text) {
        return NextResponse.json([{ ...single, id: "legacy" }], { headers: NO_STORE });
      }
    } catch {}
    return NextResponse.json([], { headers: NO_STORE });
  }
}
