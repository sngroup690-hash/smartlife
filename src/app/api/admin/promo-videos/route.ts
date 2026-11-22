import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const FILE = path.join(process.cwd(), "private", "promo-videos.json");

type PromoVideos = { formation: string; accompagnement: string };

function read(): PromoVideos {
  try { return JSON.parse(fs.readFileSync(FILE, "utf-8")); }
  catch { return { formation: "", accompagnement: "" }; }
}

function write(data: PromoVideos) {
  const dir = path.dirname(FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2), "utf-8");
}

export async function GET(req: NextRequest) {
  if (req.headers.get("x-admin-password") !== ADMIN_PASSWORD)
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  return NextResponse.json(read());
}

export async function POST(req: NextRequest) {
  if (req.headers.get("x-admin-password") !== ADMIN_PASSWORD)
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const current = read();
  if (typeof body.formation === "string") current.formation = body.formation;
  if (typeof body.accompagnement === "string") current.accompagnement = body.accompagnement;
  write(current);
  return NextResponse.json({ success: true });
}
