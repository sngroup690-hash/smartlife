import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir, unlink, readdir } from "fs/promises";
import path from "path";
import { isValidAdminPassword } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const DIR = path.join(process.cwd(), "public", "pack-banners");
const ALLOWED_EXT = ["jpg", "jpeg", "png", "webp", "avif", "gif"];

function auth(req: NextRequest): boolean {
  const h = req.headers.get("x-admin-password");
  const q = req.nextUrl.searchParams.get("password");
  return isValidAdminPassword(h) || isValidAdminPassword(q);
}

export async function POST(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const formData = await req.formData();
  const packId = formData.get("packId") as string;
  const file = formData.get("file") as File | null;

  if (!packId || !file) return NextResponse.json({ error: "Données manquantes" }, { status: 400 });

  const rawExt = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_EXT.includes(rawExt)) {
    return NextResponse.json({ error: "Format non supporté. Utilisez JPG, PNG, WebP ou AVIF." }, { status: 400 });
  }
  if (file.size > 15 * 1024 * 1024) {
    return NextResponse.json({ error: "Image trop lourde (max 15 Mo)." }, { status: 400 });
  }

  await mkdir(DIR, { recursive: true });

  // Supprimer l'ancienne bannière de ce pack
  try {
    const existing = await readdir(DIR);
    for (const f of existing) {
      if (f.replace(/\.[^/.]+$/, "") === packId) await unlink(path.join(DIR, f));
    }
  } catch { /* ok */ }

  const fileName = `${packId}.${rawExt}`;
  await writeFile(path.join(DIR, fileName), Buffer.from(await file.arrayBuffer()));

  return NextResponse.json({ success: true, url: `/pack-banners/${fileName}` });
}

export async function DELETE(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { packId } = await req.json().catch(() => ({})) as { packId?: string };
  if (!packId) return NextResponse.json({ error: "packId manquant" }, { status: 400 });

  try {
    const files = await readdir(DIR);
    for (const f of files) {
      if (f.replace(/\.[^/.]+$/, "") === packId) await unlink(path.join(DIR, f));
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Fichier introuvable" }, { status: 404 });
  }
}
