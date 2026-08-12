"use client";

import type { PaymentBreakdown } from "@/lib/types";
import { formatMoney, formatPercent } from "@/lib/calc";
import type { RateSource } from "@/lib/rates";

function totalAmountClass(formatted: string): string {
  const len = formatted.replace(/\s/g, "").length;
  if (len >= 16) return "text-xl sm:text-2xl";
  if (len >= 14) return "text-2xl sm:text-3xl";
  if (len >= 12) return "text-[1.65rem] leading-tight sm:text-3xl";
  return "text-3xl sm:text-4xl";
}

export function EstimatePanel({
  breakdown,
  rateMeta,
}: {
  breakdown: PaymentBreakdown | null;
  rateMeta?: {
    source: RateSource;
    loading: boolean;
    note: string;
  };
}) {
  if (!breakdown) {
    return (
      <aside className="rounded-2xl border border-dashed border-neutral-200 bg-white/70 p-5 sm:p-6">
        <p className="text-sm font-medium text-primary">Предварительный расчёт</p>
        <h2 className="mt-1 font-display text-xl text-neutral-900">Сумма к переводу</h2>
        <p className="mt-3 text-sm leading-relaxed text-neutral-600">
          Укажите сумму счёта и валюту — здесь появится предварительный расчёт в рублях с учётом комиссии МА
          2% и банковских расходов.
        </p>
      </aside>
    );
  }

  const sourceLabel =
    rateMeta?.source === "bcc"
      ? "BCC FX (покупка)"
      : rateMeta?.source === "cbr"
        ? "ЦБ РФ"
        : "запасной курс";

  const totalFormatted = formatMoney(breakdown.totalRub);

  return (
    <aside className="overflow-hidden rounded-2xl border border-primary/15 bg-white shadow-sm">
      <div className="bg-gradient-to-br from-primary to-primary-dark px-4 py-5 text-white sm:px-6">
        <p className="text-sm font-medium text-white/80">К переводу на счёт МА</p>
        <p
          className={`mt-1 font-display tracking-tight break-words [overflow-wrap:anywhere] ${totalAmountClass(totalFormatted)}`}
        >
          {totalFormatted}
        </p>
        <p className="mt-2 text-xs text-white/75">
          Предварительный расчёт. Финальная сумма согласовывается по банковскому курсу на день оплаты.
        </p>
      </div>

      <dl className="space-y-3 px-4 py-5 text-sm sm:px-6">
        <Row
          label={`Счёт поставщика (${breakdown.currency})`}
          value={formatMoney(breakdown.amount, breakdown.currency)}
        />
        <Row
          label={`Курс${rateMeta?.loading ? " (обновляем…)" : ""}`}
          value={`${breakdown.rate.toLocaleString("ru-RU")} ₽`}
        />
        <Row label="Источник курса" value={sourceLabel} />
        <Row label="Эквивалент без комиссии" value={formatMoney(breakdown.fxRub)} />
        <Row
          label={`Комиссия МА (${formatPercent(breakdown.commissionRate)})`}
          value={formatMoney(breakdown.commissionRub)}
        />
        <Row
          label="Банковский сбор (0,2%, мин 3 000 ₽)"
          value={formatMoney(breakdown.bankFeeRub)}
        />
        <div className="border-t border-neutral-100 pt-3">
          <Row label="Итого к оплате" value={totalFormatted} strong />
        </div>
      </dl>

      <div className="border-t border-neutral-100 bg-neutral-50 px-4 py-4 text-xs leading-relaxed text-neutral-600 sm:px-6">
        {rateMeta?.note || "Рекомендуем переводить с небольшим запасом."}{" "}
        <a
          className="font-medium text-link underline-offset-2 hover:underline"
          href="https://www.bcc.kz/personal/currency-rates/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Курсы BCC
        </a>
        .
      </div>
    </aside>
  );
}

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
      <dt
        className={`min-w-0 max-w-[55%] text-pretty ${
          strong ? "font-semibold text-neutral-900" : "text-neutral-600"
        }`}
      >
        {label}
      </dt>
      <dd
        className={`min-w-0 flex-1 text-right tabular-nums break-words [overflow-wrap:anywhere] ${
          strong ? "font-semibold text-neutral-900" : "text-neutral-800"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
