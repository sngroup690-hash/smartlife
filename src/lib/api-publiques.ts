const RELAIS = (process.env.NEXT_PUBLIC_RELAIS_URL || "https://relais.smartbookcm.com").replace(/\/$/, "");

export type NomAPI = "meteo" | "actualites" | "devises" | "pays" | "football" | "wikipedia" | "citations" | "emploi" | "voyage" | "blagues" | "image" | "remoteok";

export interface ImageGeneree { url: string; description: string; largeur: number; hauteur: number; modele: string; seed: number }

export async function genererImage(description: string, options?: { largeur?: number; hauteur?: number; modele?: "flux" | "turbo" }): Promise<ImageGeneree> {
  const r = await fetch(`${RELAIS}/image/generer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ description, ...options }),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((d as { erreur?: string }).erreur || "Génération d'image indisponible.");
  return d as ImageGeneree;
}

export interface InfoAPI { nom: string; description: string; parametres: Record<string, string> }

export async function apiPublique<T = unknown>(api: NomAPI, parametres?: Record<string, unknown>): Promise<T> {
  const r = await fetch(`${RELAIS}/saas/api`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ api, parametres: parametres || {} }),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((d as { erreur?: string }).erreur || "API indisponible.");
  return d as T;
}

export async function catalogueAPI(): Promise<Record<string, InfoAPI>> {
  return apiPublique("catalogue" as NomAPI);
}
