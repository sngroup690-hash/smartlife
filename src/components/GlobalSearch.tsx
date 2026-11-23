"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Search, X, BookOpen, Play, Wrench, Sparkles, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { ebooks as staticEbooks, services as staticServices, type Ebook, type Service } from "@/lib/data";
import { FORMATIONS, type Formation } from "@/lib/formations-data";
import { fuzzyScore, normalize } from "@/lib/search-utils";

type ResultType = "ebook" | "formation" | "service";

interface ResultItem {
  id: string;
  title: string;
  subtitle: string;
  type: ResultType;
  url: string;
  cover?: string;
  price?: number;
  score: number;
}

const TYPE_LABEL: Record<ResultType, string> = {
  ebook: "Ebook",
  formation: "Formation",
  service: "Service",
};

const TYPE_STYLE: Record<ResultType, string> = {
  ebook: "text-emerald-700 bg-emerald-50",
  formation: "text-blue-700 bg-blue-50",
  service: "text-orange-700 bg-orange-50",
};

const QUICK_SEARCHES = ["élevage", "marketing digital", "facebook ads", "création vidéo", "entrepreneuriat"];
const RECENT_KEY = "sl_recent_searches";
const MAX_RECENT = 5;

function formatPrice(p: number): string {
  return p.toLocaleString("fr-FR") + " FCFA";
}

function loadRecent(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch { return []; }
}

function saveRecent(query: string) {
  try {
    const existing = loadRecent().filter((q) => q !== query);
    localStorage.setItem(RECENT_KEY, JSON.stringify([query, ...existing].slice(0, MAX_RECENT)));
  } catch {}
}

function buildResults(
  query: string,
  allEbooks: Ebook[],
  allFormations: Formation[],
  allServices: Service[]
): ResultItem[] {
  if (normalize(query).length < 2) return [];
  const items: ResultItem[] = [];

  for (const e of allEbooks) {
    const score = fuzzyScore(query, e.title, [
      { text: e.description.replace(/<[^>]*>/g, ""), weight: 3 },
      { text: e.category, weight: 6 },
      { text: (e as Ebook & { keywords?: string }).keywords ?? "", weight: 5 },
    ]);
    if (score > 0)
      items.push({
        id: e.id,
        title: e.title,
        subtitle: e.category,
        type: "ebook",
        url: `/ebooks?q=${encodeURIComponent(e.title)}`,
        cover: e.cover,
        price: e.price,
        score,
      });
  }

  for (const f of allFormations) {
    const score = fuzzyScore(query, f.titre, [
      { text: f.description.replace(/<[^>]*>/g, ""), weight: 3 },
      { text: f.categorie, weight: 6 },
    ]);
    if (score > 0)
      items.push({
        id: f.id,
        title: f.titre,
        subtitle: f.categorie,
        type: "formation",
        url: `/formation/${f.id}`,
        cover: f.cover,
        price: f.prix,
        score,
      });
  }

  for (const s of allServices) {
    const score = fuzzyScore(query, s.title, [
      { text: s.longDescription, weight: 3 },
      { text: s.features.join(" "), weight: 4 },
    ]);
    if (score > 0)
      items.push({
        id: s.id,
        title: s.title,
        subtitle: s.description.slice(0, 60),
        type: "service",
        url: `/services/${s.slug}`,
        price: s.startingPrice,
        score,
      });
  }

  return items.sort((a, b) => b.score - a.score).slice(0, 12);
}

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(-1);
  const [allEbooks, setAllEbooks] = useState<Ebook[]>(staticEbooks);
  // Formations ajoutées seulement si elles sont activées dans l'administration
  const [allFormations, setAllFormations] = useState<Formation[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  const results = useMemo(
    () => buildResults(query, allEbooks, allFormations, staticServices),
    [query, allEbooks, allFormations]
  );

  // Load recent searches each time the overlay opens
  useEffect(() => {
    if (open) setRecentSearches(loadRecent());
  }, [open]);

  // Load dynamic content once on first open
  useEffect(() => {
    if (!open || dataLoaded) return;
    setDataLoaded(true);
    Promise.allSettled([
      fetch("/api/ebooks?slim=1").then((r) => r.json()),
      fetch("/api/site-settings")
        .then((r) => r.json())
        .then((reglages) => (reglages?.formationsActives ? fetch("/api/formations").then((r) => r.json()) : null)),
    ]).then(([ebRes, fRes]) => {
      if (fRes.status === "fulfilled" && fRes.value) setAllFormations([...FORMATIONS]);
      if (ebRes.status === "fulfilled" && Array.isArray(ebRes.value.ebooks)) {
        const dyn = (ebRes.value.ebooks as (Ebook & { actif?: boolean; deletedAt?: string })[])
          .filter((e) => e.actif !== false && !e.deletedAt);
        setAllEbooks((prev) => [
          ...prev,
          ...dyn.filter((e) => !prev.some((p) => p.id === e.id)),
        ]);
      }
      if (fRes.status === "fulfilled" && fRes.value && Array.isArray(fRes.value.formations)) {
        const dyn = (fRes.value.formations as (Formation & { actif?: boolean; deletedAt?: string })[])
          .filter((f) => f.actif !== false && !f.deletedAt);
        setAllFormations((prev) => [
          ...prev,
          ...dyn.filter((f) => !prev.some((p) => p.id === f.id)),
        ]);
      }
    });
  }, [open, dataLoaded]);

  // Focus input on open
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30);
  }, [open]);

  // Escape closes
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]); // eslint-disable-line

  // ⌘K / Ctrl+K shortcut (works everywhere on the page)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Custom event so other components (e.g. BottomNav) can open the search
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("open-global-search", handler);
    return () => window.removeEventListener("open-global-search", handler);
  }, []);

  function close() {
    setOpen(false);
    setInputValue("");
    setQuery("");
    setActiveIdx(-1);
  }

  const handleInput = useCallback((val: string) => {
    setInputValue(val);
    setActiveIdx(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setQuery(val), 180);
  }, []);

  function navigate(url: string, searchQuery?: string) {
    if (searchQuery?.trim()) saveRecent(searchQuery.trim());
    close();
    router.push(url);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((p) => Math.min(p + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((p) => Math.max(p - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIdx >= 0 && results[activeIdx]) {
        navigate(results[activeIdx].url, inputValue);
      } else if (inputValue.trim().length >= 2) {
        navigate(`/ebooks?q=${encodeURIComponent(inputValue.trim())}`, inputValue.trim());
      }
    }
  }

  return (
    <>
      {/* Trigger button — visible on all screen sizes */}
      <button
        onClick={() => setOpen(true)}
        title="Rechercher (⌘K)"
        className="flex items-center gap-1.5 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Search size={20} strokeWidth={1.75} />
        <kbd className="hidden xl:flex items-center text-[10px] text-gray-400 border border-gray-200 rounded px-1.5 py-0.5 font-sans bg-gray-50 leading-none">
          ⌘K
        </kbd>
      </button>

      {/* Overlay */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm"
            onClick={close}
          />

          <div className="fixed inset-x-4 top-[8vh] z-[201] max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">

              {/* Search input */}
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100">
                <Search size={18} className="text-gray-400 shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => handleInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Rechercher ebooks, formations, services…"
                  className="flex-1 text-gray-900 placeholder:text-gray-400 bg-transparent focus:outline-none text-sm font-medium"
                />
                {inputValue ? (
                  <button onClick={() => handleInput("")} className="text-gray-400 hover:text-gray-600 transition-colors">
                    <X size={16} />
                  </button>
                ) : (
                  <kbd
                    onClick={close}
                    className="text-gray-400 text-xs font-bold px-2 py-1 border border-gray-200 rounded-md cursor-pointer hover:bg-gray-50"
                  >
                    Esc
                  </kbd>
                )}
              </div>

              {/* Results */}
              {results.length > 0 ? (
                <div className="max-h-[60vh] overflow-y-auto">
                  <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-50">
                    <Sparkles size={12} className="text-green-500" />
                    <span className="text-xs text-gray-400 font-medium">
                      {results.length} résultat{results.length > 1 ? "s" : ""}
                    </span>
                  </div>
                  {results.map((item, i) => (
                    <button
                      key={`${item.type}-${item.id}`}
                      onClick={() => navigate(item.url, inputValue)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 ${i === activeIdx ? "bg-gray-50" : ""}`}
                    >
                      {item.cover ? (
                        <img
                          src={item.cover}
                          alt=""
                          className="w-10 h-10 rounded-lg object-cover shrink-0 border border-gray-100"
                        />
                      ) : (
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${TYPE_STYLE[item.type]}`}>
                          {item.type === "ebook" && <BookOpen size={18} />}
                          {item.type === "formation" && <Play size={18} />}
                          {item.type === "service" && <Wrench size={18} />}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-gray-900 truncate">{item.title}</p>
                        <p className="text-xs text-gray-500 truncate">{item.subtitle}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${TYPE_STYLE[item.type]}`}>
                          {TYPE_LABEL[item.type]}
                        </span>
                        {item.price != null && item.price > 0 && (
                          <span className="text-xs font-semibold text-gray-600 whitespace-nowrap">
                            {formatPrice(item.price)}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ) : inputValue.length >= 2 ? (
                <div className="px-4 py-10 text-center">
                  <div className="text-4xl mb-3">🔍</div>
                  <p className="text-gray-500 text-sm font-medium">Aucun résultat pour &laquo; {inputValue} &raquo;</p>
                  <p className="text-gray-400 text-xs mt-1">Essayez d&apos;autres mots-clés</p>
                </div>
              ) : (
                <div className="px-4 py-5">
                  {/* Recent searches */}
                  {recentSearches.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-gray-400 font-medium mb-2 uppercase tracking-wide flex items-center gap-1.5">
                        <Clock size={11} /> Récents
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {recentSearches.map((s) => (
                          <button
                            key={s}
                            onClick={() => handleInput(s)}
                            className="px-3 py-1.5 bg-gray-100 hover:bg-blue-50 hover:text-blue-700 text-gray-600 text-xs font-medium rounded-lg transition-colors border border-transparent hover:border-blue-200"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-gray-400 font-medium mb-3 uppercase tracking-wide">Recherches populaires</p>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_SEARCHES.map((s) => (
                      <button
                        key={s}
                        onClick={() => handleInput(s)}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-green-50 hover:text-green-700 text-gray-700 text-xs font-medium rounded-lg transition-colors border border-transparent hover:border-green-200"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-300 mt-4">
                    Recherche dans {allEbooks.length} guides{allFormations.length > 0 ? ` · ${allFormations.length} formations` : ""} · {staticServices.length} services
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
