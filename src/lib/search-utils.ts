export function normalize(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Score de correspondance entre une requête et un item.
 * @param primary  Champ principal (titre) — poids fort
 * @param secondary Champs secondaires avec leur poids
 */
export function fuzzyScore(
  query: string,
  primary: string,
  secondary: { text: string; weight: number }[] = []
): number {
  if (!query.trim()) return 1;
  const words = normalize(query).split(" ").filter((w) => w.length >= 2);
  if (!words.length) return 1;

  const norm = normalize(primary);
  let score = 0;

  for (const word of words) {
    if (norm.includes(word)) {
      score += 12;
    } else if (norm.split(" ").some((w) => w.startsWith(word) && word.length >= 3)) {
      score += 8;
    }
    for (const { text, weight } of secondary) {
      const n = normalize(text);
      if (n.includes(word)) score += weight;
      else if (n.split(" ").some((w) => w.startsWith(word) && word.length >= 3))
        score += Math.floor(weight * 0.5);
    }
  }

  if (words.every((w) => norm.includes(w))) score += 15;
  if (norm.includes(normalize(query))) score += 10;

  return score;
}
