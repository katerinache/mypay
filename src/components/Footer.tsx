import { Logo } from "./Logo";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-neutral-200 bg-neutral-900 text-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.4fr_1fr]">
        <div>
          <Logo onDark />
          <p className="mt-4 max-w-md text-sm leading-relaxed text-neutral-400">
            MyTravelPay — безналичная оплата туристических услуг иностранным поставщикам через
            контур Мой Агент и Смартфлай Казахстан.
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
            Важно
          </p>
          <ul className="mt-4 space-y-2 text-sm text-neutral-300">
            <li>Оплата до 14:00 МСК — в тот же рабочий день</li>
            <li>Нельзя перечислять в Гонконг</li>
            <li>Только счета за туристические услуги</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 text-xs text-neutral-500 sm:px-6">
          <p>© {year} Мой Агент · MyTravelPay</p>
          <p>Предварительный расчёт. Итоговый курс — банковский на день оплаты.</p>
        </div>
      </div>
    </footer>
  );
}
