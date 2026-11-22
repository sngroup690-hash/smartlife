import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

const LEADS_FILE = path.join(process.cwd(), "private", "leads.json");
const RG_FILE = path.join(process.cwd(), "private", "ressources-gratuites.json");

type Lead = {
  id: string;
  ressourceId: string;
  ressourceTitre: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  createdAt: string;
};

async function readLeads(): Promise<Lead[]> {
  try {
    return JSON.parse(await readFile(LEADS_FILE, "utf-8")).leads ?? [];
  } catch { return []; }
}

async function writeLeads(leads: Lead[]) {
  await mkdir(path.dirname(LEADS_FILE), { recursive: true });
  await writeFile(LEADS_FILE, JSON.stringify({ leads }, null, 2), "utf-8");
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Corps invalide" }, { status: 400 });

  const { ressourceId, nom, prenom, email, telephone } = body;
  if (!ressourceId || !nom || !prenom || !email || !telephone) {
    return NextResponse.json({ error: "Tous les champs sont requis." }, { status: 400 });
  }

  // Récupérer la ressource
  let ressource: Record<string, unknown> | null = null;
  try {
    const data = JSON.parse(await readFile(RG_FILE, "utf-8"));
    ressource = (data.ressources ?? []).find(
      (r: Record<string, unknown>) => r.id === ressourceId && r.actif
    ) ?? null;
  } catch { /* introuvable */ }

  if (!ressource) {
    return NextResponse.json({ error: "Ressource introuvable ou inactive." }, { status: 404 });
  }

  // Enregistrer le lead
  const leads = await readLeads();
  const lead: Lead = {
    id: `lead-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    ressourceId,
    ressourceTitre: String(ressource.titre ?? ""),
    nom: String(nom).trim(),
    prenom: String(prenom).trim(),
    email: String(email).trim().toLowerCase(),
    telephone: String(telephone).trim(),
    createdAt: new Date().toISOString(),
  };
  leads.push(lead);
  await writeLeads(leads);

  // Retourner la ressource (sans champs sensibles inutiles)
  return NextResponse.json({ ok: true, ressource });
}
