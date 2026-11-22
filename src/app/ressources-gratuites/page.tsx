"use client";

import { useState, useEffect } from "react";
import {
  Gift, FileText, Play, Users, Download, ExternalLink,
  X, CheckCircle, AlertCircle, Loader2, ArrowRight,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

type CommunityType = "whatsapp" | "telegram" | "zoom" | "autre";

type Ressource = {
  id: string;
  slug: string;
  titre: string;
  description: string;
  imageUrl?: string;
  hasPdf: boolean;
  pdfUrl?: string;
  pdfNom?: string;
  hasVideo: boolean;
  videoUrl?: string;
  videoTitre?: string;
  hasCommunity: boolean;
  communityUrl?: string;
  communityLabel?: string;
  communityType?: CommunityType;
};

// ── Utilitaires vidéo ─────────────────────────────────────────────────────────

function getVideoEmbed(url: string): string | null {
  if (!url) return null;
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0&modestbranding=1`;
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  return null;
}

function isDirectVideo(url: string) {
  return /\.(mp4|webm|ogg)(\?|#|$)/i.test(url);
}

const COMMUNITY_CFG: Record<CommunityType, { icon: string; color: string; bg: string; border: string }> = {
  whatsapp: { icon: "💬", color: "text-green-700", bg: "bg-green-500", border: "border-green-500" },
  telegram: { icon: "✈️", color: "text-blue-700", bg: "bg-blue-500", border: "border-blue-500" },
  zoom:     { icon: "📹", color: "text-blue-700", bg: "bg-blue-600", border: "border-blue-600" },
  autre:    { icon: "🔗", color: "text-gray-700", bg: "bg-gray-600", border: "border-gray-600" },
};

const inputCls =
  "w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:border-[#E8B800] focus:ring-2 focus:ring-[#E8B800]/20 transition-colors placeholder-gray-400 bg-white";

// ── Page ──────────────────────────────────────────────────────────────────────

export default function RessourcesGratuitesPage() {
  const [ressources, setRessources] = useState<Ressource[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Ressource | null>(null);
  const [claimed, setClaimed] = useState<Ressource | null>(null);

  useEffect(() => {
    fetch("/api/ressources-gratuites")
      .then((r) => r.json())
      .then((d) => setRessources(d.ressources ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Hero */}
      <div className="max-w-4xl mx-auto px-4 pt-16 pb-10 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#E8B800]/10 border border-[#E8B800]/30 rounded-full text-[#E8B800] text-sm font-semibold mb-6">
          <Gift size={15} /> Ressources 100% gratuites
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
          Téléchargez & Apprenez<br />
          <span className="text-[#E8B800]">Sans rien payer</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-xl mx-auto">
          Des guides, formations et communautés sélectionnés pour vous aider à démarrer et développer votre activité.
        </p>
      </div>

      {/* Grille */}
      <div className="max-w-6xl mx-auto px-4 pb-20">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={32} className="animate-spin text-gray-600" />
          </div>
        ) : ressources.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <Gift size={48} className="mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium">Aucune ressource disponible pour le moment.</p>
            <p className="text-sm mt-1">Revenez bientôt !</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {ressources.map((r) => (
              <RessourceCard key={r.id} r={r} onClaim={() => setSelected(r)} />
            ))}
          </div>
        )}
      </div>

      {/* Modal formulaire */}
      {selected && !claimed && (
        <ClaimModal
          r={selected}
          onClose={() => setSelected(null)}
          onSuccess={(r) => { setClaimed(r); setSelected(null); }}
        />
      )}

      {/* Modal accès */}
      {claimed && (
        <AccessModal r={claimed} onClose={() => setClaimed(null)} />
      )}
    </div>
  );
}

// ── Carte ressource ────────────────────────────────────────────────────────────

function RessourceCard({ r, onClaim }: { r: Ressource; onClaim: () => void }) {
  const badgeCount = [r.hasPdf, r.hasVideo, r.hasCommunity].filter(Boolean).length;
  const isSingle = badgeCount === 1;
  const buttonLabel = r.hasCommunity && isSingle ? "Rejoindre gratuitement" : "Obtenir gratuitement";

  return (
    <div className="group bg-white/[0.04] border border-white/10 rounded-2xl overflow-hidden hover:border-[#E8B800]/40 transition-all hover:bg-white/[0.06]">
      {r.imageUrl ? (
        <img src={r.imageUrl} alt={r.titre} className="w-full h-44 object-cover" />
      ) : (
        <div className="w-full h-44 bg-gradient-to-br from-amber-900/40 to-amber-800/20 flex items-center justify-center">
          <Gift size={48} className="text-amber-400/60" />
        </div>
      )}

      <div className="p-5">
        {/* Badges de contenu */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {r.hasPdf && (
            <span className="flex items-center gap-1 text-xs text-blue-400 bg-blue-900/30 border border-blue-800/40 px-2 py-0.5 rounded-full">
              <FileText size={10} /> PDF
            </span>
          )}
          {r.hasVideo && (
            <span className="flex items-center gap-1 text-xs text-purple-400 bg-purple-900/30 border border-purple-800/40 px-2 py-0.5 rounded-full">
              <Play size={10} /> Vidéo
            </span>
          )}
          {r.hasCommunity && (
            <span className="flex items-center gap-1 text-xs text-green-400 bg-green-900/30 border border-green-800/40 px-2 py-0.5 rounded-full">
              <Users size={10} /> {r.communityType === "whatsapp" ? "WhatsApp" : r.communityType === "telegram" ? "Telegram" : r.communityType === "zoom" ? "Zoom" : "Communauté"}
            </span>
          )}
          <span className="ml-auto text-xs font-bold text-[#E8B800] bg-[#E8B800]/10 border border-[#E8B800]/20 px-2 py-0.5 rounded-full">
            GRATUIT
          </span>
        </div>

        <h3 className="font-bold text-white text-base mb-2 line-clamp-2">{r.titre}</h3>
        {r.description && <p className="text-gray-400 text-sm leading-relaxed mb-4 line-clamp-2">{r.description}</p>}

        <button onClick={onClaim}
          className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-[#E8B800] to-[#27A827] text-black font-bold rounded-xl text-sm transition-all hover:opacity-90 hover:scale-[1.02]">
          <Gift size={15} /> {buttonLabel} <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}

// ── Modal formulaire ───────────────────────────────────────────────────────────

function ClaimModal({
  r, onClose, onSuccess,
}: {
  r: Ressource; onClose: () => void; onSuccess: (r: Ressource) => void;
}) {
  const [form, setForm] = useState({ nom: "", prenom: "", email: "", telephone: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.nom.trim() || !form.prenom.trim() || !form.email.trim() || !form.telephone.trim()) {
      setError("Tous les champs sont obligatoires.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError("Adresse e-mail invalide.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ressourceId: r.id, ...form }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Erreur, réessayez."); return; }
      onSuccess(data.ressource as Ressource);
    } catch { setError("Erreur réseau. Réessayez."); }
    setSubmitting(false);
  }

  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value });

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-gray-900">Accès gratuit</h2>
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{r.titre}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-sm text-gray-600">
            Renseignez vos coordonnées pour accéder immédiatement à cette ressource gratuite.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Prénom *</label>
              <input value={form.prenom} onChange={f("prenom")} className={inputCls} placeholder="Jean" autoFocus />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Nom *</label>
              <input value={form.nom} onChange={f("nom")} className={inputCls} placeholder="Dupont" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">E-mail *</label>
            <input type="email" value={form.email} onChange={f("email")} className={inputCls} placeholder="jean@exemple.com" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Téléphone *</label>
            <input type="tel" value={form.telephone} onChange={f("telephone")} className={inputCls} placeholder="+237 6 XX XX XX XX" />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <button type="submit" disabled={submitting}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-[#E8B800] to-[#27A827] text-black font-bold rounded-xl transition-all hover:opacity-90 disabled:opacity-60">
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <><Gift size={16} /> Accéder gratuitement</>}
          </button>

          <p className="text-center text-xs text-gray-400">
            Vos données sont utilisées uniquement pour vous envoyer des ressources. Pas de spam.
          </p>
        </form>
      </div>
    </div>
  );
}

// ── Modal accès aux contenus ───────────────────────────────────────────────────

function AccessModal({ r, onClose }: { r: Ressource; onClose: () => void }) {
  const embedUrl = r.videoUrl ? getVideoEmbed(r.videoUrl) : null;
  const isDirect = r.videoUrl ? isDirectVideo(r.videoUrl) : false;
  const commCfg = COMMUNITY_CFG[r.communityType || "autre"];

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-6">
        {/* En-tête succès */}
        <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle size={20} className="text-white" />
              </div>
              <div>
                <h2 className="font-bold text-green-900">Accès accordé !</h2>
                <p className="text-green-700 text-xs">Voici votre contenu gratuit</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-xl">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <h3 className="font-bold text-gray-900 text-lg">{r.titre}</h3>
          {r.description && <p className="text-gray-600 text-sm">{r.description}</p>}

          {/* PDF */}
          {r.hasPdf && r.pdfUrl && (
            <div className="border border-blue-200 bg-blue-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <FileText size={16} className="text-blue-600" />
                <span className="font-semibold text-blue-900 text-sm">Téléchargement PDF</span>
              </div>
              <a href={r.pdfUrl} download={r.pdfNom || true} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-colors">
                <Download size={15} /> {r.pdfNom || "Télécharger le fichier"}
              </a>
            </div>
          )}

          {/* Vidéo */}
          {r.hasVideo && r.videoUrl && (
            <div className="border border-purple-200 bg-purple-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Play size={16} className="text-purple-600" />
                <span className="font-semibold text-purple-900 text-sm">{r.videoTitre || "Vidéo / Formation"}</span>
              </div>
              {embedUrl ? (
                <div className="aspect-video rounded-xl overflow-hidden bg-black">
                  <iframe src={embedUrl} className="w-full h-full" allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
                </div>
              ) : isDirect ? (
                <video src={r.videoUrl} controls className="w-full rounded-xl" />
              ) : (
                <a href={r.videoUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-sm transition-colors">
                  <ExternalLink size={15} /> Accéder à la vidéo
                </a>
              )}
            </div>
          )}

          {/* Communauté */}
          {r.hasCommunity && r.communityUrl && (
            <div className={`border rounded-xl p-4 bg-opacity-5`} style={{ borderColor: commCfg.bg.replace("bg-", "") }}>
              <div className="flex items-center gap-2 mb-3">
                <Users size={16} className="text-green-600" />
                <span className="font-semibold text-gray-900 text-sm">Communauté / Événement</span>
              </div>
              <a href={r.communityUrl} target="_blank" rel="noopener noreferrer"
                className={`flex items-center justify-center gap-2 w-full py-3 ${commCfg.bg} hover:opacity-90 text-white font-bold rounded-xl text-sm transition-all`}>
                <span className="text-base">{commCfg.icon}</span>
                {r.communityLabel || "Rejoindre"}
                <ExternalLink size={14} />
              </a>
            </div>
          )}

          <button onClick={onClose}
            className="w-full py-3 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl text-sm font-medium transition-colors">
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
