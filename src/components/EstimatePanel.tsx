"use client";

import type { PaymentBreakdown } from "@/lib/types";
import { formatMoney, formatPercent } from "@/lib/calc";
import type { RateSource } from "@/lib/rates";

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
          Укажите сумму счёта и валюту — здесь появится ориентир в рублях с учётом комиссии МА
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
        : "запасной ориентир";

  return (
    <aside className="overflow-hidden rounded-2xl border border-primary/15 bg-white shadow-sm">
      <div className="bg-gradient-to-br from-primary to-primary-dark px-5 py-5 text-white sm:px-6">
        <p className="text-sm font-medium text-white/80">К переводу на счёт МА</p>
        <p className="mt-1 font-display text-3xl tracking-tight sm:text-4xl">
          {formatMoney(breakdown.totalRub)}
        </p>
        <p className="mt-2 text-xs text-white/75">
          Ориентир. Финальная сумма согласовывается по банковскому курсу на день оплаты.
        </p>
      </div>

      <dl className="space-y-3 px-5 py-5 text-sm sm:px-6">
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
          <Row label="Итого к оплате" value={formatMoney(breakdown.totalRub)} strong />
        </div>
      </dl>

      <div className="border-t border-neutral-100 bg-neutral-50 px-5 py-4 text-xs leading-relaxed text-neutral-600 sm:px-6">
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
    <div className="flex items-start justify-between gap-4">
      <dt className={strong ? "font-semibold text-neutral-900" : "text-neutral-600"}>{label}</dt>
      <dd
        className={`shrink-0 text-right tabular-nums ${
          strong ? "font-semibold text-neutral-900" : "text-neutral-800"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
