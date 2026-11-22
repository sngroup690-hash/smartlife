// Résolution pays/ville à partir de l'indicatif téléphonique.
// Utilisé comme fallback quand GeoIP retourne "Inconnu" ou "Local".
// Triés par longueur décroissante pour un matching greedy correct.

type PhoneGeoEntry = { prefix: string; country: string; countryCode: string; city: string };

const ENTRIES: PhoneGeoEntry[] = [
  // ── Afrique Centrale ──────────────────────────────────────────────────────
  { prefix: "+237", country: "Cameroun",            countryCode: "CM", city: "Douala" },
  { prefix: "+241", country: "Gabon",               countryCode: "GA", city: "Libreville" },
  { prefix: "+242", country: "Congo",               countryCode: "CG", city: "Brazzaville" },
  { prefix: "+243", country: "RD Congo",            countryCode: "CD", city: "Kinshasa" },
  { prefix: "+236", country: "Centrafrique",        countryCode: "CF", city: "Bangui" },
  { prefix: "+235", country: "Tchad",               countryCode: "TD", city: "N'Djamena" },
  { prefix: "+240", country: "Guinée Équatoriale",  countryCode: "GQ", city: "Malabo" },
  { prefix: "+239", country: "São Tomé",            countryCode: "ST", city: "São Tomé" },

  // ── Afrique de l'Ouest ────────────────────────────────────────────────────
  { prefix: "+225", country: "Côte d'Ivoire",       countryCode: "CI", city: "Abidjan" },
  { prefix: "+221", country: "Sénégal",             countryCode: "SN", city: "Dakar" },
  { prefix: "+224", country: "Guinée",              countryCode: "GN", city: "Conakry" },
  { prefix: "+245", country: "Guinée-Bissau",       countryCode: "GW", city: "Bissau" },
  { prefix: "+238", country: "Cap-Vert",            countryCode: "CV", city: "Praia" },
  { prefix: "+232", country: "Sierra Leone",        countryCode: "SL", city: "Freetown" },
  { prefix: "+231", country: "Libéria",             countryCode: "LR", city: "Monrovia" },
  { prefix: "+226", country: "Burkina Faso",        countryCode: "BF", city: "Ouagadougou" },
  { prefix: "+227", country: "Niger",               countryCode: "NE", city: "Niamey" },
  { prefix: "+228", country: "Togo",                countryCode: "TG", city: "Lomé" },
  { prefix: "+229", country: "Bénin",               countryCode: "BJ", city: "Cotonou" },
  { prefix: "+233", country: "Ghana",               countryCode: "GH", city: "Accra" },
  { prefix: "+234", country: "Nigeria",             countryCode: "NG", city: "Lagos" },
  { prefix: "+220", country: "Gambie",              countryCode: "GM", city: "Banjul" },
  { prefix: "+222", country: "Mauritanie",          countryCode: "MR", city: "Nouakchott" },
  { prefix: "+223", country: "Mali",                countryCode: "ML", city: "Bamako" },

  // ── Afrique du Nord ───────────────────────────────────────────────────────
  { prefix: "+212", country: "Maroc",               countryCode: "MA", city: "Casablanca" },
  { prefix: "+213", country: "Algérie",             countryCode: "DZ", city: "Alger" },
  { prefix: "+216", country: "Tunisie",             countryCode: "TN", city: "Tunis" },
  { prefix: "+218", country: "Libye",               countryCode: "LY", city: "Tripoli" },
  { prefix: "+249", country: "Soudan",              countryCode: "SD", city: "Khartoum" },
  { prefix: "+20",  country: "Égypte",              countryCode: "EG", city: "Le Caire" },

  // ── Afrique de l'Est ──────────────────────────────────────────────────────
  { prefix: "+251", country: "Éthiopie",            countryCode: "ET", city: "Addis-Abeba" },
  { prefix: "+252", country: "Somalie",             countryCode: "SO", city: "Mogadiscio" },
  { prefix: "+253", country: "Djibouti",            countryCode: "DJ", city: "Djibouti" },
  { prefix: "+254", country: "Kenya",               countryCode: "KE", city: "Nairobi" },
  { prefix: "+255", country: "Tanzanie",            countryCode: "TZ", city: "Dar es Salaam" },
  { prefix: "+256", country: "Ouganda",             countryCode: "UG", city: "Kampala" },
  { prefix: "+257", country: "Burundi",             countryCode: "BI", city: "Bujumbura" },
  { prefix: "+250", country: "Rwanda",              countryCode: "RW", city: "Kigali" },

  // ── Afrique du Sud ────────────────────────────────────────────────────────
  { prefix: "+27",  country: "Afrique du Sud",      countryCode: "ZA", city: "Johannesburg" },
  { prefix: "+258", country: "Mozambique",          countryCode: "MZ", city: "Maputo" },
  { prefix: "+263", country: "Zimbabwe",            countryCode: "ZW", city: "Harare" },
  { prefix: "+260", country: "Zambie",              countryCode: "ZM", city: "Lusaka" },

  // ── Europe ────────────────────────────────────────────────────────────────
  { prefix: "+352", country: "Luxembourg",          countryCode: "LU", city: "Luxembourg" },
  { prefix: "+351", country: "Portugal",            countryCode: "PT", city: "Lisbonne" },
  { prefix: "+353", country: "Irlande",             countryCode: "IE", city: "Dublin" },
  { prefix: "+358", country: "Finlande",            countryCode: "FI", city: "Helsinki" },
  { prefix: "+33",  country: "France",              countryCode: "FR", city: "Paris" },
  { prefix: "+32",  country: "Belgique",            countryCode: "BE", city: "Bruxelles" },
  { prefix: "+31",  country: "Pays-Bas",            countryCode: "NL", city: "Amsterdam" },
  { prefix: "+34",  country: "Espagne",             countryCode: "ES", city: "Madrid" },
  { prefix: "+39",  country: "Italie",              countryCode: "IT", city: "Rome" },
  { prefix: "+41",  country: "Suisse",              countryCode: "CH", city: "Genève" },
  { prefix: "+43",  country: "Autriche",            countryCode: "AT", city: "Vienne" },
  { prefix: "+44",  country: "Royaume-Uni",         countryCode: "GB", city: "Londres" },
  { prefix: "+46",  country: "Suède",               countryCode: "SE", city: "Stockholm" },
  { prefix: "+47",  country: "Norvège",             countryCode: "NO", city: "Oslo" },
  { prefix: "+48",  country: "Pologne",             countryCode: "PL", city: "Varsovie" },
  { prefix: "+49",  country: "Allemagne",           countryCode: "DE", city: "Berlin" },

  // ── Amériques ─────────────────────────────────────────────────────────────
  { prefix: "+1",   country: "États-Unis",          countryCode: "US", city: "New York" },
  { prefix: "+55",  country: "Brésil",              countryCode: "BR", city: "São Paulo" },

  // ── Moyen-Orient ─────────────────────────────────────────────────────────
  { prefix: "+961", country: "Liban",               countryCode: "LB", city: "Beyrouth" },
  { prefix: "+971", country: "Émirats Arabes Unis", countryCode: "AE", city: "Dubaï" },
];

// Trier par longueur décroissante pour le matching greedy (préfixe le plus long d'abord)
const SORTED = [...ENTRIES].sort((a, b) => b.prefix.length - a.prefix.length);

/**
 * Normalise un numéro de téléphone en format E.164 (+XXXXX...).
 * Gère : +237..., 00237..., 237... (sans préfixe), espaces/tirets/points.
 */
function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/[\s\-().]/g, "");
  if (cleaned.startsWith("+")) return cleaned;
  if (cleaned.startsWith("00")) return "+" + cleaned.slice(2);
  // Pour les numéros camerounais locaux (6XX XXX XXX — 9 chiffres)
  if (/^6\d{8}$/.test(cleaned)) return "+237" + cleaned;
  return "+" + cleaned;
}

/**
 * Retourne le pays/ville depuis un indicatif téléphonique.
 * Retourne null si le numéro est vide ou non reconnu.
 */
export function geoFromPhone(phone: string | null | undefined): { country: string; countryCode: string; city: string } | null {
  if (!phone) return null;
  const norm = normalizePhone(phone.trim());
  if (norm.length < 5) return null;
  for (const entry of SORTED) {
    if (norm.startsWith(entry.prefix)) {
      return { country: entry.country, countryCode: entry.countryCode, city: entry.city };
    }
  }
  return null;
}

export function isUnknownGeo(country: string): boolean {
  return !country || country === "Inconnu" || country === "Local" || country === "unknown";
}
