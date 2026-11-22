import { readdir, readFile } from "fs/promises";
import path from "path";

// Relie un espace d'accompagnement à la photo d'activité du guide qui traite le même sujet
// (photos créées avec Agnes dans public/guides/<id du guide>-1.webp).
const MOTS_VIDES = new Set([
  "guide", "complet", "complete", "rentable", "pour", "afrique", "dans", "avec", "votre", "vous", "comment",
  "culture", "cultiver", "elevage", "ouvrir", "lancer", "gerer", "business", "fabrication", "fabriquer", "fabriquez",
  "produits", "produit", "activite", "boutique", "creer", "reussir", "pratique", "moderne", "propre", "commerce",
  "plus", "recettes", "devenez", "deviens", "votre", "notre", "leur", "comment", "lancez", "planteur", "entreprise",
]);

export function motsCles(texte: string): string[] {
  return texte
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter((m) => m.length > 3 && !MOTS_VIDES.has(m))
    .map((m) => m.replace(/s$/, ""));
}

let cache: { quand: number; guides: Array<{ mots: Set<string>; photo: string }> } | null = null;

async function guidesAvecPhoto() {
  if (cache && Date.now() - cache.quand < 10 * 60 * 1000) return cache.guides;
  const racine = process.cwd();
  let fichiers: string[] = [];
  try { fichiers = await readdir(path.join(racine, "public", "guides")); } catch { /* pas de photos */ }
  const photos = new Set(fichiers.filter((f) => f.endsWith("-1.webp")).map((f) => f.replace(/-1\.webp$/, "")));
  let ebooks: Array<{ id: string; title: string }> = [];
  try { ebooks = JSON.parse(await readFile(path.join(racine, "private", "ebooks-data.json"), "utf-8")).ebooks || []; } catch { /* rien */ }
  const guides = ebooks
    .filter((e) => photos.has(e.id))
    .map((e) => ({ mots: new Set(motsCles(e.title)), photo: `/guides/${e.id}-1.webp` }));
  cache = { quand: Date.now(), guides };
  return guides;
}

export async function photoPourEspace(titre: string): Promise<string | undefined> {
  const mots = motsCles(titre);
  if (mots.length === 0) return undefined;
  let meilleure: string | undefined;
  let score = 0;
  for (const g of await guidesAvecPhoto()) {
    const s = mots.filter((m) => g.mots.has(m)).length;
    if (s > score) { score = s; meilleure = g.photo; }
  }
  return score > 0 ? meilleure : undefined;
}
