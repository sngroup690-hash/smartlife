import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

const USERS_FILE = path.join(process.cwd(), "private", "users.json");

type User = {
  email: string;
  ebooksAchetes?: string[];
  formationsAchetees?: string[];
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email")?.trim().toLowerCase();
  const ebookIdsParam = searchParams.get("ebookIds") ?? "";
  const formationIdsParam = searchParams.get("formationIds") ?? "";

  if (!email) return NextResponse.json({ owned: [] });

  const ebookIds = ebookIdsParam ? ebookIdsParam.split(",").filter(Boolean) : [];
  const formationIds = formationIdsParam ? formationIdsParam.split(",").filter(Boolean) : [];

  if (ebookIds.length === 0 && formationIds.length === 0) {
    return NextResponse.json({ owned: [] });
  }

  try {
    const raw = await readFile(USERS_FILE, "utf-8");
    const users: User[] = JSON.parse(raw);
    const user = users.find((u) => u.email?.toLowerCase() === email);
    if (!user) return NextResponse.json({ owned: [] });

    const owned: string[] = [];
    for (const id of ebookIds) {
      if (user.ebooksAchetes?.includes(id)) owned.push(id);
    }
    for (const id of formationIds) {
      if (user.formationsAchetees?.includes(id)) owned.push(id);
    }

    return NextResponse.json({ owned });
  } catch {
    return NextResponse.json({ owned: [] });
  }
}
