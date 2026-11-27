"use client";

import { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle, ChevronLeft, ChevronRight, Loader2, AlertTriangle, Award, XCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

// ── Questions du protocole ───────────────────────────────────────────────────

type Question = { section: string; text: string; options: string[] };

const QUESTIONS: Question[] = [
  // Section 1 : Sens des affaires et réalités du terrain (0-6)
  {
    section: "Sens des affaires",
    text: "Une commerçante du marché vend du poisson frais mais perd beaucoup de marchandise chaque jour. Elle vous demande conseil. Que faites-vous ?",
    options: [
      "Vous lui dites de vendre autre chose, le poisson c'est trop risqué",
      "Vous analysez avec elle ses heures d'achat, ses quantités, sa conservation et ses clients réguliers pour réduire les pertes",
      "Vous lui conseillez d'augmenter ses prix pour compenser les pertes",
      "Vous lui dites que c'est normal et qu'il faut juste accepter les pertes",
    ],
  },
  {
    section: "Sens des affaires",
    text: "Un jeune veut se lancer dans l'élevage de poulets mais n'a que 50 000 FCFA. Comment l'accompagnez-vous ?",
    options: [
      "Vous lui dites que c'est insuffisant et qu'il doit d'abord trouver plus d'argent",
      "Vous l'aidez à commencer petit (10-15 poulets), à bien calculer ses coûts (aliments, vaccins, abri) et à réinvestir ses premiers bénéfices",
      "Vous lui proposez de plutôt chercher un emploi salarié",
      "Vous lui faites un plan pour 500 poulets sans tenir compte de son budget réel",
    ],
  },
  {
    section: "Sens des affaires",
    text: "Une couturière a beaucoup de commandes mais n'arrive pas à livrer à temps. Les clients commencent à partir. Quel est votre diagnostic ?",
    options: [
      "Elle doit refuser des commandes jusqu'à ce qu'elle rattrape son retard",
      "Vous regardez avec elle son organisation : planning des commandes, délais annoncés, temps par pièce, et vous l'aidez à structurer son travail",
      "Vous lui conseillez d'embaucher quelqu'un tout de suite même si elle n'en a pas les moyens",
      "Vous lui dites que c'est un bon problème puisque ça veut dire qu'elle a du succès",
    ],
  },
  {
    section: "Sens des affaires",
    text: "Un restaurateur veut ouvrir un deuxième point de vente alors que le premier n'est pas encore rentable. Que lui conseillez-vous ?",
    options: [
      "Vous l'encouragez à foncer, plus de points de vente c'est plus de revenus",
      "Vous l'aidez d'abord à comprendre pourquoi le premier n'est pas rentable, à corriger les problèmes, puis à envisager l'expansion quand la base est solide",
      "Vous lui dites d'abandonner le premier et d'ouvrir ailleurs",
      "Vous ne donnez pas d'avis, c'est son argent après tout",
    ],
  },
  {
    section: "Sens des affaires",
    text: "Un agriculteur produit de bons légumes mais les vend toujours au même revendeur qui lui impose un prix très bas. Comment l'aidez-vous ?",
    options: [
      "Vous lui dites de continuer comme ça, au moins il a un acheteur régulier",
      "Vous explorez avec lui d'autres canaux : vente directe aux restaurants, aux particuliers, au marché, et vous l'aidez à négocier de meilleurs prix",
      "Vous lui conseillez d'arrêter de vendre à ce revendeur immédiatement",
      "Vous lui dites de produire en plus grande quantité pour compenser le prix bas",
    ],
  },
  {
    section: "Sens des affaires",
    text: "Une vendeuse de produits cosmétiques veut se différencier de ses concurrentes au quartier qui vendent les mêmes produits. Que proposez-vous ?",
    options: [
      "Vous lui dites de baisser ses prix pour attirer les clients",
      "Vous l'aidez à trouver ce qui la rend unique : conseils beauté personnalisés, fidélisation des clientes, gamme complémentaire, ou livraison à domicile",
      "Vous lui dites de changer de quartier",
      "Vous lui proposez de vendre exactement les mêmes produits mais de crier plus fort",
    ],
  },
  {
    section: "Sens des affaires",
    text: "Un client vous demande de gonfler les chiffres de son activité pour impressionner un investisseur potentiel. Quelle est votre position ?",
    options: [
      "Vous acceptez, c'est pour une bonne cause",
      "Vous refusez et vous l'aidez plutôt à mettre en valeur ses vrais résultats, son potentiel et son plan de croissance de manière honnête",
      "Vous ne dites rien et le laissez se débrouiller",
      "Vous coupez la relation immédiatement",
    ],
  },
  // Section 2 : Compétences relationnelles et accompagnement (7-13)
  {
    section: "Compétences relationnelles",
    text: "Un entrepreneur que vous accompagnez ne sait ni lire ni écrire couramment. Comment adaptez-vous votre accompagnement ?",
    options: [
      "Vous lui dites que sans savoir lire, il ne peut pas réussir en affaires",
      "Vous utilisez des méthodes visuelles, des appels vocaux, des exemples concrets et vous l'aidez à s'entourer de personnes complémentaires",
      "Vous lui donnez des documents écrits et lui dites de trouver quelqu'un pour les lire",
      "Vous refusez de l'accompagner, c'est trop compliqué",
    ],
  },
  {
    section: "Compétences relationnelles",
    text: "Un client a emprunté de l'argent à sa famille pour lancer son business et il est sous pression. Comment gérez-vous cette situation ?",
    options: [
      "Vous lui dites de rembourser d'abord et de lancer le business plus tard",
      "Vous l'aidez à établir un plan réaliste avec des étapes courtes pour générer rapidement ses premiers revenus et honorer ses engagements",
      "Vous ignorez la pression familiale, ce n'est pas votre problème",
      "Vous lui dites de ne pas mélanger famille et affaires la prochaine fois",
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
    text: "Pendant une réunion, un client vous dit devant d'autres personnes que vos conseils ne marchent pas. Comment réagissez-vous ?",
    options: [
      "Vous vous défendez en montrant que c'est lui qui n'applique pas correctement",
      "Vous écoutez calmement, lui demandez des précisions en privé, puis vous revoyez ensemble ce qui n'a pas fonctionné",
      "Vous vous excusez publiquement et changez toute votre approche",
      "Vous ne dites rien et vous partez",
    ],
  },
  {
    section: "Compétences relationnelles",
    text: "Une cliente veut copier exactement ce que fait sa voisine qui a réussi, sans chercher à comprendre pourquoi ça marche. Que faites-vous ?",
    options: [
      "Vous la laissez copier, au moins elle a un modèle",
      "Vous lui expliquez ce qui fait le succès de sa voisine (le travail, la régularité, la connaissance des clients) et vous l'aidez à construire SA propre version adaptée à ses forces",
      "Vous lui dites que copier c'est mal et qu'elle doit tout inventer",
      "Vous lui donnez la recette exacte de ce que fait sa voisine",
    ],
  },
  {
    section: "Compétences relationnelles",
    text: "Un client a réussi à doubler son chiffre d'affaires en 3 mois grâce à votre accompagnement. Comment capitalisez-vous sur ce succès ?",
    options: [
      "Rien de spécial, c'est votre travail",
      "Vous célébrez avec lui, analysez ensemble les actions qui ont marché, et vous construisez la prochaine étape pour aller encore plus loin",
      "Vous lui demandez immédiatement de vous payer plus cher",
      "Vous considérez que votre travail est terminé",
    ],
  },
  {
    section: "Compétences relationnelles",
    text: "Deux de vos clients ont des commerces similaires dans le même quartier. Comment gérez-vous cette situation ?",
    options: [
      "Vous donnez les mêmes conseils aux deux sans rien changer",
      "Vous aidez chacun à trouver son positionnement unique : clientèle cible, spécialité, service, horaires, et vous êtes transparent avec les deux",
      "Vous arrêtez d'accompagner l'un des deux",
      "Vous créez de la concurrence entre eux pour les motiver",
    ],
  },
];

const BAREME = [0, 3, 1, 0];
const LETTRES = ["A", "B", "C", "D"];

const SUJETS_TECH = [
  "Réduction des pertes et gestion de stock",
  "Lancement d'activité avec petit budget",
  "Organisation et productivité",
  "Diagnostic de rentabilité",
  "Diversification des canaux de vente",
  "Différenciation et positionnement",
  "Éthique et honnêteté",
];
const SUJETS_PEDA = [
  "Adaptation aux profils variés",
  "Gestion de la pression financière",
  "Suivi et relance bienveillante",
  "Gestion des critiques",
  "Originalité et construction personnelle",
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
    return { titre: "Validé", desc: "Félicitations ! Vous avez le profil pour accompagner des entrepreneurs chez Smart Life. Nous vous contacterons très bientôt.", icone: "succes" as const };
  if ((pctTech >= 60 && pctTech < 75) || (pctPeda >= 60 && pctPeda < 75))
    return { titre: "Validation conditionnelle", desc: "Vous avez du potentiel ! Quelques points sont à renforcer. Nous vous proposerons un plan de mise à niveau avant de vous intégrer.", icone: "attention" as const };
  if (pctTech >= 40 || pctPeda >= 40)
    return { titre: "Formation complémentaire requise", desc: "Certaines compétences essentielles pour l'accompagnement nécessitent un renforcement. Un parcours de formation vous sera proposé.", icone: "attention" as const };
  return { titre: "Non validé", desc: "Les résultats ne correspondent pas encore au profil recherché. Vous pourrez repasser l'évaluation après vous être préparé.", icone: "echec" as const };
}

// ── Composant ────────────────────────────────────────────────────────────────

type Ecran = "intro" | "question" | "resultats";

import { Suspense } from "react";

export default function EvaluationPageWrapper() {
  return (
    <Suspense>
      <EvaluationPage />
    </Suspense>
  );
}

function EvaluationPage() {
  const params = useSearchParams();
  const [ecran, setEcran] = useState<Ecran>("intro");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [chargement, setChargement] = useState(false);

  useEffect(() => {
    const e = params.get("email");
    if (e) setEmail(e);
  }, [params]);
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

  const demarrer = useCallback(async () => {
    const err: Record<string, string> = {};
    if (!email.trim() || !email.includes("@")) err.email = "Une adresse email valide est requise";
    if (Object.keys(err).length > 0) { setErreurs(err); return; }
    setErreurs({});
    setChargement(true);
    try {
      const res = await fetch(`/api/candidatures/me?email=${encodeURIComponent(email.trim().toLowerCase())}`);
      const data = await res.json();
      if (!data.candidatures || data.candidatures.length === 0) {
        setErreurs({ email: "Aucune candidature trouvée pour cet email. Vous devez d'abord remplir votre candidature." });
        setChargement(false);
        return;
      }
      const c = data.candidatures[data.candidatures.length - 1];
      setNom(`${c.prenom || ""} ${c.nom || ""}`.trim());
      setTelephone(c.telephone || "");
      setEcran("question");
    } catch {
      setErreurs({ email: "Erreur de connexion. Réessayez." });
    }
    setChargement(false);
  }, [email]);

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
                  <label htmlFor="eval-email" className="block text-[14px] font-semibold mb-1.5 text-[var(--g-encre,#1A1A1A)]">
                    Entrez l&apos;email utilisé lors de votre candidature
                  </label>
                  <input
                    id="eval-email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="votre@email.com"
                    className={`w-full px-4 py-2.5 rounded-xl border ${erreurs.email ? "border-red-400" : "border-[var(--g-ligne,#E5E7EB)]"} bg-[var(--g-fond,#FAFAF8)] text-[15px] focus:outline-none focus:ring-2 focus:ring-[var(--g-vert,#0D6B3F)]/20 focus:border-[var(--g-vert,#0D6B3F)] transition`}
                  />
                  {erreurs.email && (
                    <div className="mt-2">
                      <p className="text-red-500 text-[13px]">{erreurs.email}</p>
                      {erreurs.email.includes("Aucune candidature") && (
                        <Link href="/devenir-consultant" className="inline-flex items-center gap-1 text-[13px] text-[var(--g-vert,#0D6B3F)] font-semibold mt-1 hover:underline">
                          Remplir ma candidature <ArrowRight size={14} />
                        </Link>
                      )}
                    </div>
                  )}
                </div>

                <button
                  onClick={demarrer}
                  disabled={chargement}
                  className="w-full py-3 bg-[var(--g-vert,#0D6B3F)] hover:bg-[var(--g-vert-fonce,#0A5632)] disabled:opacity-60 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2"
                >
                  {chargement ? (
                    <><Loader2 size={18} className="animate-spin" /> Vérification...</>
                  ) : (
                    <>Commencer l&apos;évaluation <ArrowRight size={18} /></>
                  )}
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
                <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[var(--g-gris,#6B7280)] mb-2">Sens des affaires</p>
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
                    <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[var(--g-gris,#6B7280)] mb-2">Sens des affaires</p>
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

            {/* Message de confirmation */}
            <div className="bg-white border border-[var(--g-vert,#0D6B3F)]/20 rounded-2xl p-5 mb-5">
              <p className="text-[15px] font-semibold text-[var(--g-encre,#1A1A1A)] mb-2">
                Évaluation terminée
              </p>
              <p className="text-[14px] text-[var(--g-gris,#6B7280)] leading-relaxed">
                Vos résultats ont été enregistrés. Notre équipe va étudier votre évaluation et vous contactera sur WhatsApp pour la suite.
              </p>
            </div>

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
