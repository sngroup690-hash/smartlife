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

  return NextResponse.json({
    config: {
      enabled: config.enabled,
      position: config.position,
      delayBetween: config.delayBetween,
      displayDuration: config.displayDuration,
      mobileEnabled: config.mobileEnabled,
      mode: config.mode,
      fakeNotifs: config.fakeNotifs,
      fomoEnabled: config.fomoEnabled,
      fomoMessage: config.fomoMessage,
      fomoCurrentCount: config.fomoCurrentCount,
    },
    recentActivities,
  });
}
