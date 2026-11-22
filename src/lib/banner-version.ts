// Version en mémoire (Node.js garde les modules en cache — fonctionne en process unique PM2)
// Quand un admin sauvegarde une bannière, la version est incrémentée.
// Les composants client la pollent toutes les 30s et re-fetchent si elle a changé.

let current = Date.now();

export const bannerVersion = {
  get: () => current,
  bump: () => {
    current = Date.now();
    return current;
  },
};
