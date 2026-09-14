import { forwardRef } from "react";
import type { ButtonHTMLAttributes, JSX } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "chip" | "chip-active";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-accent-cta text-on-cta hover:bg-accent-strong",
  secondary: "bg-bg-raised text-text-primary hover:bg-bg-hover",
  ghost: "bg-transparent text-text-secondary hover:bg-bg-raised hover:text-text-primary",
  chip: "bg-bg-raised text-text-secondary hover:bg-bg-hover",
  "chip-active": "bg-accent text-on-accent",
};

// Shared with any element that needs identical chrome but can't be a real
// <button> — e.g. a react-router <Link> styled as a button.
export function buttonClasses(variant: ButtonVariant = "primary", className = ""): string {
  return `inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded px-4 text-secondary font-semibold outline-none motion-safe:transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base disabled:pointer-events-none disabled:opacity-50 ${VARIANT_CLASSES[variant]} ${className}`;
}

// One place for interactive-element chrome: every button in the app gets the
// same visible focus ring, the same minimum touch target, and the same
// disabled/hover behavior — instead of each page re-deriving it slightly
// differently.
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", className = "", type = "button", ...props },
  ref,
): JSX.Element {
  return <button ref={ref} type={type} className={buttonClasses(variant, className)} {...props} />;
});
