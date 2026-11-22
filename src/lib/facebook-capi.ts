// Utilitaire Facebook Conversions API — côté serveur uniquement
// Documentation : https://developers.facebook.com/docs/marketing-api/conversions-api

import { createHash } from "crypto";
import { readFile } from "fs/promises";
import path from "path";

const PIXELS_CONFIG_FILE = path.join(process.cwd(), "private", "pixels-config.json");

function sha256(str: string): string {
  return createHash("sha256").update(str.toLowerCase().trim()).digest("hex");
}

function normalizePhone(phone: string): string {
  // Garder uniquement les chiffres
  return phone.replace(/\D/g, "");
}

export type CapiUserData = {
  email?: string;
  phone?: string;
  clientIp?: string;
  userAgent?: string;
  fbp?: string;
  fbc?: string;
};

export type CapiEventData = {
  value?: number;
  currency?: string;
  contentIds?: string[];
  contentType?: string;
  numItems?: number;
};

async function getConfig(): Promise<{ pixelId: string; capiToken: string } | null> {
  try {
    const raw = await readFile(PIXELS_CONFIG_FILE, "utf-8");
    const cfg = JSON.parse(raw) as {
      facebook?: { pixelId?: string; capiToken?: string };
    };
    const pixelId = cfg.facebook?.pixelId;
    // Priorité : config fichier, sinon variable d'environnement
    const capiToken = cfg.facebook?.capiToken?.startsWith("****")
      ? undefined
      : (cfg.facebook?.capiToken || process.env.FACEBOOK_CAPI_TOKEN);
    if (!pixelId || !capiToken) return null;
    return { pixelId, capiToken };
  } catch {
    return null;
  }
}

export async function sendCapiEvent(
  eventName: string,
  eventId: string,
  userData: CapiUserData = {},
  eventData: CapiEventData = {},
  actionSource: "website" | "email" | "system_generated" = "website"
): Promise<void> {
  const config = await getConfig();
  if (!config) {
    console.log(`[CAPI] Token non configuré — ${eventName} (${eventId}) ignoré`);
    return;
  }

  // Données utilisateur avec hash SHA-256 (obligatoire par Facebook)
  const userDataPayload: Record<string, unknown> = {};
  if (userData.email) userDataPayload.em = [sha256(userData.email)];
  if (userData.phone) {
    const normalized = normalizePhone(userData.phone);
    if (normalized.length >= 6) userDataPayload.ph = [sha256(normalized)];
  }
  if (userData.clientIp) userDataPayload.client_ip_address = userData.clientIp;
  if (userData.userAgent) userDataPayload.client_user_agent = userData.userAgent;
  if (userData.fbp) userDataPayload.fbp = userData.fbp;
  if (userData.fbc) userDataPayload.fbc = userData.fbc;

  const customData: Record<string, unknown> = {};
  if (eventData.value !== undefined) customData.value = eventData.value;
  if (eventData.currency) customData.currency = eventData.currency;
  if (eventData.contentIds?.length) {
    customData.content_ids = eventData.contentIds;
    customData.content_type = eventData.contentType ?? "product";
  }
  if (eventData.numItems !== undefined) customData.num_items = eventData.numItems;

  const payload = {
    data: [{
      event_name: eventName,
      event_time: Math.floor(Date.now() / 1000),
      event_id: eventId,
      action_source: actionSource,
      user_data: userDataPayload,
      custom_data: customData,
    }],
  };

  const url = `https://graph.facebook.com/v19.0/${config.pixelId}/events?access_token=${config.capiToken}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await res.json() as Record<string, unknown>;
    if (res.ok) {
      console.log(`[CAPI] ✅ ${eventName} — event_id=${eventId} events_received=${result.events_received ?? "?"}`);
    } else {
      console.error(`[CAPI] ❌ ${eventName} échec:`, JSON.stringify(result).slice(0, 200));
    }
  } catch (err) {
    console.error(`[CAPI] Erreur réseau ${eventName}:`, err);
  }
}
