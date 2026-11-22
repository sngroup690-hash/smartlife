import { readFile, appendFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { queryAllSales } from "@/lib/analytics";
import { readOrders, readUsers } from "@/lib/purchase-guard";

const PRIVATE = path.join(process.cwd(), "private");
const FAILED_FILE = path.join(PRIVATE, "failed-transactions.jsonl");

// Résout un ID produit en nom lisible (fallback = l'ID lui-même)
async function resolveProductName(id: string): Promise<string> {
  // Ebooks dynamiques
  try {
    const raw = await readFile(path.join(PRIVATE, "ebooks-data.json"), "utf-8");
    const data = JSON.parse(raw);
    const found = (data.ebooks || []).find((e: { id: string; title?: string }) => e.id === id);
    if (found?.title) return found.title;
  } catch { /* ok */ }
  // Formations dynamiques
  try {
    const raw = await readFile(path.join(PRIVATE, "formations-data.json"), "utf-8");
    const data = JSON.parse(raw);
    const found = (data.formations || []).find((f: { id: string; titre?: string }) => f.id === id);
    if (found?.titre) return found.titre;
  } catch { /* ok */ }
  // Données statiques (import synchrone)
  try {
    const { ebooks } = await import("@/lib/data");
    const e = ebooks.find(e => e.id === id);
    if (e?.title) return e.title;
  } catch { /* ok */ }
  try {
    const { FORMATIONS } = await import("@/lib/formations-data");
    const f = FORMATIONS.find(f => f.id === id);
    if (f?.titre) return f.titre;
  } catch { /* ok */ }
  return id;
}

async function resolveProductNames(ids: string[]): Promise<string> {
  const names = await Promise.all(ids.map(resolveProductName));
  return names.join(", ");
}

export type FailedTransaction = {
  id: string;
  ts: string;
  reference: string;
  transactionId?: string;
  sebpayStatus: string;
  amount: number;
  currency: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  product: string;
  status?: "failed" | "abandoned"; // absent = "failed" pour rétrocompat
};

export type TransactionStatus = "successful" | "failed" | "pending" | "abandoned";

export type UnifiedTransaction = {
  id: string;
  ts: string;
  reference: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  product: string;
  amount: number;
  currency: string;
  status: TransactionStatus;
  transactionId?: string;
};

async function readLines<T>(file: string): Promise<T[]> {
  try {
    return (await readFile(file, "utf-8"))
      .split("\n").filter(Boolean).map(l => JSON.parse(l) as T);
  } catch { return []; }
}

export async function readFailedTransactions(): Promise<FailedTransaction[]> {
  return readLines<FailedTransaction>(FAILED_FILE);
}

export async function recordAbandonedTransaction(opts: {
  reference: string;
  transactionId?: string;
  amount?: number;
  currency?: string;
  reason?: string;
}): Promise<void> {
  const orders = await readOrders();
  const order = orders.find(o => o.reference === opts.reference);

  let customerName = order?.customerName || "";
  let customerEmail = order?.customerEmail || "";
  let customerPhone = order?.customerPhone || "";

  if (order && (!customerName || !customerEmail || !customerPhone)) {
    try {
      const users = await readUsers();
      const user = users.find(u => u.id === order.userId) as {
        email?: string; firstName?: string; lastName?: string; phone?: string;
      } | undefined;
      if (user) {
        customerName = customerName || `${user.firstName || ""} ${user.lastName || ""}`.trim();
        customerEmail = customerEmail || user.email || "";
        customerPhone = customerPhone || user.phone || "";
      }
    } catch { /* ok */ }
  }

  const productNames = order?.productNames || {};
  const allIds = [...(order?.ebookIds || []), ...(order?.formationIds || [])];
  const product = allIds.map(id => productNames[id] || id).join(", ") || "—";

  const ft: FailedTransaction = {
    id: randomUUID(),
    ts: new Date().toISOString(),
    reference: opts.reference,
    transactionId: opts.transactionId,
    sebpayStatus: opts.reason || "abandoned",
    amount: opts.amount || order?.amount || 0,
    currency: opts.currency || order?.currency || "XAF",
    customerName,
    customerEmail,
    customerPhone,
    product,
    status: "abandoned",
  };

  await mkdir(PRIVATE, { recursive: true });
  await appendFile(FAILED_FILE, JSON.stringify(ft) + "\n", "utf-8");
}

export async function recordFailedTransaction(opts: {
  reference: string;
  transactionId?: string;
  sebpayStatus: string;
  amount?: number;
  currency?: string;
}): Promise<void> {
  const orders = await readOrders();
  const order = orders.find(o => o.reference === opts.reference);

  let customerName = order?.customerName || "";
  let customerEmail = order?.customerEmail || "";
  let customerPhone = order?.customerPhone || "";

  if (order && (!customerName || !customerEmail || !customerPhone)) {
    try {
      const users = await readUsers();
      const user = users.find(u => u.id === order.userId) as {
        email?: string; firstName?: string; lastName?: string; phone?: string;
      } | undefined;
      if (user) {
        customerName = customerName || `${user.firstName || ""} ${user.lastName || ""}`.trim();
        customerEmail = customerEmail || user.email || "";
        customerPhone = customerPhone || user.phone || "";
      }
    } catch { /* ok */ }
  }

  const productNames = order?.productNames || {};
  const allIds = [...(order?.ebookIds || []), ...(order?.formationIds || [])];
  const product = allIds.map(id => productNames[id] || id).join(", ") || "—";

  const ft: FailedTransaction = {
    id: randomUUID(),
    ts: new Date().toISOString(),
    reference: opts.reference,
    transactionId: opts.transactionId,
    sebpayStatus: opts.sebpayStatus,
    amount: opts.amount || order?.amount || 0,
    currency: opts.currency || order?.currency || "XAF",
    customerName,
    customerEmail,
    customerPhone,
    product,
  };

  await mkdir(PRIVATE, { recursive: true });
  await appendFile(FAILED_FILE, JSON.stringify(ft) + "\n", "utf-8");
}

const FIVE_MINUTES_MS = 5 * 60 * 1000;

export async function getAllTransactions(): Promise<UnifiedTransaction[]> {
  const result: UnifiedTransaction[] = [];

  // 1. Réussies — analytics JSONL groupées par référence
  try {
    const sales = await queryAllSales();
    const byRef = new Map<string, typeof sales>();
    for (const s of sales) {
      if (!byRef.has(s.reference)) byRef.set(s.reference, []);
      byRef.get(s.reference)!.push(s);
    }
    for (const [ref, events] of byRef) {
      const first = events[0];
      // Résoudre les noms de produits (utile pour les vieux enregistrements qui ont l'ID comme nom)
      const rawNames = events.map(e => e.productName);
      const needsResolution = rawNames.some(n => /^(eb-|f-)/.test(n));
      const product = needsResolution
        ? await resolveProductNames(rawNames)
        : rawNames.join(", ");
      result.push({
        id: ref,
        ts: first.ts,
        reference: ref,
        customerName: first.customerName,
        customerEmail: first.customerEmail,
        customerPhone: first.customerPhone,
        product,
        amount: events.reduce((sum, e) => sum + e.amount, 0),
        currency: first.currency,
        status: "successful",
      });
    }
  } catch { /* ok */ }

  const successRefs = new Set(result.map(r => r.reference));

  // 2. Échouées — failed-transactions.jsonl
  const failedList = await readFailedTransactions();
  const failedRefs = new Set(failedList.map(f => f.reference));
  for (const f of failedList) {
    result.push({
      id: f.id,
      ts: f.ts,
      reference: f.reference,
      customerName: f.customerName,
      customerEmail: f.customerEmail,
      customerPhone: f.customerPhone,
      product: f.product,
      amount: f.amount,
      currency: f.currency,
      status: f.status === "abandoned" ? "abandoned" : "failed",
      transactionId: f.transactionId,
    });
  }

  // 3. En attente / Abandonnées — pending-orders.json
  try {
    const orders = await readOrders();
    const users = await readUsers();
    const now = Date.now();

    for (const order of orders) {
      if (successRefs.has(order.reference) || failedRefs.has(order.reference)) continue;

      const user = users.find(u => u.id === order.userId) as {
        email?: string; firstName?: string; lastName?: string; phone?: string;
      } | undefined;

      const age = now - new Date(order.createdAt).getTime();
      const status: TransactionStatus = age >= FIVE_MINUTES_MS ? "abandoned" : "pending";

      const storedNames = order.productNames || {};
      const allIds = [...order.ebookIds, ...order.formationIds];
      const resolvedNames = await Promise.all(
        allIds.map(id => storedNames[id] ? Promise.resolve(storedNames[id]) : resolveProductName(id))
      );
      const product = resolvedNames.join(", ") || "—";

      result.push({
        id: order.reference,
        ts: order.createdAt,
        reference: order.reference,
        customerName: order.customerName || `${user?.firstName || ""} ${user?.lastName || ""}`.trim(),
        customerEmail: order.customerEmail || user?.email || "",
        customerPhone: order.customerPhone || user?.phone || "",
        product,
        amount: order.amount,
        currency: order.currency || "XAF",
        status,
        transactionId: order.transactionId,
      });
    }
  } catch { /* ok */ }

  return result.sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());
}
