import { randomBytes, randomInt, scryptSync, timingSafeEqual, createHash } from "crypto";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";

// ── Codes PIN : jamais stockés en clair ─────────────────────────────────────

export function hacherCode(code: string): string {
  const sel = randomBytes(16).toString("hex");
  const empreinte = scryptSync(code, sel, 32).toString("hex");
  return `scrypt$${sel}$${empreinte}`;
}

/** Vérifie un code saisi contre ce qui est stocké (empreinte, ou ancien code en clair à migrer). */
export function verifierCode(stocke: unknown, saisi: string): boolean {
  if (typeof stocke !== "string" || !stocke || !saisi) return false;
  if (stocke.startsWith("scrypt$")) {
    const [, sel, empreinte] = stocke.split("$");
    const attendu = Buffer.from(empreinte, "hex");
    const calcule = scryptSync(saisi, sel, attendu.length);
    return attendu.length === calcule.length && timingSafeEqual(attendu, calcule);
  }
  const a = Buffer.from(stocke);
  const b = Buffer.from(saisi);
  return a.length === b.length && timingSafeEqual(a, b);
}

export const estEnClair = (stocke: unknown) => typeof stocke === "string" && !!stocke && !stocke.startsWith("scrypt$");

// ── Blocage après trop d'erreurs, par adresse e-mail ────────────────────────

const ESSAIS_MAX = 5;
const BLOCAGE_MS = 15 * 60_000;
const echecs = new Map<string, { n: number; jusqua: number }>();

/** Nombre de minutes de blocage restantes (0 = libre). */
export function minutesDeBlocage(email: string): number {
  const e = echecs.get(email.toLowerCase());
  if (!e || e.n < ESSAIS_MAX) return 0;
  const reste = e.jusqua - Date.now();
  if (reste <= 0) { echecs.delete(email.toLowerCase()); return 0; }
  return Math.ceil(reste / 60_000);
}

export function noterEchec(email: string) {
  const cle = email.toLowerCase();
  const e = echecs.get(cle);
  const maintenant = Date.now();
  if (!e || e.jusqua < maintenant) echecs.set(cle, { n: 1, jusqua: maintenant + BLOCAGE_MS });
  else { e.n += 1; e.jusqua = maintenant + BLOCAGE_MS; }
}

export function effacerEchecs(email: string) {
  echecs.delete(email.toLowerCase());
}

// ── Codes de vérification à 6 chiffres envoyés par e-mail ──────────────────

const FICHIER_CODES = path.join(process.cwd(), "private", "codes-verification.json");
const DUREE_CODE_MS = 15 * 60_000;
type CodeEmail = { email: string; empreinte: string; expire: number; essais: number; envoyeA: number };

const empreinteCode = (code: string) => createHash("sha256").update(code).digest("hex");

async function lireCodes(): Promise<CodeEmail[]> {
  try { return (JSON.parse(await readFile(FICHIER_CODES, "utf-8")) as CodeEmail[]).filter((c) => c.expire > Date.now()); } catch { return []; }
}
async function ecrireCodes(codes: CodeEmail[]) {
  await mkdir(path.dirname(FICHIER_CODES), { recursive: true });
  await writeFile(FICHIER_CODES, JSON.stringify(codes), "utf-8");
}

/** Crée un code pour cette adresse. Retourne null si un code vient d'être envoyé (moins d'une minute). */
export async function creerCodeEmail(email: string): Promise<string | null> {
  const cle = email.toLowerCase();
  const codes = await lireCodes();
  const existant = codes.find((c) => c.email === cle);
  if (existant && Date.now() - existant.envoyeA < 60_000) return null;
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const autres = codes.filter((c) => c.email !== cle);
  await ecrireCodes([...autres, { email: cle, empreinte: empreinteCode(code), expire: Date.now() + DUREE_CODE_MS, essais: 0, envoyeA: Date.now() }]);
  return code;
}

/** Vérifie et consomme le code reçu par e-mail (5 essais maximum). */
export async function validerCodeEmail(email: string, code: string): Promise<boolean> {
  const cle = email.toLowerCase();
  const codes = await lireCodes();
  const c = codes.find((x) => x.email === cle);
  if (!c || !code) return false;
  if (c.essais >= 5) return false;
  const bon = timingSafeEqual(Buffer.from(c.empreinte), Buffer.from(empreinteCode(String(code).trim())));
  if (bon) {
    await ecrireCodes(codes.filter((x) => x.email !== cle));
    return true;
  }
  c.essais += 1;
  await ecrireCodes(codes);
  return false;
}

export async function envoyerCodeParEmail(email: string, code: string, prenom?: string): Promise<boolean> {
  const cle = process.env.RESEND_API_KEY;
  const de = process.env.EMAIL_FROM ?? "noreply@smartlifecm.com";
  if (!cle) {
    console.log(`ℹ️  RESEND_API_KEY absent — code de vérification non envoyé (mode développement) pour ${email}`);
    return false;
  }
  const html = `<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px">
    <p style="font-size:16px">Bonjour ${prenom ? prenom.replace(/[<>&"]/g, "") : ""},</p>
    <p style="font-size:15px">Voici ton code pour accéder à ton espace Smart Life :</p>
    <p style="font-size:34px;font-weight:bold;letter-spacing:8px;color:#1b7a1b;text-align:center;margin:24px 0">${code}</p>
    <p style="font-size:13px;color:#555">Ce code est valable 15 minutes. Si tu n'as rien demandé, ignore simplement ce message : ton compte reste protégé.</p>
  </div>`;
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${cle}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: de, to: email, subject: `${code} — ton code Smart Life`, html }),
    });
    return r.ok;
  } catch {
    return false;
  }
}
