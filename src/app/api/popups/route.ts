import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import type { Popup } from "@/app/api/admin/popups/route";

const POPUPS_FILE = path.join(process.cwd(), "private", "popups.json");

const NO_STORE = { "Cache-Control": "no-store, must-revalidate" };

// GET /api/popups — returns only enabled popups filtered by date range
export async function GET() {
  try {
    const raw = await readFile(POPUPS_FILE, "utf-8");
    const popups = JSON.parse(raw) as Popup[];
    const now = new Date();

    const active = popups.filter((p) => {
      if (!p.enabled) return false;
      if (p.startDate) {
        try { if (new Date(p.startDate) > now) return false; } catch { /* ignore */ }
      }
      if (p.endDate) {
        try { if (new Date(p.endDate) < now) return false; } catch { /* ignore */ }
      }
      return true;
    });

    return NextResponse.json(active, { headers: NO_STORE });
  } catch {
    return NextResponse.json([], { headers: NO_STORE });
  }
}
