import { NextResponse } from "next/server";
import { loadExchangeRates } from "@/lib/rates";

export const runtime = "nodejs";
export const revalidate = 300;

export async function GET() {
  try {
    const payload = await loadExchangeRates();
    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Не удалось получить курсы" },
      { status: 502 },
    );
  }
}
