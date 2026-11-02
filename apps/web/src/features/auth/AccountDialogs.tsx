import { useEffect, useState } from "react";
import type { FormEvent, JSX, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/shared/ui/Button";
import { useChangePassword, useDeleteAccount } from "./useAuthMutations";

const focusRing =
  "outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base";
const inputClass = `min-h-11 w-full rounded bg-bg-raised px-3 text-body text-text-primary ${focusRing}`;

// Same bottom-sheet-on-mobile / centered-card-on-desktop chrome as
// LogoutDialog, shared by the two account dialogs below.
function Sheet({
  titleId,
  title,
  onClose,
  children,
}: {
  titleId: string;
  title: string;
  onClose: () => void;
  children: ReactNode;
}): JSX.Element {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <>
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        className="fixed inset-0 z-40 bg-bg-deep/80 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="fixed inset-x-0 bottom-0 z-50 flex max-h-[90dvh] flex-col gap-4 overflow-y-auto rounded-t-lg border-t border-border bg-bg-surface p-5 pb-[calc(20px+env(safe-area-inset-bottom))] sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-96 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-lg sm:border"
      >
        <h2 id={titleId} className="text-section-title-lg text-text-primary">
          {title}
        </h2>
        {children}
      </div>
    </>
  );
}

function PasswordInput({
  id,
  label,
  value,
  onChange,
  autoComplete,
  autoFocus,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  autoFocus?: boolean;
}): JSX.Element {
  return (
    <label htmlFor={id} className="flex flex-col gap-1.5">
      <span className="text-secondary font-semibold text-text-secondary">{label}</span>
      <input
        id={id}
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus={autoFocus}
        className={inputClass}
      />
    </label>
  );
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Algo salió mal. Intenta de nuevo.";
}

export function ChangePasswordDialog({ onClose }: { onClose: () => void }): JSX.Element {
  const change = useChangePassword();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const mismatch = confirm.length > 0 && next !== confirm;

  const handleSubmit = (event: FormEvent): void => {
    event.preventDefault();
    if (mismatch || change.isPending) return;
    change.mutate({ currentPassword: current, newPassword: next });
  };

  if (change.isSuccess) {
    return (
      <Sheet titleId="pw-title" title="Contraseña actualizada" onClose={onClose}>
        <p className="text-body text-text-secondary">
          Ya puedes usar tu nueva contraseña la próxima vez que inicies sesión.
        </p>
        <Button onClick={onClose}>Listo</Button>
      </Sheet>
    );
  }

  return (
    <Sheet titleId="pw-title" title="Cambiar contraseña" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <PasswordInput
          id="pw-current"
          label="Contraseña actual"
          value={current}
          onChange={setCurrent}
          autoComplete="current-password"
          autoFocus
        />
        <PasswordInput
          id="pw-new"
          label="Nueva contraseña (mínimo 8)"
          value={next}
          onChange={setNext}
          autoComplete="new-password"
        />
        <PasswordInput
          id="pw-confirm"
          label="Repite la nueva contraseña"
          value={confirm}
          onChange={setConfirm}
          autoComplete="new-password"
        />
        {mismatch && (
          <p role="alert" className="text-secondary text-danger">
            Las contraseñas no coinciden.
          </p>
        )}
        {change.isError && (
          <p role="alert" className="text-secondary text-danger">
            {errorMessage(change.error)}
          </p>
        )}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={change.isPending || !current || next.length < 8 || mismatch || !confirm}>
            {change.isPending ? "Guardando…" : "Guardar"}
          </Button>
        </div>
      </form>
    </Sheet>
  );
}

export function DeleteAccountDialog({ onClose }: { onClose: () => void }): JSX.Element {
  const navigate = useNavigate();
  const remove = useDeleteAccount();
  const [password, setPassword] = useState("");

  const handleSubmit = (event: FormEvent): void => {
    event.preventDefault();
    if (remove.isPending) return;
    remove.mutate(
      { password },
      {
        onSuccess: () => {
          onClose();
          navigate("/", { replace: true });
        },
      },
    );
  };

  return (
    <Sheet titleId="del-title" title="¿Eliminar tu cuenta?" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <p className="text-body text-text-secondary">
          Se borrarán para siempre tu perfil, reseñas, favoritos, listas y seguidores. No se puede deshacer.
        </p>
        <PasswordInput
          id="del-password"
          label="Escribe tu contraseña para confirmar"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
          autoFocus
        />
        {remove.isError && (
          <p role="alert" className="text-secondary text-danger">
            {errorMessage(remove.error)}
          </p>
        )}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={remove.isPending || !password}
            className="bg-danger text-bg-base hover:bg-danger hover:brightness-110"
          >
            {remove.isPending ? "Eliminando…" : "Eliminar cuenta"}
          </Button>
        </div>
      </form>
    </Sheet>
  );
}
