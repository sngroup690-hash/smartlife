"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, RefreshCw, Trash2, CheckCircle } from "lucide-react";

const ADMIN_PWD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? "";

type ContactMessage = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
  read: boolean;
};

const SUBJECTS: Record<string, string> = {
  devis: "Demande de devis",
  "voix-off": "Voix Off",
  video: "Création Vidéo",
  ebook: "Question Ebook",
  commande: "Sourcing Produits",
  support: "Support technique",
  autre: "Autre",
};

export default function AdminContactsPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState("");

  function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    if (password === ADMIN_PWD) setAuthed(true);
    else setAuthError("Mot de passe incorrect.");
  }

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-sm p-8 bg-white border border-gray-200 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <Mail size={24} className="text-[#E8B800]" />
            <h1 className="text-xl font-bold text-gray-900">Admin — Messages Contact</h1>
          </div>
          <form onSubmit={handleAuth} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mot de passe admin"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#E8B800]"
            />
            {authError && <p className="text-red-500 text-sm">{authError}</p>}
            <button type="submit" className="w-full py-3 bg-[#E8B800] text-black font-bold rounded-xl">
              Accéder
            </button>
          </form>
          <Link href="/admin" className="block text-center text-xs text-gray-400 mt-4 hover:text-gray-600">
            ← Retour au panel
          </Link>
        </div>
      </div>
    );
  }

  return <ContactsPanel />;
}

function ContactsPanel() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<ContactMessage | null>(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/contact", {
        headers: { "x-admin-password": ADMIN_PWD },
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setMessages(data.sort((a: ContactMessage, b: ContactMessage) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ));
      }
    } catch {
      setError("Erreur de chargement.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const unreadCount = messages.filter((m) => !m.read).length;

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-200 rounded-xl">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Mail size={22} className="text-[#E8B800]" />
                Messages Contact
              </h1>
              {unreadCount > 0 && (
                <p className="text-sm text-gray-500">{unreadCount} non lu{unreadCount > 1 ? "s" : ""}</p>
              )}
            </div>
          </div>
          <button onClick={load} className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-200 rounded-xl">
            <RefreshCw size={18} />
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 mb-4">{error}</div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <span className="w-8 h-8 border-2 border-[#E8B800] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Mail size={48} className="mx-auto mb-4 opacity-30" />
            <p>Aucun message reçu.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {messages.map((msg) => (
              <button
                key={msg.id}
                onClick={() => setSelected(msg)}
                className={`w-full text-left p-5 rounded-2xl border transition-all ${
                  msg.read
                    ? "bg-white border-gray-200 hover:border-gray-300"
                    : "bg-[#E8B800]/5 border-[#E8B800]/30 hover:border-[#E8B800]/50"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {!msg.read && (
                        <span className="w-2 h-2 rounded-full bg-[#E8B800] flex-shrink-0" />
                      )}
                      <span className="font-semibold text-gray-900 truncate">{msg.name}</span>
                      <span className="text-gray-400 text-sm">·</span>
                      <span className="text-gray-500 text-sm truncate">{msg.email}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-700">
                      {SUBJECTS[msg.subject] ?? msg.subject}
                    </p>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{msg.message}</p>
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {new Date(msg.createdAt).toLocaleDateString("fr-FR", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Modal détail */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setSelected(null)}>
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{selected.name}</h2>
                <a href={`mailto:${selected.email}`} className="text-sm text-[#E8B800] hover:underline">{selected.email}</a>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl">
                <Trash2 size={16} />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-gray-100 rounded-full text-sm font-medium text-gray-700">
                {SUBJECTS[selected.subject] ?? selected.subject}
              </span>
              <span className="text-xs text-gray-400">
                {new Date(selected.createdAt).toLocaleString("fr-FR")}
              </span>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-gray-800 whitespace-pre-wrap text-sm">{selected.message}</p>
            </div>
            <div className="flex gap-3">
              <a
                href={`mailto:${selected.email}?subject=Re: ${SUBJECTS[selected.subject] ?? selected.subject}`}
                className="flex-1 py-3 bg-[#E8B800] text-black font-bold rounded-xl text-center flex items-center justify-center gap-2 text-sm"
              >
                <Mail size={15} /> Répondre par email
              </a>
              <button
                onClick={() => setSelected(null)}
                className="px-4 py-3 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 text-sm flex items-center gap-2"
              >
                <CheckCircle size={15} /> Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}