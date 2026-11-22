"use client";

export function UploadProgressBar({ percent, label }: { percent: number; label?: string }) {
  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-500">{label ?? "Upload en cours…"}</span>
        <span className="font-mono font-bold text-green-600">{percent}%</span>
      </div>
      <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
      {percent >= 100 && (
        <p className="text-xs text-green-600 font-medium">Traitement en cours…</p>
      )}
    </div>
  );
}
