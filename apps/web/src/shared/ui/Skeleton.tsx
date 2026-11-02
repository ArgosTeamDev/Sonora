import type { JSX } from "react";

// A pulsing placeholder block. The pulse only runs when the user hasn't asked
// the OS for reduced motion; otherwise it's a static dim block.
export function Skeleton({ className = "" }: { className?: string }): JSX.Element {
  return <div aria-hidden="true" className={`rounded-lg bg-bg-surface motion-safe:animate-pulse ${className}`} />;
}

// Generic page placeholder: a title bar, a subtitle and a few card rows. Used
// in place of the old "Cargando…" lines so the layout doesn't jump when the
// content arrives. `label` is what screen readers announce.
export function PageSkeleton({
  label = "Cargando…",
  rows = 3,
  withAvatar = false,
}: {
  label?: string;
  rows?: number;
  withAvatar?: boolean;
}): JSX.Element {
  return (
    <div role="status" aria-busy="true" className="flex flex-col gap-6 px-4 pt-8">
      <span className="sr-only">{label}</span>
      {withAvatar && <Skeleton className="-mx-4 h-36 rounded-none" />}
      <div className="flex flex-col gap-3">
        <Skeleton className="h-8 w-2/3 max-w-xs" />
        <Skeleton className="h-4 w-1/2 max-w-[14rem]" />
      </div>
      <div className="flex flex-col gap-3">
        {Array.from({ length: rows }, (_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    </div>
  );
}
