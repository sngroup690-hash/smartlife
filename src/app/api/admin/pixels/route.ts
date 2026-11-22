import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";

const CONFIG_FILE = path.join(process.cwd(), "private", "pixels-config.json");

function checkAuth(req: NextRequest) {
  return req.headers.get("x-admin-password") === process.env.ADMIN_PASSWORD;
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  try {
    const raw = await readFile(CONFIG_FILE, "utf-8");
    const cfg = JSON.parse(raw) as Record<string, unknown> & {
      facebook?: Record<string, unknown> & { capiToken?: string };
    };
    // Masquer le token CAPI (montrer uniquement les 4 derniers caractères)
    if (cfg.facebook?.capiToken && !cfg.facebook.capiToken.startsWith("****")) {
      const t = cfg.facebook.capiToken;
      cfg.facebook = { ...cfg.facebook, capiToken: t.length > 4 ? `****${t.slice(-4)}` : "****" };
    }
    return NextResponse.json(cfg);
  } catch {
    return NextResponse.json({
      facebook: { enabled: false, pixelId: "", capiToken: "" },
      tiktok: { enabled: false, pixelId: "" },
      googleAds: { enabled: false, conversionId: "", conversionLabel: "" },
    });
  }
}

function validatePixelIds(config: unknown): string | null {
  if (!config || typeof config !== "object") return "Configuration invalide";
  const c = config as Record<string, unknown>;

  const fb = c.facebook as Record<string, unknown> | undefined;
  if (fb?.enabled && fb.pixelId && !/^\d{1,20}$/.test(String(fb.pixelId))) {
    return "Facebook Pixel ID invalide (chiffres uniquement, max 20)";
  }

  const tt = c.tiktok as Record<string, unknown> | undefined;
  if (tt?.enabled && tt.pixelId && !/^[A-Z0-9]{1,30}$/i.test(String(tt.pixelId))) {
    return "TikTok Pixel ID invalide (lettres majuscules et chiffres, max 30)";
  }

  const ga = c.googleAds as Record<string, unknown> | undefined;
  if (ga?.enabled) {
    if (ga.conversionId && !/^AW-\d{1,15}$/.test(String(ga.conversionId))) {
      return "Google Ads Conversion ID invalide (format AW-XXXXXXXXXX)";
    }
    if (ga.conversionLabel && !/^[A-Za-z0-9_\-]{1,50}$/.test(String(ga.conversionLabel))) {
      return "Google Ads Conversion Label invalide";
    }
  }

  return null;
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const incoming = await req.json() as Record<string, unknown> & {
    facebook?: Record<string, unknown> & { capiToken?: string };
  };

  const validationError = validatePixelIds(incoming);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  // Préserver le token CAPI existant si l'admin envoie la version masquée ou vide
  let config = { ...incoming };
  const newToken = incoming.facebook?.capiToken ?? "";
  if (!newToken || newToken.startsWith("****")) {
    try {
      const existing = JSON.parse(await readFile(CONFIG_FILE, "utf-8")) as Record<string, unknown> & {
        facebook?: Record<string, unknown> & { capiToken?: string };
      };
      const oldToken = existing.facebook?.capiToken ?? "";
      config = {
        ...config,
        facebook: { ...(config.facebook as Record<string, unknown>), capiToken: oldToken },
      };
    } catch { /* première sauvegarde */ }
  }

  await mkdir(path.dirname(CONFIG_FILE), { recursive: true });
  await writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8");
  return NextResponse.json({ success: true });
}
