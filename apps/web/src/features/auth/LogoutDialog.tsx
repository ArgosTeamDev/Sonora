import { useEffect } from "react";
import type { JSX } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/shared/ui/Button";
import { useLogout } from "./useAuthMutations";

interface LogoutDialogProps {
  onClose: () => void;
}

// Signing out is one tap away from everywhere (profile page, account menu),
// so it asks first — a stray tap shouldn't drop your session. The cancel
// button gets focus by default so Enter never logs you out by accident.
export function LogoutDialog({ onClose }: LogoutDialogProps): JSX.Element {
  const navigate = useNavigate();
  const logout = useLogout();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const handleLogout = (): void => {
    logout.mutate(undefined, {
      onSuccess: () => {
        onClose();
        navigate("/", { replace: true });
      },
    });
  };

  return (
    <>
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        className="fixed inset-0 z-40 bg-bg-deep/80 backdrop-blur-sm"
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="logout-title"
        aria-describedby="logout-description"
        className="fixed inset-x-0 bottom-0 z-50 flex flex-col gap-4 rounded-t-lg border-t border-border bg-bg-surface p-5 pb-[calc(20px+env(safe-area-inset-bottom))] sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-96 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-lg sm:border"
      >
        <div className="flex flex-col gap-1">
          <h2 id="logout-title" className="text-section-title-lg text-text-primary">
            ¿Cerrar sesión?
          </h2>
          <p id="logout-description" className="text-body text-text-secondary">
            Tus reseñas y favoritos quedan guardados. Podrás volver a entrar cuando quieras.
          </p>
        </div>
        {logout.isError && (
          <p role="alert" className="text-secondary text-danger">
            No se pudo cerrar la sesión. Intenta de nuevo.
          </p>
        )}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
          <Button variant="secondary" onClick={onClose} autoFocus>
            Cancelar
          </Button>
          <Button
            onClick={handleLogout}
            disabled={logout.isPending}
            className="bg-danger text-bg-base hover:bg-danger hover:brightness-110"
          >
            {logout.isPending ? "Cerrando…" : "Cerrar sesión"}
          </Button>
        </div>
      </div>
    </>
  );
}
