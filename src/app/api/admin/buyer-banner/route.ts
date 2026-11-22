import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import { revalidatePath } from "next/cache";
import path from "path";
import { bannerVersion } from "@/lib/banner-version";

const FILE = path.join(process.cwd(), "private", "buyer-banner-config.json");

export type BuyerBannerConfig = {
  enabled: boolean;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaUrl: string;
  bgColor: string;
  textColor: string;
  ctaBgColor: string;
  ctaTextColor: string;
};

export const DEFAULT_BUYER_BANNER: BuyerBannerConfig = {
  enabled: true,
  title: "Félicitations pour votre achat !",
  subtitle: "Découvrez notre accompagnement personnalisé pour booster votre projet.",
  ctaText: "Découvrir l'accompagnement",
  ctaUrl: "/accompagnement",
  bgColor: "#1a2e1a",
  textColor: "#ffffff",
  ctaBgColor: "#E8B800",
  ctaTextColor: "#000000",
};

async function readConfig(): Promise<BuyerBannerConfig> {
  try {
    const raw = await readFile(FILE, "utf-8");
    return { ...DEFAULT_BUYER_BANNER, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_BUYER_BANNER;
  }
}

export async function GET() {
  return NextResponse.json(await readConfig(), {
    headers: { "Cache-Control": "no-store, must-revalidate" },
  });
}

export async function POST(req: NextRequest) {
  const pwd = req.headers.get("x-admin-password");
  if (pwd !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  try {
    const body = await req.json() as Partial<BuyerBannerConfig>;
    const current = await readConfig();
    const updated: BuyerBannerConfig = { ...current, ...body };
    await mkdir(path.dirname(FILE), { recursive: true });
    await writeFile(FILE, JSON.stringify(updated, null, 2), "utf-8");
    bannerVersion.bump();
    revalidatePath("/", "layout");
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
