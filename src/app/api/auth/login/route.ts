import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { rateLimit } from "@/lib/rate-limit";

const USERS_FILE = path.join(process.cwd(), "private", "users.json");

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, { limit: 10, windowMs: 15 * 60_000 });
  if (limited) return limited;

  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email et mot de passe requis." }, { status: 400 });
  }

  let users: Record<string, unknown>[] = [];
  try {
    const raw = await readFile(USERS_FILE, "utf-8");
    users = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Email ou mot de passe incorrect." }, { status: 401 });
  }

  const user = users.find(
    (u) =>
      (u.email as string).toLowerCase() === email.toLowerCase() &&
      u.password === password
  );

  if (!user) {
    return NextResponse.json({ error: "Email ou mot de passe incorrect." }, { status: 401 });
  }

  const { password: _pwd, ...userPublic } = user;
  return NextResponse.json({ success: true, user: userPublic });
}
