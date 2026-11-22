import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import { isValidAdminPassword } from "@/lib/admin-auth";
import { ebooks as staticEbooks } from "@/lib/data";

const FILE = path.join(process.cwd(), "private", "motivations.json");

export type ServerMotivation = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  ebookIds: string[];
  productNames: string[];
  objectif: string;
  situation: string;
  texte: string;
  interetAccompagnement: string;
  date: string;
  lu: boolean;
};

async function readMotivations(): Promise<ServerMotivation[]> {
  try {
    const raw = await readFile(FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeMotivations(data: ServerMotivation[]) {
  await mkdir(path.dirname(FILE), { recursive: true });
  await writeFile(FILE, JSON.stringify(data, null, 2), "utf-8");
}

// POST — soumission publique depuis la page succès
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Données invalides" }, { status: 400 });

  const entry: ServerMotivation = {
    id: crypto.randomUUID(),
    userId: body.userId ?? "",
    userName: body.userName ?? "Anonyme",
    userEmail: body.userEmail ?? "",
    userPhone: body.userPhone ?? "",
    ebookIds: Array.isArray(body.ebookIds) ? body.ebookIds : [],
    productNames: Array.isArray(body.productNames) ? body.productNames : [],
    objectif: body.objectif ?? "",
    situation: body.situation ?? "",
    texte: body.texte ?? "",
    interetAccompagnement: body.interetAccompagnement ?? "",
    date: new Date().toISOString(),
    lu: false,
  };

  const all = await readMotivations();
  all.push(entry);
  // Garder les 2000 dernières entrées max
  await writeMotivations(all.slice(-2000));

  return NextResponse.json({ success: true });
}

async function buildProductLookup(): Promise<Record<string, string>> {
  const lookup: Record<string, string> = {};
  for (const e of staticEbooks) lookup[e.id] = e.title;
  try {
    const raw = await readFile(path.join(process.cwd(), "private", "ebooks-data.json"), "utf-8");
    const data = JSON.parse(raw) as { ebooks?: { id: string; title: string }[] };
    for (const e of data.ebooks ?? []) if (e.id && e.title) lookup[e.id] = e.title;
  } catch { /* ignore */ }
  try {
    const raw = await readFile(path.join(process.cwd(), "private", "formations-data.json"), "utf-8");
    const data = JSON.parse(raw) as { formations?: { id: string; titre: string }[] };
    for (const f of data.formations ?? []) if (f.id && f.titre) lookup[f.id] = f.titre;
  } catch { /* ignore */ }
  return lookup;
}

type PhoneLookup = { byId: Record<string, string>; byEmail: Record<string, string> };

async function buildPhoneLookup(): Promise<PhoneLookup> {
  try {
    const raw = await readFile(path.join(process.cwd(), "private", "users.json"), "utf-8");
    const users = JSON.parse(raw) as { id?: string; email?: string; phone?: string }[];
    const byId: Record<string, string> = {};
    const byEmail: Record<string, string> = {};
    for (const u of users) {
      if (!u.phone) continue;
      if (u.id) byId[u.id] = u.phone;
      if (u.email) byEmail[u.email.toLowerCase()] = u.phone;
    }
    return { byId, byEmail };
  } catch { return { byId: {}, byEmail: {} }; }
}

// GET — lecture admin uniquement
export async function GET(req: NextRequest) {
  const pwd = req.headers.get("x-admin-password");
  if (!isValidAdminPassword(pwd)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const motivations = await readMotivations();

  const [productLookup, phoneLookup] = await Promise.all([
    buildProductLookup(),
    buildPhoneLookup(),
  ]);

  const enriched = motivations.map((m) => {
    // Toujours résoudre les noms depuis les IDs (corrige les IDs stockés à la place des titres)
    const resolved = (m.ebookIds ?? []).map((id) => productLookup[id]).filter(Boolean) as string[];
    const productNames = resolved.length > 0 ? resolved : m.productNames;
    // Enrichir le téléphone : données stockées → lookup par userId → lookup par email
    const userPhone = m.userPhone
      || (m.userId ? phoneLookup.byId[m.userId] ?? "" : "")
      || (m.userEmail ? phoneLookup.byEmail[m.userEmail.toLowerCase()] ?? "" : "");
    return { ...m, productNames, userPhone };
  });

  const reversed = enriched.reverse();
  const unreadCount = reversed.filter((m) => !m.lu).length;
  return NextResponse.json({ motivations: reversed, unreadCount });
}

// PATCH — marquer lu / non lu (admin)
export async function PATCH(req: NextRequest) {
  const pwd = req.headers.get("x-admin-password");
  if (!isValidAdminPassword(pwd)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  if (!body?.id) return NextResponse.json({ error: "id requis" }, { status: 400 });

  const all = await readMotivations();
  const idx = all.findIndex((m) => m.id === body.id);
  if (idx === -1) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  all[idx] = { ...all[idx], lu: body.lu ?? true };
  await writeMotivations(all);
  return NextResponse.json({ success: true });
}
