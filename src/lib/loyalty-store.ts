import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

const USERS_FILE = path.join(process.cwd(), "private", "users.json");
const LOYALTY_CODES_FILE = path.join(process.cwd(), "private", "loyalty-codes.json");

type User = Record<string, unknown> & {
  id: string;
  loyaltyPoints?: number;
  referralCode?: string;
};

export type LoyaltyCode = {
  code: string;
  userId: string;
  pointsUsed: number;
  discountPercent: number;
  used: boolean;
  createdAt: string;
};

async function readUsers(): Promise<User[]> {
  try { return JSON.parse(await readFile(USERS_FILE, "utf-8")); }
  catch { return []; }
}
async function writeUsers(users: User[]) {
  await mkdir(path.dirname(USERS_FILE), { recursive: true });
  await writeFile(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
}
async function readLoyaltyCodes(): Promise<LoyaltyCode[]> {
  try { return JSON.parse(await readFile(LOYALTY_CODES_FILE, "utf-8")); }
  catch { return []; }
}
async function writeLoyaltyCodes(codes: LoyaltyCode[]) {
  await mkdir(path.dirname(LOYALTY_CODES_FILE), { recursive: true });
  await writeFile(LOYALTY_CODES_FILE, JSON.stringify(codes, null, 2), "utf-8");
}

export function pointsToDiscountPercent(points: number): number {
  // 100 pts = 10%, 200 = 20%, ..., 500 = 50% (max)
  return Math.min(50, Math.floor(points / 100) * 10);
}

export function purchaseAmountToPoints(amount: number): number {
  // 1 point par 100 XAF dépensé
  return Math.floor(amount / 100);
}

export async function getUserPoints(userId: string): Promise<number> {
  const users = await readUsers();
  const u = users.find((x) => x.id === userId);
  return u?.loyaltyPoints ?? 0;
}

export async function addPoints(userId: string, points: number): Promise<void> {
  if (points <= 0) return;
  const users = await readUsers();
  const idx = users.findIndex((x) => x.id === userId);
  if (idx === -1) return;
  users[idx].loyaltyPoints = (users[idx].loyaltyPoints ?? 0) + points;
  await writeUsers(users);
}

export async function debitPoints(userId: string, points: number): Promise<boolean> {
  const users = await readUsers();
  const idx = users.findIndex((x) => x.id === userId);
  if (idx === -1) return false;
  const current = users[idx].loyaltyPoints ?? 0;
  if (current < points) return false;
  users[idx].loyaltyPoints = current - points;
  await writeUsers(users);
  return true;
}

// Génère un code de parrainage depuis le prénom
export async function getOrCreateReferralCode(userId: string, firstName: string): Promise<string> {
  const users = await readUsers();
  const idx = users.findIndex((x) => x.id === userId);
  if (idx === -1) return "";
  if (users[idx].referralCode) return users[idx].referralCode as string;

  // Générer un code propre depuis le prénom
  const base = (firstName || "USER")
    .toUpperCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 8);

  // Garantir unicité
  const existingCodes = new Set(users.map((u) => u.referralCode).filter(Boolean));
  let code = base;
  let i = 1;
  while (existingCodes.has(code)) {
    code = `${base.slice(0, 6)}${String(i).padStart(2, "0")}`;
    i++;
  }

  users[idx].referralCode = code;
  await writeUsers(users);
  return code;
}

export async function findUserByReferralCode(code: string): Promise<User | null> {
  if (!code) return null;
  const users = await readUsers();
  return users.find((u) => u.referralCode === code.toUpperCase()) ?? null;
}

// Génère un code de réduction temporaire depuis les points
export async function generateLoyaltyCode(userId: string, pointsToUse: number): Promise<LoyaltyCode | null> {
  const points = await getUserPoints(userId);
  if (points < pointsToUse || pointsToUse < 100) return null;

  const discountPercent = pointsToDiscountPercent(pointsToUse);
  if (discountPercent === 0) return null;

  const codes = await readLoyaltyCodes();
  // Invalider les anciens codes non-utilisés de ce user
  const filtered = codes.filter((c) => !(c.userId === userId && !c.used));

  const code: LoyaltyCode = {
    code: `PTS-${crypto.randomBytes(3).toString("hex").toUpperCase()}`,
    userId,
    pointsUsed: pointsToUse,
    discountPercent,
    used: false,
    createdAt: new Date().toISOString(),
  };
  filtered.push(code);
  await writeLoyaltyCodes(filtered);
  return code;
}

export async function validateLoyaltyCode(code: string): Promise<LoyaltyCode | null> {
  const codes = await readLoyaltyCodes();
  return codes.find((c) => c.code === code && !c.used) ?? null;
}

export async function markLoyaltyCodeUsed(code: string): Promise<void> {
  const codes = await readLoyaltyCodes();
  const idx = codes.findIndex((c) => c.code === code);
  if (idx !== -1) {
    codes[idx].used = true;
    await writeLoyaltyCodes(codes);
  }
}
