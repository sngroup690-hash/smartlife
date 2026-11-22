import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import fs from "fs";
import path from "path";

const SECRET = process.env.DOWNLOAD_SECRET;
const VIDEOS_DIR = path.join(process.cwd(), "private", "videos");
const VIDEOS_FILE = path.join(process.cwd(), "private", "formation-videos.json");
const FREE_LECON_COUNT = 3;

function isVideoInFreeLecon(formationId: string, videoId: string): boolean {
  try {
    const data = JSON.parse(fs.readFileSync(VIDEOS_FILE, "utf-8"));
    const modules: Array<{
      lecons?: Array<{ videos: Array<{ id: string }> }>;
      videos?: Array<{ id: string }>;
    }> = data[formationId] ?? [];
    const lecons = modules.flatMap((m) =>
      m.lecons ? m.lecons : m.videos ? [{ videos: m.videos }] : []
    );
    return lecons.slice(0, FREE_LECON_COUNT).some((l) => l.videos.some((v) => v.id === videoId));
  } catch { return false; }
}

const MIME_TYPES: Record<string, string> = {
  mp4: "video/mp4",
  webm: "video/webm",
  ogg: "video/ogg",
  ogv: "video/ogg",
  mov: "video/quicktime",
  avi: "video/x-msvideo",
  mkv: "video/x-matroska",
};

function hourBucket(): number {
  return Math.floor(Date.now() / 1000 / 3600);
}

function verifyToken(formationId: string, userId: string, token: string): boolean {
  if (!SECRET) return false;
  const bucket = hourBucket();
  for (const b of [bucket, bucket - 1]) {
    const expected = crypto
      .createHmac("sha256", SECRET)
      .update(`formation:${formationId}:${userId}:${b}`)
      .digest("hex");
    if (expected === token) return true;
  }
  return false;
}

function findVideoFile(formationId: string, videoId: string): string | null {
  const dir = path.join(VIDEOS_DIR, formationId);
  if (!fs.existsSync(dir)) return null;
  try {
    const files = fs.readdirSync(dir);
    const match = files.find((f) => f.startsWith(`${videoId}.`));
    return match ? path.join(dir, match) : null;
  } catch {
    return null;
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; videoId: string }> }
) {
  const { id, videoId } = await params;
  const isPreview = req.nextUrl.searchParams.get("preview") === "1";

  if (isPreview) {
    if (!isVideoInFreeLecon(id, videoId)) {
      return NextResponse.json({ error: "Accès refusé - leçon premium" }, { status: 403 });
    }
  } else {
    if (!SECRET) {
      return NextResponse.json({ error: "Serveur non configuré" }, { status: 500 });
    }
    const uid = req.nextUrl.searchParams.get("uid");
    const token = req.nextUrl.searchParams.get("token");
    if (!uid || !token || !verifyToken(id, uid, token)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
  }

  const filePath = findVideoFile(id, videoId);
  if (!filePath) {
    return NextResponse.json({ error: "Vidéo introuvable" }, { status: 404 });
  }

  const ext = filePath.split(".").pop()?.toLowerCase() ?? "mp4";
  const contentType = MIME_TYPES[ext] ?? "video/mp4";
  const stat = fs.statSync(filePath);
  const fileSize = stat.size;

  const rangeHeader = req.headers.get("range");

  if (rangeHeader) {
    const parts = rangeHeader.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const rawEnd = parts[1] ? parseInt(parts[1], 10) : -1;
    // Chunk de 10 Mo max pour ne pas surcharger la mémoire
    const end = rawEnd >= 0 ? rawEnd : Math.min(start + 10 * 1024 * 1024 - 1, fileSize - 1);
    const chunkSize = end - start + 1;

    const fileStream = fs.createReadStream(filePath, { start, end });
    const readable = new ReadableStream({
      start(controller) {
        fileStream.on("data", (chunk) => {
          try { controller.enqueue(chunk instanceof Buffer ? chunk : Buffer.from(chunk as string)); }
          catch { fileStream.destroy(); }
        });
        fileStream.on("end", () => { try { controller.close(); } catch {} });
        fileStream.on("error", (err) => { try { controller.error(err); } catch {} });
      },
      cancel() { fileStream.destroy(); },
    });

    return new NextResponse(readable, {
      status: 206,
      headers: {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": String(chunkSize),
        "Content-Type": contentType,
        "Cache-Control": "private, no-store",
      },
    });
  }

  // Sans range : on envoie le fichier entier mais on déclare Accept-Ranges
  // pour que le navigateur puisse ensuite faire des requêtes range
  const fileStream = fs.createReadStream(filePath);
  const readable = new ReadableStream({
    start(controller) {
      fileStream.on("data", (chunk) => {
        try { controller.enqueue(chunk instanceof Buffer ? chunk : Buffer.from(chunk as string)); }
        catch { fileStream.destroy(); }
      });
      fileStream.on("end", () => { try { controller.close(); } catch {} });
      fileStream.on("error", (err) => { try { controller.error(err); } catch {} });
    },
    cancel() { fileStream.destroy(); },
  });

  return new NextResponse(readable, {
    status: 200,
    headers: {
      "Accept-Ranges": "bytes",
      "Content-Length": String(fileSize),
      "Content-Type": contentType,
      "Cache-Control": "private, no-store",
    },
  });
}
