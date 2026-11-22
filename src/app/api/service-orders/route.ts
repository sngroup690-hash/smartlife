import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const FILE = path.join(process.cwd(), "private", "service-orders.json");

async function readAll(): Promise<Record<string, unknown>[]> {
  try {
    const raw = await readFile(FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeAll(data: unknown[]) {
  await mkdir(path.dirname(FILE), { recursive: true });
  await writeFile(FILE, JSON.stringify(data, null, 2), "utf-8");
}

function generateOrderNumber(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "CMD-";
  for (let i = 0; i < 6; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    serviceId?: string;
    serviceSlug?: string;
    serviceTitle?: string;
    packageName?: string;
    packagePrice?: number;
    details?: Record<string, unknown>;
    contact?: { name?: string; email?: string; phone?: string; preferredContact?: string };
  };

  const { serviceId, serviceSlug, serviceTitle, packageName, packagePrice, details, contact } = body;

  if (!serviceId || !serviceTitle || !contact?.name || !contact?.email || !contact?.phone) {
    return NextResponse.json({ error: "Champs requis manquants." }, { status: 400 });
  }

  const all = await readAll();
  const now = new Date().toISOString();
  const orderNumber = generateOrderNumber();

  const entry: Record<string, unknown> = {
    id: crypto.randomUUID(),
    orderNumber,
    serviceId,
    serviceSlug: serviceSlug ?? serviceId,
    serviceTitle,
    packageName: packageName ?? "",
    packagePrice: packagePrice ?? 0,
    details: details ?? {},
    contact: {
      name: contact.name?.trim(),
      email: contact.email?.trim().toLowerCase(),
      phone: contact.phone?.trim(),
      preferredContact: contact.preferredContact ?? "email",
    },
    statut: "en_attente",
    noteAdmin: "",
    createdAt: now,
    updatedAt: now,
  };

  all.push(entry);
  await writeAll(all);

  return NextResponse.json({ success: true, id: entry.id, orderNumber });
}

export async function GET(req: NextRequest) {
  const pwd = req.nextUrl.searchParams.get("password");
  if (pwd !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  const all = await readAll();
  return NextResponse.json({ orders: all });
}

export async function PATCH(req: NextRequest) {
  const pwd = req.nextUrl.searchParams.get("password");
  const id = req.nextUrl.searchParams.get("id");
  if (pwd !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  if (!id) {
    return NextResponse.json({ error: "ID requis." }, { status: 400 });
  }

  const { statut, noteAdmin } = (await req.json()) as { statut?: string; noteAdmin?: string };
  const all = await readAll();
  const idx = all.findIndex((d) => d.id === id);
  if (idx === -1) {
    return NextResponse.json({ error: "Commande introuvable." }, { status: 404 });
  }

  all[idx] = { ...all[idx], statut, noteAdmin, updatedAt: new Date().toISOString() };
  await writeAll(all);

  return NextResponse.json({ success: true, order: all[idx] });
}
