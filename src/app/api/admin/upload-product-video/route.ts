import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const DIR = path.join(process.cwd(), "public", "product-videos");

export async function POST(req: NextRequest) {
  const pw = req.headers.get("x-admin-password");
  if (!ADMIN_PASSWORD || pw !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "mp4";
    if (!["mp4", "webm", "mov", "ogg"].includes(ext)) {
      return NextResponse.json({ error: "Format non supporté (mp4, webm, mov, ogg)" }, { status: 400 });
    }

    await mkdir(DIR, { recursive: true });
    const id = crypto.randomBytes(8).toString("hex");
    const filename = `${id}.${ext}`;
    const bytes = await file.arrayBuffer();
    await writeFile(path.join(DIR, filename), Buffer.from(bytes));

    return NextResponse.json({ url: `/product-videos/${filename}` });
  } catch {
    return NextResponse.json({ error: "Erreur lors de l'upload" }, { status: 500 });
  }
}
