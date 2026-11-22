import { NextRequest, NextResponse } from "next/server";
import { readUsers } from "@/lib/purchase-guard";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  const phone = req.nextUrl.searchParams.get("phone");

  if (!email && !phone) return NextResponse.json({ found: false });

  const users = await readUsers();

  const clean = (p: string) => p.replace(/[\s\-().+]/g, "");

  let user: Record<string, unknown> | undefined;

  if (email) {
    user = users.find(
      (u) => (u.email as string | undefined)?.toLowerCase() === email.toLowerCase()
    );
  }

  if (!user && phone) {
    const target = clean(phone);
    if (target.length >= 8) {
      user = users.find((u) => {
        const p = clean((u.phone as string | undefined) ?? "");
        return p.length >= 8 && p === target;
      });
    }
  }

  if (!user) return NextResponse.json({ found: false });

  return NextResponse.json({
    found: true,
    hasPassword: !!(user.hasPassword as boolean | undefined),
  });
}
