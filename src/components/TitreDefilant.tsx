"use client";

import { useEffect, useRef, useState } from "react";

// Titre trop long pour sa carte : il défile doucement pour se lire en entier, puis revient.
export default function TitreDefilant({
  texte,
  className = "",
  lignes = 2,
  style,
}: {
  texte: string;
  className?: string;
  lignes?: number;
  style?: React.CSSProperties;
}) {
  const boite = useRef<HTMLSpanElement>(null);
  const interieur = useRef<HTMLSpanElement>(null);
  const [decalage, setDecalage] = useState(0);
  const horizontal = lignes === 1;

  useEffect(() => {
    const b = boite.current;
    const i = interieur.current;
    if (!b || !i) return;
    const mesurer = () =>
      setDecalage(horizontal ? Math.max(0, i.scrollWidth - b.clientWidth) : Math.max(0, i.scrollHeight - b.clientHeight));
    mesurer();
    const ro = new ResizeObserver(mesurer);
    ro.observe(b);
    return () => ro.disconnect();
  }, [texte, horizontal]);

  return (
    <span
      ref={boite}
      title={texte}
      className={`block ${className}`}
      style={{ ...style, lineHeight: 1.35, height: `${lignes * 1.35}em`, overflow: "hidden" }}
    >
      <span
        ref={interieur}
        className={decalage > 0 ? (horizontal ? "titre-defile-h" : "titre-defile-v") : undefined}
        style={{
          display: "block",
          whiteSpace: horizontal ? "nowrap" : "normal",
          width: horizontal ? "max-content" : undefined,
          ["--decalage" as string]: `-${decalage}px`,
          animationDuration: horizontal ? "8s" : `${Math.max(6, decalage / 8)}s`,
        }}
      >
        {texte}
      </span>
    </span>
  );
}
