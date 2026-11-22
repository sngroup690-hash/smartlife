import { NextRequest, NextResponse } from "next/server";
import {
  readInvoiceConfig,
  writeInvoiceConfig,
  DEFAULT_INVOICE_CONFIG,
  type InvoiceConfig,
} from "@/lib/invoice-config";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

function auth(req: NextRequest) {
  return req.headers.get("x-admin-password") === ADMIN_PASSWORD;
}

export async function GET(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  return NextResponse.json(await readInvoiceConfig());
}

export async function POST(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const body = await req.json() as Partial<InvoiceConfig>;
  const current = await readInvoiceConfig();
  const updated: InvoiceConfig = {
    companyName:          typeof body.companyName          === "string" ? body.companyName.trim()          : current.companyName,
    slogan:               typeof body.slogan               === "string" ? body.slogan.trim()               : current.slogan,
    website:              typeof body.website              === "string" ? body.website.trim()              : current.website,
    supportEmail:         typeof body.supportEmail         === "string" ? body.supportEmail.trim()         : current.supportEmail,
    phone:                typeof body.phone                === "string" ? body.phone.trim()                : current.phone,
    confirmationMessage:  typeof body.confirmationMessage  === "string" ? body.confirmationMessage.trim()  : current.confirmationMessage,
    legalMention:         typeof body.legalMention         === "string" ? body.legalMention.trim()         : current.legalMention,
    primaryColor:         typeof body.primaryColor         === "string" ? body.primaryColor.trim()         : current.primaryColor,
  };
  if (!updated.companyName) updated.companyName = DEFAULT_INVOICE_CONFIG.companyName;
  await writeInvoiceConfig(updated);
  return NextResponse.json(updated);
}
