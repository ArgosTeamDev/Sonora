import type { JSX, ReactNode } from "react";
import { Link } from "react-router-dom";
import { buttonClasses } from "./Button";

// An empty list that says what to do next, instead of a dead-end sentence.
// `action` is optional: pass it only when there is something the reader can
// actually do (e.g. their own empty profile), not when they're looking at
// someone else's.
export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: { label: string; to: string };
  icon?: ReactNode;
}): JSX.Element {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl bg-bg-surface px-6 py-10 text-center">
      {icon && (
        <span aria-hidden="true" className="text-text-muted">
          {icon}
        </span>
      )}
      <p className="text-section-title text-text-primary">{title}</p>
      {description && <p className="max-w-xs text-secondary text-text-secondary">{description}</p>}
      {action && (
        <Link to={action.to} className={buttonClasses("primary", "mt-1")}>
          {action.label}
        </Link>
      )}
    </div>
  );
}
