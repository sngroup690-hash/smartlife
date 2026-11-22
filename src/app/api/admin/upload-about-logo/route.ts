import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir, readdir, unlink } from "fs/promises";
import path from "path";
import { isValidAdminPassword } from "@/lib/admin-auth";

const LOGO_DIR = path.join(process.cwd(), "public", "about");
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];
const MAX_SIZE = 5 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const pwd = req.headers.get("x-admin-password");
  if (!isValidAdminPassword(pwd)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Format non supporté (jpg, png, webp, svg)" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Fichier trop volumineux (max 5 Mo)" }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  await mkdir(LOGO_DIR, { recursive: true });

  // Supprimer l'ancien logo
  try {
    const existing = await readdir(LOGO_DIR);
    for (const f of existing) {
      if (f.startsWith("logo.")) await unlink(path.join(LOGO_DIR, f));
    }
  } catch { /* ok */ }

  const filename = `logo.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(LOGO_DIR, filename), buffer);

  return NextResponse.json({ success: true, url: `/about/${filename}` });
}
