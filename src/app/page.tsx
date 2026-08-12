import { PaymentForm } from "@/components/PaymentForm";
import { PaymentFlowSteps } from "@/components/PaymentFlowSteps";

export default function HomePage() {
  return (
    <div className="hero-plane relative overflow-hidden">
      <div className="grid-fade pointer-events-none absolute inset-0" aria-hidden />

      <section className="relative mx-auto max-w-6xl px-4 pb-8 pt-10 sm:px-6 sm:pt-14">
        <div className="max-w-3xl animate-rise">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">
            MyTravelPay · этап 1
          </p>
          <h1 className="mt-3 font-display text-3xl text-neutral-900 sm:text-5xl">
            Заявка на оплату поставщику
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-neutral-600 sm:text-lg">
            Сначала укажите сумму счёта — сразу увидите предварительный расчёт в рублях с комиссией и банковским
            сбором. Затем добавьте данные поставщика и контакты для согласования платежа.
          </p>
        </div>

        <PaymentFlowSteps />
      </section>

      <section className="relative mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <div className="animate-rise-delay-2">
          <PaymentForm />
        </div>
      </section>
    </div>
  );
}
