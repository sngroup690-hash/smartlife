"use client";

import { useState, useCallback } from "react";
import { CheckCircle, ChevronLeft, ChevronRight, Loader2, AlertTriangle, Award, XCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

// ── Questions du protocole ───────────────────────────────────────────────────

type Question = { section: string; text: string; options: string[] };

const QUESTIONS: Question[] = [
  // Section 1 : Accompagnement entrepreneurial digital (0-6)
  {
    section: "Accompagnement entrepreneurial",
    text: "Un entrepreneur vous dit : « Je veux gagner de l'argent sur internet mais je ne sais pas par où commencer. » Que faites-vous ?",
    options: [
      "Vous lui proposez directement de vendre des ebooks sans chercher à comprendre son profil",
      "Vous identifiez d'abord ses compétences, sa situation et son budget pour lui proposer un chemin adapté",
      "Vous lui dites que ce n'est pas pour tout le monde et qu'il devrait d'abord se former pendant des mois",
      "Vous lui envoyez des liens vers des formations gratuites sur YouTube",
    ],
  },
  {
    section: "Accompagnement entrepreneurial",
    text: "Votre client a créé un produit digital (ebook) mais ne fait aucune vente après 2 semaines. Comment réagissez-vous ?",
    options: [
      "Vous lui dites que son produit n'est pas bon et qu'il faut tout recommencer",
      "Vous analysez sa page de vente, son audience cible et sa stratégie de promotion pour trouver ce qui bloque",
      "Vous lui conseillez de baisser le prix",
      "Vous ne faites rien, c'est à lui de trouver la solution",
    ],
  },
  {
    section: "Accompagnement entrepreneurial",
    text: "Un client veut lancer une publicité Meta Ads avec un budget de 5 000 FCFA par jour. Quel conseil lui donnez-vous ?",
    options: [
      "Vous lui dites que c'est trop peu et qu'il ne devrait pas faire de pub",
      "Vous l'aidez à cibler précisément son audience et à tester 2-3 créatives pour maximiser ce petit budget",
      "Vous lui demandez d'augmenter son budget à au moins 50 000 FCFA par jour",
      "Vous lancez la pub sans réfléchir à la stratégie",
    ],
  },
  {
    section: "Accompagnement entrepreneurial",
    text: "Un client vous dit qu'il n'a pas d'ordinateur, seulement un téléphone. Peut-il quand même créer un business digital ?",
    options: [
      "Non, il faut absolument un ordinateur pour faire du business en ligne",
      "Oui, vous lui montrez les outils et méthodes adaptés au téléphone pour commencer",
      "Vous lui dites de d'abord économiser pour acheter un PC",
      "Vous refusez de l'accompagner tant qu'il n'a pas le bon matériel",
    ],
  },
  {
    section: "Accompagnement entrepreneurial",
    text: "Un client vous demande de l'aider à utiliser l'IA pour son business. Comment abordez-vous le sujet ?",
    options: [
      "Vous lui expliquez que l'IA est trop compliquée pour quelqu'un qui débute",
      "Vous lui montrez concrètement comment l'IA peut l'aider dans ses tâches quotidiennes avec des exemples pratiques",
      "Vous lui donnez une liste d'outils IA sans explication",
      "Vous lui dites que l'IA va remplacer les humains et qu'il devrait s'inquiéter",
    ],
  },
  {
    section: "Accompagnement entrepreneurial",
    text: "Un client vous confie qu'il est découragé parce que ses proches ne croient pas en son projet digital. Que lui dites-vous ?",
    options: [
      "Vous êtes d'accord que c'est risqué et qu'il devrait peut-être arrêter",
      "Vous le remotivez avec des exemples concrets de réussite, l'aidez à se fixer des objectifs à court terme et restez disponible",
      "Vous ignorez sa frustration et passez directement au travail",
      "Vous lui dites de couper les ponts avec les personnes négatives",
    ],
  },
  {
    section: "Accompagnement entrepreneurial",
    text: "Un client vous propose de mentir sur les résultats de son produit pour vendre plus. Quelle est votre position ?",
    options: [
      "Vous acceptez si ça aide à faire plus de ventes",
      "Vous refusez fermement et lui montrez comment vendre en mettant en avant les vrais bénéfices de son produit",
      "Vous ne dites rien et le laissez faire",
      "Vous coupez la relation immédiatement sans explication",
    ],
  },
  // Section 2 : Compétences relationnelles et pédagogiques (7-13)
  {
    section: "Compétences relationnelles",
    text: "Vous accompagnez un client qui a du mal à créer du contenu pour ses réseaux sociaux. Comment l'aidez-vous ?",
    options: [
      "Vous créez le contenu à sa place, c'est plus rapide",
      "Vous lui apprenez une méthode simple, créez les premiers ensemble, puis il continue seul avec votre suivi",
      "Vous lui donnez une liste de comptes à copier",
      "Vous lui dites que s'il ne sait pas créer du contenu, le business digital n'est pas pour lui",
    ],
  },
  {
    section: "Compétences relationnelles",
    text: "Pendant un appel avec un client, il reçoit un message WhatsApp d'un « formateur » qui lui promet 500 000 FCFA en 7 jours. Que faites-vous ?",
    options: [
      "Vous ne dites rien, chacun ses choix",
      "Vous lui expliquez calmement les signaux d'arnaque, sans critiquer, et l'aidez à évaluer les promesses de manière critique",
      "Vous vous moquez de lui pour y avoir cru",
      "Vous lui dites de suivre les deux formations en même temps",
    ],
  },
  {
    section: "Compétences relationnelles",
    text: "Un client ne répond plus à vos messages depuis 10 jours alors que vous êtes en plein accompagnement. Comment réagissez-vous ?",
    options: [
      "Vous l'oubliez et passez à un autre client",
      "Vous le relancez avec bienveillance, lui demandez s'il a des difficultés et proposez d'adapter le rythme",
      "Vous lui envoyez un message agressif pour lui rappeler son engagement",
      "Vous le supprimez de votre liste de clients",
    ],
  },
  {
    section: "Compétences relationnelles",
    text: "Un client vous dit : « J'ai tout essayé, rien ne marche pour moi. » Comment le gérez-vous ?",
    options: [
      "Vous lui dites qu'il n'a probablement pas assez travaillé",
      "Vous reprenez son parcours point par point, identifiez ce qui a bloqué et proposez un plan d'action concret",
      "Vous lui proposez d'abandonner le digital et de faire autre chose",
      "Vous lui envoyez des vidéos de motivation",
    ],
  },
  {
    section: "Compétences relationnelles",
    text: "Vous devez expliquer le concept de tunnel de vente à quelqu'un qui n'a jamais fait de marketing. Comment procédez-vous ?",
    options: [
      "Vous utilisez les termes techniques : « landing page, upsell, lead magnet »",
      "Vous comparez avec un marché local : l'appel, la dégustation gratuite, la vente, puis le client qui revient",
      "Vous lui dites de regarder une vidéo YouTube",
      "Vous sautez l'explication et passez directement à la pratique",
    ],
  },
  {
    section: "Compétences relationnelles",
    text: "Un client a réussi sa première vente grâce à votre accompagnement. Comment capitalisez-vous sur ce succès ?",
    options: [
      "Rien de spécial, c'est normal",
      "Vous célébrez avec lui, analysez ce qui a fonctionné, et l'aidez à répliquer et améliorer sa stratégie",
      "Vous lui demandez immédiatement de vous recommander à d'autres",
      "Vous considérez que votre travail est terminé",
    ],
  },
  {
    section: "Compétences relationnelles",
    text: "Deux de vos clients se retrouvent dans le même marché et vendent des produits similaires. Comment gérez-vous cette situation ?",
    options: [
      "Vous donnez les mêmes conseils aux deux sans rien changer",
      "Vous aidez chacun à trouver son angle unique et sa différenciation, en toute transparence",
      "Vous arrêtez d'accompagner l'un des deux",
      "Vous créez de la concurrence entre eux pour les motiver",
    ],
  },
];

const BAREME = [0, 3, 1, 0];
const LETTRES = ["A", "B", "C", "D"];

const SUJETS_TECH = [
  "Diagnostic de situation client",
  "Analyse et résolution de problèmes",
  "Gestion de budget publicitaire",
  "Adaptation aux contraintes du client",
  "Maîtrise des outils IA",
  "Motivation et persévérance",
  "Éthique et honnêteté",
];
const SUJETS_PEDA = [
  "Autonomisation du client",
  "Protection contre les arnaques",
  "Suivi et relance bienveillante",
  "Gestion du découragement",
  "Vulgarisation et pédagogie",
  "Capitalisation sur les succès",
  "Gestion de la concurrence entre clients",
];

function getNiveau(pct: number) {
  if (pct >= 85) return { label: "Très bon", couleur: "text-emerald-600" };
  if (pct >= 75) return { label: "Satisfaisant", couleur: "text-emerald-600" };
  if (pct >= 60) return { label: "À renforcer", couleur: "text-amber-600" };
  if (pct >= 40) return { label: "Insuffisant", couleur: "text-red-500" };
  return { label: "Très insuffisant", couleur: "text-red-500" };
}

function getVerdict(pctTech: number, pctPeda: number) {
  if (pctTech >= 75 && pctPeda >= 75)
    return { titre: "Validé", desc: "Félicitations ! Vous avez le profil pour accompagner des entrepreneurs digitaux chez Smart Life. Nous vous contacterons très bientôt.", icone: "succes" as const };
  if ((pctTech >= 60 && pctTech < 75) || (pctPeda >= 60 && pctPeda < 75))
    return { titre: "Validation conditionnelle", desc: "Vous avez du potentiel ! Quelques points sont à renforcer. Nous vous proposerons un plan de mise à niveau avant de vous intégrer.", icone: "attention" as const };
  if (pctTech >= 40 || pctPeda >= 40)
    return { titre: "Formation complémentaire requise", desc: "Certaines compétences essentielles pour l'accompagnement digital nécessitent un renforcement. Un parcours de formation vous sera proposé.", icone: "attention" as const };
  return { titre: "Non validé", desc: "Les résultats ne correspondent pas encore au profil recherché. Vous pourrez repasser l'évaluation après vous être préparé.", icone: "echec" as const };
}

// ── Composant ────────────────────────────────────────────────────────────────

type Ecran = "intro" | "question" | "resultats";

export default function EvaluationPage() {
  const [ecran, setEcran] = useState<Ecran>("intro");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  const [questionCourante, setQuestionCourante] = useState(0);
  const [reponses, setReponses] = useState<number[]>(new Array(14).fill(-1));
  const [envoi, setEnvoi] = useState(false);
  const [resultats, setResultats] = useState<{
    scoreTech: number; scorePeda: number;
    pctTech: number; pctPeda: number; pctGlobal: number;
    verdict: ReturnType<typeof getVerdict>;
    faiblesses: { section: string; sujet: string }[];
  } | null>(null);

  const demarrer = useCallback(() => {
    const err: Record<string, string> = {};
    if (!nom.trim()) err.nom = "Votre nom est requis";
    if (!email.trim() || !email.includes("@")) err.email = "Une adresse email valide est requise";
    if (Object.keys(err).length > 0) { setErreurs(err); return; }
    setErreurs({});
    setEcran("question");
  }, [nom, email]);

  const choisir = useCallback((index: number) => {
    setReponses(prev => {
      const copie = [...prev];
      copie[questionCourante] = index;
      return copie;
    });
  }, [questionCourante]);

  const calculer = useCallback(async () => {
    let scoreTech = 0, scorePeda = 0;
    for (let i = 0; i < 7; i++) scoreTech += BAREME[reponses[i]];
    for (let i = 7; i < 14; i++) scorePeda += BAREME[reponses[i]];

    const pctTech = Math.round((scoreTech / 21) * 10000) / 100;
    const pctPeda = Math.round((scorePeda / 21) * 10000) / 100;
    const pctGlobal = Math.round(((scoreTech + scorePeda) / 42) * 10000) / 100;
    const verdict = getVerdict(pctTech, pctPeda);

    const faiblesses: { section: string; sujet: string }[] = [];
    for (let i = 0; i < 7; i++) {
      if (BAREME[reponses[i]] < 2) faiblesses.push({ section: "tech", sujet: SUJETS_TECH[i] });
    }
    for (let i = 7; i < 14; i++) {
      if (BAREME[reponses[i]] < 2) faiblesses.push({ section: "peda", sujet: SUJETS_PEDA[i - 7] });
    }

    setResultats({ scoreTech, scorePeda, pctTech, pctPeda, pctGlobal, verdict, faiblesses });
    setEcran("resultats");

    setEnvoi(true);
    try {
      await fetch("/api/evaluations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: nom.trim(), email: email.trim().toLowerCase(), telephone: telephone.trim(),
          reponses, scoreTech, scorePeda, pctTech, pctPeda, pctGlobal,
          verdict: verdict.titre,
        }),
      });
    } catch {}
    setEnvoi(false);
  }, [reponses, nom, email, telephone]);

  const q = QUESTIONS[questionCourante];
  const estSection1 = questionCourante < 7;
  const numDansSection = estSection1 ? questionCourante + 1 : questionCourante - 6;
  const progression = ((questionCourante + 1) / 14) * 100;

  // ── Rendu ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[var(--g-fond,#FAFAF8)]">
      <div className="max-w-[640px] mx-auto px-4 sm:px-6 py-8 sm:py-12">

        {/* ── Écran d'introduction ── */}
        {ecran === "intro" && (
          <>
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-[var(--g-vert,#0D6B3F)] rounded-[10px] flex items-center justify-center">
                  <Award size={22} className="text-white" />
                </div>
                <span className="text-[20px] font-bold tracking-[-0.02em] text-[var(--g-encre,#1A1A1A)]">SMART LIFE</span>
              </div>
              <h1 className="text-[28px] sm:text-[36px] font-bold tracking-[-0.03em] leading-[1.1] mb-3 text-[var(--g-encre,#1A1A1A)]">
                Évaluation des compétences
              </h1>
              <p className="text-[15px] text-[var(--g-gris,#6B7280)] max-w-[44ch] mx-auto leading-relaxed">
                Protocole de validation des aptitudes techniques et pédagogiques des consultants Smart Life.
              </p>
            </div>

            <div className="bg-white border border-[var(--g-ligne,#E5E7EB)] rounded-2xl p-6 shadow-sm">
              <div className="space-y-5">
                <div>
                  <label htmlFor="eval-nom" className="block text-[14px] font-semibold mb-1.5 text-[var(--g-encre,#1A1A1A)]">
                    Nom complet
                  </label>
                  <input
                    id="eval-nom"
                    type="text"
                    value={nom}
                    onChange={e => setNom(e.target.value)}
                    placeholder="Votre nom et prénom"
                    className={`w-full px-4 py-2.5 rounded-xl border ${erreurs.nom ? "border-red-400" : "border-[var(--g-ligne,#E5E7EB)]"} bg-[var(--g-fond,#FAFAF8)] text-[15px] focus:outline-none focus:ring-2 focus:ring-[var(--g-vert,#0D6B3F)]/20 focus:border-[var(--g-vert,#0D6B3F)] transition`}
                  />
                  {erreurs.nom && <p className="text-red-500 text-[13px] mt-1">{erreurs.nom}</p>}
                </div>

                <div>
                  <label htmlFor="eval-email" className="block text-[14px] font-semibold mb-1.5 text-[var(--g-encre,#1A1A1A)]">
                    Adresse email
                  </label>
                  <input
                    id="eval-email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="votre@email.com"
                    className={`w-full px-4 py-2.5 rounded-xl border ${erreurs.email ? "border-red-400" : "border-[var(--g-ligne,#E5E7EB)]"} bg-[var(--g-fond,#FAFAF8)] text-[15px] focus:outline-none focus:ring-2 focus:ring-[var(--g-vert,#0D6B3F)]/20 focus:border-[var(--g-vert,#0D6B3F)] transition`}
                  />
                  {erreurs.email && <p className="text-red-500 text-[13px] mt-1">{erreurs.email}</p>}
                </div>

                <div>
                  <label htmlFor="eval-tel" className="block text-[14px] font-semibold mb-1.5 text-[var(--g-encre,#1A1A1A)]">
                    Numéro de téléphone
                  </label>
                  <input
                    id="eval-tel"
                    type="tel"
                    value={telephone}
                    onChange={e => setTelephone(e.target.value)}
                    placeholder="+237 6XX XX XX XX"
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--g-ligne,#E5E7EB)] bg-[var(--g-fond,#FAFAF8)] text-[15px] focus:outline-none focus:ring-2 focus:ring-[var(--g-vert,#0D6B3F)]/20 focus:border-[var(--g-vert,#0D6B3F)] transition"
                  />
                </div>

                <button
                  onClick={demarrer}
                  className="w-full py-3 bg-[var(--g-vert,#0D6B3F)] hover:bg-[var(--g-vert-fonce,#0A5632)] text-white font-semibold rounded-xl transition flex items-center justify-center gap-2"
                >
                  Commencer l&apos;évaluation
                  <ArrowRight size={18} />
                </button>
              </div>

              <p className="text-center text-[13px] text-[var(--g-gris,#6B7280)] mt-4">
                14 questions &middot; environ 10 minutes &middot; résultat immédiat
              </p>
            </div>
          </>
        )}

        {/* ── Écran questions ── */}
        {ecran === "question" && (
          <>
            {/* Barre de progression */}
            <div className="mb-6">
              <div className="flex justify-between text-[13px] font-medium text-[var(--g-gris,#6B7280)] mb-1.5">
                <span>Partie {estSection1 ? "1" : "2"} / 2</span>
                <span>{questionCourante + 1} / 14</span>
              </div>
              <div className="h-1.5 bg-[var(--g-ligne,#E5E7EB)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--g-vert,#0D6B3F)] rounded-full transition-all duration-400"
                  style={{ width: `${progression}%` }}
                />
              </div>
            </div>

            {/* Carte question */}
            <div className="bg-white border border-[var(--g-ligne,#E5E7EB)] rounded-2xl p-6 shadow-sm">
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--g-vert,#0D6B3F)] mb-2">
                {q.section}
              </p>
              <p className="text-[13px] font-medium text-[var(--g-gris,#6B7280)] mb-3">
                Question {numDansSection} sur 7
              </p>
              <p className="text-[17px] font-semibold leading-snug text-[var(--g-encre,#1A1A1A)] mb-5">
                {q.text}
              </p>

              <div className="space-y-2.5">
                {q.options.map((option, i) => {
                  const choisi = reponses[questionCourante] === i;
                  return (
                    <button
                      key={i}
                      onClick={() => choisir(i)}
                      className={`w-full text-left flex items-start gap-3 px-4 py-3 rounded-xl border transition-all ${
                        choisi
                          ? "border-[var(--g-vert,#0D6B3F)] bg-[var(--g-vert,#0D6B3F)]/5"
                          : "border-[var(--g-ligne,#E5E7EB)] hover:border-[var(--g-vert,#0D6B3F)]/50 hover:bg-[var(--g-fond,#FAFAF8)]"
                      }`}
                    >
                      <span className={`w-6 h-6 min-w-[24px] mt-0.5 rounded-full border-2 flex items-center justify-center transition ${
                        choisi ? "border-[var(--g-vert,#0D6B3F)]" : "border-[var(--g-ligne,#E5E7EB)]"
                      }`}>
                        {choisi && <span className="w-3 h-3 rounded-full bg-[var(--g-vert,#0D6B3F)]" />}
                      </span>
                      <span className="flex gap-2 min-w-0">
                        <span className="text-[14px] font-semibold text-[var(--g-gris,#6B7280)] shrink-0">{LETTRES[i]}.</span>
                        <span className="text-[14.5px] leading-snug text-[var(--g-encre,#1A1A1A)]">{option}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex gap-3 mt-5">
              {questionCourante > 0 && (
                <button
                  onClick={() => setQuestionCourante(prev => prev - 1)}
                  className="flex-1 py-3 border border-[var(--g-ligne,#E5E7EB)] text-[var(--g-gris,#6B7280)] font-semibold rounded-xl hover:border-[var(--g-gris,#6B7280)] transition flex items-center justify-center gap-2"
                >
                  <ChevronLeft size={18} /> Précédent
                </button>
              )}
              <button
                onClick={() => {
                  if (questionCourante < 13) setQuestionCourante(prev => prev + 1);
                  else calculer();
                }}
                disabled={reponses[questionCourante] === -1}
                className="flex-1 py-3 bg-[var(--g-vert,#0D6B3F)] hover:bg-[var(--g-vert-fonce,#0A5632)] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition flex items-center justify-center gap-2"
              >
                {questionCourante === 13 ? "Voir mes résultats" : "Suivant"}
                <ChevronRight size={18} />
              </button>
            </div>
          </>
        )}

        {/* ── Écran résultats ── */}
        {ecran === "resultats" && resultats && (
          <>
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-[var(--g-vert,#0D6B3F)] rounded-[10px] flex items-center justify-center">
                  <Award size={22} className="text-white" />
                </div>
                <span className="text-[20px] font-bold tracking-[-0.02em] text-[var(--g-encre,#1A1A1A)]">SMART LIFE</span>
              </div>
              <h1 className="text-[26px] sm:text-[32px] font-bold tracking-[-0.03em] leading-tight mb-1 text-[var(--g-encre,#1A1A1A)]">
                Résultats de l&apos;évaluation
              </h1>
              <p className="text-[15px] text-[var(--g-gris,#6B7280)]">{nom}</p>
            </div>

            {/* Verdict */}
            <div className={`rounded-2xl p-5 mb-5 text-center border ${
              resultats.verdict.icone === "succes"
                ? "bg-emerald-50 border-emerald-200"
                : resultats.verdict.icone === "attention"
                ? "bg-amber-50 border-amber-200"
                : "bg-red-50 border-red-200"
            }`}>
              <div className="flex justify-center mb-2">
                {resultats.verdict.icone === "succes" && <CheckCircle size={32} className="text-emerald-600" />}
                {resultats.verdict.icone === "attention" && <AlertTriangle size={32} className="text-amber-600" />}
                {resultats.verdict.icone === "echec" && <XCircle size={32} className="text-red-500" />}
              </div>
              <h2 className={`text-[20px] font-bold mb-1 ${
                resultats.verdict.icone === "succes" ? "text-emerald-700" :
                resultats.verdict.icone === "attention" ? "text-amber-700" : "text-red-600"
              }`}>
                {resultats.verdict.titre}
              </h2>
              <p className={`text-[14.5px] leading-relaxed ${
                resultats.verdict.icone === "succes" ? "text-emerald-600" :
                resultats.verdict.icone === "attention" ? "text-amber-600" : "text-red-500"
              }`}>
                {resultats.verdict.desc}
              </p>
            </div>

            {/* Scores */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
              <div className="bg-white border border-[var(--g-ligne,#E5E7EB)] rounded-2xl p-5 text-center">
                <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[var(--g-gris,#6B7280)] mb-2">Accompagnement entrepreneurial</p>
                <p className="text-[36px] font-bold tracking-[-0.02em] text-[var(--g-vert,#0D6B3F)]" style={{ fontVariantNumeric: "tabular-nums" }}>
                  {resultats.pctTech.toFixed(1)}<span className="text-[18px] font-medium text-[var(--g-gris,#6B7280)]"> /100</span>
                </p>
                <p className={`text-[14px] font-semibold mt-1 ${getNiveau(resultats.pctTech).couleur}`}>
                  {getNiveau(resultats.pctTech).label}
                </p>
              </div>
              <div className="bg-white border border-[var(--g-ligne,#E5E7EB)] rounded-2xl p-5 text-center">
                <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[var(--g-gris,#6B7280)] mb-2">Compétences relationnelles</p>
                <p className="text-[36px] font-bold tracking-[-0.02em] text-[var(--g-vert,#0D6B3F)]" style={{ fontVariantNumeric: "tabular-nums" }}>
                  {resultats.pctPeda.toFixed(1)}<span className="text-[18px] font-medium text-[var(--g-gris,#6B7280)]"> /100</span>
                </p>
                <p className={`text-[14px] font-semibold mt-1 ${getNiveau(resultats.pctPeda).couleur}`}>
                  {getNiveau(resultats.pctPeda).label}
                </p>
              </div>
            </div>

            {/* Score global */}
            <div className="bg-white border border-[var(--g-ligne,#E5E7EB)] rounded-2xl p-5 text-center mb-5">
              <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[var(--g-gris,#6B7280)] mb-2">Score global</p>
              <p className="text-[40px] font-bold tracking-[-0.02em] text-[var(--g-encre,#1A1A1A)]" style={{ fontVariantNumeric: "tabular-nums" }}>
                {resultats.pctGlobal.toFixed(1)}<span className="text-[18px] font-medium text-[var(--g-gris,#6B7280)]"> /100</span>
              </p>
              <p className={`text-[14px] font-semibold mt-1 ${getNiveau(resultats.pctGlobal).couleur}`}>
                {getNiveau(resultats.pctGlobal).label}
              </p>
            </div>

            {/* Points à renforcer */}
            {resultats.faiblesses.length > 0 && (
              <div className="bg-white border border-[var(--g-ligne,#E5E7EB)] rounded-2xl p-5 mb-5">
                <h3 className="text-[16px] font-bold mb-4 text-[var(--g-encre,#1A1A1A)]">Points à renforcer</h3>
                {resultats.faiblesses.filter(f => f.section === "tech").length > 0 && (
                  <div className="mb-4">
                    <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[var(--g-gris,#6B7280)] mb-2">Accompagnement entrepreneurial</p>
                    <ul className="space-y-1.5">
                      {resultats.faiblesses.filter(f => f.section === "tech").map((f, i) => (
                        <li key={i} className="text-[14px] text-[var(--g-gris,#6B7280)] flex items-start gap-2">
                          <span className="text-[var(--g-vert,#0D6B3F)] font-semibold shrink-0">→</span>
                          {f.sujet}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {resultats.faiblesses.filter(f => f.section === "peda").length > 0 && (
                  <div>
                    <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[var(--g-gris,#6B7280)] mb-2">Compétences relationnelles</p>
                    <ul className="space-y-1.5">
                      {resultats.faiblesses.filter(f => f.section === "peda").map((f, i) => (
                        <li key={i} className="text-[14px] text-[var(--g-gris,#6B7280)] flex items-start gap-2">
                          <span className="text-[var(--g-vert,#0D6B3F)] font-semibold shrink-0">→</span>
                          {f.sujet}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  setEcran("intro");
                  setReponses(new Array(14).fill(-1));
                  setQuestionCourante(0);
                  setResultats(null);
                }}
                className="flex-1 py-3 border border-[var(--g-ligne,#E5E7EB)] text-[var(--g-gris,#6B7280)] font-semibold rounded-xl hover:border-[var(--g-gris,#6B7280)] transition text-center"
              >
                Refaire l&apos;évaluation
              </button>
              <Link
                href="/devenir-consultant"
                className="flex-1 py-3 bg-[var(--g-vert,#0D6B3F)] hover:bg-[var(--g-vert-fonce,#0A5632)] text-white font-semibold rounded-xl transition flex items-center justify-center gap-2"
              >
                Postuler comme consultant <ArrowRight size={18} />
              </Link>
            </div>

            {envoi && (
              <div className="flex items-center justify-center gap-2 mt-4 text-[13px] text-[var(--g-gris,#6B7280)]">
                <Loader2 size={14} className="animate-spin" /> Enregistrement en cours...
              </div>
            )}

            <p className="text-center text-[13px] text-[var(--g-gris,#6B7280)] mt-6 leading-relaxed">
              Protocole de validation SMART LIFE &middot; Lightning Corporation<br />
              Évaluation passée le {new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
