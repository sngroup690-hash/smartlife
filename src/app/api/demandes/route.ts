import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import { enregistrerAccompagnement } from "@/lib/smart-crm";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const FILE = path.join(process.cwd(), "private", "demandes.json");

async function readAll(): Promise<Record<string, unknown>[]> {
  try {
    const raw = await readFile(FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeAll(data: unknown[]) {
  await mkdir(path.dirname(FILE), { recursive: true });
  await writeFile(FILE, JSON.stringify(data, null, 2), "utf-8");
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { client, espaceId, espaceSlug, espaceTitre, message, consultantId, consultantPrenom } = body;

  if (!client?.nom || !client?.email || !espaceId || !espaceTitre || !message) {
    return NextResponse.json({ error: "Champs requis manquants." }, { status: 400 });
  }

  const all = await readAll();
  const now = new Date().toISOString();
  const entry: Record<string, unknown> = {
    id: crypto.randomUUID(),
    client: {
      nom: client.nom?.trim(),
      email: client.email?.trim().toLowerCase(),
      telephone: client.telephone?.trim() || "",
      ville: client.ville?.trim() || "",
      profession: client.profession?.trim() || "",
      capital: client.capital?.trim() || "",
      motivation: client.motivation?.trim() || "",
    },
    espaceId,
    espaceSlug: espaceSlug ?? espaceId,
    espaceTitre,
    message: message.trim(),
    statut: "en_attente",
    noteAdmin: "",
    createdAt: now,
    updatedAt: now,
  };
  if (consultantId) entry.consultantId = String(consultantId);
  if (consultantPrenom) entry.consultantPrenom = String(consultantPrenom);

  all.push(entry);
  await writeAll(all);

  // Smart CRM — fiche contact + contact du téléphone
  enregistrerAccompagnement({
    email: client.email.trim().toLowerCase(),
    nom: client.nom.trim(),
    telephone: client.telephone?.trim() || null,
    espaceTitre: espaceTitre,
  }).catch(() => {});

  return NextResponse.json({ success: true, id: entry.id });
}

export async function GET(req: NextRequest) {
  const pwd = req.nextUrl.searchParams.get("password");
  if (pwd !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  const all = await readAll();
  return NextResponse.json({ demandes: all });
}

export async function PATCH(req: NextRequest) {
  const pwd = req.nextUrl.searchParams.get("password");
  const id = req.nextUrl.searchParams.get("id");
  if (pwd !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  if (!id) {
    return NextResponse.json({ error: "ID requis." }, { status: 400 });
  }

  const { statut, noteAdmin } = await req.json();
  const all = await readAll();
  const idx = all.findIndex((d) => d.id === id);
  if (idx === -1) {
    return NextResponse.json({ error: "Demande introuvable." }, { status: 404 });
  }

  all[idx] = { ...all[idx], statut, noteAdmin, updatedAt: new Date().toISOString() };
  await writeAll(all);

  return NextResponse.json({ success: true, demande: all[idx] });
}
