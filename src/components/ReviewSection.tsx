"use client";
import { useState, useEffect } from "react";
import { Star, MessageSquare, Send, CheckCircle } from "lucide-react";

type Review = {
  id: string;
  userName: string;
  rating: number;
  text: string;
  createdAt?: string;
};

type StaticAvis = {
  nom: string;
  note: number;
  texte: string;
};

type Props = {
  productId: string;
  productType: "formation" | "ebook" | "accompagnement";
  userId: string | null;
  userName: string;
  isPurchased: boolean;
  staticReviews?: StaticAvis[];
  compact?: boolean;
  cardSize?: "small" | "medium" | "large";
  wrapperClassName?: string;
};

const CARD_SIZE_CLS: Record<string, string> = {
  small: "w-52 sm:w-60",
  medium: "w-72 sm:w-80",
  large: "w-96 sm:w-[26rem]",
};

function ReviewCard({ review, cardSize = "medium" }: { review: Review; cardSize?: "small" | "medium" | "large" }) {
  const sizeCls = CARD_SIZE_CLS[cardSize] ?? CARD_SIZE_CLS.medium;
  return (
    <div className={`flex-shrink-0 ${sizeCls} p-5 bg-white border border-gray-200 shadow-sm rounded-2xl flex flex-col gap-4`}>
      {/* Avatar + nom + badge vérifié */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[#E8B800]/20 flex items-center justify-center text-[#E8B800] font-bold text-base flex-shrink-0 select-none">
          {review.userName.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="text-gray-900 font-semibold text-sm truncate">{review.userName}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <CheckCircle size={11} className="text-emerald-400 flex-shrink-0" />
            <span className="text-emerald-400 text-xs font-medium">Vérifié</span>
          </div>
        </div>
      </div>

      {/* Texte */}
      <p className="text-gray-700 text-sm leading-relaxed line-clamp-4 flex-1">
        &ldquo;{review.text}&rdquo;
      </p>

      {/* Note */}
      <div className="flex items-center gap-2 pt-2 border-t border-white/5">
        <div className="flex gap-0.5">
          {[...Array(5)].map((_, j) => (
            <Star
              key={j}
              size={13}
              className={j < Math.round(review.rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-700"}
            />
          ))}
        </div>
        <span className="text-yellow-400 text-xs font-bold">{review.rating}/5</span>
      </div>
    </div>
  );
}

export default function ReviewSection({
  productId, productType, userId, userName, isPurchased, staticReviews = [], compact = false, cardSize = "medium", wrapperClassName,
}: Props) {
  const [serverReviews, setServerReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetch(`/api/reviews?productId=${productId}`)
      .then((r) => r.json())
      .then((d) => setServerReviews(d.reviews ?? []))
      .catch(() => {});
  }, [productId]);

  const allReviews: Review[] = [
    ...staticReviews.map((a, i) => ({
      id: `static-${i}`,
      userName: a.nom,
      rating: a.note,
      text: a.texte,
    })),
    ...serverReviews,
  ];

  const avgRating =
    allReviews.length > 0
      ? allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length
      : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) { setError("Veuillez choisir une note."); return; }
    if (text.trim().length < 10) { setError("L'avis doit contenir au moins 10 caractères."); return; }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, productType, userId, userName, rating, text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setSubmitted(true);
      setShowForm(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'envoi");
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit = isPurchased && !!userId && !submitted;
  const hasReviews = allReviews.length > 0;

  if (!hasReviews && !canSubmit) return null;

  // ── Mode compact (sous le bouton d'achat) ────────────────────────────────────
  if (compact) {
    return (
      <div className="mt-4">
        {hasReviews && (
          <div className="relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#0a0a0f] to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#0a0a0f] to-transparent z-10 pointer-events-none" />
            <div
              className="flex gap-3 animate-marquee-left"
              style={{ width: "max-content", animationDuration: "25s" }}
            >
              {[...allReviews, ...allReviews, ...allReviews].map((review, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-60 p-4 bg-white/[0.03] border border-white/10 rounded-xl"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#E8B800]/20 flex items-center justify-center text-[#E8B800] font-bold text-xs">
                        {review.userName.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-white font-medium text-xs truncate max-w-[80px]">{review.userName}</span>
                    </div>
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, j) => (
                        <Star key={j} size={10} className={j < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-700"} />
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-400 text-xs leading-relaxed line-clamp-3">&ldquo;{review.text}&rdquo;</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {canSubmit && !showForm && (
          <button onClick={() => setShowForm(true)}
            className="mt-3 w-full py-2 border border-white/15 hover:border-[#E8B800]/40 text-gray-400 hover:text-[#E8B800] text-xs font-medium rounded-xl transition-all flex items-center justify-center gap-1.5">
            <MessageSquare size={12} /> Laisser un avis
          </button>
        )}
        {submitted && (
          <div className="mt-3 flex items-center gap-2 text-emerald-400 text-xs p-3 bg-emerald-900/20 rounded-xl border border-emerald-700/30">
            <CheckCircle size={14} /> Merci pour votre avis !
          </div>
        )}
        {canSubmit && showForm && (
          <div className="mt-3 p-4 bg-white/[0.03] border border-white/10 rounded-xl">
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" onClick={() => setRating(n)}
                    onMouseEnter={() => setHoverRating(n)} onMouseLeave={() => setHoverRating(0)}
                    className="transition-transform hover:scale-110">
                    <Star size={22} className={n <= (hoverRating || rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-600"} />
                  </button>
                ))}
              </div>
              <textarea value={text} onChange={(e) => setText(e.target.value)}
                placeholder="Votre avis (min 10 caractères)…" rows={3}
                className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-xl text-white text-xs placeholder-gray-600 focus:outline-none focus:border-[#E8B800] transition-colors resize-none" />
              {error && <p className="text-red-400 text-xs">{error}</p>}
              <div className="flex gap-2">
                <button type="submit" disabled={submitting}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#E8B800] hover:bg-[#D4A600] text-[#101410] text-xs font-semibold rounded-[10px] disabled:opacity-60">
                  <Send size={12} /> {submitting ? "Envoi…" : "Soumettre"}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-white/20 text-gray-400 text-xs rounded-xl hover:bg-white/5">
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    );
  }

  // ── Mode pleine section : marquee animé (comme la page d'accueil) ─────────────
  const copies = allReviews.length < 3 ? 4 : 2;
  const marqueeItems = Array.from({ length: copies }, () => allReviews).flat();

  return (
    <div className={wrapperClassName || "mb-0"}>
      {/* En-tête de section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h2 className="text-xl font-bold text-white uppercase tracking-wider">
            Avis de nos clients
          </h2>
          {allReviews.length > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={15} className={i < Math.round(avgRating) ? "fill-yellow-400 text-yellow-400" : "text-gray-700"} />
                ))}
              </div>
              <span className="text-yellow-400 text-sm font-bold">{avgRating.toFixed(1)}/5</span>
              <span className="text-gray-500 text-sm">— {allReviews.length} avis</span>
            </div>
          )}
        </div>
        {canSubmit && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="self-start sm:self-auto flex items-center gap-2 px-4 py-2.5 border border-white/20 hover:border-[#E8B800]/50 text-gray-400 hover:text-[#E8B800] text-sm rounded-xl transition-all"
          >
            <MessageSquare size={14} /> Laisser un avis
          </button>
        )}
      </div>

      {/* Carousel marquee — défilement horizontal infini */}
      {hasReviews && (
        <div className="relative overflow-hidden py-2">
          {/* Dégradé gauche */}
          <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[#0a0a0f] to-transparent z-10 pointer-events-none" />
          {/* Dégradé droite */}
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#0a0a0f] to-transparent z-10 pointer-events-none" />

          <div
            className="flex gap-4 animate-marquee-left"
            style={{ width: "max-content", animationDuration: "35s" }}
          >
            {marqueeItems.map((review, i) => (
              <ReviewCard key={i} review={review} cardSize={cardSize} />
            ))}
          </div>
        </div>
      )}

      {!hasReviews && !canSubmit && (
        <div className="text-center py-12 text-gray-600">
          <MessageSquare size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Aucun avis pour le moment.</p>
        </div>
      )}

      {/* Confirmation soumission */}
      {submitted && (
        <div className="mt-6 flex items-center gap-3 text-emerald-400 p-4 bg-emerald-900/20 rounded-xl border border-emerald-700/30">
          <CheckCircle size={18} />
          <p className="font-semibold text-sm">Merci pour votre avis !</p>
        </div>
      )}

      {/* Formulaire d'avis */}
      {canSubmit && showForm && (
        <div className="mt-6 p-6 bg-white/[0.03] border border-white/10 rounded-2xl">
          <h3 className="text-white font-semibold mb-4">Partagez votre expérience</h3>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => setRating(n)}
                  onMouseEnter={() => setHoverRating(n)} onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-110">
                  <Star size={28} className={n <= (hoverRating || rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-600"} />
                </button>
              ))}
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Partagez votre expérience (min 10 caractères)…"
              rows={4}
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#E8B800] transition-colors resize-none"
            />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <div className="flex gap-3">
              <button type="submit" disabled={submitting}
                className="flex items-center gap-2 px-6 py-3 bg-[#E8B800] hover:bg-[#D4A600] text-[#101410] font-semibold rounded-[10px] disabled:opacity-60">
                <Send size={16} /> {submitting ? "Envoi…" : "Soumettre mon avis"}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-white/20 text-gray-400 text-sm rounded-xl hover:bg-white/5 transition-colors">
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
