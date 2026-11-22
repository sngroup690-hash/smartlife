import { readdir, readFile, access } from "fs/promises";
import path from "path";
import { motsCles } from "@/lib/photo-espace";

export type Conseil = {
  slug: string;
  guideId: string;
  titre: string;
  description: string;
  chapeau: string;
  sections: Array<{ titre: string; paragraphes: string[]; liste?: string[] }>;
  erreurs: string[];
  faq: Array<{ q: string; a: string }>;
  motsCles: string[];
};

export type GuideLie = { id: string; slug: string; title: string; price: number; originalPrice?: number; cover?: string; ventes?: number; category?: string };

const DOSSIER = path.join(process.cwd(), "src", "content", "conseils");

export async function tousLesConseils(): Promise<Conseil[]> {
  let fichiers: string[] = [];
  try { fichiers = (await readdir(DOSSIER)).filter((f) => f.endsWith(".json")); } catch { return []; }
  const lus = await Promise.all(fichiers.map(async (f) => {
    try { return JSON.parse((await readFile(path.join(DOSSIER, f), "utf-8")).replace(/^﻿/, "")) as Conseil; } catch { return null; }
  }));
  return lus.filter((c): c is Conseil => !!c && !!c.slug && !!c.titre);
}

export async function conseilParSlug(slug: string): Promise<Conseil | null> {
  return (await tousLesConseils()).find((c) => c.slug === slug) ?? null;
}

async function guides(): Promise<GuideLie[]> {
  try {
    const d = JSON.parse(await readFile(path.join(process.cwd(), "private", "ebooks-data.json"), "utf-8"));
    return (d.ebooks || []).filter((e: { actif?: boolean; deletedAt?: string }) => e.actif !== false && !e.deletedAt);
  } catch { return []; }
}

export async function guideLie(guideId: string): Promise<GuideLie | null> {
  return (await guides()).find((g) => g.id === guideId) ?? null;
}

/** Article conseil associé à un guide (pour le lien depuis la page du guide). */
export async function conseilDuGuide(guideId: string): Promise<{ slug: string; titre: string } | null> {
  const c = (await tousLesConseils()).find((x) => x.guideId === guideId);
  return c ? { slug: c.slug, titre: c.titre } : null;
}

const existe = async (relatif: string) => {
  try { await access(path.join(process.cwd(), "public", relatif)); return true; } catch { return false; }
};

/** Photo d'illustration : une vraie photo d'activité (du guide, sinon de l'espace du même sujet) ; l'affiche du guide en dernier recours. */
export async function photoDuConseil(guideId: string, couverture?: string, titre?: string): Promise<string | null> {
  if (await existe(`guides/${guideId}-1.webp`)) return `/guides/${guideId}-1.webp`;
  if (titre) {
    const espace = await espaceDuSujet(titre);
    if (espace) {
      const nom = `espaces/${String(espace.id).replace(/[^a-zA-Z0-9_-]/g, "_")}.webp`;
      if (await existe(nom)) return `/${nom}`;
    }
    const { photoPourEspace } = await import("@/lib/photo-espace");
    const photo = await photoPourEspace(titre);
    if (photo) return photo;
  }
  return couverture ?? null;
}

/** Espace d'accompagnement qui traite le même sujet (même logique que les photos des espaces). */
export async function espaceDuSujet(titre: string): Promise<{ id: string; titre: string } | null> {
  const mots = motsCles(titre);
  if (mots.length === 0) return null;
  let espaces: Array<{ id: string; titre: string; actif?: boolean }> = [];
  try { espaces = JSON.parse(await readFile(path.join(process.cwd(), "private", "espaces.json"), "utf-8")); } catch { return null; }
  let meilleur: { id: string; titre: string } | null = null;
  let score = 0;
  for (const e of espaces.filter((x) => x.actif !== false)) {
    const m = new Set(motsCles(e.titre));
    const s = mots.filter((x) => m.has(x)).length;
    if (s > score) { score = s; meilleur = { id: e.id, titre: e.titre.normalize("NFKC") }; }
  }
  return score > 0 ? meilleur : null;
}
