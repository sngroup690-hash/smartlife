// Écran d'attente commun à toutes les pages : il s'affiche à l'instant du toucher,
// pendant que la page demandée arrive (Next le prépare à l'avance pour chaque lien visible).
// Style « Galerie » : blanc, blocs gris doux qui scintillent légèrement.
export default function Chargement() {
  return (
    <div className="bg-white min-h-[70vh]" aria-busy="true" aria-label="Chargement de la page">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-16">
        <div className="squelette h-3.5 w-32 rounded-full" />
        <div className="squelette mt-4 h-9 sm:h-11 w-[85%] sm:w-[60%] rounded-[10px]" />
        <div className="squelette mt-3 h-9 sm:h-11 w-[55%] sm:w-[40%] rounded-[10px]" />
        <div className="squelette mt-5 h-4 w-[90%] sm:w-[50%] rounded-full" />
        <div className="squelette mt-2 h-4 w-[70%] sm:w-[38%] rounded-full" />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={i > 1 ? "hidden sm:block" : ""}>
              <div className="squelette aspect-[4/3] rounded-[14px]" />
              <div className="squelette mt-4 h-4 w-[75%] rounded-full" />
              <div className="squelette mt-2 h-3.5 w-[55%] rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
