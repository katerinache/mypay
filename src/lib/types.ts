export type Currency = "EUR" | "USD" | "CNY" | "AED";

export type PaymentSource = "balance" | "transfer";

export type CommissionTier = 0.02 | 0.015 | 0.013 | 0.01;

export interface PaymentBreakdown {
  amount: number;
  currency: Currency;
  rate: number;
  commissionRate: number;
  fxRub: number;
  commissionRub: number;
  bankFeeRub: number;
  totalRub: number;
}

export interface PaymentRequestPayload {
  partnerCompany: string;
  contactName: string;
  email: string;
  phone: string;
  agencyId?: string;
  supplierName: string;
  supplierCountry: string;
  invoiceNumber: string;
  invoiceDate?: string;
  amount: number;
  currency: Currency;
  rate: number;
  commissionRate: number;
  paymentSource: PaymentSource;
  comment?: string;
  touristServicesOnly: boolean;
  notRestrictedCountry: boolean;
  acceptEstimate: boolean;
  invoiceFileName?: string;
  breakdown: PaymentBreakdown;
}
