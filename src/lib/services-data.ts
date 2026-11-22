import { readFile } from "fs/promises";
import path from "path";

export type DynamicServicePackage = {
  name: string;
  price: number;
  features: string[];
  popular?: boolean;
  deliveryTime: string;
};

export type DynamicService = {
  id: string;
  slug: string;
  title: string;
  description: string;
  longDescription: string;
  icon: string;
  imageUrl?: string;
  startingPrice: number;
  deliveryTime: string;
  features: string[];
  packages: DynamicServicePackage[];
  enabled: boolean;
  createdAt: string;
  briefLabel?: string;
  videoUrl?: string;
};

const FILE = path.join(process.cwd(), "private", "services-data.json");

export async function readDynamicServices(): Promise<DynamicService[]> {
  try {
    const raw = await readFile(FILE, "utf-8");
    return JSON.parse(raw) as DynamicService[];
  } catch { return []; }
}

export async function getEnabledDynamicServices(): Promise<DynamicService[]> {
  const all = await readDynamicServices();
  return all.filter((s) => s.enabled);
}
