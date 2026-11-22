import { NextRequest, NextResponse } from "next/server";
import { readUsers, writeUsers } from "@/lib/purchase-guard";
import { queryAllSales } from "@/lib/analytics";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (!email) return NextResponse.json({ ebookIds: [], formationIds: [] });

  const users = await readUsers();
  const user = users.find(
    (u) => (u.email as string | undefined)?.toLowerCase() === email.toLowerCase()
  );
  if (!user) return NextResponse.json({ ebookIds: [], formationIds: [] });

  let ebookIds: string[] =
    (user.ebooksAchetes as string[] | undefined) ??
    (user.ebooksAchetees as string[] | undefined) ??
    [];
  const formationIds: string[] =
    (user.formationsAchetees as string[] | undefined) ?? [];

  // Fallback analytics — récupère les achats confirmés même si users.json est en retard
  try {
    const sales = await queryAllSales();
    const analyticsEbooks = sales
      .filter((s) => s.customerId === (user.id as string) && s.productType === "ebook")
      .map((s) => s.productId)
      .filter((id): id is string => !!id);
    const merged = [...new Set([...ebookIds, ...analyticsEbooks])];
    if (merged.length > ebookIds.length) {
      // Auto-réparer users.json
      const idx = users.findIndex((u) => u.id === (user.id as string));
      if (idx !== -1) {
        users[idx].ebooksAchetes = merged;
        await writeUsers(users).catch(() => {});
      }
      ebookIds = merged;
    }
  } catch { /* ok */ }

  return NextResponse.json({ ebookIds, formationIds });
}
