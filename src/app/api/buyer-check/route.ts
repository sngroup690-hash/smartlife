import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

const FILE = path.join(process.cwd(), "private", "buyers-fingerprints.json");

type BuyerRecord = { ip: string; fingerprint: string; purchasedAt: string };

async function readRecords(): Promise<BuyerRecord[]> {
  try { return JSON.parse(await readFile(FILE, "utf-8")); }
  catch { return []; }
}

function getIP(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fingerprint = searchParams.get("fp") || "";

    // IP matching intentionally removed: carrier-grade NAT (African operators)
    // means millions of users share one IP — one buyer would flag everyone.
    // Fingerprint-only matching is safe because it is device-specific.
    if (!fingerprint) {
      return NextResponse.json({ isBuyer: false });
    }

    const records = await readRecords();
    const isBuyer = records.some((r) => r.fingerprint === fingerprint);

    return NextResponse.json({ isBuyer });
  } catch {
    return NextResponse.json({ isBuyer: false });
  }
}
