import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

type SharedProps = {
  label: string;
  name: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
};

function FieldMeta({
  name,
  hint,
  error,
}: {
  name: string;
  hint?: string;
  error?: string;
}) {
  return (
    <>
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
    </>
  );
}

function FloatingLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <span className="field-floating-label">
      {label}
      {required ? " *" : ""}
    </span>
  );
}

export function TextInput({
  label,
  name,
  hint,
  error,
  required,
  prefix,
  suffix,
  className,
  ...props
}: SharedProps &
  InputHTMLAttributes<HTMLInputElement> & {
    prefix?: ReactNode;
    suffix?: ReactNode;
  }) {
  const controlledFilled =
    props.value !== undefined && String(props.value).length > 0;

  return (
    <div className={cx("block", className)}>
      <div
        className={cx(
          "field-shell",
          error ? "is-invalid" : undefined,
          prefix ? "has-prefix" : undefined,
          suffix ? "has-suffix" : undefined,
          controlledFilled ? "has-value" : undefined,
        )}
      >
        {prefix ? <span className="field-prefix">{prefix}</span> : null}
        <input
          {...props}
          name={name}
          required={required}
          aria-invalid={!!error}
          placeholder={label}
          className="field-input"
        />
        {suffix ? <span className="field-suffix">{suffix}</span> : null}
        <FloatingLabel label={label} required={required} />
      </div>
      <FieldMeta name={name} hint={hint} error={error} />
    </div>
  );
}

export function TextSelect({
  label,
  name,
  hint,
  error,
  required,
  className,
  children,
  ...props
}: SharedProps & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className={cx("block", className)}>
      <div className={cx("field-shell is-select has-value", error ? "is-invalid" : undefined)}>
        <select
          {...props}
          name={name}
          required={required}
          aria-invalid={!!error}
          className="field-input"
        >
          {children}
        </select>
        <FloatingLabel label={label} required={required} />
        <span className="field-chevron" aria-hidden />
      </div>
      <FieldMeta name={name} hint={hint} error={error} />
    </div>
  );
}

export function TextArea({
  label,
  name,
  hint,
  error,
  required,
  className,
  ...props
}: SharedProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const controlledFilled =
    props.value !== undefined && String(props.value).length > 0;

  return (
    <div className={cx("block", className)}>
      <div
        className={cx(
          "field-shell is-textarea",
          error ? "is-invalid" : undefined,
          controlledFilled ? "has-value" : undefined,
        )}
      >
        <textarea
          {...props}
          name={name}
          required={required}
          aria-invalid={!!error}
          placeholder={label}
          className="field-input"
        />
        <FloatingLabel label={label} required={required} />
      </div>
      <FieldMeta name={name} hint={hint} error={error} />
    </div>
  );
}

export function SectionCard({
  title,
  subtitle,
  children,
  step,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  step?: number;
}) {
  return (
    <section className="rounded-[1.35rem] border border-white/80 bg-white/90 p-5 shadow-[0_18px_50px_-36px_rgba(21,23,29,0.45)] backdrop-blur sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        {typeof step === "number" ? (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-bold text-primary">
            {step}
          </span>
        ) : null}
        <div>
          <h2 className="font-display text-lg text-neutral-900 sm:text-xl">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-neutral-600">{subtitle}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}
