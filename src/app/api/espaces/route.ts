import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { espaces as STATIC_ESPACES } from "@/lib/accompagnement-data";

export const dynamic = "force-dynamic";

const ESPACES_FILE = path.join(process.cwd(), "private", "espaces.json");

const STATIC_DEFAULTS = STATIC_ESPACES.map((e) => ({
  id: e.id,
  titre: e.titre,
  domaine: e.categorie,
  descriptionCourte: e.description,
  descriptionLongue: e.descriptionLongue,
  avantages: e.avantages,
  inclus: e.etapes,
  clientsSatisfaits: 0,
  placesDisponibles: e.places,
  espacesSimilaires: [],
  actif: true,
  createdAt: "2025-01-01T00:00:00.000Z",
  image: e.image,
}));

export async function GET() {
  try {
    const raw = await readFile(ESPACES_FILE, "utf-8");
    const espaces = JSON.parse(raw);
    if (Array.isArray(espaces) && espaces.length > 0) {
      return NextResponse.json({ espaces });
    }
  } catch { /* file missing or unreadable */ }

  return NextResponse.json({ espaces: STATIC_DEFAULTS });
}
