import { readFile, writeFile, mkdir, access } from "fs/promises";
import { lock as lockFile } from "proper-lockfile";
import path from "path";
import { geoLookup } from "@/lib/geo";
import { geoFromPhone, isUnknownGeo } from "@/lib/phone-geo";
import { trackSale } from "@/lib/analytics";
import { recordAbandonedTransaction } from "@/lib/transaction-store";
import { applyPromoUsage } from "@/lib/promo-utils";

const USERS_FILE = path.join(process.cwd(), "private", "users.json");
const ORDERS_FILE = path.join(process.cwd(), "private", "pending-orders.json");

export type PendingOrder = {
  reference: string;
  userId: string;
  ebookIds: string[];
  formationIds: string[];
  amount: number;
  createdAt: string;
  transactionId?: string; // ID Sebpay pour vérification directe sans webhook
  // Données analytics (optionnelles — rétrocompat)
  customerIp?: string;
  customerUa?: string;
  customerEmail?: string;
  customerName?: string;
  customerPhone?: string;
  currency?: string;
  productNames?: Record<string, string>;
  // Lien de paiement direct (aucun ebook/formation associé)
  paymentLinkId?: string;
  paymentLinkName?: string;
  // Code promo partenaire utilisé
  promoCode?: string;
  // Parrainage
  referralCode?: string;
  // SmartLife Pass VIP
  vipPlan?: "monthly" | "annual";
};

type User = {
  id: string;
  ebooksAchetes: string[];
  formationsAchetees: string[];
  [key: string]: unknown;
};

export async function readOrders(): Promise<PendingOrder[]> {
  try {
    const raw = await readFile(ORDERS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function writeOrders(orders: PendingOrder[]) {
  await mkdir(path.dirname(ORDERS_FILE), { recursive: true });
  await writeFile(ORDERS_FILE, JSON.stringify(orders, null, 2), "utf-8");
}

let _usersCache: { data: User[]; at: number } | null = null;
const USERS_CACHE_TTL = 2_000;

export async function readUsers(): Promise<User[]> {
  if (_usersCache && Date.now() - _usersCache.at < USERS_CACHE_TTL) return _usersCache.data;
  try {
    const raw = await readFile(USERS_FILE, "utf-8");
    const data: User[] = JSON.parse(raw);
    _usersCache = { data, at: Date.now() };
    return data;
  } catch {
    return [];
  }
}

export async function writeUsers(users: User[]) {
  await mkdir(path.dirname(USERS_FILE), { recursive: true });
  await writeFile(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
  _usersCache = { data: users, at: Date.now() };
}

// Évite les doubles appels concurrents pour la même référence (webhook + success page)
const inFlightConfirm = new Map<string, Promise<boolean>>();

/** Enregistre un achat dans users.json et supprime la commande en attente. */
export async function confirmPurchase(reference: string): Promise<boolean> {
  if (inFlightConfirm.has(reference)) return inFlightConfirm.get(reference)!;
  const p = _doConfirmPurchase(reference);
  inFlightConfirm.set(reference, p);
  p.finally(() => inFlightConfirm.delete(reference));
  return p;
}

async function _doConfirmPurchase(reference: string): Promise<boolean> {
  const orders = await readOrders();
  const order = orders.find((o) => o.reference === reference);
  if (!order) return false;

  // ── Commande VIP ───────────────────────────────────────────────────────────
  if ((order as PendingOrder & { vipPlan?: string }).vipPlan) {
    try {
      const { activateVipSubscription } = await import("@/lib/vip-store");
      const users = await readUsers();
      const user = users.find(u => u.id === order.userId)
        ?? (order.customerEmail ? users.find(u => (u.email as string | undefined)?.toLowerCase() === order.customerEmail!.toLowerCase()) : null);
      await activateVipSubscription({
        userId: order.userId,
        userName: order.customerName || (user ? `${(user.firstName as string) || ""} ${(user.lastName as string) || ""}`.trim() : ""),
        userEmail: order.customerEmail || (user?.email as string) || "",
        userPhone: order.customerPhone,
        plan: (order as PendingOrder & { vipPlan: "monthly" | "annual" }).vipPlan,
        amount: order.amount,
        reference: order.reference,
        gateway: reference.startsWith("VIP_") ? "sebpay" : "cinetpay",
      });
    } catch (e) {
      console.error("VIP activation error:", e);
    }
    // Supprimer la commande en attente
    const remaining = orders.filter(o => o.reference !== reference);
    await writeOrders(remaining);
    return true;
  }

  // Verrou fichier inter-processus pour éviter les race conditions entre workers PM2
  await mkdir(path.dirname(USERS_FILE), { recursive: true });
  try { await access(USERS_FILE); } catch { await writeFile(USERS_FILE, "[]", "utf-8"); }

  let release: (() => Promise<void>) | undefined;
  let users: User[] = [];
  let idx = -1;
  try {
    release = await lockFile(USERS_FILE, {
      retries: { retries: 5, minTimeout: 50, maxTimeout: 300 },
    });
    // Lecture fraîche dans le verrou (bypass cache)
    const raw = await readFile(USERS_FILE, "utf-8").catch(() => "[]");
    users = JSON.parse(raw);

    idx = users.findIndex((u) => u.id === order.userId);
    if (idx === -1 && order.customerEmail) {
      idx = users.findIndex(
        (u) => (u.email as string | undefined)?.toLowerCase() === order.customerEmail!.toLowerCase()
      );
    }
    if (idx === -1) {
      if (!order.customerEmail) { await release?.(); return false; }
      users.push({ id: order.userId, email: order.customerEmail, ebooksAchetes: [], formationsAchetees: [] });
      idx = users.length - 1;
    }

    const existingEbooks: string[] = (users[idx].ebooksAchetes as string[] | undefined)
      ?? (users[idx].ebooksAchetees as string[] | undefined) ?? [];
    const existingForms: string[] = (users[idx].formationsAchetees as string[] | undefined) ?? [];
    users[idx].ebooksAchetes = [...new Set([...existingEbooks, ...order.ebookIds])];
    users[idx].formationsAchetees = [...new Set([...existingForms, ...order.formationIds])];

    await writeFile(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
    _usersCache = { data: users, at: Date.now() };
  } finally {
    await release?.();
  }
  const user = users[idx]!;

  // Créditer le code promo partenaire si présent
  if (order.promoCode) {
    const promoProductNames = Object.values(order.productNames || {});
    if (promoProductNames.length === 0 && order.paymentLinkName) promoProductNames.push(order.paymentLinkName);
    applyPromoUsage(order.promoCode, order.amount, {
      produit: promoProductNames.join(", ") || "Produit",
      reference: order.reference,
    }).catch(() => {});
  }

  // ── Fidélité & Parrainage ───────────────────────────────────────────────────
  try {
    const { addPoints, purchaseAmountToPoints, findUserByReferralCode, debitPoints, markLoyaltyCodeUsed, validateLoyaltyCode } = await import("@/lib/loyalty-store");

    // Créditer points fidélité à l'acheteur (1 pt / 100 XAF)
    const earnedPoints = purchaseAmountToPoints(order.amount);
    if (earnedPoints > 0) {
      await addPoints(order.userId, earnedPoints).catch(() => {});
    }

    // Si un code fidélité PTS-XXXXX a été utilisé → débiter les points
    if (order.promoCode?.startsWith("PTS-")) {
      const loyaltyCode = await validateLoyaltyCode(order.promoCode).catch(() => null);
      if (loyaltyCode) {
        await debitPoints(loyaltyCode.userId, loyaltyCode.pointsUsed).catch(() => {});
        await markLoyaltyCodeUsed(order.promoCode).catch(() => {});
      }
    }

    // Si parrainage → créditer 50 points au parrain
    if (order.referralCode) {
      const parrain = await findUserByReferralCode(order.referralCode).catch(() => null);
      if (parrain) {
        await addPoints(parrain.id, 50).catch(() => {});
      }
    }
  } catch { /* non bloquant */ }

  // Marquer les autres tentatives en attente (même userId, mêmes produits) comme abandonnées
  const duplicates = orders.filter((o) =>
    o.reference !== reference &&
    o.userId === order.userId &&
    (
      o.ebookIds.some(id => order.ebookIds.includes(id)) ||
      o.formationIds.some(id => order.formationIds.includes(id))
    )
  );
  for (const dup of duplicates) {
    await recordAbandonedTransaction({
      reference: dup.reference,
      amount: dup.amount,
      currency: dup.currency || "XAF",
      reason: "abandoned_duplicate",
    }).catch(() => {});
  }
  const dupRefs = new Set(duplicates.map(d => d.reference));

  // Supprimer la commande confirmée + les doublons abandonnés
  await writeOrders(orders.filter((o) => o.reference !== reference && !dupRefs.has(o.reference)));

  // ── Analytics : enregistrer chaque produit vendu ────────────────────────
  try {
    let geo = order.customerIp
      ? await geoLookup(order.customerIp)
      : { country: "Inconnu", countryCode: "??", city: "Inconnu" };

    // Fallback téléphone si GeoIP n'a pas résolu la localisation
    if (isUnknownGeo(geo.country)) {
      const phone = order.customerPhone || (user as { phone?: string }).phone || "";
      const phoneGeo = geoFromPhone(phone);
      if (phoneGeo) geo = phoneGeo;
    }

    const device = order.customerUa
      ? (/iPad|Android(?!.*Mobile)/i.test(order.customerUa) ? "tablet"
        : /Mobile|Android|iPhone|iPod/i.test(order.customerUa) ? "mobile" : "desktop")
      : "unknown";

    const allProductIds = [...order.ebookIds, ...order.formationIds];
    for (const productId of allProductIds) {
      const productType = order.ebookIds.includes(productId) ? "ebook" : "formation";
      const productName = order.productNames?.[productId] || productId;
      await trackSale({
        reference: order.reference,
        productId, productType, productName,
        amount: order.amount / allProductIds.length,
        currency: order.currency || "XAF",
        customerId: order.userId,
        customerEmail: order.customerEmail || user.email as string || "",
        customerName: order.customerName || `${(user as { firstName?: string }).firstName || ""} ${(user as { lastName?: string }).lastName || ""}`.trim() || "",
        customerPhone: order.customerPhone || (user as { phone?: string }).phone || "",
        ...geo, device,
      });
    }
    // Lien de paiement direct (pas d'ebook ni formation)
    if (allProductIds.length === 0 && order.paymentLinkId) {
      await trackSale({
        reference: order.reference,
        productId: order.paymentLinkId,
        productType: "service",
        productName: order.paymentLinkName || "Lien de paiement",
        amount: order.amount,
        currency: order.currency || "XAF",
        customerId: order.userId,
        customerEmail: order.customerEmail || user.email as string || "",
        customerName: order.customerName || `${(user as { firstName?: string }).firstName || ""} ${(user as { lastName?: string }).lastName || ""}`.trim() || "",
        customerPhone: order.customerPhone || (user as { phone?: string }).phone || "",
        ...geo, device,
      });
    }

    // Enregistrer dans recent-activities pour Social Proof (mode réel)
    try {
      const { appendRecentActivity } = await import("@/app/api/social-proof/route");
      const firstName = (order.customerName || "").split(" ")[0] || "Client";
      const prodNames = Object.values(order.productNames || {});
      if (prodNames.length === 0 && order.paymentLinkName) prodNames.push(order.paymentLinkName);
      const produit = prodNames[0] || "Produit";
      const ville = (geo.city && geo.city !== "Inconnu") ? geo.city : "Cameroun";
      await appendRecentActivity({ type: "purchase", prenom: firstName, ville, produit });
    } catch { /* non bloquant */ }
  } catch (err) {
    console.error("Analytics sale tracking error:", err);
  }

  // Fire & forget: cancel cart automations and schedule post-purchase review
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const productTitle =
    Object.values(order.productNames || {}).join(", ") ||
    order.ebookIds.concat(order.formationIds).join(", ");

  fetch(`${appUrl}/api/automations/track`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event: "purchase",
      userId: order.userId,
      email: (user.email as string) || "",
      firstName: (user as { firstName?: string }).firstName || "",
      data: { productTitle },
    }),
  }).catch(() => {});

  fetch(`${appUrl}/api/automations/track`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event: "post_purchase",
      userId: order.userId,
      email: (user.email as string) || "",
      firstName: (user as { firstName?: string }).firstName || "",
      data: {
        productTitle,
        reviewUrl: `${appUrl}/ebooks`,
      },
    }),
  }).catch(() => {});

  return true;
}

/** Vérifie qu'un utilisateur a bien acheté un ebook côté serveur. */
export async function hasEbookAccess(userId: string, ebookId: string, email?: string): Promise<boolean> {
  const users = await readUsers();
  let user = users.find((u) => u.id === userId);
  // Fallback email si l'ID Zustand côté client diffère de l'ID serveur
  if (!user && email) {
    user = users.find((u) => (u.email as string | undefined)?.toLowerCase() === email.toLowerCase());
  }
  if (!user) return false;
  const ebooks: string[] = (user.ebooksAchetes as string[] | undefined)
    ?? (user.ebooksAchetees as string[] | undefined)
    ?? [];
  if (ebooks.includes("*") || ebooks.includes(ebookId)) return true;

  // Fallback analytics — couvre la race condition où users.json n'a pas été mis à jour
  try {
    const { queryAllSales } = await import("@/lib/analytics");
    const sales = await queryAllSales();
    const confirmed = sales.some((s) => s.customerId === userId && s.productId === ebookId);
    if (confirmed) {
      // Réparer users.json silencieusement
      const idx = users.findIndex((u) => u.id === userId);
      if (idx !== -1) {
        const cur = (users[idx].ebooksAchetes as string[] | undefined)
          ?? (users[idx].ebooksAchetees as string[] | undefined) ?? [];
        if (!cur.includes(ebookId)) {
          users[idx].ebooksAchetes = [...cur, ebookId];
          await writeUsers(users).catch(() => {});
        }
      }
      return true;
    }
  } catch { /* ok */ }

  return false;
}

/** Vérifie qu'un utilisateur a bien acheté une formation côté serveur. */
export async function hasFormationAccess(userId: string, formationId: string): Promise<boolean> {
  try {
    const users = await readUsers();
    const user = users.find((u) => u.id === userId);
    if (user) {
      if ((user.formationsAchetees ?? []).includes(formationId)) return true;
    }
  } catch { /* ok */ }

  // Fallback : vérifier dans l'historique des ventes (analytics)
  try {
    const { queryAllSales } = await import("./analytics");
    const sales = await queryAllSales();
    return sales.some(
      (s) => s.customerId === userId && s.productId === formationId
    );
  } catch { /* ok */ }

  return false;
}
