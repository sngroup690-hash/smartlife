import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const DIR = path.join(process.cwd(), "public", "desc-images");
const ALLOWED_EXT = ["jpg", "jpeg", "png", "webp", "avif", "gif"];

export async function POST(req: NextRequest) {
  const pwd = req.headers.get("x-admin-password");
  if (pwd !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
  }

  // Detect extension from name or MIME type (pasted images may have generic names)
  let rawExt = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_EXT.includes(rawExt)) {
    const mimeToExt: Record<string, string> = {
      "image/jpeg": "jpg", "image/png": "png",
      "image/webp": "webp", "image/gif": "gif", "image/avif": "avif",
    };
    rawExt = mimeToExt[file.type] ?? "";
  }
  if (!rawExt) {
    return NextResponse.json({ error: "Format non supporté. Utilisez JPG, PNG, WebP ou AVIF." }, { status: 400 });
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "Image trop lourde (max 5 Mo)." }, { status: 400 });
  }

  await mkdir(DIR, { recursive: true });

  const uid = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const filename = `${uid}.${rawExt}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(DIR, filename), buffer);

  return NextResponse.json({ url: `/desc-images/${filename}` });
}
