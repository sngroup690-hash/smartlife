import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";

const FILE = path.join(process.cwd(), "private", "invoices.json");

export type InvoiceProduct = {
  name: string;
  type: "ebook" | "formation" | "autre";
};

export type InvoiceRecord = {
  id: string;
  reference: string;
  clientName: string;
  clientEmail: string;
  products: InvoiceProduct[];
  totalAmount: number;
  currency: string;
  createdAt: string;
};

async function readInvoices(): Promise<InvoiceRecord[]> {
  try {
    const raw = await readFile(FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeInvoices(data: InvoiceRecord[]) {
  await mkdir(path.dirname(FILE), { recursive: true });
  await writeFile(FILE, JSON.stringify(data, null, 2), "utf-8");
}

export async function createInvoice(
  data: Omit<InvoiceRecord, "id" | "createdAt">
): Promise<InvoiceRecord> {
  const invoices = await readInvoices();
  const year = new Date().getFullYear();
  const yearCount = invoices.filter((inv) => inv.id.startsWith(`SMRT-${year}`)).length;
  const id = `SMRT-${year}-${String(yearCount + 1).padStart(3, "0")}`;
  const invoice: InvoiceRecord = { ...data, id, createdAt: new Date().toISOString() };
  invoices.push(invoice);
  await writeInvoices(invoices);
  return invoice;
}
