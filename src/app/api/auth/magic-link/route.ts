import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import { readUsers } from "@/lib/purchase-guard";

const TOKENS_FILE = path.join(process.cwd(), "private", "magic-tokens.json");
const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 jours

type MagicToken = {
  token: string;
  userId: string;
  email: string;
  ebookIds: string[];
  formationIds: string[];
  createdAt: string;
  expiresAt: string;
};

async function readTokens(): Promise<MagicToken[]> {
  try {
    const raw = await readFile(TOKENS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeTokens(tokens: MagicToken[]) {
  await mkdir(path.dirname(TOKENS_FILE), { recursive: true });
  await writeFile(TOKENS_FILE, JSON.stringify(tokens, null, 2), "utf-8");
}

// La commande doit avoir réellement été payée par cette adresse (vente enregistrée).
// Le paiement peut être confirmé quelques secondes après l'arrivée sur la page de succès : on patiente un peu.
async function venteConfirmee(reference: string, email: string): Promise<boolean> {
  const { queryAllSales } = await import("@/lib/analytics");
  for (let essai = 0; essai < 8; essai++) {
    const ventes = await queryAllSales();
    if (ventes.some((v) => v.reference === reference && v.customerEmail.toLowerCase() === email.toLowerCase())) return true;
    await new Promise((r) => setTimeout(r, 1500));
  }
  return false;
}

// POST /api/auth/magic-link — génère un lien de connexion, uniquement après un paiement confirmé
export async function POST(req: NextRequest) {
  const { userId, email, reference, ebookIds = [], formationIds = [] } = await req.json() as {
    userId?: string;
    email: string;
    reference?: string;
    ebookIds?: string[];
    formationIds?: string[];
  };

  if (!email) return NextResponse.json({ error: "email requis" }, { status: 400 });
  if (!reference || !(await venteConfirmee(reference, email))) {
    return NextResponse.json({ error: "Paiement non confirmé pour cette commande." }, { status: 403 });
  }

  const token = crypto.randomUUID();
  const now = new Date();
  const entry: MagicToken = {
    token,
    userId: userId ?? "",
    email,
    ebookIds,
    formationIds,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + TTL_MS).toISOString(),
  };

  const existing = await readTokens();
  // Purger les tokens expirés + les anciens tokens du même utilisateur
  const fresh = existing.filter(
    (t) => new Date(t.expiresAt) > now && t.email.toLowerCase() !== email.toLowerCase()
  );
  await writeTokens([...fresh, entry]);

  return NextResponse.json({ token });
}

// GET /api/auth/magic-link?token=xxx — valide le token et retourne la session
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ valid: false }, { status: 400 });

  const tokens = await readTokens();
  const now = new Date();
  const entry = tokens.find((t) => t.token === token);

  if (!entry || new Date(entry.expiresAt) < now) {
    return NextResponse.json({ valid: false, reason: "expired_or_not_found" });
  }

  // Chercher l'utilisateur dans users.json
  const users = await readUsers();
  let user = users.find((u) => u.id === entry.userId);
  if (!user) {
    user = users.find(
      (u) => (u.email as string | undefined)?.toLowerCase() === entry.email.toLowerCase()
    );
  }

  if (!user) {
    return NextResponse.json({ valid: false, reason: "user_not_found" });
  }

  return NextResponse.json({
    valid: true,
    user: {
      id: user.id as string,
      firstName: (user.firstName as string) ?? "",
      lastName: (user.lastName as string) ?? "",
      email: (user.email as string) ?? entry.email,
      phone: (user.phone as string) ?? "",
      ebooksAchetes: (user.ebooksAchetes as string[]) ?? [],
      formationsAchetees: (user.formationsAchetees as string[]) ?? [],
    },
  });
}
