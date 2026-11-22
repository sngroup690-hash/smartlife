import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

const FILE = path.join(process.cwd(), "private", "reviews.json");

type Review = {
  id: string;
  productId: string;
  productType: "formation" | "ebook" | "accompagnement";
  userId: string;
  userName: string;
  rating: number;
  text: string;
  statut: "en_attente" | "approuve" | "rejete";
  createdAt: string;
};

async function readReviews(): Promise<Review[]> {
  try {
    const raw = await readFile(FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeReviews(reviews: Review[]) {
  await mkdir(path.dirname(FILE), { recursive: true });
  await writeFile(FILE, JSON.stringify(reviews, null, 2), "utf-8");
}

// GET: reviews approuvés par produit, ou tous les reviews d'un utilisateur
export async function GET(req: NextRequest) {
  const productId = req.nextUrl.searchParams.get("productId");
  const userId = req.nextUrl.searchParams.get("userId");
  const reviews = await readReviews();

  if (userId) {
    // Retourner les reviews de l'utilisateur (tous statuts)
    return NextResponse.json({
      reviews: reviews.filter((r) => r.userId === userId),
    });
  }

  const approved = reviews.filter(
    (r) => r.statut === "approuve" && (!productId || r.productId === productId)
  );
  return NextResponse.json({ reviews: approved });
}

// POST: soumettre un avis
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || !body.productId || !body.userId || !body.rating) {
    return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
  }
  if (body.rating < 1 || body.rating > 5) {
    return NextResponse.json({ error: "Note invalide" }, { status: 400 });
  }

  const reviews = await readReviews();

  // Vérifier si l'utilisateur a déjà soumis un avis pour ce produit
  const existing = reviews.find((r) => r.userId === body.userId && r.productId === body.productId);
  if (existing) {
    return NextResponse.json({ error: "Vous avez déjà soumis un avis pour ce produit" }, { status: 409 });
  }

  const newReview: Review = {
    id: `rev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    productId: body.productId,
    productType: body.productType ?? "formation",
    userId: body.userId,
    userName: body.userName ?? "Anonyme",
    rating: Math.min(5, Math.max(1, Math.round(body.rating))),
    text: (body.text ?? "").trim().slice(0, 1000),
    statut: "en_attente",
    createdAt: new Date().toISOString(),
  };

  reviews.push(newReview);
  await writeReviews(reviews);

  return NextResponse.json({ success: true, id: newReview.id });
}
