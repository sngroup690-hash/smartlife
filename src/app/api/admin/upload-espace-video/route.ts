import { NextRequest, NextResponse } from "next/server";
import { createWriteStream } from "fs";
import { mkdir, unlink, readdir } from "fs/promises";
import path from "path";
import { Readable } from "stream";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Busboy = require("next/dist/compiled/busboy");

export const maxDuration = 300;

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ESPACE_VIDEOS_DIR = path.join(process.cwd(), "private", "espace-videos");

const ALLOWED_EXT = ["mp4", "webm", "ogg", "ogv", "mov", "avi", "mkv"];

export async function POST(req: NextRequest) {
  const pwd = req.headers.get("x-admin-password");
  if (pwd !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const contentType = req.headers.get("content-type") || "";

  try {
    await mkdir(ESPACE_VIDEOS_DIR, { recursive: true });

    const result = await new Promise<{
      espaceId: string;
      filePath: string;
      ext: string;
    }>((resolve, reject) => {
      const bb = Busboy({
        headers: { "content-type": contentType },
        limits: { fileSize: 10 * 1024 * 1024 * 1024 },
      });

      const fields: Record<string, string> = {};
      let savedFilePath = "";
      let savedExt = "";
      let writeFinished: Promise<void> | null = null;

      bb.on("field", (name: string, val: string) => {
        fields[name] = val;
      });

      bb.on("file", (_name: string, stream: NodeJS.ReadableStream, info: { filename: string }) => {
        const rawExt = info.filename.split(".").pop()?.toLowerCase() ?? "mp4";
        savedExt = ALLOWED_EXT.includes(rawExt) ? rawExt : "mp4";

        const tempPath = path.join(ESPACE_VIDEOS_DIR, `__tmp_${Date.now()}.${savedExt}`);
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
        resolve({ espaceId: fields["espaceId"] || "", filePath: savedFilePath, ext: savedExt });
      });

      bb.on("error", reject);

      if (req.body) {
        const nodeStream = Readable.fromWeb(req.body as import("stream/web").ReadableStream);
        nodeStream.pipe(bb);
      } else {
        reject(new Error("Corps de requête manquant"));
      }
    });

    if (!result.espaceId) {
      await unlink(result.filePath).catch(() => {});
      return NextResponse.json({ error: "espaceId manquant" }, { status: 400 });
    }

    // Supprimer les anciennes vidéos de cet espace
    try {
      const existing = await readdir(ESPACE_VIDEOS_DIR);
      for (const f of existing) {
        if (f.startsWith(`${result.espaceId}.`) && !f.startsWith("__tmp_")) {
          await unlink(path.join(ESPACE_VIDEOS_DIR, f));
        }
      }
    } catch { /* ok */ }

    const filename = `${result.espaceId}.${result.ext}`;
    const finalPath = path.join(ESPACE_VIDEOS_DIR, filename);
    const { rename } = await import("fs/promises");
    await rename(result.filePath, finalPath);

    return NextResponse.json({
      success: true,
      filename,
      videoUrl: `/api/espace-video/${filename}`,
    });
  } catch (err) {
    console.error("Espace video upload error:", err);
    return NextResponse.json({ error: "Erreur serveur lors de l'upload" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const pwd = req.headers.get("x-admin-password");
  if (pwd !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { espaceId } = await req.json().catch(() => ({}));
  if (!espaceId) return NextResponse.json({ error: "espaceId manquant" }, { status: 400 });

  try {
    const files = await readdir(ESPACE_VIDEOS_DIR);
    for (const f of files) {
      if (f.startsWith(`${espaceId}.`)) {
        await unlink(path.join(ESPACE_VIDEOS_DIR, f));
      }
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Fichier introuvable" }, { status: 404 });
  }
}
