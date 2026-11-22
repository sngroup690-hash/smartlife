import { NextResponse } from "next/server";
import { bannerVersion } from "@/lib/banner-version";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    { v: bannerVersion.get() },
    { headers: { "Cache-Control": "no-store, must-revalidate" } }
  );
}
