import { NextRequest, NextResponse } from "next/server";
import { createWriteStream } from "fs";
import { mkdir, unlink, readdir, access } from "fs/promises";
import path from "path";
import { Readable } from "stream";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Busboy = require("next/dist/compiled/busboy");

export const maxDuration = 300;

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const VIDEOS_DIR = path.join(process.cwd(), "private", "videos");

const ALLOWED_EXT = ["mp4", "webm", "ogg", "ogv", "mov", "avi", "mkv"];

export async function POST(req: NextRequest) {
  const pwd = req.headers.get("x-admin-password");
  if (pwd !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const contentType = req.headers.get("content-type") || "";

  try {
    await mkdir(VIDEOS_DIR, { recursive: true });

    const result = await new Promise<{
      formationId: string;
      videoId: string;
      filePath: string;
      ext: string;
    }>((resolve, reject) => {
      const bb = Busboy({
        headers: { "content-type": contentType },
        limits: { fileSize: 10 * 1024 * 1024 * 1024 }, // 10 Go max
      });

      const fields: Record<string, string> = {};
      let savedFilePath = "";
      let savedExt = "";
      let writeFinished: Promise<void> | null = null;

      bb.on("field", (name: string, val: string) => {
        fields[name] = val;
      });

      bb.on("file", (_name: string, stream: NodeJS.ReadableStream, info: { filename: string; mimeType: string }) => {
        const rawExt = info.filename.split(".").pop()?.toLowerCase() ?? "mp4";
        savedExt = ALLOWED_EXT.includes(rawExt) ? rawExt : "mp4";

        const tempPath = path.join(VIDEOS_DIR, `__tmp_${Date.now()}.${savedExt}`);
        savedFilePath = tempPath;

        const ws = createWriteStream(tempPath);
        stream.pipe(ws);

        writeFinished = new Promise<void>((res, rej) => {
          ws.on("finish", res);
          ws.on("error", rej);
        });

        stream.on("error", reject);
      });

      bb.on("close", async () => {
        if (!savedFilePath || !writeFinished) {
          reject(new Error("Aucun fichier reçu"));
          return;
        }
        try {
          await writeFinished;
        } catch (err) {
          reject(err);
          return;
        }
        resolve({
          formationId: fields["formationId"] || "",
          videoId: fields["videoId"] || "",
          filePath: savedFilePath,
          ext: savedExt,
        });
      });

      bb.on("error", reject);

      if (req.body) {
        const nodeStream = Readable.fromWeb(req.body as import("stream/web").ReadableStream);
        nodeStream.pipe(bb);
      } else {
        reject(new Error("Corps de requête manquant"));
      }
    });

    if (!result.formationId || !result.videoId) {
      await unlink(result.filePath).catch(() => {});
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
    }

    if (!ALLOWED_EXT.includes(result.ext)) {
      await unlink(result.filePath).catch(() => {});
      return NextResponse.json({ error: "Format non supporté. Utilisez MP4, WebM, MOV ou AVI." }, { status: 400 });
    }

    const dir = path.join(VIDEOS_DIR, result.formationId);
    await mkdir(dir, { recursive: true });

    // Supprimer les anciennes versions de cette vidéo
    try {
      const existing = await readdir(dir);
      for (const f of existing) {
        if (f.startsWith(`${result.videoId}.`)) {
          await unlink(path.join(dir, f));
        }
      }
    } catch { /* ok */ }

    // Déplacer le fichier temp vers le dossier final
    const finalPath = path.join(dir, `${result.videoId}.${result.ext}`);
    const { rename } = await import("fs/promises");
    await rename(result.filePath, finalPath);

    return NextResponse.json({ success: true, ext: result.ext });
  } catch (err) {
    console.error("Video upload error:", err);
    return NextResponse.json({ error: "Erreur serveur lors de l'upload" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const pwd = req.headers.get("x-admin-password");
  if (pwd !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { formationId, videoId } = await req.json().catch(() => ({}));
  if (!formationId || !videoId) {
    return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
  }

  const dir = path.join(VIDEOS_DIR, formationId);
  try {
    const files = await readdir(dir);
    for (const f of files) {
      if (f.startsWith(`${videoId}.`)) {
        await unlink(path.join(dir, f));
      }
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Fichier introuvable" }, { status: 404 });
  }
}

// GET ?formationId=X → liste des videoIds uploadés pour cette formation
export async function GET(req: NextRequest) {
  const pwd = req.headers.get("x-admin-password");
  if (pwd !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const formationId = req.nextUrl.searchParams.get("formationId");
  if (!formationId) return NextResponse.json({ uploaded: [] });

  const dir = path.join(VIDEOS_DIR, formationId);
  try {
    await access(dir);
    const files = await readdir(dir);
    const ids = files
      .filter((f) => ALLOWED_EXT.some((ext) => f.endsWith(`.${ext}`)))
      .map((f) => f.replace(/\.[^/.]+$/, ""));
    return NextResponse.json({ uploaded: ids });
  } catch {
    return NextResponse.json({ uploaded: [] });
  }
}
