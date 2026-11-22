"use client";

import { useEffect, useState } from "react";

const SLIDES = [
  {
    orb1: { bg: "rgba(232,184,0,0.18)", top: "-15%", right: "-5%", w: 700, h: 700 },
    orb2: { bg: "rgba(39,168,39,0.12)", bottom: "-10%", left: "-8%", w: 500, h: 500 },
  },
  {
    orb1: { bg: "rgba(39,168,39,0.15)", top: "-10%", left: "25%", w: 650, h: 650 },
    orb2: { bg: "rgba(232,184,0,0.12)", bottom: "0%", right: "-5%", w: 450, h: 450 },
  },
  {
    orb1: { bg: "rgba(232,184,0,0.20)", top: "-18%", left: "-8%", w: 700, h: 700 },
    orb2: { bg: "rgba(39,168,39,0.14)", bottom: "-5%", right: "15%", w: 480, h: 480 },
  },
  {
    orb1: { bg: "rgba(39,168,39,0.16)", top: "0%", right: "8%", w: 600, h: 600 },
    orb2: { bg: "rgba(232,184,0,0.10)", bottom: "-12%", left: "5%", w: 500, h: 500 },
  },
  {
    orb1: { bg: "rgba(232,184,0,0.15)", top: "-20%", left: "18%", w: 680, h: 680 },
    orb2: { bg: "rgba(39,168,39,0.12)", bottom: "-10%", right: "-8%", w: 460, h: 460 },
  },
];

type OrbDef = {
  bg: string; w: number; h: number;
  top?: string; bottom?: string; left?: string; right?: string;
};

function Orb({ orb }: { orb: OrbDef }) {
  const style: React.CSSProperties = {
    background: orb.bg,
    width: orb.w,
    height: orb.h,
    borderRadius: "50%",
    filter: "blur(130px)",
    position: "absolute",
    ...(orb.top    !== undefined && { top:    orb.top }),
    ...(orb.bottom !== undefined && { bottom: orb.bottom }),
    ...(orb.left   !== undefined && { left:   orb.left }),
    ...(orb.right  !== undefined && { right:  orb.right }),
  };
  return <div style={style} />;
}

export default function HeroBgSlider() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setCurrent((c) => (c + 1) % SLIDES.length), 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Fond de base clair */}
      <div className="absolute inset-0 bg-[#FAFAF7]" />

      {/* Slides croisées */}
      {SLIDES.map((s, i) => (
        <div
          key={i}
          className="absolute inset-0 transition-opacity duration-[1400ms] ease-in-out"
          style={{ opacity: i === current ? 1 : 0 }}
        >
          <Orb orb={s.orb1} />
          <Orb orb={s.orb2} />
        </div>
      ))}

      {/* Grille fine pour texture */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,0,0,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.08) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
        }}
      />

      {/* Points indicateurs */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {SLIDES.map((_, i) => (
          <div
            key={i}
            className="h-[6px] rounded-full transition-all duration-500"
            style={{
              width: i === current ? 24 : 6,
              backgroundColor: i === current ? "#E8B800" : "rgba(0,0,0,0.12)",
            }}
          />
        ))}
      </div>
    </div>
  );
}
