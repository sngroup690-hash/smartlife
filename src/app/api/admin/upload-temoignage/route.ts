import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { isValidAdminPassword } from "@/lib/admin-auth";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "temoignages");
const ALLOWED_IMAGES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ALLOWED_AUDIO = ["audio/mpeg", "audio/mp4", "audio/x-m4a", "audio/wav", "audio/ogg", "audio/webm", "audio/aac", "audio/x-wav"];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 Mo
const MAX_AUDIO_SIZE = 50 * 1024 * 1024; // 50 Mo

export async function POST(req: NextRequest) {
  const pwd = req.headers.get("x-admin-password");
  if (!isValidAdminPassword(pwd)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "Aucun fichier" }, { status: 400 });

    const isImage = ALLOWED_IMAGES.includes(file.type);
    const isAudio = ALLOWED_AUDIO.includes(file.type) || file.type.startsWith("audio/");
    if (!isImage && !isAudio) return NextResponse.json({ error: "Format non supporté (jpg, png, webp, gif, mp3, m4a, wav, ogg)" }, { status: 400 });

    const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_AUDIO_SIZE;
    if (file.size > maxSize) return NextResponse.json({ error: `Fichier trop volumineux (max ${isImage ? "10" : "50"} Mo)` }, { status: 400 });

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const filename = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${ext}`;
    await mkdir(UPLOAD_DIR, { recursive: true });
    await writeFile(path.join(UPLOAD_DIR, filename), Buffer.from(await file.arrayBuffer()));
    return NextResponse.json({ url: `/uploads/temoignages/${filename}` });
  } catch {
    return NextResponse.json({ error: "Erreur upload" }, { status: 500 });
  }
}
