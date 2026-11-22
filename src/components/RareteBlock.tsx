"use client";

export default function RareteBlock({
  vendus,
  restantes,
}: {
  vendus: number;
  restantes: number;
}) {
  const total = vendus + restantes;
  const pct = total > 0 ? Math.min(100, Math.round((vendus / total) * 100)) : 90;

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-sm font-semibold text-gray-700">
        Vendus : <span className="text-gray-900">{vendus.toLocaleString("fr-FR")}</span>
        <span className="text-gray-400 mx-2">|</span>
        Restants :{" "}
        <span className="text-red-600 font-bold">{restantes}</span>
      </p>
      <div className="h-1 w-full rounded-full bg-gray-200 overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg, #EF4444, #F97316)",
          }}
        />
      </div>
    </div>
  );
}
