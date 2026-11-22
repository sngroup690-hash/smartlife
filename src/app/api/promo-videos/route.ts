import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const FILE = path.join(process.cwd(), "private", "promo-videos.json");

export async function GET() {
  try {
    const data = JSON.parse(fs.readFileSync(FILE, "utf-8"));
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ formation: "", accompagnement: "" });
  }
}
