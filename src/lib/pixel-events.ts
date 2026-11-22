// Utilitaires de tracking pixel — côté client uniquement

type PixelsConfig = {
  facebook: { enabled: boolean; pixelId: string };
  tiktok: { enabled: boolean; pixelId: string };
  googleAds: { enabled: boolean; conversionId: string; conversionLabel: string };
};

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    ttq?: { track: (e: string, p?: Record<string, unknown>) => void; page: () => void };
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
    _pixelConfig?: PixelsConfig;
  }
}

// Attend que fbq soit disponible (max ~5s) avant d'exécuter le callback.
// Nécessaire car fbevents.js se charge de façon asynchrone via PixelManager.
function whenFbq(callback: (fbq: NonNullable<Window["fbq"]>) => void) {
  if (typeof window === "undefined") return;
  if (window.fbq) { callback(window.fbq); return; }
  let attempts = 0;
  const id = setInterval(() => {
    if (window.fbq) { clearInterval(id); callback(window.fbq); }
    else if (++attempts >= 50) clearInterval(id); // abandon après 5s
  }, 100);
}

// Lit les cookies _fbp et _fbc pour les passer au relay CAPI
function getFbCookies(): { fbp?: string; fbc?: string } {
  if (typeof document === "undefined") return {};
  const map: Record<string, string> = {};
  for (const c of document.cookie.split(";")) {
    const [k, v] = c.trim().split("=");
    if (k && v) map[k] = v;
  }
  return { fbp: map["_fbp"], fbc: map["_fbc"] };
}

// Envoie un événement au relay CAPI serveur (fire & forget)
// Le serveur ajoute l'IP et le UA, puis transfère à Facebook CAPI
function sendCapiRelay(
  eventName: string,
  eventId: string,
  value?: number,
  currency?: string,
  contentIds?: string[],
  numItems?: number
) {
  if (typeof window === "undefined") return;
  const { fbp, fbc } = getFbCookies();
  fetch("/api/capi/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ eventName, eventId, value, currency, contentIds, numItems, fbp, fbc }),
  }).catch(() => {});
}

export function pixelViewContent(name: string, id: string, value: number, currency = "XAF") {
  const eventId = `vc_${id}_${Date.now()}`;
  whenFbq((fbq) =>
    fbq("track", "ViewContent",
      { content_name: name, content_ids: [id], content_type: "product", value, currency },
      { eventID: eventId }
    )
  );
  if (typeof window !== "undefined" && window.ttq) {
    window.ttq.track("ViewContent", { content_id: id, content_name: name, value, currency });
  }
  sendCapiRelay("ViewContent", eventId, value, currency, [id]);
}

export function pixelAddToCart(name: string, id: string, value: number, currency = "XAF") {
  const eventId = `atc_${id}_${Date.now()}`;
  whenFbq((fbq) =>
    fbq("track", "AddToCart",
      { content_name: name, content_ids: [id], content_type: "product", value, currency },
      { eventID: eventId }
    )
  );
  if (typeof window !== "undefined" && window.ttq) {
    window.ttq.track("AddToCart", { content_id: id, content_name: name, value, currency });
  }
  sendCapiRelay("AddToCart", eventId, value, currency, [id]);
}

export function pixelInitiateCheckout(
  value: number,
  currency = "XAF",
  productIds: string[] = [],
  numItems = 1
) {
  const eventId = `ic_${Date.now()}`;
  whenFbq((fbq) =>
    fbq("track", "InitiateCheckout",
      { value, currency, content_ids: productIds, content_type: "product", num_items: numItems },
      { eventID: eventId }
    )
  );
  if (typeof window !== "undefined" && window.ttq) {
    window.ttq.track("InitiateCheckout", { value, currency });
  }
  sendCapiRelay("InitiateCheckout", eventId, value, currency, productIds, numItems);
}

// eventId optionnel — passé depuis la page success pour déduplication avec la CAPI webhook
export function pixelPurchase(
  value: number,
  currency = "XAF",
  productIds: string[] = [],
  eventId?: string
) {
  const eid = eventId ?? `pur_${Date.now()}`;
  whenFbq((fbq) =>
    fbq("track", "Purchase",
      { value, currency, content_ids: productIds, content_type: "product" },
      { eventID: eid }
    )
  );
  if (typeof window !== "undefined") {
    if (window.ttq) {
      window.ttq.track("CompletePayment", { value, currency });
    }
    const cfg = window._pixelConfig?.googleAds;
    if (window.gtag && cfg?.conversionId && cfg?.conversionLabel) {
      window.gtag("event", "conversion", {
        send_to: `${cfg.conversionId}/${cfg.conversionLabel}`,
        value,
        currency,
      });
    }
  }
  // Purchase CAPI est envoyé depuis le webhook serveur avec le même eventId
  // Pas de relay client ici pour éviter les doublons non déduplicables (webhook = source fiable)
}
