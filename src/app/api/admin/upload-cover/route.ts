import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir, unlink, readdir, access } from "fs/promises";
import path from "path";
import { isValidAdminPassword } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const COVERS_DIR = path.join(process.cwd(), "public", "covers");
const ALLOWED_EXT = ["jpg", "jpeg", "png", "webp", "avif", "gif"];

export async function POST(req: NextRequest) {
  const pwd = req.headers.get("x-admin-password");
  if (!isValidAdminPassword(pwd)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const formData = await req.formData();
  const ebookId = formData.get("ebookId") as string;
  const file = formData.get("file") as File | null;

  if (!ebookId || !file) {
    return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
  }

  const rawExt = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_EXT.includes(rawExt)) {
    return NextResponse.json({ error: "Format non supporté. Utilisez JPG, PNG, WebP ou AVIF." }, { status: 400 });
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "Image trop lourde (max 10 Mo)." }, { status: 400 });
  }

  await mkdir(COVERS_DIR, { recursive: true });

  try {
    const existing = await readdir(COVERS_DIR);
    for (const f of existing) {
      if (f.replace(/\.[^/.]+$/, "") === ebookId) {
        await unlink(path.join(COVERS_DIR, f));
      }
    }
  } catch { /* ok */ }

  const filePath = path.join(COVERS_DIR, `${ebookId}.${rawExt}`);
  await writeFile(filePath, Buffer.from(await file.arrayBuffer()));

  return NextResponse.json({ success: true, url: `/covers/${ebookId}.${rawExt}` });
}

export async function DELETE(req: NextRequest) {
  const pwd = req.headers.get("x-admin-password");
  if (!isValidAdminPassword(pwd)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { ebookId } = await req.json().catch(() => ({}));
  if (!ebookId) {
    return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
  }

  try {
    const files = await readdir(COVERS_DIR);
    for (const f of files) {
      if (f.replace(/\.[^/.]+$/, "") === ebookId) {
        await unlink(path.join(COVERS_DIR, f));
      }
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Fichier introuvable" }, { status: 404 });
  }
}

export async function GET(req: NextRequest) {
  const pwd = req.headers.get("x-admin-password");
  if (!isValidAdminPassword(pwd)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    await access(COVERS_DIR);
    const files = await readdir(COVERS_DIR);
    const covers: Record<string, string> = {};
    for (const f of files) {
      const ext = f.split(".").pop()?.toLowerCase() ?? "";
      if (ALLOWED_EXT.includes(ext)) {
        covers[f.replace(/\.[^/.]+$/, "")] = `/covers/${f}`;
      }
    }
    return NextResponse.json({ covers });
  } catch {
    return NextResponse.json({ covers: {} });
  }
}
