import { useState } from "react";
import type { FormEvent, JSX } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useLogin, useRegister } from "@/features/auth/useAuthMutations";
import { Button } from "@/shared/ui/Button";

type Mode = "login" | "register";

const focusRing =
  "outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base";

export function LoginPage(): JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  // Driven entirely by the URL, not local state — TopNav's "Iniciar sesión"
  // / "Registrarse" links just change ?mode=, and this page needs to react
  // to that even when it's already mounted (navigating /login?mode=register
  // -> /login doesn't remount the component, so a useState initializer
  // would only run once and never see the change).
  const mode: Mode = searchParams.get("mode") === "register" ? "register" : "login";
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  const login = useLogin();
  const register = useRegister();
  const pending = login.isPending || register.isPending;
  const error = login.error ?? register.error;

  const redirectTo = (location.state as { from?: string } | null)?.from ?? "/";

  const handleSubmit = (event: FormEvent): void => {
    event.preventDefault();
    const onSuccess = { onSuccess: () => navigate(redirectTo, { replace: true }) };
    if (mode === "login") {
      login.mutate({ username, password }, onSuccess);
    } else {
      register.mutate({ username, name, password }, onSuccess);
    }
  };

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-6 px-4 pt-16">
      <header className="flex flex-col gap-2 text-center">
        <h1 className="text-page-title text-text-primary">
          {mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
        </h1>
        <p className="text-body text-text-secondary">
          {mode === "login"
            ? "Entrá para calificar, reseñar y seguir gente."
            : "Registrate para empezar a calificar álbumes."}
        </p>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-label uppercase text-text-muted">Usuario</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
            placeholder="minusculas_y_guiones_bajos"
            className={`min-h-11 rounded bg-bg-raised px-3 text-body text-text-primary ${focusRing}`}
          />
        </label>

        {mode === "register" && (
          <label className="flex flex-col gap-1.5">
            <span className="text-label uppercase text-text-muted">Nombre</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
              className={`min-h-11 rounded bg-bg-raised px-3 text-body text-text-primary ${focusRing}`}
            />
          </label>
        )}

        <label className="flex flex-col gap-1.5">
          <span className="text-label uppercase text-text-muted">Contraseña</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            className={`min-h-11 rounded bg-bg-raised px-3 text-body text-text-primary ${focusRing}`}
          />
        </label>

        {error && (
          <p role="alert" className="text-secondary text-danger">
            {error instanceof Error ? error.message : "Algo salió mal. Intentá de nuevo."}
          </p>
        )}

        <Button type="submit" disabled={pending}>
          {mode === "login" ? "Entrar" : "Crear cuenta"}
        </Button>
      </form>

      <button
        type="button"
        onClick={() => setSearchParams({ mode: mode === "login" ? "register" : "login" })}
        className={`text-secondary text-accent ${focusRing} rounded`}
      >
        {mode === "login" ? "¿No tenés cuenta? Registrate" : "¿Ya tenés cuenta? Iniciá sesión"}
      </button>
    </div>
  );
}
