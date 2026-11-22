// Smart CRM — pont vers le Supabase partagé de tous les Smart (Smart Book, Smart Voice, etc.)
// Enregistre les contacts dans le CRM et dans les contacts Google du téléphone.

const SUPABASE_URL = (
  process.env.SMART_SUPABASE_URL || "https://rzaepmvnkzmrhgdesssv.supabase.co"
).replace(/\/$/, "");
const SUPABASE_KEY = process.env.SMART_SUPABASE_SERVICE_KEY || "";

async function rpc(
  nom: string,
  corps: Record<string, unknown>
): Promise<unknown> {
  if (!SUPABASE_KEY) {
    console.warn(`Smart CRM : clé Supabase absente, appel ${nom} ignoré`);
    return null;
  }
  const headers: Record<string, string> = {
    apikey: SUPABASE_KEY,
    "Content-Type": "application/json",
    Prefer: "return=minimal",
  };
  if (!SUPABASE_KEY.startsWith("sb_secret_")) {
    headers.Authorization = `Bearer ${SUPABASE_KEY}`;
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${nom}`, {
    method: "POST",
    headers,
    body: JSON.stringify(corps),
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    const texte = await res.text().catch(() => "");
    console.error(`Smart CRM ${nom} ${res.status}: ${texte.slice(0, 200)}`);
    return null;
  }
  const texte = await res.text();
  return texte ? JSON.parse(texte) : null;
}

// ─── CRM : fiche contact + tâches de relance ─────────────────────────────────

type StatutCRM = "prospect" | "client" | "abonne";

export async function crmEnregistrer(opts: {
  email: string;
  nom?: string | null;
  telephone?: string | null;
  statut: StatutCRM;
  source: string;
  depuis?: string;
  fin?: string | null;
}): Promise<void> {
  await rpc("crm_enregistrer", {
    p_email: opts.email,
    p_nom: opts.nom ?? null,
    p_telephone: opts.telephone ?? null,
    p_statut: opts.statut,
    p_source: opts.source,
    p_depuis: opts.depuis ?? new Date().toISOString(),
    p_fin: opts.fin ?? null,
  }).catch((e) => console.error("Smart CRM crm_enregistrer :", e));
}

// ─── Contacts Google du téléphone ─────────────────────────────────────────────

export async function contactGoogleNoter(opts: {
  email: string;
  nom?: string | null;
  telephone?: string | null;
  etat: string;
  date?: string;
}): Promise<void> {
  await rpc("contact_google_noter", {
    p_email: opts.email,
    p_nom: opts.nom ?? null,
    p_telephone: opts.telephone ?? null,
    p_smart: "Smart Life",
    p_etat: (opts.etat || "").slice(0, 120),
    p_date: opts.date ?? new Date().toISOString(),
  }).catch((e) => console.error("Smart CRM contact_google_noter :", e));
}

// ─── Raccourcis pour les événements de Smart Life ─────────────────────────────

export async function enregistrerAchat(opts: {
  email: string;
  nom?: string | null;
  telephone?: string | null;
  produits: string;
  montant?: number;
}): Promise<void> {
  const detail = opts.montant
    ? `${opts.produits} — ${opts.montant.toLocaleString("fr-FR")} FCFA`
    : opts.produits;

  await Promise.all([
    crmEnregistrer({
      email: opts.email,
      nom: opts.nom,
      telephone: opts.telephone,
      statut: "client",
      source: "Smart Life",
    }),
    contactGoogleNoter({
      email: opts.email,
      nom: opts.nom,
      telephone: opts.telephone,
      etat: detail,
    }),
  ]);
  console.log(`📇 Smart CRM — achat enregistré : ${opts.email} → ${detail}`);
}

export async function enregistrerAccompagnement(opts: {
  email: string;
  nom?: string | null;
  telephone?: string | null;
  espaceTitre: string;
}): Promise<void> {
  await Promise.all([
    crmEnregistrer({
      email: opts.email,
      nom: opts.nom,
      telephone: opts.telephone,
      statut: "prospect",
      source: "Smart Life Accompagnement",
    }),
    contactGoogleNoter({
      email: opts.email,
      nom: opts.nom,
      telephone: opts.telephone,
      etat: `Accompagnement : ${opts.espaceTitre}`,
    }),
  ]);
  console.log(
    `📇 Smart CRM — accompagnement : ${opts.email} → ${opts.espaceTitre}`
  );
}

export async function enregistrerCandidature(opts: {
  email: string;
  nom?: string | null;
  telephone?: string | null;
  domaines?: string;
}): Promise<void> {
  const detail = opts.domaines
    ? `Candidature consultant : ${opts.domaines}`
    : "Candidature consultant";

  await Promise.all([
    crmEnregistrer({
      email: opts.email,
      nom: opts.nom,
      telephone: opts.telephone,
      statut: "prospect",
      source: "Smart Life Consultant",
    }),
    contactGoogleNoter({
      email: opts.email,
      nom: opts.nom,
      telephone: opts.telephone,
      etat: detail,
    }),
  ]);
  console.log(`📇 Smart CRM — candidature : ${opts.email} → ${detail}`);
}

export async function enregistrerEchec(opts: {
  email: string;
  nom?: string | null;
  telephone?: string | null;
  produits: string;
}): Promise<void> {
  await crmEnregistrer({
    email: opts.email,
    nom: opts.nom,
    telephone: opts.telephone,
    statut: "prospect",
    source: "Smart Life",
  });
  console.log(
    `📇 Smart CRM — échec paiement : ${opts.email} → ${opts.produits}`
  );
}
