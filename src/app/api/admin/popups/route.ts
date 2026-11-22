import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import { revalidatePath } from "next/cache";
import path from "path";
import { bannerVersion } from "@/lib/banner-version";

const POPUPS_FILE = path.join(process.cwd(), "private", "popups.json");

export type Popup = {
  id: string;
  name: string;
  enabled: boolean;
  type: "popup" | "banner_top" | "banner_bottom";
  trigger: "immediate" | "delay" | "exit_intent" | "scroll";
  triggerDelay: number;
  triggerScrollPercent: number;
  pages: string[];
  audience: "all" | "new_visitors" | "logged_in" | "not_logged_in";
  showOnce: boolean;
  startDate: string;
  endDate: string;
  title: string;
  content: string;
  ctaText: string;
  ctaUrl: string;
  hasCountdown: boolean;
  countdownEnd: string;
  bgColor: string;
  textColor: string;
  accentColor: string;
  imageUrl: string;
  // Réduction automatique
  discountType: "none" | "percent" | "fixed";
  discountValue: number;
  discountLabel: string;
  // Déclencheur mobile exit intent
  mobileExitDelay: number;
  createdAt: string;
};

async function readPopups(): Promise<Popup[]> {
  try {
    const raw = await readFile(POPUPS_FILE, "utf-8");
    return JSON.parse(raw) as Popup[];
  } catch {
    return [];
  }
}

async function writePopups(popups: Popup[]): Promise<void> {
  await mkdir(path.dirname(POPUPS_FILE), { recursive: true });
  await writeFile(POPUPS_FILE, JSON.stringify(popups, null, 2), "utf-8");
}

function checkAuth(req: NextRequest): boolean {
  const h = req.headers.get("x-admin-password");
  return h !== null && (h === process.env.ADMIN_PASSWORD);
}

// GET — return all popups (admin)
export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const popups = await readPopups();
  return NextResponse.json(popups, {
    headers: { "Cache-Control": "no-store, must-revalidate" },
  });
}

// POST — create or update popup
export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const body = await req.json() as Partial<Popup>;
    const popups = await readPopups();

    if (body.id) {
      // Update existing
      const idx = popups.findIndex((p) => p.id === body.id);
      if (idx === -1) {
        return NextResponse.json({ error: "Popup introuvable" }, { status: 404 });
      }
      popups[idx] = { ...popups[idx], ...body } as Popup;
      await writePopups(popups);
      bannerVersion.bump();
      revalidatePath("/", "layout");
      return NextResponse.json({ success: true, popup: popups[idx] });
    } else {
      // Create new
      const newPopup: Popup = {
        id: crypto.randomUUID(),
        name: body.name ?? "Nouveau popup",
        enabled: body.enabled ?? false,
        type: body.type ?? "popup",
        trigger: body.trigger ?? "immediate",
        triggerDelay: body.triggerDelay ?? 3,
        triggerScrollPercent: body.triggerScrollPercent ?? 50,
        pages: body.pages ?? ["all"],
        audience: body.audience ?? "all",
        showOnce: body.showOnce ?? false,
        startDate: body.startDate ?? "",
        endDate: body.endDate ?? "",
        title: body.title ?? "",
        content: body.content ?? "",
        ctaText: body.ctaText ?? "",
        ctaUrl: body.ctaUrl ?? "",
        hasCountdown: body.hasCountdown ?? false,
        countdownEnd: body.countdownEnd ?? "",
        bgColor: body.bgColor ?? "#1a1a2e",
        textColor: body.textColor ?? "#ffffff",
        accentColor: body.accentColor ?? "#E8B800",
        imageUrl: body.imageUrl ?? "",
        discountType: body.discountType ?? "none",
        discountValue: body.discountValue ?? 0,
        discountLabel: body.discountLabel ?? "",
        mobileExitDelay: body.mobileExitDelay ?? 8,
        createdAt: new Date().toISOString(),
      };
      popups.push(newPopup);
      await writePopups(popups);
      bannerVersion.bump();
      revalidatePath("/", "layout");
      return NextResponse.json({ success: true, popup: newPopup });
    }
  } catch {
    return NextResponse.json({ error: "Erreur sauvegarde" }, { status: 500 });
  }
}

// DELETE — delete popup by id
export async function DELETE(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id requis" }, { status: 400 });
  }

  const popups = await readPopups();
  const filtered = popups.filter((p) => p.id !== id);
  if (filtered.length === popups.length) {
    return NextResponse.json({ error: "Popup introuvable" }, { status: 404 });
  }
  await writePopups(filtered);
  bannerVersion.bump();
  revalidatePath("/", "layout");
  return NextResponse.json({ success: true });
}
