const STEPS = [
  {
    id: 1,
    title: "Заявка",
    desc: "Партнёр отправляет счёт и данные платежа",
  },
  {
    id: 2,
    title: "Расчёт",
    desc: "МА считает сумму в ₽: курс, комиссия, банк",
  },
  {
    id: 3,
    title: "Согласование",
    desc: "Фиксируем итоговую сумму в мессенджере",
  },
  {
    id: 4,
    title: "Поступление ₽",
    desc: "Списание с баланса / КЛ или перевод на МА",
  },
  {
    id: 5,
    title: "Оплата",
    desc: "МА → СМ КЗ → иностранный поставщик",
  },
] as const;

export function PaymentFlowSteps() {
  return (
    <nav aria-label="Путь оплаты" className="flow-board animate-rise-delay-1">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-primary">
            Как проходит оплата
          </p>
          <p className="mt-1 text-sm text-neutral-600">
            От заявки до платежа поставщику — 5 шагов
          </p>
        </div>
        <p className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
          Сейчас: шаг 1 · заявка
        </p>
      </div>

      <ol className="flow-track">
        {STEPS.map((step, index) => (
          <li
            key={step.id}
            className={`flow-step ${step.id === 1 ? "is-current" : ""}`}
          >
            {index > 0 ? <span className="flow-connector" aria-hidden /> : null}
            <div className="flow-card">
              <div className="flow-index" aria-hidden>
                {step.id}
              </div>
              <div>
                <p className="flow-title">{step.title}</p>
                <p className="flow-desc">{step.desc}</p>
              </div>
            </div>
          </li>
        ))}
      </ol>

      <p className="mt-4 text-xs leading-relaxed text-neutral-400">
        Счёт до 14:00 МСК в рабочий день оплачивается в тот же день. Учитывайте праздники РФ и
        Казахстана.
      </p>
    </nav>
  );
}
