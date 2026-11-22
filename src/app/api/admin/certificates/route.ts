import { NextRequest, NextResponse } from "next/server";
import { readCertificates, writeCertificates } from "@/lib/certificate-store";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

function auth(req: NextRequest) {
  const h = req.headers.get("x-admin-password");
  const q = req.nextUrl.searchParams.get("password");
  return h === ADMIN_PASSWORD || q === ADMIN_PASSWORD;
}

export async function GET(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const certs = await readCertificates();
  return NextResponse.json(certs.slice().reverse());
}

export async function PATCH(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id, valid } = await req.json() as { id: string; valid: boolean };
  const certs = await readCertificates();
  const idx = certs.findIndex((c) => c.id === id);
  if (idx === -1) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  certs[idx].valid = valid;
  await writeCertificates(certs);
  return NextResponse.json(certs[idx]);
}
