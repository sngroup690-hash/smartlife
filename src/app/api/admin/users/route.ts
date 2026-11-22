import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { isValidAdminPassword } from "@/lib/admin-auth";

const USERS_FILE = path.join(process.cwd(), "private", "users.json");

export async function GET(req: NextRequest) {
  const pwd = req.headers.get("x-admin-password");
  if (!isValidAdminPassword(pwd)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  let users: Record<string, unknown>[] = [];
  try {
    const raw = await readFile(USERS_FILE, "utf-8");
    users = JSON.parse(raw);
  } catch {
    users = [];
  }

  const safe = users.map(({ password: _pwd, ...u }) => u);
  return NextResponse.json({ users: safe });
}
