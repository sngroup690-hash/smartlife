import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

const DIR = path.join(process.cwd(), "private", "pdf-previews");

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ ebookId: string }> }
) {
  const { ebookId } = await params;
  const safe = ebookId.replace(/[^a-zA-Z0-9_-]/g, "");
  if (!safe) return NextResponse.json({ error: "ID invalide" }, { status: 400 });

  try {
    const buffer = await readFile(path.join(DIR, `${safe}.pdf`));
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Aperçu non disponible" }, { status: 404 });
  }
}
