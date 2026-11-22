import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { isValidAdminPassword } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const EBOOKS_FILE = path.join(process.cwd(), "private", "ebooks-data.json");
const FORMATIONS_FILE = path.join(process.cwd(), "private", "formations-data.json");

export async function GET(req: NextRequest) {
  const pwd = req.headers.get("x-admin-password");
  if (!isValidAdminPassword(pwd)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const type = req.nextUrl.searchParams.get("type");

  if (type === "ebooks") {
    try {
      const raw = await readFile(EBOOKS_FILE, "utf-8");
      const data = JSON.parse(raw);
      return NextResponse.json({ ebooks: data.ebooks ?? [] });
    } catch {
      return NextResponse.json({ ebooks: [] });
    }
  }

  if (type === "formations") {
    try {
      const raw = await readFile(FORMATIONS_FILE, "utf-8");
      const data = JSON.parse(raw);
      return NextResponse.json({ formations: data.formations ?? [] });
    } catch {
      return NextResponse.json({ formations: [] });
    }
  }

  // Si pas de type, retourner les deux
  try {
    const [ebRaw, fmRaw] = await Promise.allSettled([
      readFile(EBOOKS_FILE, "utf-8"),
      readFile(FORMATIONS_FILE, "utf-8"),
    ]);
    const ebooks = ebRaw.status === "fulfilled" ? (JSON.parse(ebRaw.value).ebooks ?? []) : [];
    const formations = fmRaw.status === "fulfilled" ? (JSON.parse(fmRaw.value).formations ?? []) : [];
    return NextResponse.json({ ebooks, formations });
  } catch {
    return NextResponse.json({ ebooks: [], formations: [] });
  }
}
