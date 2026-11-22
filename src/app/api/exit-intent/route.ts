import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";

const FILE = path.join(process.cwd(), "private", "exit-intent.json");

export type ExitIntentEntry = {
  id: string;
  choice: number;
  choiceLabel: string;
  otherText?: string;
  page: string;
  timestamp: string;
};

type Data = { responses: ExitIntentEntry[] };

async function read(): Promise<Data> {
  try { return JSON.parse(await readFile(FILE, "utf-8")); }
  catch { return { responses: [] }; }
}

async function save(data: Data) {
  await mkdir(path.dirname(FILE), { recursive: true });
  await writeFile(FILE, JSON.stringify(data, null, 2), "utf-8");
}

export async function POST(req: NextRequest) {
  try {
    const { choice, choiceLabel, otherText, page } = await req.json();
    if (!choice || choice < 1 || choice > 4) {
      return NextResponse.json({ error: "invalid choice" }, { status: 400 });
    }
    const data = await read();
    data.responses.push({
      id: crypto.randomUUID(),
      choice,
      choiceLabel: String(choiceLabel || "").slice(0, 200),
      otherText: otherText ? String(otherText).slice(0, 500) : undefined,
      page: String(page || "/").slice(0, 200),
      timestamp: new Date().toISOString(),
    });
    await save(data);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}
