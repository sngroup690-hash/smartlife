import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import { createHash } from "crypto";

const CACHE_FILE = path.join(process.cwd(), "private", "analytics", "geo-cache.json");
const TTL = 7 * 24 * 60 * 60 * 1000;

type Entry = { country: string; countryCode: string; city: string; ts: number };
type Cache = Record<string, Entry>;

let mem: Cache = {};
let loaded = false;

async function load() {
  if (loaded) return;
  try { mem = JSON.parse(await readFile(CACHE_FILE, "utf-8")); } catch { mem = {}; }
  loaded = true;
}

async function save() {
  try {
    await mkdir(path.dirname(CACHE_FILE), { recursive: true });
    const now = Date.now();
    const clean: Cache = {};
    for (const [k, v] of Object.entries(mem)) {
      if (now - v.ts < TTL * 2) clean[k] = v;
    }
    mem = clean;
    await writeFile(CACHE_FILE, JSON.stringify(mem), "utf-8");
  } catch { /* non-critique */ }
}

function key(ip: string) {
  return createHash("sha256").update(ip).digest("hex").slice(0, 20);
}

function isPrivateIp(ip: string): boolean {
  return ip === "::1" ||
    ip.startsWith("127.") || ip.startsWith("192.168.") ||
    ip.startsWith("10.") || /^172\.(1[6-9]|2\d|3[01])\./.test(ip);
}

/**
 * Extrait l'IP réelle du client depuis les headers HTTP.
 * Ordre de priorité : CF-Connecting-IP > X-Forwarded-For > X-Real-IP > X-Client-IP
 */
export function extractClientIp(headers: Headers, fallbackIp?: string | null): string {
  if (fallbackIp && fallbackIp !== "unknown" && !isPrivateIp(fallbackIp)) return fallbackIp;

  const cfIp = headers.get("cf-connecting-ip");
  if (cfIp && cfIp !== "unknown") return cfIp.trim();

  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const ips = forwarded.split(",").map(s => s.trim());
    const pub = ips.find(i => i && !isPrivateIp(i));
    if (pub) return pub;
  }

  const realIp = headers.get("x-real-ip") || headers.get("x-client-ip");
  if (realIp && realIp !== "unknown" && !isPrivateIp(realIp)) return realIp;

  return "unknown";
}

type GeoResult = { country: string; countryCode: string; city: string };
const UNKNOWN: GeoResult = { country: "Inconnu", countryCode: "??", city: "Inconnu" };

// ── Fournisseur 1 : ip-api.com (HTTP, 45 req/min, le plus fiable) ─────────
async function tryIpApi(ip: string): Promise<GeoResult | null> {
  try {
    const res = await fetch(
      `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,country,countryCode,city&lang=fr`,
      { signal: AbortSignal.timeout(5000) }
    );
    const d = await res.json() as { status?: string; country?: string; countryCode?: string; city?: string };
    if (d.status === "success" && d.country) {
      return {
        country: d.country,
        countryCode: d.countryCode || "??",
        city: d.city || d.country,
      };
    }
  } catch { /* timeout ou réseau */ }
  return null;
}

// ── Fournisseur 2 : ipwho.is (HTTPS, sans limite stricte) ────────────────
async function tryIpWhoIs(ip: string): Promise<GeoResult | null> {
  try {
    const res = await fetch(
      `https://ipwho.is/${encodeURIComponent(ip)}`,
      { signal: AbortSignal.timeout(6000) }
    );
    const d = await res.json() as { success?: boolean; country?: string; country_code?: string; city?: string; region?: string };
    if (d.success && d.country) {
      return {
        country: d.country,
        countryCode: d.country_code || "??",
        city: d.city || d.region || d.country,
      };
    }
  } catch { /* timeout ou réseau */ }
  return null;
}

// ── Fournisseur 3 : ipapi.co (HTTPS, 1000 req/jour gratuit) ──────────────
async function tryIpApiCo(ip: string): Promise<GeoResult | null> {
  try {
    const res = await fetch(
      `https://ipapi.co/${encodeURIComponent(ip)}/json/`,
      { signal: AbortSignal.timeout(6000) }
    );
    const d = await res.json() as { country_name?: string; country_code?: string; city?: string; error?: boolean };
    if (!d.error && d.country_name) {
      return {
        country: d.country_name,
        countryCode: d.country_code || "??",
        city: d.city || d.country_name,
      };
    }
  } catch { /* timeout ou réseau */ }
  return null;
}

// ── Fournisseur 4 : geojs.io (HTTPS, gratuit, sans limite) ───────────────
async function tryGeoJs(ip: string): Promise<GeoResult | null> {
  try {
    const res = await fetch(
      `https://get.geojs.io/v1/ip/geo/${encodeURIComponent(ip)}.json`,
      { signal: AbortSignal.timeout(6000) }
    );
    const d = await res.json() as { country?: string; country_code?: string; city?: string };
    if (d.country) {
      return {
        country: d.country,
        countryCode: d.country_code || "??",
        city: d.city || d.country,
      };
    }
  } catch { /* timeout ou réseau */ }
  return null;
}

export async function geoLookup(ip: string): Promise<GeoResult> {
  // IP privée/locale → fallback nécessaire (géo navigateur ou téléphone)
  if (!ip || isPrivateIp(ip)) {
    return { country: "Local", countryCode: "LO", city: "Local" };
  }
  if (ip === "unknown") {
    return UNKNOWN;
  }

  await load();
  const k = key(ip);
  const hit = mem[k];
  if (hit && Date.now() - hit.ts < TTL) {
    return { country: hit.country, countryCode: hit.countryCode, city: hit.city };
  }

  // Essayer les 4 fournisseurs en cascade
  const result = await tryIpApi(ip)
    ?? await tryIpWhoIs(ip)
    ?? await tryIpApiCo(ip)
    ?? await tryGeoJs(ip);

  if (result) {
    mem[k] = { ...result, ts: Date.now() };
    save();
    return result;
  }

  return UNKNOWN;
}
