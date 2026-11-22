import { NextRequest, NextResponse } from "next/server";
import { queryVisits, querySales, queryAllSales, type VisitEvent, type SaleEvent } from "@/lib/analytics";
import { geoFromPhone, isUnknownGeo } from "@/lib/phone-geo";
import { readFile } from "fs/promises";
import path from "path";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

function dayKey(ts: string) { return ts.slice(0, 10); }
function hourKey(ts: string) { return new Date(ts).getHours(); }
function weekdayKey(ts: string) { return new Date(ts).getDay(); }

function topN<T>(arr: T[], key: (t: T) => number, n = 10): T[] {
  return [...arr].sort((a, b) => key(b) - key(a)).slice(0, n);
}

function pct(v: number, total: number) { return total ? Math.round((v / total) * 100) : 0; }

function groupCount<T>(arr: T[], getKey: (t: T) => string): Record<string, number> {
  const m: Record<string, number> = {};
  for (const item of arr) {
    const k = getKey(item);
    m[k] = (m[k] || 0) + 1;
  }
  return m;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const password = searchParams.get("password") || "";
  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const fromStr = searchParams.get("from") || "";
  const toStr = searchParams.get("to") || "";

  const now = new Date();
  const from = fromStr ? new Date(fromStr + "T00:00:00Z") : new Date(now.getTime() - 30 * 86400000);
  const to = toStr ? new Date(toStr + "T23:59:59Z") : new Date(now.getTime() + 86400000);

  const [visits, sales, allSales] = await Promise.all([
    queryVisits(from, to),
    querySales(from, to),
    queryAllSales(),
  ]);

  // ── Enrichissement géo : fallback téléphone pour les ventes "Inconnu"/"Local" ──
  const enrichedSales = sales.map(s => {
    if (!isUnknownGeo(s.country)) return s;
    const phoneGeo = geoFromPhone(s.customerPhone);
    if (!phoneGeo) return s;
    return { ...s, country: phoneGeo.country, countryCode: phoneGeo.countryCode, city: phoneGeo.city };
  });

  // Visites avec géo connue uniquement (pas de phone disponible côté visites)
  const geoVisits = visits.filter(v => !isUnknownGeo(v.country));

  // ── Pending orders (paniers abandonnés) ──────────────────────────────────
  let abandonedCarts = 0;
  try {
    const raw = await readFile(path.join(process.cwd(), "private", "pending-orders.json"), "utf-8");
    const pending = JSON.parse(raw) as { createdAt: string }[];
    const cutoff = new Date(now.getTime() - 2 * 3600000);
    abandonedCarts = pending.filter(o => new Date(o.createdAt) < cutoff).length;
  } catch { /* pas encore de commandes */ }

  // ── KPIs globaux ──────────────────────────────────────────────────────────
  const totalVisits = visits.length;
  const totalSales = sales.length;
  const totalRevenue = sales.reduce((s, e) => s + e.amount, 0);
  const uniqueBuyers = new Set(sales.map(s => s.customerEmail).filter(Boolean)).size;
  const conversionRate = totalVisits ? parseFloat(((totalSales / totalVisits) * 100).toFixed(2)) : 0;
  const avgOrderValue = totalSales ? Math.round(totalRevenue / totalSales) : 0;

  // ── Rétention ─────────────────────────────────────────────────────────────
  const prevBuyers = new Set(
    allSales.filter(s => new Date(s.ts) < from).map(s => s.customerEmail).filter(Boolean)
  );
  const periodBuyers = new Set(sales.map(s => s.customerEmail).filter(Boolean));
  const returningCustomers = [...periodBuyers].filter(e => prevBuyers.has(e)).length;
  const newCustomers = periodBuyers.size - returningCustomers;
  const retentionRate = periodBuyers.size ? parseFloat(((returningCustomers / periodBuyers.size) * 100).toFixed(1)) : 0;

  // ── Tendances journalières ────────────────────────────────────────────────
  const daySet = new Set<string>();
  for (const d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) daySet.add(d.toISOString().slice(0, 10));

  const vByDay: Record<string, number> = {};
  const sByDay: Record<string, { count: number; revenue: number }> = {};
  const cByDay: Record<string, Set<string>> = {};

  for (const day of daySet) {
    vByDay[day] = 0;
    sByDay[day] = { count: 0, revenue: 0 };
    cByDay[day] = new Set();
  }
  for (const v of visits) { const d = dayKey(v.ts); if (d in vByDay) vByDay[d]++; }
  for (const s of sales) {
    const d = dayKey(s.ts);
    if (d in sByDay) { sByDay[d].count++; sByDay[d].revenue += s.amount; }
    if (s.customerEmail && !prevBuyers.has(s.customerEmail)) {
      if (d in cByDay) cByDay[d].add(s.customerEmail);
    }
  }

  const visitsByDay = Object.entries(vByDay).sort().map(([date, count]) => ({ date, count }));
  const salesByDay = Object.entries(sByDay).sort().map(([date, v]) => ({ date, ...v }));
  const customersByDay = Object.entries(cByDay).sort().map(([date, s]) => ({ date, count: s.size }));

  // ── Géolocalisation visites (géo connue uniquement) ──────────────────────
  const vCountry: Record<string, { count: number; code: string }> = {};
  const vCity: Record<string, { count: number; country: string }> = {};
  for (const v of geoVisits) {
    const ck = v.country;
    if (!vCountry[ck]) vCountry[ck] = { count: 0, code: v.countryCode };
    vCountry[ck].count++;
    const cityK = `${v.country}|||${v.city}`;
    if (!vCity[cityK]) vCity[cityK] = { count: 0, country: v.country };
    vCity[cityK].count++;
  }
  const visitsByCountry = Object.entries(vCountry)
    .sort((a, b) => b[1].count - a[1].count).slice(0, 20)
    .map(([country, v]) => ({ country, countryCode: v.code, count: v.count, pct: pct(v.count, totalVisits) }));
  const visitsByCity = Object.entries(vCity)
    .sort((a, b) => b[1].count - a[1].count).slice(0, 30)
    .map(([k, v]) => {
      const [country, city] = k.split("|||");
      return { country, city, count: v.count, pct: pct(v.count, totalVisits) };
    });

  // ── Géolocalisation ventes (enrichie par fallback téléphone) ─────────────
  const sCountry: Record<string, { count: number; revenue: number; code: string }> = {};
  const sCity: Record<string, { count: number; revenue: number; country: string }> = {};
  for (const s of enrichedSales) {
    if (isUnknownGeo(s.country)) continue; // ignorer si toujours inconnu après fallback
    if (!sCountry[s.country]) sCountry[s.country] = { count: 0, revenue: 0, code: s.countryCode };
    sCountry[s.country].count++; sCountry[s.country].revenue += s.amount;
    const cityK = `${s.country}|||${s.city}`;
    if (!sCity[cityK]) sCity[cityK] = { count: 0, revenue: 0, country: s.country };
    sCity[cityK].count++; sCity[cityK].revenue += s.amount;
  }
  const salesByCountry = Object.entries(sCountry)
    .sort((a, b) => b[1].count - a[1].count).slice(0, 20)
    .map(([country, v]) => ({ country, countryCode: v.code, count: v.count, revenue: v.revenue }));
  const salesByCity = Object.entries(sCity)
    .sort((a, b) => b[1].count - a[1].count).slice(0, 30)
    .map(([k, v]) => {
      const [country, city] = k.split("|||");
      return { country, city, count: v.count, revenue: v.revenue };
    });

  // ── Par produit ───────────────────────────────────────────────────────────
  const sByProduct: Record<string, { count: number; revenue: number; type: string; name: string }> = {};
  for (const s of sales) {
    if (!sByProduct[s.productId]) sByProduct[s.productId] = { count: 0, revenue: 0, type: s.productType, name: s.productName };
    sByProduct[s.productId].count++; sByProduct[s.productId].revenue += s.amount;
  }
  const salesByProduct = Object.entries(sByProduct)
    .sort((a, b) => b[1].count - a[1].count)
    .map(([productId, v]) => ({ productId, productType: v.type, productName: v.name, count: v.count, revenue: v.revenue }));

  const vByProduct: Record<string, { count: number; type: string }> = {};
  for (const v of visits) {
    if (!v.productId) continue;
    if (!vByProduct[v.productId]) vByProduct[v.productId] = { count: 0, type: v.productType || "" };
    vByProduct[v.productId].count++;
  }
  const visitsByProduct = Object.entries(vByProduct)
    .sort((a, b) => b[1].count - a[1].count).slice(0, 20)
    .map(([productId, v]) => ({ productId, productType: v.type, count: v.count }));

  // ── Heures et jours de pointe ─────────────────────────────────────────────
  const hourCounts = Array(24).fill(0) as number[];
  const dayCounts = Array(7).fill(0) as number[];
  for (const s of sales) { hourCounts[hourKey(s.ts)]++; dayCounts[weekdayKey(s.ts)]++; }
  const salesByHour = hourCounts.map((count, hour) => ({ hour, count }));
  const salesByWeekday = dayCounts.map((count, day) => ({ day, count }));

  // ── Appareils ─────────────────────────────────────────────────────────────
  const devCounts = groupCount(visits, v => v.device);
  const visitsByDevice = Object.entries(devCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([device, count]) => ({ device, count, pct: pct(count, totalVisits) }));

  // ── Sources et canaux ─────────────────────────────────────────────────────
  const srcCounts = groupCount(visits, v => v.source || "direct");
  const chCounts = groupCount(visits, v => v.channel || "direct");
  const refCounts = groupCount(visits.filter(v => v.referrer), v => {
    try { return new URL(v.referrer).hostname.replace("www.", ""); } catch { return v.referrer; }
  });
  const visitsBySource = Object.entries(srcCounts)
    .sort((a, b) => b[1] - a[1]).slice(0, 15)
    .map(([source, count]) => ({ source, count, pct: pct(count, totalVisits) }));
  const visitsByChannel = Object.entries(chCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([channel, count]) => ({ channel, count, pct: pct(count, totalVisits) }));
  const visitsByReferrer = Object.entries(refCounts)
    .sort((a, b) => b[1] - a[1]).slice(0, 10)
    .map(([referrer, count]) => ({ referrer, count }));

  // ── Conversion ────────────────────────────────────────────────────────────
  const convByDevice: Record<string, { visits: number; sales: number }> = {};
  for (const v of visits) { if (!convByDevice[v.device]) convByDevice[v.device] = { visits: 0, sales: 0 }; convByDevice[v.device].visits++; }
  for (const s of sales) { const d = s.device || "unknown"; if (!convByDevice[d]) convByDevice[d] = { visits: 0, sales: 0 }; convByDevice[d].sales++; }
  const conversionByDevice = Object.entries(convByDevice)
    .map(([device, v]) => ({ device, visits: v.visits, sales: v.sales, rate: parseFloat(((v.sales / (v.visits || 1)) * 100).toFixed(2)) }));

  const convByCountry: Record<string, { visits: number; sales: number }> = {};
  for (const v of geoVisits) { const k = v.country; if (!convByCountry[k]) convByCountry[k] = { visits: 0, sales: 0 }; convByCountry[k].visits++; }
  for (const s of enrichedSales) {
    if (isUnknownGeo(s.country)) continue;
    const k = s.country; if (!convByCountry[k]) convByCountry[k] = { visits: 0, sales: 0 }; convByCountry[k].sales++;
  }
  const conversionByCountry = Object.entries(convByCountry)
    .sort((a, b) => b[1].sales - a[1].sales).slice(0, 15)
    .map(([country, v]) => ({ country, visits: v.visits, sales: v.sales, rate: parseFloat(((v.sales / (v.visits || 1)) * 100).toFixed(2)) }));

  const convByProduct: Record<string, { visits: number; sales: number; type: string; name: string }> = {};
  for (const v of visits) {
    if (!v.productId) continue;
    if (!convByProduct[v.productId]) convByProduct[v.productId] = { visits: 0, sales: 0, type: v.productType || "", name: v.productId };
    convByProduct[v.productId].visits++;
  }
  for (const s of sales) {
    if (!convByProduct[s.productId]) convByProduct[s.productId] = { visits: 0, sales: 0, type: s.productType, name: s.productName };
    convByProduct[s.productId].sales++;
    convByProduct[s.productId].name = s.productName;
  }
  const conversionByProduct = Object.entries(convByProduct)
    .sort((a, b) => b[1].sales - a[1].sales).slice(0, 15)
    .map(([productId, v]) => ({ productId, productType: v.type, productName: v.name, visits: v.visits, sales: v.sales, rate: parseFloat(((v.sales / (v.visits || 1)) * 100).toFixed(2)) }));

  // ── Clients géo (enrichi par fallback téléphone) ─────────────────────────
  const clientGeo: Record<string, { count: Set<string>; country: string }> = {};
  for (const s of enrichedSales) {
    if (isUnknownGeo(s.country)) continue;
    const k = `${s.country}|||${s.city}`;
    if (!clientGeo[k]) clientGeo[k] = { count: new Set(), country: s.country };
    if (s.customerEmail) clientGeo[k].count.add(s.customerEmail);
  }
  const customersByCountryCity = Object.entries(clientGeo)
    .sort((a, b) => b[1].count.size - a[1].count.size).slice(0, 30)
    .map(([k, v]) => {
      const [country, city] = k.split("|||");
      return { country, city, count: v.count.size };
    });

  // ── Top clients (avec fallback téléphone pour la géo) ────────────────────
  const clientMap: Record<string, { name: string; phone: string; country: string; city: string; purchases: number; revenue: number }> = {};
  for (const s of enrichedSales) {
    const e = s.customerEmail;
    if (!e) continue;
    if (!clientMap[e]) clientMap[e] = { name: s.customerName, phone: s.customerPhone, country: s.country, city: s.city, purchases: 0, revenue: 0 };
    clientMap[e].purchases++;
    clientMap[e].revenue += s.amount;
  }
  const topCustomers = topN(
    Object.entries(clientMap).map(([email, v]) => ({ email, ...v })),
    c => c.purchases,
    20
  );

  return NextResponse.json({
    // Overview
    totalVisits, totalSales, totalRevenue, uniqueBuyers, conversionRate, avgOrderValue, abandonedCarts,
    // Sales
    salesByDay, salesByCountry, salesByCity, salesByProduct, salesByHour, salesByWeekday,
    // Customers
    totalCustomers: periodBuyers.size, newCustomers, returningCustomers, retentionRate,
    customersByDay, customersByCountryCity, topCustomers,
    // Visits
    visitsByDay, visitsByCountry, visitsByCity, visitsByProduct, visitsByDevice, visitsBySource, visitsByChannel, visitsByReferrer,
    // Conversion
    conversionByDevice, conversionByCountry, conversionByProduct,
  });
}
