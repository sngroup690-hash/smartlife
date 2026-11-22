import { readFile, writeFile } from "fs/promises";
import path from "path";
import { ebooks } from "./data";
import { FORMATIONS } from "./formations-data";

export type CrossSellMode = "auto" | "manual";

export type ManualAssoc = {
  id: string;
  type: "ebook" | "formation";
};

export type CrossSellProductConfig = {
  enabled?: boolean;
  mode?: CrossSellMode;
  manualIds?: ManualAssoc[];
};

export type CrossSellConfig = {
  enabled: boolean;
  postPurchaseEnabled: boolean;
  postPurchaseDiscount: number;
  defaultMode: CrossSellMode;
  products: Record<string, CrossSellProductConfig>;
};

export type RecommendedProduct = {
  id: string;
  type: "ebook" | "formation";
  title: string;
  price: number;
  originalPrice?: number;
  cover?: string;
  category?: string;
  slug?: string;
  discountedPrice?: number;
};

const CONFIG_PATH = path.join(process.cwd(), "private", "cross-sell-config.json");

export const DEFAULT_CROSS_SELL_CONFIG: CrossSellConfig = {
  enabled: true,
  postPurchaseEnabled: true,
  postPurchaseDiscount: 20,
  defaultMode: "auto",
  products: {},
};

export async function readCrossSellConfig(): Promise<CrossSellConfig> {
  try {
    const raw = await readFile(CONFIG_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_CROSS_SELL_CONFIG, ...parsed };
  } catch {
    return { ...DEFAULT_CROSS_SELL_CONFIG };
  }
}

export async function writeCrossSellConfig(cfg: CrossSellConfig): Promise<void> {
  await writeFile(CONFIG_PATH, JSON.stringify(cfg, null, 2), "utf-8");
}

// ── Internal helpers ───────────────────────────────────────────────────────────

type UserRow = { id: string; ebooksAchetes?: string[]; formationsAchetees?: string[] };
type EbookMin = { id: string; slug: string; title: string; price: number; originalPrice?: number; cover: string; category: string; bestseller?: boolean };
type FormationMin = { id: string; titre: string; prix: number; prixOriginal?: number; cover?: string; categorie: string; badge?: string };

async function readUsers(): Promise<UserRow[]> {
  try {
    const raw = await readFile(path.join(process.cwd(), "private", "users.json"), "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function getAllEbooks(): Promise<EbookMin[]> {
  const base: EbookMin[] = ebooks.map(e => ({
    id: e.id, slug: e.slug, title: e.title, price: e.price,
    originalPrice: e.originalPrice, cover: e.cover, category: e.category, bestseller: e.bestseller,
  }));
  try {
    const raw = await readFile(path.join(process.cwd(), "private", "ebooks-data.json"), "utf-8");
    const data = JSON.parse(raw);
    const actif: Record<string, boolean> = data.actif || {};
    const overrides: Record<string, Partial<EbookMin>> = data.overrides || {};
    const dynamic: EbookMin[] = (data.ebooks || []).filter(
      (e: EbookMin & { actif?: boolean; deletedAt?: string }) => e.actif !== false && !e.deletedAt
    );
    const dynamicIds = new Set(dynamic.map(e => e.id));
    const merged = base
      .filter(e => !dynamicIds.has(e.id) && actif[e.id] !== false)
      .map(e => ({ ...e, ...(overrides[e.id] || {}) }));
    return [...merged, ...dynamic.map(e => ({ ...e, ...(overrides[e.id] || {}) }))];
  } catch {
    return base;
  }
}

async function getAllFormations(): Promise<FormationMin[]> {
  const base: FormationMin[] = FORMATIONS.map(f => ({
    id: f.id, titre: f.titre, prix: f.prix, prixOriginal: f.prixOriginal,
    cover: (f as { cover?: string }).cover, categorie: f.categorie, badge: f.badge,
  }));
  try {
    const raw = await readFile(path.join(process.cwd(), "private", "formations-data.json"), "utf-8");
    const data = JSON.parse(raw);
    const dynamic: FormationMin[] = (data.formations || []).filter(
      (f: FormationMin & { actif?: boolean; deletedAt?: string }) => f.actif !== false && !f.deletedAt
    );
    const dynamicIds = new Set(dynamic.map(f => f.id));
    const merged = base.filter(f => !dynamicIds.has(f.id));
    return [...merged, ...dynamic];
  } catch {
    return base;
  }
}

function ebookToReco(eb: EbookMin, discountPercent?: number): RecommendedProduct {
  return {
    id: eb.id, type: "ebook", title: eb.title, price: eb.price,
    originalPrice: eb.originalPrice, cover: eb.cover, category: eb.category, slug: eb.slug,
    discountedPrice: discountPercent ? Math.round(eb.price * (1 - discountPercent / 100)) : undefined,
  };
}

function formationToReco(f: FormationMin, discountPercent?: number): RecommendedProduct {
  return {
    id: f.id, type: "formation", title: f.titre, price: f.prix,
    originalPrice: f.prixOriginal, cover: f.cover, category: f.categorie,
    discountedPrice: discountPercent ? Math.round(f.prix * (1 - discountPercent / 100)) : undefined,
  };
}

// ── Main recommendation function ───────────────────────────────────────────────

export async function getRecommendations(opts: {
  productId: string;
  productType: "ebook" | "formation";
  excludeIds?: string[];
  maxResults?: number;
  discountPercent?: number;
}): Promise<RecommendedProduct[]> {
  const { productId, productType, excludeIds = [], maxResults = 3, discountPercent } = opts;

  const cfg = await readCrossSellConfig();
  if (!cfg.enabled) return [];

  const productCfg = cfg.products[productId];
  if (productCfg?.enabled === false) return [];

  const excluded = new Set([productId, ...excludeIds]);
  const mode = productCfg?.mode ?? cfg.defaultMode;

  const [allEbooks, allFormations] = await Promise.all([getAllEbooks(), getAllFormations()]);

  // ── Mode Manuel ────────────────────────────────────────────────────────────
  if (mode === "manual" && productCfg?.manualIds?.length) {
    const results: RecommendedProduct[] = [];
    for (const assoc of productCfg.manualIds) {
      if (excluded.has(assoc.id)) continue;
      if (assoc.type === "ebook") {
        const eb = allEbooks.find(e => e.id === assoc.id);
        if (eb) results.push(ebookToReco(eb, discountPercent));
      } else {
        const fm = allFormations.find(f => f.id === assoc.id);
        if (fm) results.push(formationToReco(fm, discountPercent));
      }
      if (results.length >= maxResults) break;
    }
    if (results.length > 0) return results;
  }

  // ── Mode Auto : co-achats ──────────────────────────────────────────────────
  const users = await readUsers();
  const buyerIds = new Set(
    users
      .filter(u => productType === "ebook"
        ? u.ebooksAchetes?.includes(productId)
        : u.formationsAchetees?.includes(productId))
      .map(u => u.id)
  );

  if (buyerIds.size > 0) {
    const counts: Record<string, { type: "ebook" | "formation"; count: number }> = {};
    for (const u of users) {
      if (!buyerIds.has(u.id)) continue;
      for (const id of u.ebooksAchetes || []) {
        if (!excluded.has(id)) { counts[id] ??= { type: "ebook", count: 0 }; counts[id].count++; }
      }
      for (const id of u.formationsAchetees || []) {
        if (!excluded.has(id)) { counts[id] ??= { type: "formation", count: 0 }; counts[id].count++; }
      }
    }
    const sorted = Object.entries(counts).sort((a, b) => b[1].count - a[1].count).slice(0, maxResults);
    const autoResults: RecommendedProduct[] = [];
    for (const [id, { type }] of sorted) {
      if (type === "ebook") {
        const eb = allEbooks.find(e => e.id === id);
        if (eb) autoResults.push(ebookToReco(eb, discountPercent));
      } else {
        const fm = allFormations.find(f => f.id === id);
        if (fm) autoResults.push(formationToReco(fm, discountPercent));
      }
    }
    if (autoResults.length > 0) return autoResults;
  }

  // ── Fallback : Bestsellers même catégorie ──────────────────────────────────
  const currentCategory = productType === "ebook"
    ? allEbooks.find(e => e.id === productId)?.category
    : allFormations.find(f => f.id === productId)?.categorie;

  const fallback: RecommendedProduct[] = [];

  if (productType === "ebook") {
    const pool = allEbooks.filter(e => !excluded.has(e.id) && e.category === currentCategory);
    const best = pool.filter(e => e.bestseller);
    const source = best.length > 0 ? best : pool;
    fallback.push(...source.slice(0, maxResults).map(e => ebookToReco(e, discountPercent)));
  } else {
    const pool = allFormations.filter(f => !excluded.has(f.id) && f.categorie === currentCategory);
    const best = pool.filter(f => f.badge === "Bestseller");
    const source = best.length > 0 ? best : pool;
    fallback.push(...source.slice(0, maxResults).map(f => formationToReco(f, discountPercent)));
  }

  // Compléter avec l'autre type si besoin
  if (fallback.length < maxResults) {
    const needed = maxResults - fallback.length;
    if (productType === "ebook") {
      const cross = allFormations.filter(f => !excluded.has(f.id));
      const best = cross.filter(f => f.badge === "Bestseller");
      const source = best.length > 0 ? best : cross;
      fallback.push(...source.slice(0, needed).map(f => formationToReco(f, discountPercent)));
    } else {
      const cross = allEbooks.filter(e => !excluded.has(e.id));
      const best = cross.filter(e => e.bestseller);
      const source = best.length > 0 ? best : cross;
      fallback.push(...source.slice(0, needed).map(e => ebookToReco(e, discountPercent)));
    }
  }

  return fallback.slice(0, maxResults);
}
