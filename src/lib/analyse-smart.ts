import { readdir, readFile } from "fs/promises";
import path from "path";

export type Source = { nom: string; url: string; date: string };
export type Fait = { fait: string; source: Source };
export type Opportunite = {
  id: string;
  titre: string;
  secteur: string;
  pourquoiMaintenant: Fait[];
  ceQuiAMarche: string;
  risques: string[];
  pourQui: string;
  investissement: "faible" | "moyen" | "élevé" | string;
  guidesLies: string[];
};
export type AnalysePays = {
  pays: string;
  drapeau: string;
  edition: string;
  miseAJour: string;
  resume: string;
  contexte: Fait[];
  signalTerrain: string;
  opportunites: Opportunite[];
  methode: string;
  sources: Source[];
};

const DOSSIER = path.join(process.cwd(), "src", "content", "analyse-smart");

export async function toutesLesAnalyses(): Promise<AnalysePays[]> {
  let fichiers: string[] = [];
  try { fichiers = (await readdir(DOSSIER)).filter((f) => f.endsWith(".json")); } catch { return []; }
  const lues = await Promise.all(fichiers.map(async (f) => {
    try { return JSON.parse((await readFile(path.join(DOSSIER, f), "utf-8")).replace(/^﻿/, "")) as AnalysePays; } catch { return null; }
  }));
  return lues.filter((a): a is AnalysePays => !!a && !!a.pays);
}

/** Pays annoncés pour les prochaines éditions (affichés « bientôt »). */
export const PAYS_A_VENIR = [
  { pays: "Bénin", drapeau: "🇧🇯" },
  { pays: "Togo", drapeau: "🇹🇬" },
  { pays: "Côte d'Ivoire", drapeau: "🇨🇮" },
  { pays: "Gabon", drapeau: "🇬🇦" },
  { pays: "Sénégal", drapeau: "🇸🇳" },
];
