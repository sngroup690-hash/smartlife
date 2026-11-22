import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { Readable } from "stream";
import { PDFDocument } from "pdf-lib";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Busboy = require("next/dist/compiled/busboy");

const PREVIEW_PAGES = 3;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const DIR = path.join(process.cwd(), "private", "pdf-previews");

async function extractFirstPages(buf: Buffer, n: number): Promise<Buffer> {
  const srcDoc = await PDFDocument.load(buf);
  const total = srcDoc.getPageCount();
  const count = Math.min(n, total);

  const previewDoc = await PDFDocument.create();
  const pages = await previewDoc.copyPages(srcDoc, Array.from({ length: count }, (_, i) => i));
  pages.forEach((p) => previewDoc.addPage(p));

  return Buffer.from(await previewDoc.save());
}

export async function POST(req: NextRequest) {
  const pwd = req.headers.get("x-admin-password");
  if (pwd !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const contentType = req.headers.get("content-type") || "";
  try {
    await mkdir(DIR, { recursive: true });

    return await new Promise<NextResponse>((resolve) => {
      const bb = Busboy({ headers: { "content-type": contentType } });
      let ebookId = "";
      const chunks: Buffer[] = [];
      let mimeOk = true;
      let fileReceived = false;

      bb.on("field", (name: string, val: string) => {
        if (name === "ebookId") ebookId = val;
      });

      bb.on("file", (_name: string, fileStream: NodeJS.ReadableStream, info: { filename: string; mimeType: string }) => {
        if (!info.mimeType.includes("pdf")) {
          fileStream.resume();
          mimeOk = false;
          resolve(NextResponse.json({ error: "Seuls les fichiers PDF sont acceptés" }, { status: 400 }));
          return;
        }
        fileReceived = true;
        fileStream.on("data", (chunk: Buffer) => chunks.push(chunk));
        fileStream.on("end", () => {});
      });

      bb.on("finish", async () => {
        if (!mimeOk) return;
        if (!fileReceived || chunks.length === 0) {
          resolve(NextResponse.json({ error: "Aucun fichier reçu" }, { status: 400 }));
          return;
        }

        const safe = ebookId.replace(/[^a-zA-Z0-9_-]/g, "") || "preview";
        const dest = path.join(DIR, `${safe}.pdf`);

        try {
          const rawBuf = Buffer.concat(chunks);
          const previewBuf = await extractFirstPages(rawBuf, PREVIEW_PAGES);
          await writeFile(dest, previewBuf);
          resolve(NextResponse.json({ previewUrl: `/api/pdf-preview/${safe}` }));
        } catch {
          resolve(NextResponse.json({ error: "Impossible de traiter le PDF" }, { status: 500 }));
        }
      });

      if (req.body) {
        Readable.from(req.body as unknown as AsyncIterable<Uint8Array>).pipe(bb);
      } else {
        resolve(NextResponse.json({ error: "Corps de requête vide" }, { status: 400 }));
      }
    });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
