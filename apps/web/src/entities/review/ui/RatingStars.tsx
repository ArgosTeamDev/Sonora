import { useCallback, useId } from "react";
import type { JSX, KeyboardEvent, MouseEvent } from "react";

const STAR_COUNT = 5;
const STEP = 0.5;
const MIN = 0.5;
const MAX = 5;

type StarFill = "empty" | "half" | "full";
type StarSize = "sm" | "lg";

const STAR_PX: Record<StarSize, number> = { sm: 20, lg: 32 };
const TOUCH_TARGET_CLASS: Record<StarSize, string> = {
  sm: "min-h-11 min-w-11",
  lg: "min-h-14 min-w-14",
};

interface RatingStarsProps {
  value: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  label?: string;
  /** "lg" for the primary rate-this-album control; "sm" everywhere it's
   *  read-only inside a list or card. Defaults to "sm". */
  size?: StarSize;
}

function clampToStep(value: number): number {
  const stepped = Math.round(value / STEP) * STEP;
  return Math.min(MAX, Math.max(MIN, stepped));
}

function getStarFill(value: number, starIndex: number): StarFill {
  if (value >= starIndex) return "full";
  if (value >= starIndex - 0.5) return "half";
  return "empty";
}

export function RatingStars({
  value,
  onChange,
  readOnly = false,
  label = "Calificación",
  size = "sm",
}: RatingStarsProps): JSX.Element {
  const isInteractive = !readOnly && Boolean(onChange);
  const valueTextId = useId();

  const handleStarClick = useCallback(
    (starIndex: number, event: MouseEvent<HTMLButtonElement>) => {
      if (!onChange) return;
      const rect = event.currentTarget.getBoundingClientRect();
      const isLeftHalf = event.clientX - rect.left < rect.width / 2;
      onChange(clampToStep(starIndex + (isLeftHalf ? 0.5 : 1)));
    },
    [onChange],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (!onChange) return;
      if (event.key === "ArrowRight" || event.key === "ArrowUp") {
        event.preventDefault();
        onChange(clampToStep(value + STEP));
      } else if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
        event.preventDefault();
        onChange(clampToStep(value - STEP));
      } else if (event.key === "Home") {
        event.preventDefault();
        onChange(MIN);
      } else if (event.key === "End") {
        event.preventDefault();
        onChange(MAX);
      }
    },
    [onChange, value],
  );

  if (!isInteractive) {
    return (
      <span className="inline-flex text-accent" aria-label={`${label}: ${value} de 5 estrellas`}>
        {Array.from({ length: STAR_COUNT }, (_, i) => (
          <Star key={i + 1} fill={getStarFill(value, i + 1)} px={STAR_PX[size]} />
        ))}
      </span>
    );
  }

  return (
    <div
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={MIN}
      aria-valuemax={MAX}
      aria-valuenow={value}
      aria-valuetext={`${value} de 5 estrellas`}
      aria-describedby={valueTextId}
      onKeyDown={handleKeyDown}
      className="inline-flex text-accent outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base rounded"
    >
      {Array.from({ length: STAR_COUNT }, (_, i) => {
        const starIndex = i + 1;
        return (
          <button
            key={starIndex}
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            onClick={(event) => handleStarClick(i, event)}
            className={`flex items-center justify-center border-0 bg-transparent p-0 ${TOUCH_TARGET_CLASS[size]}`}
          >
            <Star fill={getStarFill(value, starIndex)} px={STAR_PX[size]} />
          </button>
        );
      })}
      <span id={valueTextId} className="sr-only">
        {`${value} de 5 estrellas`}
      </span>
    </div>
  );
}

function Star({ fill, px }: { fill: StarFill; px: number }): JSX.Element {
  const gradientId = useId();
  return (
    <svg width={px} height={px} viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <linearGradient id={gradientId}>
          <stop offset="50%" stopColor="currentColor" />
          <stop offset="50%" stopColor="transparent" />
        </linearGradient>
      </defs>
      <path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z"
        fill={fill === "full" ? "currentColor" : fill === "half" ? `url(#${gradientId})` : "none"}
        stroke="currentColor"
        strokeWidth="1.5"
        className={fill === "empty" ? "text-text-muted" : undefined}
      />
    </svg>
  );
}
