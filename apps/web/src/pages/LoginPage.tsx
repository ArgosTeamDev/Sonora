import { useState } from "react";
import type { FormEvent, JSX } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { AuthField } from "@/features/auth/AuthField";
import { useLogin, useRegister } from "@/features/auth/useAuthMutations";
import { HttpError } from "@/shared/api/http";
import { Button } from "@/shared/ui/Button";

type Mode = "login" | "register";

const focusRing =
  "outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base";

const USERNAME_PATTERN = /^[a-z0-9_]{3,30}$/;
const MIN_PASSWORD = 8;

function UserIcon(): JSX.Element {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4 20c0-4 3.6-6 8-6s8 2 8 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function AtIcon(): JSX.Element {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
      <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function MailIcon(): JSX.Element {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="m3.5 7 8.5 6 8.5-6" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

function PinIcon(): JSX.Element {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="9.5" r="2.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function LockIcon(): JSX.Element {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function EyeIcon({ off }: { off: boolean }): JSX.Element {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
      {off && <path d="M4 4l16 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />}
    </svg>
  );
}

function PasswordToggle({ shown, onToggle }: { shown: boolean; onToggle: () => void }): JSX.Element {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={shown ? "Ocultar contraseña" : "Mostrar contraseña"}
      aria-pressed={shown}
      className={`flex size-11 items-center justify-center rounded text-text-muted hover:text-text-primary ${focusRing}`}
    >
      <EyeIcon off={shown} />
    </button>
  );
}

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
  const isRegister = mode === "register";

  const [identifier, setIdentifier] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [userLocation, setUserLocation] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  // Field errors only appear after the first submit, so the form doesn't
  // scold someone who is still typing.
  const [submitted, setSubmitted] = useState(false);

  const login = useLogin();
  const register = useRegister();
  const pending = login.isPending || register.isPending;
  const error = isRegister ? register.error : login.error;

  const redirectTo = (location.state as { from?: string } | null)?.from ?? "/";

  const usernameError = !USERNAME_PATTERN.test(username)
    ? "De 3 a 30 caracteres: minúsculas, números y guion bajo."
    : null;
  const passwordError = password.length < MIN_PASSWORD ? `Mínimo ${MIN_PASSWORD} caracteres.` : null;
  const confirmError = password !== confirmPassword ? "Las contraseñas no coinciden." : null;

  // The API tells us which handle is taken; show it on that field.
  const serverCode = error instanceof HttpError ? error.code : null;
  const serverUsernameError = serverCode === "DUPLICATE_USERNAME" && error instanceof Error ? error.message : null;
  const serverEmailError = serverCode === "DUPLICATE_EMAIL" && error instanceof Error ? error.message : null;
  const generalError = error && !serverUsernameError && !serverEmailError ? error : null;

  const handleSubmit = (event: FormEvent): void => {
    event.preventDefault();
    setSubmitted(true);
    const onSuccess = { onSuccess: () => navigate(redirectTo, { replace: true }) };

    if (!isRegister) {
      login.mutate({ identifier, password, remember }, onSuccess);
      return;
    }
    if (usernameError || passwordError || confirmError) return;
    register.mutate(
      { username, name, email, password, location: userLocation.trim() || null },
      onSuccess,
    );
  };

  const switchMode = (): void => {
    setSubmitted(false);
    login.reset();
    register.reset();
    setSearchParams({ mode: isRegister ? "login" : "register" });
  };

  const passwordToggle = <PasswordToggle shown={showPassword} onToggle={() => setShowPassword((v) => !v)} />;
  const passwordType = showPassword ? "text" : "password";

  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-col px-4 py-8 sm:py-12">
      <div
        className={`relative overflow-hidden rounded-lg p-5 shadow-2xl sm:p-6 ${isRegister ? "bg-bg-raised" : "bg-bg-deep"}`}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-20 -top-24 size-64 rounded-full bg-accent-strong/10 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -right-24 size-64 rounded-full bg-accent-cta/15 blur-3xl"
        />

        <div className="relative flex flex-col gap-6">
          <header className="flex flex-col items-center gap-2 text-center">
            <span className="flex items-center gap-1.5 rounded-xl bg-bg-surface px-3 py-1 text-label uppercase tracking-[1.1px] text-text-primary">
              <span className="size-2 rounded-full bg-accent" aria-hidden="true" />
              Sonora
            </span>
            <h1 className="text-[32px] font-bold leading-[38px] tracking-[-0.8px] text-text-primary">
              {isRegister ? "Crea tu cuenta" : "Bienvenido de nuevo"}
            </h1>
            <p className="max-w-xs text-[14px] leading-[22px] text-text-secondary">
              {isRegister
                ? "Tu diario musical personal: califica, reseña y sigue a otros melómanos."
                : "Ingresa para ver qué discos están escuchando tus amigos hoy."}
            </p>
          </header>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            {isRegister ? (
              <>
                <AuthField
                  id="register-name"
                  label="Nombre"
                  icon={<UserIcon />}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  maxLength={100}
                  autoComplete="name"
                  placeholder="Tu nombre"
                />
                <AuthField
                  id="register-username"
                  label="Usuario"
                  icon={<AtIcon />}
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  required
                  maxLength={30}
                  autoCapitalize="none"
                  autoComplete="username"
                  placeholder="minusculas_y_guiones_bajos"
                  hint="Es tu dirección: sonora/u/tu_usuario. No se puede cambiar después."
                  error={serverUsernameError ?? (submitted ? usernameError : null)}
                />
                <AuthField
                  id="register-email"
                  label="Correo electrónico"
                  icon={<MailIcon />}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  maxLength={255}
                  autoComplete="email"
                  placeholder="nombre@ejemplo.com"
                  hint="Solo lo usamos para iniciar sesión; nadie más lo ve."
                  error={serverEmailError}
                />
                <AuthField
                  id="register-location"
                  label="Ubicación"
                  labelAside="Opcional"
                  icon={<PinIcon />}
                  value={userLocation}
                  onChange={(e) => setUserLocation(e.target.value)}
                  maxLength={80}
                  autoComplete="address-level2"
                  placeholder="Ciudad / País"
                />
                <AuthField
                  id="register-password"
                  label="Contraseña"
                  icon={<LockIcon />}
                  type={passwordType}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  maxLength={72}
                  autoComplete="new-password"
                  placeholder={`Mínimo ${MIN_PASSWORD} caracteres`}
                  trailing={passwordToggle}
                  error={submitted ? passwordError : null}
                />
                <AuthField
                  id="register-confirm"
                  label="Repite la contraseña"
                  icon={<LockIcon />}
                  type={passwordType}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  maxLength={72}
                  autoComplete="new-password"
                  error={submitted ? confirmError : null}
                />
              </>
            ) : (
              <>
                <AuthField
                  id="login-identifier"
                  label="Correo o usuario"
                  icon={<UserIcon />}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  autoCapitalize="none"
                  autoComplete="username"
                  placeholder="ej. mateo@correo.com"
                />
                <AuthField
                  id="login-password"
                  label="Contraseña"
                  icon={<LockIcon />}
                  type={passwordType}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  trailing={passwordToggle}
                />
                <label className="flex min-h-11 items-center gap-2 text-secondary text-text-secondary">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className={`size-4 accent-accent ${focusRing}`}
                  />
                  Mantener sesión por 30 días
                </label>
              </>
            )}

            {generalError && (
              <p role="alert" className="text-secondary text-danger">
                {generalError instanceof Error ? generalError.message : "Algo salió mal. Intenta de nuevo."}
              </p>
            )}

            <Button
              type="submit"
              disabled={pending}
              className="min-h-12 bg-accent-strong text-on-accent shadow-md hover:bg-accent-strong hover:brightness-110"
            >
              {pending ? "Un momento…" : isRegister ? "Crear cuenta" : "Iniciar sesión"}
              {!pending && <span aria-hidden="true">→</span>}
            </Button>
          </form>

          <p className="flex flex-wrap items-center justify-center gap-x-1.5 text-secondary text-text-secondary">
            {isRegister ? "¿Ya tienes cuenta?" : "¿No tienes una cuenta de Sonora?"}
            <button
              type="button"
              onClick={switchMode}
              className={`min-h-11 rounded px-1 font-semibold text-accent ${focusRing}`}
            >
              {isRegister ? "Iniciar sesión" : "Regístrate gratis"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
