"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Jour = { date: string; count: number; revenue: number };
type Produit = { productId: string; productName: string; count: number; revenue: number };
type Analyse = {
  totalVisits: number; totalSales: number; totalRevenue: number; conversionRate: number;
  abandonedCarts: number; salesByDay: Jour[]; visitsByDay: { date: string; count: number }[]; salesByProduct: Produit[];
};
type Transaction = { id: string; ts: string; customerName: string; product: string; amount: number; status: string };

export type ATraiter = { demandes: number; candidatures: number; avis: number; motivations: number };

const fcfa = (n: number) => `${Math.round(n).toLocaleString("fr-FR").replace(/ | /g, " ")} FCFA`;
const jourIso = (decalage = 0) => new Date(Date.now() - decalage * 86_400_000).toISOString().slice(0, 10);
const ecart = (actuel: number, avant: number) => (avant > 0 ? Math.round(((actuel - avant) / avant) * 100) : actuel > 0 ? 100 : 0);
const ilYa = (ts: string) => {
  const m = Math.max(0, Math.round((Date.now() - new Date(ts).getTime()) / 60000));
  if (m < 1) return "à l'instant";
  if (m < 60) return `il y a ${m} min`;
  const h = Math.round(m / 60);
  return h < 24 ? `il y a ${h} h` : `il y a ${Math.round(h / 24)} j`;
};

const OUTILS: Array<{ famille: string; liens: Array<{ href: string; icone: string; nom: string }> }> = [
  { famille: "💰 Ventes et argent", liens: [
    { href: "/admin/ventes", icone: "🛒", nom: "Ventes" },
    { href: "/admin/payment-links", icone: "🔗", nom: "Liens de paiement" },
    { href: "/admin/packs", icone: "📦", nom: "Packs" },
    { href: "/admin/promo-codes", icone: "🏷️", nom: "Codes promo" },
    { href: "/admin/vip", icone: "👑", nom: "SmartLife Pass" },
    { href: "/admin/affiliates", icone: "🚀", nom: "Affiliés" },
  ] },
  { famille: "📣 Marketing", liens: [
    { href: "/admin/analytics", icone: "📊", nom: "Analytique" },
    { href: "/admin/social-proof", icone: "🔔", nom: "Notifications de vente" },
    { href: "/admin/popups", icone: "📣", nom: "Fenêtres surgissantes" },
    { href: "/admin/cross-sell", icone: "🛍️", nom: "Ventes croisées" },
    { href: "/admin/automations", icone: "⚡", nom: "Relances automatiques" },
    { href: "/admin/pixels", icone: "🎯", nom: "Pixels publicitaires" },
    { href: "/admin/qrcodes", icone: "⬛", nom: "QR codes" },
  ] },
  { famille: "📚 Contenu", liens: [
    { href: "/admin/services", icone: "🛠️", nom: "Services" },
    { href: "/admin/ressources-gratuites", icone: "🎁", nom: "Ressources gratuites" },
    { href: "/admin/certificates", icone: "🎓", nom: "Certificats" },
  ] },
  { famille: "💬 Clients", liens: [
    { href: "/admin/contacts", icone: "✉️", nom: "Messages" },
    { href: "/admin/avis", icone: "⭐", nom: "Avis guides" },
    { href: "/admin/reviews", icone: "💬", nom: "Avis consultants" },
  ] },
];

function Carte({ icone, titre, valeur, detail, tendance, couleur, href }: {
  icone: string; titre: string; valeur: string; detail?: string; tendance?: number; couleur: string; href?: string;
}) {
  const contenu = (
    <div className="relative h-full overflow-hidden rounded-3xl bg-white p-4 sm:p-5 shadow-md border border-[#f1f2f3] transition-transform hover:-translate-y-1">
      <span className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-15" style={{ background: couleur }} />
      <span className="flex items-center justify-center w-10 h-10 rounded-full text-[19px] shadow" style={{ background: couleur }}>{icone}</span>
      <p className="mt-3 text-[12.5px] font-bold text-[#5c5e62]">{titre}</p>
      <p className="mt-0.5 text-[20px] sm:text-[24px] font-black text-[#111827] leading-tight">{valeur}</p>
      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
        {tendance !== undefined && (
          <span className="rounded-full px-2 py-0.5 text-[11.5px] font-extrabold"
            style={{ background: tendance >= 0 ? "#dcfce7" : "#fee2e2", color: tendance >= 0 ? "#15803d" : "#b91c1c" }}>
            {tendance >= 0 ? "▲" : "▼"} {Math.abs(tendance)} %
          </span>
        )}
        {detail && <span className="text-[12px] text-[#5c5e62]">{detail}</span>}
      </div>
    </div>
  );
  return href ? <Link href={href} className="block h-full">{contenu}</Link> : contenu;
}

export default function TableauDeBord({ motDePasse, nom, aTraiter, allerA }: {
  motDePasse: string; nom: string; aTraiter: ATraiter; allerA: (onglet: string) => void;
}) {
  const [quinze, setQuinze] = useState<Analyse | null>(null);
  const [semaine, setSemaine] = useState<Analyse | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [erreur, setErreur] = useState("");
  const [survol, setSurvol] = useState<number | null>(null);

  useEffect(() => {
    const p = encodeURIComponent(motDePasse);
    const lire = (url: string) => fetch(url).then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.json(); });
    lire(`/api/admin/analytics?password=${p}&from=${jourIso(13)}&to=${jourIso(0)}`).then(setQuinze)
      .catch((e) => setErreur(e.message === "401" ? "acces" : "reseau"));
    lire(`/api/admin/analytics?password=${p}&from=${jourIso(6)}&to=${jourIso(0)}`).then(setSemaine).catch(() => {});
    lire(`/api/admin/transactions?password=${p}&from=${jourIso(2)}`).then((d) => setTransactions(d.transactions || [])).catch(() => {});
  }, [motDePasse]);

  const heure = new Date().getHours();
  const salut = heure < 12 ? "Bonjour" : heure < 18 ? "Bon après-midi" : "Bonsoir";
  const jours = quinze?.salesByDay ?? [];
  const parJour = (d: string) => jours.find((j) => j.date === d) ?? { date: d, count: 0, revenue: 0 };
  const auj = parJour(jourIso(0));
  const hier = parJour(jourIso(1));
  const somme = (de: number, a: number) => Array.from({ length: a - de + 1 }, (_, i) => parJour(jourIso(de + i)).revenue).reduce((s, v) => s + v, 0);
  const sept = somme(0, 6);
  const septAvant = somme(7, 13);
  const visitesAuj = quinze?.visitsByDay.find((v) => v.date === jourIso(0))?.count ?? 0;
  const aujourdhui = jourIso(0);
  const echouesAuj = transactions.filter((t) => t.ts.slice(0, 10) === aujourdhui && (t.status === "failed" || t.status === "abandoned")).length;
  const dernieres = transactions.filter((t) => t.status === "successful").sort((a, b) => b.ts.localeCompare(a.ts)).slice(0, 8);
  const graphe = Array.from({ length: 14 }, (_, i) => parJour(jourIso(13 - i)));
  const maxi = Math.max(1, ...graphe.map((j) => j.revenue));
  const totalATraiter = aTraiter.demandes + aTraiter.candidatures + aTraiter.avis + aTraiter.motivations;

  return (
    <div className="space-y-6">
      {/* Bonjour */}
      <div className="relative overflow-hidden rounded-[2rem] p-5 sm:p-7 shadow-xl" style={{ background: "linear-gradient(135deg, #1b7a1b 0%, #27A827 60%, #b8a000 100%)" }}>
        <span className="absolute -top-20 -right-16 w-56 h-56 rounded-full opacity-30" style={{ background: "#E8B800", filter: "blur(50px)" }} />
        <p className="relative text-[22px] sm:text-[28px] font-black" style={{ color: "#fff" }}>{salut} {nom.split(" ")[0]} 👋</p>
        <p className="relative mt-1 text-[14px] sm:text-[15px] font-semibold" style={{ color: "rgba(255,255,255,0.92)" }}>
          {quinze
            ? auj.count > 0
              ? `Aujourd'hui : ${auj.count} vente${auj.count > 1 ? "s" : ""} pour ${fcfa(auj.revenue)}. Continue comme ça !`
              : "Pas encore de vente aujourd'hui. Une relance WhatsApp ou une publication peut lancer la journée."
            : "Chargement des chiffres du jour…"}
          {totalATraiter > 0 && ` ${totalATraiter} élément${totalATraiter > 1 ? "s" : ""} t'attend${totalATraiter > 1 ? "ent" : ""} plus bas.`}
        </p>
      </div>

      {erreur && (
        <p className="rounded-2xl px-4 py-3 text-[14px] font-semibold" style={{ background: "#fff7ed", color: "#9a3412", border: "1px solid #fed7aa" }}>
          {erreur === "acces"
            ? "Les chiffres de ventes sont réservés au compte principal. Les éléments à traiter et les outils restent disponibles."
            : "Impossible de charger les chiffres pour le moment. Vérifie la connexion et recharge la page."}
        </p>
      )}

      {/* Les 4 chiffres clés */}
      {!erreur && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Carte icone="💵" couleur="#27A827" titre="Argent encaissé aujourd'hui" valeur={quinze ? fcfa(auj.revenue) : "…"}
            tendance={quinze ? ecart(auj.revenue, hier.revenue) : undefined} detail={quinze ? `${auj.count} vente${auj.count > 1 ? "s" : ""} · vs hier` : undefined} />
          <Carte icone="📅" couleur="#E8B800" titre="7 derniers jours" valeur={quinze ? fcfa(sept) : "…"}
            tendance={quinze ? ecart(sept, septAvant) : undefined} detail="vs semaine d'avant" />
          <Carte icone="👀" couleur="#27A827" titre="Visites aujourd'hui" valeur={quinze ? visitesAuj.toLocaleString("fr-FR") : "…"}
            detail={semaine ? `${semaine.conversionRate} % achètent (7 j)` : undefined} href="/admin/analytics" />
          <Carte icone="🔁" couleur="#E8B800" titre="Paiements à relancer" valeur={`${echouesAuj}`}
            detail={quinze ? `échoués aujourd'hui · ${quinze.abandonedCarts} paniers abandonnés` : undefined} href="/admin/ventes" />
        </div>
      )}

      {/* Graphique 14 jours */}
      {quinze && (
        <div className="rounded-[2rem] bg-white p-4 sm:p-6 shadow-md border border-[#f1f2f3]">
          <div className="flex items-baseline justify-between gap-2 flex-wrap">
            <p className="text-[16px] font-extrabold text-[#111827]">📈 Ventes des 14 derniers jours</p>
            <p className="text-[13px] font-bold text-[#1e7a1e]">{fcfa(somme(0, 13))} au total</p>
          </div>
          <div className="mt-5 flex items-end gap-1 sm:gap-2 h-44">
            {graphe.map((j, i) => {
              const estAuj = i === 13;
              const h = Math.max(4, (j.revenue / maxi) * 100);
              return (
                <button key={j.date} type="button" onMouseEnter={() => setSurvol(i)} onMouseLeave={() => setSurvol(null)} onClick={() => setSurvol(i)}
                  className="relative flex-1 h-full flex flex-col justify-end items-center group" aria-label={`${j.date} : ${fcfa(j.revenue)}`}>
                  {survol === i && (
                    <span className="absolute -top-1 -translate-y-full z-10 whitespace-nowrap rounded-xl px-2.5 py-1.5 text-[11.5px] font-bold shadow-lg" style={{ background: "#111827", color: "#fff" }}>
                      {new Date(j.date).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" })} · {fcfa(j.revenue)} · {j.count} vente{j.count > 1 ? "s" : ""}
                    </span>
                  )}
                  <span className="w-full rounded-t-xl transition-all duration-700"
                    style={{ height: `${h}%`, background: estAuj ? "linear-gradient(180deg, #E8B800, #d4a300)" : "linear-gradient(180deg, #34c234, #27A827)", opacity: survol === null || survol === i ? 1 : 0.55 }} />
                  <span className={`mt-1.5 text-[10px] ${estAuj ? "font-black text-[#b38f00]" : "text-[#717882]"}`}>
                    {estAuj ? "Auj." : new Date(j.date).getDate()}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* À traiter */}
      <div className="rounded-[2rem] bg-white p-4 sm:p-6 shadow-md border border-[#f1f2f3]">
        <p className="text-[16px] font-extrabold text-[#111827]">✅ À traiter</p>
        <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { n: aTraiter.demandes, l: "Demandes d'accompagnement", o: "candidatures", c: "#E8B800" },
            { n: aTraiter.candidatures, l: "Candidatures de consultants", o: "candidatures_consultant", c: "#27A827" },
            { n: aTraiter.avis, l: "Avis à valider", o: "avis", c: "#E8B800" },
            { n: aTraiter.motivations, l: "Motivations non lues", o: "motivations", c: "#27A827" },
          ].map((t) => (
            <button key={t.o} type="button" onClick={() => allerA(t.o)}
              className={`${t.n > 0 ? "cta-respire" : ""} rounded-3xl px-3 py-4 text-left transition-transform hover:-translate-y-0.5`}
              style={{ background: t.n > 0 ? (t.c === "#E8B800" ? "#fffbea" : "#f0fdf4") : "#f7f7f8", border: `1.5px solid ${t.n > 0 ? t.c : "#e8e9eb"}` }}>
              <p className="text-[26px] font-black leading-none" style={{ color: t.n > 0 ? "#111827" : "#a9aeb5" }}>{t.n}</p>
              <p className="mt-1.5 text-[12.5px] font-bold text-[#393c41] leading-snug">{t.l}</p>
              <p className="mt-1 text-[12px] font-extrabold" style={{ color: t.n > 0 ? "#1e7a1e" : "#a9aeb5" }}>{t.n > 0 ? "Traiter →" : "Rien en attente"}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Meilleurs guides + dernières ventes */}
      {!erreur && (
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="rounded-[2rem] bg-white p-4 sm:p-6 shadow-md border border-[#f1f2f3]">
            <p className="text-[16px] font-extrabold text-[#111827]">🏆 Les plus vendus (7 jours)</p>
            {semaine && semaine.salesByProduct.length === 0 && <p className="mt-3 text-[13px] text-[#717882]">Aucune vente sur les 7 derniers jours.</p>}
            <ol className="mt-3 space-y-2.5">
              {(semaine?.salesByProduct ?? []).slice(0, 5).map((p, i) => (
                <li key={p.productId} className="flex items-center gap-3">
                  <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full text-[13px] font-black" style={{ background: i === 0 ? "#E8B800" : i < 3 ? "#27A827" : "#e8e9eb", color: i < 3 ? "#fff" : "#393c41" }}>{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-bold text-[#111827]">{p.productName}</p>
                    <div className="mt-1 h-1.5 rounded-full bg-[#f1f2f3] overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(p.count / (semaine!.salesByProduct[0].count || 1)) * 100}%`, background: "linear-gradient(90deg, #27A827, #E8B800)" }} />
                    </div>
                  </div>
                  <span className="flex-shrink-0 text-right text-[12px] font-bold text-[#393c41]">{p.count} · {fcfa(p.revenue)}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-[2rem] bg-white p-4 sm:p-6 shadow-md border border-[#f1f2f3]">
            <div className="flex items-baseline justify-between">
              <p className="text-[16px] font-extrabold text-[#111827]">🛎️ Dernières ventes</p>
              <Link href="/admin/ventes" className="text-[13px] font-bold text-[#1e7a1e]">Tout voir →</Link>
            </div>
            {dernieres.length === 0 && <p className="mt-3 text-[13px] text-[#717882]">Aucune vente ces 3 derniers jours.</p>}
            <ul className="mt-3 divide-y divide-[#f1f2f3]">
              {dernieres.map((t) => (
                <li key={t.id} className="flex items-center gap-3 py-2.5">
                  <span className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-full text-[13px] font-black" style={{ background: "#dcfce7", color: "#15803d" }}>
                    {(t.customerName || "?").trim().charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-bold text-[#111827]">{(t.customerName || "Client").split(" ")[0]} · {t.product}</p>
                    <p className="text-[12px] text-[#717882]">{ilYa(t.ts)}</p>
                  </div>
                  <span className="flex-shrink-0 text-[13.5px] font-black text-[#15803d]">+{fcfa(t.amount)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Tous les outils, rangés par famille */}
      <div className="rounded-[2rem] bg-white p-4 sm:p-6 shadow-md border border-[#f1f2f3]">
        <p className="text-[16px] font-extrabold text-[#111827]">🧰 Tous les outils</p>
        <div className="mt-4 grid sm:grid-cols-2 gap-5">
          {OUTILS.map((f) => (
            <div key={f.famille}>
              <p className="text-[13px] font-extrabold text-[#5c5e62]">{f.famille}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {f.liens.map((l) => (
                  <Link key={l.href} href={l.href}
                    className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-bold border border-[#e8e9eb] bg-[#fafafa] text-[#20252b] transition-all hover:-translate-y-0.5 hover:border-[#27A827] hover:bg-[#f0fdf4]">
                    <span>{l.icone}</span> {l.nom}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
