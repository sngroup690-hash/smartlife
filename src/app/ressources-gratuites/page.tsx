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

const inputCls =
  "w-full px-4 py-3 border border-[var(--g-ligne)] rounded-[10px] text-[var(--g-encre)] text-sm focus:outline-none focus:border-[var(--g-encre)] transition-colors placeholder-[var(--g-gris)]/60 bg-white";

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
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="max-w-4xl mx-auto px-4 pt-16 pb-10 text-center">
        <p className="inline-flex items-center gap-2 text-[14px] font-semibold text-[var(--g-vert)] mb-5">
          <Gift size={15} /> Ressources 100% gratuites
        </p>
        <h1 className="text-4xl md:text-5xl font-semibold tracking-[-0.02em] text-[var(--g-encre)] mb-4 leading-tight">
          Téléchargez & Apprenez<br />
          <span className="g-surligne">Sans rien payer</span>
        </h1>
        <p className="text-[var(--g-gris)] text-lg max-w-xl mx-auto">
          Des guides, formations et communautés sélectionnés pour vous aider à démarrer et développer votre activité.
        </p>
      </div>

      {/* Grille */}
      <div className="max-w-6xl mx-auto px-4 pb-20">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={32} className="animate-spin text-[var(--g-gris)]" />
          </div>
        ) : ressources.length === 0 ? (
          <div className="text-center py-20 text-[var(--g-gris)]">
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
    <div className="group bg-white border border-[var(--g-ligne)] rounded-[14px] overflow-hidden hover:border-[var(--g-encre)]/30 transition-colors">
      {r.imageUrl ? (
        <img src={r.imageUrl} alt={r.titre} className="w-full h-44 object-cover" />
      ) : (
        <div className="w-full h-44 bg-[var(--g-jaune-doux)] flex items-center justify-center">
          <Gift size={48} className="text-[var(--g-vert)]" />
        </div>
      )}

      <div className="p-5">
        {/* Badges de contenu */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {r.hasPdf && (
            <span className="flex items-center gap-1 text-xs font-medium text-[var(--g-gris)] bg-[var(--g-doux)] px-2 py-0.5 rounded-[6px]">
              <FileText size={10} /> PDF
            </span>
          )}
          {r.hasVideo && (
            <span className="flex items-center gap-1 text-xs font-medium text-[var(--g-gris)] bg-[var(--g-doux)] px-2 py-0.5 rounded-[6px]">
              <Play size={10} /> Vidéo
            </span>
          )}
          {r.hasCommunity && (
            <span className="flex items-center gap-1 text-xs font-medium text-[var(--g-gris)] bg-[var(--g-doux)] px-2 py-0.5 rounded-[6px]">
              <Users size={10} /> {r.communityType === "whatsapp" ? "WhatsApp" : r.communityType === "telegram" ? "Telegram" : r.communityType === "zoom" ? "Zoom" : "Communauté"}
            </span>
          )}
          <span className="ml-auto text-[13px] font-semibold text-[var(--g-vert)]">
            Gratuit
          </span>
        </div>

        <h3 className="font-semibold tracking-[-0.01em] text-[var(--g-encre)] text-base mb-2 line-clamp-2">{r.titre}</h3>
        {r.description && <p className="text-[var(--g-gris)] text-sm leading-relaxed mb-4 line-clamp-2">{r.description}</p>}

        <button onClick={onClaim}
          className="g-btn w-full text-[15px]">
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
      <div className="bg-white rounded-[16px] w-full max-w-md">
        <div className="p-5 border-b border-[var(--g-ligne)] flex items-center justify-between">
          <div>
            <h2 className="font-semibold tracking-[-0.01em] text-[var(--g-encre)]">Accès gratuit</h2>
            <p className="text-xs text-[var(--g-gris)] mt-0.5 line-clamp-1">{r.titre}</p>
          </div>
          <button onClick={onClose} className="p-2 text-[var(--g-gris)] hover:text-[var(--g-encre)] hover:bg-[var(--g-doux)] rounded-[10px]">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-sm text-[var(--g-gris)]">
            Renseignez vos coordonnées pour accéder immédiatement à cette ressource gratuite.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--g-encre)] mb-1.5">Prénom *</label>
              <input value={form.prenom} onChange={f("prenom")} className={inputCls} placeholder="Jean" autoFocus />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--g-encre)] mb-1.5">Nom *</label>
              <input value={form.nom} onChange={f("nom")} className={inputCls} placeholder="Dupont" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--g-encre)] mb-1.5">E-mail *</label>
            <input type="email" value={form.email} onChange={f("email")} className={inputCls} placeholder="jean@exemple.com" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--g-encre)] mb-1.5">Téléphone *</label>
            <input type="tel" value={form.telephone} onChange={f("telephone")} className={inputCls} placeholder="+237 6 XX XX XX XX" />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-[10px] text-red-600 text-sm">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <button type="submit" disabled={submitting}
            className="g-btn w-full disabled:opacity-60">
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <><Gift size={16} /> Accéder gratuitement</>}
          </button>

          <p className="text-center text-xs text-[var(--g-gris)]">
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

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-[16px] w-full max-w-lg my-6">
        {/* En-tête succès */}
        <div className="p-6 bg-[var(--g-vert-doux)] rounded-t-[16px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--g-vert)] rounded-full flex items-center justify-center">
                <CheckCircle size={20} className="text-white" />
              </div>
              <div>
                <h2 className="font-semibold tracking-[-0.01em] text-[var(--g-encre)]">Accès accordé !</h2>
                <p className="text-[var(--g-vert)] text-xs">Voici votre contenu gratuit</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-[var(--g-gris)] hover:text-[var(--g-encre)] hover:bg-white/60 rounded-[10px]">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <h3 className="font-semibold tracking-[-0.02em] text-[var(--g-encre)] text-lg">{r.titre}</h3>
          {r.description && <p className="text-[var(--g-gris)] text-sm">{r.description}</p>}

          {/* PDF */}
          {r.hasPdf && r.pdfUrl && (
            <div className="border border-[var(--g-ligne)] rounded-[12px] p-4">
              <div className="flex items-center gap-2 mb-3">
                <FileText size={16} className="text-[var(--g-vert)]" />
                <span className="font-semibold text-[var(--g-encre)] text-sm">Téléchargement PDF</span>
              </div>
              <a href={r.pdfUrl} download={r.pdfNom || true} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full h-12 bg-[var(--g-vert)] hover:bg-[var(--g-vert-profond)] text-white font-semibold rounded-[10px] text-sm transition-colors">
                <Download size={15} /> {r.pdfNom || "Télécharger le fichier"}
              </a>
            </div>
          )}

          {/* Vidéo */}
          {r.hasVideo && r.videoUrl && (
            <div className="border border-[var(--g-ligne)] rounded-[12px] p-4">
              <div className="flex items-center gap-2 mb-3">
                <Play size={16} className="text-[var(--g-vert)]" />
                <span className="font-semibold text-[var(--g-encre)] text-sm">{r.videoTitre || "Vidéo / Formation"}</span>
              </div>
              {embedUrl ? (
                <div className="aspect-video rounded-[10px] overflow-hidden bg-black">
                  <iframe src={embedUrl} className="w-full h-full" allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
                </div>
              ) : isDirect ? (
                <video src={r.videoUrl} controls className="w-full rounded-[10px]" />
              ) : (
                <a href={r.videoUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full h-12 bg-[var(--g-vert)] hover:bg-[var(--g-vert-profond)] text-white font-semibold rounded-[10px] text-sm transition-colors">
                  <ExternalLink size={15} /> Accéder à la vidéo
                </a>
              )}
            </div>
          )}

          {/* Communauté */}
          {r.hasCommunity && r.communityUrl && (
            <div className="border border-[var(--g-ligne)] rounded-[12px] p-4">
              <div className="flex items-center gap-2 mb-3">
                <Users size={16} className="text-[var(--g-vert)]" />
                <span className="font-semibold text-[var(--g-encre)] text-sm">Communauté / Événement</span>
              </div>
              <a href={r.communityUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full h-12 bg-[var(--g-vert)] hover:bg-[var(--g-vert-profond)] text-white font-semibold rounded-[10px] text-sm transition-colors">
                {r.communityLabel || "Rejoindre"}
                <ExternalLink size={14} />
              </a>
            </div>
          )}

          <button onClick={onClose}
            className="g-btn-ghost w-full text-[15px]">
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
