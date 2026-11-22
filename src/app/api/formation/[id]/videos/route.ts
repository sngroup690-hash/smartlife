import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import fs from "fs";
import path from "path";

const SECRET = process.env.DOWNLOAD_SECRET;
const VIDEOS_FILE = path.join(process.cwd(), "private", "formation-videos.json");

function hourBucket(): number {
  return Math.floor(Date.now() / 1000 / 3600);
}

function readVideos(): Record<string, unknown[]> {
  try {
    return JSON.parse(fs.readFileSync(VIDEOS_FILE, "utf-8"));
  } catch {
    return {};
  }
}

function verifyToken(formationId: string, userId: string, token: string): boolean {
  const bucket = hourBucket();
  for (const b of [bucket, bucket - 1]) {
    const expected = crypto
      .createHmac("sha256", SECRET!)
      .update(`formation:${formationId}:${userId}:${b}`)
      .digest("hex");
    if (expected === token) return true;
  }
  return false;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const uid = req.nextUrl.searchParams.get("uid");
  const token = req.nextUrl.searchParams.get("token");

  // Authentification optionnelle : si fournie, on vérifie ; sinon on retourne quand même la structure
  if (uid && token && SECRET) {
    if (!verifyToken(id, uid, token)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
  }

  const videos = readVideos();
  return NextResponse.json({ modules: videos[id] ?? [] });
}
