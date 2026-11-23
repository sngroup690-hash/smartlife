import { NextRequest, NextResponse } from "next/server";
import { isValidAdminPassword } from "@/lib/admin-auth";
import { tousLesConseils, guideLie } from "@/lib/conseils";
import {
  changerReglages,
  compterDestinataires,
  envoyerNouveaute,
  lireDonnees,
  lireGuides,
  marquerConseilAnnonce,
  ECART_MINIMUM_HEURES,
} from "@/lib/notifications-nouveautes";

export const dynamic = "force-dynamic";

function refuse() {
  return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
}

/** Tableau de bord : abonnés par catégorie, conseils à annoncer, derniers envois. */
export async function GET(req: NextRequest) {
  if (!isValidAdminPassword(req.headers.get("x-admin-password"))) return refuse();

  const d = await lireDonnees();
  const { guides } = await lireGuides();
  const categories = [...new Set(guides.map((g) => g.category).filter((c): c is string => !!c))].sort();

  const actifs = d.abonnes.filter((a) => a.actif);
  const parCategorie = categories.map((c) => {
    const ab = actifs.filter((a) => a.categories.includes(c));
    return {
      categorie: c,
      abonnes: ab.length,
      telephones: ab.filter((a) => a.appareils.length > 0).length,
      emails: ab.filter((a) => a.appareils.length === 0 && a.email).length,
    };
  });

  const conseils = await tousLesConseils();
  const listeConseils = await Promise.all(conseils.map(async (c) => {
    const g = await guideLie(c.guideId);
    return {
      slug: c.slug,
      titre: c.titre,
      description: c.description,
      categorie: g?.category ?? null,
      annonce: d.conseilsAnnonces.includes(c.slug),
    };
  }));

  return NextResponse.json({
    total: {
      abonnes: actifs.length,
      telephones: actifs.filter((a) => a.appareils.length > 0).length,
      emails: actifs.filter((a) => a.appareils.length === 0 && a.email).length,
      arretes: d.abonnes.length - actifs.length,
    },
    parCategorie,
    categories,
    conseils: listeConseils,
    envois: d.envois.slice(0, 50),
    reglages: d.reglages,
    ecartHeures: ECART_MINIMUM_HEURES,
  });
}

/**
 * action "compter"  : { categorie }                              → combien le recevraient
 * action "envoyer"  : { titre, message, lien, categorie }        → envoi manuel
 * action "conseil"  : { slug }                                   → annonce d'un conseil gratuit
 * action "reglages" : { annonceAutoGuides }
 */
export async function POST(req: NextRequest) {
  if (!isValidAdminPassword(req.headers.get("x-admin-password"))) return refuse();
  const corps = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!corps) return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
  const categorie = typeof corps.categorie === "string" && corps.categorie ? corps.categorie : null;

  if (corps.action === "compter") {
    return NextResponse.json(await compterDestinataires(categorie));
  }

  if (corps.action === "envoyer") {
    const titre = typeof corps.titre === "string" ? corps.titre.trim() : "";
    const message = typeof corps.message === "string" ? corps.message.trim() : "";
    const lien = typeof corps.lien === "string" ? corps.lien.trim() : "/";
    if (!titre || !message) return NextResponse.json({ error: "Écrivez un titre et un message." }, { status: 400 });
    if (lien && !lien.startsWith("/") && !lien.startsWith("https://smartlifecm.com"))
      return NextResponse.json({ error: "Le lien doit mener vers une page de Smart Life (il commence par /)." }, { status: 400 });
    const envoi = await envoyerNouveaute({ titre, message, lien: lien || "/", categorie, origine: "manuel" });
    return NextResponse.json({ envoi });
  }

  if (corps.action === "conseil") {
    const slug = typeof corps.slug === "string" ? corps.slug : "";
    const c = (await tousLesConseils()).find((x) => x.slug === slug);
    if (!c) return NextResponse.json({ error: "Conseil introuvable" }, { status: 404 });
    const g = await guideLie(c.guideId);
    const envoi = await envoyerNouveaute({
      titre: `Nouveau conseil gratuit : ${c.titre}`.slice(0, 80),
      message: (c.description || "Un nouveau conseil gratuit vient de sortir sur Smart Life.").slice(0, 240),
      lien: `/conseils/${c.slug}`,
      categorie: g?.category ?? null,
      origine: "conseil",
    });
    await marquerConseilAnnonce(c.slug);
    return NextResponse.json({ envoi });
  }

  if (corps.action === "reglages") {
    const reglages = await changerReglages({ annonceAutoGuides: corps.annonceAutoGuides !== false });
    return NextResponse.json({ reglages });
  }

  return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
}
