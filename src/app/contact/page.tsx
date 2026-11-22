"use client";

import { useState } from "react";
import { Mail, Phone, MapPin, Send, MessageCircle, Clock } from "lucide-react";
import AnimateOnScroll, { StaggerContainer, StaggerItem } from "@/components/AnimateOnScroll";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await res.json();
        alert(d.error || "Une erreur est survenue. Réessayez.");
        return;
      }
      setSent(true);
    } catch {
      alert("Erreur réseau. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <AnimateOnScroll variant="fadeUp">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Nous <span className="gradient-text">Contacter</span>
          </h1>
          <p className="text-gray-600 max-w-xl mx-auto text-lg">
            Une question, un projet ou besoin d&apos;un devis ? Notre équipe vous répond dans les 24h.
          </p>
        </div>
      </AnimateOnScroll>

      <div className="grid lg:grid-cols-3 gap-12">
        {/* Contact Info */}
        <StaggerContainer className="space-y-6" staggerDelay={0.12}>
          <StaggerItem>
          <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600 flex-shrink-0">
                <Mail size={20} />
              </div>
              <div>
                <h3 className="text-gray-900 font-semibold mb-1">Email</h3>
                <p className="text-gray-700 text-sm">contact@smartlifecm.com</p>
                <p className="text-gray-600 text-xs mt-1">Réponse sous 24h</p>
              </div>
            </div>
          </div>
          </StaggerItem>

          <StaggerItem>
          <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600 flex-shrink-0">
                <MessageCircle size={20} />
              </div>
              <div>
                <h3 className="text-gray-900 font-semibold mb-1">WhatsApp</h3>
                <p className="text-gray-700 text-sm">+237 694 176 642</p>
                <p className="text-gray-600 text-xs mt-1">Disponible 7j/7</p>
              </div>
            </div>
          </div>
          </StaggerItem>

          <StaggerItem>
          <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600 flex-shrink-0">
                <Phone size={20} />
              </div>
              <div>
                <h3 className="text-gray-900 font-semibold mb-1">Téléphone</h3>
                <p className="text-gray-700 text-sm">+237 694 176 642</p>
                <p className="text-gray-600 text-xs mt-1">Lun - Sam, 8h - 18h</p>
              </div>
            </div>
          </div>
          </StaggerItem>

          <StaggerItem>
          <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600 flex-shrink-0">
                <MapPin size={20} />
              </div>
              <div>
                <h3 className="text-gray-900 font-semibold mb-1">Localisation</h3>
                <p className="text-gray-700 text-sm">Cameroun</p>
                <p className="text-gray-600 text-xs mt-1">Services en ligne, partout</p>
              </div>
            </div>
          </div>
          </StaggerItem>

          <StaggerItem>
          <div className="p-6 bg-green-50 border border-green-200 rounded-2xl">
            <div className="flex items-center gap-3 mb-3">
              <Clock size={18} className="text-green-600" />
              <h3 className="text-gray-900 font-semibold">Horaires</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-700 font-bold">
                <span>Lundi – Vendredi</span>
                <span>8h – 20h</span>
              </div>
              <div className="flex justify-between text-gray-700 font-bold">
                <span>Samedi</span>
                <span>9h – 17h</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Dimanche</span>
                <span>Urgences seulement</span>
              </div>
            </div>
          </div>
          </StaggerItem>
        </StaggerContainer>

        {/* Contact Form */}
        <AnimateOnScroll variant="slideRight" delay={0.2}>
        <div className="lg:col-span-2">
          {sent ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-12 bg-white border border-gray-200 rounded-2xl shadow-sm">
              <div className="w-20 h-20 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-6">
                <Send size={36} className="text-emerald-600" />
              </div>
              <h3 className="text-gray-900 text-2xl font-bold mb-3">Message envoyé !</h3>
              <p className="text-gray-600 max-w-sm">
                Merci de nous avoir contactés. Notre équipe vous répondra dans les 24h.
              </p>
            </div>
          ) : (
            <div className="p-8 bg-white border border-gray-200 rounded-2xl shadow-sm">
              <h3 className="text-gray-900 text-xl font-bold mb-6">Envoyer un message</h3>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 text-sm mb-2">Nom complet *</label>
                    <input
                      required
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-green-500 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-green-600 focus:bg-white"
                      placeholder="Jean Dupont"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm mb-2">Email *</label>
                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-green-500 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-green-600 focus:bg-white"
                      placeholder="jean@exemple.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Sujet *</label>
                  <select
                    required
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-green-600 rounded-xl text-white focus:outline-none focus:border-green-400"
                  >
                    <option value="" className="bg-white">Choisir un sujet...</option>
                    <option value="devis" className="bg-white">Demande de devis</option>
                    <option value="voix-off" className="bg-white">Service Voix Off</option>
                    <option value="video" className="bg-white">Création Vidéo</option>
                    <option value="ebook" className="bg-white">Question sur un Ebook</option>
                    <option value="commande" className="bg-white">Sourcing Produits</option>
                    <option value="support" className="bg-white">Support technique</option>
                    <option value="autre" className="bg-white">Autre</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Message *</label>
                  <textarea
                    required
                    rows={6}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-green-500 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-green-600 focus:bg-white resize-none"
                    placeholder="Décrivez votre besoin en détail..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-[#E8B800] to-[#27A827] hover:from-[#27A827] hover:to-[#E8B800] text-black font-bold rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send size={18} />
                      Envoyer le message
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
        </AnimateOnScroll>
      </div>
    </div>
  );
}
