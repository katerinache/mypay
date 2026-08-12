import { mkdir, appendFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { calculatePayment } from "@/lib/calc";
import { findCountryByName } from "@/lib/countries";
import { notifyRocketChat, readInvoiceFile, type InvoiceFile } from "@/lib/rocketchat";
import type { Currency, PaymentRequestPayload } from "@/lib/types";

export const runtime = "nodejs";

export const maxDuration = 30;

function isCurrency(value: unknown): value is Currency {
  return ["EUR", "USD", "CNY", "AED"].includes(String(value));
}

async function parseRequest(request: Request): Promise<{
  body: Partial<PaymentRequestPayload>;
  invoiceFile: InvoiceFile | null;
}> {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const rawPayload = form.get("payload");
    if (typeof rawPayload !== "string" || !rawPayload.trim()) {
      throw new Error("MISSING_PAYLOAD");
    }
    const body = JSON.parse(rawPayload) as Partial<PaymentRequestPayload>;
    const rawFile = form.get("invoiceFile");
    const invoiceFile =
      rawFile instanceof File ? await readInvoiceFile(rawFile) : null;
    return { body, invoiceFile };
  }

  const body = (await request.json()) as Partial<PaymentRequestPayload>;
  return { body, invoiceFile: null };
}

export async function POST(request: Request) {
  try {
    let body: Partial<PaymentRequestPayload>;
    let invoiceFile: InvoiceFile | null;

    try {
      ({ body, invoiceFile } = await parseRequest(request));
    } catch (err) {
      if (err instanceof Error && err.message === "MISSING_PAYLOAD") {
        return NextResponse.json({ error: "Некорректные данные заявки" }, { status: 400 });
      }
      if (err instanceof Error && err.message.includes("слишком большой")) {
        return NextResponse.json({ error: err.message }, { status: 400 });
      }
      throw err;
    }

    const required = [
      "partnerCompany",
      "contactName",
      "email",
      "phone",
      "supplierName",
      "supplierCountry",
      "invoiceNumber",
    ] as const;

    for (const key of required) {
      if (!String(body[key] || "").trim()) {
        return NextResponse.json({ error: `Заполните поле: ${key}` }, { status: 400 });
      }
    }

    if (!isCurrency(body.currency)) {
      return NextResponse.json({ error: "Некорректная валюта" }, { status: 400 });
    }

    const country = findCountryByName(String(body.supplierCountry || ""));
    if (country?.blocked) {
      return NextResponse.json(
        { error: `Платежи в ${country.name} недоступны` },
        { status: 400 },
      );
    }

    const amount = Number(body.amount);
    const rate = Number(body.rate);
    const commissionRate = Number(body.commissionRate);

    const breakdown = calculatePayment({
      amount,
      currency: body.currency,
      rate,
      commissionRate,
    });

    if (!breakdown) {
      return NextResponse.json({ error: "Некорректные сумма, курс или комиссия" }, { status: 400 });
    }

    if (!body.touristServicesOnly || !body.notRestrictedCountry || !body.acceptEstimate) {
      return NextResponse.json(
        { error: "Нужно подтвердить условия оплаты" },
        { status: 400 },
      );
    }

    const id = `MTP-${Date.now().toString(36).toUpperCase()}`;
    const invoiceFileName = invoiceFile?.name || body.invoiceFileName;
    const record = {
      id,
      createdAt: new Date().toISOString(),
      partnerCompany: String(body.partnerCompany).trim(),
      contactName: String(body.contactName).trim(),
      email: String(body.email).trim(),
      phone: String(body.phone).trim(),
      agencyId: body.agencyId,
      supplierName: String(body.supplierName).trim(),
      supplierCountry: String(body.supplierCountry).trim(),
      invoiceNumber: String(body.invoiceNumber).trim(),
      invoiceDate: body.invoiceDate,
      amount: breakdown.amount,
      currency: body.currency,
      rate: breakdown.rate,
      commissionRate: breakdown.commissionRate,
      paymentSource: body.paymentSource === "transfer" ? ("transfer" as const) : ("balance" as const),
      comment: body.comment,
      touristServicesOnly: true,
      notRestrictedCountry: true,
      acceptEstimate: true,
      invoiceFileName,
      breakdown,
      status: "submitted",
    };

    try {
      const dataDir = path.join(process.cwd(), "data");
      await mkdir(dataDir, { recursive: true });
      await appendFile(
        path.join(dataDir, "payment-requests.jsonl"),
        `${JSON.stringify(record)}\n`,
        "utf8",
      );
    } catch {
      // На serverless (Vercel) файловая запись может быть недоступна — заявка всё равно принята.
      console.info("payment-request", JSON.stringify(record));
    }

    const rocket = await notifyRocketChat(record, invoiceFile);
    if (!rocket.sent || rocket.error) {
      console.warn("rocketchat-notify", rocket.error);
    }

    return NextResponse.json({
      ok: true,
      id,
      breakdown,
      notified: rocket.sent,
      fileSent: rocket.fileSent,
    });
  } catch {
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}
