import { readFile, appendFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const DIR = path.join(process.cwd(), "private", "analytics");

export type VisitEvent = {
  id: string; ts: string;
  path: string;
  productId?: string;
  productType?: string;
  country: string; countryCode: string; city: string;
  device: string; referrer: string; source: string; channel: string;
  sessionId: string;
};

export type SaleEvent = {
  id: string; ts: string;
  reference: string;
  productId: string; productType: string; productName: string;
  amount: number; currency: string;
  customerId: string; customerEmail: string; customerName: string; customerPhone: string;
  country: string; countryCode: string; city: string;
  device: string;
};

function month(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

async function append(file: string, obj: object) {
  await mkdir(path.dirname(file), { recursive: true });
  await appendFile(file, JSON.stringify(obj) + "\n", "utf-8");
}

async function readLines<T>(file: string): Promise<T[]> {
  try {
    return (await readFile(file, "utf-8"))
      .split("\n").filter(Boolean).map(l => JSON.parse(l) as T);
  } catch { return []; }
}

function monthsBetween(from: Date, to: Date): string[] {
  const months: string[] = [];
  const d = new Date(from.getFullYear(), from.getMonth(), 1);
  const end = new Date(to.getFullYear(), to.getMonth(), 1);
  while (d <= end) {
    months.push(month(d));
    d.setMonth(d.getMonth() + 1);
  }
  return months;
}

export async function trackVisit(data: Omit<VisitEvent, "id" | "ts">) {
  await append(
    path.join(DIR, `visits-${month()}.jsonl`),
    { id: randomUUID(), ts: new Date().toISOString(), ...data }
  );
}

export async function trackSale(data: Omit<SaleEvent, "id" | "ts">) {
  await append(
    path.join(DIR, `sales-${month()}.jsonl`),
    { id: randomUUID(), ts: new Date().toISOString(), ...data }
  );
}

export async function queryVisits(from: Date, to: Date): Promise<VisitEvent[]> {
  const all: VisitEvent[] = [];
  for (const m of monthsBetween(from, to)) {
    all.push(...await readLines<VisitEvent>(path.join(DIR, `visits-${m}.jsonl`)));
  }
  return all.filter(e => { const d = new Date(e.ts); return d >= from && d <= to; });
}

export async function querySales(from: Date, to: Date): Promise<SaleEvent[]> {
  const all: SaleEvent[] = [];
  for (const m of monthsBetween(from, to)) {
    all.push(...await readLines<SaleEvent>(path.join(DIR, `sales-${m}.jsonl`)));
  }
  return all.filter(e => { const d = new Date(e.ts); return d >= from && d <= to; });
}

// Toutes les ventes (toutes périodes confondues) pour calcul rétention
export async function queryAllSales(): Promise<SaleEvent[]> {
  const all: SaleEvent[] = [];
  try {
    const { readdir } = await import("fs/promises");
    const files = (await readdir(DIR)).filter(f => f.startsWith("sales-") && f.endsWith(".jsonl"));
    for (const f of files) {
      all.push(...await readLines<SaleEvent>(path.join(DIR, f)));
    }
  } catch { /* dir vide */ }
  return all;
}
