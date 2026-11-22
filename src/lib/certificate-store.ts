import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";
import type { CertificateRecord, CertificateConfig } from "./certificate-types";
import { DEFAULT_CERT_CONFIG } from "./certificate-types";

export type { CertificateRecord, CertificateConfig };
export { DEFAULT_CERT_CONFIG };

const CERT_FILE = path.join(process.cwd(), "private", "certificates.json");
const CONFIG_FILE = path.join(process.cwd(), "private", "certificate-config.json");

export async function readCertificates(): Promise<CertificateRecord[]> {
  try { return JSON.parse(await readFile(CERT_FILE, "utf-8")); }
  catch { return []; }
}

export async function writeCertificates(data: CertificateRecord[]) {
  await mkdir(path.dirname(CERT_FILE), { recursive: true });
  await writeFile(CERT_FILE, JSON.stringify(data, null, 2), "utf-8");
}

export async function readCertConfig(): Promise<CertificateConfig> {
  try { return { ...DEFAULT_CERT_CONFIG, ...JSON.parse(await readFile(CONFIG_FILE, "utf-8")) }; }
  catch { return { ...DEFAULT_CERT_CONFIG }; }
}

export async function writeCertConfig(cfg: CertificateConfig) {
  await mkdir(path.dirname(CONFIG_FILE), { recursive: true });
  await writeFile(CONFIG_FILE, JSON.stringify(cfg, null, 2), "utf-8");
}

export async function generateCertId(): Promise<string> {
  const certs = await readCertificates();
  const year = new Date().getFullYear();
  const yearCerts = certs.filter((c) => c.id.includes(`-${year}-`));
  const next = String(yearCerts.length + 1).padStart(4, "0");
  return `SL-CERT-${year}-${next}`;
}

export async function issueCertificate(data: Omit<CertificateRecord, "id" | "issuedAt" | "valid">): Promise<CertificateRecord> {
  const certs = await readCertificates();
  // Check existing
  const existing = certs.find(
    (c) => c.userId === data.userId && c.formationId === data.formationId && c.valid
  );
  if (existing) return existing;

  const cert: CertificateRecord = {
    ...data,
    id: await generateCertId(),
    issuedAt: new Date().toISOString(),
    valid: true,
  };
  certs.push(cert);
  await writeCertificates(certs);
  return cert;
}

export function certVerifyToken(certId: string, userId: string): string {
  const secret = process.env.DOWNLOAD_SECRET || process.env.AFFILIATE_SECRET || "sl-cert-2024";
  return crypto.createHmac("sha256", secret).update(`${certId}:${userId}`).digest("hex").slice(0, 16);
}
