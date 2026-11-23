/**
 * Nouveautés envoyées aux clients après leur achat.
 *
 * Le client accepte sur la page de remerciement (ou dans Mon espace) de recevoir les nouveautés
 * des catégories qu'il a achetées. Il les reçoit :
 *  - en notification sur son téléphone (gratuit : envoyée par notre serveur, sans service payant) ;
 *  - sinon par e-mail (iPhone sans le site sur l'écran d'accueil, notifications refusées…).
 *
 * Tout est rangé dans private/notifications.json (jamais envoyé sur GitHub).
 * Les clés d'envoi sont créées toutes seules au premier usage dans private/notifications-cles.json,
 * sauf si VAPID_PUBLIC_KEY et VAPID_PRIVATE_KEY sont donnés dans l'environnement.
 */
import { readFile, writeFile, mkdir, rename } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";
import * as webpush from "web-push";
import { FORMATIONS } from "@/lib/formations-data";
import { queryAllSales } from "@/lib/analytics";

const PRIVE = path.join(process.cwd(), "private");
const FICHIER = path.join(PRIVE, "notifications.json");
const FICHIER_CLES = path.join(PRIVE, "notifications-cles.json");
const FICHIER_GUIDES = path.join(PRIVE, "ebooks-data.json");

export const SITE = (process.env.NEXT_PUBLIC_APP_URL || "https://smartlifecm.com").replace(/\/$/, "");
/** Un client ne reçoit pas plus d'une nouveauté sur cette durée. */
export const ECART_MINIMUM_HEURES = 20;

export type Appareil = { endpoint: string; keys: { p256dh: string; auth: string }; ajouteLe: string };

export type Abonne = {
  /** Secret du client : sert au lien « Ne plus recevoir » et à Mon espace. */
  jeton: string;
  email?: string;
  prenom?: string;
  categories: string[];
  appareils: Appareil[];
  actif: boolean;
  creeLe: string;
  dernierEnvoi?: string;
  desabonneLe?: string;
};

export type Envoi = {
  id: string;
  ts: string;
  titre: string;
  message: string;
  lien: string;
  categorie: string | null;
  origine: "manuel" | "guide" | "conseil";
  telephones: number;
  emails: number;
  dejaPrevenus: number;
  echecs: number;
};

export type Donnees = {
  abonnes: Abonne[];
  envois: Envoi[];
  /** Guides déjà vus (pour n'annoncer que les nouveaux). Absent = premier passage. */
  guidesConnus?: string[];
  conseilsAnnonces: string[];
  reglages: { annonceAutoGuides: boolean };
};

const VIDE: Donnees = { abonnes: [], envois: [], conseilsAnnonces: [], reglages: { annonceAutoGuides: true } };

// ─── Lecture / écriture (une seule écriture à la fois) ──────────────────────────

async function lire(): Promise<Donnees> {
  try {
    const d = JSON.parse(await readFile(FICHIER, "utf-8")) as Partial<Donnees>;
    return {
      abonnes: d.abonnes ?? [],
      envois: d.envois ?? [],
      guidesConnus: d.guidesConnus,
      conseilsAnnonces: d.conseilsAnnonces ?? [],
      reglages: { ...VIDE.reglages, ...(d.reglages ?? {}) },
    };
  } catch {
    return structuredClone(VIDE);
  }
}

async function ecrire(d: Donnees) {
  await mkdir(PRIVE, { recursive: true });
  const tmp = FICHIER + ".tmp";
  await writeFile(tmp, JSON.stringify(d, null, 2), "utf-8");
  await rename(tmp, FICHIER);
}

let file: Promise<unknown> = Promise.resolve();
/** Lit, modifie et enregistre, en attendant la fin de la modification précédente. */
function modifier<T>(fn: (d: Donnees) => T | Promise<T>): Promise<T> {
  const suite = file.then(async () => {
    const d = await lire();
    const r = await fn(d);
    await ecrire(d);
    return r;
  });
  file = suite.catch(() => {});
  return suite;
}

export async function lireDonnees(): Promise<Donnees> {
  await file.catch(() => {});
  return lire();
}

// ─── Clés d'envoi ────────────────────────────────────────────────────────────────

let clesPretes: { publique: string; privee: string } | null = null;

export async function clesEnvoi(): Promise<{ publique: string; privee: string }> {
  if (clesPretes) return clesPretes;
  let cles: { publique: string; privee: string } | null = null;
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    cles = { publique: process.env.VAPID_PUBLIC_KEY, privee: process.env.VAPID_PRIVATE_KEY };
  } else {
    try {
      cles = JSON.parse(await readFile(FICHIER_CLES, "utf-8"));
    } catch {
      const k = webpush.generateVAPIDKeys();
      cles = { publique: k.publicKey, privee: k.privateKey };
      await mkdir(PRIVE, { recursive: true });
      await writeFile(FICHIER_CLES, JSON.stringify(cles, null, 2), "utf-8");
    }
  }
  webpush.setVapidDetails(SITE.startsWith("https://") ? SITE : "https://smartlifecm.com", cles!.publique, cles!.privee);
  clesPretes = cles!;
  return clesPretes;
}

// ─── Catégories des produits ─────────────────────────────────────────────────────

type Guide = { id: string; slug: string; title: string; category?: string; cover?: string };

export async function lireGuides(): Promise<{ guides: Guide[]; actif: Record<string, boolean> }> {
  try {
    const d = JSON.parse(await readFile(FICHIER_GUIDES, "utf-8"));
    return { guides: (d.ebooks ?? []) as Guide[], actif: (d.actif ?? {}) as Record<string, boolean> };
  } catch {
    return { guides: [], actif: {} };
  }
}

export async function categoriesDesProduits(ids: string[]): Promise<string[]> {
  const { guides } = await lireGuides();
  const cats = new Set<string>();
  for (const id of ids) {
    const g = guides.find((x) => x.id === id);
    if (g?.category) cats.add(g.category);
    const f = FORMATIONS.find((x) => x.id === id);
    if (f?.categorie) cats.add(f.categorie);
  }
  return [...cats];
}

// ─── Abonnement / désabonnement ──────────────────────────────────────────────────

function nouveauJeton() {
  return randomBytes(18).toString("base64url");
}

function appareilValide(a: unknown): a is Omit<Appareil, "ajouteLe"> {
  const x = a as Appareil | undefined;
  return !!x && typeof x.endpoint === "string" && x.endpoint.startsWith("https://") && x.endpoint.length < 1000
    && typeof x.keys?.p256dh === "string" && typeof x.keys?.auth === "string"
    && x.keys.p256dh.length < 200 && x.keys.auth.length < 100;
}

export async function abonner(opts: {
  jeton?: string;
  email?: string;
  prenom?: string;
  produits: string[];
  appareil?: unknown;
}): Promise<{ jeton: string; categories: string[] }> {
  const categories = await categoriesDesProduits(opts.produits.slice(0, 50));
  const email = opts.email?.trim().toLowerCase().slice(0, 200) || undefined;
  const appareil = appareilValide(opts.appareil)
    ? { endpoint: opts.appareil.endpoint, keys: { p256dh: opts.appareil.keys.p256dh, auth: opts.appareil.keys.auth }, ajouteLe: new Date().toISOString() }
    : null;

  return modifier((d) => {
    let a = opts.jeton ? d.abonnes.find((x) => x.jeton === opts.jeton) : undefined;
    // Pas de rapprochement par e-mail : sinon n'importe qui pourrait récupérer l'abonnement d'un autre.
    if (!a && appareil) a = d.abonnes.find((x) => x.appareils.some((p) => p.endpoint === appareil.endpoint));
    if (!a) {
      a = { jeton: nouveauJeton(), categories: [], appareils: [], actif: true, creeLe: new Date().toISOString() };
      d.abonnes.push(a);
    }
    a.actif = true;
    delete a.desabonneLe;
    if (email) a.email = email;
    if (opts.prenom) a.prenom = opts.prenom.slice(0, 60);
    a.categories = [...new Set([...a.categories, ...categories])];
    if (appareil) {
      // Le même téléphone ne doit appartenir qu'à un seul client
      for (const autre of d.abonnes) if (autre !== a) autre.appareils = autre.appareils.filter((p) => p.endpoint !== appareil.endpoint);
      a.appareils = [...a.appareils.filter((p) => p.endpoint !== appareil.endpoint), appareil].slice(-5);
    }
    return { jeton: a.jeton, categories: a.categories };
  });
}

export async function desabonner(jeton: string): Promise<boolean> {
  return modifier((d) => {
    const a = d.abonnes.find((x) => x.jeton === jeton);
    if (!a) return false;
    const maintenant = new Date().toISOString();
    // « Ne plus recevoir » vaut pour toutes les inscriptions de la même adresse e-mail (autres téléphones…)
    for (const x of d.abonnes) {
      if (x === a || (a.email && x.email === a.email)) {
        x.actif = false;
        x.desabonneLe = maintenant;
      }
    }
    return true;
  });
}

export async function etatAbonne(jeton: string): Promise<{ actif: boolean; categories: string[]; telephone: boolean } | null> {
  const d = await lireDonnees();
  const a = d.abonnes.find((x) => x.jeton === jeton);
  return a ? { actif: a.actif, categories: a.categories, telephone: a.appareils.length > 0 } : null;
}

// ─── Envoi ───────────────────────────────────────────────────────────────────────

function echapper(t: string) {
  return t.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

function lienComplet(lien: string) {
  if (/^https?:\/\//.test(lien)) return lien;
  return SITE + (lien.startsWith("/") ? lien : "/" + lien);
}

async function envoyerEmail(to: string, prenom: string | undefined, titre: string, message: string, lien: string, jeton: string) {
  const cle = process.env.RESEND_API_KEY;
  if (!cle) {
    console.log(`[nouveautés] e-mail simulé (pas de clé Resend) → ${to} : ${titre}`);
    return;
  }
  const arret = `${SITE}/notifications/arreter?j=${encodeURIComponent(jeton)}`;
  const html = `
  <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#ffffff;color:#111111;padding:32px;border:1px solid #e5e5e5;border-radius:16px">
    <p style="margin:0 0 4px;font-size:13px;font-weight:bold;color:#1f7a3a">SMART LIFE · Nouveauté pour vous</p>
    <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:#111111">${echapper(titre)}</h1>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#333333">${prenom ? `Bonjour ${echapper(prenom)},<br>` : ""}${echapper(message)}</p>
    <a href="${lienComplet(lien)}" style="display:inline-block;background:#E8B800;color:#111111;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:10px">Voir sur Smart Life</a>
    <p style="margin:28px 0 0;font-size:12px;color:#777777;border-top:1px solid #eeeeee;padding-top:16px">
      Vous recevez ce message parce que vous avez demandé les nouveautés liées à votre achat.
      <a href="${arret}" style="color:#777777">Ne plus recevoir ces nouveautés</a>
    </p>
  </div>`;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${cle}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? "noreply@smartlifecm.com",
      to: [to],
      subject: titre,
      html,
      headers: { "List-Unsubscribe": `<${arret}>` },
    }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}`);
}

/** Compte les clients qui recevraient ce message (sans rien envoyer). */
export async function compterDestinataires(categorie: string | null) {
  const d = await lireDonnees();
  const limite = Date.now() - ECART_MINIMUM_HEURES * 3600_000;
  let telephones = 0, emails = 0, dejaPrevenus = 0;
  for (const a of d.abonnes) {
    if (!a.actif) continue;
    if (categorie && !a.categories.includes(categorie)) continue;
    if (a.dernierEnvoi && new Date(a.dernierEnvoi).getTime() > limite) { dejaPrevenus++; continue; }
    if (a.appareils.length > 0) telephones++;
    else if (a.email) emails++;
  }
  return { telephones, emails, dejaPrevenus };
}

export async function envoyerNouveaute(opts: {
  titre: string;
  message: string;
  lien: string;
  categorie: string | null;
  origine: Envoi["origine"];
}): Promise<Envoi> {
  await clesEnvoi();
  const titre = opts.titre.trim().slice(0, 80);
  const message = opts.message.trim().slice(0, 240);
  const lien = opts.lien.trim() || "/";

  // Les e-mails ne partent qu'aux vrais acheteurs (personne ne peut inscrire l'adresse d'un autre).
  let acheteurs = new Set<string>();
  try {
    acheteurs = new Set((await queryAllSales()).map((s) => (s.customerEmail || "").trim().toLowerCase()).filter(Boolean));
  } catch { /* pas de ventes lisibles : pas d'e-mail */ }

  const d = await lireDonnees();
  const limite = Date.now() - ECART_MINIMUM_HEURES * 3600_000;
  const cibles = d.abonnes.filter((a) => a.actif && (!opts.categorie || a.categories.includes(opts.categorie)));

  let telephones = 0, emails = 0, dejaPrevenus = 0, echecs = 0;
  const prevenus = new Set<string>();
  const emailsEnvoyes = new Set<string>();
  const appareilsMorts = new Set<string>();

  for (const a of cibles) {
    if (a.dernierEnvoi && new Date(a.dernierEnvoi).getTime() > limite) { dejaPrevenus++; continue; }
    let recuSurTelephone = false;
    for (const p of a.appareils) {
      try {
        await webpush.sendNotification(
          { endpoint: p.endpoint, keys: p.keys },
          JSON.stringify({ titre, message, lien, jeton: a.jeton }),
          { TTL: 3 * 24 * 3600, urgency: "normal", timeout: 15_000 },
        );
        recuSurTelephone = true;
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) appareilsMorts.add(p.endpoint); // abonnement retiré par le téléphone
        else console.warn(`[nouveautés] échec d'envoi au téléphone (${code ?? "réseau"})`);
      }
    }
    if (recuSurTelephone) { telephones++; prevenus.add(a.jeton); continue; }
    if (a.email && acheteurs.has(a.email)) {
      if (emailsEnvoyes.has(a.email)) { prevenus.add(a.jeton); continue; } // même client inscrit deux fois
      emailsEnvoyes.add(a.email);
      try {
        await envoyerEmail(a.email, a.prenom, titre, message, lien, a.jeton);
        emails++;
        prevenus.add(a.jeton);
      } catch (e) {
        echecs++;
        console.warn("[nouveautés] échec d'e-mail", (e as Error).message);
      }
    } else if (a.appareils.length > 0) {
      echecs++;
    }
  }

  const envoi: Envoi = {
    id: `env-${Date.now().toString(36)}${randomBytes(3).toString("hex")}`,
    ts: new Date().toISOString(),
    titre, message, lien,
    categorie: opts.categorie,
    origine: opts.origine,
    telephones, emails, dejaPrevenus, echecs,
  };

  await modifier((dd) => {
    const maintenant = new Date().toISOString();
    for (const a of dd.abonnes) {
      if (prevenus.has(a.jeton)) a.dernierEnvoi = maintenant;
      if (appareilsMorts.size) a.appareils = a.appareils.filter((p) => !appareilsMorts.has(p.endpoint));
    }
    dd.envois = [envoi, ...dd.envois].slice(0, 300);
  });
  return envoi;
}

// ─── Annonces automatiques ───────────────────────────────────────────────────────

/**
 * À appeler après chaque enregistrement du catalogue : annonce les guides visibles
 * qui n'avaient encore jamais été vus. Au tout premier passage, on retient seulement
 * les guides existants, sans rien envoyer.
 */
export async function annoncerNouveauxGuides(): Promise<Envoi[]> {
  const { guides, actif } = await lireGuides();
  // Un guide n'est annoncé que s'il est visible et complet (titre, adresse, couverture, catégorie).
  const visibles = guides.filter((g) => g.id && actif[g.id] !== false && g.title && g.slug && g.cover && g.category);

  const nouveaux = await modifier((d) => {
    if (!d.guidesConnus) {
      d.guidesConnus = visibles.map((g) => g.id);
      return [] as Guide[];
    }
    const connus = new Set(d.guidesConnus);
    const neufs = visibles.filter((g) => !connus.has(g.id));
    d.guidesConnus = [...connus, ...neufs.map((g) => g.id)];
    return d.reglages.annonceAutoGuides ? neufs : [];
  });

  const faits: Envoi[] = [];
  for (const g of nouveaux) {
    if (!g.category) continue;
    faits.push(await envoyerNouveaute({
      titre: `Nouveau guide : ${g.title}`.slice(0, 80),
      message: `Il vient de sortir dans la catégorie « ${g.category} ». Découvrez-le sur Smart Life.`,
      lien: `/ebooks/${g.slug}`,
      categorie: g.category,
      origine: "guide",
    }));
  }
  return faits;
}

export async function marquerConseilAnnonce(slug: string) {
  await modifier((d) => {
    if (!d.conseilsAnnonces.includes(slug)) d.conseilsAnnonces.push(slug);
  });
}

export async function changerReglages(r: Partial<Donnees["reglages"]>) {
  return modifier((d) => {
    d.reglages = { ...d.reglages, ...r };
    return d.reglages;
  });
}
