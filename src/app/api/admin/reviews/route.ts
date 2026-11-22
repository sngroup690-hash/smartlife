import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import { isValidAdminPassword } from "@/lib/admin-auth";

const FILE = path.join(process.cwd(), "private", "reviews.json");

type Review = {
  id: string;
  productId: string;
  productType: "formation" | "ebook";
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

// GET: tous les avis (admin)
export async function GET(req: NextRequest) {
  const pwd = req.headers.get("x-admin-password");
  if (!isValidAdminPassword(pwd)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const reviews = await readReviews();
  return NextResponse.json({ reviews });
}

// PATCH: approuver ou rejeter
export async function PATCH(req: NextRequest) {
  const pwd = req.headers.get("x-admin-password");
  if (!isValidAdminPassword(pwd)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  if (!body?.id || !["approuve", "rejete"].includes(body.statut)) {
    return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
  }
  const reviews = await readReviews();
  const idx = reviews.findIndex((r) => r.id === body.id);
  if (idx === -1) return NextResponse.json({ error: "Avis introuvable" }, { status: 404 });
  reviews[idx].statut = body.statut;
  await writeReviews(reviews);
  return NextResponse.json({ success: true });
}

// DELETE: supprimer définitivement
export async function DELETE(req: NextRequest) {
  const pwd = req.headers.get("x-admin-password");
  if (!isValidAdminPassword(pwd)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  if (!body?.id) return NextResponse.json({ error: "ID manquant" }, { status: 400 });
  const reviews = await readReviews();
  await writeReviews(reviews.filter((r) => r.id !== body.id));
  return NextResponse.json({ success: true });
}
