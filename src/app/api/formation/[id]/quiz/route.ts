import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

function quizFile(id: string) {
  return path.join(process.cwd(), "private", `quiz-${id}.json`);
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const raw = await readFile(quizFile(id), "utf-8");
    return NextResponse.json({ modules: JSON.parse(raw) });
  } catch {
    return NextResponse.json({ modules: [] });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const pwd = req.nextUrl.searchParams.get("password");
  if (pwd !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  const { modules } = await req.json();
  const file = quizFile(id);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(modules, null, 2), "utf-8");
  return NextResponse.json({ success: true });
}
