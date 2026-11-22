import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir, unlink, readdir, access } from "fs/promises";
import path from "path";
import { isValidAdminPassword } from "@/lib/admin-auth";

const DIR = path.join(process.cwd(), "public", "espace-covers");
const ALLOWED_EXT = ["jpg", "jpeg", "png", "webp", "avif", "gif"];

export async function POST(req: NextRequest) {
  const pwd = req.headers.get("x-admin-password");
  if (!isValidAdminPassword(pwd)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const formData = await req.formData();
  const espaceId = formData.get("espaceId") as string;
  const file = formData.get("file") as File | null;

  if (!espaceId || !file) return NextResponse.json({ error: "Données manquantes" }, { status: 400 });

  const rawExt = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_EXT.includes(rawExt)) return NextResponse.json({ error: "Format non supporté." }, { status: 400 });
  if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "Image trop lourde (max 10 Mo)." }, { status: 400 });

  await mkdir(DIR, { recursive: true });

  try {
    const existing = await readdir(DIR);
    for (const f of existing) {
      if (f.replace(/\.[^/.]+$/, "") === espaceId) await unlink(path.join(DIR, f));
    }
  } catch { /* ok */ }

  const filePath = path.join(DIR, `${espaceId}.${rawExt}`);
  await writeFile(filePath, Buffer.from(await file.arrayBuffer()));

  return NextResponse.json({ success: true, url: `/espace-covers/${espaceId}.${rawExt}` });
}

export async function DELETE(req: NextRequest) {
  const pwd = req.headers.get("x-admin-password");
  if (!isValidAdminPassword(pwd)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { espaceId } = await req.json().catch(() => ({}));
  if (!espaceId) return NextResponse.json({ error: "Données manquantes" }, { status: 400 });

  try {
    const files = await readdir(DIR);
    for (const f of files) {
      if (f.replace(/\.[^/.]+$/, "") === espaceId) await unlink(path.join(DIR, f));
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Fichier introuvable" }, { status: 404 });
  }
}

export async function GET(req: NextRequest) {
  const pwd = req.headers.get("x-admin-password");
  if (!isValidAdminPassword(pwd)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  try {
    await access(DIR);
    const files = await readdir(DIR);
    const covers: Record<string, string> = {};
    for (const f of files) {
      const ext = f.split(".").pop()?.toLowerCase() ?? "";
      if (ALLOWED_EXT.includes(ext)) covers[f.replace(/\.[^/.]+$/, "")] = `/espace-covers/${f}`;
    }
    return NextResponse.json({ covers });
  } catch {
    return NextResponse.json({ covers: {} });
  }
}
