import type { InputHTMLAttributes, JSX, ReactNode } from "react";

const focusRing =
  "outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base";

interface AuthFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "className"> {
  label: string;
  // Small text beside the label (e.g. "Opcional", "¿Olvidaste…?").
  labelAside?: ReactNode;
  icon: ReactNode;
  // Right-hand control inside the input, e.g. the show/hide password button.
  trailing?: ReactNode;
  hint?: string;
  error?: string | null;
}

// Label + icon-prefixed input + hint/error, the one shape every auth form
// field shares. The error is tied to the input with aria-describedby so a
// screen reader announces it when focus lands there.
export function AuthField({
  label,
  labelAside,
  icon,
  trailing,
  hint,
  error,
  id,
  ...inputProps
}: AuthFieldProps): JSX.Element {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-secondary font-semibold text-text-secondary">
          {label}
        </label>
        {labelAside && <span className="text-label font-normal normal-case tracking-normal text-text-muted">{labelAside}</span>}
      </div>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-text-muted" aria-hidden="true">
          {icon}
        </span>
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...inputProps}
          className={`min-h-11 w-full rounded bg-bg-surface pl-10 text-body text-text-primary placeholder:text-text-muted/60 ${
            trailing ? "pr-12" : "pr-3"
          } ${error ? "ring-1 ring-danger" : ""} ${focusRing}`}
        />
        {trailing && <span className="absolute inset-y-0 right-0 flex items-center">{trailing}</span>}
      </div>
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-label font-normal normal-case tracking-normal text-danger">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-label font-normal normal-case tracking-normal text-text-muted">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
