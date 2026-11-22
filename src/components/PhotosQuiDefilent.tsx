"use client";

import { useEffect, useState } from "react";

// Diaporama : les photos se remplacent en fondu avec un léger zoom, et de petits points montrent où on en est.
export default function PhotosQuiDefilent({ photos, alt, intervalle = 3800 }: { photos: string[]; alt: string; intervalle?: number }) {
  const [rang, setRang] = useState(0);

  useEffect(() => {
    if (photos.length < 2) return;
    const t = setInterval(() => setRang((r) => (r + 1) % photos.length), intervalle);
    return () => clearInterval(t);
  }, [photos.length, intervalle]);

  if (photos.length === 0) return null;
  return (
    <div className="absolute inset-0">
      {photos.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src}
          src={src}
          alt={i === rang ? alt : ""}
          aria-hidden={i !== rang}
          loading={i === 0 ? "eager" : "lazy"}
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            objectPosition: "50% 22%",
            opacity: i === rang ? 1 : 0,
            transform: i === rang ? "scale(1.06)" : "scale(1)",
            transition: `opacity 1s ease, transform ${intervalle + 1000}ms ease-out`,
          }}
        />
      ))}
      {photos.length > 1 && (
        <div className="absolute bottom-3 right-3 flex gap-1.5 rounded-full px-2 py-1.5" style={{ background: "rgba(0,0,0,0.35)" }}>
          {photos.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setRang(i)}
              aria-label={`Photo ${i + 1}`}
              className="h-2 rounded-full transition-all"
              style={{ width: i === rang ? 18 : 8, background: i === rang ? "#E8B800" : "rgba(255,255,255,0.8)" }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
