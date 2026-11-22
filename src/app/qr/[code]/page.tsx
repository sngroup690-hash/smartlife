"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";

export default function QRRedirectPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    if (!code) return;

    async function redirect() {
      try {
        // Increment scan + get data
        const patchRes = await fetch(`/api/admin/qrcodes?code=${encodeURIComponent(code)}`, {
          method: "PATCH",
        });
        if (!patchRes.ok) {
          setError("QR code invalide ou expiré.");
          return;
        }
        const data = await patchRes.json() as {
          qrcode: {
            targetUrl: string;
            discountType: "none" | "percent" | "fixed";
            discountValue: number;
            discountLabel: string;
          };
        };
        const q = data.qrcode;

        // Apply promo to localStorage so checkout picks it up
        if (q.discountType !== "none" && q.discountValue > 0) {
          try {
            localStorage.setItem("sl_popup_promo", JSON.stringify({
              type: q.discountType === "percent" ? "percent" : "fixed",
              value: q.discountValue,
              label: q.discountLabel ||
                (q.discountType === "percent"
                  ? `Réduction ${q.discountValue}%`
                  : `Réduction ${q.discountValue} FCFA`),
            }));
          } catch {}
        }

        const target = q.targetUrl.startsWith("http") ? q.targetUrl : q.targetUrl;
        router.replace(target);
      } catch {
        setError("Erreur lors de la redirection. Veuillez réessayer.");
      }
    }

    redirect();
  }, [code, router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center max-w-sm px-6">
          <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
          <p className="text-gray-800 font-semibold text-lg mb-2">Lien invalide</p>
          <p className="text-gray-500 text-sm mb-6">{error}</p>
          <a href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl font-semibold text-sm hover:bg-green-700 transition-colors">
            Retour à l&apos;accueil
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <Loader2 size={36} className="mx-auto mb-4 animate-spin text-green-600" />
        <p className="text-gray-600 text-sm font-medium">Redirection en cours…</p>
      </div>
    </div>
  );
}
