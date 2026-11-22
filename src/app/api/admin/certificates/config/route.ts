import { NextRequest, NextResponse } from "next/server";
import { readCertConfig, writeCertConfig } from "@/lib/certificate-store";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

function auth(req: NextRequest) {
  const h = req.headers.get("x-admin-password");
  const q = req.nextUrl.searchParams.get("password");
  return h === ADMIN_PASSWORD || q === ADMIN_PASSWORD;
}

export async function GET(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  return NextResponse.json(await readCertConfig());
}

export async function POST(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const body = await req.json();
  const cfg = await readCertConfig();
  const updated = { ...cfg, ...body };
  await writeCertConfig(updated);
  return NextResponse.json(updated);
}
