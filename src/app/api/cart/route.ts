import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";

type SavedCart = {
  token: string;
  email?: string;
  items: unknown[];
  savedAt: string;
};

const CARTS_FILE = path.join(process.cwd(), "private", "saved-carts.json");

async function readCarts(): Promise<SavedCart[]> {
  try {
    const raw = await readFile(CARTS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeCarts(carts: SavedCart[]) {
  await mkdir(path.dirname(CARTS_FILE), { recursive: true });
  await writeFile(CARTS_FILE, JSON.stringify(carts, null, 2), "utf-8");
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ items: [] });
  const carts = await readCarts();
  const cart = carts.find((c) => c.token === token);
  return NextResponse.json({ items: cart?.items ?? [], savedAt: cart?.savedAt ?? null });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { token, items, email } = body as { token: string; items: unknown[]; email?: string };
  if (!token) return NextResponse.json({ error: "Token requis" }, { status: 400 });

  const carts = await readCarts();
  const idx = carts.findIndex((c) => c.token === token);
  const savedAt = new Date().toISOString();

  if (!items || items.length === 0) {
    const filtered = carts.filter((c) => c.token !== token);
    await writeCarts(filtered);
    return NextResponse.json({ success: true, savedAt: null });
  }

  const entry: SavedCart = { token, items, savedAt, ...(email ? { email } : {}) };
  if (idx !== -1) {
    carts[idx] = entry;
  } else {
    carts.push(entry);
    if (carts.length > 1000) carts.splice(0, carts.length - 1000);
  }
  await writeCarts(carts);

  return NextResponse.json({ success: true, savedAt });
}
