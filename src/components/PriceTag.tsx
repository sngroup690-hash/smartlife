"use client";

import { useCurrencyStore } from "@/lib/currency-store";

interface Props {
  amount: number;
  className?: string;
  originalAmount?: number;
  originalClassName?: string;
}

export function PriceTag({ amount, className, originalAmount, originalClassName }: Props) {
  const convert = useCurrencyStore((s) => s.convert);
  return (
    <>
      <span className={`whitespace-nowrap${className ? ` ${className}` : ""}`}>{convert(amount)}</span>
      {originalAmount !== undefined && (
        <span className={`whitespace-nowrap${originalClassName ? ` ${originalClassName}` : ""}`}>{convert(originalAmount)}</span>
      )}
    </>
  );
}
