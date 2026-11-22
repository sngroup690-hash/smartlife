import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const VIDEOS_FILE = path.join(process.cwd(), "private", "formation-videos.json");

export type ModuleVideo = { id: string; titre: string; duree: string; url: string };
export type ModuleLecon = { id: string; titre: string; videos: ModuleVideo[] };
export type FormationModule = {
  id: string;
  titre: string;
  lecons?: ModuleLecon[];
  videos?: ModuleVideo[]; // ancien format — rétrocompat
};

function readAll(): Record<string, FormationModule[]> {
  try {
    return JSON.parse(fs.readFileSync(VIDEOS_FILE, "utf-8"));
  } catch {
    return {};
  }
}

function writeAll(data: Record<string, FormationModule[]>) {
  const dir = path.dirname(VIDEOS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(VIDEOS_FILE, JSON.stringify(data, null, 2), "utf-8");
}

export async function GET(req: NextRequest) {
  const pwd = req.headers.get("x-admin-password");
  if (pwd !== ADMIN_PASSWORD) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  return NextResponse.json(readAll());
}

export async function POST(req: NextRequest) {
  const pwd = req.headers.get("x-admin-password");
  if (pwd !== ADMIN_PASSWORD) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { formationId, modules } = await req.json().catch(() => ({}));
  if (!formationId) return NextResponse.json({ error: "formationId manquant" }, { status: 400 });

  const data = readAll();
  if (modules === null || modules === undefined) {
    delete data[formationId];
  } else {
    data[formationId] = modules;
  }
  writeAll(data);
  return NextResponse.json({ success: true });
}
