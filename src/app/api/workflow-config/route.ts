import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { DEFAULT_CONFIG } from "@/app/api/admin/workflow-config/route";

const FILE = path.join(process.cwd(), "private", "workflow-config.json");

export async function GET() {
  try {
    const raw = await readFile(FILE, "utf-8");
    return NextResponse.json({ ...DEFAULT_CONFIG, ...JSON.parse(raw) });
  } catch {
    return NextResponse.json({ ...DEFAULT_CONFIG });
  }
}
