import { formatMoney, formatPercent } from "@/lib/calc";
import type { PaymentBreakdown, PaymentRequestPayload } from "@/lib/types";

type NotifyRecord = PaymentRequestPayload & {
  id: string;
  createdAt: string;
  breakdown: PaymentBreakdown;
};

export type InvoiceFile = {
  name: string;
  type: string;
  size: number;
  bytes: ArrayBuffer;
};

const MAX_INVOICE_BYTES = 8 * 1024 * 1024;

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

function authHeaders(): Record<string, string> | null {
  const userId = process.env.ROCKETCHAT_USER_ID?.trim();
  const token = process.env.ROCKETCHAT_AUTH_TOKEN?.trim();
  if (!userId || !token) return null;
  return {
    "X-User-Id": userId,
    "X-Auth-Token": token,
  };
}

function baseUrl(): string | null {
  const url = process.env.ROCKETCHAT_URL?.trim().replace(/\/+$/, "");
  return url || null;
}

async function resolveRoomId(base: string, headers: Record<string, string>): Promise<string | null> {
  const direct = process.env.ROCKETCHAT_ROOM_ID?.trim();
  if (direct) return direct;

  const channel = process.env.ROCKETCHAT_CHANNEL?.trim().replace(/^#/, "");
  if (!channel) return null;

  const endpoints = [
    `/api/v1/channels.info?roomName=${encodeURIComponent(channel)}`,
    `/api/v1/groups.info?roomName=${encodeURIComponent(channel)}`,
  ];

  for (const path of endpoints) {
    const res = await fetch(`${base}${path}`, { headers });
    if (!res.ok) continue;
    const data = (await res.json().catch(() => null)) as {
      channel?: { _id?: string };
      group?: { _id?: string };
    } | null;
    const id = data?.channel?._id || data?.group?._id;
    if (id) return id;
  }

  return null;
}

async function uploadViaLegacy(
  base: string,
  headers: Record<string, string>,
  roomId: string,
  file: InvoiceFile,
  message: string,
): Promise<{ ok: boolean; status: number; body: string }> {
  const form = new FormData();
  form.append("file", new Blob([file.bytes], { type: file.type || "application/octet-stream" }), file.name);
  form.append("msg", message);

  const res = await fetch(`${base}/api/v1/rooms.upload/${roomId}`, {
    method: "POST",
    headers,
    body: form,
  });
  const body = await res.text().catch(() => "");
  return { ok: res.ok, status: res.status, body };
}

async function uploadViaMedia(
  base: string,
  headers: Record<string, string>,
  roomId: string,
  file: InvoiceFile,
  message: string,
): Promise<{ ok: boolean; status: number; body: string }> {
  const form = new FormData();
  form.append("file", new Blob([file.bytes], { type: file.type || "application/octet-stream" }), file.name);

  const uploadRes = await fetch(`${base}/api/v1/rooms.media/${roomId}`, {
    method: "POST",
    headers,
    body: form,
  });
  const uploadBody = await uploadRes.text().catch(() => "");
  if (!uploadRes.ok) {
    return { ok: false, status: uploadRes.status, body: uploadBody };
  }

  let fileId = "";
  try {
    const parsed = JSON.parse(uploadBody) as { file?: { _id?: string } };
    fileId = parsed.file?._id || "";
  } catch {
    fileId = "";
  }
  if (!fileId) {
    return { ok: false, status: uploadRes.status, body: "rooms.media: missing file._id" };
  }

  const confirmRes = await fetch(`${base}/api/v1/rooms.mediaConfirm/${roomId}/${fileId}`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ msg: message }),
  });
  const confirmBody = await confirmRes.text().catch(() => "");
  return { ok: confirmRes.ok, status: confirmRes.status, body: confirmBody };
}

async function sendWebhook(text: string): Promise<{ sent: boolean; error?: string }> {
  const url = process.env.ROCKETCHAT_WEBHOOK_URL?.trim();
  if (!url) {
    return { sent: false, error: "ROCKETCHAT_WEBHOOK_URL is not set" };
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
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

async function sendWithFile(
  record: NotifyRecord,
  file: InvoiceFile,
): Promise<{ sent: boolean; error?: string }> {
  const base = baseUrl();
  const headers = authHeaders();
  if (!base || !headers) {
    return {
      sent: false,
      error:
        "File upload needs ROCKETCHAT_URL, ROCKETCHAT_USER_ID, ROCKETCHAT_AUTH_TOKEN and ROCKETCHAT_CHANNEL (or ROCKETCHAT_ROOM_ID)",
    };
  }

  if (file.size > MAX_INVOICE_BYTES) {
    return { sent: false, error: `Invoice file exceeds ${MAX_INVOICE_BYTES} bytes` };
  }

  const roomId = await resolveRoomId(base, headers);
  if (!roomId) {
    return {
      sent: false,
      error: "Could not resolve Rocket.Chat room (set ROCKETCHAT_ROOM_ID or ROCKETCHAT_CHANNEL)",
    };
  }

  const message = buildRocketChatText(record);
  const legacy = await uploadViaLegacy(base, headers, roomId, file, message);
  if (legacy.ok) return { sent: true };

  // Newer RC versions removed rooms.upload — use rooms.media + mediaConfirm.
  if (legacy.status === 404 || legacy.status === 405 || /deprecated|not found/i.test(legacy.body)) {
    const media = await uploadViaMedia(base, headers, roomId, file, message);
    if (media.ok) return { sent: true };
    return {
      sent: false,
      error: `Rocket.Chat media upload HTTP ${media.status}: ${media.body.slice(0, 200)}`,
    };
  }

  return {
    sent: false,
    error: `Rocket.Chat upload HTTP ${legacy.status}: ${legacy.body.slice(0, 200)}`,
  };
}

/** Отправка в Rocket.Chat. Ошибка не роняет заявку. */
export async function notifyRocketChat(
  record: NotifyRecord,
  file?: InvoiceFile | null,
): Promise<{ sent: boolean; fileSent: boolean; error?: string }> {
  const text = buildRocketChatText(record);

  if (file) {
    const withFile = await sendWithFile(record, file);
    if (withFile.sent) {
      return { sent: true, fileSent: true };
    }

    // Текст всё равно уходит webhook'ом, чтобы заявка не потерялась.
    const webhook = await sendWebhook(
      `${text}\n\n_Файл «${file.name}» не удалось приложить: ${withFile.error}_`,
    );
    return {
      sent: webhook.sent,
      fileSent: false,
      error: withFile.error || webhook.error,
    };
  }

  const webhook = await sendWebhook(text);
  return { sent: webhook.sent, fileSent: false, error: webhook.error };
}

export async function readInvoiceFile(file: File): Promise<InvoiceFile | null> {
  if (!file.size) return null;
  if (file.size > MAX_INVOICE_BYTES) {
    throw new Error("Файл счёта слишком большой (макс. 8 МБ)");
  }
  return {
    name: file.name,
    type: file.type || "application/octet-stream",
    size: file.size,
    bytes: await file.arrayBuffer(),
  };
}
