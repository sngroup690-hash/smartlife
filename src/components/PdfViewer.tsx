"use client";

import { useEffect, useRef, useState } from "react";
import { BookOpen, Loader2 } from "lucide-react";

const MAX_PAGES = 3;

interface PdfViewerProps {
  url: string;
}

type PdfDoc = { getPage: (n: number) => Promise<PdfPage> };
type PdfPage = { getViewport: (opts: { scale: number }) => { width: number; height: number }; render: (opts: object) => { promise: Promise<void> } };

export function PdfViewer({ url }: PdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const [numPages, setNumPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const pdfRef = useRef<PdfDoc | null>(null);

  // Phase 1 : charger le PDF et compter les pages
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    setNumPages(0);
    pdfRef.current = null;

    (async () => {
      try {
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
        const pdf = (await pdfjsLib.getDocument(url).promise) as unknown as PdfDoc & { numPages: number };
        if (cancelled) return;
        pdfRef.current = pdf;
        setNumPages(Math.min(pdf.numPages, MAX_PAGES));
      } catch {
        if (!cancelled) setError(true);
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [url]);

  // Phase 2 : rendre les pages sur les canvas (déclenché après que les canvas sont montés)
  useEffect(() => {
    if (!pdfRef.current || numPages === 0) return;
    const pdf = pdfRef.current;
    const cssWidth = containerRef.current?.clientWidth || 380;
    // Multiplier par devicePixelRatio pour un rendu net sur écrans Retina/haute densité
    const dpr = window.devicePixelRatio || 1;
    let cancelled = false;

    (async () => {
      try {
        for (let i = 1; i <= numPages; i++) {
          if (cancelled) break;
          const canvas = canvasRefs.current[i - 1];
          if (!canvas) continue;
          const page = await pdf.getPage(i);
          const unscaled = page.getViewport({ scale: 1 });
          const scale = (cssWidth / unscaled.width) * dpr;
          const vp = page.getViewport({ scale });
          // Dimensions physiques (haute résolution)
          canvas.width = vp.width;
          canvas.height = vp.height;
          // Dimensions CSS (taille affichée)
          canvas.style.width = cssWidth + "px";
          canvas.style.height = Math.round(vp.height / dpr) + "px";
          const ctx = canvas.getContext("2d");
          if (!ctx) continue;
          await page.render({ canvasContext: ctx, viewport: vp }).promise;
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [numPages]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 px-6 bg-gray-50 text-center" style={{ minHeight: 280 }}>
        <BookOpen size={36} className="text-gray-300" />
        <p className="text-gray-500 text-sm">L&apos;aperçu n&apos;est pas disponible.</p>
        <a href={url} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-[#E8B800] text-black font-bold text-sm rounded-xl">
          Ouvrir le PDF
        </a>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full bg-white relative">
      {/* Spinner superposé pendant le chargement */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10" style={{ minHeight: 280 }}>
          <Loader2 size={28} className="animate-spin text-[#E8B800]" />
        </div>
      )}
      {/* Pages empilées verticalement */}
      {Array.from({ length: numPages }, (_, i) => (
        <div key={i} className={i > 0 ? "border-t border-gray-100" : ""}>
          <canvas
            ref={(el) => { canvasRefs.current[i] = el; }}
            className="block max-w-full"
          />
        </div>
      ))}
      {/* Placeholder pour occuper l'espace pendant le chargement */}
      {numPages === 0 && <div style={{ minHeight: 280 }} />}
    </div>
  );
}
