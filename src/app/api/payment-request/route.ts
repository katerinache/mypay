import { mkdir, appendFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { calculatePayment } from "@/lib/calc";
import { findCountryByName } from "@/lib/countries";
import { notifyRocketChat } from "@/lib/rocketchat";
import type { Currency, PaymentRequestPayload } from "@/lib/types";

export const runtime = "nodejs";

function isCurrency(value: unknown): value is Currency {
  return ["EUR", "USD", "CNY", "AED"].includes(String(value));
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<PaymentRequestPayload>;

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
      invoiceFileName: body.invoiceFileName,
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

    const rocket = await notifyRocketChat(record);
    if (!rocket.sent) {
      console.warn("rocketchat-notify", rocket.error);
    }

    return NextResponse.json({
      ok: true,
      id,
      breakdown,
      notified: rocket.sent,
    });
  } catch {
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}
