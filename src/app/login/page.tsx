"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Zap, Eye, EyeOff, LogIn, AlertCircle } from "lucide-react";
import { useUserStore } from "@/lib/user-store";

export default function LoginPage() {
  const { setServerSession, isLoggedIn, _hasHydrated } = useUserStore();
  const [showPwd, setShowPwd] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function getRedirect() {
    if (typeof window === "undefined") return "/dashboard";
    return new URLSearchParams(window.location.search).get("redirect") || "/dashboard";
  }

  // iOS Safari bfcache : si la page est restaurée depuis l'historique alors
  // que l'utilisateur est déjà connecté, on le redirige immédiatement
  useEffect(() => {
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted && useUserStore.getState().isLoggedIn) {
        window.location.replace(getRedirect());
      }
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Après hydratation Zustand : si déjà connecté, quitter la page de login
  useEffect(() => {
    if (_hasHydrated && isLoggedIn) {
      window.location.replace(getRedirect());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_hasHydrated, isLoggedIn]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Email ou mot de passe incorrect.");
        return;
      }
      setServerSession({
        id: data.user.id,
        firstName: data.user.firstName,
        lastName: data.user.lastName,
        email: data.user.email,
        phone: data.user.phone,
        ebooksAchetes: data.user.ebooksAchetes ?? [],
        formationsAchetees: data.user.formationsAchetees ?? [],
      });
      window.location.href = getRedirect();
    } catch {
      setError("Erreur réseau. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-600 to-green-700 flex items-center justify-center">
              <Zap size={20} className="text-white" />
            </div>
            <span className="text-2xl font-bold">
              <span className="text-gray-900">SMART </span>
              <span className="text-[#E8B800]">LIFE</span>
            </span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Bienvenue</h1>
          <p className="text-gray-600 mt-2">Connectez-vous à votre espace client</p>
        </div>

        <div className="p-8 bg-white border border-gray-200 rounded-2xl shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-gray-700 text-sm mb-2">Adresse email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-green-500 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-green-600 focus:bg-white transition-colors"
                placeholder="email@exemple.com"
              />
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-gray-700 text-sm">Mot de passe</label>
                <Link href="/contact" className="text-green-600 text-sm hover:text-green-700">
                  Mot de passe oublié ?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"}
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-4 py-3 pr-12 bg-gray-50 border border-green-500 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-green-600 focus:bg-white transition-colors"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                <AlertCircle size={15} className="flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-[#E8B800] to-[#27A827] hover:from-[#27A827] hover:to-[#E8B800] text-black font-bold rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn size={18} />
                  Se connecter
                </>
              )}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-4 text-gray-500 text-sm">ou</span>
            </div>
          </div>

          <p className="text-center text-gray-600 text-sm">
            Pas encore de compte ?{" "}
            <Link href="/register" className="text-green-600 hover:text-green-700 font-medium">
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
