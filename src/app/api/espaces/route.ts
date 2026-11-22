import { NextResponse } from "next/server";
import { readFile, readdir } from "fs/promises";
import path from "path";
import { photoPourEspace } from "@/lib/photo-espace";
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

// Visuel d'un espace : sa photo Agnes (public/espaces/<id>.webp), sinon la photo du guide du même sujet.
async function avecVisuel<T extends { id: string; titre: string }>(espaces: T[]) {
  let fichiers = new Set<string>();
  try { fichiers = new Set(await readdir(path.join(process.cwd(), "public", "espaces"))); } catch { /* aucun */ }
  return Promise.all(espaces.map(async (e) => {
    const nom = `${String(e.id).replace(/[^a-zA-Z0-9_-]/g, "_")}.webp`;
    const visuel = fichiers.has(nom) ? `/espaces/${nom}` : await photoPourEspace(e.titre);
    return visuel ? { ...e, visuel } : e;
  }));
}

export async function GET() {
  try {
    const raw = await readFile(ESPACES_FILE, "utf-8");
    const espaces = JSON.parse(raw);
    if (Array.isArray(espaces) && espaces.length > 0) {
      return NextResponse.json({ espaces: await avecVisuel(espaces) });
    }
  } catch { /* file missing or unreadable */ }

  return NextResponse.json({ espaces: await avecVisuel(STATIC_DEFAULTS) });
}
