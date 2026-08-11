"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { SectionCard, TextArea, TextInput, TextSelect } from "./Field";
import { CountryAutocomplete } from "./CountryAutocomplete";
import { EstimatePanel } from "./EstimatePanel";
import {
  COMMISSION_OPTIONS,
  CURRENCIES,
  DEFAULT_RATES,
  calculatePayment,
} from "@/lib/calc";
import { findCountryByName } from "@/lib/countries";
import type { RateSource, RatesPayload } from "@/lib/rates";
import type { Currency, PaymentSource } from "@/lib/types";

type Status = "idle" | "loading" | "success" | "error";

interface FormErrors {
  [key: string]: string | undefined;
}

export function PaymentForm() {
  const [currency, setCurrency] = useState<Currency>("EUR");
  const [amount, setAmount] = useState("13657.72");
  const [rate, setRate] = useState(String(DEFAULT_RATES.EUR));
  const [liveRates, setLiveRates] = useState<Record<Currency, number>>(DEFAULT_RATES);
  const [rateSources, setRateSources] = useState<Record<Currency, RateSource>>({
    EUR: "default",
    USD: "default",
    CNY: "default",
    AED: "default",
  });
  const [rateNote, setRateNote] = useState(
    "Запасной ориентир. Итог — банковский курс на день оплаты.",
  );
  const [ratesLoading, setRatesLoading] = useState(true);
  const [rateManual, setRateManual] = useState(false);
  const rateManualRef = useRef(false);
  const currencyRef = useRef<Currency>("EUR");
  const [commissionRate, setCommissionRate] = useState(0.02);
  const [paymentSource, setPaymentSource] = useState<PaymentSource>("balance");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [requestId, setRequestId] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const [invoiceName, setInvoiceName] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadRates() {
      setRatesLoading(true);
      try {
        const res = await fetch("/api/rates");
        if (!res.ok) throw new Error("rates failed");
        const data = (await res.json()) as RatesPayload;
        if (cancelled) return;
        setLiveRates(data.rates);
        setRateSources(data.sources);
        setRateNote(data.note);
        if (!rateManualRef.current) {
          const code = currencyRef.current;
          setRate(String(data.rates[code] ?? DEFAULT_RATES[code]));
        }
      } catch {
        if (!cancelled) {
          setRateNote("Не удалось обновить курс. Используем запасной ориентир.");
        }
      } finally {
        if (!cancelled) setRatesLoading(false);
      }
    }

    void loadRates();
    return () => {
      cancelled = true;
    };
  }, []);

  const breakdown = useMemo(() => {
    const parsedAmount = Number(String(amount).replace(",", "."));
    const parsedRate = Number(String(rate).replace(",", "."));
    return calculatePayment({
      amount: parsedAmount,
      currency,
      rate: parsedRate,
      commissionRate,
    });
  }, [amount, currency, rate, commissionRate]);

  function onCurrencyChange(next: Currency) {
    setCurrency(next);
    currencyRef.current = next;
    rateManualRef.current = false;
    setRateManual(false);
    setRate(String(liveRates[next] ?? DEFAULT_RATES[next]));
  }

  function validate(form: FormData): FormErrors {
    const errors: FormErrors = {};
    const required = [
      "partnerCompany",
      "contactName",
      "email",
      "phone",
      "supplierName",
      "supplierCountry",
      "invoiceNumber",
      "amount",
      "rate",
    ] as const;

    for (const key of required) {
      if (!String(form.get(key) || "").trim()) {
        errors[key] = "Обязательное поле";
      }
    }

    const email = String(form.get("email") || "");
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Некорректный email";
    }

    const parsedAmount = Number(String(form.get("amount") || "").replace(",", "."));
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      errors.amount = "Укажите сумму больше 0";
    }

    const parsedRate = Number(String(form.get("rate") || "").replace(",", "."));
    if (!Number.isFinite(parsedRate) || parsedRate <= 0) {
      errors.rate = "Укажите курс больше 0";
    }

    if (form.get("touristServicesOnly") !== "on") {
      errors.touristServicesOnly = "Подтвердите, что счёт за туруслуги";
    }
    if (form.get("notRestrictedCountry") !== "on") {
      errors.notRestrictedCountry = "Подтвердите допустимую юрисдикцию";
    }
    if (form.get("acceptEstimate") !== "on") {
      errors.acceptEstimate = "Подтвердите ознакомление с расчётом";
    }

    const country = findCountryByName(String(form.get("supplierCountry") || ""));
    if (country?.blocked) {
      errors.supplierCountry = `Платежи в ${country.name} недоступны`;
    }

    return errors;
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setError("");
    setFieldErrors({});

    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    const errors = validate(form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setStatus("idle");
      return;
    }

    if (!breakdown) {
      setError("Не удалось рассчитать сумму. Проверьте сумму и курс.");
      setStatus("error");
      return;
    }

    const payload = {
      partnerCompany: String(form.get("partnerCompany") || "").trim(),
      contactName: String(form.get("contactName") || "").trim(),
      email: String(form.get("email") || "").trim(),
      phone: String(form.get("phone") || "").trim(),
      agencyId: String(form.get("agencyId") || "").trim() || undefined,
      supplierName: String(form.get("supplierName") || "").trim(),
      supplierCountry: String(form.get("supplierCountry") || "").trim(),
      invoiceNumber: String(form.get("invoiceNumber") || "").trim(),
      invoiceDate: String(form.get("invoiceDate") || "").trim() || undefined,
      amount: breakdown.amount,
      currency,
      rate: breakdown.rate,
      commissionRate,
      paymentSource,
      comment: String(form.get("comment") || "").trim() || undefined,
      touristServicesOnly: true,
      notRestrictedCountry: true,
      acceptEstimate: true,
      invoiceFileName: invoiceName || undefined,
      breakdown,
    };

    try {
      const res = await fetch("/api/payment-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Не удалось отправить заявку");
      }
      setRequestId(data.id || "");
      setStatus("success");
      formEl.reset();
      setRate(String(liveRates[currency] ?? DEFAULT_RATES[currency]));
      setInvoiceName("");
      setAmount("");
      rateManualRef.current = false;
      setRateManual(false);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Ошибка отправки");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-[1.35rem] border border-success/20 bg-success/10 p-6 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-success">Заявка принята</p>
        <h2 className="mt-2 font-display text-2xl text-neutral-900 sm:text-3xl">
          Мы рассчитаем финальную сумму и согласуем оплату
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-neutral-700">
          Заявка сохранена{requestId ? ` под номером ${requestId}` : ""}. Дальше менеджер
          MyTravelPay согласует сумму в мессенджере и спишет средства с баланса или дождётся
          перевода.
        </p>
        <button
          type="button"
          className="mt-6 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-dark"
          onClick={() => {
            setStatus("idle");
            setRequestId("");
            setAmount("13657.72");
            setRate(String(liveRates.EUR ?? DEFAULT_RATES.EUR));
            setCurrency("EUR");
            currencyRef.current = "EUR";
            setCommissionRate(0.02);
            rateManualRef.current = false;
            setRateManual(false);
          }}
        >
          Создать ещё одну заявку
        </button>
      </div>
    );
  }

  return (
    <form
      id="payment-form"
      className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]"
      onSubmit={onSubmit}
    >
      <div className="space-y-5">
        <SectionCard
          step={1}
          title="Сколько это будет стоить"
          subtitle="Сначала посмотрите ориентир в рублях — детали счёта можно заполнить ниже"
        >
          <div className="grid gap-3.5 sm:grid-cols-2">
            <TextInput
              label="Сумма счёта"
              name="amount"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              error={fieldErrors.amount}
              suffix={currency}
            />
            <TextSelect
              label="Валюта"
              name="currency"
              required
              value={currency}
              onChange={(e) => onCurrencyChange(e.target.value as Currency)}
            >
              {CURRENCIES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </TextSelect>
            <TextInput
              label="Курс к рублю"
              name="rate"
              inputMode="decimal"
              value={rate}
              onChange={(e) => {
                rateManualRef.current = true;
                setRateManual(true);
                setRate(e.target.value);
              }}
              required
              error={fieldErrors.rate}
              hint={
                ratesLoading
                  ? "Загружаем курс BCC…"
                  : rateSources[currency] === "bcc"
                    ? "Курс BCC FX — покупка валюты за ₽. Можно поправить вручную"
                    : rateSources[currency] === "cbr"
                      ? "Курс ЦБ РФ (если BCC не отдал пару). Можно поправить вручную"
                      : "Запасной ориентир. Можно поправить вручную"
              }
              suffix="₽"
            />
            <TextSelect
              label="Комиссия МА"
              name="commissionRate"
              value={commissionRate}
              onChange={(e) => setCommissionRate(Number(e.target.value))}
            >
              {COMMISSION_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </TextSelect>
          </div>
        </SectionCard>

        <SectionCard
          step={2}
          title="Счёт поставщика"
          subtitle="Счёт должен быть выставлен на реквизиты Смартфлай Казахстан"
        >
          <div className="grid gap-3.5 sm:grid-cols-2">
            <TextInput
              label="Поставщик"
              name="supplierName"
              required
              error={fieldErrors.supplierName}
            />
            <CountryAutocomplete
              label="Страна поставщика"
              name="supplierCountry"
              required
              error={fieldErrors.supplierCountry}
              hint="Начните вводить название — Гонконг недоступен для платежей"
            />
            <TextInput
              label="Номер счёта"
              name="invoiceNumber"
              required
              error={fieldErrors.invoiceNumber}
            />
            <TextInput label="Дата счёта" name="invoiceDate" type="date" />

            <div className="sm:col-span-2">
              <p className="mb-2 px-1 text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-neutral-400">
                Файл счёта
              </p>
              <label className={`file-drop ${invoiceName ? "has-file" : ""}`}>
                <input
                  name="invoiceFile"
                  type="file"
                  accept=".pdf,image/*"
                  onChange={(e) => setInvoiceName(e.target.files?.[0]?.name || "")}
                />
                <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
                  {invoiceName ? "Файл выбран" : "Перетащите или выберите файл"}
                </span>
                <span className="text-sm font-medium text-neutral-800">
                  {invoiceName || "PDF или изображение счёта"}
                </span>
                <span className="text-xs text-neutral-400">
                  На этом этапе сохраняется имя файла
                </span>
              </label>
            </div>

            <TextArea
              className="sm:col-span-2"
              label="Комментарий"
              name="comment"
              rows={3}
            />
          </div>
        </SectionCard>

        <SectionCard
          step={3}
          title="Партнёр"
          subtitle="Контакты для согласования суммы и статуса платежа"
        >
          <div className="grid gap-3.5 sm:grid-cols-2">
            <TextInput
              label="Компания"
              name="partnerCompany"
              required
              autoComplete="organization"
              error={fieldErrors.partnerCompany}
            />
            <TextInput
              label="Контактное лицо"
              name="contactName"
              required
              autoComplete="name"
              error={fieldErrors.contactName}
            />
            <TextInput
              label="Email"
              name="email"
              type="email"
              required
              autoComplete="email"
              error={fieldErrors.email}
            />
            <TextInput
              label="Телефон / Telegram"
              name="phone"
              type="tel"
              required
              autoComplete="tel"
              error={fieldErrors.phone}
            />
            <TextInput
              label="ID агентства в МА"
              name="agencyId"
              autoComplete="off"
              hint="Если есть — ускорит поиск договора и баланса"
            />
            <div>
              <p className="mb-2 px-1 text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-neutral-400">
                Источник оплаты
              </p>
              <div className="segmented" role="group" aria-label="Источник оплаты">
                <button
                  type="button"
                  className={`segmented-option ${paymentSource === "balance" ? "is-active" : ""}`}
                  onClick={() => setPaymentSource("balance")}
                >
                  С баланса / КЛ
                </button>
                <button
                  type="button"
                  className={`segmented-option ${paymentSource === "transfer" ? "is-active" : ""}`}
                  onClick={() => setPaymentSource("transfer")}
                >
                  Перевод на МА
                </button>
              </div>
              <input type="hidden" name="paymentSource" value={paymentSource} />
            </div>
          </div>
        </SectionCard>

        <SectionCard step={4} title="Подтверждения">
          <div className="space-y-2.5 text-sm text-neutral-700">
            <Checkbox
              name="touristServicesOnly"
              error={fieldErrors.touristServicesOnly}
              label="Счёт выставлен только за туристические услуги"
            />
            <Checkbox
              name="notRestrictedCountry"
              error={fieldErrors.notRestrictedCountry}
              label="Поставщик не в запрещённой юрисдикции (в т.ч. не Гонконг)"
            />
            <Checkbox
              name="acceptEstimate"
              error={fieldErrors.acceptEstimate}
              label="Понимаю, что расчёт предварительный и сумма будет согласована отдельно"
            />
          </div>

          {status === "error" ? (
            <p className="mt-4 text-sm text-error" role="alert">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={status === "loading"}
            className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-accent px-4 py-3.5 text-sm font-semibold text-white shadow-[0_12px_28px_-14px_rgba(249,105,41,0.9)] transition hover:bg-accent-dark disabled:opacity-60 sm:w-auto sm:min-w-56"
          >
            {status === "loading" ? "Отправляем…" : "Отправить заявку на оплату"}
          </button>
        </SectionCard>
      </div>

      <div className="lg:sticky lg:top-20 lg:self-start">
        <EstimatePanel
          breakdown={breakdown}
          rateMeta={{
            source: rateManual ? "default" : rateSources[currency],
            loading: ratesLoading,
            note: rateNote,
          }}
        />
      </div>
    </form>
  );
}

function Checkbox({
  name,
  label,
  error,
}: {
  name: string;
  label: string;
  error?: string;
}) {
  return (
    <div>
      <label className="check-card">
        <input type="checkbox" name={name} />
        <span className="check-mark" aria-hidden>
          ✓
        </span>
        <span className="leading-snug">{label}</span>
      </label>
      {error ? (
        <p className="mt-1 px-1 text-xs text-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
