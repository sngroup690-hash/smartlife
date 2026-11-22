import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import type { ExitIntentEntry } from "@/app/api/exit-intent/route";

const FILE = path.join(process.cwd(), "private", "exit-intent.json");
const ADMIN_PW = process.env.ADMIN_PASSWORD;

type Data = { responses: ExitIntentEntry[] };

async function read(): Promise<Data> {
  try { return JSON.parse(await readFile(FILE, "utf-8")); }
  catch { return { responses: [] }; }
}

export async function GET(req: NextRequest) {
  if (req.headers.get("x-admin-password") !== ADMIN_PW) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { responses } = await read();
  const total = responses.length;

  const LABELS: Record<number, string> = {
    1: "Prix trop élevé",
    2: "Hésitation / Doute",
    3: "Paiement / Plus tard",
    4: "Autre",
  };

  const byChoice = [1, 2, 3, 4].map((c) => {
    const count = responses.filter((r) => r.choice === c).length;
    return {
      choice: c,
      label: LABELS[c],
      count,
      pct: total > 0 ? Math.round((count / total) * 100) : 0,
    };
  });

  const byPage: Record<string, number> = {};
  responses.forEach((r) => { byPage[r.page] = (byPage[r.page] || 0) + 1; });
  const topPages = Object.entries(byPage)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([page, count]) => ({ page, count, pct: total > 0 ? Math.round((count / total) * 100) : 0 }));

  const otherTexts = responses
    .filter((r) => r.choice === 4 && r.otherText)
    .slice(-30)
    .reverse()
    .map((r) => ({ text: r.otherText!, timestamp: r.timestamp, page: r.page }));

  // Daily breakdown (last 30 days)
  const now = Date.now();
  const byDay: Record<string, number> = {};
  responses.forEach((r) => {
    const d = r.timestamp.slice(0, 10);
    if (now - new Date(r.timestamp).getTime() < 30 * 86400000) {
      byDay[d] = (byDay[d] || 0) + 1;
    }
  });
  const dailyStats = Object.entries(byDay)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, count]) => ({ date, count }));

  return NextResponse.json({ total, byChoice, topPages, otherTexts, dailyStats });
}
