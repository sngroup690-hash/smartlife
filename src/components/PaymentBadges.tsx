import { Lock } from "lucide-react";

interface PaymentBadgesProps {
  className?: string;
  size?: "xs" | "sm";
}

const PAYMENT_LOGOS = [
  { id: "orange-money", src: "/payment-logos/orange-money.png", alt: "Orange Money",  w: 50 },
  { id: "mtn-momo",     src: "/payment-logos/mtn-momo.png",     alt: "MTN MoMo",      w: 75 },
  { id: "wave",         src: "/payment-logos/wave.png",         alt: "Wave",          w: 40 },
  { id: "express-union",src: "/payment-logos/express-union.png",alt: "EU Mobile Money", w: 35 },
  { id: "visa",         src: "/payment-logos/visa.svg",         alt: "Visa",          w: 54 },
  { id: "mastercard",   src: "/payment-logos/mastercard.svg",   alt: "Mastercard",    w: 46 },
];

export function PaymentBadges({ className, size = "sm" }: PaymentBadgesProps) {
  const h = size === "sm" ? 20 : 16;

  return (
    <div className={`flex flex-col items-center gap-1.5 ${className ?? ""}`}>
      {/* Logo row */}
      <div className="flex items-center gap-1 flex-nowrap justify-center">
        {PAYMENT_LOGOS.map((logo) => (
          <div
            key={logo.id}
            className="rounded-md overflow-hidden opacity-70 hover:opacity-100 transition-opacity duration-200"
            style={{ height: h, width: Math.round((logo.w / 36) * h) }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logo.src}
              alt={logo.alt}
              style={{ height: h, width: Math.round((logo.w / 36) * h), display: "block" }}
              loading="lazy"
            />
          </div>
        ))}
      </div>

      {/* Security line */}
      <div className="flex items-center justify-center gap-1.5 text-gray-400 text-xs font-medium">
        <Lock size={size === "sm" ? 11 : 10} />
        <span>Paiement 100% sécurisé</span>
      </div>
    </div>
  );
}
