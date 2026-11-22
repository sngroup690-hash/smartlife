"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, TrendingDown, MessageSquare, MapPin, BarChart2 } from "lucide-react";

const ADMIN_PW = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? "";

type Stats = {
  total: number;
  byChoice: { choice: number; label: string; count: number; pct: number }[];
  topPages: { page: string; count: number; pct: number }[];
  otherTexts: { text: string; timestamp: string; page: string }[];
  dailyStats: { date: string; count: number }[];
};

const CHOICE_COLORS = ["#E8B800", "#27A827", "#3b82f6", "#8b5cf6"];
const CHOICE_BG = ["bg-yellow-100", "bg-green-100", "bg-blue-100", "bg-purple-100"];
const CHOICE_TEXT = ["text-yellow-700", "text-green-700", "text-blue-700", "text-purple-700"];
const CHOICE_BAR = ["bg-yellow-400", "bg-green-500", "bg-blue-500", "bg-purple-500"];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

export default function ExitIntentAdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "pages" | "verbatims">("overview");

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/exit-intent", {
      headers: { "x-admin-password": ADMIN_PW },
    });
    if (res.ok) setStats(await res.json());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="min-h-screen bg-[#f9f8f5] p-6">
      {/* Header */}
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
              <ArrowLeft size={16} className="text-gray-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
                <TrendingDown size={22} className="text-red-500" />
                Exit-Intent — Abandons
              </h1>
              <p className="text-gray-500 text-sm mt-0.5">Raisons d&apos;abandon déclarées par les visiteurs</p>
            </div>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Actualiser
          </button>
        </div>

        {loading && (
          <div className="text-center py-20 text-gray-400">Chargement…</div>
        )}

        {!loading && stats && (
          <>
            {/* KPI total */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="col-span-2 md:col-span-1 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                <p className="text-gray-500 text-xs font-medium mb-1">Réponses totales</p>
                <p className="text-4xl font-extrabold text-gray-900">{stats.total}</p>
              </div>
              {stats.byChoice.map((c, i) => (
                <div key={c.choice} className={`${CHOICE_BG[i]} border border-gray-100 rounded-2xl p-5 shadow-sm`}>
                  <p className={`${CHOICE_TEXT[i]} text-xs font-bold mb-1`}>{c.label}</p>
                  <p className={`text-3xl font-extrabold ${CHOICE_TEXT[i]}`}>{c.pct}%</p>
                  <p className={`text-xs ${CHOICE_TEXT[i]} opacity-70`}>{c.count} réponse{c.count > 1 ? "s" : ""}</p>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
              {(["overview", "pages", "verbatims"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    tab === t
                      ? "bg-gray-900 text-white"
                      : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {t === "overview" ? "Répartition" : t === "pages" ? "Pages" : "Verbatims"}
                </button>
              ))}
            </div>

            {/* Tab: Overview — bar chart by choice */}
            {tab === "overview" && (
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <h2 className="text-gray-900 font-bold mb-6 flex items-center gap-2">
                  <BarChart2 size={16} className="text-green-500" />
                  Répartition des raisons d&apos;abandon
                </h2>
                {stats.total === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-8">Aucune donnée pour l&apos;instant. La popup s&apos;activera automatiquement sur le site.</p>
                ) : (
                  <div className="space-y-5">
                    {stats.byChoice.map((c, i) => (
                      <div key={c.choice}>
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-sm font-medium text-gray-700">{c.label}</span>
                          <span className="text-sm font-bold text-gray-900">{c.pct}% <span className="font-normal text-gray-400">({c.count})</span></span>
                        </div>
                        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${CHOICE_BAR[i]} rounded-full transition-all duration-700`}
                            style={{ width: `${c.pct}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Daily trend */}
                {stats.dailyStats.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-gray-100">
                    <h3 className="text-gray-700 font-bold text-sm mb-4">Activité — 30 derniers jours</h3>
                    <div className="flex items-end gap-1 h-20">
                      {(() => {
                        const max = Math.max(...stats.dailyStats.map(d => d.count), 1);
                        return stats.dailyStats.map((d) => (
                          <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group" title={`${d.date}: ${d.count}`}>
                            <div
                              className="w-full bg-green-400 rounded-t-sm group-hover:bg-green-600 transition-colors"
                              style={{ height: `${Math.max((d.count / max) * 64, 2)}px` }}
                            />
                          </div>
                        ));
                      })()}
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>{formatDate(stats.dailyStats[0].date)}</span>
                      <span>{formatDate(stats.dailyStats[stats.dailyStats.length - 1].date)}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Pages */}
            {tab === "pages" && (
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <h2 className="text-gray-900 font-bold mb-6 flex items-center gap-2">
                  <MapPin size={16} className="text-green-500" />
                  Pages avec le plus d&apos;abandons
                </h2>
                {stats.topPages.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-8">Aucune donnée.</p>
                ) : (
                  <div className="space-y-3">
                    {stats.topPages.map((p, i) => (
                      <div key={p.page} className="flex items-center gap-4">
                        <span className="w-6 text-center text-gray-400 text-xs font-bold">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm text-gray-700 font-medium truncate">{p.page}</span>
                            <span className="text-sm font-bold text-gray-900 ml-2 flex-shrink-0">{p.pct}% ({p.count})</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-400 rounded-full" style={{ width: `${p.pct}%` }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab: Verbatims */}
            {tab === "verbatims" && (
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <h2 className="text-gray-900 font-bold mb-6 flex items-center gap-2">
                  <MessageSquare size={16} className="text-green-500" />
                  Réponses libres « Autre » ({stats.otherTexts.length})
                </h2>
                {stats.otherTexts.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-8">Aucun verbatim pour l&apos;instant.</p>
                ) : (
                  <div className="space-y-3">
                    {stats.otherTexts.map((v, i) => (
                      <div key={i} className="p-4 bg-gray-50 border border-gray-100 rounded-xl">
                        <p className="text-gray-800 text-sm">&ldquo;{v.text}&rdquo;</p>
                        <div className="flex gap-3 mt-2 text-xs text-gray-400">
                          <span>{formatDate(v.timestamp)}</span>
                          <span>·</span>
                          <span>{v.page}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}