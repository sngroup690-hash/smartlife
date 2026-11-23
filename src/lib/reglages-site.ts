import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";

// Réglages généraux du site, modifiables depuis l'administration.
// formationsActives : tant que c'est « false », les formations sont masquées partout
// (recommandations, recherche, catalogue, pages de formation, plan du site).
export const FICHIER_REGLAGES = path.join(process.cwd(), "private", "site-settings.json");

export interface ReglagesSite {
  formationsActives: boolean;
}

export const REGLAGES_PAR_DEFAUT: ReglagesSite = {
  formationsActives: false,
};

export async function lireReglagesSite(): Promise<ReglagesSite> {
  try {
    const brut = await readFile(FICHIER_REGLAGES, "utf-8");
    return { ...REGLAGES_PAR_DEFAUT, ...JSON.parse(brut) };
  } catch {
    return { ...REGLAGES_PAR_DEFAUT };
  }
}

export async function ecrireReglagesSite(modif: Partial<ReglagesSite>): Promise<ReglagesSite> {
  const actuel = await lireReglagesSite();
  const nouveau: ReglagesSite = { ...actuel };
  if (typeof modif.formationsActives === "boolean") nouveau.formationsActives = modif.formationsActives;
  await mkdir(path.dirname(FICHIER_REGLAGES), { recursive: true });
  await writeFile(FICHIER_REGLAGES, JSON.stringify(nouveau, null, 2), "utf-8");
  return nouveau;
}

export async function formationsActives(): Promise<boolean> {
  return (await lireReglagesSite()).formationsActives;
}
