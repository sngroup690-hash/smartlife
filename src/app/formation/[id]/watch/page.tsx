"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft, Play, CheckCircle, Loader2,
  ChevronRight, ChevronDown, Clock, BookOpen, Lock,
  Download, WifiOff, Trash2, HelpCircle, X, RotateCcw, Trophy,
} from "lucide-react";
import {
  saveVideoOffline, getVideoOffline, deleteVideoOffline, listOfflineVideos,
} from "@/lib/offline-video-storage";
import { useUserStore } from "@/lib/user-store";
import { FORMATIONS } from "@/lib/formations-data";
import { useCatalogueStore } from "@/lib/catalogue-store";
import { useFormationProgressStore } from "@/lib/formation-progress-store";
import { useQuizStore } from "@/lib/quiz-store";
import type { FormationModule, ModuleVideo, ModuleLecon } from "@/lib/formations-data";
import type { ModuleQuiz, QuizQuestion } from "@/lib/quiz-store";
import ForumSection from "@/components/ForumSection";

// ─── Détection type de vidéo ──────────────────────────────────────────────────

function getVideoType(url: string): "youtube" | "vimeo" | "local" | "direct" {
  if (url.startsWith("local:")) return "local";
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
  if (url.includes("vimeo.com")) return "vimeo";
  return "direct";
}

function getYouTubeEmbedUrl(url: string): string {
  const match = url.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
  const id = match?.[1] ?? "";
  return `https://www.youtube.com/embed/${id}?enablejsapi=1&rel=0&modestbranding=1`;
}

function getVimeoEmbedUrl(url: string): string {
  const match = url.match(/vimeo\.com\/(\d+)/);
  const id = match?.[1] ?? "";
  return `https://player.vimeo.com/video/${id}?title=0&byline=0&portrait=0`;
}

// ─── Lecteur Vidéo ────────────────────────────────────────────────────────────

function VideoPlayer({
  video,
  formationId,
  videoKey,
  onComplete,
  uid,
  token,
  offlineUrl,
}: {
  video: ModuleVideo;
  formationId: string;
  videoKey: string;
  onComplete: () => void;
  uid: string;
  token: string;
  offlineUrl?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const saveProgress = useFormationProgressStore((s) => s.saveVideoProgress);
  const markCompleted = useFormationProgressStore((s) => s.markVideoCompleted);
  const vp = useFormationProgressStore((s) => s.getVideoProgress(formationId, videoKey));
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const type = getVideoType(video.url);

  const videoId = type === "local" ? video.url.replace("local:", "") : null;
  const isPreview = !uid || !token; // pas de token = prévisualisation gratuite
  const streamSrc = offlineUrl ?? (videoId
    ? isPreview
      ? `/api/formation/${formationId}/stream/${videoId}?preview=1`
      : `/api/formation/${formationId}/stream/${videoId}?uid=${encodeURIComponent(uid)}&token=${encodeURIComponent(token)}`
    : video.url);

  // Reprendre depuis la dernière position pour vidéos HTML5 (local + direct)
  useEffect(() => {
    if ((type === "direct" || type === "local") && videoRef.current && vp?.currentTime && vp.currentTime > 10) {
      videoRef.current.currentTime = vp.currentTime;
    }
  }, [videoKey, type, vp?.currentTime]);

  // Timer de progression uniquement pour YouTube/Vimeo (pas d'accès à currentTime natif)
  useEffect(() => {
    if (type === "youtube" || type === "vimeo") {
      intervalRef.current = setInterval(() => {
        saveProgress(formationId, videoKey, Date.now(), 0);
      }, 5000);
      return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }
  }, [formationId, videoKey, type, saveProgress]);

  function handleTimeUpdate() {
    const el = videoRef.current;
    if (!el) return;
    saveProgress(formationId, videoKey, el.currentTime, el.duration || 0);
    if (el.duration > 0 && el.currentTime / el.duration >= 0.9) {
      markCompleted(formationId, videoKey, el.duration);
      onComplete();
    }
  }

  function handleEnded() {
    const el = videoRef.current;
    markCompleted(formationId, videoKey, el?.duration ?? 0);
    onComplete();
  }

  if (type === "youtube") {
    return (
      <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
        <iframe
          key={videoKey}
          src={getYouTubeEmbedUrl(video.url)}
          className="absolute inset-0 w-full h-full rounded-xl"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  if (type === "vimeo") {
    return (
      <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
        <iframe
          key={videoKey}
          src={getVimeoEmbedUrl(video.url)}
          className="absolute inset-0 w-full h-full rounded-xl"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <video
      key={videoKey}
      ref={videoRef}
      src={streamSrc}
      controls
      className="w-full rounded-xl bg-black"
      onTimeUpdate={handleTimeUpdate}
      onEnded={handleEnded}
      style={{ maxHeight: "480px" }}
    >
      Votre navigateur ne supporte pas la lecture vidéo.
    </video>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function WatchPage() {
  const router = useRouter();
  const params = useParams();
  const formationId = params.id as string;

  const { isLoggedIn, currentUser, formationsAchetees } = useUserStore();
  const { formations: storeFormations, formationOverrides } = useCatalogueStore();
  const progressStore = useFormationProgressStore();
  const quizStore = useQuizStore();

  const [modules, setModules] = useState<FormationModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeVideoKey, setActiveVideoKey] = useState<string | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [completedThisSession, setCompletedThisSession] = useState<Set<string>>(new Set());
  const [streamToken, setStreamToken] = useState("");
  const [streamUid, setStreamUid] = useState("");

  // Quiz
  const [quizModules, setQuizModules] = useState<ModuleQuiz[]>([]);
  const [activeQuizModuleId, setActiveQuizModuleId] = useState<string | null>(null);

  // Hors-ligne
  const [isOnline, setIsOnline] = useState(true);
  const [offlineVideos, setOfflineVideos] = useState<Record<string, boolean>>({});
  const [downloadingVideo, setDownloadingVideo] = useState<string | null>(null);
  const [currentOfflineUrl, setCurrentOfflineUrl] = useState<string | null>(null);
  const currentOfflineBlobRef = useRef<string | null>(null);

  // Chercher la formation dans static + admin
  const allFormations = [
    ...FORMATIONS.map((f) => ({ ...f, ...(formationOverrides[f.id] || {}) })),
    ...storeFormations.filter((f) => f.actif).map(({ actif: _, createdAt: __, ...f }) => f),
  ];
  const formation = allFormations.find((f) => f.id === formationId);

  const isPurchased = formationsAchetees.includes(formationId);
  const FREE_LECON_COUNT = 3; // leçons 1-2-3 gratuites pour tous

  useEffect(() => {
    loadModules();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formationId]);

  // Suivi connexion réseau
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const up = () => setIsOnline(true);
    const down = () => setIsOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => { window.removeEventListener("online", up); window.removeEventListener("offline", down); };
  }, []);

  // Charger la liste des vidéos déjà sauvegardées hors-ligne
  useEffect(() => {
    listOfflineVideos().then((ids) => {
      const map: Record<string, boolean> = {};
      ids.forEach((id) => { map[id] = true; });
      setOfflineVideos(map);
    }).catch(() => {});
  }, []);

  // Charger le blob URL de la vidéo active si elle est en cache
  useEffect(() => {
    if (currentOfflineBlobRef.current) {
      URL.revokeObjectURL(currentOfflineBlobRef.current);
      currentOfflineBlobRef.current = null;
      setCurrentOfflineUrl(null);
    }
    if (!activeVideoKey || !offlineVideos[activeVideoKey]) return;

    getVideoOffline(activeVideoKey).then((data) => {
      if (!data) return;
      const blob = new Blob([data], { type: "video/mp4" });
      const url = URL.createObjectURL(blob);
      currentOfflineBlobRef.current = url;
      setCurrentOfflineUrl(url);
    }).catch(() => {});

    return () => {
      if (currentOfflineBlobRef.current) {
        URL.revokeObjectURL(currentOfflineBlobRef.current);
        currentOfflineBlobRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeVideoKey, offlineVideos]);

  // Acquérir le token de streaming si l'utilisateur a acheté la formation
  useEffect(() => {
    if (!isLoggedIn || !currentUser || !isPurchased) return;
    fetch("/api/formation-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ formationId, userId: currentUser.id }),
    })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d?.token) { setStreamToken(d.token); setStreamUid(currentUser.id); } })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, isPurchased, formationId]);

  function applyModules(mods: FormationModule[]) {
    setModules(mods);
    setExpandedModules(new Set(mods.map((m) => m.id)));
    const fp = progressStore.getFormationProgress(formationId);
    if (fp?.lastVideoKey) {
      setActiveVideoKey(fp.lastVideoKey);
    } else if (mods.length > 0) {
      const first = mods[0];
      const lecs = first.lecons && first.lecons.length > 0
        ? first.lecons
        : first.videos && first.videos.length > 0
        ? [{ id: first.id + "-l0", titre: "", videos: first.videos }]
        : [];
      if (lecs.length > 0 && lecs[0].videos.length > 0)
        setActiveVideoKey(`${first.id}-${lecs[0].id}-${lecs[0].videos[0].id}`);
    }
  }

  async function loadModules() {
    setLoading(true);
    try {
      const [videosRes, quizRes] = await Promise.all([
        fetch(`/api/formation/${formationId}/videos`),
        fetch(`/api/formation/${formationId}/quiz`),
      ]);
      if (!videosRes.ok) throw new Error();
      const { modules: fetchedModules } = await videosRes.json();
      if (quizRes.ok) {
        const qd = await quizRes.json();
        setQuizModules(qd.modules ?? []);
      }
      // Cache pour utilisation hors-ligne
      try { localStorage.setItem(`sl-modules-${formationId}`, JSON.stringify(fetchedModules)); } catch {}
      applyModules(fetchedModules);
    } catch {
      // Fallback hors-ligne : restaurer depuis localStorage
      try {
        const cached = localStorage.getItem(`sl-modules-${formationId}`);
        if (cached) {
          applyModules(JSON.parse(cached) as FormationModule[]);
        } else {
          setModules([]);
        }
      } catch {
        setModules([]);
      }
    } finally {
      setLoading(false);
    }
  }

  // Compat : retourne les leçons d'un module (nouveau ou ancien format)
  function getLecons(mod: FormationModule): ModuleLecon[] {
    if (mod.lecons && mod.lecons.length > 0) return mod.lecons;
    if (mod.videos && mod.videos.length > 0) {
      return [{ id: mod.id + "-l0", titre: "", videos: mod.videos }];
    }
    return [];
  }

  // Leçons 1-2-3 gratuites pour tous
  const allLecons = modules.flatMap((m) => getLecons(m).map((l) => ({ ...l, moduleId: m.id })));
  const freeLeconIds = new Set(allLecons.slice(0, FREE_LECON_COUNT).map((l) => l.id));

  // Liste plate de toutes les vidéos avec leurs clés
  const allVideos = modules.flatMap((m) =>
    getLecons(m).flatMap((l) =>
      l.videos.map((v) => ({
        ...v,
        moduleId: m.id,
        leconId: l.id,
        leconTitre: l.titre,
        key: `${m.id}-${l.id}-${v.id}`,
        isFree: freeLeconIds.has(l.id),
      }))
    )
  );
  const currentVideoIndex = allVideos.findIndex((v) => v.key === activeVideoKey);
  const currentVideo = allVideos[currentVideoIndex] ?? null;

  const totalVideos = allVideos.length;
  const totalProgress = progressStore.getTotalProgress(formationId, totalVideos);

  function handleVideoComplete() {
    if (!activeVideoKey) return;
    setCompletedThisSession((s) => new Set([...s, activeVideoKey]));
    // Auto-passer à la vidéo suivante
    if (currentVideoIndex < allVideos.length - 1) {
      setTimeout(() => {
        setActiveVideoKey(allVideos[currentVideoIndex + 1].key);
      }, 1500);
    }
  }

  function selectVideo(key: string) {
    setActiveVideoKey(key);
  }

  function toggleModule(moduleId: string) {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  }

  async function downloadVideoOffline(videoKey: string, video: ModuleVideo) {
    const type = getVideoType(video.url);
    if (type === "youtube" || type === "vimeo") return;
    if (downloadingVideo) return;
    setDownloadingVideo(videoKey);
    try {
      let fetchUrl: string;
      if (type === "local") {
        if (!streamToken || !streamUid) return;
        const videoId = video.url.replace("local:", "");
        fetchUrl = `/api/formation/${formationId}/stream/${videoId}?uid=${encodeURIComponent(streamUid)}&token=${encodeURIComponent(streamToken)}`;
      } else {
        fetchUrl = video.url;
      }
      const res = await fetch(fetchUrl);
      if (!res.ok) throw new Error("fetch failed");
      const data = await res.arrayBuffer();
      await saveVideoOffline(videoKey, video.titre, data);
      setOfflineVideos((prev) => ({ ...prev, [videoKey]: true }));
    } catch {
      // erreur silencieuse
    } finally {
      setDownloadingVideo(null);
    }
  }

  async function removeVideoOffline(videoKey: string) {
    await deleteVideoOffline(videoKey);
    setOfflineVideos((prev) => { const n = { ...prev }; delete n[videoKey]; return n; });
    if (activeVideoKey === videoKey) setCurrentOfflineUrl(null);
  }

  // Seules les vidéos locales/directes peuvent être téléchargées
  function canDownload(video: ModuleVideo) {
    const type = getVideoType(video.url);
    return (type === "local" || type === "direct") && isPurchased;
  }

  function getVideoStatus(key: string) {
    const vp = progressStore.getVideoProgress(formationId, key);
    if (vp?.completed || completedThisSession.has(key)) return "completed";
    if (vp?.currentTime && vp.currentTime > 5) return "inprogress";
    return "locked";
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-3 text-gray-400">
          <Loader2 size={24} className="animate-spin" />
          Chargement de la formation…
        </div>
      </div>
    );
  }

  if (!formation) {
    return (
      <div className="flex items-center justify-center min-h-screen text-center">
        <div>
          <p className="text-gray-400 mb-4">Formation introuvable.</p>
          <Link href="/formation" className="text-[#E8B800] hover:underline">Retour aux formations</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/dashboard" className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm shrink-0">
              <ChevronLeft size={16} /> Mes formations
            </Link>
            <span className="text-gray-700">/</span>
            <span className="text-white text-sm font-medium truncate">{formation.titre}</span>
          </div>

          {/* Barre de progression globale */}
          <div className="hidden sm:flex items-center gap-3 shrink-0">
            <div className="w-32 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#E8B800] to-[#27A827] rounded-full transition-all duration-500"
                style={{ width: `${totalProgress}%` }}
              />
            </div>
            <span className="text-sm text-gray-400">{totalProgress}%</span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 max-w-7xl mx-auto w-full">

        {/* Sidebar modules */}
        <aside className="hidden lg:flex flex-col w-80 shrink-0 border-r border-white/10 overflow-y-auto max-h-[calc(100vh-57px)] sticky top-14">
          <div className="p-4 border-b border-white/10">
            <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Contenu de la formation</p>
            <p className="text-gray-400 text-xs mt-1">{totalVideos} vidéo{totalVideos > 1 ? "s" : ""} · {progressStore.getCompletedCount(formationId)}/{totalVideos} terminées</p>
          </div>

          {modules.length === 0 ? (
            <div className="p-6 text-center">
              <BookOpen size={32} className="text-gray-700 mx-auto mb-3" />
              <p className="text-gray-600 text-sm">Les vidéos sont en cours d&apos;ajout par l&apos;administrateur.</p>
            </div>
          ) : (
            <div className="p-3 space-y-2">
              {modules.map((mod, modIdx) => {
                const isExpanded = expandedModules.has(mod.id);
                const lecons = getLecons(mod);
                const modVideoCount = lecons.reduce((n, l) => n + l.videos.length, 0);
                const completedInModule = lecons.reduce((n, l) =>
                  n + l.videos.filter((v) => getVideoStatus(`${mod.id}-${l.id}-${v.id}`) === "completed").length, 0
                );

                return (
                  <div key={mod.id} className="rounded-xl overflow-hidden">
                    {/* Titre module */}
                    <button
                      onClick={() => toggleModule(mod.id)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-white/[0.03] hover:bg-white/[0.06] transition-colors text-left"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs text-gray-600 shrink-0">Module {modIdx + 1}</span>
                        <span className="text-white text-sm font-medium truncate">{mod.titre}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span className="text-xs text-gray-600">{completedInModule}/{modVideoCount}</span>
                        <ChevronDown size={14} className={`text-gray-500 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                      </div>
                    </button>

                    {/* Leçons + vidéos */}
                    {isExpanded && (
                      <div className="border-t border-white/5">
                        {lecons.map((lecon, leconIdx) => {
                          const leconExpanded = expandedModules.has(`${mod.id}-${lecon.id}`);
                          return (
                            <div key={lecon.id}>
                              {/* Titre leçon (uniquement si elle a un titre) */}
                              {lecon.titre && (
                                <button
                                  onClick={() => {
                                    setExpandedModules((prev) => {
                                      const next = new Set(prev);
                                      const key = `${mod.id}-${lecon.id}`;
                                      if (next.has(key)) next.delete(key); else next.add(key);
                                      return next;
                                    });
                                  }}
                                  className="w-full flex items-center gap-2 px-4 py-2 bg-white/[0.025] hover:bg-white/[0.04] border-b border-white/5 text-left transition-colors"
                                >
                                  <BookOpen size={11} className="text-green-400 shrink-0" />
                                  <span className="text-green-300 text-[10px] font-bold shrink-0">Leç. {leconIdx + 1}</span>
                                  <span className="text-gray-300 text-xs truncate flex-1">{lecon.titre}</span>
                                  <ChevronDown size={11} className={`text-gray-600 transition-transform shrink-0 ${leconExpanded || !lecon.titre ? "rotate-180" : ""}`} />
                                </button>
                              )}

                              {/* Vidéos de la leçon */}
                              {(!lecon.titre || leconExpanded || expandedModules.has(`${mod.id}-${lecon.id}`)) && (
                                <div>
                                  {lecon.videos.map((video) => {
                                    const key = `${mod.id}-${lecon.id}-${video.id}`;
                                    const status = getVideoStatus(key);
                                    const isActive = key === activeVideoKey;
                                    const vp = progressStore.getVideoProgress(formationId, key);
                                    const isOffline = offlineVideos[key];
                                    return (
                                      <div
                                        key={key}
                                        className={`flex items-stretch border-b border-white/5 last:border-0 ${
                                          isActive ? "bg-[#E8B800]/10 border-l-2 border-l-[#E8B800]" : ""
                                        }`}
                                      >
                                        <button
                                          onClick={() => selectVideo(key)}
                                          className={`flex-1 flex items-start gap-3 px-4 py-3 text-left transition-colors min-w-0 ${
                                            isActive ? "" : "hover:bg-white/[0.03]"
                                          } ${lecon.titre ? "pl-8" : ""}`}
                                        >
                                          <div className="mt-0.5 shrink-0">
                                            {status === "completed" ? (
                                              <CheckCircle size={16} className="text-emerald-400" />
                                            ) : isActive ? (
                                              <Play size={16} className="text-[#E8B800]" />
                                            ) : (
                                              <div className="w-4 h-4 rounded-full border border-gray-600" />
                                            )}
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <p className={`text-sm leading-tight truncate ${isActive ? "text-[#E8B800]" : "text-gray-300"}`}>
                                              {video.titre}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                              <span className="text-gray-600 text-xs flex items-center gap-1">
                                                <Clock size={10} /> {video.duree}
                                              </span>
                                              {isOffline && (
                                                <span className="text-emerald-400 text-[10px] flex items-center gap-0.5">
                                                  <WifiOff size={9} /> Hors-ligne
                                                </span>
                                              )}
                                              {status === "inprogress" && vp && (
                                                <span className="text-blue-400 text-xs">En cours</span>
                                              )}
                                            </div>
                                            {status === "inprogress" && vp && vp.duration > 0 && (
                                              <div className="mt-1.5 w-full h-1 bg-white/10 rounded-full overflow-hidden">
                                                <div
                                                  className="h-full bg-[#E8B800]/60 rounded-full"
                                                  style={{ width: `${Math.min(100, (vp.currentTime / vp.duration) * 100)}%` }}
                                                />
                                              </div>
                                            )}
                                          </div>
                                        </button>
                                        {canDownload(video) && (
                                          <div className="flex flex-col justify-center pr-2 pl-1 shrink-0">
                                            {isOffline ? (
                                              <button
                                                onClick={() => removeVideoOffline(key)}
                                                title="Supprimer du cache"
                                                className="p-1.5 text-emerald-400 hover:text-red-400 transition-colors"
                                              >
                                                <Trash2 size={11} />
                                              </button>
                                            ) : (
                                              <button
                                                onClick={() => downloadVideoOffline(key, video)}
                                                disabled={downloadingVideo === key || !isOnline}
                                                title="Télécharger hors-ligne"
                                                className="p-1.5 text-gray-600 hover:text-[#E8B800] disabled:opacity-30 transition-colors"
                                              >
                                                {downloadingVideo === key
                                                  ? <Loader2 size={11} className="animate-spin" />
                                                  : <Download size={11} />}
                                              </button>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {/* Bouton quiz du module dans la sidebar */}
                        {(() => {
                          const mq = quizModules.find((q) => q.moduleId === mod.id);
                          if (!mq || mq.questions.length === 0) return null;
                          const attempt = quizStore.getAttempt(formationId, mod.id);
                          return (
                            <button
                              onClick={() => setActiveQuizModuleId(mod.id)}
                              className={`w-full flex items-center gap-2 px-4 py-2.5 border-t border-white/5 text-left transition-colors ${
                                attempt?.passed
                                  ? "bg-emerald-900/10 hover:bg-emerald-900/20"
                                  : "bg-purple-900/10 hover:bg-purple-900/20"
                              }`}
                            >
                              {attempt?.passed ? (
                                <Trophy size={12} className="text-emerald-400 shrink-0" />
                              ) : (
                                <HelpCircle size={12} className="text-purple-400 shrink-0" />
                              )}
                              <span className={`text-xs font-medium ${attempt?.passed ? "text-emerald-300" : "text-purple-300"}`}>
                                Quiz du module
                              </span>
                              {attempt && (
                                <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full ${attempt.passed ? "bg-emerald-900/40 text-emerald-400" : "bg-red-900/40 text-red-400"}`}>
                                  {attempt.score}/{attempt.total}
                                </span>
                              )}
                            </button>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </aside>

        {/* Zone principale */}
        <main className="flex-1 p-6 min-w-0">
          {!currentVideo ? (
            <div className="flex flex-col items-center justify-center h-full min-h-80 text-center">
              <div className="w-20 h-20 rounded-2xl bg-[#E8B800]/10 flex items-center justify-center mb-5">
                <Play size={36} className="text-[#E8B800] ml-1" />
              </div>
              {modules.length === 0 ? (
                <>
                  <h2 className="text-white text-xl font-bold mb-3">Contenu en préparation</h2>
                  <p className="text-gray-500 max-w-sm">
                    L&apos;administrateur est en train d&apos;ajouter les vidéos de cette formation. Revenez bientôt !
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-white text-xl font-bold mb-3">Sélectionnez une vidéo</h2>
                  <p className="text-gray-500">Choisissez une vidéo dans le menu de gauche pour commencer.</p>
                </>
              )}
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-6">

              {/* Paywall — leçon premium non achetée */}
              {!currentVideo.isFree && !isPurchased ? (
                <div className="flex flex-col items-center justify-center min-h-80 text-center p-10 bg-white/[0.03] border border-[#E8B800]/20 rounded-2xl">
                  <div className="w-20 h-20 rounded-2xl bg-[#E8B800]/10 border border-[#E8B800]/30 flex items-center justify-center mb-5">
                    <Lock size={36} className="text-[#E8B800]" />
                  </div>
                  <h2 className="text-white text-xl font-bold mb-3">Leçon réservée aux membres</h2>
                  <p className="text-gray-400 max-w-sm mb-6">
                    Les 3 premières leçons sont gratuites. Pour continuer et accéder à toutes les leçons,
                    achetez la formation complète.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link
                      href={`/formation/${formationId}`}
                      className="flex items-center gap-2 px-6 py-3 bg-[#E8B800] hover:bg-[#27A827] text-black font-bold rounded-xl transition-colors"
                    >
                      <ChevronRight size={16} /> Acheter la formation
                    </Link>
                    {!isLoggedIn && (
                      <Link
                        href={`/login?redirect=/formation/${formationId}/watch`}
                        className="flex items-center gap-2 px-6 py-3 border border-white/20 text-gray-400 hover:text-white rounded-xl transition-colors"
                      >
                        Se connecter
                      </Link>
                    )}
                  </div>
                </div>
              ) : (
              <>
              {/* Lecteur */}
              <div className="rounded-2xl overflow-hidden bg-black shadow-2xl">
                {currentVideo.isFree && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-emerald-900/40 border-b border-emerald-700/30">
                    <CheckCircle size={13} className="text-emerald-400" />
                    <span className="text-emerald-300 text-xs font-medium">Leçon gratuite — accessible à tous</span>
                  </div>
                )}
                <VideoPlayer
                  video={currentVideo}
                  formationId={formationId}
                  videoKey={currentVideo.key}
                  onComplete={handleVideoComplete}
                  uid={streamUid}
                  token={streamToken}
                  offlineUrl={currentOfflineUrl ?? undefined}
                />
              </div>

              {/* Infos vidéo */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-white text-xl font-bold">{currentVideo.titre}</h1>
                  <p className="text-gray-500 text-sm mt-1 flex items-center gap-2 flex-wrap">
                    <Clock size={13} /> {currentVideo.duree}
                    {currentOfflineUrl && (
                      <span className="flex items-center gap-1 text-emerald-400 font-medium text-xs">
                        <WifiOff size={11} /> Disponible hors-ligne
                      </span>
                    )}
                    {getVideoStatus(currentVideo.key) === "completed" && (
                      <span className="flex items-center gap-1 text-emerald-400 font-medium">
                        <CheckCircle size={13} /> Terminée
                      </span>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Bouton télécharger / supprimer hors-ligne */}
                  {canDownload(currentVideo) && (
                    offlineVideos[currentVideo.key] ? (
                      <button
                        onClick={() => removeVideoOffline(currentVideo.key)}
                        className="flex items-center gap-1.5 px-3 py-2 border border-emerald-700/40 text-emerald-400 text-sm rounded-xl hover:bg-red-900/20 hover:border-red-700/40 hover:text-red-400 transition-all"
                        title="Supprimer du cache hors-ligne"
                      >
                        <Trash2 size={14} /> Hors-ligne
                      </button>
                    ) : (
                      <button
                        onClick={() => downloadVideoOffline(currentVideo.key, currentVideo)}
                        disabled={downloadingVideo === currentVideo.key || !isOnline}
                        className="flex items-center gap-1.5 px-3 py-2 border border-white/20 text-gray-400 text-sm rounded-xl hover:text-white hover:border-white/40 transition-all disabled:opacity-30"
                      >
                        {downloadingVideo === currentVideo.key
                          ? <><Loader2 size={14} className="animate-spin" /> Téléchargement…</>
                          : <><Download size={14} /> Télécharger hors-ligne</>}
                      </button>
                    )
                  )}

                  {/* Bouton marquer comme vu manuellement */}
                  {getVideoStatus(currentVideo.key) !== "completed" && (
                    <button
                      onClick={() => {
                        progressStore.markVideoCompleted(formationId, currentVideo.key);
                        setCompletedThisSession((s) => new Set([...s, currentVideo.key]));
                      }}
                      className="flex items-center gap-2 px-4 py-2 border border-emerald-700/40 text-emerald-400 text-sm rounded-xl hover:bg-emerald-900/20 transition-all"
                    >
                      <CheckCircle size={15} /> Marquer comme terminée
                    </button>
                  )}
                </div>
              </div>

              {/* Navigation précédent / suivant */}
              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <button
                  onClick={() => currentVideoIndex > 0 && setActiveVideoKey(allVideos[currentVideoIndex - 1].key)}
                  disabled={currentVideoIndex <= 0}
                  className="flex items-center gap-2 px-4 py-2.5 border border-white/20 text-gray-400 hover:text-white hover:border-white/40 rounded-xl text-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} /> Précédente
                </button>

                <span className="text-gray-600 text-sm">{currentVideoIndex + 1} / {allVideos.length}</span>

                <button
                  onClick={() => currentVideoIndex < allVideos.length - 1 && setActiveVideoKey(allVideos[currentVideoIndex + 1].key)}
                  disabled={currentVideoIndex >= allVideos.length - 1}
                  className="flex items-center gap-2 px-4 py-2.5 bg-[#E8B800] hover:bg-[#27A827] text-black font-bold rounded-xl text-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Suivante <ChevronRight size={16} />
                </button>
              </div>

              {/* Quiz du module courant */}
              {(() => {
                const currentModuleId = currentVideo.moduleId;
                const currentMod = modules.find((m) => m.id === currentModuleId);
                if (!currentMod) return null;
                const allKeysInModule = getLecons(currentMod).flatMap((l) =>
                  l.videos.map((v) => `${currentModuleId}-${l.id}-${v.id}`)
                );
                const allDone = allKeysInModule.length > 0 && allKeysInModule.every((k) => getVideoStatus(k) === "completed");
                const mq = quizModules.find((q) => q.moduleId === currentModuleId);
                if (!mq || mq.questions.length === 0 || !allDone) return null;
                const attempt = quizStore.getAttempt(formationId, currentModuleId);
                return (
                  <div className={`rounded-2xl border p-5 flex items-center justify-between gap-4 flex-wrap ${attempt?.passed ? "bg-emerald-900/10 border-emerald-700/30" : "bg-purple-900/10 border-purple-500/30"}`}>
                    <div className="flex items-center gap-3">
                      {attempt?.passed ? (
                        <Trophy size={24} className="text-emerald-400 shrink-0" />
                      ) : (
                        <HelpCircle size={24} className="text-purple-400 shrink-0" />
                      )}
                      <div>
                        <p className={`font-bold text-sm ${attempt?.passed ? "text-emerald-300" : "text-white"}`}>
                          {attempt?.passed ? "Quiz réussi !" : "Quiz du module disponible"}
                        </p>
                        <p className="text-gray-500 text-xs mt-0.5">
                          {attempt
                            ? `Score : ${attempt.score}/${attempt.total} — ${attempt.passed ? "Réussi ✓" : "Non validé"}`
                            : `${mq.questions.length} question${mq.questions.length > 1 ? "s" : ""} · Score minimum : 70%`}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveQuizModuleId(currentModuleId)}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${attempt?.passed ? "bg-emerald-700 hover:bg-emerald-600 text-white" : "bg-purple-600 hover:bg-purple-500 text-white"}`}
                    >
                      {attempt ? <RotateCcw size={14} /> : <HelpCircle size={14} />}
                      {attempt ? "Recommencer" : "Faire le quiz"}
                    </button>
                  </div>
                );
              })()}

              {/* Forum Q&A */}
              <ForumSection
                formationId={formationId}
                userId={currentUser?.id}
                userName={
                  currentUser
                    ? `${currentUser.firstName} ${currentUser.lastName.slice(0, 1)}.`
                    : undefined
                }
                canPost={isPurchased && isLoggedIn}
              />

              {/* Modules sur mobile */}
              <div className="lg:hidden space-y-3 mt-6">
                <h3 className="text-white font-bold">Contenu de la formation</h3>
                {modules.map((mod, modIdx) => (
                  <div key={mod.id} className="bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-white/5">
                      <p className="text-white text-sm font-medium">Module {modIdx + 1} : {mod.titre}</p>
                    </div>
                    {getLecons(mod).map((lecon, leconIdx) => (
                      <div key={lecon.id}>
                        {lecon.titre && (
                          <div className="px-4 py-2 bg-white/[0.02] border-b border-white/5 flex items-center gap-2">
                            <BookOpen size={11} className="text-green-400" />
                            <span className="text-green-300 text-xs font-medium">Leçon {leconIdx + 1} : {lecon.titre}</span>
                          </div>
                        )}
                        {lecon.videos.map((video) => {
                          const key = `${mod.id}-${lecon.id}-${video.id}`;
                          const status = getVideoStatus(key);
                          return (
                            <button
                              key={key}
                              onClick={() => { selectVideo(key); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                              className={`w-full flex items-center gap-3 px-4 py-3 text-left border-b border-white/5 last:border-0 transition-colors ${
                                key === activeVideoKey ? "bg-[#E8B800]/10" : "hover:bg-white/[0.03]"
                              } ${lecon.titre ? "pl-8" : ""}`}
                            >
                              {status === "completed" ? (
                                <CheckCircle size={15} className="text-emerald-400 shrink-0" />
                              ) : key === activeVideoKey ? (
                                <Play size={15} className="text-[#E8B800] shrink-0" />
                              ) : (
                                <div className="w-4 h-4 rounded-full border border-gray-600 shrink-0" />
                              )}
                              <span className={`text-sm ${key === activeVideoKey ? "text-[#E8B800]" : "text-gray-300"}`}>
                                {video.titre}
                              </span>
                              <span className="text-gray-600 text-xs ml-auto">{video.duree}</span>
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* Message de fin + Certificat */}
              {isPurchased && totalProgress === 100 && (
                <CertificateSection formationId={formationId} />
              )}
              </>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Modal quiz */}
      {activeQuizModuleId && (() => {
        const mq = quizModules.find((q) => q.moduleId === activeQuizModuleId);
        if (!mq || mq.questions.length === 0) return null;
        const modTitle = modules.find((m) => m.id === activeQuizModuleId)?.titre ?? "";
        return (
          <QuizModal
            questions={mq.questions}
            moduleTitle={modTitle}
            formationId={formationId}
            moduleId={activeQuizModuleId}
            onClose={() => setActiveQuizModuleId(null)}
          />
        );
      })()}
    </div>
  );
}

// ─── Quiz Modal ───────────────────────────────────────────────────────────────

function QuizModal({
  questions,
  moduleTitle,
  formationId,
  moduleId,
  onClose,
}: {
  questions: QuizQuestion[];
  moduleTitle: string;
  formationId: string;
  moduleId: string;
  onClose: () => void;
}) {
  const quizStore = useQuizStore();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [answers, setAnswers] = useState<number[]>([]);
  const [finished, setFinished] = useState(false);

  const q = questions[currentIdx];
  const isLast = currentIdx === questions.length - 1;

  function choose(optIdx: number) {
    if (showAnswer) return;
    setSelected(optIdx);
    setShowAnswer(true);
  }

  function next() {
    const newAnswers = [...answers, selected!];
    if (isLast) {
      const score = newAnswers.filter((a, i) => a === questions[i].correctIndex).length;
      quizStore.saveAttempt(formationId, moduleId, score, questions.length);
      setAnswers(newAnswers);
      setFinished(true);
    } else {
      setAnswers(newAnswers);
      setCurrentIdx((i) => i + 1);
      setSelected(null);
      setShowAnswer(false);
    }
  }

  function retry() {
    setCurrentIdx(0);
    setSelected(null);
    setShowAnswer(false);
    setAnswers([]);
    setFinished(false);
  }

  const score = finished ? answers.filter((a, i) => a === questions[i].correctIndex).length : 0;
  const passed = finished && score / questions.length >= 0.7;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-[#12121f] border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">

        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div>
            <p className="text-purple-400 text-xs font-medium uppercase tracking-wide">Quiz du module</p>
            <h2 className="text-white font-bold">{moduleTitle}</h2>
          </div>
          <button onClick={onClose} className="text-gray-600 hover:text-white text-2xl leading-none">×</button>
        </div>

        {finished ? (
          /* Résultats */
          <div className="p-6 text-center space-y-5">
            <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center text-3xl font-black ${passed ? "bg-emerald-900/40 text-emerald-400" : "bg-red-900/40 text-red-400"}`}>
              {score}/{questions.length}
            </div>
            <div>
              <p className={`text-xl font-bold ${passed ? "text-emerald-300" : "text-red-300"}`}>
                {passed ? "🎉 Quiz réussi !" : "Quiz non validé"}
              </p>
              <p className="text-gray-500 text-sm mt-1">
                {Math.round((score / questions.length) * 100)}% de bonnes réponses · Score minimum : 70%
              </p>
            </div>

            {/* Récap réponses */}
            <div className="space-y-3 text-left">
              {questions.map((question, i) => {
                const isCorrect = answers[i] === question.correctIndex;
                return (
                  <div key={question.id} className={`p-3 rounded-xl border text-sm ${isCorrect ? "bg-emerald-900/15 border-emerald-700/30" : "bg-red-900/15 border-red-700/30"}`}>
                    <p className={`font-medium mb-1 ${isCorrect ? "text-emerald-300" : "text-red-300"}`}>
                      {isCorrect ? "✓" : "✗"} {question.question}
                    </p>
                    <p className="text-gray-400 text-xs">Bonne réponse : {question.options[question.correctIndex]}</p>
                    {question.explication && (
                      <p className="text-gray-500 text-xs mt-1 italic">{question.explication}</p>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3 justify-center">
              <button onClick={retry} className="flex items-center gap-2 px-5 py-2.5 border border-white/20 text-gray-400 hover:text-white rounded-xl text-sm transition-all">
                <RotateCcw size={14} /> Recommencer
              </button>
              <button onClick={onClose} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${passed ? "bg-emerald-600 hover:bg-emerald-500 text-white" : "bg-[#E8B800] hover:bg-[#27A827] text-black"}`}>
                <X size={14} /> Fermer
              </button>
            </div>
          </div>
        ) : (
          /* Question en cours */
          <div className="p-6 space-y-5">
            {/* Progression */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Question {currentIdx + 1} / {questions.length}</span>
                <span>{Math.round((currentIdx / questions.length) * 100)}%</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full transition-all duration-500"
                  style={{ width: `${((currentIdx) / questions.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Question */}
            <p className="text-white font-semibold text-base leading-snug">{q.question}</p>

            {/* Options */}
            <div className="space-y-2">
              {q.options.map((opt, i) => {
                let cls = "w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ";
                if (!showAnswer) {
                  cls += selected === i
                    ? "border-purple-500 bg-purple-900/30 text-purple-200"
                    : "border-white/15 bg-white/[0.03] text-gray-300 hover:border-purple-400/50 hover:bg-purple-900/10";
                } else {
                  if (i === q.correctIndex) {
                    cls += "border-emerald-500 bg-emerald-900/30 text-emerald-200 font-semibold";
                  } else if (i === selected && i !== q.correctIndex) {
                    cls += "border-red-500 bg-red-900/30 text-red-300";
                  } else {
                    cls += "border-white/10 bg-white/[0.02] text-gray-500";
                  }
                }
                return (
                  <button key={i} onClick={() => choose(i)} disabled={showAnswer} className={cls}>
                    <span className="font-bold mr-2 text-gray-500">{String.fromCharCode(65 + i)}.</span>
                    {opt}
                    {showAnswer && i === q.correctIndex && (
                      <CheckCircle size={14} className="inline ml-2 text-emerald-400" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Explication */}
            {showAnswer && q.explication && (
              <div className="p-3 bg-white/[0.04] border border-white/10 rounded-xl text-gray-400 text-xs italic">
                💡 {q.explication}
              </div>
            )}

            {/* Bouton suivant */}
            {showAnswer && (
              <button
                onClick={next}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-sm transition-all"
              >
                {isLast ? <><Trophy size={15} /> Voir mes résultats</> : <>Question suivante <ChevronRight size={15} /></>}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Composant Certificat ─────────────────────────────────────────────────────

function CertificateSection({ formationId }: { formationId: string }) {
  const { currentUser } = useUserStore();
  const [certId, setCertId] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    // Check if cert already issued
    fetch(`/api/formation/${formationId}/certificate?checkUid=${encodeURIComponent(currentUser.id)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.certId) {
          setCertId(d.certId);
          setDownloadUrl(d.downloadUrl);
          setLoading(false);
        } else {
          // Issue new certificate
          issueCert();
        }
      })
      .catch(() => issueCert());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formationId, currentUser]);

  async function issueCert() {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/formation/${formationId}/certificate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          completedAt: new Date().toISOString(),
        }),
      });
      const data = await res.json();
      if (data.certId) {
        setCertId(data.certId);
        setDownloadUrl(data.downloadUrl);
      } else {
        setError("Impossible de générer le certificat.");
      }
    } catch {
      setError("Erreur lors de la génération du certificat.");
    } finally {
      setLoading(false);
    }
  }

  const shareText = encodeURIComponent(
    `Je viens de terminer ma formation sur Smart Life ! 🎓 Vérifiez mon certificat : https://smartlifecm.com/certificats/verifier?id=${certId}`
  );

  return (
    <div
      style={{
        background: "linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(232,184,0,0.12) 100%)",
        border: "1px solid rgba(124,58,237,0.3)",
        borderRadius: 20,
        padding: "28px 24px",
        textAlign: "center",
        marginTop: 8,
      }}
    >
      <div style={{ fontSize: 48, marginBottom: 8 }}>🎓</div>
      <h3 style={{ color: "#fff", fontSize: 18, fontWeight: 800, margin: "0 0 8px" }}>
        Formation terminée ! Félicitations !
      </h3>
      <p style={{ color: "#9ca3af", fontSize: 13, margin: "0 0 20px" }}>
        Vous avez complété 100% de cette formation. Votre certificat est prêt.
      </p>

      {loading && (
        <div style={{ color: "#9ca3af", fontSize: 13 }}>Génération du certificat…</div>
      )}

      {error && (
        <div style={{ color: "#f87171", fontSize: 13 }}>{error}</div>
      )}

      {!loading && certId && downloadUrl && (
        <>
          <div
            style={{
              display: "inline-block",
              background: "rgba(232,184,0,0.15)",
              border: "1px solid rgba(232,184,0,0.35)",
              borderRadius: 10,
              padding: "8px 18px",
              marginBottom: 20,
              fontFamily: "monospace",
              fontSize: 13,
              fontWeight: 700,
              color: "#E8B800",
              letterSpacing: "0.05em",
            }}
          >
            {certId}
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <a
              href={downloadUrl}
              download
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 22px",
                background: "#E8B800",
                color: "#000",
                borderRadius: 12,
                fontWeight: 700,
                fontSize: 14,
                textDecoration: "none",
              }}
            >
              ⬇ Télécharger le certificat
            </a>

            <a
              href={`https://wa.me/?text=${shareText}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 22px",
                background: "#25D366",
                color: "#fff",
                borderRadius: 12,
                fontWeight: 700,
                fontSize: 14,
                textDecoration: "none",
              }}
            >
              WhatsApp
            </a>

            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`https://smartlifecm.com/certificats/verifier?id=${certId}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 22px",
                background: "#1877F2",
                color: "#fff",
                borderRadius: 12,
                fontWeight: 700,
                fontSize: 14,
                textDecoration: "none",
              }}
            >
              Facebook
            </a>
          </div>

          <p style={{ color: "#6b7280", fontSize: 11, marginTop: 16 }}>
            Vérifiable sur{" "}
            <a
              href={`/certificats/verifier?id=${certId}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#7c3aed" }}
            >
              smartlifecm.com/certificats/verifier
            </a>
          </p>
        </>
      )}
    </div>
  );
}
