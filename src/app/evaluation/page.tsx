"use client";

import { useState, useCallback } from "react";
import { CheckCircle, ChevronLeft, ChevronRight, Loader2, AlertTriangle, Award, XCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

// ── Questions du protocole ───────────────────────────────────────────────────

type Question = { section: string; text: string; options: string[] };

const QUESTIONS: Question[] = [
  // Section 1 : Raisonnement professionnel (0-6)
  {
    section: "Raisonnement professionnel",
    text: "Un client demande un service que vous n'avez jamais réalisé. Quelle est votre première réaction ?",
    options: [
      "Vous refusez poliment en expliquant que ce n'est pas votre domaine",
      "Vous acceptez et cherchez à comprendre le besoin avant de proposer une solution",
      "Vous demandez à un collègue de s'en charger",
      "Vous acceptez sans poser de questions, vous verrez bien",
    ],
  },
  {
    section: "Raisonnement professionnel",
    text: "Lors d'une mission, vous constatez que les objectifs du client ne sont pas réalistes. Que faites-vous ?",
    options: [
      "Vous ne dites rien pour ne pas le froisser",
      "Vous proposez des objectifs intermédiaires réalistes tout en gardant la vision finale",
      "Vous abandonnez la mission",
      "Vous acceptez et espérez que ça ira",
    ],
  },
  {
    section: "Raisonnement professionnel",
    text: "Un collègue consultant fait une erreur devant un client. Comment réagissez-vous ?",
    options: [
      "Vous le corrigez devant le client pour montrer votre expertise",
      "Vous complétez discrètement l'information et en discutez avec lui en privé après",
      "Vous ne dites rien, ce n'est pas votre problème",
      "Vous signalez l'erreur à votre hiérarchie",
    ],
  },
  {
    section: "Raisonnement professionnel",
    text: "Un client exprime son mécontentement sur votre travail. Quelle approche adoptez-vous ?",
    options: [
      "Vous vous justifiez immédiatement",
      "Vous écoutez, reformulez ses attentes et proposez un plan de correction",
      "Vous considérez que le client a tort",
      "Vous passez le dossier à quelqu'un d'autre",
    ],
  },
  {
    section: "Raisonnement professionnel",
    text: "Vous devez présenter un projet complexe à un public non technique. Que privilégiez-vous ?",
    options: [
      "Un vocabulaire technique pour montrer votre maîtrise",
      "Des analogies simples, des visuels et un langage accessible",
      "Une présentation courte sans détails",
      "Vous lisez vos slides sans interaction",
    ],
  },
  {
    section: "Raisonnement professionnel",
    text: "On vous confie la responsabilité d'un projet avec un délai très court. Que faites-vous ?",
    options: [
      "Vous travaillez seul jour et nuit pour tout finir",
      "Vous identifiez les priorités, déléguez si possible et communiquez sur l'avancement",
      "Vous demandez un report de délai avant d'avoir commencé",
      "Vous faites le minimum et rendez un travail bâclé",
    ],
  },
  {
    section: "Raisonnement professionnel",
    text: "Un partenaire stratégique propose une collaboration qui ne correspond pas à l'éthique de votre entreprise. Que faites-vous ?",
    options: [
      "Vous acceptez pour le bénéfice financier",
      "Vous expliquez vos valeurs et proposez un cadre éthique commun ou déclinez respectueusement",
      "Vous ignorez la proposition sans répondre",
      "Vous acceptez en vous disant que personne ne le saura",
    ],
  },
  // Section 2 : Compétences pédagogiques (7-13)
  {
    section: "Compétences pédagogiques",
    text: "Un apprenant ne comprend pas votre explication malgré plusieurs tentatives. Que faites-vous ?",
    options: [
      "Vous répétez la même explication plus fort",
      "Vous changez de méthode : illustration, cas pratique, support visuel",
      "Vous passez au point suivant",
      "Vous lui dites de relire le support",
    ],
  },
  {
    section: "Compétences pédagogiques",
    text: "Pendant une formation, un participant pose une question hors sujet mais intéressante. Votre réaction ?",
    options: [
      "Vous ignorez la question pour rester dans le programme",
      "Vous la valorisez, répondez brièvement et proposez d'en parler après la session",
      "Vous déviez complètement vers ce sujet",
      "Vous dites que ce n'est pas pertinent",
    ],
  },
  {
    section: "Compétences pédagogiques",
    text: "Comment évaluez-vous la compréhension d'un groupe en cours de formation ?",
    options: [
      "Vous posez la question : « Vous avez compris ? »",
      "Vous utilisez des quiz, des mises en situation et observez les réactions",
      "Vous ne vérifiez pas, le contenu est suffisant",
      "Vous attendez les retours après la formation",
    ],
  },
  {
    section: "Compétences pédagogiques",
    text: "Un apprenant est démotivé et ne participe plus. Comment le remotivez-vous ?",
    options: [
      "Vous l'ignorez, il reviendra quand il voudra",
      "Vous lui donnez un rôle actif (exercice à animer, cas à résoudre)",
      "Vous le rappelez à l'ordre devant tout le monde",
      "Vous lui demandez de quitter la session",
    ],
  },
  {
    section: "Compétences pédagogiques",
    text: "Comment structurez-vous une session de formation d'une heure ?",
    options: [
      "Vous improvisez en fonction de l'humeur du groupe",
      "Introduction (5 min), contenu + exercices (45 min), synthèse + questions (10 min)",
      "Vous parlez pendant 50 minutes puis demandez s'il y a des questions",
      "Vous donnez le support et demandez de lire",
    ],
  },
  {
    section: "Compétences pédagogiques",
    text: "Après une formation, un participant vous dit qu'il n'a rien retenu. Que faites-vous ?",
    options: [
      "Vous pensez que c'est de sa faute",
      "Vous proposez un suivi individuel et adaptez vos méthodes pour la prochaine session",
      "Vous lui renvoyez le support de formation",
      "Vous ne faites rien, ce n'est pas votre problème",
    ],
  },
  {
    section: "Compétences pédagogiques",
    text: "On vous demande de former des personnes avec des niveaux très différents. Quelle stratégie adoptez-vous ?",
    options: [
      "Vous enseignez au niveau le plus bas pour ne perdre personne",
      "Vous créez des sous-groupes par niveau avec des activités adaptées",
      "Vous enseignez au niveau le plus élevé, les autres rattraperont",
      "Vous demandez à ne former que des personnes du même niveau",
    ],
  },
];

const BAREME = [0, 3, 1, 0];
const LETTRES = ["A", "B", "C", "D"];

const SUJETS_TECH = [
  "Gestion de situations nouvelles",
  "Cadrage d'objectifs réalistes",
  "Travail d'équipe et diplomatie",
  "Gestion des conflits clients",
  "Communication non technique",
  "Gestion des priorités et délais",
  "Éthique professionnelle",
];
const SUJETS_PEDA = [
  "Adaptation pédagogique",
  "Gestion des questions hors sujet",
  "Évaluation continue",
  "Remotivation des apprenants",
  "Structuration des sessions",
  "Suivi post-formation",
  "Différenciation pédagogique",
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
    return { titre: "Validé", desc: "Vous remplissez les critères requis pour intégrer l'équipe des consultants Smart Life.", icone: "succes" as const };
  if ((pctTech >= 60 && pctTech < 75) || (pctPeda >= 60 && pctPeda < 75))
    return { titre: "Validation conditionnelle", desc: "Vous avez le potentiel. Un plan de renforcement sera proposé sur les points à améliorer avant la validation finale.", icone: "attention" as const };
  if (pctTech >= 40 || pctPeda >= 40)
    return { titre: "Formation complémentaire requise", desc: "Certaines compétences nécessitent un renforcement significatif. Un parcours de formation vous sera proposé.", icone: "attention" as const };
  return { titre: "Non validé", desc: "Les résultats ne permettent pas de valider votre candidature pour le moment. Vous pourrez repasser l'évaluation après un parcours de mise à niveau.", icone: "echec" as const };
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
                <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[var(--g-gris,#6B7280)] mb-2">Raisonnement professionnel</p>
                <p className="text-[36px] font-bold tracking-[-0.02em] text-[var(--g-vert,#0D6B3F)]" style={{ fontVariantNumeric: "tabular-nums" }}>
                  {resultats.pctTech.toFixed(1)}<span className="text-[18px] font-medium text-[var(--g-gris,#6B7280)]"> /100</span>
                </p>
                <p className={`text-[14px] font-semibold mt-1 ${getNiveau(resultats.pctTech).couleur}`}>
                  {getNiveau(resultats.pctTech).label}
                </p>
              </div>
              <div className="bg-white border border-[var(--g-ligne,#E5E7EB)] rounded-2xl p-5 text-center">
                <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[var(--g-gris,#6B7280)] mb-2">Compétences pédagogiques</p>
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
                    <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[var(--g-gris,#6B7280)] mb-2">Raisonnement professionnel</p>
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
                    <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[var(--g-gris,#6B7280)] mb-2">Compétences pédagogiques</p>
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
