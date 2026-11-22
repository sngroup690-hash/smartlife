/**
 * Détection automatique de l'opérateur Mobile Money à partir du numéro de téléphone.
 * Utilise les préfixes locaux (après code pays) pour identifier l'opérateur.
 */

type PrefixRule = { p: string; op: string };

// Préfixes locaux (chiffres après l'indicatif pays) → opérateur Sebpay
const RULES: Record<string, PrefixRule[]> = {
  CM: [
    // MTN Cameroun : 650-654, 670-684
    { p: "650", op: "mtn" }, { p: "651", op: "mtn" }, { p: "652", op: "mtn" },
    { p: "653", op: "mtn" }, { p: "654", op: "mtn" },
    { p: "670", op: "mtn" }, { p: "671", op: "mtn" }, { p: "672", op: "mtn" },
    { p: "673", op: "mtn" }, { p: "674", op: "mtn" }, { p: "675", op: "mtn" },
    { p: "676", op: "mtn" }, { p: "677", op: "mtn" }, { p: "678", op: "mtn" },
    { p: "679", op: "mtn" },
    { p: "680", op: "mtn" }, { p: "681", op: "mtn" }, { p: "682", op: "mtn" },
    { p: "683", op: "mtn" }, { p: "684", op: "mtn" },
    // Orange Cameroun : 655-659, 685-699
    { p: "655", op: "orange" }, { p: "656", op: "orange" }, { p: "657", op: "orange" },
    { p: "658", op: "orange" }, { p: "659", op: "orange" },
    { p: "685", op: "orange" }, { p: "686", op: "orange" }, { p: "687", op: "orange" },
    { p: "688", op: "orange" }, { p: "689", op: "orange" },
    { p: "690", op: "orange" }, { p: "691", op: "orange" }, { p: "692", op: "orange" },
    { p: "693", op: "orange" }, { p: "694", op: "orange" }, { p: "695", op: "orange" },
    { p: "696", op: "orange" }, { p: "697", op: "orange" }, { p: "698", op: "orange" },
    { p: "699", op: "orange" },
  ],
  CI: [
    // MTN Côte d'Ivoire
    { p: "05", op: "mtn" }, { p: "07", op: "mtn" },
    // Orange Côte d'Ivoire
    { p: "08", op: "orange" }, { p: "09", op: "orange" },
    // Wave Côte d'Ivoire
    { p: "01", op: "wav" }, { p: "02", op: "wav" },
    // Moov Côte d'Ivoire
    { p: "04", op: "moov" }, { p: "03", op: "moov" },
  ],
  SN: [
    // Orange Sénégal
    { p: "76", op: "orange" }, { p: "77", op: "orange" }, { p: "75", op: "orange" },
    // Wave Sénégal
    { p: "70", op: "wav" },
    // Free Sénégal
    { p: "78", op: "free" }, { p: "74", op: "free" },
  ],
  BJ: [
    // MTN Bénin
    { p: "96", op: "mtn" }, { p: "97", op: "mtn" },
    { p: "66", op: "mtn" }, { p: "67", op: "mtn" }, { p: "68", op: "mtn" }, { p: "69", op: "mtn" },
    // Moov Bénin
    { p: "94", op: "moov" }, { p: "95", op: "moov" }, { p: "98", op: "moov" },
    { p: "64", op: "moov" }, { p: "65", op: "moov" },
  ],
  BF: [
    // Orange Burkina Faso
    { p: "70", op: "orange" }, { p: "71", op: "orange" }, { p: "72", op: "orange" },
    { p: "73", op: "orange" }, { p: "74", op: "orange" }, { p: "75", op: "orange" },
    { p: "76", op: "orange" }, { p: "77", op: "orange" }, { p: "78", op: "orange" },
    { p: "79", op: "orange" },
    // Moov Burkina Faso
    { p: "60", op: "moov" }, { p: "61", op: "moov" }, { p: "62", op: "moov" },
    { p: "63", op: "moov" }, { p: "64", op: "moov" }, { p: "65", op: "moov" },
    { p: "66", op: "moov" }, { p: "67", op: "moov" }, { p: "68", op: "moov" },
    { p: "69", op: "moov" },
  ],
  ML: [
    // Orange Mali
    { p: "70", op: "orange" }, { p: "72", op: "orange" }, { p: "73", op: "orange" },
    { p: "74", op: "orange" }, { p: "75", op: "orange" }, { p: "76", op: "orange" },
    { p: "77", op: "orange" }, { p: "78", op: "orange" }, { p: "79", op: "orange" },
    // Moov Mali
    { p: "65", op: "moov" }, { p: "66", op: "moov" }, { p: "67", op: "moov" },
    { p: "60", op: "moov" },
  ],
  GN: [
    // MTN Guinée
    { p: "62", op: "mtn" }, { p: "67", op: "mtn" }, { p: "68", op: "mtn" },
    // Orange Guinée
    { p: "65", op: "orange" }, { p: "66", op: "orange" }, { p: "64", op: "orange" },
  ],
  GW: [
    // MTN Guinée-Bissau
    { p: "95", op: "mtn" }, { p: "96", op: "mtn" },
    // Orange Guinée-Bissau
    { p: "97", op: "orange" }, { p: "66", op: "orange" },
  ],
  TG: [
    // Togocom
    { p: "91", op: "togocom" }, { p: "92", op: "togocom" }, { p: "93", op: "togocom" },
    { p: "70", op: "togocom" }, { p: "71", op: "togocom" }, { p: "72", op: "togocom" },
    { p: "90", op: "togocom" },
    // Moov Togo
    { p: "98", op: "moov" }, { p: "99", op: "moov" }, { p: "97", op: "moov" },
  ],
  NE: [
    // Airtel Niger
    { p: "91", op: "airtel" }, { p: "97", op: "airtel" },
    // Moov Niger
    { p: "95", op: "moov" }, { p: "96", op: "moov" },
  ],
  CG: [
    // MTN Congo-Brazzaville
    { p: "06", op: "mtn" },
    // Airtel Congo
    { p: "05", op: "airtel" },
  ],
  GA: [
    // Airtel Gabon
    { p: "06", op: "airtel" }, { p: "07", op: "airtel" },
    // Moov Gabon
    { p: "05", op: "moov" }, { p: "04", op: "moov" },
  ],
  CD: [
    // Airtel RDC
    { p: "99", op: "airtel" }, { p: "97", op: "airtel" },
    // Orange RDC
    { p: "84", op: "orange" }, { p: "85", op: "orange" }, { p: "89", op: "orange" },
    // M-Pesa RDC
    { p: "82", op: "mpesa" }, { p: "83", op: "mpesa" },
  ],
};

// Indicatifs pays (sans +)
const DIALING: Record<string, string> = {
  CM: "237", CI: "225", SN: "221", BJ: "229", BF: "226",
  ML: "223", GN: "224", TG: "228", CG: "242", GA: "241",
  CD: "243", TD: "235", GW: "245", NE: "227", GM: "220",
};

function stripToDigits(phone: string): string {
  return phone.replace(/[\s\-().+]/g, "").replace(/^00/, "");
}

/**
 * Détecte l'opérateur Mobile Money à partir du numéro et du code pays.
 * Retourne l'ID opérateur Sebpay (ex: "mtn", "orange", "wav") ou null.
 */
export function detectOperator(phone: string, countryCode: string): string | null {
  if (!phone || !countryCode) return null;
  const rules = RULES[countryCode];
  if (!rules) return null;

  const digits = stripToDigits(phone);
  const dialPrefix = DIALING[countryCode];

  // Retirer l'indicatif pays si présent en tête
  const local = dialPrefix && digits.startsWith(dialPrefix)
    ? digits.slice(dialPrefix.length)
    : digits;

  if (!local) return null;

  for (const rule of rules) {
    if (local.startsWith(rule.p)) return rule.op;
  }
  return null;
}
