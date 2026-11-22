import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";

const FILE = path.join(process.cwd(), "private", "invoice-config.json");

export type InvoiceConfig = {
  companyName: string;
  slogan: string;
  website: string;
  supportEmail: string;
  phone: string;
  confirmationMessage: string;
  legalMention: string;
  primaryColor: string;
};

export const DEFAULT_INVOICE_CONFIG: InvoiceConfig = {
  companyName: "SMART LIFE",
  slogan: "La plateforme des entrepreneurs africains",
  website: "smartlifecm.com",
  supportEmail: "support@smartlifecm.com",
  phone: "+237 694 176 642",
  confirmationMessage: "Paiement confirme - Merci pour votre achat !",
  legalMention: "Ce document est une facture electronique valant justificatif de paiement.",
  primaryColor: "#E8B800",
};

export async function readInvoiceConfig(): Promise<InvoiceConfig> {
  try {
    const raw = await readFile(FILE, "utf-8");
    return { ...DEFAULT_INVOICE_CONFIG, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_INVOICE_CONFIG };
  }
}

export async function writeInvoiceConfig(cfg: InvoiceConfig): Promise<void> {
  await mkdir(path.dirname(FILE), { recursive: true });
  await writeFile(FILE, JSON.stringify(cfg, null, 2), "utf-8");
}
