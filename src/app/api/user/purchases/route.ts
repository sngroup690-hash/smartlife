import { NextRequest, NextResponse } from "next/server";
import { readUsers } from "@/lib/purchase-guard";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId requis" }, { status: 400 });

  const users = await readUsers();
  const user = users.find((u) => (u as { id?: string }).id === userId);
  if (!user) return NextResponse.json({ formationsAchetees: [], ebooksAchetes: [] });

  const u = user as { formationsAchetees?: string[]; ebooksAchetes?: string[] };
  return NextResponse.json({
    formationsAchetees: u.formationsAchetees ?? [],
    ebooksAchetes: u.ebooksAchetes ?? [],
  });
}
