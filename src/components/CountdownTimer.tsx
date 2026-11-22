"use client";
import { useEffect, useState } from "react";

type TimeLeft = { jours: number; heures: number; minutes: number; secondes: number };

function calcTimeLeft(endMs: number): TimeLeft | null {
  const diff = endMs - Date.now();
  if (diff <= 0) return null;
  return {
    jours:    Math.floor(diff / (1000 * 60 * 60 * 24)),
    heures:   Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes:  Math.floor((diff / (1000 * 60)) % 60),
    secondes: Math.floor((diff / 1000) % 60),
  };
}

function getEffectiveEndMs(endDate: string, cyclique: boolean, dureeHeures: number): number {
  const anchorMs = new Date(endDate).getTime();
  if (!cyclique || dureeHeures <= 0) return anchorMs;
  const durMs = dureeHeures * 3600 * 1000;
  const now = Date.now();
  if (now <= anchorMs) return anchorMs;
  const cyclesPassed = Math.floor((now - anchorMs) / durMs);
  return anchorMs + (cyclesPassed + 1) * durMs;
}

function FlipDigit({ value, label }: { value: number; label: string }) {
  const [displayed, setDisplayed] = useState(value);
  const [flipping, setFlipping] = useState(false);

  useEffect(() => {
    if (value === displayed) return;
    setFlipping(true);
    const t = setTimeout(() => {
      setDisplayed(value);
      setFlipping(false);
    }, 150);
    return () => clearTimeout(t);
  }, [value]); // eslint-disable-line

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className="flex items-center justify-center rounded-xl border border-gray-200 bg-gray-50"
        style={{ width: 64, height: 64, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
      >
        <span
          className="tabular-nums font-bold text-gray-900 select-none"
          style={{
            fontSize: 30,
            lineHeight: 1,
            transition: "opacity 0.15s ease, transform 0.15s ease",
            opacity: flipping ? 0 : 1,
            transform: flipping ? "translateY(-4px)" : "translateY(0)",
          }}
        >
          {String(displayed).padStart(2, "0")}
        </span>
      </div>
      <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">{label}</span>
    </div>
  );
}

export default function CountdownTimer({
  endDate,
  cyclique = false,
  dureeHeures = 24,
}: {
  endDate?: string;
  cyclique?: boolean;
  dureeHeures?: number;
}) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!endDate) return;
    let id: ReturnType<typeof setInterval>;
    const tick = () => {
      const effectiveEndMs = getEffectiveEndMs(endDate, cyclique, dureeHeures);
      const t = calcTimeLeft(effectiveEndMs);
      setTimeLeft(t);
      if (!t && !cyclique) clearInterval(id);
    };
    tick();
    id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endDate, cyclique, dureeHeures]);

  if (!mounted || !endDate || !timeLeft) return null;

  return (
    <div
      className="rounded-2xl border border-gray-100 bg-white p-4 flex flex-col gap-4"
      style={{ boxShadow: "0 10px 30px rgba(0,0,0,0.05)" }}
    >
      {/* Badge */}
      <div className="flex justify-center">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-600 border border-red-100">
          🔥 OFFRE LIMITÉE — EXPIRE BIENTÔT
        </span>
      </div>

      {/* Digit blocks */}
      <div className="flex justify-center gap-2">
        <FlipDigit value={timeLeft.jours}    label="Jours"    />
        <Separator />
        <FlipDigit value={timeLeft.heures}   label="Heures"   />
        <Separator />
        <FlipDigit value={timeLeft.minutes}  label="Minutes"  />
        <Separator />
        <FlipDigit value={timeLeft.secondes} label="Secondes" />
      </div>
    </div>
  );
}

function Separator() {
  return (
    <div className="flex flex-col items-center justify-center pb-5 gap-1">
      <span className="w-1 h-1 rounded-full bg-gray-300" />
      <span className="w-1 h-1 rounded-full bg-gray-300" />
    </div>
  );
}
