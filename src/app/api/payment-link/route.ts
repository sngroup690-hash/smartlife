import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { writeFile } from "fs/promises";
import type { PaymentLink } from "@/app/api/admin/payment-links/route";

const FILE = path.join(process.cwd(), "private", "payment-links.json");

async function readLinks(): Promise<PaymentLink[]> {
  try {
    const raw = await readFile(FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });

  const links = await readLinks();
  const link = links.find((l) => l.id === id);

  if (!link) return NextResponse.json({ error: "Lien introuvable" }, { status: 404 });
  if (!link.active) return NextResponse.json({ error: "Lien inactif" }, { status: 410 });

  // Incrémenter le compteur de clics
  link.clicks = (link.clicks || 0) + 1;
  const updated = links.map((l) => (l.id === id ? link : l));
  await writeFile(FILE, JSON.stringify(updated, null, 2), "utf-8").catch(() => {});

  return NextResponse.json({ link });
}
