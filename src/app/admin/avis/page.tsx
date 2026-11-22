"use client";

import { useState, useEffect } from "react";
import { CheckCircle, XCircle, Clock, Trash2, Star, RefreshCw, Lock } from "lucide-react";

const ADMIN_PWD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? "";

type Review = {
  id: string;
  productId: string;
  productType: "formation" | "ebook" | "accompagnement";
  userId: string;
  userName: string;
  rating: number;
  text: string;
  statut: "en_attente" | "approuve" | "rejete";
  createdAt: string;
};

function StarDisplay({ value }: { value: number }) {
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={s <= value ? "text-[#E8B800]" : "text-gray-300"}>★</span>
      ))}
    </span>
  );
}

function PasswordGate({ onAuth }: { onAuth: () => void }) {
  const [pwd, setPwd] = useState("");
  const [error, setError] = useState(false);

  function handle(e: React.FormEvent) {
    e.preventDefault();
    if (pwd === ADMIN_PWD) { onAuth(); }
    else { setError(true); setPwd(""); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm p-8 bg-white border border-gray-200 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <Lock size={20} className="text-[#E8B800]" />
          <h1 className="text-xl font-bold text-gray-900">Admin — Avis Produits</h1>
        </div>
        <form onSubmit={handle} className="space-y-4">
          <input
            type="password"
            value={pwd}
            onChange={(e) => { setPwd(e.target.value); setError(false); }}
            placeholder="Mot de passe admin"
            autoFocus
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#E8B800]"
          />
          {error && <p className="text-red-500 text-sm">Mot de passe incorrect.</p>}
          <button type="submit" className="w-full py-3 bg-[#E8B800] text-black font-bold rounded-xl">
            Accéder
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AdminAvisPage() {
  const [authed, setAuthed] = useState(false);

  if (!authed) return <PasswordGate onAuth={() => setAuthed(true)} />;

  return <AvisPanel />;
}

function AvisPanel() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"tous" | "en_attente" | "approuve" | "rejete">("en_attente");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function loadReviews() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/reviews", {
        headers: { "x-admin-password": ADMIN_PWD },
      });
      const data = await res.json();
      if (Array.isArray(data.reviews)) {
        setReviews(data.reviews.sort((a: Review, b: Review) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ));
      }
    } catch {
      setError("Erreur lors du chargement des avis.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadReviews(); }, []);

  async function handleModerate(id: string, statut: "approuve" | "rejete") {
    setActionLoading(id + statut);
    try {
      await fetch("/api/admin/reviews", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": ADMIN_PWD,
        },
        body: JSON.stringify({ id, statut }),
      });
      setReviews((prev) => prev.map((r) => r.id === id ? { ...r, statut } : r));
    } catch {
      setError("Erreur lors de la modération.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer définitivement cet avis ?")) return;
    setActionLoading(id + "delete");
    try {
      await fetch("/api/admin/reviews", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": ADMIN_PWD,
        },
        body: JSON.stringify({ id }),
      });
      setReviews((prev) => prev.filter((r) => r.id !== id));
    } catch {
      setError("Erreur lors de la suppression.");
    } finally {
      setActionLoading(null);
    }
  }

  const filtered = reviews.filter((r) => filter === "tous" || r.statut === filter);
  const counts = {
    tous: reviews.length,
    en_attente: reviews.filter((r) => r.statut === "en_attente").length,
    approuve: reviews.filter((r) => r.statut === "approuve").length,
    rejete: reviews.filter((r) => r.statut === "rejete").length,
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Modération des avis</h1>
          <p className="text-gray-500 text-sm mt-1">Approuvez ou rejetez les avis clients sur les produits.</p>
        </div>
        <button onClick={loadReviews}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 hover:bg-gray-50 rounded-xl text-sm text-gray-600 transition-all">
          <RefreshCw size={14} /> Actualiser
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>
      )}

      {/* Filtres */}
      <div className="flex gap-2 flex-wrap">
        {(["en_attente", "tous", "approuve", "rejete"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
              filter === f
                ? "bg-gray-900 border-gray-900 text-white"
                : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}>
            {f === "en_attente" ? "En attente" : f === "tous" ? "Tous" : f === "approuve" ? "Approuvés" : "Rejetés"}
            <span className="ml-2 text-xs opacity-70">({counts[f]})</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <span className="w-8 h-8 border-2 border-gray-200 border-t-gray-800 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Star size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Aucun avis dans cette catégorie.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((review) => (
            <div key={review.id}
              className={`p-5 bg-white border rounded-2xl shadow-sm transition-all ${
                review.statut === "en_attente"
                  ? "border-yellow-200 bg-yellow-50/30"
                  : review.statut === "approuve"
                  ? "border-emerald-200 bg-emerald-50/20"
                  : "border-red-200 bg-red-50/20"
              }`}>
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-semibold text-gray-900 text-sm">{review.userName}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      review.productType === "ebook"
                        ? "bg-[#E8B800]/10 text-[#E8B800] border border-[#E8B800]/30"
                        : "bg-blue-50 text-blue-600 border border-blue-200"
                    }`}>
                      {review.productType === "ebook" ? "📖 Ebook" : "🎓 Formation"}
                    </span>
                    <span className="text-gray-400 text-xs font-mono">{review.productId}</span>
                  </div>
                  <p className="text-gray-400 text-xs mt-0.5">
                    {new Date(review.createdAt).toLocaleDateString("fr-FR", {
                      day: "numeric", month: "long", year: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </p>
                </div>

                {/* Statut badge */}
                {review.statut === "approuve" && (
                  <span className="flex items-center gap-1 px-2 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-full font-medium">
                    <CheckCircle size={11} /> Approuvé
                  </span>
                )}
                {review.statut === "rejete" && (
                  <span className="flex items-center gap-1 px-2 py-1 bg-red-50 border border-red-200 text-red-600 text-xs rounded-full font-medium">
                    <XCircle size={11} /> Rejeté
                  </span>
                )}
                {review.statut === "en_attente" && (
                  <span className="flex items-center gap-1 px-2 py-1 bg-yellow-50 border border-yellow-200 text-yellow-600 text-xs rounded-full font-medium">
                    <Clock size={11} /> En attente
                  </span>
                )}
              </div>

              {/* Note + avis */}
              <div className="flex items-center gap-2 mb-2">
                <StarDisplay value={review.rating} />
                <span className="text-gray-500 text-xs">({review.rating}/5)</span>
              </div>
              {review.text && (
                <p className="text-gray-700 text-sm bg-white border border-gray-100 rounded-xl p-3 leading-relaxed mb-4">
                  &ldquo;{review.text}&rdquo;
                </p>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 flex-wrap">
                {review.statut !== "approuve" && (
                  <button
                    onClick={() => handleModerate(review.id, "approuve")}
                    disabled={actionLoading === review.id + "approuve"}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-bold rounded-lg transition-colors">
                    {actionLoading === review.id + "approuve"
                      ? <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                      : <CheckCircle size={12} />}
                    Approuver
                  </button>
                )}
                {review.statut !== "rejete" && (
                  <button
                    onClick={() => handleModerate(review.id, "rejete")}
                    disabled={actionLoading === review.id + "rejete"}
                    className="flex items-center gap-1.5 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white text-xs font-bold rounded-lg transition-colors">
                    {actionLoading === review.id + "rejete"
                      ? <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                      : <XCircle size={12} />}
                    Rejeter
                  </button>
                )}
                <button
                  onClick={() => handleDelete(review.id)}
                  disabled={actionLoading === review.id + "delete"}
                  className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 disabled:opacity-60 text-gray-500 text-xs font-bold rounded-lg transition-colors ml-auto">
                  {actionLoading === review.id + "delete"
                    ? <span className="w-3 h-3 border border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                    : <Trash2 size={12} />}
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}