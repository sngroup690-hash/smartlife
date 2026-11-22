import { NextRequest, NextResponse } from "next/server";

type Window = { count: number; resetAt: number };
const store = new Map<string, Window>();

export function rateLimit(
  req: NextRequest,
  { limit, windowMs }: { limit: number; windowMs: number }
): NextResponse | null {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  const key = `${req.nextUrl.pathname}:${ip}`;
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }

  entry.count += 1;
  if (entry.count > limit) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessayez plus tard." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((entry.resetAt - now) / 1000)) } }
    );
  }
  return null;
}
