"use client";

import { useState } from "react";
import Link from "next/link";
import { BellOff, Check } from "lucide-react";

export default function ArreterClient({ jeton }: { jeton: string }) {
  const [etat, setEtat] = useState<"question" | "envoi" | "fait" | "erreur">(jeton ? "question" : "erreur");

  async function confirmer() {
    setEtat("envoi");
    try {
      const r = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "arreter", jeton }),
      });
      const d = (await r.json()) as { ok?: boolean };
      if (!d.ok) throw new Error();
      // Retire aussi l'abonnement de ce téléphone, s'il y en a un
      try {
        const reg = await navigator.serviceWorker?.getRegistration("/");
        const sub = await reg?.pushManager?.getSubscription();
        await sub?.unsubscribe();
      } catch { /* sans importance */ }
      setEtat("fait");
    } catch {
      setEtat("erreur");
    }
  }

  return (
    <main className="mx-auto max-w-md px-4 py-20">
      <div className="rounded-[16px] border border-[var(--g-ligne)] bg-white p-6 text-center">
        {etat === "fait" ? (
          <>
            <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--g-vert-doux)]">
              <Check size={22} className="text-[var(--g-vert)]" />
            </span>
            <h1 className="text-[20px] font-semibold text-[var(--g-encre)]">C&apos;est fait</h1>
            <p className="mt-2 text-[14px] text-[var(--g-gris)]">
              Vous ne recevrez plus les nouveautés de Smart Life. Vous pourrez les réactiver à tout moment depuis Mon espace.
            </p>
          </>
        ) : etat === "erreur" ? (
          <>
            <h1 className="text-[20px] font-semibold text-[var(--g-encre)]">Lien incomplet</h1>
            <p className="mt-2 text-[14px] text-[var(--g-gris)]">
              Nous n&apos;avons pas pu retrouver votre abonnement. Vous pouvez arrêter les nouveautés depuis Mon espace.
            </p>
          </>
        ) : (
          <>
            <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--g-doux)]">
              <BellOff size={22} className="text-[var(--g-encre)]" />
            </span>
            <h1 className="text-[20px] font-semibold text-[var(--g-encre)]">Ne plus recevoir les nouveautés ?</h1>
            <p className="mt-2 text-[14px] text-[var(--g-gris)]">
              Vous ne serez plus prévenu(e) des nouveaux guides et conseils gratuits liés à vos achats.
            </p>
            <button type="button" onClick={confirmer} disabled={etat === "envoi"} className="g-btn g-btn-noir mt-5 w-full disabled:opacity-60">
              {etat === "envoi" ? "Un instant…" : "Oui, ne plus recevoir"}
            </button>
          </>
        )}
        <Link href="/mon-espace" className="mt-4 inline-block text-[13px] text-[var(--g-gris)] underline underline-offset-2">
          Aller à Mon espace
        </Link>
      </div>
    </main>
  );
}
