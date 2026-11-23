"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, Check } from "lucide-react";

const CLE_JETON = "sl_nouveautes_jeton";

type Etat = "chargement" | "proposer" | "envoi" | "abonne" | "arrete";

function lireJeton(): string {
  try { return localStorage.getItem(CLE_JETON) || ""; } catch { return ""; }
}
function garderJeton(j: string) {
  try { localStorage.setItem(CLE_JETON, j); } catch { /* navigation privée */ }
}

function cleEnOctets(base64: string) {
  const pad = "=".repeat((4 - (base64.length % 4)) % 4);
  const b = atob((base64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(b.length);
  for (let i = 0; i < b.length; i++) out[i] = b.charCodeAt(i);
  return out;
}

function telephoneCompatible() {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

function estIphone() {
  return typeof navigator !== "undefined" && /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

async function abonnementTelephone(cle: string): Promise<PushSubscriptionJSON | null> {
  if (!telephoneCompatible() || Notification.permission === "denied") return null;
  try {
    let reg = await navigator.serviceWorker.getRegistration("/");
    if (!reg) reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    const pret = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise<null>((r) => setTimeout(() => r(null), 8000)),
    ]);
    if (!pret) return null;
    const permission = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
    if (permission !== "granted") return null;
    const existant = await pret.pushManager.getSubscription();
    const sub = existant ?? await pret.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: cleEnOctets(cle) });
    return sub.toJSON();
  } catch {
    return null;
  }
}

/**
 * Propose au client de recevoir les nouveautés (guides, conseils) des catégories qu'il a achetées :
 * en notification sur son téléphone, sinon par e-mail.
 */
export default function NouveautesAbonnement({
  produits,
  email,
  prenom,
  variante = "achat",
}: {
  produits: string[];
  email?: string;
  prenom?: string;
  variante?: "achat" | "espace";
}) {
  const [etat, setEtat] = useState<Etat>("chargement");
  const [categories, setCategories] = useState<string[]>([]);
  const [cle, setCle] = useState("");
  const [parTelephone, setParTelephone] = useState(false);
  const [refusTelephone, setRefusTelephone] = useState(false);
  const cleProduits = produits.join(",");

  useEffect(() => {
    let fini = false;
    (async () => {
      try {
        const r = await fetch(`/api/notifications?produits=${encodeURIComponent(cleProduits)}`, { cache: "no-store" });
        const d = (await r.json()) as { cle: string; categories: string[] };
        if (fini) return;
        setCle(d.cle);
        setCategories(d.categories ?? []);
        const jeton = lireJeton();
        if (!jeton) { setEtat("proposer"); return; }
        const e = await fetch("/api/notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "etat", jeton }),
        }).then((x) => x.json()) as { actif: boolean; categories: string[]; telephone: boolean };
        if (fini) return;
        if (!e.actif) { setEtat("proposer"); return; }
        setParTelephone(e.telephone);
        // Nouvel achat dans une autre catégorie : on l'ajoute discrètement à l'abonnement
        const manquantes = (d.categories ?? []).filter((c) => !e.categories.includes(c));
        if (manquantes.length && cleProduits) {
          const a = await fetch("/api/notifications", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "abonner", jeton, email, prenom, produits: cleProduits.split(",") }),
          }).then((x) => x.json()) as { categories: string[] };
          if (!fini) setCategories(a.categories ?? e.categories);
        } else {
          setCategories(e.categories.length ? e.categories : d.categories ?? []);
        }
        setEtat("abonne");
      } catch {
        if (!fini) setEtat("proposer");
      }
    })();
    return () => { fini = true; };
  }, [cleProduits, email, prenom]);

  async function accepter() {
    setEtat("envoi");
    const appareil = cle ? await abonnementTelephone(cle) : null;
    setRefusTelephone(!appareil && telephoneCompatible() && Notification.permission === "denied");
    try {
      const r = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "abonner", jeton: lireJeton() || undefined, email, prenom, produits, appareil }),
      });
      const d = (await r.json()) as { jeton?: string; categories?: string[] };
      if (!d.jeton) throw new Error();
      garderJeton(d.jeton);
      if (d.categories?.length) setCategories(d.categories);
      setParTelephone(!!appareil);
      setEtat("abonne");
    } catch {
      setEtat("proposer");
    }
  }

  async function arreter() {
    const jeton = lireJeton();
    setEtat("envoi");
    try {
      if (jeton) {
        await fetch("/api/notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "arreter", jeton }),
        });
      }
      if (telephoneCompatible()) {
        const reg = await navigator.serviceWorker.getRegistration("/");
        const sub = await reg?.pushManager.getSubscription();
        await sub?.unsubscribe();
      }
    } catch { /* on affiche quand même l'arrêt */ }
    setEtat("arrete");
  }

  if (etat === "chargement") return null;
  // Rien acheté et pas encore abonné : rien à proposer
  if ((etat === "proposer" || etat === "arrete") && categories.length === 0) return null;

  const listeCategories = categories.length === 1
    ? <strong className="text-[var(--g-encre)]">{categories[0]}</strong>
    : <>vos catégories : <strong className="text-[var(--g-encre)]">{categories.join(", ")}</strong></>;

  const cadre = variante === "achat"
    ? "mb-6 rounded-[16px] border border-[var(--g-ligne)] bg-white p-5"
    : "rounded-[16px] border border-[var(--g-ligne)] bg-white p-5";

  if (etat === "abonne") {
    return (
      <div className={cadre}>
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--g-vert-doux)]">
            <Check size={18} className="text-[var(--g-vert)]" />
          </span>
          <div className="min-w-0">
            <p className="text-[15px] font-semibold text-[var(--g-encre)]">Vous recevrez les nouveautés</p>
            <p className="mt-1 text-[13px] text-[var(--g-gris)]">
              Nouveaux guides et conseils gratuits dans {listeCategories}
              {parTelephone ? ", directement sur ce téléphone." : email ? `, par e-mail (${email}).` : "."}
            </p>
            {!parTelephone && estIphone() && (
              <p className="mt-2 text-[12px] text-[var(--g-gris)]">
                Sur iPhone : ajoutez Smart Life à votre écran d&apos;accueil (bouton Partager, puis « Sur l&apos;écran d&apos;accueil ») pour les recevoir aussi en notification.
              </p>
            )}
            {refusTelephone && (
              <p className="mt-2 text-[12px] text-[var(--g-gris)]">
                Les notifications sont bloquées sur ce téléphone : vous les recevrez par e-mail.
              </p>
            )}
            <button type="button" onClick={arreter}
              className="mt-3 text-[12px] text-[var(--g-gris)] underline underline-offset-2 hover:text-[var(--g-encre)]">
              Ne plus recevoir
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (etat === "arrete") {
    return (
      <div className={cadre}>
        <div className="flex items-start gap-3">
          <BellOff size={18} className="mt-0.5 shrink-0 text-[var(--g-gris)]" />
          <div>
            <p className="text-[14px] text-[var(--g-encre)]">Vous ne recevrez plus les nouveautés.</p>
            <button type="button" onClick={accepter}
              className="mt-2 text-[12px] font-semibold text-[var(--g-vert)] underline underline-offset-2">
              Les recevoir à nouveau
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cadre}>
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--g-jaune-doux)]">
          <Bell size={18} className="text-[var(--g-encre)]" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold text-[var(--g-encre)]">
            Recevoir les nouveautés{categories.length === 1 ? <> sur <span className="whitespace-normal">{categories[0]}</span></> : ""} ?
          </p>
          <p className="mt-1 text-[13px] text-[var(--g-gris)]">
            Soyez prévenu(e) dès qu&apos;un nouveau guide ou un nouveau conseil gratuit sort dans {listeCategories}. Une notification au plus par jour, et vous arrêtez quand vous voulez.
          </p>
          <button type="button" onClick={accepter} disabled={etat === "envoi"}
            className="g-btn mt-4 w-full disabled:opacity-60">
            {etat === "envoi" ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-black/30 border-t-black" />
            ) : (
              <><Bell size={16} /> Oui, me prévenir</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
