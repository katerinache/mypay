import type { Currency } from "./types";
import { DEFAULT_RATES } from "./calc";

export type RateSource = "bcc" | "cbr" | "default";

export type RatesPayload = {
  rates: Record<Currency, number>;
  sources: Record<Currency, RateSource>;
  asOf: string | null;
  primarySource: "bcc" | "cbr" | "default";
  note: string;
};

const BCC_URL = "https://www.bcc.kz/personal/currency-rates/";
const CBR_URL = "https://www.cbr-xml-daily.ru/daily_json.js";
const CURRENCY_KEYS: Currency[] = ["EUR", "USD", "CNY", "AED"];

function roundRate(value: number): number {
  return Math.round(value * 10000) / 10000;
}

function decodeHtmlEntities(html: string): string {
  return html
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex: string) =>
      String.fromCharCode(Number.parseInt(hex, 16)),
    );
}

/**
 * Прямые пары FX/RUB из FX-виджета BCC.
 * Берём buy (покупка валюты клиентом) — консервативнее для оценки суммы в ₽.
 */
function extractBccRubRates(html: string): {
  rates: Partial<Record<Currency, number>>;
  asOf: string | null;
} {
  const text = decodeHtmlEntities(html);
  const rates: Partial<Record<Currency, number>> = {};
  let asOf: string | null = null;

  const pairRe =
    /\{"currencyPairId":\d+,"currencySell":"([A-Z]+)","currencyBuy":"([A-Z]+)","currencyMain":"([A-Z]+)","currencyMinor":"([A-Z]+)","currencyName":"(?:\\.|[^"\\])*","pictureUrlMain":"(?:\\.|[^"\\])*","pictureUrlMinor":"(?:\\.|[^"\\])*","sell":([0-9.]+),"buy":([0-9.]+),"lastUpdateDateTime":"([^"]+)"/g;

  for (const match of text.matchAll(pairRe)) {
    const main = match[3] as Currency | string;
    const minor = match[4];
    const sell = Number(match[5]);
    const buy = Number(match[6]);
    const updated = match[7];

    if (minor !== "RUB") continue;
    if (!CURRENCY_KEYS.includes(main as Currency)) continue;
    if (!Number.isFinite(buy) || buy <= 0 || !Number.isFinite(sell) || sell <= 0) continue;

    rates[main as Currency] = roundRate(buy);
    asOf = updated;
  }

  return { rates, asOf };
}

async function fetchBccRubRates(): Promise<{
  rates: Partial<Record<Currency, number>>;
  asOf: string | null;
} | null> {
  try {
    const res = await fetch(BCC_URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; MyTravelPay/1.0; +https://myagent.online)",
        Accept: "text/html,application/xhtml+xml",
      },
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const html = await res.text();
    const parsed = extractBccRubRates(html);
    if (Object.keys(parsed.rates).length === 0) return null;
    return parsed;
  } catch {
    return null;
  }
}

async function fetchCbrRubRates(): Promise<Partial<Record<Currency, number>> | null> {
  try {
    const res = await fetch(CBR_URL, {
      headers: { Accept: "application/json" },
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      Valute?: Record<string, { Value: number; Nominal: number }>;
    };
    const out: Partial<Record<Currency, number>> = {};
    for (const code of CURRENCY_KEYS) {
      const row = data.Valute?.[code];
      if (!row?.Value || !row.Nominal) continue;
      out[code] = roundRate(row.Value / row.Nominal);
    }
    return out;
  } catch {
    return null;
  }
}

export async function loadExchangeRates(): Promise<RatesPayload> {
  const [bcc, cbr] = await Promise.all([fetchBccRubRates(), fetchCbrRubRates()]);

  const rates = { ...DEFAULT_RATES };
  const sources: Record<Currency, RateSource> = {
    EUR: "default",
    USD: "default",
    CNY: "default",
    AED: "default",
  };

  let bccCount = 0;
  if (bcc) {
    for (const code of CURRENCY_KEYS) {
      const value = bcc.rates[code];
      if (!value) continue;
      rates[code] = value;
      sources[code] = "bcc";
      bccCount += 1;
    }
  }

  if (cbr) {
    for (const code of CURRENCY_KEYS) {
      if (sources[code] === "bcc") continue;
      const value = cbr[code];
      if (!value) continue;
      rates[code] = value;
      sources[code] = "cbr";
    }
  }

  const primarySource =
    bccCount > 0 ? "bcc" : Object.values(sources).some((s) => s === "cbr") ? "cbr" : "default";

  const note =
    primarySource === "bcc"
      ? "Курс BCC FX (покупка валюты за ₽). Итог — банковский курс на день оплаты."
      : primarySource === "cbr"
        ? "Курс ЦБ РФ. Итог — банковский курс на день оплаты."
        : "Запасной предварительный расчёт. Итог — банковский курс на день оплаты.";

  return {
    rates,
    sources,
    asOf: bcc?.asOf ?? null,
    primarySource,
    note,
  };
}

export { BCC_URL };
