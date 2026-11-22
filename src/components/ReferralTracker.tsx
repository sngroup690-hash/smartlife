"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function ReferralTracker() {
  const params = useSearchParams();

  useEffect(() => {
    const ref = params.get("ref");
    if (!ref) return;

    const clean = ref.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
    if (!clean) return;

    // Ne pas écraser un parrainage déjà actif
    const existing = document.cookie.split(";").find((c) => c.trim().startsWith("sl_ref="));
    if (existing) return;

    fetch("/api/referral", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: clean }),
    }).catch(() => {});
  }, [params]);

  return null;
}
