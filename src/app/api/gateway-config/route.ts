import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import type { GatewayConfig } from "@/app/api/admin/gateway-config/route";

const FILE = path.join(process.cwd(), "private", "gateway-config.json");
const DEFAULT: GatewayConfig = { cinetpay: true, sebpay: true };

export async function GET() {
  try {
    const raw = await readFile(FILE, "utf-8");
    return NextResponse.json({ ...DEFAULT, ...JSON.parse(raw) });
  } catch {
    return NextResponse.json(DEFAULT);
  }
}
