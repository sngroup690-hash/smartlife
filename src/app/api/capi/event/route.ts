import { NextRequest, NextResponse } from "next/server";
import { sendCapiEvent } from "@/lib/facebook-capi";

// POST /api/capi/event — relay des événements browser vers Facebook CAPI
// Le serveur ajoute l'IP réelle et le User-Agent depuis les headers HTTP
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      eventName: string;
      eventId: string;
      value?: number;
      currency?: string;
      contentIds?: string[];
      numItems?: number;
      fbp?: string;
      fbc?: string;
    };

    if (!body.eventName || !body.eventId) {
      return NextResponse.json({ error: "eventName et eventId requis" }, { status: 400 });
    }

    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      undefined;
    const userAgent = req.headers.get("user-agent") || undefined;

    // Fire & forget — ne pas attendre la réponse CAPI
    sendCapiEvent(
      body.eventName,
      body.eventId,
      { clientIp, userAgent, fbp: body.fbp, fbc: body.fbc },
      {
        value: body.value,
        currency: body.currency,
        contentIds: body.contentIds,
        numItems: body.numItems,
      }
    ).catch(() => {});

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}
