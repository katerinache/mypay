"use client";

import {
  KeyboardEvent,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  countryFlag,
  filterCountries,
  findCountryByName,
  type Country,
} from "@/lib/countries";

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function CountryAutocomplete({
  name,
  label,
  required,
  error,
  hint,
  defaultValue = "",
}: {
  name: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  defaultValue?: string;
}) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const selected = useMemo(() => findCountryByName(query), [query]);

  const options = useMemo(() => filterCountries(query, 8), [query]);
  const hasValue = query.trim().length > 0;

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  function selectCountry(country: Country) {
    if (country.blocked) return;
    setQuery(country.name);
    setOpen(false);
    setActiveIndex(0);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!open && (event.key === "ArrowDown" || event.key === "Enter")) {
      setOpen(true);
      return;
    }

    if (!open) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, Math.max(options.length - 1, 0)));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const country = options[activeIndex];
      if (country) selectCountry(country);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="block" ref={rootRef}>
      <div
        className={cx(
          "field-shell country-shell",
          error ? "is-invalid" : undefined,
          hasValue ? "has-value" : undefined,
          open ? "is-open" : undefined,
          selected ? "has-prefix" : undefined,
        )}
      >
        {selected ? (
          <span className="field-prefix country-flag" aria-hidden>
            {countryFlag(selected.code)}
          </span>
        ) : null}
        <input
          name={name}
          value={query}
          required={required}
          autoComplete="off"
          spellCheck={false}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-invalid={!!error}
          placeholder={label}
          className="field-input"
          onFocus={() => {
            setOpen(true);
            setActiveIndex(0);
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            setActiveIndex(0);
          }}
          onKeyDown={onKeyDown}
        />
        <span className="field-floating-label">
          {label}
          {required ? " *" : ""}
        </span>
        <span className={cx("country-caret", open && "is-open")} aria-hidden />
      </div>

      {open ? (
        <div className="country-menu" id={listId} role="listbox">
          <div className="country-menu-head">
            {query.trim() ? "Результаты" : "Частые направления"}
          </div>
          {options.length === 0 ? (
            <div className="country-empty">Ничего не найдено</div>
          ) : (
            options.map((country, index) => {
              const active = index === activeIndex;
              return (
                <button
                  key={country.code}
                  type="button"
                  role="option"
                  aria-selected={active}
                  disabled={country.blocked}
                  className={cx(
                    "country-option",
                    active && "is-active",
                    country.blocked && "is-blocked",
                  )}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => selectCountry(country)}
                >
                  <span className="country-option-flag" aria-hidden>
                    {countryFlag(country.code)}
                  </span>
                  <span className="country-option-text">
                    <span className="country-option-name">{country.name}</span>
                    <span className="country-option-code">{country.code}</span>
                  </span>
                  {country.blocked ? (
                    <span className="country-option-badge">недоступно</span>
                  ) : country.popular && !query.trim() ? (
                    <span className="country-option-badge is-soft">часто</span>
                  ) : null}
                </button>
              );
            })
          )}
        </div>
      ) : null}

      {hint ? (
        <p id={`${name}-hint`} className="mt-1.5 px-1 text-xs leading-relaxed text-neutral-400">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${name}-error`} className="mt-1.5 px-1 text-xs text-error" role="alert">
          {error}
        </p>
      ) : null}
      {selected?.blocked ? (
        <p className="mt-1.5 px-1 text-xs text-error" role="alert">
          Платежи в {selected.name} недоступны
        </p>
      ) : null}
    </div>
  );
}
