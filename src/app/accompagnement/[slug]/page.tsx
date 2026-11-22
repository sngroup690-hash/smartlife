"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, ArrowRight, Users, AlertCircle, Send, Mail, TrendingUp } from "lucide-react";
import { useAccompagnementStore, EspacePersonnalise } from "@/lib/accompagnement-store";
import { useUserStore } from "@/lib/user-store";
import ReviewSection from "@/components/ReviewSection";
import { DescriptionRenderer } from "@/components/DescriptionRenderer";

const inputCls =
  "w-full px-4 py-3 bg-gray-50 border border-[#27A827] rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#1f8c1f] focus:bg-white transition-colors text-sm";
const selectCls =
  "w-full px-4 py-3 bg-gray-50 border border-[#27A827] rounded-xl text-gray-900 focus:outline-none focus:border-[#1f8c1f] focus:bg-white transition-colors text-sm";
const labelCls = "block text-gray-700 text-sm mb-2";

type Mode = "info" | "login" | "inscription";

export default function EspaceDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const store = useAccompagnementStore();

  // Charger depuis le serveur (priorité) pour voir les nouveaux espaces créés par l'admin
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
  const [secteurs, setSecteurs] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/admin/secteurs")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d.secteurs)) setSecteurs(d.secteurs); })
      .catch(() => {});
  }, []);

  // Afficher un loader pendant la résolution serveur si l'espace n'est pas en cache local
  if (serverLoading && !espace) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-[#E8B800] border-t-transparent rounded-full animate-spin" />
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

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const client = store.connecterClient(loginEmail);
    if (!client) setLoginError("Aucun compte trouvé avec cet email. Veuillez vous inscrire.");
    else setLoginError("");
  }

  async function handleInscription(e: React.FormEvent) {
    e.preventDefault();
    if (!espace || !message.trim()) return;

    // Auto-reconnaissance : si l'email existe déjà, connecter sans créer de doublon
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-10">
        <Link href="/accompagnement" className="hover:text-gray-900 transition-colors">Accompagnement</Link>
        <span>/</span>
        <span className="text-gray-400">{espace.titre}</span>
      </div>

      <div className="grid lg:grid-cols-2 gap-16 items-start mb-20">

        {/* LEFT : Infos de l'espace */}
        <div>
          {/* Lettre initiale */}
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#E8B800]/30 to-[#27A827]/10 border border-[#E8B800]/30 flex items-center justify-center mb-6">
            <span className="text-[#E8B800] font-black text-4xl">
              {espace.titre.charAt(0).toUpperCase()}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="text-xs px-3 py-1 bg-gray-100 border border-gray-200 text-gray-600 rounded-full">
              {espace.domaine}
            </span>
            <span className={`text-xs px-3 py-1 rounded-full font-bold border ${
              espace.placesDisponibles <= 2
                ? "bg-orange-50 border-orange-200 text-orange-600"
                : "bg-[#27A827]/10 border-[#27A827]/30 text-[#1a7a1a]"
            }`}>
              {espace.placesDisponibles} place{espace.placesDisponibles > 1 ? "s" : ""} disponible{espace.placesDisponibles > 1 ? "s" : ""}
            </span>
          </div>

          <h1 className="text-4xl font-bold text-gray-900 mb-6">{espace.titre}</h1>

          {espace.descriptionLongue ? (
            <DescriptionRenderer
              html={espace.descriptionLongue}
              className="text-gray-600 text-lg leading-relaxed mb-8
                [&_img]:rounded-xl [&_img]:my-4
                [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1
                [&_b]:text-gray-900 [&_strong]:text-gray-900 [&_i]:italic [&_em]:italic"
            />
          ) : (
            <p className="text-gray-600 text-lg leading-relaxed mb-8">
              Rejoignez notre programme d&apos;accompagnement dans le domaine{" "}
              <strong className="text-gray-900">{espace.titre}</strong>. Notre équipe d&apos;experts vous guidera
              à chaque étape de votre projet entrepreneurial, de la conception à la mise en œuvre.
            </p>
          )}


          {/* Chiffres clés */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            {espace.clientsSatisfaits > 0 && (
              <div className="p-5 bg-white border border-gray-200 rounded-2xl shadow-sm text-center">
                <div className="text-3xl font-bold text-[#E8B800] mb-1">{espace.clientsSatisfaits}</div>
                <div className="text-gray-500 text-xs">
                  client{espace.clientsSatisfaits > 1 ? "s" : ""} & entreprise{espace.clientsSatisfaits > 1 ? "s" : ""} satisfait{espace.clientsSatisfaits > 1 ? "s" : ""}
                </div>
              </div>
            )}
            <div className="p-5 bg-white border border-gray-200 rounded-2xl shadow-sm text-center">
              <div className={`text-3xl font-bold mb-1 ${espace.placesDisponibles <= 2 ? "text-orange-500" : "text-gray-900"}`}>
                {espace.placesDisponibles}
              </div>
              <div className="text-gray-500 text-xs">
                place{espace.placesDisponibles > 1 ? "s" : ""} restante{espace.placesDisponibles > 1 ? "s" : ""}
              </div>
            </div>
            {validees > 0 && (
              <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl text-center">
                <div className="text-3xl font-bold text-emerald-700 mb-1">{validees}</div>
                <div className="text-gray-500 text-xs">candidature{validees > 1 ? "s" : ""} validée{validees > 1 ? "s" : ""}</div>
              </div>
            )}
            {enAttente > 0 && (
              <div className="p-5 bg-yellow-50 border border-yellow-200 rounded-2xl text-center">
                <div className="text-3xl font-bold text-yellow-600 mb-1">{enAttente}</div>
                <div className="text-gray-500 text-xs">en cours d&apos;examen</div>
              </div>
            )}
          </div>

          {/* Avantages du secteur */}
          {espace.avantages?.filter(Boolean).length > 0 && (
            <div className="mb-6 p-6 bg-white border border-gray-200 rounded-2xl shadow-sm">
              <h3 className="text-gray-900 font-bold mb-4 flex items-center gap-2">
                <TrendingUp size={18} className="text-[#E8B800]" />
                Pourquoi ce secteur ?
              </h3>
              <div className="space-y-2">
                {espace.avantages.filter(Boolean).map((a, i) => (
                  <div key={i} className="flex items-start gap-3 text-gray-600 text-sm">
                    <CheckCircle size={14} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                    {a}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ce que comprend l'accompagnement */}
          <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
              <CheckCircle size={18} className="text-[#E8B800]" />
              Ce que comprend l&apos;accompagnement
            </h3>
            <div className="space-y-3">
              {(espace.inclus?.filter(Boolean).length
                ? espace.inclus.filter(Boolean)
                : [
                    "Étude personnalisée de votre projet et de votre zone",
                    "Formation adaptée à votre secteur d'activité",
                    "Mise en relation avec nos partenaires et fournisseurs",
                    "Suivi régulier et conseils d'un expert dédié",
                    "Accès au réseau d'entrepreneurs accompagnés",
                  ]
              ).map((item, i) => (
                <div key={i} className="flex items-start gap-3 text-gray-600 text-sm">
                  <CheckCircle size={14} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Consultants spécialisés sur cet espace */}
          {store.consultants.filter((c) => c.actif && c.domainesIds.includes(espace.id)).length > 0 && (
            <div className="p-6 bg-[#E8B800]/5 border border-[#E8B800]/20 rounded-2xl">
              <h3 className="text-gray-900 font-bold mb-4">Vos consultants pour cet espace</h3>
              <div className="flex flex-wrap gap-4">
                {store.consultants.filter((c) => c.actif && c.domainesIds.includes(espace.id)).map((c) => (
                  <div key={c.id} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E8B800]/40 to-[#27A827]/20 border border-[#E8B800]/30 flex items-center justify-center text-[#E8B800] font-black">
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
          )}
        </div>

        {/* RIGHT : Formulaire */}
        <div className="sticky top-20">

          {/* Demande existante */}
          {demandeExistante && !submitted ? (
            <div className={`p-8 border rounded-2xl ${statutBadgeCls(demandeExistante.statut)}`}>
              <div className="text-4xl mb-4 text-center">
                {demandeExistante.statut === "validee" ? "✅" : demandeExistante.statut === "rejetee" ? "❌" : "⏳"}
              </div>
              <h3 className="text-gray-900 text-xl font-bold mb-2 text-center">{statutLabel(demandeExistante.statut)}</h3>
              <p className="text-sm text-center mb-6 text-gray-400">
                Soumise le {new Date(demandeExistante.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
              </p>
              {demandeExistante.noteAdmin && (
                <div className="p-4 bg-gray-50 rounded-xl mb-4">
                  <p className="text-gray-500 text-xs mb-1">Note de l&apos;administrateur :</p>
                  <p className="text-gray-900 text-sm">{demandeExistante.noteAdmin}</p>
                </div>
              )}
              <div className="flex gap-3">
                <Link href="/mon-espace" className="flex-1 text-center py-3 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-sm">
                  Mon espace
                </Link>
                <button onClick={store.deconnecterClient} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl text-sm hover:bg-gray-200">
                  Changer de compte
                </button>
              </div>
            </div>

          ) : submitted ? (
            <div className="p-8 bg-emerald-50 border border-emerald-200 rounded-2xl text-center">
              <div className="text-5xl mb-4">✅</div>
              <h3 className="text-gray-900 text-2xl font-bold mb-3">Candidature envoyée !</h3>
              <p className="text-gray-600 mb-6 text-sm leading-relaxed">
                Votre demande pour <strong className="text-gray-900">{espace.titre}</strong> a bien été reçue.
                Notre équipe vous contactera sous <strong className="text-gray-900">48–72h</strong>.
              </p>
              <div className="flex gap-3">
                <Link href="/mon-espace" className="flex-1 text-center py-3 bg-[#E8B800] text-black font-bold rounded-xl text-sm">
                  Suivre ma demande
                </Link>
                <Link href="/accompagnement" className="flex-1 text-center py-3 border border-gray-200 text-gray-700 rounded-xl text-sm hover:bg-gray-50">
                  Autres espaces
                </Link>
              </div>
            </div>

          ) : clientConnecte ? (
            <div className="p-8 bg-white border border-gray-200 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-gray-500 text-xs mb-0.5">Connecté en tant que</p>
                  <p className="text-gray-900 font-bold">{clientConnecte.nom}</p>
                  <p className="text-gray-500 text-xs">{clientConnecte.email}</p>
                </div>
                <button onClick={store.deconnecterClient} className="text-xs text-gray-600 hover:text-gray-400 border border-gray-200 px-3 py-1 rounded-lg">
                  Changer
                </button>
              </div>
              <h3 className="text-gray-900 text-xl font-bold mb-2">Postuler pour cet espace</h3>
              <p className="text-gray-600 text-sm mb-6">Expliquez votre projet et votre motivation.</p>
              <form onSubmit={handleDemandeClientConnecte} className="space-y-4">
                <div>
                  <label className={labelCls}>Votre motivation / message <span className="text-[#E8B800]">*</span></label>
                  <textarea
                    required rows={5} value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className={`${inputCls} resize-none`}
                    placeholder={`Pourquoi souhaitez-vous vous lancer dans le secteur ${espace.titre} ? Avez-vous de l'expérience ? Un local ? Quand souhaitez-vous démarrer ?`}
                  />
                </div>
                <button type="submit" className="w-full py-4 bg-[#27A827] hover:bg-[#1f8c1f] text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 btn-postuler">
                  <Send size={16} className="animate-bounce" /> Envoyer ma candidature
                </button>
                <p className="text-gray-600 text-xs text-center">Réponse sous 48–72h</p>
              </form>
            </div>

          ) : mode === "info" ? (
            <div className="p-8 bg-white border border-gray-200 rounded-2xl shadow-sm">
              <div className="text-center mb-8">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-[#E8B800]/10 border border-[#E8B800]/30 flex items-center justify-center text-[#E8B800] font-black text-3xl mb-4">
                  {espace.titre.charAt(0).toUpperCase()}
                </div>
                <h3 className="text-gray-900 text-xl font-bold mb-2">Rejoindre ce programme</h3>
                <p className="text-gray-500 text-sm">
                  Pour postuler, créez votre compte ou connectez-vous.
                </p>
              </div>
              <div className="space-y-3 mb-6">
                <button
                  onClick={() => setMode("inscription")}
                  className="w-full py-4 bg-[#27A827] hover:bg-[#1f8c1f] text-white font-bold rounded-xl flex items-center justify-center gap-2 btn-postuler transition-all"
                >
                  <Users size={18} /> Je suis nouveau — M&apos;inscrire
                </button>
                <button
                  onClick={() => setMode("login")}
                  className="w-full py-4 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl flex items-center justify-center gap-2 text-sm"
                >
                  <Mail size={16} /> J&apos;ai déjà un compte — Me connecter
                </button>
              </div>
              <div className="p-4 bg-[#E8B800]/5 border border-[#E8B800]/20 rounded-xl space-y-2 text-xs">
                {espace.clientsSatisfaits > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Clients satisfaits</span>
                    <span className="text-gray-900 font-bold">{espace.clientsSatisfaits}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Places restantes</span>
                  <span className={`font-bold ${espace.placesDisponibles <= 2 ? "text-orange-400" : "text-emerald-400"}`}>
                    {espace.placesDisponibles}
                  </span>
                </div>
              </div>
            </div>

          ) : mode === "login" ? (
            <div className="p-8 bg-white border border-gray-200 rounded-2xl shadow-sm">
              <button onClick={() => setMode("info")} className="text-gray-600 text-xs mb-6 hover:text-gray-400">← Retour</button>
              <h3 className="text-gray-900 text-xl font-bold mb-2">Me connecter</h3>
              <p className="text-gray-500 text-sm mb-6">Entrez l&apos;email de votre compte.</p>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className={labelCls}>Email <span className="text-[#E8B800]">*</span></label>
                  <input required type="email" value={loginEmail}
                    onChange={(e) => { setLoginEmail(e.target.value); setLoginError(""); }}
                    className={inputCls} placeholder="jean@exemple.com" />
                  {loginError && <p className="text-red-400 text-xs mt-2 flex items-center gap-1"><AlertCircle size={12} />{loginError}</p>}
                </div>
                <button type="submit" className="w-full py-4 bg-gradient-to-r from-[#E8B800] to-[#27A827] text-black font-bold rounded-xl">
                  Continuer
                </button>
                <button type="button" onClick={() => setMode("inscription")} className="w-full text-center text-gray-500 text-sm hover:text-gray-400">
                  Pas de compte ? S&apos;inscrire
                </button>
              </form>
            </div>

          ) : (
            <div className="p-8 bg-white border border-gray-200 rounded-2xl shadow-sm">
              <button onClick={() => setMode("info")} className="text-gray-600 text-xs mb-5 hover:text-gray-400">← Retour</button>
              <h3 className="text-gray-900 text-xl font-bold mb-2">Créer mon compte & Postuler</h3>
              <p className="text-gray-500 text-sm mb-5">
                Candidature pour : <strong className="text-gray-900">{espace.titre}</strong>
              </p>
              <form onSubmit={handleInscription} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Nom complet <span className="text-[#E8B800]">*</span></label>
                    <input required type="text" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} className={inputCls} placeholder="Jean Dupont" />
                  </div>
                  <div>
                    <label className={labelCls}>Téléphone / WhatsApp <span className="text-[#E8B800]">*</span></label>
                    <input required type="tel" value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} className={inputCls} placeholder="+237 6XX..." />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Email <span className="text-[#E8B800]">*</span></label>
                  <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} placeholder="jean@exemple.com" />
                </div>
                <div>
                  <label className={labelCls}>Profession / Activité actuelle <span className="text-[#E8B800]">*</span></label>
                  <input required type="text" value={form.profession} onChange={(e) => setForm({ ...form, profession: e.target.value })} className={inputCls} placeholder="Ex: Commerçant, Étudiant, Salarié..." />
                </div>
                {secteurs.length > 0 && (
                  <div>
                    <label className={labelCls}>Secteur d&apos;activité ciblé</label>
                    <select
                      value={form.secteurActivite}
                      onChange={(e) => setForm({ ...form, secteurActivite: e.target.value, secteurAutre: "" })}
                      className={selectCls}
                    >
                      <option value="">— Choisir un secteur (optionnel) —</option>
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
                        placeholder="Précisez votre secteur d'activité..."
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
                    <label className={labelCls}>Capital disponible <span className="text-[#E8B800]">*</span></label>
                    <select required value={form.capital} onChange={(e) => setForm({ ...form, capital: e.target.value })} className="w-full px-4 py-3 bg-[#E8B800] border border-yellow-400 rounded-xl text-black font-bold focus:outline-none focus:border-yellow-300 transition-colors text-sm">
                      <option value="" className="bg-[#E8B800] text-black font-bold">Fourchette...</option>
                      <option value="moins-500k" className="bg-[#E8B800] text-black font-bold">- de 500 000 FCFA</option>
                      <option value="500k-1m" className="bg-[#E8B800] text-black font-bold">500k – 1 000 000 FCFA</option>
                      <option value="1m-3m" className="bg-[#E8B800] text-black font-bold">1M – 3 000 000 FCFA</option>
                      <option value="3m-10m" className="bg-[#E8B800] text-black font-bold">3M – 10 000 000 FCFA</option>
                      <option value="plus-10m" className="bg-[#E8B800] text-black font-bold">+ de 10 000 000 FCFA</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Votre motivation / description du projet <span className="text-[#E8B800]">*</span></label>
                  <textarea
                    required rows={4} value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className={`${inputCls} resize-none`}
                    placeholder={`Décrivez votre projet dans le secteur ${espace.titre}, votre expérience, avez-vous un local, votre délai de démarrage...`}
                  />
                </div>
                <button type="submit" className="w-full py-4 bg-gradient-to-r from-[#E8B800] to-[#27A827] hover:from-[#27A827] hover:to-[#E8B800] text-black font-bold rounded-xl flex items-center justify-center gap-2 mt-2">
                  <Send size={16} /> Créer mon compte & Envoyer
                </button>
                <p className="text-gray-600 text-xs text-center">Vous serez contacté dans les 48–72h.</p>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* ── AVIS DE NOS CLIENTS ─────────────────────────────────────────────── */}
      <div className="py-12 border-t border-b border-gray-100 my-16 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 bg-gray-50/50">
        <ReviewSection
          productId={espace.id}
          productType="accompagnement"
          userId={clientConnecte?.id ?? null}
          userName={clientConnecte?.nom ?? ""}
          isPurchased={demandeExistante?.statut === "validee"}
        />
      </div>

      {/* Espaces similaires ou autres espaces */}
      {(() => {
        const similaires = (espace.espacesSimilaires ?? [])
          .map((id) => allServerEspaces.find((e) => e.actif && e.id === id))
          .filter(Boolean) as typeof autresEspaces;
        const aAfficher = similaires.length > 0 ? similaires : autresEspaces;
        if (aAfficher.length === 0) return null;
        return (
          <div className="mt-8">
            <h3 className="text-gray-900 font-bold text-xl mb-6">
              {similaires.length > 0 ? "Domaines similaires" : "Autres domaines disponibles"}
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              {aAfficher.slice(0, 3).map((e) => (
                <Link key={e.id} href={`/accompagnement/${e.id}`}
                  className="p-5 bg-white border border-gray-200 rounded-2xl shadow-sm hover:border-[#E8B800]/30 transition-all flex items-center gap-4 group">
                  <div className="w-10 h-10 rounded-xl bg-[#E8B800]/10 flex items-center justify-center text-[#E8B800] font-black flex-shrink-0">
                    {e.titre.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 font-semibold text-sm group-hover:text-[#E8B800] transition-colors">{e.titre}</p>
                    <p className="text-gray-600 text-xs">{e.domaine}</p>
                  </div>
                  <ArrowRight size={14} className="text-gray-600 flex-shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
