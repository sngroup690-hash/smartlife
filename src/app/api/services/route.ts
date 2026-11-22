import { NextResponse } from "next/server";
import { getEnabledDynamicServices } from "@/lib/services-data";

export async function GET() {
  try {
    return NextResponse.json(await getEnabledDynamicServices());
  } catch {
    return NextResponse.json([]);
  }
}
