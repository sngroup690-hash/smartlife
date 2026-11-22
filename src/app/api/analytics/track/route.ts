import { NextRequest, NextResponse } from "next/server";
import { geoLookup, extractClientIp } from "@/lib/geo";
import { trackVisit } from "@/lib/analytics";

function detectDevice(ua: string): string {
  if (/iPad|Android(?!.*Mobile)/i.test(ua)) return "tablet";
  if (/Mobile|Android|iPhone|iPod|BlackBerry|IEMobile|Windows Phone/i.test(ua)) return "mobile";
  return "desktop";
}

function detectSource(ref: string, utmSrc?: string, utmMed?: string) {
  if (utmMed === "cpc" || utmMed === "paid") return { source: utmSrc || "ads", channel: "payant" };
  if (utmMed === "email") return { source: "email", channel: "email" };
  if (utmMed === "social" || /facebook|instagram|tiktok|twitter|linkedin/i.test(utmSrc || "")) {
    return { source: utmSrc || "social", channel: "social" };
  }
  if (!ref) return { source: "direct", channel: "direct" };
  try {
    const h = new URL(ref).hostname.replace("www.", "");
    if (h.includes("google")) return { source: "Google", channel: "organique" };
    if (h.includes("facebook") || h.includes("fb.com")) return { source: "Facebook", channel: "social" };
    if (h.includes("instagram")) return { source: "Instagram", channel: "social" };
    if (h.includes("tiktok")) return { source: "TikTok", channel: "social" };
    if (h.includes("youtube")) return { source: "YouTube", channel: "social" };
    if (h.includes("twitter") || h.includes("x.com")) return { source: "Twitter/X", channel: "social" };
    if (h.includes("whatsapp")) return { source: "WhatsApp", channel: "social" };
    return { source: h, channel: "référent" };
  } catch { return { source: "autre", channel: "autre" }; }
}

export async function POST(req: NextRequest) {
  try {
    const {
      path, productId, productType, referrer = "", sessionId, utm_source, utm_medium,
      // Géo envoyée par le navigateur (contourne le problème IP serveur)
      clientCountry, clientCountryCode, clientCity,
    } = await req.json();

    const ua = req.headers.get("user-agent") || "";
    const device = detectDevice(ua);
    const { source, channel } = detectSource(referrer, utm_source, utm_medium);

    let geo: { country: string; countryCode: string; city: string };

    // Priorité 1 : données géo fournies par le navigateur (si résolues)
    if (clientCountry && clientCountry !== "Inconnu" && clientCountry !== "Local" && clientCountry !== "unknown") {
      geo = {
        country: clientCountry,
        countryCode: clientCountryCode || "??",
        city: clientCity || clientCountry,
      };
    } else {
      // Priorité 2 : fallback serveur (req.ip ou headers)
      const ip = (req as unknown as { ip?: string }).ip || extractClientIp(req.headers);
      geo = await geoLookup(ip);
    }

    await trackVisit({
      path: path || "/",
      productId, productType,
      ...geo, device, referrer, source, channel,
      sessionId: sessionId || "",
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Analytics track error:", err);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
