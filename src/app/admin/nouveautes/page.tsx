"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bell, Mail, Send, Smartphone, Users } from "lucide-react";

const CLE_MDP = "sl_admin_pw";

type Envoi = {
  id: string; ts: string; titre: string; message: string; lien: string;
  categorie: string | null; origine: "manuel" | "guide" | "conseil";
  telephones: number; emails: number; dejaPrevenus: number; echecs: number;
};
type Tableau = {
  total: { abonnes: number; telephones: number; emails: number; arretes: number };
  parCategorie: { categorie: string; abonnes: number; telephones: number; emails: number }[];
  categories: string[];
  conseils: { slug: string; titre: string; description: string; categorie: string | null; annonce: boolean }[];
  envois: Envoi[];
  reglages: { annonceAutoGuides: boolean };
  ecartHeures: number;
};

const ORIGINE: Record<Envoi["origine"], string> = { manuel: "Message", guide: "Nouveau guide", conseil: "Conseil gratuit" };

function date(iso: string) {
  try { return new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }); }
  catch { return iso; }
}

export default function NouveautesAdmin() {
  const [mdp, setMdp] = useState("");
  const [saisie, setSaisie] = useState("");
  const [erreurMdp, setErreurMdp] = useState("");
  const [t, setT] = useState<Tableau | null>(null);

  const [categorie, setCategorie] = useState("");
  const [titre, setTitre] = useState("");
  const [message, setMessage] = useState("");
  const [lien, setLien] = useState("/");
  const [compte, setCompte] = useState<{ telephones: number; emails: number; dejaPrevenus: number } | null>(null);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [retour, setRetour] = useState("");

  const charger = useCallback(async (pw: string) => {
    const r = await fetch("/api/admin/nouveautes", { headers: { "x-admin-password": pw }, cache: "no-store" });
    if (!r.ok) return false;
    setT(await r.json());
    return true;
  }, []);

  useEffect(() => {
    let pw = "";
    try { pw = localStorage.getItem(CLE_MDP) || ""; } catch { /* */ }
    if (!pw) return;
    (async () => { if (await charger(pw)) setMdp(pw); })();
  }, [charger]);

  useEffect(() => {
    if (!mdp) return;
    fetch("/api/admin/nouveautes", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-password": mdp },
      body: JSON.stringify({ action: "compter", categorie }),
    }).then((r) => r.json()).then(setCompte).catch(() => setCompte(null));
  }, [mdp, categorie, t]);

  async function connexion(e: React.FormEvent) {
    e.preventDefault();
    setErreurMdp("");
    if (await charger(saisie)) {
      setMdp(saisie);
      try { localStorage.setItem(CLE_MDP, saisie); } catch { /* */ }
    } else setErreurMdp("Mot de passe incorrect.");
  }

  async function poster(corps: Record<string, unknown>) {
    const r = await fetch("/api/admin/nouveautes", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-password": mdp },
      body: JSON.stringify(corps),
    });
    return { ok: r.ok, d: await r.json().catch(() => ({})) };
  }

  function bilan(e: Envoi) {
    const total = e.telephones + e.emails;
    let s = total === 0 ? "Personne n'a reçu ce message" : `Reçu par ${total} client${total > 1 ? "s" : ""} (${e.telephones} sur téléphone, ${e.emails} par e-mail)`;
    if (e.dejaPrevenus) s += ` · ${e.dejaPrevenus} déjà prévenu${e.dejaPrevenus > 1 ? "s" : ""} aujourd'hui, pas dérangé${e.dejaPrevenus > 1 ? "s" : ""}`;
    if (e.echecs) s += ` · ${e.echecs} échec${e.echecs > 1 ? "s" : ""}`;
    return s;
  }

  async function envoyer() {
    const qui = categorie ? `les abonnés de « ${categorie} »` : "tous les abonnés";
    if (!window.confirm(`Envoyer ce message à ${qui} ?`)) return;
    setEnvoiEnCours(true);
    setRetour("");
    const { ok, d } = await poster({ action: "envoyer", titre, message, lien, categorie });
    setEnvoiEnCours(false);
    if (!ok) { setRetour(d.error || "L'envoi a échoué."); return; }
    setRetour(bilan(d.envoi));
    setTitre(""); setMessage(""); setLien("/");
    charger(mdp);
  }

  async function annoncerConseil(slug: string, titreConseil: string, cat: string | null) {
    const qui = cat ? `les abonnés de « ${cat} »` : "tous les abonnés";
    if (!window.confirm(`Annoncer le conseil « ${titreConseil} » à ${qui} ?`)) return;
    const { ok, d } = await poster({ action: "conseil", slug });
    window.alert(ok ? bilan(d.envoi) : d.error || "L'envoi a échoué.");
    charger(mdp);
  }

  async function basculerAuto() {
    if (!t) return;
    await poster({ action: "reglages", annonceAutoGuides: !t.reglages.annonceAutoGuides });
    charger(mdp);
  }

  if (!mdp) {
    return (
      <main className="mx-auto max-w-sm px-4 py-20">
        <form onSubmit={connexion} className="rounded-2xl border border-gray-200 bg-white p-6">
          <h1 className="mb-4 text-lg font-bold text-gray-900">Nouveautés aux clients</h1>
          <input type="password" value={saisie} onChange={(e) => setSaisie(e.target.value)} placeholder="Mot de passe administrateur"
            className="mb-3 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm" />
          {erreurMdp && <p className="mb-3 text-sm text-red-600">{erreurMdp}</p>}
          <button className="w-full rounded-xl bg-gray-900 py-3 text-sm font-bold text-white">Entrer</button>
        </form>
      </main>
    );
  }

  if (!t) return <main className="p-10 text-center text-sm text-gray-500">Chargement…</main>;

  const champ = "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 focus:border-gray-900 focus:outline-none";
  const conseilsAFaire = t.conseils.filter((c) => !c.annonce);
  const conseilsFaits = t.conseils.filter((c) => c.annonce);

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div className="flex items-center gap-3">
        <Link href="/admin" className="rounded-full border border-gray-200 p-2 hover:bg-gray-50" aria-label="Retour"><ArrowLeft size={18} /></Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Nouveautés aux clients</h1>
          <p className="text-sm text-gray-500">Les clients qui l&apos;ont accepté après leur achat sont prévenus des nouveaux guides et conseils de leur catégorie : sur leur téléphone, sinon par e-mail.</p>
        </div>
      </div>

      {/* Chiffres */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { icone: <Users size={16} />, label: "Clients abonnés", v: t.total.abonnes },
          { icone: <Smartphone size={16} />, label: "Sur téléphone", v: t.total.telephones },
          { icone: <Mail size={16} />, label: "Par e-mail", v: t.total.emails },
          { icone: <Bell size={16} />, label: "Ont arrêté", v: t.total.arretes },
        ].map((x) => (
          <div key={x.label} className="rounded-2xl border border-gray-200 bg-white p-4">
            <p className="flex items-center gap-1.5 text-xs text-gray-500">{x.icone}{x.label}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{x.v}</p>
          </div>
        ))}
      </div>

      {/* Annonce automatique */}
      <section className="flex items-start justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-5">
        <div>
          <h2 className="font-bold text-gray-900">Annonce automatique des nouveaux guides</h2>
          <p className="mt-1 text-sm text-gray-500">Quand vous publiez un guide (avec couverture et catégorie), ses clients abonnés sont prévenus tout seuls. Un client ne reçoit jamais plus d&apos;une nouveauté en {t.ecartHeures} heures.</p>
        </div>
        <button type="button" onClick={basculerAuto}
          className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${t.reglages.annonceAutoGuides ? "bg-green-600 text-white" : "border border-gray-300 bg-white text-gray-700"}`}>
          {t.reglages.annonceAutoGuides ? "Activée" : "Arrêtée"}
        </button>
      </section>

      {/* Envoyer un message */}
      <section className="rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="mb-4 font-bold text-gray-900">Envoyer un message</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">À qui ?
              <select value={categorie} onChange={(e) => setCategorie(e.target.value)} className={champ + " mt-1"}>
                <option value="">Tous les clients abonnés</option>
                {t.parCategorie.map((c) => (
                  <option key={c.categorie} value={c.categorie}>{c.categorie} ({c.abonnes})</option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium text-gray-700">Titre <span className="text-gray-400">({titre.length}/80)</span>
              <input value={titre} maxLength={80} onChange={(e) => setTitre(e.target.value)} placeholder="Ex. : Nouveau conseil pour réussir votre élevage" className={champ + " mt-1"} />
            </label>
            <label className="block text-sm font-medium text-gray-700">Message <span className="text-gray-400">({message.length}/240)</span>
              <textarea value={message} maxLength={240} rows={3} onChange={(e) => setMessage(e.target.value)} placeholder="Une ou deux phrases qui donnent envie d'ouvrir." className={champ + " mt-1 resize-none"} />
            </label>
            <label className="block text-sm font-medium text-gray-700">Page ouverte au clic
              <input value={lien} onChange={(e) => setLien(e.target.value)} placeholder="/conseils/... ou /ebooks/..." className={champ + " mt-1"} />
            </label>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">Ce que le client verra</p>
            <div className="rounded-2xl bg-gray-100 p-4">
              <div className="flex gap-3 rounded-xl bg-white p-3 shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo-smartlife.jpeg" alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
                <div className="min-w-0">
                  <p className="text-[11px] text-gray-500">Smart Life · maintenant</p>
                  <p className="truncate text-sm font-bold text-gray-900">{titre || "Titre de la notification"}</p>
                  <p className="line-clamp-3 text-xs text-gray-600">{message || "Votre message apparaîtra ici."}</p>
                </div>
              </div>
            </div>
            {compte && (
              <p className="text-sm text-gray-600">
                Le recevront : <strong>{compte.telephones + compte.emails}</strong> client{compte.telephones + compte.emails > 1 ? "s" : ""} ({compte.telephones} sur téléphone, {compte.emails} par e-mail)
                {compte.dejaPrevenus > 0 && <>, et {compte.dejaPrevenus} déjà prévenu{compte.dejaPrevenus > 1 ? "s" : ""} aujourd&apos;hui ne seront pas dérangés</>}.
              </p>
            )}
            <button type="button" onClick={envoyer} disabled={envoiEnCours || !titre.trim() || !message.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 py-3 text-sm font-bold text-white disabled:opacity-40">
              <Send size={15} /> {envoiEnCours ? "Envoi en cours…" : "Envoyer"}
            </button>
            {retour && <p className="rounded-xl bg-green-50 p-3 text-sm text-green-800">{retour}</p>}
          </div>
        </div>
      </section>

      {/* Conseils gratuits */}
      <section className="rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="font-bold text-gray-900">Conseils gratuits à annoncer</h2>
        <p className="mb-4 mt-1 text-sm text-gray-500">Chaque conseil est envoyé aux clients abonnés à la catégorie de son guide.</p>
        {conseilsAFaire.length === 0 ? (
          <p className="text-sm text-gray-500">Tous les conseils ont déjà été annoncés.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {conseilsAFaire.map((c) => (
              <li key={c.slug} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <a href={`/conseils/${c.slug}`} target="_blank" rel="noreferrer" className="text-sm font-medium text-gray-900 hover:underline">{c.titre}</a>
                  <p className="text-xs text-gray-500">{c.categorie ?? "Sans catégorie : envoyé à tous les abonnés"}</p>
                </div>
                <button type="button" onClick={() => annoncerConseil(c.slug, c.titre, c.categorie)}
                  className="shrink-0 rounded-xl bg-[#E8B800] px-4 py-2 text-sm font-bold text-gray-900 hover:bg-[#D4A600]">Annoncer</button>
              </li>
            ))}
          </ul>
        )}
        {conseilsFaits.length > 0 && (
          <details className="mt-3">
            <summary className="cursor-pointer text-sm text-gray-500">Déjà annoncés ({conseilsFaits.length})</summary>
            <ul className="mt-2 space-y-1">
              {conseilsFaits.map((c) => <li key={c.slug} className="text-sm text-gray-500">{c.titre}</li>)}
            </ul>
          </details>
        )}
      </section>

      {/* Abonnés par catégorie */}
      <section className="rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="mb-3 font-bold text-gray-900">Abonnés par catégorie</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-gray-500"><th className="py-2">Catégorie</th><th>Abonnés</th><th>Téléphone</th><th>E-mail</th></tr></thead>
            <tbody>
              {t.parCategorie.map((c) => (
                <tr key={c.categorie} className="border-t border-gray-100">
                  <td className="py-2 pr-3 text-gray-900">{c.categorie}</td><td>{c.abonnes}</td><td>{c.telephones}</td><td>{c.emails}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Historique */}
      <section className="rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="mb-3 font-bold text-gray-900">Derniers envois</h2>
        {t.envois.length === 0 ? <p className="text-sm text-gray-500">Aucun envoi pour l&apos;instant.</p> : (
          <ul className="divide-y divide-gray-100">
            {t.envois.map((e) => (
              <li key={e.id} className="py-3">
                <p className="text-xs text-gray-500">{date(e.ts)} · {ORIGINE[e.origine]} · {e.categorie ?? "Tous les abonnés"}</p>
                <p className="text-sm font-medium text-gray-900">{e.titre}</p>
                <p className="text-xs text-gray-600">{bilan(e)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
