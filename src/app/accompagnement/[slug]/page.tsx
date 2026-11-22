"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle, ArrowRight, Users, AlertCircle, Send, Mail,
  TrendingUp, Clock, Wallet, Shield, Star, ChevronRight,
  MapPin, Phone, Briefcase, MessageSquare,
} from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useAccompagnementStore, EspacePersonnalise } from "@/lib/accompagnement-store";
import { espaces as STATIC_ESPACES } from "@/lib/accompagnement-data";
import { useUserStore } from "@/lib/user-store";
import ReviewSection from "@/components/ReviewSection";
import { DescriptionRenderer } from "@/components/DescriptionRenderer";
import AnimateOnScroll, { StaggerContainer, StaggerItem, AnimatedCounter } from "@/components/AnimateOnScroll";

const inputCls =
  "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#27A827] focus:ring-2 focus:ring-[#27A827]/10 focus:bg-white transition-all text-sm";
const selectCls =
  "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-[#27A827] focus:ring-2 focus:ring-[#27A827]/10 focus:bg-white transition-all text-sm";
const labelCls = "block text-gray-700 text-sm font-medium mb-1.5";

type Mode = "info" | "login" | "inscription";

function TimelineStep({ step, index, total }: { step: string; index: number; total: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -20 }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="flex gap-4 relative"
    >
      <div className="flex flex-col items-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={isInView ? { scale: 1 } : {}}
          transition={{ type: "spring", stiffness: 300, delay: index * 0.1 + 0.1 }}
          className="w-9 h-9 rounded-full bg-gradient-to-br from-[#E8B800] to-[#27A827] flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-md"
        >
          {index + 1}
        </motion.div>
        {index < total - 1 && (
          <div className="w-0.5 flex-1 bg-gradient-to-b from-[#27A827]/30 to-transparent mt-1" />
        )}
      </div>
      <div className="pb-6">
        <p className="text-gray-800 text-sm font-medium leading-relaxed pt-2">{step}</p>
      </div>
    </motion.div>
  );
}

export default function EspaceDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const store = useAccompagnementStore();

  const [allServerEspaces, setAllServerEspaces] = useState<EspacePersonnalise[]>(store.espaces);
  const [serverLoading, setServerLoading] = useState(true);

  useEffect(() => {
    fetch("/api/espaces")
      .then((r) => r.json())
      .then((data: { espaces: EspacePersonnalise[] }) => {
        if (Array.isArray(data.espaces) && data.espaces.length > 0) {
          setAllServerEspaces(data.espaces);
        }
      })
      .catch(() => {})
      .finally(() => setServerLoading(false));
  }, [slug]);

  const espace = allServerEspaces.find((e) => e.id === slug);
  const staticEspace = STATIC_ESPACES.find((e) => e.id === slug);
  const userStore = useUserStore();
  const clientConnecte = store.clientConnecte ? store.getClientById(store.clientConnecte) : null;
  const demandeExistante = clientConnecte
    ? store.getDemandeParEspace(clientConnecte.id, slug)
    : undefined;

  const [mode, setMode] = useState<Mode>("info");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginError, setLoginError] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    nom: "", email: "", telephone: "", ville: "",
    profession: "", capital: "", motivation: "",
    secteurActivite: "", secteurAutre: "",
  });

  useEffect(() => {
    const user = userStore.currentUser;
    if (!user || store.clientConnecte) return;
    const existing = store.connecterClient(user.email);
    if (!existing) {
      setForm((prev) => ({
        ...prev,
        nom: prev.nom || [user.firstName, user.lastName].filter(Boolean).join(" "),
        email: prev.email || user.email,
        telephone: prev.telephone || user.phone,
      }));
      setMode("inscription");
    }
  }, [userStore.currentUser, store.clientConnecte, store]);
  const [secteurs, setSecteurs] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/admin/secteurs")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d.secteurs)) setSecteurs(d.secteurs); })
      .catch(() => {});
  }, []);

  if (serverLoading && !espace) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-3 border-[#E8B800] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!espace) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="text-6xl mb-4">😔</div>
        <h1 className="text-gray-900 text-2xl font-bold mb-2">Espace introuvable</h1>
        <p className="text-gray-600 mb-6">Cet espace n&apos;existe pas ou a été désactivé.</p>
        <Link href="/accompagnement" className="px-6 py-3 bg-[#E8B800] text-black rounded-xl font-bold">
          Voir tous les espaces
        </Link>
      </div>
    );
  }

  const autresEspaces = allServerEspaces
    .filter((e) => e.actif && e.id !== espace.id)
    .slice(0, 3);

  const demandesEspace = store.demandes.filter((d) => d.espaceId === espace.id);
  const validees = demandesEspace.filter((d) => d.statut === "validee").length;
  const enAttente = demandesEspace.filter((d) => d.statut === "en_attente").length;
  const heroImage = espace.image || staticEspace?.image;
  const icone = staticEspace?.icone;
  const duree = staticEspace?.dureeAccompagnement;
  const investMin = staticEspace?.investissementMin;
  const investMax = staticEspace?.investissementMax;

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const client = store.connecterClient(loginEmail);
    if (!client) setLoginError("Aucun compte trouvé avec cet email. Veuillez vous inscrire.");
    else setLoginError("");
  }

  async function handleInscription(e: React.FormEvent) {
    e.preventDefault();
    if (!espace || !message.trim()) return;

    const existingClient = store.connecterClient(form.email);

    if (existingClient) {
      store.soumettreDemandeClient(existingClient.id, espace.id, espace.id, espace.titre, message);
      await fetch("/api/demandes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client: { nom: existingClient.nom, email: existingClient.email, telephone: existingClient.telephone, ville: existingClient.ville ?? "", profession: existingClient.profession ?? "", capital: existingClient.capital ?? "", motivation: existingClient.motivation ?? "" },
          espaceId: espace.id, espaceSlug: espace.id, espaceTitre: espace.titre, message,
        }),
      }).catch(() => {});
    } else {
      const secteurFinal = form.secteurActivite === "Autre" ? form.secteurAutre.trim() || "Autre" : form.secteurActivite;
      const professionFull = [form.profession, secteurFinal].filter(Boolean).join(" — Secteur : ");
      store.soumettreDemandeAvecInscription(
        { nom: form.nom, email: form.email, telephone: form.telephone, ville: form.ville, profession: professionFull, capital: form.capital, motivation: form.motivation },
        espace.id, espace.id, espace.titre, message
      );
      await fetch("/api/demandes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client: { nom: form.nom, email: form.email, telephone: form.telephone, ville: form.ville, profession: professionFull, capital: form.capital, motivation: form.motivation },
          espaceId: espace.id, espaceSlug: espace.id, espaceTitre: espace.titre, message,
        }),
      }).catch(() => {});
    }
    setSubmitted(true);
  }

  async function handleDemandeClientConnecte(e: React.FormEvent) {
    e.preventDefault();
    if (!espace || !clientConnecte || !message.trim()) return;
    store.soumettreDemandeClient(clientConnecte.id, espace.id, espace.id, espace.titre, message);
    await fetch("/api/demandes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client: { nom: clientConnecte.nom, email: clientConnecte.email, telephone: clientConnecte.telephone, ville: clientConnecte.ville, profession: clientConnecte.profession ?? "", capital: clientConnecte.capital ?? "", motivation: clientConnecte.motivation ?? "" },
        espaceId: espace.id,
        espaceSlug: espace.id,
        espaceTitre: espace.titre,
        message,
      }),
    }).catch(() => {});
    setSubmitted(true);
  }

  const statutBadgeCls = (s: string) =>
    s === "validee" ? "bg-[#27A827]/10 border-[#27A827]/30 text-[#1a7a1a]"
    : s === "rejetee" ? "bg-red-50 border-red-200 text-red-600"
    : "bg-yellow-50 border-yellow-200 text-yellow-600";

  const statutLabel = (s: string) =>
    s === "validee" ? "Demande validée" : s === "rejetee" ? "Demande rejetée" : "En attente de validation";

  const etapes = espace.inclus?.filter(Boolean).length
    ? espace.inclus.filter(Boolean)
    : [
        "Étude personnalisée de votre projet et de votre zone",
        "Formation adaptée à votre secteur d'activité",
        "Mise en relation avec nos partenaires et fournisseurs",
        "Suivi régulier et conseils d'un expert dédié",
        "Accès au réseau d'entrepreneurs accompagnés",
      ];

  function scrollToPostuler() {
    document.getElementById("postuler")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div className="min-h-screen">

      {/* ═══ HERO AVEC IMAGE ═══ */}
      <section className="relative overflow-hidden">
        {heroImage ? (
          <>
            <img
              src={heroImage}
              alt={espace.titre}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-white/80 to-white" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-white to-yellow-50" />
        )}

        <div className="relative px-4 sm:px-6 lg:px-8 pt-6 pb-10 sm:pb-14">
          {/* Breadcrumb */}
          <motion.nav
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-1.5 text-xs text-gray-500 mb-6"
          >
            <Link href="/accompagnement" className="hover:text-[#27A827] transition-colors">
              Accompagnement
            </Link>
            <ChevronRight size={12} />
            <span className="text-gray-700 font-medium">{espace.titre}</span>
          </motion.nav>

          {/* Badges */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-wrap gap-2 mb-4"
          >
            {icone && (
              <span className="text-2xl">{icone}</span>
            )}
            <span className="px-3 py-1 bg-white/80 backdrop-blur-sm border border-gray-200/60 text-gray-600 rounded-full text-xs font-medium">
              {espace.domaine}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-sm ${
              espace.placesDisponibles <= 2
                ? "bg-orange-50/80 border-orange-200 text-orange-600"
                : "bg-[#27A827]/10 border-[#27A827]/30 text-[#1a7a1a]"
            }`}>
              <motion.span
                animate={espace.placesDisponibles <= 2 ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 2, repeat: Infinity }}
                className="inline-block w-1.5 h-1.5 rounded-full bg-current mr-1.5 align-middle"
              />
              {espace.placesDisponibles} place{espace.placesDisponibles > 1 ? "s" : ""} disponible{espace.placesDisponibles > 1 ? "s" : ""}
            </span>
          </motion.div>

          {/* Titre */}
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="text-3xl sm:text-4xl font-black text-gray-900 mb-4 leading-tight"
          >
            {espace.titre}
          </motion.h1>

          {/* Description courte */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="text-gray-600 text-base leading-relaxed max-w-xl mb-6"
          >
            {espace.descriptionCourte || espace.descriptionLongue?.slice(0, 150)}
          </motion.p>

          {/* Stats rapides */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap gap-3 mb-6"
          >
            {duree && (
              <div className="flex items-center gap-2 px-3 py-2 bg-white/70 backdrop-blur-sm rounded-xl border border-gray-100 text-xs">
                <Clock size={14} className="text-[#E8B800]" />
                <span className="text-gray-700 font-medium">{duree}</span>
              </div>
            )}
            {investMin && investMax && (
              <div className="flex items-center gap-2 px-3 py-2 bg-white/70 backdrop-blur-sm rounded-xl border border-gray-100 text-xs">
                <Wallet size={14} className="text-[#27A827]" />
                <span className="text-gray-700 font-medium">
                  {(investMin / 1000).toFixed(0)}k – {(investMax / 1000000) >= 1 ? `${(investMax / 1000000).toFixed(0)}M` : `${(investMax / 1000).toFixed(0)}k`} FCFA
                </span>
              </div>
            )}
          </motion.div>

          {/* CTA hero */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <motion.button
              onClick={scrollToPostuler}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="px-6 py-3.5 bg-gradient-to-r from-[#E8B800] to-[#27A827] text-white font-bold rounded-xl shadow-lg shadow-[#27A827]/20 flex items-center gap-2 text-sm"
            >
              Je veux être accompagné
              <ArrowRight size={16} />
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* ═══ CONTENU PRINCIPAL ═══ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div className="grid lg:grid-cols-5 gap-10 lg:gap-14 items-start">

          {/* ── COLONNE INFO (3/5) ── */}
          <div className="lg:col-span-3 space-y-10">

            {/* Description longue */}
            {espace.descriptionLongue && (
              <AnimateOnScroll variant="fadeUp">
                <div className="prose prose-gray max-w-none">
                  <DescriptionRenderer
                    html={espace.descriptionLongue}
                    className="text-gray-600 text-base leading-relaxed
                      [&_img]:rounded-xl [&_img]:my-4
                      [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1
                      [&_b]:text-gray-900 [&_strong]:text-gray-900 [&_i]:italic [&_em]:italic"
                  />
                </div>
              </AnimateOnScroll>
            )}

            {/* Chiffres clés */}
            <AnimateOnScroll variant="fadeUp">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-gradient-to-br from-[#E8B800]/5 to-[#E8B800]/10 border border-[#E8B800]/15 rounded-2xl text-center">
                  <div className="text-2xl sm:text-3xl font-black text-[#E8B800] mb-0.5">
                    <AnimatedCounter value={espace.placesDisponibles} />
                  </div>
                  <div className="text-gray-500 text-xs">place{espace.placesDisponibles > 1 ? "s" : ""} restante{espace.placesDisponibles > 1 ? "s" : ""}</div>
                </div>
                {espace.clientsSatisfaits > 0 && (
                  <div className="p-4 bg-gradient-to-br from-[#27A827]/5 to-[#27A827]/10 border border-[#27A827]/15 rounded-2xl text-center">
                    <div className="text-2xl sm:text-3xl font-black text-[#27A827] mb-0.5">
                      <AnimatedCounter value={espace.clientsSatisfaits} />
                    </div>
                    <div className="text-gray-500 text-xs">client{espace.clientsSatisfaits > 1 ? "s" : ""} satisfait{espace.clientsSatisfaits > 1 ? "s" : ""}</div>
                  </div>
                )}
                {validees > 0 && (
                  <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-center">
                    <div className="text-2xl font-black text-emerald-600 mb-0.5">{validees}</div>
                    <div className="text-gray-500 text-xs">candidature{validees > 1 ? "s" : ""} validée{validees > 1 ? "s" : ""}</div>
                  </div>
                )}
                {enAttente > 0 && (
                  <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-2xl text-center">
                    <div className="text-2xl font-black text-yellow-600 mb-0.5">{enAttente}</div>
                    <div className="text-gray-500 text-xs">en cours d&apos;examen</div>
                  </div>
                )}
              </div>
            </AnimateOnScroll>

            {/* Avantages du secteur */}
            {espace.avantages?.filter(Boolean).length > 0 && (
              <AnimateOnScroll variant="fadeUp">
                <div className="p-5 sm:p-6 bg-gradient-to-br from-green-50/80 via-white to-yellow-50/50 border border-gray-100 rounded-2xl">
                  <h3 className="text-gray-900 font-bold text-lg mb-5 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#E8B800]/10 flex items-center justify-center">
                      <TrendingUp size={16} className="text-[#E8B800]" />
                    </div>
                    Pourquoi ce secteur ?
                  </h3>
                  <StaggerContainer className="space-y-3">
                    {espace.avantages.filter(Boolean).map((a, i) => (
                      <StaggerItem key={i}>
                        <div className="flex items-start gap-3 p-3 bg-white/70 rounded-xl border border-gray-50">
                          <div className="w-5 h-5 rounded-full bg-[#27A827]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <CheckCircle size={12} className="text-[#27A827]" />
                          </div>
                          <p className="text-gray-700 text-sm leading-relaxed">{a}</p>
                        </div>
                      </StaggerItem>
                    ))}
                  </StaggerContainer>
                </div>
              </AnimateOnScroll>
            )}

            {/* Étapes de l'accompagnement */}
            <AnimateOnScroll variant="fadeUp">
              <div className="p-5 sm:p-6 bg-white border border-gray-100 rounded-2xl shadow-sm">
                <h3 className="text-gray-900 font-bold text-lg mb-6 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#27A827]/10 flex items-center justify-center">
                    <CheckCircle size={16} className="text-[#27A827]" />
                  </div>
                  Ce que comprend l&apos;accompagnement
                </h3>
                <div className="pl-1">
                  {etapes.map((step, i) => (
                    <TimelineStep key={i} step={step} index={i} total={etapes.length} />
                  ))}
                </div>
              </div>
            </AnimateOnScroll>

            {/* Consultants spécialisés */}
            {store.consultants.filter((c) => c.actif && c.domainesIds.includes(espace.id)).length > 0 && (
              <AnimateOnScroll variant="fadeUp">
                <div className="p-5 sm:p-6 bg-[#E8B800]/5 border border-[#E8B800]/15 rounded-2xl">
                  <h3 className="text-gray-900 font-bold text-lg mb-4 flex items-center gap-2">
                    <Users size={18} className="text-[#E8B800]" />
                    Vos consultants pour cet espace
                  </h3>
                  <div className="flex flex-wrap gap-4">
                    {store.consultants.filter((c) => c.actif && c.domainesIds.includes(espace.id)).map((c) => (
                      <div key={c.id} className="flex items-center gap-3 p-3 bg-white/70 rounded-xl border border-[#E8B800]/10">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#E8B800] to-[#27A827] flex items-center justify-center text-white font-bold text-sm">
                          {c.prenom.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-gray-900 font-semibold text-sm">{c.prenom}</p>
                          <p className="text-gray-500 text-xs">{c.clientsAccompa} client{c.clientsAccompa > 1 ? "s" : ""} · {c.entreprisesAccompa} entreprise{c.entreprisesAccompa > 1 ? "s" : ""}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </AnimateOnScroll>
            )}
          </div>

          {/* ── COLONNE FORMULAIRE (2/5) ── */}
          <div className="lg:col-span-2 lg:sticky lg:top-20" id="postuler">

            {/* Bande de confiance */}
            <AnimateOnScroll variant="fadeUp">
              <div className="flex items-center justify-center gap-4 mb-4 p-3 bg-gradient-to-r from-green-50 to-yellow-50 rounded-xl border border-gray-100">
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Shield size={12} className="text-[#27A827]" />
                  <span>Gratuit</span>
                </div>
                <div className="w-px h-3 bg-gray-200" />
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Clock size={12} className="text-[#E8B800]" />
                  <span>Réponse 48h</span>
                </div>
                <div className="w-px h-3 bg-gray-200" />
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Star size={12} className="text-[#E8B800]" />
                  <span>Expert dédié</span>
                </div>
              </div>
            </AnimateOnScroll>

            {/* Demande existante */}
            {demandeExistante && !submitted ? (
              <AnimateOnScroll variant="scaleUp">
                <div className={`p-6 sm:p-8 border rounded-2xl ${statutBadgeCls(demandeExistante.statut)}`}>
                  <div className="text-4xl mb-4 text-center">
                    {demandeExistante.statut === "validee" ? "✅" : demandeExistante.statut === "rejetee" ? "❌" : "⏳"}
                  </div>
                  <h3 className="text-gray-900 text-xl font-bold mb-2 text-center">{statutLabel(demandeExistante.statut)}</h3>
                  <p className="text-sm text-center mb-6 text-gray-400">
                    Soumise le {new Date(demandeExistante.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                  {demandeExistante.noteAdmin && (
                    <div className="p-4 bg-white/60 rounded-xl mb-4">
                      <p className="text-gray-500 text-xs mb-1">Note de l&apos;administrateur :</p>
                      <p className="text-gray-900 text-sm">{demandeExistante.noteAdmin}</p>
                    </div>
                  )}
                  <div className="flex gap-3">
                    <Link href="/mon-espace" className="flex-1 text-center py-3 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-sm font-medium">
                      Mon espace
                    </Link>
                    <button onClick={store.deconnecterClient} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl text-sm hover:bg-gray-200">
                      Changer de compte
                    </button>
                  </div>
                </div>
              </AnimateOnScroll>

            ) : submitted ? (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="p-6 sm:p-8 bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-2xl text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, delay: 0.2 }}
                  className="text-5xl mb-4"
                >
                  ✅
                </motion.div>
                <h3 className="text-gray-900 text-xl font-bold mb-3">Candidature envoyée !</h3>
                <p className="text-gray-600 mb-6 text-sm leading-relaxed">
                  Votre demande pour <strong className="text-gray-900">{espace.titre}</strong> a bien été reçue.
                  Notre équipe vous contactera sous <strong className="text-gray-900">48–72h</strong>.
                </p>
                <div className="flex gap-3">
                  <Link href="/mon-espace" className="flex-1 text-center py-3 bg-gradient-to-r from-[#E8B800] to-[#27A827] text-white font-bold rounded-xl text-sm">
                    Suivre ma demande
                  </Link>
                  <Link href="/accompagnement" className="flex-1 text-center py-3 border border-gray-200 text-gray-700 rounded-xl text-sm hover:bg-gray-50">
                    Autres espaces
                  </Link>
                </div>
              </motion.div>

            ) : clientConnecte ? (
              <AnimateOnScroll variant="fadeUp">
                <div className="p-6 sm:p-8 bg-white border border-gray-100 rounded-2xl shadow-lg shadow-gray-100/50">
                  <div className="flex items-center justify-between mb-6 p-3 bg-gray-50 rounded-xl">
                    <div>
                      <p className="text-gray-400 text-xs mb-0.5">Connecté</p>
                      <p className="text-gray-900 font-bold text-sm">{clientConnecte.nom}</p>
                      <p className="text-gray-500 text-xs">{clientConnecte.email}</p>
                    </div>
                    <button onClick={store.deconnecterClient} className="text-xs text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg transition-colors">
                      Changer
                    </button>
                  </div>
                  <h3 className="text-gray-900 text-lg font-bold mb-1">Postuler pour cet espace</h3>
                  <p className="text-gray-500 text-sm mb-5">Expliquez votre projet et votre motivation.</p>
                  <form onSubmit={handleDemandeClientConnecte} className="space-y-4">
                    <div>
                      <label className={labelCls}>Votre motivation <span className="text-[#E8B800]">*</span></label>
                      <textarea
                        required rows={5} value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className={`${inputCls} resize-none`}
                        placeholder={`Pourquoi souhaitez-vous vous lancer dans le secteur ${espace.titre} ?`}
                      />
                    </div>
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full py-4 bg-gradient-to-r from-[#27A827] to-[#1f8c1f] text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#27A827]/20"
                    >
                      <Send size={16} /> Envoyer ma candidature
                    </motion.button>
                    <p className="text-gray-400 text-xs text-center">Réponse sous 48–72h</p>
                  </form>
                </div>
              </AnimateOnScroll>

            ) : mode === "info" ? (
              <AnimateOnScroll variant="fadeUp">
                <div className="p-6 sm:p-8 bg-white border border-gray-100 rounded-2xl shadow-lg shadow-gray-100/50">
                  <div className="text-center mb-6">
                    {heroImage ? (
                      <div className="w-16 h-16 mx-auto rounded-2xl overflow-hidden border-2 border-[#E8B800]/20 mb-4">
                        <img src={heroImage} alt="" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-[#E8B800]/20 to-[#27A827]/10 border border-[#E8B800]/20 flex items-center justify-center mb-4">
                        <span className="text-[#E8B800] font-black text-2xl">{icone || espace.titre.charAt(0).toUpperCase()}</span>
                      </div>
                    )}
                    <h3 className="text-gray-900 text-lg font-bold mb-1">Bénéficier de l&apos;accompagnement</h3>
                    <p className="text-gray-500 text-sm">
                      Faites votre demande en quelques clics.
                    </p>
                  </div>
                  <div className="space-y-3 mb-6">
                    <motion.button
                      onClick={() => setMode("inscription")}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full py-4 bg-gradient-to-r from-[#27A827] to-[#1f8c1f] text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-[#27A827]/20 transition-all"
                    >
                      <ArrowRight size={18} /> Je veux être accompagné
                    </motion.button>
                    <button
                      onClick={() => setMode("login")}
                      className="w-full py-3.5 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl flex items-center justify-center gap-2 text-sm transition-all"
                    >
                      <Mail size={16} /> J&apos;ai déjà un compte
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {espace.clientsSatisfaits > 0 && (
                      <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
                        <span className="text-gray-500">Satisfaits</span>
                        <span className="text-gray-900 font-bold">{espace.clientsSatisfaits}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
                      <span className="text-gray-500">Places</span>
                      <span className={`font-bold ${espace.placesDisponibles <= 2 ? "text-orange-500" : "text-[#27A827]"}`}>
                        {espace.placesDisponibles}
                      </span>
                    </div>
                  </div>
                </div>
              </AnimateOnScroll>

            ) : mode === "login" ? (
              <AnimateOnScroll variant="fadeUp">
                <div className="p-6 sm:p-8 bg-white border border-gray-100 rounded-2xl shadow-lg shadow-gray-100/50">
                  <button onClick={() => setMode("info")} className="text-gray-500 text-xs mb-5 hover:text-gray-700 flex items-center gap-1 transition-colors">
                    <ChevronRight size={12} className="rotate-180" /> Retour
                  </button>
                  <h3 className="text-gray-900 text-lg font-bold mb-1">Me connecter</h3>
                  <p className="text-gray-500 text-sm mb-5">Entrez l&apos;email de votre compte.</p>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <label className={labelCls}>Email <span className="text-[#E8B800]">*</span></label>
                      <input required type="email" value={loginEmail}
                        onChange={(e) => { setLoginEmail(e.target.value); setLoginError(""); }}
                        className={inputCls} placeholder="jean@exemple.com" />
                      {loginError && <p className="text-red-500 text-xs mt-2 flex items-center gap-1"><AlertCircle size={12} />{loginError}</p>}
                    </div>
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full py-4 bg-gradient-to-r from-[#E8B800] to-[#27A827] text-white font-bold rounded-xl shadow-lg"
                    >
                      Continuer
                    </motion.button>
                    <button type="button" onClick={() => setMode("inscription")} className="w-full text-center text-gray-500 text-sm hover:text-gray-700 transition-colors">
                      Pas de compte ? S&apos;inscrire
                    </button>
                  </form>
                </div>
              </AnimateOnScroll>

            ) : (
              <AnimateOnScroll variant="fadeUp">
                <div className="p-5 sm:p-7 bg-white border border-gray-100 rounded-2xl shadow-lg shadow-gray-100/50">
                  <button onClick={() => setMode("info")} className="text-gray-500 text-xs mb-4 hover:text-gray-700 flex items-center gap-1 transition-colors">
                    <ChevronRight size={12} className="rotate-180" /> Retour
                  </button>
                  <h3 className="text-gray-900 text-lg font-bold mb-1">Demander mon accompagnement</h3>
                  <p className="text-gray-500 text-sm mb-4">
                    Candidature pour : <strong className="text-gray-900">{espace.titre}</strong>
                  </p>
                  <form onSubmit={handleInscription} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelCls}>Nom complet <span className="text-[#E8B800]">*</span></label>
                        <input required type="text" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} className={inputCls} placeholder="Jean Dupont" />
                      </div>
                      <div>
                        <label className={labelCls}>Téléphone <span className="text-[#E8B800]">*</span></label>
                        <input required type="tel" value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} className={inputCls} placeholder="+237 6XX..." />
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>Email <span className="text-[#E8B800]">*</span></label>
                      <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} placeholder="jean@exemple.com" />
                    </div>
                    <div>
                      <label className={labelCls}>Profession <span className="text-[#E8B800]">*</span></label>
                      <input required type="text" value={form.profession} onChange={(e) => setForm({ ...form, profession: e.target.value })} className={inputCls} placeholder="Ex: Commerçant, Étudiant..." />
                    </div>
                    {secteurs.length > 0 && (
                      <div>
                        <label className={labelCls}>Secteur ciblé</label>
                        <select
                          value={form.secteurActivite}
                          onChange={(e) => setForm({ ...form, secteurActivite: e.target.value, secteurAutre: "" })}
                          className={selectCls}
                        >
                          <option value="">— Choisir (optionnel) —</option>
                          {secteurs.map((s) => (
                            <option key={s} value={s}>{s === "Autre" ? "Autre (préciser)" : s}</option>
                          ))}
                        </select>
                        {form.secteurActivite === "Autre" && (
                          <input
                            type="text"
                            value={form.secteurAutre}
                            onChange={(e) => setForm({ ...form, secteurAutre: e.target.value })}
                            className={`${inputCls} mt-2`}
                            placeholder="Précisez votre secteur..."
                          />
                        )}
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelCls}>Ville <span className="text-[#E8B800]">*</span></label>
                        <input required type="text" value={form.ville} onChange={(e) => setForm({ ...form, ville: e.target.value })} className={inputCls} placeholder="Yaoundé" />
                      </div>
                      <div>
                        <label className={labelCls}>Capital <span className="text-[#E8B800]">*</span></label>
                        <select required value={form.capital} onChange={(e) => setForm({ ...form, capital: e.target.value })} className={`${selectCls} bg-[#E8B800]/10 border-[#E8B800]/30 font-semibold`}>
                          <option value="">Fourchette...</option>
                          <option value="moins-500k">- de 500k FCFA</option>
                          <option value="500k-1m">500k – 1M FCFA</option>
                          <option value="1m-3m">1M – 3M FCFA</option>
                          <option value="3m-10m">3M – 10M FCFA</option>
                          <option value="plus-10m">+ de 10M FCFA</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>Motivation / projet <span className="text-[#E8B800]">*</span></label>
                      <textarea
                        required rows={4} value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className={`${inputCls} resize-none`}
                        placeholder={`Décrivez votre projet dans le secteur ${espace.titre}...`}
                      />
                    </div>
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full py-4 bg-gradient-to-r from-[#E8B800] to-[#27A827] text-white font-bold rounded-xl flex items-center justify-center gap-2 mt-1 shadow-lg shadow-[#27A827]/20"
                    >
                      <Send size={16} /> Envoyer ma demande
                    </motion.button>
                    <p className="text-gray-400 text-xs text-center">Vous serez contacté dans les 48–72h.</p>
                  </form>
                </div>
              </AnimateOnScroll>
            )}
          </div>
        </div>
      </div>

      {/* ═══ AVIS CLIENTS ═══ */}
      <div className="py-10 sm:py-14 border-t border-gray-100 bg-gradient-to-br from-gray-50/50 via-white to-green-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ReviewSection
            productId={espace.id}
            productType="accompagnement"
            userId={clientConnecte?.id ?? null}
            userName={clientConnecte?.nom ?? ""}
            isPurchased={demandeExistante?.statut === "validee"}
          />
        </div>
      </div>

      {/* ═══ AUTRES DOMAINES ═══ */}
      {(() => {
        const similaires = (espace.espacesSimilaires ?? [])
          .map((id) => allServerEspaces.find((e) => e.actif && e.id === id))
          .filter(Boolean) as typeof autresEspaces;
        const aAfficher = similaires.length > 0 ? similaires : autresEspaces;
        if (aAfficher.length === 0) return null;

        return (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
            <AnimateOnScroll variant="fadeUp">
              <h3 className="text-gray-900 font-bold text-xl mb-6 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#E8B800]/10 flex items-center justify-center">
                  <ArrowRight size={16} className="text-[#E8B800]" />
                </div>
                {similaires.length > 0 ? "Domaines similaires" : "Autres domaines disponibles"}
              </h3>
            </AnimateOnScroll>
            <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {aAfficher.slice(0, 3).map((e) => {
                const img = e.image || STATIC_ESPACES.find((s) => s.id === e.id)?.image;
                const emoji = STATIC_ESPACES.find((s) => s.id === e.id)?.icone;
                return (
                  <StaggerItem key={e.id}>
                    <Link href={`/accompagnement/${e.id}`}
                      className="group block bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-[#E8B800]/20 transition-all">
                      {img ? (
                        <div className="h-32 sm:h-36 overflow-hidden">
                          <img src={img} alt={e.titre} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        </div>
                      ) : (
                        <div className="h-32 sm:h-36 bg-gradient-to-br from-[#E8B800]/10 to-[#27A827]/5 flex items-center justify-center">
                          <span className="text-4xl">{emoji || e.titre.charAt(0)}</span>
                        </div>
                      )}
                      <div className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-gray-900 font-bold text-sm group-hover:text-[#27A827] transition-colors">{e.titre}</p>
                            <p className="text-gray-500 text-xs mt-0.5">{e.domaine}</p>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-gray-50 group-hover:bg-[#27A827]/10 flex items-center justify-center transition-colors">
                            <ArrowRight size={14} className="text-gray-400 group-hover:text-[#27A827] transition-colors" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  </StaggerItem>
                );
              })}
            </StaggerContainer>
          </div>
        );
      })()}

      {/* ═══ BOUTON FLOTTANT — toujours visible ═══ */}
      {!submitted && !demandeExistante && (
        <div className="fixed bottom-20 lg:bottom-6 left-0 right-0 z-40 px-4 sm:px-6 pointer-events-none">
          <div className="max-w-lg mx-auto pointer-events-auto">
            <motion.button
              onClick={scrollToPostuler}
              initial={{ y: 60, opacity: 0 }}
              animate={{
                y: 0,
                opacity: 1,
                scale: [1, 1.03, 1],
                boxShadow: [
                  "0 10px 25px -5px rgba(0,0,0,0.15)",
                  "0 15px 35px -5px rgba(232,184,0,0.35)",
                  "0 10px 25px -5px rgba(0,0,0,0.15)",
                ],
              }}
              transition={{
                y: { delay: 1, type: "spring", stiffness: 200 },
                opacity: { delay: 1 },
                scale: { delay: 2, duration: 2, repeat: Infinity, ease: "easeInOut" },
                boxShadow: { delay: 2, duration: 2, repeat: Infinity, ease: "easeInOut" },
              }}
              whileTap={{ scale: 0.97 }}
              className="w-full py-4 bg-gradient-to-r from-[#E8B800] to-[#27A827] text-white font-bold rounded-2xl flex items-center justify-center gap-2.5 text-sm shadow-xl shadow-black/15 border border-white/20"
            >
              <Send size={16} />
              Je veux être accompagné
              <motion.span
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <ArrowRight size={16} />
              </motion.span>
            </motion.button>
          </div>
        </div>
      )}
    </div>
  );
}
