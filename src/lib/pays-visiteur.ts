// Une seule demande du pays du visiteur à la fois pour toute la page :
// la devise et les statistiques de visite partagent la même réponse.
let enCours: Promise<string | null> | null = null;
let demandeLe = 0;

/** @param ageMax au-delà de cet âge (ms), la réponse gardée est redemandée (ex. VPN activé entre-temps) */
export function demanderPays(ageMax = Infinity): Promise<string | null> {
  if (!enCours || Date.now() - demandeLe > ageMax) {
    demandeLe = Date.now();
    enCours = fetch("/api/geo", { signal: AbortSignal.timeout(3000) })
      .then((r) => r.json() as Promise<{ countryCode?: string | null }>)
      .then((d) => d.countryCode ?? null)
      .catch(() => {
        enCours = null; // en cas d'échec, on pourra réessayer plus tard
        return null;
      });
  }
  return enCours;
}
