import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const FILE = path.join(process.cwd(), "private", "leads.json");

export type Lead = {
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
    return JSON.parse(await readFile(FILE, "utf-8")).leads ?? [];
  } catch { return []; }
}

function auth(req: NextRequest) {
  return req.nextUrl.searchParams.get("password") === ADMIN_PASSWORD;
}

export async function GET(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const leads = await readLeads();
  const ressourceId = req.nextUrl.searchParams.get("ressourceId");
  const filtered = ressourceId ? leads.filter((l) => l.ressourceId === ressourceId) : leads;

  if (req.nextUrl.searchParams.get("export") === "csv") {
    const header = "ID,Ressource,Nom,Prénom,Email,Téléphone,Date";
    const rows = filtered.map((l) =>
      [l.id, `"${l.ressourceTitre}"`, `"${l.nom}"`, `"${l.prenom}"`, l.email, l.telephone, l.createdAt].join(",")
    );
    const csv = [header, ...rows].join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="leads-${Date.now()}.csv"`,
      },
    });
  }

  return NextResponse.json({ leads: filtered, total: filtered.length });
}
