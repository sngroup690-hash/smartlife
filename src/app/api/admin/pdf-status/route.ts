import { NextRequest, NextResponse } from "next/server";
import { access } from "fs/promises";
import path from "path";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const password = searchParams.get("password");
  const ebookId = searchParams.get("ebookId");

  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  if (!ebookId) {
    return NextResponse.json({ error: "ebookId manquant" }, { status: 400 });
  }

  const filePath = path.join(process.cwd(), "private", "ebooks", `${ebookId}.pdf`);
  try {
    await access(filePath);
    return NextResponse.json({ exists: true });
  } catch {
    return NextResponse.json({ exists: false });
  }
}
