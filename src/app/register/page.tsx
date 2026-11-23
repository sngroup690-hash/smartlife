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
          <h1 className="text-3xl font-semibold tracking-[-0.02em] text-[var(--g-encre)]">Créer un compte</h1>
          <p className="text-[var(--g-gris)] mt-2">Rejoignez SMART LIFE gratuitement</p>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-8">
          {["Ebooks illimités", "Suivi commandes", "Offres exclusives"].map((b) => (
            <div key={b} className="text-center p-3 bg-[var(--g-vert-doux)] rounded-[12px]">
              <CheckCircle size={16} className="text-[var(--g-vert)] mx-auto mb-1" />
              <p className="text-[var(--g-encre)] font-semibold text-xs">{b}</p>
            </div>
          ))}
        </div>

        <div className="p-8 bg-white border border-[var(--g-ligne)] rounded-[16px]">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[var(--g-encre)] text-sm font-medium mb-2">Prénom *</label>
                <input
                  required
                  type="text"
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-[var(--g-ligne)] rounded-[10px] text-[var(--g-encre)] placeholder-[var(--g-gris)]/60 focus:outline-none focus:border-[var(--g-encre)]"
                  placeholder="Jean"
                />
              </div>
              <div>
                <label className="block text-[var(--g-encre)] text-sm font-medium mb-2">Nom *</label>
                <input
                  required
                  type="text"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-[var(--g-ligne)] rounded-[10px] text-[var(--g-encre)] placeholder-[var(--g-gris)]/60 focus:outline-none focus:border-[var(--g-encre)]"
                  placeholder="Dupont"
                />
              </div>
            </div>
            <div>
              <label className="block text-[var(--g-encre)] text-sm font-medium mb-2">Email *</label>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-[var(--g-ligne)] rounded-[10px] text-[var(--g-encre)] placeholder-[var(--g-gris)]/60 focus:outline-none focus:border-[var(--g-encre)]"
                placeholder="email@exemple.com"
              />
            </div>
            <div>
              <label className="block text-[var(--g-encre)] text-sm font-medium mb-2">Téléphone / WhatsApp</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-[var(--g-ligne)] rounded-[10px] text-[var(--g-encre)] placeholder-[var(--g-gris)]/60 focus:outline-none focus:border-[var(--g-encre)]"
                placeholder="+237 6XX XXX XXX"
              />
            </div>
            <div>
              <label className="block text-[var(--g-encre)] text-sm font-medium mb-2">Mot de passe *</label>
              <div className="relative">
                <input
                  required
                  type={showPwd ? "text" : "password"}
                  minLength={8}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-4 py-3 pr-12 bg-white border border-[var(--g-ligne)] rounded-[10px] text-[var(--g-encre)] placeholder-[var(--g-gris)]/60 focus:outline-none focus:border-[var(--g-encre)]"
                  placeholder="Min. 8 caractères"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--g-gris)] hover:text-[var(--g-encre)]"
                >
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[var(--g-encre)] text-sm font-medium mb-2">Confirmer le mot de passe *</label>
              <div className="relative">
                <input
                  required
                  type={showConfirm ? "text" : "password"}
                  minLength={8}
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  className={`w-full px-4 py-3 pr-12 bg-white border rounded-[10px] text-[var(--g-encre)] placeholder-[var(--g-gris)]/60 focus:outline-none transition-colors ${
                    form.confirmPassword && form.password !== form.confirmPassword
                      ? "border-red-500/60 focus:border-red-500"
                      : form.confirmPassword && form.password === form.confirmPassword
                      ? "border-[var(--g-vert)] focus:border-[var(--g-vert)]"
                      : "border-[var(--g-ligne)] focus:border-[var(--g-encre)]"
                  }`}
                  placeholder="Répétez votre mot de passe"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--g-gris)] hover:text-[var(--g-encre)]"
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {form.confirmPassword && form.password !== form.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">Les mots de passe ne correspondent pas</p>
              )}
              {form.confirmPassword && form.password === form.confirmPassword && (
                <p className="text-[var(--g-vert)] text-xs mt-1 flex items-center gap-1"><CheckCircle size={12} /> Mots de passe identiques</p>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-[10px] text-red-600 text-sm">
                <AlertCircle size={15} className="flex-shrink-0" />
                {error}
              </div>
            )}

            <p className="text-[var(--g-gris)] text-xs">
              En créant un compte, vous acceptez nos{" "}
              <Link href="/cgv" className="text-[var(--g-vert)] font-medium hover:underline">CGV</Link> et notre{" "}
              <Link href="/confidentialite" className="text-[var(--g-vert)] font-medium hover:underline">Politique de confidentialité</Link>.
            </p>

            <button
              type="submit"
              disabled={loading}
              className="g-btn w-full disabled:opacity-60"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus size={18} />
                  Créer mon compte
                </>
              )}
            </button>
          </form>

          <p className="text-center text-[var(--g-gris)] text-sm mt-6">
            Déjà un compte ?{" "}
            <Link href="/login" className="text-[var(--g-vert)] font-semibold hover:underline underline-offset-4">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
