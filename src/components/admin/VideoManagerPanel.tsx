"use client";

import { useState, useEffect, useRef } from "react";
import {
  Plus, Trash2, Save, X, Upload, FileCheck, AlertCircle,
  Loader2, Play, CheckCircle, BookOpen, ChevronDown, ChevronRight,
} from "lucide-react";
import { uploadWithProgress } from "@/lib/upload-with-progress";
import { UploadProgressBar } from "@/components/admin/UploadProgressBar";

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? "";

type UploadStatus = "idle" | "uploading" | "done" | "error";

type VideoForm = {
  id: string;
  titre: string;
  duree: string;
  urlType: "local" | "external";
  url: string;
  uploadStatus: UploadStatus;
  uploadProgress: number;
};

type LeconForm = {
  id: string;
  titre: string;
  videos: VideoForm[];
  collapsed: boolean;
};

type ModuleForm = {
  id: string;
  titre: string;
  lecons: LeconForm[];
  collapsed: boolean;
};

function genId(prefix: string) {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
}

function toVideoForm(v: { id: string; titre: string; duree: string; url: string }): VideoForm {
  return {
    id: v.id,
    titre: v.titre,
    duree: v.duree,
    urlType: v.url.startsWith("local:") ? "local" : "external",
    url: v.url.startsWith("local:") ? "" : v.url,
    uploadStatus: "idle",
    uploadProgress: 0,
  };
}

// ─── Bouton upload vidéo ──────────────────────────────────────────────────────

function VideoUploadBtn({
  videoId,
  onUpload,
  status,
  isUploaded,
  progress,
}: {
  videoId: string;
  onUpload: (file: File) => void;
  status: UploadStatus;
  isUploaded: boolean;
  progress: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const done = status === "done" || isUploaded;
  return (
    <div className="flex flex-col gap-1 flex-1">
      <div className="flex items-center gap-1.5">
        <input
          ref={inputRef}
          type="file"
          accept="video/*,.mp4,.webm,.mov,.avi,.mkv"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); e.target.value = ""; }}
        />
        <button
          onClick={() => inputRef.current?.click()}
          disabled={status === "uploading"}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all border disabled:opacity-50 ${
            done
              ? "bg-emerald-900/30 border-emerald-700/40 text-emerald-400"
              : status === "error"
              ? "bg-red-900/30 border-red-700/40 text-red-400 cursor-pointer"
              : "bg-white/5 border-white/15 hover:border-[#E8B800]/40 text-gray-400 hover:text-[#E8B800] cursor-pointer"
          }`}
        >
          {status === "uploading" ? <Loader2 size={11} className="animate-spin" />
            : done ? <FileCheck size={11} />
            : status === "error" ? <AlertCircle size={11} />
            : <Upload size={11} />}
          {status === "uploading" ? `Envoi… ${progress}%`
            : done ? "Uploadée ✓"
            : status === "error" ? "Erreur — Réessayer"
            : "Uploader depuis le PC"}
        </button>
        {done && <span className="text-gray-600 text-[10px] font-mono truncate max-w-20">id:{videoId.slice(-8)}</span>}
      </div>
      {status === "uploading" && (
        <UploadProgressBar percent={progress} label="Envoi de la vidéo…" />
      )}
    </div>
  );
}

// ─── Panel principal ──────────────────────────────────────────────────────────

export function VideoManagerPanel({ formationId }: { formationId: string }) {
  const [modules, setModules] = useState<ModuleForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);
  const [uploadedIds, setUploadedIds] = useState<Set<string>>(new Set());

  const inputCls = "px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-white text-xs placeholder-gray-600 focus:outline-none focus:border-[#E8B800] transition-colors";

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [videosRes, uploadedRes] = await Promise.all([
          fetch("/api/admin/formation-videos", { headers: { "x-admin-password": ADMIN_PASSWORD } }),
          fetch(`/api/admin/upload-video?formationId=${encodeURIComponent(formationId)}`, { headers: { "x-admin-password": ADMIN_PASSWORD } }),
        ]);
        const videosData = await videosRes.json();
        const uploadedData = await uploadedRes.json();

        const existing = (videosData[formationId] || []) as Array<{
          id: string;
          titre: string;
          lecons?: Array<{ id: string; titre: string; videos: Array<{ id: string; titre: string; duree: string; url: string }> }>;
          videos?: Array<{ id: string; titre: string; duree: string; url: string }>;
        }>;

        setModules(existing.map((m) => ({
          id: m.id,
          titre: m.titre,
          collapsed: false,
          lecons: m.lecons
            ? m.lecons.map((l) => ({ id: l.id, titre: l.titre, collapsed: false, videos: l.videos.map(toVideoForm) }))
            : m.videos && m.videos.length > 0
            ? [{ id: genId("l"), titre: "Leçon 1", collapsed: false, videos: m.videos.map(toVideoForm) }]
            : [],
        })));
        setUploadedIds(new Set(uploadedData.uploaded || []));
      } catch { /* vide */ }
      finally { setLoading(false); }
    }
    load();
  }, [formationId]);

  // ── Sauvegarde ──────────────────────────────────────────────────────────────

  async function save(mods: ModuleForm[]) {
    setSaving(true);
    try {
      await fetch("/api/admin/formation-videos", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-password": ADMIN_PASSWORD },
        body: JSON.stringify({
          formationId,
          modules: mods.map((m) => ({
            id: m.id,
            titre: m.titre,
            lecons: m.lecons.map((l) => ({
              id: l.id,
              titre: l.titre,
              videos: l.videos.map((v) => ({
                id: v.id,
                titre: v.titre,
                duree: v.duree,
                url: v.urlType === "local" ? `local:${v.id}` : v.url,
              })),
            })),
          })),
        }),
      });
      setSavedOk(true);
      setTimeout(() => setSavedOk(false), 2500);
    } finally { setSaving(false); }
  }

  // ── Modules ─────────────────────────────────────────────────────────────────

  function addModule() {
    setModules((prev) => [...prev, {
      id: genId("m"),
      titre: "",
      collapsed: false,
      lecons: [],
    }]);
  }

  function removeModule(modId: string) {
    setModules((prev) => prev.filter((m) => m.id !== modId));
  }

  function updateModule(modId: string, titre: string) {
    setModules((prev) => prev.map((m) => m.id === modId ? { ...m, titre } : m));
  }

  function toggleModule(modId: string) {
    setModules((prev) => prev.map((m) => m.id === modId ? { ...m, collapsed: !m.collapsed } : m));
  }

  // ── Leçons ──────────────────────────────────────────────────────────────────

  function addLecon(modId: string) {
    const lecon: LeconForm = { id: genId("l"), titre: "", collapsed: false, videos: [] };
    setModules((prev) => prev.map((m) => m.id === modId ? { ...m, lecons: [...m.lecons, lecon] } : m));
  }

  function removeLecon(modId: string, leconId: string) {
    setModules((prev) => prev.map((m) => m.id === modId
      ? { ...m, lecons: m.lecons.filter((l) => l.id !== leconId) }
      : m
    ));
  }

  function updateLecon(modId: string, leconId: string, titre: string) {
    setModules((prev) => prev.map((m) => m.id === modId
      ? { ...m, lecons: m.lecons.map((l) => l.id === leconId ? { ...l, titre } : l) }
      : m
    ));
  }

  function toggleLecon(modId: string, leconId: string) {
    setModules((prev) => prev.map((m) => m.id === modId
      ? { ...m, lecons: m.lecons.map((l) => l.id === leconId ? { ...l, collapsed: !l.collapsed } : l) }
      : m
    ));
  }

  // ── Vidéos ──────────────────────────────────────────────────────────────────

  function addVideo(modId: string, leconId: string) {
    const vid: VideoForm = { id: genId("v"), titre: "", duree: "", urlType: "local", url: "", uploadStatus: "idle", uploadProgress: 0 };
    setModules((prev) => prev.map((m) => m.id === modId
      ? { ...m, lecons: m.lecons.map((l) => l.id === leconId ? { ...l, videos: [...l.videos, vid] } : l) }
      : m
    ));
  }

  function removeVideo(modId: string, leconId: string, vidId: string) {
    setModules((prev) => prev.map((m) => m.id === modId
      ? { ...m, lecons: m.lecons.map((l) => l.id === leconId ? { ...l, videos: l.videos.filter((v) => v.id !== vidId) } : l) }
      : m
    ));
  }

  function updateVideo(modId: string, leconId: string, vidId: string, patch: Partial<VideoForm>) {
    setModules((prev) => prev.map((m) => m.id === modId
      ? { ...m, lecons: m.lecons.map((l) => l.id === leconId
          ? { ...l, videos: l.videos.map((v) => v.id === vidId ? { ...v, ...patch } : v) }
          : l
        ) }
      : m
    ));
  }

  async function uploadVideo(modId: string, leconId: string, vidId: string, file: File) {
    updateVideo(modId, leconId, vidId, { uploadStatus: "uploading", uploadProgress: 0 });
    try {
      const fd = new FormData();
      fd.append("formationId", formationId);
      fd.append("videoId", vidId);
      fd.append("file", file);
      const res = await uploadWithProgress(
        "/api/admin/upload-video",
        fd,
        { "x-admin-password": ADMIN_PASSWORD },
        (pct) => updateVideo(modId, leconId, vidId, { uploadProgress: pct }),
      );
      const json = await res.data() as { success?: boolean };
      if (json.success) {
        updateVideo(modId, leconId, vidId, { uploadStatus: "done", uploadProgress: 100 });
        setUploadedIds((prev) => new Set([...prev, vidId]));
      } else {
        updateVideo(modId, leconId, vidId, { uploadStatus: "error" });
      }
    } catch {
      updateVideo(modId, leconId, vidId, { uploadStatus: "error" });
    }
  }

  // ── Statistiques ─────────────────────────────────────────────────────────────

  const totalLecons = modules.reduce((n, m) => n + m.lecons.length, 0);
  const totalVideos = modules.reduce((n, m) => n + m.lecons.reduce((k, l) => k + l.videos.length, 0), 0);

  // ── Rendu ────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="mt-3 p-4 bg-[#0d0d18] border border-white/8 rounded-xl flex items-center gap-2 text-gray-500 text-xs">
        <Loader2 size={13} className="animate-spin" /> Chargement des vidéos…
      </div>
    );
  }

  return (
    <div className="mt-3 p-4 bg-[#0d0d18] border border-[#E8B800]/15 rounded-xl space-y-4">

      {/* En-tête */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h4 className="text-[#E8B800] text-sm font-bold flex items-center gap-2">
          <Play size={13} /> Modules · Leçons · Vidéos
          <span className="text-gray-600 text-xs font-normal">
            ({modules.length} mod. · {totalLecons} leç. · {totalVideos} vid.)
          </span>
        </h4>
        <div className="flex items-center gap-2">
          <button
            onClick={addModule}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-white/5 border border-white/20 hover:border-[#E8B800]/40 hover:text-[#E8B800] text-gray-400 rounded-lg text-xs font-medium transition-all"
          >
            <Plus size={11} /> Module
          </button>
          <button
            onClick={() => save(modules)}
            disabled={saving}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50 ${
              savedOk
                ? "bg-emerald-900/40 border border-emerald-700/40 text-emerald-400"
                : "bg-[#E8B800]/15 border border-[#E8B800]/30 text-[#E8B800] hover:bg-[#E8B800]/25"
            }`}
          >
            {saving ? <Loader2 size={11} className="animate-spin" />
              : savedOk ? <CheckCircle size={11} />
              : <Save size={11} />}
            {saving ? "Sauvegarde…" : savedOk ? "Sauvegardé !" : "Sauvegarder"}
          </button>
        </div>
      </div>

      {modules.length === 0 && (
        <p className="text-gray-600 text-xs py-1">
          Aucun module. Cliquez sur <span className="text-gray-400">&quot;+ Module&quot;</span> pour structurer la formation.
        </p>
      )}

      {/* ── Liste des modules ───────────────────────────────────────────────── */}
      <div className="space-y-3">
        {modules.map((mod, modIdx) => (
          <div key={mod.id} className="border border-white/10 rounded-xl overflow-hidden">

            {/* Titre module */}
            <div className="flex items-center gap-2 px-3 py-2 bg-white/[0.04]">
              <button onClick={() => toggleModule(mod.id)} className="text-gray-500 hover:text-gray-300 transition-colors shrink-0">
                {mod.collapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
              </button>
              <span className="text-[#E8B800] text-[10px] font-bold uppercase tracking-wide shrink-0 w-12">
                Mod. {modIdx + 1}
              </span>
              <input
                type="text"
                value={mod.titre}
                onChange={(e) => updateModule(mod.id, e.target.value)}
                className={`${inputCls} flex-1`}
                placeholder="Titre du module (ex : Introduction à la publicité)"
              />
              <button
                onClick={() => addLecon(mod.id)}
                className="flex items-center gap-1 px-2 py-1 bg-green-900/30 border border-green-700/30 text-green-400 hover:bg-green-900/50 rounded-lg text-[10px] font-medium transition-all shrink-0"
              >
                <Plus size={10} /> Leçon
              </button>
              <button onClick={() => removeModule(mod.id)} className="p-1 text-gray-700 hover:text-red-400 rounded transition-colors shrink-0" title="Supprimer ce module">
                <Trash2 size={12} />
              </button>
            </div>

            {/* ── Leçons ─────────────────────────────────────────────────────── */}
            {!mod.collapsed && (
              <div className="p-2 space-y-2">
                {mod.lecons.length === 0 && (
                  <p className="text-gray-700 text-[10px] text-center py-2">
                    Aucune leçon — cliquez sur <span className="text-green-400">+ Leçon</span> pour en ajouter.
                  </p>
                )}

                {mod.lecons.map((lecon, leconIdx) => (
                  <div key={lecon.id} className="border border-white/6 rounded-lg overflow-hidden ml-2">

                    {/* Titre leçon */}
                    <div className="flex items-center gap-2 px-3 py-2 bg-white/[0.025]">
                      <button onClick={() => toggleLecon(mod.id, lecon.id)} className="text-gray-600 hover:text-gray-400 transition-colors shrink-0">
                        {lecon.collapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                      </button>
                      <BookOpen size={11} className="text-green-400 shrink-0" />
                      <span className="text-green-300 text-[10px] font-bold shrink-0 w-12">
                        Leç. {leconIdx + 1}
                      </span>
                      <input
                        type="text"
                        value={lecon.titre}
                        onChange={(e) => updateLecon(mod.id, lecon.id, e.target.value)}
                        className={`${inputCls} flex-1`}
                        placeholder="Titre de la leçon (ex : Ciblage d'audience)"
                      />
                      <span className="text-gray-700 text-[10px] shrink-0">
                        {lecon.videos.length} vid.
                      </span>
                      <button onClick={() => removeLecon(mod.id, lecon.id)} className="p-1 text-gray-700 hover:text-red-400 rounded transition-colors shrink-0" title="Supprimer cette leçon">
                        <X size={11} />
                      </button>
                    </div>

                    {/* ── Vidéos de la leçon ──────────────────────────────────── */}
                    {!lecon.collapsed && (
                      <div className="p-2 pl-4 space-y-1.5">
                        {lecon.videos.map((vid, vidIdx) => {
                          const isUploaded = uploadedIds.has(vid.id);
                          return (
                            <div key={vid.id} className="p-2.5 bg-white/[0.015] border border-white/5 rounded-lg space-y-2">
                              {/* Titre + durée + supprimer */}
                              <div className="flex items-center gap-2">
                                <span className="text-gray-700 text-[10px] shrink-0 w-6">V{vidIdx + 1}</span>
                                <input
                                  type="text"
                                  value={vid.titre}
                                  onChange={(e) => updateVideo(mod.id, lecon.id, vid.id, { titre: e.target.value })}
                                  className={`${inputCls} flex-1`}
                                  placeholder="Titre de la vidéo"
                                />
                                <input
                                  type="text"
                                  value={vid.duree}
                                  onChange={(e) => updateVideo(mod.id, lecon.id, vid.id, { duree: e.target.value })}
                                  className={`${inputCls} w-16 text-center`}
                                  placeholder="5min"
                                  title="Durée"
                                />
                                <button
                                  onClick={() => removeVideo(mod.id, lecon.id, vid.id)}
                                  className="p-1 text-gray-700 hover:text-red-400 rounded transition-colors shrink-0"
                                >
                                  <X size={11} />
                                </button>
                              </div>
                              {/* Source + upload/URL */}
                              <div className="flex items-center gap-2 flex-wrap">
                                <select
                                  value={vid.urlType}
                                  onChange={(e) => updateVideo(mod.id, lecon.id, vid.id, { urlType: e.target.value as "local" | "external", url: "" })}
                                  className="px-2 py-1 bg-[#0e0e1a] border border-white/10 rounded-lg text-[10px] text-gray-400 focus:outline-none focus:border-[#E8B800]"
                                >
                                  <option value="local">Fichier PC (upload)</option>
                                  <option value="external">URL (YouTube / Vimeo)</option>
                                </select>
                                {vid.urlType === "local" ? (
                                  <VideoUploadBtn
                                    videoId={vid.id}
                                    onUpload={(f) => uploadVideo(mod.id, lecon.id, vid.id, f)}
                                    status={vid.uploadStatus}
                                    isUploaded={isUploaded}
                                    progress={vid.uploadProgress ?? 0}
                                  />
                                ) : (
                                  <input
                                    type="text"
                                    value={vid.url}
                                    onChange={(e) => updateVideo(mod.id, lecon.id, vid.id, { url: e.target.value })}
                                    className={`${inputCls} flex-1 min-w-48`}
                                    placeholder="https://youtube.com/watch?v=..."
                                  />
                                )}
                              </div>
                            </div>
                          );
                        })}

                        {/* Bouton ajouter vidéo */}
                        <button
                          onClick={() => addVideo(mod.id, lecon.id)}
                          className="flex items-center gap-1 w-full px-3 py-1.5 border border-dashed border-white/10 hover:border-[#E8B800]/30 text-gray-700 hover:text-[#E8B800] rounded-lg text-xs transition-all justify-center"
                        >
                          <Plus size={11} /> Ajouter une vidéo
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {modules.length > 0 && (
        <p className="text-gray-700 text-[10px] border-t border-white/5 pt-3">
          Structure : <span className="text-gray-500">Module → Leçon → Vidéo</span>.
          Après upload, cliquez sur <span className="text-[#E8B800]">Sauvegarder</span>.
        </p>
      )}
    </div>
  );
}