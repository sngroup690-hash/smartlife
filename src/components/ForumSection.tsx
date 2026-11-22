"use client";

import { useState, useEffect, useCallback } from "react";
import { MessageSquare, ChevronDown, ChevronUp, Pin, CheckCircle, Trash2, Send, Loader2, Shield } from "lucide-react";

type ForumReply = {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
  isAdmin?: boolean;
};

type ForumPost = {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
  replies: ForumReply[];
  pinned?: boolean;
  resolved?: boolean;
};

interface ForumSectionProps {
  formationId: string;
  userId?: string;
  userName?: string;
  canPost: boolean;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "à l'instant";
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h}h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `il y a ${d}j`;
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export default function ForumSection({ formationId, userId, userName, canPost }: ForumSectionProps) {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [newContent, setNewContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [adminPassword, setAdminPassword] = useState<string | null>(null);
  const [titleClickCount, setTitleClickCount] = useState(0);

  const isAdmin = !!adminPassword;

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/formation/${formationId}/forum`);
      const data = await res.json();
      if (Array.isArray(data.posts)) {
        const sorted = [...data.posts].sort((a, b) => {
          if (a.pinned && !b.pinned) return -1;
          if (!a.pinned && b.pinned) return 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        setPosts(sorted);
      }
    } finally {
      setLoading(false);
    }
  }, [formationId]);

  useEffect(() => { load(); }, [load]);

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handlePost() {
    if (!newContent.trim() || !userId || !userName) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/formation/${formationId}/forum`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "post", userId, userName, content: newContent }),
      });
      const data = await res.json();
      if (data.post) {
        setPosts((prev) => [data.post, ...prev]);
        setNewContent("");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReply(postId: string) {
    if (!replyContent.trim() || !userId || !userName) return;
    setReplySubmitting(true);
    try {
      const res = await fetch(`/api/formation/${formationId}/forum`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reply",
          userId,
          userName,
          content: replyContent,
          postId,
          ...(isAdmin ? { password: adminPassword } : {}),
        }),
      });
      const data = await res.json();
      if (data.reply) {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId ? { ...p, replies: [...p.replies, data.reply] } : p
          )
        );
        setReplyContent("");
        setReplyingTo(null);
        setExpandedIds((prev) => new Set([...prev, postId]));
      }
    } finally {
      setReplySubmitting(false);
    }
  }

  async function handleAdminAction(
    action: "pin" | "resolve" | "delete",
    postId: string,
    replyId?: string
  ) {
    if (!adminPassword) return;
    const res = await fetch(`/api/formation/${formationId}/forum`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, postId, replyId, password: adminPassword }),
    });
    if (res.ok) await load();
  }

  function handleTitleClick() {
    const next = titleClickCount + 1;
    setTitleClickCount(next);
    if (next >= 3) {
      setTitleClickCount(0);
      const pwd = window.prompt("Mot de passe admin :");
      if (pwd) {
        const NEXT_PUBLIC_ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;
        if (pwd === NEXT_PUBLIC_ADMIN_PASSWORD) {
          setAdminPassword(pwd);
        } else {
          window.alert("Mot de passe incorrect.");
        }
      }
    }
  }

  const sorted = [...posts].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="mt-8 bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
      {/* En-tête */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
        <MessageSquare size={18} className="text-[#E8B800] shrink-0" />
        <h3
          className="text-white font-bold text-base cursor-default select-none"
          onClick={handleTitleClick}
        >
          Questions & Réponses
        </h3>
        {posts.length > 0 && (
          <span className="ml-auto text-xs text-white/40 font-medium">
            {posts.length} question{posts.length > 1 ? "s" : ""}
          </span>
        )}
        {isAdmin && (
          <span className="flex items-center gap-1 text-[10px] text-[#E8B800] font-bold">
            <Shield size={11} /> Admin
          </span>
        )}
      </div>

      {/* Formulaire de nouvelle question */}
      {canPost && (
        <div className="px-5 py-4 border-b border-white/[0.06]">
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="Poser une question sur cette formation…"
            rows={3}
            maxLength={2000}
            className="w-full bg-white/[0.05] border border-white/[0.12] rounded-xl px-4 py-3 text-white placeholder:text-white/30 text-sm resize-none focus:outline-none focus:border-[#E8B800]/50 transition-colors"
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-white/20 text-xs">{newContent.length}/2000</span>
            <button
              onClick={handlePost}
              disabled={!newContent.trim() || submitting}
              className="flex items-center gap-2 px-4 py-2 bg-[#E8B800] hover:bg-[#D4A017] disabled:opacity-40 disabled:cursor-not-allowed text-black text-sm font-bold rounded-lg transition-colors"
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              Envoyer
            </button>
          </div>
        </div>
      )}

      {/* Liste des questions */}
      <div className="divide-y divide-white/[0.06]">
        {loading && (
          <div className="flex items-center justify-center py-10">
            <Loader2 size={20} className="animate-spin text-white/30" />
          </div>
        )}

        {!loading && sorted.length === 0 && (
          <div className="py-10 text-center">
            <MessageSquare size={32} className="text-white/10 mx-auto mb-3" />
            <p className="text-white/30 text-sm">Aucune question pour le moment.</p>
            {canPost && (
              <p className="text-white/20 text-xs mt-1">Soyez le premier à poser une question !</p>
            )}
          </div>
        )}

        {!loading &&
          sorted.map((post) => {
            const expanded = expandedIds.has(post.id);
            return (
              <div key={post.id} className="px-5 py-4">
                {/* Question */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 text-xs font-bold text-white/60">
                    {post.userName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white text-sm font-semibold">{post.userName}</span>
                      <span className="text-white/30 text-xs">{timeAgo(post.createdAt)}</span>
                      {post.pinned && (
                        <span className="flex items-center gap-0.5 text-[10px] text-[#E8B800] font-bold">
                          <Pin size={10} /> Épinglé
                        </span>
                      )}
                      {post.resolved && (
                        <span className="flex items-center gap-0.5 text-[10px] text-emerald-400 font-bold">
                          <CheckCircle size={10} /> Résolu
                        </span>
                      )}
                    </div>
                    <p className="text-white/80 text-sm mt-1 leading-relaxed whitespace-pre-wrap break-words">
                      {post.content}
                    </p>

                    {/* Actions barre */}
                    <div className="flex items-center gap-3 mt-2.5">
                      {post.replies.length > 0 && (
                        <button
                          onClick={() => toggleExpand(post.id)}
                          className="flex items-center gap-1 text-xs text-white/40 hover:text-white/70 transition-colors"
                        >
                          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                          {post.replies.length} réponse{post.replies.length > 1 ? "s" : ""}
                        </button>
                      )}
                      {canPost && (
                        <button
                          onClick={() => {
                            setReplyingTo(replyingTo === post.id ? null : post.id);
                            setReplyContent("");
                          }}
                          className="text-xs text-white/40 hover:text-[#E8B800] transition-colors"
                        >
                          Répondre
                        </button>
                      )}
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => handleAdminAction("pin", post.id)}
                            className="text-xs text-white/30 hover:text-[#E8B800] transition-colors"
                          >
                            {post.pinned ? "Désépingler" : "Épingler"}
                          </button>
                          <button
                            onClick={() => handleAdminAction("resolve", post.id)}
                            className="text-xs text-white/30 hover:text-emerald-400 transition-colors"
                          >
                            {post.resolved ? "Non résolu" : "Résolu"}
                          </button>
                          <button
                            onClick={() => handleAdminAction("delete", post.id)}
                            className="text-xs text-white/30 hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={12} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Réponses */}
                {expanded && post.replies.length > 0 && (
                  <div className="ml-11 mt-3 space-y-3">
                    {post.replies.map((reply) => (
                      <div key={reply.id} className="flex items-start gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                            reply.isAdmin
                              ? "bg-[#E8B800]/20 text-[#E8B800]"
                              : "bg-white/[0.06] text-white/50"
                          }`}
                        >
                          {reply.isAdmin ? "A" : reply.userName.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-xs font-semibold ${
                                reply.isAdmin ? "text-[#E8B800]" : "text-white/70"
                              }`}
                            >
                              {reply.userName}
                              {reply.isAdmin && (
                                <span className="ml-1 text-[9px] bg-[#E8B800]/20 text-[#E8B800] px-1 py-0.5 rounded font-bold">
                                  Admin
                                </span>
                              )}
                            </span>
                            <span className="text-white/25 text-[10px]">
                              {timeAgo(reply.createdAt)}
                            </span>
                          </div>
                          <p className="text-white/70 text-sm mt-0.5 leading-relaxed whitespace-pre-wrap break-words">
                            {reply.content}
                          </p>
                        </div>
                        {isAdmin && (
                          <button
                            onClick={() => handleAdminAction("delete", post.id, reply.id)}
                            className="text-white/20 hover:text-red-400 transition-colors shrink-0 mt-0.5"
                          >
                            <Trash2 size={11} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Formulaire de réponse */}
                {replyingTo === post.id && (
                  <div className="ml-11 mt-3">
                    <textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="Votre réponse…"
                      rows={2}
                      maxLength={2000}
                      className="w-full bg-white/[0.04] border border-white/[0.10] rounded-xl px-3 py-2.5 text-white placeholder:text-white/25 text-sm resize-none focus:outline-none focus:border-[#E8B800]/40 transition-colors"
                    />
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => handleReply(post.id)}
                        disabled={!replyContent.trim() || replySubmitting}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#E8B800] hover:bg-[#D4A017] disabled:opacity-40 disabled:cursor-not-allowed text-black text-xs font-bold rounded-lg transition-colors"
                      >
                        {replySubmitting ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                        Répondre
                      </button>
                      <button
                        onClick={() => { setReplyingTo(null); setReplyContent(""); }}
                        className="text-xs text-white/30 hover:text-white/60 transition-colors px-2 py-1.5"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}
