import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

const AFFILIATES_FILE = path.join(process.cwd(), "private", "affiliates.json");
const SALES_FILE = path.join(process.cwd(), "private", "affiliate-sales.json");
const PAYOUTS_FILE = path.join(process.cwd(), "private", "affiliate-payouts.json");

const SECRET = process.env.AFFILIATE_SECRET ?? (() => { throw new Error("Variable d'environnement AFFILIATE_SECRET manquante"); })() as string;

export type PayoutInfo = {
  method: "mobile_money" | "bank_transfer";
  operator?: "orange" | "mtn";
  number?: string;
  bankName?: string;
  accountName?: string;
  bankAccount?: string;
};

export type AffiliateAccount = {
  id: string;
  code: string;
  passwordHash: string;
  displayName: string;
  email: string;
  phone?: string;
  enabled: boolean;
  payoutInfo?: PayoutInfo;
  totalPaidOut: number;
  minPayoutThreshold: number;
  createdAt: string;
  lastLogin?: string;
};

export type AffiliateSale = {
  id: string;
  code: string;
  amount: number;
  commission: number;
  produit: string;
  reference: string;
  date: string;
};

export type PayoutRequest = {
  id: string;
  affiliateId: string;
  affiliateName: string;
  code: string;
  amount: number;
  payoutInfo: PayoutInfo;
  status: "pending" | "paid" | "rejected";
  note?: string;
  requestedAt: string;
  processedAt?: string;
};

export function hashPassword(pw: string): string {
  return crypto.createHash("sha256").update(pw + SECRET).digest("hex");
}

export function createToken(affiliateId: string): string {
  const expiry = Date.now() + 30 * 24 * 60 * 60 * 1000;
  const payload = `${affiliateId}:${expiry}`;
  const sig = crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
  return Buffer.from(payload).toString("base64url") + "." + sig;
}

export function verifyToken(token: string): string | null {
  try {
    const dotIdx = token.lastIndexOf(".");
    if (dotIdx === -1) return null;
    const b64 = token.slice(0, dotIdx);
    const sig = token.slice(dotIdx + 1);
    const payload = Buffer.from(b64, "base64url").toString();
    const expected = crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
    if (sig !== expected) return null;
    const colonIdx = payload.lastIndexOf(":");
    const expiry = payload.slice(colonIdx + 1);
    if (Date.now() > Number(expiry)) return null;
    return payload.slice(0, colonIdx);
  } catch {
    return null;
  }
}

export async function readAffiliates(): Promise<AffiliateAccount[]> {
  try { return JSON.parse(await readFile(AFFILIATES_FILE, "utf-8")); }
  catch { return []; }
}

export async function writeAffiliates(data: AffiliateAccount[]) {
  await mkdir(path.dirname(AFFILIATES_FILE), { recursive: true });
  await writeFile(AFFILIATES_FILE, JSON.stringify(data, null, 2), "utf-8");
}

export async function readAffiliateSales(code?: string): Promise<AffiliateSale[]> {
  try {
    const all: AffiliateSale[] = JSON.parse(await readFile(SALES_FILE, "utf-8"));
    return code ? all.filter((s) => s.code === code) : all;
  } catch { return []; }
}

export async function appendAffiliateSale(sale: Omit<AffiliateSale, "id">) {
  const all = await readAffiliateSales();
  const entry: AffiliateSale = { ...sale, id: crypto.randomUUID() };
  all.push(entry);
  await mkdir(path.dirname(SALES_FILE), { recursive: true });
  await writeFile(SALES_FILE, JSON.stringify(all.slice(-5000), null, 2), "utf-8");
  return entry;
}

export async function readPayouts(): Promise<PayoutRequest[]> {
  try { return JSON.parse(await readFile(PAYOUTS_FILE, "utf-8")); }
  catch { return []; }
}

export async function writePayouts(data: PayoutRequest[]) {
  await mkdir(path.dirname(PAYOUTS_FILE), { recursive: true });
  await writeFile(PAYOUTS_FILE, JSON.stringify(data, null, 2), "utf-8");
}

export function getAffiliateToken(req: { cookies: { get: (k: string) => { value: string } | undefined } }): string | null {
  return req.cookies.get("aff_token")?.value ?? null;
}
