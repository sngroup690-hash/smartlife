import { NextRequest, NextResponse } from "next/server";
import { readCertificates } from "@/lib/certificate-store";

export async function GET(req: NextRequest) {
  const certId = req.nextUrl.searchParams.get("id");
  if (!certId) return NextResponse.json({ error: "id requis" }, { status: 400 });

  const certs = await readCertificates();
  const cert = certs.find((c) => c.id === certId);

  if (!cert) return NextResponse.json({ valid: false, not_found: true });
  if (!cert.valid) return NextResponse.json({ valid: false, invalidated: true });

  return NextResponse.json({
    valid: true,
    cert: {
      id: cert.id,
      userName: cert.userName,
      formationTitle: cert.formationTitle,
      level: cert.level,
      completedAt: cert.completedAt,
      issuedAt: cert.issuedAt,
      valid: cert.valid,
    },
  });
}
