"use client";

import { useState, useEffect } from "react";
import { Save, CheckCircle, Loader2, Video, X } from "lucide-react";

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? "";

function toYouTubeEmbed(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") return `https://www.youtube.com/embed${u.pathname}`;
    if (u.hostname.includes("youtube.com")) {
      if (u.pathname === "/watch") { const v = u.searchParams.get("v"); return v ? `https://www.youtube.com/embed/${v}` : null; }
      if (u.pathname.startsWith("/embed/")) return url;
    }
    if (u.hostname.includes("vimeo.com")) { const m = url.match(/vimeo\.com\/(\d+)/); return m ? `https://player.vimeo.com/video/${m[1]}` : null; }
    return null;
  } catch { return null; }
}

export function PromoVideoAdmin() {
  const [formation, setFormation] = useState("");
  const [accompagnement, setAccompagnement] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/promo-videos", { headers: { "x-admin-password": ADMIN_PASSWORD } })
      .then((r) => r.json())
      .then((d) => { setFormation(d.formation ?? ""); setAccompagnement(d.accompagnement ?? ""); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    try {
      await fetch("/api/admin/promo-videos", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-password": ADMIN_PASSWORD },
        body: JSON.stringify({ formation, accompagnement }),
      });
      setSavedOk(true);
      setTimeout(() => setSavedOk(false), 2500);
    } finally { setSaving(false); }
  }

  const inputCls = "w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#E8B800] transition-colors";

  if (loading) return <div className="p-4 flex items-center gap-2 text-gray-500 text-xs"><Loader2 size={13} className="animate-spin" /> Chargement…</div>;

  return (
    <div className="mb-8 p-5 bg-[#0d0d18] border border-[#E8B800]/20 rounded-2xl space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-[#E8B800] font-bold flex items-center gap-2">
          <Video size={16} /> Vidéos de présentation (visibles par tous)
        </h3>
        <button
          onClick={save}
          disabled={saving}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50 ${savedOk ? "bg-emerald-900/40 border border-emerald-700/40 text-emerald-400" : "bg-[#E8B800]/15 border border-[#E8B800]/30 text-[#E8B800] hover:bg-[#E8B800]/25"}`}
        >
          {saving ? <Loader2 size={11} className="animate-spin" /> : savedOk ? <CheckCircle size={11} /> : <Save size={11} />}
          {saving ? "Sauvegarde…" : savedOk ? "Sauvegardé !" : "Sauvegarder"}
        </button>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {/* Formation */}
        <div className="space-y-2">
          <label className="block text-gray-400 text-xs font-medium">Page Formations — URL vidéo</label>
          <div className="flex gap-2">
            <input type="text" value={formation} onChange={(e) => setFormation(e.target.value)} className={inputCls} placeholder="https://youtu.be/... ou https://vimeo.com/..." />
            {formation && <button onClick={() => setFormation("")} className="p-2 text-gray-600 hover:text-red-400 rounded-lg shrink-0"><X size={13} /></button>}
          </div>
          {formation && toYouTubeEmbed(formation) && (
            <div className="relative w-full rounded-xl overflow-hidden border border-white/10" style={{ paddingTop: "40%" }}>
              <iframe src={toYouTubeEmbed(formation)!} className="absolute inset-0 w-full h-full" allow="autoplay; fullscreen" allowFullScreen />
            </div>
          )}
          {formation && !toYouTubeEmbed(formation) && (
            <video src={formation} controls className="w-full rounded-xl max-h-32" />
          )}
        </div>

        {/* Accompagnement */}
        <div className="space-y-2">
          <label className="block text-gray-400 text-xs font-medium">Page Accompagnement — URL vidéo</label>
          <div className="flex gap-2">
            <input type="text" value={accompagnement} onChange={(e) => setAccompagnement(e.target.value)} className={inputCls} placeholder="https://youtu.be/... ou https://vimeo.com/..." />
            {accompagnement && <button onClick={() => setAccompagnement("")} className="p-2 text-gray-600 hover:text-red-400 rounded-lg shrink-0"><X size={13} /></button>}
          </div>
          {accompagnement && toYouTubeEmbed(accompagnement) && (
            <div className="relative w-full rounded-xl overflow-hidden border border-white/10" style={{ paddingTop: "40%" }}>
              <iframe src={toYouTubeEmbed(accompagnement)!} className="absolute inset-0 w-full h-full" allow="autoplay; fullscreen" allowFullScreen />
            </div>
          )}
          {accompagnement && !toYouTubeEmbed(accompagnement) && (
            <video src={accompagnement} controls className="w-full rounded-xl max-h-32" />
          )}
        </div>
      </div>

      <p className="text-gray-600 text-xs">Ces vidéos apparaissent dans le hero de chaque page, visibles par tous les visiteurs sans inscription.</p>
    </div>
  );
}