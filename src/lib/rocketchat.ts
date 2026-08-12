import { formatMoney, formatPercent } from "@/lib/calc";
import type { PaymentBreakdown, PaymentRequestPayload } from "@/lib/types";

type NotifyRecord = PaymentRequestPayload & {
  id: string;
  createdAt: string;
  breakdown: PaymentBreakdown;
};

function paymentSourceLabel(source: PaymentRequestPayload["paymentSource"]): string {
  return source === "transfer" ? "Перевод на счёт МА" : "С баланса / КЛ";
}

export function buildRocketChatText(record: NotifyRecord): string {
  const b = record.breakdown;
  return [
    `*MyTravelPay · новая заявка* \`${record.id}\``,
    "",
    `*Партнёр:* ${record.partnerCompany}`,
    `*Контакт:* ${record.contactName}`,
    `*Email:* ${record.email}`,
    `*Телефон / Telegram:* ${record.phone}`,
    record.agencyId ? `*ID агентства:* ${record.agencyId}` : null,
    `*Оплата:* ${paymentSourceLabel(record.paymentSource)}`,
    "",
    `*Поставщик:* ${record.supplierName}`,
    `*Страна:* ${record.supplierCountry}`,
    `*Счёт:* ${record.invoiceNumber}${record.invoiceDate ? ` от ${record.invoiceDate}` : ""}`,
    record.invoiceFileName ? `*Файл:* ${record.invoiceFileName}` : null,
    "",
    `*Сумма счёта:* ${formatMoney(b.amount, b.currency)}`,
    `*Курс:* ${b.rate.toLocaleString("ru-RU")} ₽`,
    `*Комиссия МА:* ${formatPercent(b.commissionRate)} → ${formatMoney(b.commissionRub)}`,
    `*Банковский сбор:* ${formatMoney(b.bankFeeRub)}`,
    `*К переводу на МА:* ${formatMoney(b.totalRub)}`,
    record.comment ? `\n*Комментарий:* ${record.comment}` : null,
    `\n_Создано: ${new Date(record.createdAt).toLocaleString("ru-RU", { timeZone: "Europe/Moscow" })} МСК_`,
  ]
    .filter((line) => line !== null)
    .join("\n");
}

/** Отправка в Rocket.Chat Incoming Webhook. Ошибка не роняет заявку. */
export async function notifyRocketChat(record: NotifyRecord): Promise<{
  sent: boolean;
  error?: string;
}> {
  const url = process.env.ROCKETCHAT_WEBHOOK_URL?.trim();
  if (!url) {
    return { sent: false, error: "ROCKETCHAT_WEBHOOK_URL is not set" };
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: buildRocketChatText(record),
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return {
        sent: false,
        error: `Rocket.Chat webhook HTTP ${res.status}${body ? `: ${body.slice(0, 200)}` : ""}`,
      };
    }

    return { sent: true };
  } catch (err) {
    return {
      sent: false,
      error: err instanceof Error ? err.message : "Rocket.Chat webhook failed",
    };
  }
}
