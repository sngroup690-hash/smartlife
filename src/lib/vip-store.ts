import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

export type VipPlan = "monthly" | "annual";
export type VipStatus = "active" | "expired" | "cancelled";

export type VipPaymentRecord = {
  amount: number;
  reference: string;
  paidAt: string;
  gateway: string;
};

export type VipSubscription = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  plan: VipPlan;
  status: VipStatus;
  startDate: string;
  expiresAt: string;
  formationCredits: number;
  formationCreditGrantedAt?: string;
  redeemedFormationIds: string[];
  payments: VipPaymentRecord[];
};

export type VipConfig = {
  enabled: boolean;
  monthlyPrice: number;
  annualPrice: number;
  communityLink: string;
  communityType: "whatsapp" | "telegram";
  currency: string;
};

const SUBS_FILE = path.join(process.cwd(), "private", "vip-subscriptions.json");
const CONFIG_FILE = path.join(process.cwd(), "private", "vip-config.json");
const USERS_FILE = path.join(process.cwd(), "private", "users.json");

export const DEFAULT_VIP_CONFIG: VipConfig = {
  enabled: true,
  monthlyPrice: 5000,
  annualPrice: 45000,
  communityLink: "",
  communityType: "whatsapp",
  currency: "XAF",
};

// ── Config ─────────────────────────────────────────────────────────────────────

export async function readVipConfig(): Promise<VipConfig> {
  try {
    const raw = await readFile(CONFIG_FILE, "utf-8");
    return { ...DEFAULT_VIP_CONFIG, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_VIP_CONFIG };
  }
}

export async function writeVipConfig(cfg: VipConfig): Promise<void> {
  await mkdir(path.dirname(CONFIG_FILE), { recursive: true });
  await writeFile(CONFIG_FILE, JSON.stringify(cfg, null, 2), "utf-8");
}

// ── Subscriptions ──────────────────────────────────────────────────────────────

export async function readVipSubscriptions(): Promise<VipSubscription[]> {
  try {
    const raw = await readFile(SUBS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function writeVipSubscriptions(subs: VipSubscription[]): Promise<void> {
  await mkdir(path.dirname(SUBS_FILE), { recursive: true });
  await writeFile(SUBS_FILE, JSON.stringify(subs, null, 2), "utf-8");
}

export function isVipActive(sub: VipSubscription): boolean {
  if (sub.status !== "active") return false;
  return new Date(sub.expiresAt) > new Date();
}

export async function getActiveVipSub(userId: string): Promise<VipSubscription | null> {
  const subs = await readVipSubscriptions();
  return subs.find(s => s.userId === userId && isVipActive(s)) ?? null;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function calcExpiry(plan: VipPlan, from: Date = new Date()): Date {
  const d = new Date(from);
  if (plan === "monthly") d.setMonth(d.getMonth() + 1);
  else d.setFullYear(d.getFullYear() + 1);
  return d;
}

function monthsDiff(a: Date, b: Date): number {
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
}

// ── Activation ────────────────────────────────────────────────────────────────

export async function activateVipSubscription(opts: {
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  plan: VipPlan;
  amount: number;
  reference: string;
  gateway: string;
}): Promise<VipSubscription> {
  const { userId, userName, userEmail, userPhone, plan, amount, reference, gateway } = opts;
  const subs = await readVipSubscriptions();
  const now = new Date();
  const payment: VipPaymentRecord = { amount, reference, paidAt: now.toISOString(), gateway };

  const idx = subs.findIndex(s => s.userId === userId);
  if (idx !== -1) {
    const sub = subs[idx];
    const base = sub.status === "active" && new Date(sub.expiresAt) > now
      ? new Date(sub.expiresAt)
      : now;
    sub.status = "active";
    sub.plan = plan;
    sub.expiresAt = calcExpiry(plan, base).toISOString();
    sub.formationCredits += 1;
    sub.formationCreditGrantedAt = now.toISOString();
    sub.payments = [...(sub.payments || []), payment];
    await writeVipSubscriptions(subs);
    return sub;
  }

  const sub: VipSubscription = {
    id: `sub_${crypto.randomBytes(6).toString("hex")}`,
    userId, userName, userEmail, userPhone,
    plan, status: "active",
    startDate: now.toISOString(),
    expiresAt: calcExpiry(plan, now).toISOString(),
    formationCredits: 1,
    formationCreditGrantedAt: now.toISOString(),
    redeemedFormationIds: [],
    payments: [payment],
  };
  subs.push(sub);
  await writeVipSubscriptions(subs);
  return sub;
}

// ── Formation credit ───────────────────────────────────────────────────────────

/** Vérifie et octroie les crédits formation accumulés depuis le dernier octroi */
async function refreshCredits(sub: VipSubscription, subs: VipSubscription[], idx: number): Promise<VipSubscription> {
  const now = new Date();
  const last = sub.formationCreditGrantedAt ? new Date(sub.formationCreditGrantedAt) : new Date(sub.startDate);
  const diff = monthsDiff(last, now);
  if (diff > 0) {
    sub.formationCredits += diff;
    sub.formationCreditGrantedAt = now.toISOString();
    subs[idx] = sub;
    await writeVipSubscriptions(subs);
  }
  return sub;
}

export async function redeemFormationCredit(
  userId: string,
  formationId: string,
): Promise<{ success: boolean; error?: string }> {
  const subs = await readVipSubscriptions();
  const idx = subs.findIndex(s => s.userId === userId && isVipActive(s));
  if (idx === -1) return { success: false, error: "Pas d'abonnement VIP actif" };

  let sub = subs[idx];
  sub = await refreshCredits(sub, subs, idx);

  if (sub.formationCredits <= 0) return { success: false, error: "Aucun crédit formation disponible ce mois-ci" };
  if (sub.redeemedFormationIds.includes(formationId)) return { success: false, error: "Formation déjà débloquée avec un crédit" };

  sub.formationCredits -= 1;
  sub.redeemedFormationIds = [...sub.redeemedFormationIds, formationId];
  subs[idx] = sub;
  await writeVipSubscriptions(subs);

  // Ajouter aux formations achetées dans users.json
  try {
    const raw = await readFile(USERS_FILE, "utf-8");
    const users: Array<{ id: string; formationsAchetees?: string[]; [k: string]: unknown }> = JSON.parse(raw);
    const uIdx = users.findIndex(u => u.id === userId);
    if (uIdx !== -1) {
      const cur = users[uIdx].formationsAchetees ?? [];
      if (!cur.includes(formationId)) {
        users[uIdx].formationsAchetees = [...cur, formationId];
        await writeFile(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
      }
    }
  } catch { /* non bloquant */ }

  return { success: true };
}

// ── Admin ──────────────────────────────────────────────────────────────────────

export async function adminCancelSubscription(userId: string): Promise<boolean> {
  const subs = await readVipSubscriptions();
  const idx = subs.findIndex(s => s.userId === userId);
  if (idx === -1) return false;
  subs[idx].status = "cancelled";
  await writeVipSubscriptions(subs);
  return true;
}

export async function adminExtendSubscription(userId: string, months: number): Promise<boolean> {
  const subs = await readVipSubscriptions();
  const idx = subs.findIndex(s => s.userId === userId);
  if (idx === -1) return false;
  const sub = subs[idx];
  const base = sub.status === "active" && new Date(sub.expiresAt) > new Date()
    ? new Date(sub.expiresAt)
    : new Date();
  base.setMonth(base.getMonth() + months);
  sub.expiresAt = base.toISOString();
  sub.status = "active";
  subs[idx] = sub;
  await writeVipSubscriptions(subs);
  return true;
}
