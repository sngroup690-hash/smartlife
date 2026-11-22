"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  BarChart2, TrendingUp, Users, ShoppingBag, Eye, Globe, Smartphone, Monitor,
  Tablet, ArrowLeft, RefreshCw, ChevronDown, Award, MapPin, Clock,
  Repeat, UserPlus, Target, Activity,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
type AnalyticsData = {
  totalVisits: number; totalSales: number; totalRevenue: number;
  uniqueBuyers: number; conversionRate: number; avgOrderValue: number; abandonedCarts: number;
  salesByDay: { date: string; count: number; revenue: number }[];
  salesByCountry: { country: string; countryCode: string; count: number; revenue: number }[];
  salesByCity: { country: string; city: string; count: number; revenue: number }[];
  salesByProduct: { productId: string; productType: string; productName: string; count: number; revenue: number }[];
  salesByHour: { hour: number; count: number }[];
  salesByWeekday: { day: number; count: number }[];
  totalCustomers: number; newCustomers: number; returningCustomers: number; retentionRate: number;
  customersByDay: { date: string; count: number }[];
  customersByCountryCity: { country: string; city: string; count: number }[];
  topCustomers: { email: string; name: string; phone: string; country: string; city: string; purchases: number; revenue: number }[];
  visitsByDay: { date: string; count: number }[];
  visitsByCountry: { country: string; countryCode: string; count: number; pct: number }[];
  visitsByCity: { country: string; city: string; count: number; pct: number }[];
  visitsByProduct: { productId: string; productType: string; count: number }[];
  visitsByDevice: { device: string; count: number; pct: number }[];
  visitsBySource: { source: string; count: number; pct: number }[];
  visitsByChannel: { channel: string; count: number; pct: number }[];
  visitsByReferrer: { referrer: string; count: number }[];
  conversionByDevice: { device: string; visits: number; sales: number; rate: number }[];
  conversionByCountry: { country: string; visits: number; sales: number; rate: number }[];
  conversionByProduct: { productId: string; productType: string; productName: string; visits: number; sales: number; rate: number }[];
};

type Tab = "overview" | "ventes" | "visites" | "conversion" | "clients";

// ── Utilitaires ───────────────────────────────────────────────────────────────
function formatPrice(n: number) {
  return Math.round(n).toLocaleString("fr-FR") + " FCFA";
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}
const WEEKDAYS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const DEVICE_ICON: Record<string, React.ReactNode> = {
  mobile: <Smartphone size={13} />, desktop: <Monitor size={13} />, tablet: <Tablet size={13} />,
};

// ── Composants graphiques ─────────────────────────────────────────────────────
function BarRow({ label, value, max, suffix = "", color = "bg-green-500" }: {
  label: string; value: number; max: number; suffix?: string; color?: string;
}) {
  const w = max > 0 ? Math.max(2, (value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-32 text-gray-600 text-xs truncate flex-shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
        <div className={`${color} h-full rounded-full transition-all duration-500`} style={{ width: `${w}%` }} />
      </div>
      <span className="w-20 text-right text-gray-800 font-semibold text-xs flex-shrink-0">{suffix || value}</span>
    </div>
  );
}

function MiniLine({ data, color = "#27A827", valueLabel = "Valeur" }: {
  data: { date: string; value: number; revenue?: number }[];
  color?: string;
  valueLabel?: string;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  if (!data.length) return null;
  const max = Math.max(...data.map(d => d.value), 1);
  const W = 600, H = 80, PX = 8, PY = 6;
  const iw = W - PX * 2, ih = H - PY * 2;
  const pts = data.map((d, i) => ({
    x: PX + (i / Math.max(data.length - 1, 1)) * iw,
    y: PY + ih - (d.value / max) * ih,
  }));
  const pathD = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const fillD = pathD + ` L${pts[pts.length - 1].x},${H} L${pts[0].x},${H} Z`;
  const tip = hovered !== null ? { item: data[hovered], pt: pts[hovered] } : null;
  const xPct = tip ? (tip.pt.x / W) * 100 : 0;
  const yPct = tip ? (tip.pt.y / H) * 100 : 0;
  return (
    <div className="relative select-none">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none">
        <path d={fillD} fill={color} fillOpacity="0.08" />
        <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => (
          <g key={i} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
            <circle cx={p.x} cy={p.y} r="10" fill="transparent" style={{ cursor: "crosshair" }} />
            <circle cx={p.x} cy={p.y} r={hovered === i ? 4 : 3} fill={color} />
          </g>
        ))}
      </svg>
      {tip && (
        <div
          className="absolute z-20 pointer-events-none bg-white text-gray-800 text-xs rounded-lg px-2.5 py-1.5 shadow-md whitespace-nowrap"
          style={{
            left: `${xPct}%`,
            top: `${yPct}%`,
            transform: `translate(${xPct < 15 ? "0" : xPct > 85 ? "-100%" : "-50%"}, calc(-100% - 8px))`,
            border: `1px solid ${color}55`,
          }}>
          <div className="font-semibold text-gray-400 mb-0.5">{formatDate(tip.item.date)}</div>
          <div className="text-gray-700">{valueLabel} : <span className="font-bold" style={{ color }}>{tip.item.value}</span></div>
          {tip.item.revenue !== undefined && (
            <div className="text-gray-700">CA : <span className="font-bold text-green-600">{formatPrice(tip.item.revenue)}</span></div>
          )}
        </div>
      )}
    </div>
  );
}

function HeatmapBar({ data, max, label }: { data: number[]; max: number; label: (i: number) => string }) {
  return (
    <div className="flex gap-1">
      {data.map((v, i) => {
        const intensity = max > 0 ? v / max : 0;
        const bg = intensity > 0.7 ? "bg-green-600" : intensity > 0.4 ? "bg-green-400" : intensity > 0.1 ? "bg-green-200" : "bg-gray-100";
        return (
          <div key={i} className="flex flex-col items-center gap-1 flex-1">
            <div className={`${bg} rounded text-center`} style={{ height: 32 + intensity * 20 }} title={`${label(i)}: ${v} ventes`} />
            <span className="text-xs text-gray-500">{label(i)}</span>
          </div>
        );
      })}
    </div>
  );
}

function KpiCard({ icon, label, value, sub, color = "text-green-600" }: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string; color?: string;
}) {
  return (
    <div className="p-5 bg-white border border-gray-200 rounded-2xl shadow-sm">
      <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-3">
        {icon} {label}
      </div>
      <div className={`text-3xl font-extrabold ${color} mb-1`}>{value}</div>
      {sub && <div className="text-gray-400 text-xs">{sub}</div>}
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 mb-5">
      <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">{title}</h3>
      {children}
    </div>
  );
}

// ── Onglets ───────────────────────────────────────────────────────────────────
function OverviewTab({ d }: { d: AnalyticsData }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard icon={<Eye size={14} />} label="Visites totales" value={d.totalVisits.toLocaleString()} color="text-blue-600" />
        <KpiCard icon={<ShoppingBag size={14} />} label="Ventes" value={d.totalSales} sub={formatPrice(d.totalRevenue)} color="text-green-600" />
        <KpiCard icon={<Target size={14} />} label="Taux de conversion" value={`${d.conversionRate}%`} sub={`${d.abandonedCarts} paniers abandonnés`} color="text-orange-500" />
        <KpiCard icon={<Users size={14} />} label="Clients uniques" value={d.uniqueBuyers} sub={`Panier moyen : ${formatPrice(d.avgOrderValue)}`} color="text-purple-600" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SectionCard title="Visites par jour">
          <MiniLine data={d.visitsByDay.map(x => ({ date: x.date, value: x.count }))} color="#3B82F6" valueLabel="Visites" />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>{d.visitsByDay[0]?.date ? formatDate(d.visitsByDay[0].date) : ""}</span>
            <span>{d.visitsByDay[d.visitsByDay.length - 1]?.date ? formatDate(d.visitsByDay[d.visitsByDay.length - 1].date) : ""}</span>
          </div>
        </SectionCard>
        <SectionCard title="Ventes par jour">
          <MiniLine data={d.salesByDay.map(x => ({ date: x.date, value: x.count, revenue: x.revenue }))} color="#27A827" valueLabel="Ventes" />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>{d.salesByDay[0]?.date ? formatDate(d.salesByDay[0].date) : ""}</span>
            <span>{d.salesByDay[d.salesByDay.length - 1]?.date ? formatDate(d.salesByDay[d.salesByDay.length - 1].date) : ""}</span>
          </div>
        </SectionCard>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SectionCard title="Top pays (visites)">
          <div className="space-y-2">
            {d.visitsByCountry.slice(0, 8).map(r => (
              <BarRow key={r.country} label={`🏴 ${r.country}`} value={r.count} max={d.visitsByCountry[0]?.count || 1} suffix={`${r.count} (${r.pct}%)`} color="bg-blue-500" />
            ))}
          </div>
        </SectionCard>
        <SectionCard title="Top pays (ventes)">
          <div className="space-y-2">
            {d.salesByCountry.slice(0, 8).map(r => (
              <BarRow key={r.country} label={`🏴 ${r.country}`} value={r.count} max={d.salesByCountry[0]?.count || 1} suffix={`${r.count} — ${formatPrice(r.revenue)}`} color="bg-green-500" />
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function VentesTab({ d }: { d: AnalyticsData }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard icon={<ShoppingBag size={14} />} label="Total ventes" value={d.totalSales} color="text-green-600" />
        <KpiCard icon={<TrendingUp size={14} />} label="Chiffre d'affaires" value={formatPrice(d.totalRevenue)} color="text-green-600" />
        <KpiCard icon={<Activity size={14} />} label="Panier moyen" value={formatPrice(d.avgOrderValue)} color="text-orange-500" />
        <KpiCard icon={<Repeat size={14} />} label="Taux de rachat" value={`${d.retentionRate}%`} sub={`${d.returningCustomers} clients récurrents`} color="text-purple-600" />
      </div>
      <SectionCard title="Évolution journalière des ventes">
        <MiniLine data={d.salesByDay.map(x => ({ date: x.date, value: x.count, revenue: x.revenue }))} color="#27A827" valueLabel="Ventes" />
        <div className="mt-3 max-h-48 overflow-y-auto">
          <table className="w-full text-xs">
            <thead><tr className="text-gray-400 border-b border-gray-100"><th className="text-left py-1">Date</th><th className="text-right py-1">Ventes</th><th className="text-right py-1">CA</th></tr></thead>
            <tbody>{d.salesByDay.filter(r => r.count > 0).reverse().map(r => (
              <tr key={r.date} className="border-b border-gray-50"><td className="py-1 text-gray-600">{formatDate(r.date)}</td><td className="text-right text-green-600 font-bold">{r.count}</td><td className="text-right text-gray-700">{formatPrice(r.revenue)}</td></tr>
            ))}</tbody>
          </table>
        </div>
      </SectionCard>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SectionCard title="Ventes par pays">
          <div className="space-y-2">
            {d.salesByCountry.map(r => (
              <BarRow key={r.country} label={r.country} value={r.count} max={d.salesByCountry[0]?.count || 1} suffix={`${r.count} — ${formatPrice(r.revenue)}`} />
            ))}
          </div>
        </SectionCard>
        <SectionCard title="Ventes par ville">
          <div className="space-y-2">
            {d.salesByCity.slice(0, 15).map(r => (
              <BarRow key={`${r.country}-${r.city}`} label={`${r.city} (${r.country})`} value={r.count} max={d.salesByCity[0]?.count || 1} suffix={`${r.count} — ${formatPrice(r.revenue)}`} />
            ))}
          </div>
        </SectionCard>
      </div>
      <SectionCard title="Ventes par produit">
        <div className="space-y-2">
          {d.salesByProduct.map(r => (
            <BarRow key={r.productId} label={r.productName || r.productId} value={r.count} max={d.salesByProduct[0]?.count || 1} suffix={`${r.count} — ${formatPrice(r.revenue)}`} color="bg-purple-500" />
          ))}
        </div>
      </SectionCard>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SectionCard title="Jours de pointe (de la semaine)">
          <HeatmapBar data={d.salesByWeekday.map(x => x.count)} max={Math.max(...d.salesByWeekday.map(x => x.count), 1)} label={i => WEEKDAYS[i]} />
        </SectionCard>
        <SectionCard title="Heures de pointe (de la journée)">
          <HeatmapBar data={d.salesByHour.map(x => x.count)} max={Math.max(...d.salesByHour.map(x => x.count), 1)} label={i => `${i}h`} />
        </SectionCard>
      </div>
    </div>
  );
}

function VisitesTab({ d }: { d: AnalyticsData }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <KpiCard icon={<Eye size={14} />} label="Visites totales" value={d.totalVisits.toLocaleString()} color="text-blue-600" />
        <KpiCard icon={<Globe size={14} />} label="Pays uniques" value={d.visitsByCountry.length} color="text-blue-600" />
        <KpiCard icon={<MapPin size={14} />} label="Villes uniques" value={d.visitsByCity.length} color="text-blue-600" />
      </div>
      <SectionCard title="Évolution journalière des visites">
        <MiniLine data={d.visitsByDay.map(x => ({ date: x.date, value: x.count }))} color="#3B82F6" valueLabel="Visites" />
      </SectionCard>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SectionCard title="Visites par pays">
          <div className="space-y-2">
            {d.visitsByCountry.map(r => (
              <BarRow key={r.country} label={r.country} value={r.count} max={d.visitsByCountry[0]?.count || 1} suffix={`${r.count} (${r.pct}%)`} color="bg-blue-500" />
            ))}
          </div>
        </SectionCard>
        <SectionCard title="Visites par ville">
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {d.visitsByCity.map(r => (
              <BarRow key={`${r.country}-${r.city}`} label={`${r.city} (${r.country})`} value={r.count} max={d.visitsByCity[0]?.count || 1} suffix={`${r.count} (${r.pct}%)`} color="bg-blue-400" />
            ))}
          </div>
        </SectionCard>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SectionCard title="Appareils">
          {d.visitsByDevice.map(r => (
            <div key={r.device} className="flex items-center gap-3 py-2 border-b border-gray-50">
              <span className="flex items-center gap-1.5 text-gray-600 text-sm capitalize w-24">{DEVICE_ICON[r.device] || <Monitor size={13} />} {r.device}</span>
              <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                <div className="bg-blue-400 h-full rounded-full" style={{ width: `${r.pct}%` }} />
              </div>
              <span className="text-xs text-gray-700 font-bold w-16 text-right">{r.count} ({r.pct}%)</span>
            </div>
          ))}
        </SectionCard>
        <SectionCard title="Sources de trafic">
          <div className="space-y-2">
            {d.visitsBySource.map(r => (
              <BarRow key={r.source} label={r.source} value={r.count} max={d.visitsBySource[0]?.count || 1} suffix={`${r.count} (${r.pct}%)`} color="bg-orange-400" />
            ))}
          </div>
        </SectionCard>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SectionCard title="Canaux">
          <div className="space-y-2">
            {d.visitsByChannel.map(r => (
              <BarRow key={r.channel} label={r.channel} value={r.count} max={d.visitsByChannel[0]?.count || 1} suffix={`${r.count} (${r.pct}%)`} color="bg-violet-400" />
            ))}
          </div>
        </SectionCard>
        <SectionCard title="Referrers (sites sources)">
          <div className="space-y-2">
            {d.visitsByReferrer.map(r => (
              <BarRow key={r.referrer} label={r.referrer} value={r.count} max={d.visitsByReferrer[0]?.count || 1} color="bg-pink-400" />
            ))}
          </div>
        </SectionCard>
      </div>
      <SectionCard title="Visites par page produit">
        <div className="space-y-2">
          {d.visitsByProduct.slice(0, 15).map(r => (
            <BarRow key={r.productId} label={`[${r.productType}] ${r.productId}`} value={r.count} max={d.visitsByProduct[0]?.count || 1} color="bg-teal-400" />
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

function ConversionTab({ d }: { d: AnalyticsData }) {
  return (
    <div className="space-y-5">
      <KpiCard icon={<Target size={14} />} label="Taux de conversion global" value={`${d.conversionRate}%`} sub={`${d.totalSales} ventes sur ${d.totalVisits} visites`} color="text-orange-500" />
      <SectionCard title="Conversion par appareil">
        <table className="w-full text-sm">
          <thead><tr className="text-gray-400 text-xs border-b border-gray-100"><th className="text-left py-2">Appareil</th><th className="text-right py-2">Visites</th><th className="text-right py-2">Ventes</th><th className="text-right py-2">Taux</th></tr></thead>
          <tbody>{d.conversionByDevice.map(r => (
            <tr key={r.device} className="border-b border-gray-50">
              <td className="py-2 capitalize flex items-center gap-1.5">{DEVICE_ICON[r.device] || <Monitor size={13} />}{r.device}</td>
              <td className="text-right text-blue-600">{r.visits}</td>
              <td className="text-right text-green-600 font-bold">{r.sales}</td>
              <td className="text-right"><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${r.rate > 3 ? "bg-green-100 text-green-700" : r.rate > 1 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-600"}`}>{r.rate}%</span></td>
            </tr>
          ))}</tbody>
        </table>
      </SectionCard>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SectionCard title="Conversion par pays">
          <table className="w-full text-xs">
            <thead><tr className="text-gray-400 border-b border-gray-100"><th className="text-left py-1.5">Pays</th><th className="text-right py-1.5">Visites</th><th className="text-right py-1.5">Ventes</th><th className="text-right py-1.5">Taux</th></tr></thead>
            <tbody>{d.conversionByCountry.map(r => (
              <tr key={r.country} className="border-b border-gray-50">
                <td className="py-1.5 text-gray-700">{r.country}</td>
                <td className="text-right text-blue-500">{r.visits}</td>
                <td className="text-right text-green-600 font-bold">{r.sales}</td>
                <td className="text-right"><span className={`px-1.5 py-0.5 rounded text-xs font-bold ${r.rate > 3 ? "bg-green-50 text-green-700" : r.rate > 1 ? "bg-yellow-50 text-yellow-600" : "bg-gray-50 text-gray-500"}`}>{r.rate}%</span></td>
              </tr>
            ))}</tbody>
          </table>
        </SectionCard>
        <SectionCard title="Conversion par produit">
          <table className="w-full text-xs">
            <thead><tr className="text-gray-400 border-b border-gray-100"><th className="text-left py-1.5">Produit</th><th className="text-right py-1.5">Vues</th><th className="text-right py-1.5">Ventes</th><th className="text-right py-1.5">Taux</th></tr></thead>
            <tbody>{d.conversionByProduct.map(r => (
              <tr key={r.productId} className="border-b border-gray-50">
                <td className="py-1.5 text-gray-700 truncate max-w-[120px]">{r.productName || r.productId}</td>
                <td className="text-right text-blue-500">{r.visits}</td>
                <td className="text-right text-green-600 font-bold">{r.sales}</td>
                <td className="text-right"><span className={`px-1.5 py-0.5 rounded text-xs font-bold ${r.rate > 3 ? "bg-green-50 text-green-700" : r.rate > 1 ? "bg-yellow-50 text-yellow-600" : "bg-gray-50 text-gray-500"}`}>{r.rate}%</span></td>
              </tr>
            ))}</tbody>
          </table>
        </SectionCard>
      </div>
    </div>
  );
}

function ClientsTab({ d }: { d: AnalyticsData }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard icon={<Users size={14} />} label="Clients (période)" value={d.totalCustomers} color="text-purple-600" />
        <KpiCard icon={<UserPlus size={14} />} label="Nouveaux clients" value={d.newCustomers} color="text-green-600" />
        <KpiCard icon={<Repeat size={14} />} label="Clients récurrents" value={d.returningCustomers} color="text-blue-600" />
        <KpiCard icon={<Award size={14} />} label="Taux de rétention" value={`${d.retentionRate}%`} color="text-orange-500" />
      </div>
      <SectionCard title="Nouveaux clients par jour">
        <MiniLine data={d.customersByDay.map(x => ({ date: x.date, value: x.count }))} color="#7C3AED" valueLabel="Clients" />
      </SectionCard>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SectionCard title="Clients par pays / ville">
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {d.customersByCountryCity.map(r => (
              <BarRow key={`${r.country}-${r.city}`} label={`${r.city} (${r.country})`} value={r.count} max={d.customersByCountryCity[0]?.count || 1} color="bg-purple-500" />
            ))}
          </div>
        </SectionCard>
        <SectionCard title="🏆 Meilleurs clients">
          <div className="max-h-64 overflow-y-auto">
            <table className="w-full text-xs">
              <thead><tr className="text-gray-400 border-b border-gray-100"><th className="text-left py-1.5">Client</th><th className="text-left py-1.5">Localisation</th><th className="text-right py-1.5">Achats</th><th className="text-right py-1.5">Total</th></tr></thead>
              <tbody>{d.topCustomers.map((c, i) => (
                <tr key={c.email} className="border-b border-gray-50">
                  <td className="py-1.5">
                    <div className="font-semibold text-gray-800">{c.name || c.email}</div>
                    <div className="text-gray-400">{c.email}</div>
                    {c.phone && <div className="text-gray-400">{c.phone}</div>}
                  </td>
                  <td className="text-gray-600">{c.city ? `${c.city}, ` : ""}{c.country}</td>
                  <td className="text-right text-blue-600 font-bold">{c.purchases}</td>
                  <td className="text-right text-green-600 font-bold">{formatPrice(c.revenue)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

// ── Page principale ────────────────────────────────────────────────────────────
const RANGES = [
  { label: "7 jours", days: 7 }, { label: "30 jours", days: 30 },
  { label: "90 jours", days: 90 }, { label: "Personnalisé", days: 0 },
];

function toIso(d: Date) { return d.toISOString().slice(0, 10); }
function daysAgo(n: number) { return toIso(new Date(Date.now() - n * 86400000)); }

export default function AnalyticsPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState("");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<Tab>("overview");
  const [rangeIdx, setRangeIdx] = useState(1);
  const [from, setFrom] = useState(daysAgo(30));
  const [to, setTo] = useState(toIso(new Date()));

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setAuthError("");
    const res = await fetch("/api/admin/login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) { setAuthed(true); }
    else { setAuthError("Mot de passe incorrect"); }
  }

  const fetchData = useCallback(async (f: string, t: string, pw: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics?from=${f}&to=${t}&password=${encodeURIComponent(pw)}`);
      if (res.ok) setData(await res.json());
    } catch { /* silent */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (authed) fetchData(from, to, password);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed]); // chargement initial uniquement

  function selectRange(idx: number) {
    setRangeIdx(idx);
    if (RANGES[idx].days > 0) {
      const newFrom = daysAgo(RANGES[idx].days);
      const newTo = toIso(new Date());
      setFrom(newFrom);
      setTo(newTo);
      fetchData(newFrom, newTo, password);
    }
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-[#f9f8f5] flex items-center justify-center px-4">
        <div className="bg-white border border-gray-200 rounded-2xl shadow p-8 w-full max-w-sm">
          <div className="flex items-center gap-3 mb-6">
            <BarChart2 size={24} className="text-green-600" />
            <h1 className="text-xl font-bold text-gray-900">Analytique SMART LIFE</h1>
          </div>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Mot de passe admin" autoFocus
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 text-sm focus:outline-none focus:border-green-500"
            />
            {authError && <p className="text-red-500 text-xs">{authError}</p>}
            <button type="submit" className="py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-colors">
              Accéder au dashboard
            </button>
          </form>
          <Link href="/admin" className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 mt-4 justify-center">
            <ArrowLeft size={12} /> Retour au panneau admin
          </Link>
        </div>
      </div>
    );
  }

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "overview", label: "Vue d'ensemble", icon: <BarChart2 size={15} /> },
    { key: "ventes", label: "Ventes", icon: <ShoppingBag size={15} /> },
    { key: "visites", label: "Visites", icon: <Eye size={15} /> },
    { key: "conversion", label: "Conversion", icon: <Target size={15} /> },
    { key: "clients", label: "Clients", icon: <Users size={15} /> },
  ];

  return (
    <div className="min-h-screen bg-[#f9f8f5]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="flex items-center gap-1.5 text-gray-400 hover:text-gray-600 text-sm">
              <ArrowLeft size={15} /> Admin
            </Link>
            <span className="text-gray-300">/</span>
            <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <BarChart2 size={18} className="text-green-600" /> Analytique
            </h1>
          </div>
          <button onClick={() => fetchData(from, to, password)} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl text-xs font-medium transition-colors">
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Actualiser
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Plage de dates */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-6 flex items-center gap-3 flex-wrap">
          <span className="text-gray-500 text-sm font-medium flex items-center gap-1.5"><Clock size={14} /> Période :</span>
          <div className="flex gap-1.5 flex-wrap">
            {RANGES.map((r, i) => (
              <button key={r.label} onClick={() => selectRange(i)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${rangeIdx === i ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                {r.label}
              </button>
            ))}
          </div>
          {rangeIdx === 3 && (
            <div className="flex items-center gap-2">
              <input type="date" value={from} max={to}
                onChange={e => { const v = e.target.value; setFrom(v); if (v) fetchData(v, to, password); }}
                className="px-2 py-1 border border-gray-300 rounded-lg text-xs text-gray-700" />
              <span className="text-gray-400 text-xs">→</span>
              <input type="date" value={to} min={from}
                onChange={e => { const v = e.target.value; setTo(v); if (v) fetchData(from, v, password); }}
                className="px-2 py-1 border border-gray-300 rounded-lg text-xs text-gray-700" />
            </div>
          )}
          {!loading && data && (
            <span className="text-xs text-gray-400 ml-auto">
              Du {formatDate(from + "T00:00:00")} au {formatDate(to + "T00:00:00")}
            </span>
          )}
        </div>

        {/* Onglets */}
        <div className="flex gap-1 p-1 bg-white border border-gray-200 rounded-2xl mb-6 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${tab === t.key ? "bg-green-600 text-white shadow-sm" : "text-gray-600 hover:bg-gray-50"}`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Contenu */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {!loading && !data && (
          <div className="text-center py-20 text-gray-400">
            <BarChart2 size={40} className="mx-auto mb-3 opacity-30" />
            <p>Aucune donnée disponible pour cette période.</p>
            <p className="text-xs mt-1">Les visites et ventes seront enregistrées automatiquement.</p>
          </div>
        )}
        {!loading && data && (
          <>
            {tab === "overview" && <OverviewTab d={data} />}
            {tab === "ventes" && <VentesTab d={data} />}
            {tab === "visites" && <VisitesTab d={data} />}
            {tab === "conversion" && <ConversionTab d={data} />}
            {tab === "clients" && <ClientsTab d={data} />}
          </>
        )}
      </div>
    </div>
  );
}
