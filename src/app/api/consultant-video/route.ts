import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";

const FILE = path.join(process.cwd(), "private", "consultant-video.json");
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

export async function GET() {
  try {
    const raw = await readFile(FILE, "utf-8");
    return NextResponse.json(JSON.parse(raw));
  } catch {
    return NextResponse.json({ url: "" });
  }
}

export async function POST(req: NextRequest) {
  const pwd = req.headers.get("x-admin-password");
  if (pwd !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  if (!body || typeof body.url !== "string") {
    return NextResponse.json({ error: "url manquante" }, { status: 400 });
  }
  await mkdir(path.dirname(FILE), { recursive: true });
  await writeFile(FILE, JSON.stringify({ url: body.url }, null, 2), "utf-8");
  return NextResponse.json({ success: true });
}
