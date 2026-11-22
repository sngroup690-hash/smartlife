"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, UserPlus, CheckCircle, AlertCircle } from "lucide-react";
import { useUserStore } from "@/lib/user-store";


export default function RegisterPage() {
  const { setServerSession } = useUserStore();
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", password: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function getRedirect() {
    if (typeof window === "undefined") return "/dashboard";
    return new URLSearchParams(window.location.search).get("redirect") || "/dashboard";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
          password: form.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Une erreur est survenue.");
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
          <Link href="/" className="inline-flex mb-6">
            <Image src="/logo-smartlife.jpeg" alt="SMART LIFE" width={110} height={36} className="h-9 w-auto rounded-lg" />
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Créer un compte</h1>
          <p className="text-gray-600 mt-2">Rejoignez SMART LIFE gratuitement</p>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-8">
          {["Ebooks illimités", "Suivi commandes", "Offres exclusives"].map((b) => (
            <div key={b} className="text-center p-3 bg-green-50 border border-green-200 rounded-xl">
              <CheckCircle size={16} className="text-green-600 mx-auto mb-1" />
              <p className="text-gray-700 font-bold text-xs">{b}</p>
            </div>
          ))}
        </div>

        <div className="p-8 bg-white border border-gray-200 rounded-2xl shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 text-sm mb-2">Prénom *</label>
                <input
                  required
                  type="text"
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-green-500 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-green-600 focus:bg-white"
                  placeholder="Jean"
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm mb-2">Nom *</label>
                <input
                  required
                  type="text"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-green-500 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-green-600 focus:bg-white"
                  placeholder="Dupont"
                />
              </div>
            </div>
            <div>
              <label className="block text-gray-700 text-sm mb-2">Email *</label>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-green-500 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-green-600 focus:bg-white"
                placeholder="email@exemple.com"
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm mb-2">Téléphone / WhatsApp</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-green-500 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-green-600 focus:bg-white"
                placeholder="+237 6XX XXX XXX"
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm mb-2">Mot de passe *</label>
              <div className="relative">
                <input
                  required
                  type={showPwd ? "text" : "password"}
                  minLength={8}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-4 py-3 pr-12 bg-gray-50 border border-green-500 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-green-600 focus:bg-white"
                  placeholder="Min. 8 caractères"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                >
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-gray-700 text-sm mb-2">Confirmer le mot de passe *</label>
              <div className="relative">
                <input
                  required
                  type={showConfirm ? "text" : "password"}
                  minLength={8}
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  className={`w-full px-4 py-3 pr-12 bg-gray-50 border rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white transition-colors ${
                    form.confirmPassword && form.password !== form.confirmPassword
                      ? "border-red-500/60 focus:border-red-500"
                      : form.confirmPassword && form.password === form.confirmPassword
                      ? "border-emerald-500/60 focus:border-emerald-500"
                      : "border-green-600 focus:border-green-400"
                  }`}
                  placeholder="Répétez votre mot de passe"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {form.confirmPassword && form.password !== form.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">Les mots de passe ne correspondent pas</p>
              )}
              {form.confirmPassword && form.password === form.confirmPassword && (
                <p className="text-emerald-400 text-xs mt-1 flex items-center gap-1"><CheckCircle size={12} /> Mots de passe identiques</p>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                <AlertCircle size={15} className="flex-shrink-0" />
                {error}
              </div>
            )}

            <p className="text-gray-600 text-xs">
              En créant un compte, vous acceptez nos{" "}
              <Link href="/cgv" className="text-green-400 hover:underline">CGV</Link> et notre{" "}
              <Link href="/confidentialite" className="text-green-400 hover:underline">Politique de confidentialité</Link>.
            </p>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-[#E8B800] to-[#27A827] hover:from-[#27A827] hover:to-[#E8B800] text-black font-bold rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus size={18} />
                  Créer mon compte
                </>
              )}
            </button>
          </form>

          <p className="text-center text-gray-600 text-sm mt-6">
            Déjà un compte ?{" "}
            <Link href="/login" className="text-green-600 hover:text-green-700 font-medium">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
