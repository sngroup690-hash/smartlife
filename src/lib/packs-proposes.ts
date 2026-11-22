import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";
import proposes from "@/data/packs-proposes.json";

const FILE = path.join(process.cwd(), "private", "packs-data.json");

type Fichier = { packs?: Array<Record<string, unknown> & { slug?: string }>; packsProposesImportes?: boolean };

// Ajoute une seule fois les 25 packs proposés au fichier des packs du serveur.
// Ensuite l'admin garde la main : un pack supprimé ou modifié n'est jamais remis.
export async function assurerPacksProposes(): Promise<number> {
  let donnees: Fichier = {};
  try { donnees = JSON.parse(await readFile(FILE, "utf-8")); } catch { /* fichier pas encore créé */ }
  if (donnees.packsProposesImportes) return 0;
  const packs = donnees.packs ?? [];
  const existants = new Set(packs.map((p) => p.slug));
  const maintenant = new Date().toISOString();
  const nouveaux = proposes
    .filter((p) => !existants.has(p.slug))
    .map((p, i) => ({ ...p, id: `pack-${crypto.randomUUID().slice(0, 8)}`, ordre: packs.length + i + 1, createdAt: maintenant, updatedAt: maintenant }));
  await mkdir(path.dirname(FILE), { recursive: true });
  await writeFile(FILE, JSON.stringify({ ...donnees, packs: [...packs, ...nouveaux], packsProposesImportes: true }, null, 2));
  return nouveaux.length;
}
