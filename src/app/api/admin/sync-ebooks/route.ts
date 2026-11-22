import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import { isValidAdminPassword } from "@/lib/admin-auth";

const FILE = path.join(process.cwd(), "private", "ebooks-data.json");

export async function GET(req: NextRequest) {
  const pwd = req.headers.get("x-admin-password");
  if (!isValidAdminPassword(pwd)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  try {
    const raw = await readFile(FILE, "utf-8");
    return NextResponse.json(JSON.parse(raw));
  } catch {
    return NextResponse.json({ ebooks: [], overrides: {}, actif: {} });
  }
}

export async function POST(req: NextRequest) {
  const pwd = req.headers.get("x-admin-password");
  if (!isValidAdminPassword(pwd)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Données manquantes" }, { status: 400 });

  // Strip deletedAt from all ebooks and formations before persisting.
  // Soft-delete is local-only; only permanent deletion (absent from array) removes from server.
  if (Array.isArray(body.ebooks)) {
    body.ebooks = body.ebooks.map((e: Record<string, unknown>) => {
      const { deletedAt: _, ...rest } = e;
      return rest;
    });
  }
  if (Array.isArray(body.formations)) {
    body.formations = body.formations.map((f: Record<string, unknown>) => {
      const { deletedAt: _, ...rest } = f;
      return rest;
    });
  }

  await mkdir(path.dirname(FILE), { recursive: true });
  await writeFile(FILE, JSON.stringify(body, null, 2), "utf-8");
  return NextResponse.json({ success: true });
}
