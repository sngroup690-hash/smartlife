import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import { revalidatePath } from "next/cache";
import path from "path";
import { isValidAdminPassword } from "@/lib/admin-auth";
import { bannerVersion } from "@/lib/banner-version";

const FILE = path.join(process.cwd(), "private", "announcements.json");

export async function GET(req: NextRequest) {
  const pwd = req.headers.get("x-admin-password");
  if (!isValidAdminPassword(pwd)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  try {
    const raw = await readFile(FILE, "utf-8");
    return NextResponse.json(JSON.parse(raw), {
      headers: { "Cache-Control": "no-store, must-revalidate" },
    });
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  const pwd = req.headers.get("x-admin-password");
  if (!isValidAdminPassword(pwd)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Données manquantes" }, { status: 400 });

  await mkdir(path.dirname(FILE), { recursive: true });
  await writeFile(FILE, JSON.stringify(body, null, 2), "utf-8");
  bannerVersion.bump();
  revalidatePath("/", "layout");
  return NextResponse.json({ success: true });
}
