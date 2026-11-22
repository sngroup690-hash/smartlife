"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";

type Notif = {
  id: string;
  type: "purchase" | "download" | "checkout" | "accompagnement";
  prenom: string;
  ville: string;
  produit: string;
  minutesAgo?: number;
};

type SPData = {
  config: {
    enabled: boolean;
    position: "bottom-left" | "bottom-right";
    delayBetween: number;
    displayDuration: number;
    mobileEnabled: boolean;
    mode: "real" | "fake" | "mixed";
    fakeNotifs: Notif[];
    fomoEnabled: boolean;
    fomoMessage: string;
    fomoCurrentCount: number;
  };
  recentActivities: Array<{
    id: string;
    type: "purchase" | "download" | "checkout";
    prenom: string;
    ville: string;
    produit: string;
    createdAt: string;
  }>;
};

function timeSince(dateStr: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000));
}

// Délai réel : une activité d'hier ne s'affiche jamais « il y a 3 minutes ».
function formatDelay(mins?: number): string {
  if (!mins || mins < 1) return "à l'instant";
  if (mins < 60) return `il y a ${mins} minute${mins > 1 ? "s" : ""}`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `il y a ${h} heure${h > 1 ? "s" : ""}`;
  const j = Math.floor(h / 24);
  return j === 1 ? "hier" : `il y a ${j} jours`;
}

const ACTIONS_ACHAT = ["vient d'acheter", "vient de recevoir son guide", "vient de rejoindre les acheteurs de"];
function actionDe(notif: Notif): string {
  if (notif.type === "accompagnement") return "vient de rejoindre le programme d'accompagnement";
  if (notif.type === "checkout") return "est en train de commander";
  if (notif.type === "download") return "vient de télécharger";
  const n = notif.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return ACTIONS_ACHAT[n % ACTIONS_ACHAT.length];
}

export default function SocialProofToast() {
  const [data, setData] = useState<SPData | null>(null);
  const [visible, setVisible] = useState(false);
  const chemin = usePathname() ?? "";
  const [ferme, setFerme] = useState(false);
  const [numero, setNumero] = useState(0);
  const [current, setCurrent] = useState<{ notif?: Notif; fomo?: string } | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const queueRef = useRef<Array<{ notif?: Notif; fomo?: string }>>([]);
  const indexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
  }, []);

  useEffect(() => {
    fetch("/api/social-proof")
      .then((r) => r.json())
      .then((d: SPData) => setData(d))
      .catch(() => {});
  }, []);

  const buildQueue = useCallback((d: SPData): Array<{ notif?: Notif; fomo?: string }> => {
    const queue: Array<{ notif?: Notif; fomo?: string }> = [];

    // Notifications
    let notifs: Notif[] = [];
    if (d.config.mode === "fake") {
      notifs = d.config.fakeNotifs.map((n) => ({
        ...n,
        minutesAgo: Math.floor(Math.random() * 3) + 1,
      }));
    } else if (d.config.mode === "real") {
      notifs = d.recentActivities.map((a) => ({
        ...a,
        minutesAgo: timeSince(a.createdAt),
      }));
    } else {
      // mixed
      const fake = d.config.fakeNotifs.map((n) => ({
        ...n,
        minutesAgo: Math.floor(Math.random() * 3) + 1,
      }));
      const real = d.recentActivities.map((a) => ({
        ...a,
        minutesAgo: timeSince(a.createdAt),
      }));
      // Interleave
      const maxLen = Math.max(fake.length, real.length);
      for (let i = 0; i < maxLen; i++) {
        if (i < fake.length) notifs.push(fake[i]);
        if (i < real.length) notifs.push(real[i]);
      }
    }

    for (let i = notifs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [notifs[i], notifs[j]] = [notifs[j], notifs[i]];
    }
    for (const n of notifs) {
      queue.push({ notif: n });
    }

    // FOMO : le nombre est tiré au hasard à chaque affichage
    if (d.config.fomoEnabled) {
      const msg = d.config.fomoMessage;
      // Insérer FOMO toutes les 3 notifs
      const withFomo: typeof queue = [];
      queue.forEach((item, i) => {
        withFomo.push(item);
        if ((i + 1) % 3 === 0) withFomo.push({ fomo: msg });
      });
      if (withFomo.length === 0) withFomo.push({ fomo: msg });
      return withFomo;
    }

    return queue;
  }, []);

  const showNext = useCallback(() => {
    if (!data || queueRef.current.length === 0) return;

    const item = queueRef.current[indexRef.current % queueRef.current.length];
    indexRef.current++;

    setCurrent(item.fomo ? { fomo: item.fomo.replace("{X}", String(8 + Math.floor(Math.random() * 33))) } : item);
    setVisible(true);
    setNumero((n) => n + 1);

    // La bulle apparaît, flotte en montant, puis s'efface (animation CSS « notif-flotte »).
    const vieMs = data.config.displayDuration * 1000 + 1200;
    const delayMs = data.config.delayBetween * 1000;

    timerRef.current = setTimeout(() => {
      setVisible(false);
      timerRef.current = setTimeout(showNext, delayMs);
    }, vieMs);
  }, [data]);

  const fermer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(false);
    setFerme(true);
    try { sessionStorage.setItem("notifs-fermees", "1"); } catch { /* navigation privée */ }
  };

  useEffect(() => {
    try { if (sessionStorage.getItem("notifs-fermees")) setFerme(true); } catch { /* navigation privée */ }
  }, []);

  useEffect(() => {
    if (!data || ferme) return;
    if (!data.config.enabled) return;
    if (isMobile && !data.config.mobileEnabled) return;

    queueRef.current = buildQueue(data);
    if (queueRef.current.length === 0) return;

    // Délai initial avant premier affichage
    timerRef.current = setTimeout(showNext, 3000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [data, isMobile, buildQueue, showNext, ferme]);

  if (!data?.config.enabled || ferme || chemin.startsWith("/admin")) return null;
  if (isMobile && !data.config.mobileEnabled) return null;
  if (!visible || !current) return null;

  const pos = data.config.position === "bottom-right"
    ? { right: "1rem", left: "auto" }
    : { left: "1rem", right: "auto" };

  return (
    <div
      key={numero}
      className="notif-flotte"
      style={{
        position: "fixed",
        bottom: isMobile ? "5.25rem" : "1.5rem",
        zIndex: 9999,
        maxWidth: "260px",
        width: "calc(100vw - 2rem)",
        animationDuration: `${data.config.displayDuration * 1000 + 1200}ms`,
        ...pos,
      }}
    >
      <button
        type="button"
        onClick={fermer}
        aria-label="Fermer les notifications"
        style={{
          position: "absolute", top: "-7px", right: "-7px", zIndex: 1,
          width: "20px", height: "20px", borderRadius: "50%", border: "1px solid #e5e7eb",
          background: "#fff", color: "#6b7280", fontSize: "13px", lineHeight: "18px",
          display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
          boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
        }}
      >
        ×
      </button>
      {current.fomo ? (
        <FomoToast message={current.fomo} />
      ) : current.notif ? (
        <NotifToast notif={current.notif} />
      ) : null}
    </div>
  );
}

function NotifToast({ notif }: { notif: Notif }) {
  const isPurchase = notif.type === "purchase";
  const isAccomp = notif.type === "accompagnement";
  return (
    <div
      style={{
        background: isAccomp ? "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)" : "#ffffff",
        border: isAccomp ? "1px solid #86efac" : "1px solid #e5e7eb",
        borderRadius: "10px",
        padding: "8px 12px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.15), 0 1px 4px rgba(0,0,0,0.1)",
        display: "flex",
        alignItems: "flex-start",
        gap: "8px",
      }}
    >
      <div
        style={{
          width: "24px",
          height: "24px",
          borderRadius: "50%",
          background: isPurchase ? "#dcfce7" : isAccomp ? "#dcfce7" : "#dbeafe",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          fontSize: "14px",
        }}
      >
        {notif.type === "accompagnement" ? "🤝" : notif.type === "checkout" ? "⏳" : isPurchase ? "🛒" : "📥"}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            margin: 0,
            fontSize: "11.5px",
            fontWeight: 600,
            color: "#111827",
            lineHeight: 1.4,
          }}
        >
          <span style={{ color: "#27A827" }}>{notif.prenom}</span>
          {notif.ville ? <> depuis <span style={{ color: "#2563eb" }}>{notif.ville}</span></> : null} {actionDe(notif)}
        </p>
        <p
          style={{
            margin: "1px 0 0",
            fontSize: "10.5px",
            color: "#374151",
            fontWeight: 500,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {notif.produit}
        </p>
        <p style={{ margin: "2px 0 0", fontSize: "10px", color: "#9ca3af" }}>
          {formatDelay(notif.minutesAgo)}
        </p>
      </div>
      <div
        style={{
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          background: "#22c55e",
          flexShrink: 0,
          marginTop: "4px",
          boxShadow: "0 0 0 3px rgba(34,197,94,0.2)",
        }}
      />
    </div>
  );
}

function FomoToast({ message }: { message: string }) {
  return (
    <div
      style={{
        background: "linear-gradient(135deg, #ff6b35 0%, #f7c59f 100%)",
        borderRadius: "10px",
        padding: "8px 12px",
        boxShadow: "0 4px 16px rgba(255,107,53,0.3)",
        display: "flex",
        alignItems: "center",
        gap: "8px",
      }}
    >
      <span style={{ fontSize: "16px" }}>⚡</span>
      <p
        style={{
          margin: 0,
          fontSize: "12px",
          fontWeight: 700,
          color: "#ffffff",
          lineHeight: 1.4,
        }}
      >
        {message}
      </p>
    </div>
  );
}
