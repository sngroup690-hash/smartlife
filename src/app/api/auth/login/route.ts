import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile } from "fs/promises";
import path from "path";
import { rateLimit } from "@/lib/rate-limit";
import { verifierCode, estEnClair, hacherCode, minutesDeBlocage, noterEchec, effacerEchecs } from "@/lib/securite-compte";

const USERS_FILE = path.join(process.cwd(), "private", "users.json");

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, { limit: 10, windowMs: 15 * 60_000 });
  if (limited) return limited;

  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email et mot de passe requis." }, { status: 400 });
  }
  const emailMin = String(email).trim().toLowerCase();
  const bloque = minutesDeBlocage(emailMin);
  if (bloque > 0) {
    return NextResponse.json({ error: `Trop d'essais. Réessaie dans ${bloque} minute${bloque > 1 ? "s" : ""}.` }, { status: 429 });
  }

  let users: Record<string, unknown>[] = [];
  try {
    const raw = await readFile(USERS_FILE, "utf-8");
    users = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Email ou mot de passe incorrect." }, { status: 401 });
  }

  const idx = users.findIndex((u) => String(u.email ?? "").toLowerCase() === emailMin);
  const user = idx >= 0 ? users[idx] : undefined;
  if (!user || user.hasPassword === false || !verifierCode(user.password, String(password))) {
    noterEchec(emailMin);
    return NextResponse.json({ error: "Email ou mot de passe incorrect." }, { status: 401 });
  }

  effacerEchecs(emailMin);
  // Ancien code encore en clair : on le remplace par sa version chiffrée.
  if (estEnClair(user.password)) {
    users[idx] = { ...user, password: hacherCode(String(password)) };
    await writeFile(USERS_FILE, JSON.stringify(users, null, 2), "utf-8").catch(() => {});
  }

  const { password: _pwd, ...userPublic } = user;
  return NextResponse.json({ success: true, user: userPublic });
}
