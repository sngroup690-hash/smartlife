import type { Metadata } from "next";
import ArreterClient from "./ArreterClient";

export const metadata: Metadata = {
  title: "Ne plus recevoir les nouveautés | Smart Life",
  robots: { index: false, follow: false },
};

export default async function ArreterPage({ searchParams }: { searchParams: Promise<{ j?: string }> }) {
  const { j } = await searchParams;
  return <ArreterClient jeton={typeof j === "string" ? j.slice(0, 64) : ""} />;
}
