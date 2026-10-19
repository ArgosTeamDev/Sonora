import type { JSX } from "react";
import { useYearlyGoal } from "./useYearlyGoal";

const focusRing =
  "outline-none rounded focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base";

interface YearlyChallengeCardProps {
  // Albums the signed-in user listened to this calendar year.
  done: number;
}

// Where you'd be if you spread the goal evenly over the year.
function expectedSoFar(goal: number, now: Date): number {
  const start = new Date(now.getFullYear(), 0, 1).getTime();
  const end = new Date(now.getFullYear() + 1, 0, 1).getTime();
  return (goal * (now.getTime() - start)) / (end - start);
}

export function YearlyChallengeCard({ done }: YearlyChallengeCardProps): JSX.Element {
  const [goal, setGoal] = useYearlyGoal();
  const now = new Date();
  const percent = Math.min(100, Math.round((done / goal) * 100));
  const diff = Math.round(done - expectedSoFar(goal, now));

  const handleAdjust = (): void => {
    const answer = window.prompt("¿Cuántos álbumes querés escuchar este año?", String(goal));
    const next = Number.parseInt(answer ?? "", 10);
    if (Number.isFinite(next) && next > 0 && next <= 9999) setGoal(next);
  };

  return (
    <section aria-label={`Reto ${now.getFullYear()}`} className="flex flex-col gap-3 rounded-lg bg-bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col">
          <h2 className="text-section-title-lg text-text-primary">Reto {now.getFullYear()}</h2>
          <p className="text-secondary text-text-secondary">Meta de escuchas completas</p>
        </div>
        <span className="text-3xl font-extrabold leading-8 text-accent">{percent}%</span>
      </div>

      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-label="Progreso del reto anual"
        className="h-2 overflow-hidden rounded-full bg-bg-hover"
      >
        <div className="h-full rounded-full bg-accent-strong" style={{ width: `${percent}%` }} />
      </div>

      <div className="flex items-center justify-between gap-2 text-label">
        <span className="font-normal normal-case tracking-normal text-text-secondary">
          {done} álbum{done === 1 ? "" : "es"} de {goal}
        </span>
        <span className="font-normal normal-case tracking-normal text-text-muted">
          {diff >= 0 ? `+${diff} adelante` : `${diff} atrás`} del ritmo
        </span>
      </div>

      <button
        type="button"
        onClick={handleAdjust}
        className={`-mb-2 min-h-11 w-fit self-end px-1 text-label uppercase text-accent ${focusRing}`}
      >
        Ajustar meta
      </button>
    </section>
  );
}
