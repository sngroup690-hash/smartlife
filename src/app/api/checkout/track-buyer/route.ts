import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";

const FILE = path.join(process.cwd(), "private", "buyers-fingerprints.json");

type BuyerRecord = { ip: string; fingerprint: string; purchasedAt: string };

async function readRecords(): Promise<BuyerRecord[]> {
  try { return JSON.parse(await readFile(FILE, "utf-8")); }
  catch { return []; }
}

async function writeRecords(records: BuyerRecord[]) {
  await mkdir(path.dirname(FILE), { recursive: true });
  await writeFile(FILE, JSON.stringify(records, null, 2), "utf-8");
}

function getIP(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { fingerprint?: string };
    const fingerprint = body.fingerprint || "";
    const ip = getIP(req);
    const records = await readRecords();

    const alreadyKnown = records.some(
      (r) => fingerprint && r.fingerprint === fingerprint
    );

    if (!alreadyKnown) {
      records.push({ ip, fingerprint, purchasedAt: new Date().toISOString() });
      await writeRecords(records);
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
