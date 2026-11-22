import { NextRequest, NextResponse } from "next/server";
import { createWriteStream } from "fs";
import { mkdir, access, readdir, unlink } from "fs/promises";
import path from "path";
import { Readable } from "stream";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Busboy = require("next/dist/compiled/busboy");

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const DIR = path.join(process.cwd(), "private", "ebooks");

// GET — liste les IDs des ebooks qui ont un PDF uploadé
export async function GET(req: NextRequest) {
  const pwd = req.headers.get("x-admin-password");
  if (pwd !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  try {
    await access(DIR);
    const files = await readdir(DIR);
    const ids = files
      .filter((f) => f.endsWith(".pdf"))
      .map((f) => f.replace(".pdf", ""));
    return NextResponse.json({ uploaded: ids });
  } catch {
    return NextResponse.json({ uploaded: [] });
  }
}

// DELETE — supprimer un PDF uploadé
export async function DELETE(req: NextRequest) {
  const pwd = req.headers.get("x-admin-password");
  if (pwd !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const { ebookId } = await req.json().catch(() => ({}));
  if (!ebookId) return NextResponse.json({ error: "ebookId manquant" }, { status: 400 });
  try {
    await unlink(path.join(DIR, `${ebookId}.pdf`));
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Fichier introuvable" }, { status: 404 });
  }
}

// POST — upload PDF en streaming (pas de limite mémoire)
export async function POST(req: NextRequest) {
  // Auth vérifiée avant toute écriture disque
  const pwd = req.headers.get("x-admin-password");
  if (pwd !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const contentType = req.headers.get("content-type") || "";

  try {
    await mkdir(DIR, { recursive: true });

    const result = await new Promise<{ ebookId: string; filePath: string; fileType: string }>(
      (resolve, reject) => {
        const bb = Busboy({
          headers: { "content-type": contentType },
          limits: { fileSize: 2 * 1024 * 1024 * 1024 }, // 2 Go max
        });

        const fields: Record<string, string> = {};
        let savedFilePath = "";
        let mimeType = "";
        // Promise qui se résout quand le WriteStream a terminé de vider son buffer sur le disque
        let writeFinished: Promise<void> | null = null;

        bb.on("field", (name: string, val: string) => {
          fields[name] = val;
        });

        bb.on("file", (_name: string, stream: NodeJS.ReadableStream, info: { filename: string; mimeType: string }) => {
          mimeType = info.mimeType;
          const tempPath = path.join(DIR, `__tmp_${Date.now()}.pdf`);
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
            ebookId: fields["ebookId"] || "",
            filePath: savedFilePath,
            fileType: mimeType,
          });
        });

        bb.on("error", reject);

        // Convertir le Web ReadableStream en Node.js Readable et le piper vers busboy
        if (req.body) {
          const nodeStream = Readable.fromWeb(req.body as import("stream/web").ReadableStream);
          nodeStream.pipe(bb);
        } else {
          reject(new Error("Corps de requête manquant"));
        }
      }
    );

    if (!result.ebookId) {
      await unlink(result.filePath).catch(() => {});
      return NextResponse.json({ error: "ebookId manquant" }, { status: 400 });
    }

    if (result.fileType !== "application/pdf") {
      await unlink(result.filePath).catch(() => {});
      return NextResponse.json({ error: "Le fichier doit être un PDF" }, { status: 400 });
    }

    // Renommer le fichier temp vers le nom final
    const finalPath = path.join(DIR, `${result.ebookId}.pdf`);
    const { rename } = await import("fs/promises");
    await rename(result.filePath, finalPath);

    return NextResponse.json({ success: true, path: `private/ebooks/${result.ebookId}.pdf` });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Erreur serveur lors de l'upload" }, { status: 500 });
  }
}
