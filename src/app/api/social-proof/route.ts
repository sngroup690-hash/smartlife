import { NextResponse } from "next/server";
import { readSPConfig, readSPConfig as readConfig } from "@/app/api/admin/social-proof/route";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";

const ACTIVITIES_FILE = path.join(process.cwd(), "private", "recent-activities.json");

export type RecentActivity = {
  id: string;
  type: "purchase" | "download" | "checkout" | "accompagnement";
  prenom: string;
  ville: string;
  produit: string;
  createdAt: string;
};

export async function readRecentActivities(): Promise<RecentActivity[]> {
  try {
    const raw = await readFile(ACTIVITIES_FILE, "utf-8");
    const all: RecentActivity[] = JSON.parse(raw);
    // Garder seulement les 50 dernières activités (max 7 jours)
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return all.filter((a) => new Date(a.createdAt).getTime() > cutoff).slice(-50);
  } catch {
    return [];
  }
}

export async function appendRecentActivity(activity: Omit<RecentActivity, "id" | "createdAt">) {
  const all = await readRecentActivities();
  const newEntry: RecentActivity = {
    ...activity,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  all.push(newEntry);
  // Garder les 100 dernières
  const trimmed = all.slice(-100);
  await mkdir(path.dirname(ACTIVITIES_FILE), { recursive: true });
  await writeFile(ACTIVITIES_FILE, JSON.stringify(trimmed, null, 2));
  return newEntry;
}

const PRENOMS = [
  "Marie", "Jean-Paul", "Sandrine", "Patrick", "Nathalie", "Didier", "Estelle", "Thierry", "Aïcha", "Franck",
  "Carine", "Ibrahim", "Isabelle", "Daniel", "Christelle", "Serge", "Mireille", "Hervé", "Fatou", "Moussa",
  "Brice", "Larissa", "Arnaud", "Grâce", "Cédric", "Prisca", "Joël", "Linda", "Yannick", "Raïssa",
  "Rodrigue", "Clarisse", "Aboubakar", "Mariam", "Landry", "Sylvie", "Junior", "Vanessa", "Olivier", "Bintou",
  "Steve", "Josiane", "Kevin", "Awa", "Rostand", "Murielle", "Alain", "Nadège", "Samuel", "Fanta",
  "Wilfried", "Hortense", "Boris", "Ruth", "Emmanuel", "Adjoua", "Kofi", "Amina", "Paul", "Esther",
];
const VILLES = [
  "Douala", "Yaoundé", "Bafoussam", "Garoua", "Bamenda", "Kribi", "Limbé", "Ngaoundéré",
  "Abidjan", "Bouaké", "Dakar", "Thiès", "Lomé", "Cotonou", "Porto-Novo", "Libreville", "Port-Gentil",
  "Brazzaville", "Pointe-Noire", "Kinshasa", "Lubumbashi", "Goma", "Bamako", "Ouagadougou", "Niamey",
  "Conakry", "N'Djamena", "Bangui", "Malabo", "Kigali", "Bujumbura",
  "Paris", "Lyon", "Bruxelles", "Londres", "Montréal", "Genève", "Berlin",
];

// Graine fixe par jour : la même liste toute la journée, une nouvelle chaque jour.
function hasard(graine: number) {
  let s = graine >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function joliTitre(titre: string): string {
  const t = titre
    .replace(/[:—–-]\s*(le\s+)?guide\s+(complet|pratique).*$/i, "")
    .replace(/^(le\s+)?guide\s+(complet|pratique|ultime)?\s*(de|du|des|pour|:)?\s*/i, "")
    .replace(/^[:—–\s-]+/, "")
    .replace(/\s+(le\s+)?guide\s+(complet|pratique)\s*$/i, "")
    .trim()
    .toLowerCase();
  const court = t.length > 42 ? t.slice(0, 40).trimEnd() + "…" : t;
  return "Guide " + court;
}

let cacheJour = { jour: "", notifs: [] as Array<{ id: string; type: RecentActivity["type"]; prenom: string; ville: string; produit: string }> };

async function notifsDuJour() {
  const jour = new Date().toISOString().slice(0, 10);
  if (cacheJour.jour === jour) return cacheJour.notifs;
  let titres: string[] = [];
  try {
    const d = JSON.parse(await readFile(path.join(process.cwd(), "private", "ebooks-data.json"), "utf-8"));
    titres = (d.ebooks || []).filter((e: { actif?: boolean; deletedAt?: string }) => e.actif !== false && !e.deletedAt).map((e: { title: string }) => joliTitre(e.title));
  } catch { /* liste vide : on garde les notifications de la configuration */ }
  if (titres.length === 0) return [];
  const r = hasard(Number(jour.replace(/-/g, "")));
  const pick = <T,>(l: T[]) => l[Math.floor(r() * l.length)];
  const notifs = Array.from({ length: 200 }, (_, i) => {
    const x = r();
    const type: RecentActivity["type"] = x < 0.1 ? "accompagnement" : x < 0.15 ? "checkout" : "purchase";
    return {
      id: `j${jour}-${i}`,
      type,
      prenom: pick(PRENOMS),
      ville: pick(VILLES),
      produit: type === "accompagnement" ? "Programme d'accompagnement" : pick(titres),
    };
  });
  cacheJour = { jour, notifs };
  return notifs;
}

export async function GET() {
  const config = await readConfig();

  // Décrémenter FOMO si nécessaire
  if (config.fomoEnabled && config.fomoDecreasing && config.fomoCurrentCount > 0) {
    const lastDecreased = new Date(config.fomoLastDecreased).getTime();
    const intervalMs = config.fomoDecreaseIntervalMin * 60 * 1000;
    const now = Date.now();
    if (now - lastDecreased >= intervalMs) {
      const steps = Math.floor((now - lastDecreased) / intervalMs);
      const newCount = Math.max(0, config.fomoCurrentCount - steps);
      if (newCount !== config.fomoCurrentCount) {
        // Mettre à jour silencieusement
        const { writeFile: wf, mkdir: md } = await import("fs/promises");
        const filePath = path.join(process.cwd(), "private", "social-proof.json");
        const updated = { ...config, fomoCurrentCount: newCount, fomoLastDecreased: new Date().toISOString() };
        await md(path.dirname(filePath), { recursive: true });
        await wf(filePath, JSON.stringify(updated, null, 2));
        config.fomoCurrentCount = newCount;
        config.fomoLastDecreased = updated.fomoLastDecreased;
      }
    }
  }

  const recentActivities = config.mode !== "fake" ? await readRecentActivities() : [];
  const fakeNotifs = config.mode !== "real" ? [...config.fakeNotifs, ...(await notifsDuJour())] : config.fakeNotifs;

  return NextResponse.json({
    config: {
      enabled: config.enabled,
      position: config.position,
      delayBetween: config.delayBetween,
      displayDuration: config.displayDuration,
      mobileEnabled: config.mobileEnabled,
      mode: config.mode,
      fakeNotifs,
      fomoEnabled: config.fomoEnabled,
      fomoMessage: config.fomoMessage,
      fomoCurrentCount: config.fomoCurrentCount,
    },
    recentActivities,
  });
}
