import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";

const FILE = path.join(process.cwd(), "private", "admin-notifications.json");
const ADMIN_PW = process.env.ADMIN_PASSWORD;

type AdminNotif = {
  id: string;
  type: string;
  affiliateName: string;
  code: string;
  amount: number;
  payoutInfo: { method: string; operator?: string; number?: string };
  requestedAt: string;
  read: boolean;
};

async function read(): Promise<AdminNotif[]> {
  try { return JSON.parse(await readFile(FILE, "utf-8")); }
  catch { return []; }
}

async function write(list: AdminNotif[]) {
  await mkdir(path.dirname(FILE), { recursive: true });
  await writeFile(FILE, JSON.stringify(list, null, 2), "utf-8");
}

export async function GET(req: NextRequest) {
  if (req.headers.get("x-admin-password") !== ADMIN_PW)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const list = await read();
  const unread = list.filter((n) => !n.read);
  return NextResponse.json({ notifications: unread, total: unread.length });
}

export async function PATCH(req: NextRequest) {
  if (req.headers.get("x-admin-password") !== ADMIN_PW)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { ids } = await req.json() as { ids?: string[] };
  const list = await read();
  list.forEach((n) => {
    if (!ids || ids.includes(n.id)) n.read = true;
  });
  await write(list);
  return NextResponse.json({ ok: true });
}
