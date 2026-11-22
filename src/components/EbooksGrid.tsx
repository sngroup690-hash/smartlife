"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Search, X, Sparkles } from "lucide-react";
import { Ebook } from "@/lib/data";
import { useCatalogueStore } from "@/lib/catalogue-store";
import EbookCard from "@/components/EbookCard";

function SkeletonCard() {
  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden flex flex-col shadow-sm animate-pulse">
      <div className="w-full aspect-square bg-gray-200" />
      <div className="p-4 flex flex-col flex-1 gap-3">
        <div className="flex items-center justify-between">
          <div className="h-5 w-28 bg-gray-200 rounded-full" />
          <div className="h-4 w-16 bg-gray-200 rounded-full" />
        </div>
        <div className="space-y-1.5">
          <div className="h-4 w-full bg-gray-200 rounded" />
          <div className="h-4 w-4/5 bg-gray-200 rounded" />
        </div>
        <div className="space-y-1.5 flex-1">
          <div className="h-3 w-full bg-gray-100 rounded" />
          <div className="h-3 w-full bg-gray-100 rounded" />
          <div className="h-3 w-2/3 bg-gray-100 rounded" />
        </div>
        <div className="flex gap-0.5 mt-1">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-3 h-3 bg-gray-200 rounded-sm" />
          ))}
        </div>
        <div className="h-6 w-24 bg-gray-200 rounded-md" />
        <div className="h-9 w-full bg-gray-200 rounded-lg" />
      </div>
    </div>
  );
}

interface Props {
  staticEbooks: Ebook[];
  currentCat?: string;
  initialQuery?: string;
  initialServerData?: ServerData;
}

type ServerData = {
  ebooks: Ebook[];
  overrides: Record<string, Partial<Ebook>>;
  actif: Record<string, boolean>;
};

// ─── Fuzzy search helpers ────────────────────────────────────────────────────

function normalize(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function fuzzyScore(query: string, ebook: Ebook & { keywords?: string }): number {
  if (!query.trim()) return 1;
  const words = normalize(query).split(" ").filter((w) => w.length >= 2);
  if (words.length === 0) return 1;

  const title = normalize(ebook.title);
  const desc = normalize(ebook.description.replace(/<[^>]*>/g, ""));
  const cat = normalize(ebook.category);
  const kw = normalize(ebook.keywords || "");

  let score = 0;

  for (const word of words) {
    const titleWords = title.split(" ");
    const descWords = desc.split(" ");

    // Exact substring match
    if (title.includes(word)) {
      score += 12;
    } else if (titleWords.some((w) => w.startsWith(word) && word.length >= 3)) {
      score += 8;
    }

    if (cat.includes(word)) score += 6;

    if (kw.includes(word)) score += 5;

    if (desc.includes(word)) {
      score += 3;
    } else if (descWords.some((w) => w.startsWith(word) && word.length >= 3)) {
      score += 1;
    }
  }

  // Bonus: all words found in title
  if (words.every((w) => title.includes(w))) score += 15;
  // Bonus: full query is a substring of title
  if (title.includes(normalize(query))) score += 10;

  return score;
}

// ─── Suggestions (top matches while typing) ──────────────────────────────────

function getSuggestions(query: string, ebooks: Ebook[]): Ebook[] {
  if (normalize(query).length < 2) return [];
  return ebooks
    .map((e) => ({ ebook: e, score: fuzzyScore(query, e) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(({ ebook }) => ebook);
}

// ─── Component ───────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

export default function EbooksGrid({ staticEbooks, currentCat, initialQuery, initialServerData }: Props) {
  const { ebookOverrides } = useCatalogueStore();
  const [serverData, setServerData] = useState<ServerData | null>(initialServerData ?? null);
  const [serverLoaded, setServerLoaded] = useState(!!initialServerData);

  // Pagination
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Search state — pré-rempli si navigué depuis la recherche globale
  const [query, setQuery] = useState(initialQuery ?? "");
  const [inputValue, setInputValue] = useState(initialQuery ?? "");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch client uniquement si les données n'ont pas été pré-chargées côté serveur
  useEffect(() => {
    if (initialServerData) return;
    fetch("/api/ebooks?slim=1")
      .then((r) => r.json())
      .then((d) => { setServerData(d); setServerLoaded(true); })
      .catch(() => setServerLoaded(true));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Priorité : données serveur (jamais le localStorage stale)
  const overrides = serverData?.overrides ?? ebookOverrides;
  const actif = serverData?.actif ?? {};
  const dynamicEbooks: Ebook[] = serverData
    ? (serverData.ebooks ?? []).filter((e: Ebook & { actif?: boolean; deletedAt?: string }) => e.actif !== false && !e.deletedAt)
    : [];

  const staticWithOverrides = staticEbooks
    .filter((e) => actif[e.id] !== false)
    .map((e) => ({ ...e, ...(overrides[e.id] || {}) }));

  const dynamicFiltered = dynamicEbooks.filter(
    (e) => !currentCat || currentCat === "Tous" || e.category === currentCat
  );

  // Déduplication : les ebooks statiques (data.ts) peuvent se retrouver aussi dans serverData
  const staticIds = new Set(staticWithOverrides.map((e) => e.id));
  const allEbooks = [
    ...staticWithOverrides,
    ...dynamicFiltered.filter((e) => !staticIds.has(e.id)),
  ];

  // Debounced query update
  const handleInputChange = useCallback((val: string) => {
    setInputValue(val);
    setActiveSuggestion(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setQuery(val), 180);
  }, []);

  // Suggestions based on live input
  const suggestions = getSuggestions(inputValue, allEbooks);

  // Remettre la pagination à zéro quand la catégorie change
  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [currentCat]);

  // Apply search filter
  const displayed = query.trim()
    ? allEbooks
        .map((e) => ({ ebook: e, score: fuzzyScore(query, e) }))
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score)
        .map(({ ebook }) => ebook)
    : allEbooks;

  const isSearching = query.trim().length > 0;

  // La recherche montre tout ; le catalogue normal pagine
  const visibleEbooks = isSearching ? displayed : displayed.slice(0, visibleCount);
  const hasMore = !isSearching && visibleCount < displayed.length;

  function clearSearch() {
    setInputValue("");
    setQuery("");
    setShowSuggestions(false);
    setVisibleCount(PAGE_SIZE);
    inputRef.current?.focus();
  }

  function selectSuggestion(ebook: Ebook) {
    setInputValue(ebook.title);
    setQuery(ebook.title);
    setShowSuggestions(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showSuggestions || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveSuggestion((p) => Math.min(p + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveSuggestion((p) => Math.max(p - 1, -1));
    } else if (e.key === "Enter" && activeSuggestion >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[activeSuggestion]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  }

  return (
    <div>
      {/* ── Barre de recherche ─────────────────────────────────────────── */}
      <div className="relative mb-8">
        <div className="relative flex items-center">
          <Search
            size={18}
            className="absolute left-4 text-gray-400 pointer-events-none z-10"
          />
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder='Rechercher un ebook… ex: "élevage poulet", "finance", "créer entreprise"'
            className="w-full pl-11 pr-12 py-3.5 rounded-2xl border-2 border-gray-200 focus:border-green-500 focus:outline-none bg-white text-gray-900 text-sm font-medium placeholder:text-gray-400 shadow-sm transition-colors"
          />
          {inputValue && (
            <button
              onClick={clearSearch}
              className="absolute right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Suggestions dropdown */}
        {showSuggestions && inputValue.length >= 2 && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100">
              <Sparkles size={13} className="text-green-500" />
              <span className="text-xs text-gray-500 font-medium">Suggestions</span>
            </div>
            {suggestions.map((ebook, i) => (
              <button
                key={ebook.id}
                onMouseDown={() => selectSuggestion(ebook)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-green-50 ${
                  i === activeSuggestion ? "bg-green-50" : ""
                }`}
              >
                {ebook.cover ? (
                  <img
                    src={ebook.cover}
                    alt=""
                    className="w-9 h-9 rounded-lg object-cover flex-shrink-0 border border-gray-100"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-green-600 to-emerald-800 flex-shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-gray-900 truncate">{ebook.title}</p>
                  <p className="text-xs text-gray-500 truncate">{ebook.category}</p>
                </div>
                <Search size={13} className="text-gray-300 flex-shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Compteur de résultats ─────────────────────────────────────── */}
      <p className="text-gray-600 text-sm mb-8">
        {!serverLoaded ? (
          <span className="inline-flex items-center gap-2 text-gray-400">
            <span className="inline-block w-20 h-4 bg-gray-200 rounded animate-pulse" />
          </span>
        ) : isSearching ? (
          displayed.length === 0 ? (
            <span className="text-orange-600 font-medium">
              Aucun résultat pour &laquo;&nbsp;{query}&nbsp;&raquo; — essayez d&apos;autres mots-clés
            </span>
          ) : (
            <>
              <span className="font-bold text-green-700">{displayed.length}</span>
              {" "}résultat{displayed.length > 1 ? "s" : ""} pour &laquo;&nbsp;
              <span className="font-bold">{query}</span>&nbsp;&raquo;
            </>
          )
        ) : (
          <>
            {allEbooks.length} ebook{allEbooks.length > 1 ? "s" : ""} disponible{allEbooks.length > 1 ? "s" : ""}
            {currentCat && currentCat !== "Tous" ? ` dans "${currentCat}"` : ""}
          </>
        )}
      </p>

      {/* ── Grille ───────────────────────────────────────────────────────── */}
      {!serverLoaded && displayed.length === 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : serverLoaded && displayed.length === 0 && isSearching ? (
        <div className="text-center py-24">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-gray-800 font-bold text-xl mb-2">Aucun ebook trouvé</h3>
          <p className="text-gray-500 mb-4">
            Essayez d&apos;autres mots-clés ou parcourez les catégories ci-dessus
          </p>
          <button
            onClick={clearSearch}
            className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-sm transition-colors"
          >
            Voir tous les ebooks
          </button>
        </div>
      ) : serverLoaded && displayed.length === 0 ? (
        <div className="text-center py-24">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-gray-800 font-bold text-xl mb-2">Aucun ebook trouvé</h3>
          <p className="text-gray-500">Essayez une autre catégorie</p>
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {visibleEbooks.map((ebook, i) => (
              <EbookCard key={ebook.id} ebook={ebook} priority={i < 3} />
            ))}
          </div>

          {hasMore && (
            <div className="mt-10 flex flex-col items-center gap-2">
              <button
                onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-2xl text-sm transition-colors shadow-sm"
              >
                Voir plus ({displayed.length - visibleCount} restants)
              </button>
              <p className="text-xs text-gray-400">
                {visibleCount} / {displayed.length} ebooks affichés
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
