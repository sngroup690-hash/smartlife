import { NextRequest, NextResponse } from "next/server";
import { readCrossSellConfig, writeCrossSellConfig, getRecommendations } from "@/lib/cross-sell-store";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

function adminAuth(req: NextRequest): boolean {
  const h = req.headers.get("x-admin-password");
  const q = req.nextUrl.searchParams.get("password");
  return h === ADMIN_PASSWORD || q === ADMIN_PASSWORD;
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl;

  // Lecture config admin
  if (url.searchParams.get("adminConfig") === "true") {
    if (!adminAuth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    return NextResponse.json(await readCrossSellConfig());
  }

  const productId = url.searchParams.get("productId");
  const productType = url.searchParams.get("productType") as "ebook" | "formation" | null;
  const excludeStr = url.searchParams.get("excludeIds") || "";
  const excludeIds = excludeStr.split(",").filter(Boolean);
  const postPurchase = url.searchParams.get("postPurchase") === "true";

  if (!productId || !productType || !["ebook", "formation"].includes(productType)) {
    return NextResponse.json({ error: "productId et productType requis" }, { status: 400 });
  }

  const cfg = await readCrossSellConfig();
  const discountPercent = postPurchase && cfg.postPurchaseEnabled ? cfg.postPurchaseDiscount : undefined;

  try {
    const recommendations = await getRecommendations({
      productId,
      productType,
      excludeIds,
      maxResults: 3,
      discountPercent,
    });
    return NextResponse.json({ recommendations, postPurchaseDiscount: discountPercent });
  } catch {
    return NextResponse.json({ recommendations: [], postPurchaseDiscount: undefined });
  }
}

export async function POST(req: NextRequest) {
  if (!adminAuth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const body = await req.json();
  const cfg = await readCrossSellConfig();
  const updated = { ...cfg, ...body };
  await writeCrossSellConfig(updated);
  return NextResponse.json(updated);
}
