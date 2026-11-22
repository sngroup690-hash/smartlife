import { NextRequest, NextResponse } from "next/server";

function checkAuth(req: NextRequest) {
  const h = req.headers.get("x-admin-password");
  return h !== null && h === process.env.ADMIN_PASSWORD;
}

function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}

function extractKeywords(title: string, description: string, category: string): string {
  const text = `${title} ${description} ${category}`.toLowerCase();
  const stopWords = new Set([
    "le", "la", "les", "de", "du", "des", "et", "en", "un", "une", "pour", "par",
    "dans", "sur", "avec", "tout", "bien", "plus", "très", "cette", "votre", "notre",
    "vous", "nous", "est", "sont", "qui", "que", "se", "au", "aux",
  ]);

  const words = text
    .replace(/[^a-zàâçéèêëîïôùûü\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !stopWords.has(w));

  const freq: Record<string, number> = {};
  for (const w of words) freq[w] = (freq[w] || 0) + 1;

  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([w]) => w)
    .join(", ");
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const body = await req.json() as {
      title: string;
      description: string;
      category?: string;
      price?: number;
      type?: "ebook" | "formation";
    };

    const { title, description, category = "", price, type = "ebook" } = body;

    if (!title || !description) {
      return NextResponse.json({ error: "title et description requis" }, { status: 400 });
    }

    const productLabel = type === "formation" ? "formation" : "ebook";

    // Meta title (50-60 chars)
    const baseTitle = `${title} — ${productLabel === "ebook" ? "Ebook" : "Formation"} ${category}`.trim();
    const metaTitle = baseTitle.length <= 60
      ? baseTitle
      : `${title.slice(0, 50).trim()} | ${category || "SN-GROUP"}`;

    // Meta description (150-160 chars)
    const priceStr = price ? ` à ${price.toLocaleString("fr-FR")} FCFA` : "";
    const cleanDesc = description.replace(/\s+/g, " ").trim();
    const intro = `${productLabel === "ebook" ? "Téléchargez cet ebook" : "Rejoignez cette formation"}${priceStr}. `;
    const remaining = 158 - intro.length;
    const truncDesc = cleanDesc.length > remaining
      ? cleanDesc.slice(0, remaining - 1).trim() + "…"
      : cleanDesc;
    const metaDescription = `${intro}${truncDesc}`;

    // Custom slug
    const customSlug = slugify(title);

    // Keywords
    const keywords = extractKeywords(title, description, category);

    return NextResponse.json({ metaTitle, metaDescription, customSlug, keywords });
  } catch {
    return NextResponse.json({ error: "Erreur génération SEO" }, { status: 500 });
  }
}
