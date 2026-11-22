import { NextRequest, NextResponse } from "next/server";
import { extractClientIp, geoLookup } from "@/lib/geo";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const ip = extractClientIp(req.headers);

  if (!ip || ip === "unknown") {
    return NextResponse.json({ countryCode: null });
  }

  const geo = await geoLookup(ip);
  const code = geo.countryCode;

  if (!code || code === "??" || code === "LO") {
    return NextResponse.json({ countryCode: null });
  }

  return NextResponse.json({ countryCode: code }, {
    headers: { "Cache-Control": "private, max-age=300" },
  });
}
