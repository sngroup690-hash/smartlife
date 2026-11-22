import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { DEFAULT_ABOUT_CONFIG } from "@/app/api/admin/about-config/route";

const FILE = path.join(process.cwd(), "private", "about-config.json");

export async function GET() {
  try {
    const raw = await readFile(FILE, "utf-8");
    return NextResponse.json({ ...DEFAULT_ABOUT_CONFIG, ...JSON.parse(raw) });
  } catch {
    return NextResponse.json({ ...DEFAULT_ABOUT_CONFIG });
  }
}
