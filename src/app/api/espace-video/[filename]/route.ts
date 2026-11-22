import { NextRequest, NextResponse } from "next/server";
import { createReadStream } from "fs";
import { stat } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

const ESPACE_VIDEOS_DIR = path.join(process.cwd(), "private", "espace-videos");

const MIME: Record<string, string> = {
  mp4: "video/mp4",
  webm: "video/webm",
  ogg: "video/ogg",
  ogv: "video/ogg",
  mov: "video/quicktime",
  avi: "video/x-msvideo",
  mkv: "video/x-matroska",
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;

  // Sanitize: only allow alphanumeric, dash, underscore, dot
  if (!/^[\w\-.]+$/.test(filename)) {
    return NextResponse.json({ error: "Fichier invalide" }, { status: 400 });
  }

  const filePath = path.join(ESPACE_VIDEOS_DIR, filename);
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const mimeType = MIME[ext] ?? "video/mp4";

  let fileSize: number;
  try {
    const info = await stat(filePath);
    fileSize = info.size;
  } catch {
    return NextResponse.json({ error: "Vidéo introuvable" }, { status: 404 });
  }

  const rangeHeader = req.headers.get("range");

  if (rangeHeader) {
    const match = rangeHeader.match(/bytes=(\d+)-(\d*)/);
    if (!match) {
      return new NextResponse("Range invalide", { status: 416 });
    }
    const start = parseInt(match[1], 10);
    const end = match[2] ? parseInt(match[2], 10) : fileSize - 1;
    const chunkSize = end - start + 1;

    const stream = createReadStream(filePath, { start, end });
    const webStream = new ReadableStream({
      start(controller) {
        stream.on("data", (chunk) => {
          try { controller.enqueue(chunk); }
          catch { stream.destroy(); }
        });
        stream.on("end", () => { try { controller.close(); } catch {} });
        stream.on("error", (err) => { try { controller.error(err); } catch {} });
      },
      cancel() { stream.destroy(); },
    });

    return new NextResponse(webStream, {
      status: 206,
      headers: {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": String(chunkSize),
        "Content-Type": mimeType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  }

  const stream = createReadStream(filePath);
  const webStream = new ReadableStream({
    start(controller) {
      stream.on("data", (chunk) => {
        try { controller.enqueue(chunk); }
        catch { stream.destroy(); }
      });
      stream.on("end", () => { try { controller.close(); } catch {} });
      stream.on("error", (err) => { try { controller.error(err); } catch {} });
    },
    cancel() { stream.destroy(); },
  });

  return new NextResponse(webStream, {
    status: 200,
    headers: {
      "Content-Length": String(fileSize),
      "Content-Type": mimeType,
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
