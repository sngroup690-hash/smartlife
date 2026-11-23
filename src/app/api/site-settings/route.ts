import { NextResponse } from "next/server";
import { lireReglagesSite } from "@/lib/reglages-site";

export const dynamic = "force-dynamic";

// Lecture publique des réglages du site (aucune donnée sensible).
export async function GET() {
  return NextResponse.json(await lireReglagesSite(), {
    headers: { "Cache-Control": "no-store" },
  });
}
