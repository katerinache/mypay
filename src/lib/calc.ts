import type { Currency, PaymentBreakdown } from "./types";

/** Ориентиры курса — партнёр уточняет по Investing / банку. */
export const DEFAULT_RATES: Record<Currency, number> = {
  EUR: 98.5,
  USD: 91.2,
  CNY: 12.6,
  AED: 24.8,
};

export const CURRENCIES: { value: Currency; label: string }[] = [
  { value: "EUR", label: "EUR — евро" },
  { value: "USD", label: "USD — доллары США" },
  { value: "CNY", label: "CNY — юани" },
  { value: "AED", label: "AED — дирхамы ОАЭ" },
];

export const COMMISSION_OPTIONS = [
  { value: 0.02, label: "2% — оборот до 20 млн ₽/мес" },
  { value: 0.015, label: "1,5% — 20–50 млн ₽/мес" },
  { value: 0.013, label: "1,3% — 50–100 млн ₽/мес" },
  { value: 0.01, label: "1% — свыше 100 млн ₽/мес" },
] as const;

const BANK_FEE_RATE = 0.002;
const BANK_FEE_MIN = 3000;
const BANK_FEE_MAX = 18400;

export function clampBankFee(fxRub: number): number {
  const raw = fxRub * BANK_FEE_RATE;
  return Math.min(BANK_FEE_MAX, Math.max(BANK_FEE_MIN, raw));
}

/**
 * Формула из регламента MyTravelPay:
 * сумма / (1 − комиссия МА) × курс + банковский сбор
 * (банковский сбор: 0,2% от суммы платежа, мин 3 000 ₽, макс 18 400 ₽)
 */
export function calculatePayment(input: {
  amount: number;
  currency: Currency;
  rate: number;
  commissionRate: number;
}): PaymentBreakdown | null {
  const { amount, currency, rate, commissionRate } = input;
  if (
    !Number.isFinite(amount) ||
    amount <= 0 ||
    !Number.isFinite(rate) ||
    rate <= 0 ||
    commissionRate <= 0 ||
    commissionRate >= 1
  ) {
    return null;
  }

  const fxRub = amount * rate;
  const grossRub = (amount / (1 - commissionRate)) * rate;
  const commissionRub = grossRub - fxRub;
  const bankFeeRub = clampBankFee(fxRub);
  const totalRub = grossRub + bankFeeRub;

  return {
    amount,
    currency,
    rate,
    commissionRate,
    fxRub,
    commissionRub,
    bankFeeRub,
    totalRub,
  };
}

export function formatMoney(value: number, currency = "RUB", fractionDigits = 2): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

export function formatPercent(rate: number): string {
  return `${(rate * 100).toLocaleString("ru-RU", {
    maximumFractionDigits: 2,
  })}%`;
}
