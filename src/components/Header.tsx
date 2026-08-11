import { Logo } from "./Logo";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-neutral-100/80 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <Logo />
          <span className="hidden h-5 w-px bg-neutral-200 sm:block" aria-hidden />
          <span className="hidden text-sm font-semibold text-neutral-600 sm:inline">
            MyTravelPay
          </span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <a
            href="https://myagent.online"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-800 transition hover:border-primary hover:text-primary"
          >
            myagent.online
          </a>
          <a
            href="#payment-form"
            className="rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-white transition hover:bg-primary-dark"
          >
            Новая заявка
          </a>
        </div>
      </div>
    </header>
  );
}
