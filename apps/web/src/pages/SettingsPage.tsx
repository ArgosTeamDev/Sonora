import { useState } from "react";
import type { JSX, ReactNode } from "react";
import { Link, Navigate } from "react-router-dom";
import { useCurrentUser } from "@/entities/auth/api";
import { LogoutDialog } from "@/features/auth/LogoutDialog";
import { useInstallPrompt } from "@/features/pwa/useInstallPrompt";
import { BackButton } from "@/shared/ui/BackButton";
import { PageSkeleton } from "@/shared/ui/Skeleton";
import { ChangePasswordDialog, DeleteAccountDialog } from "@/features/auth/AccountDialogs";

const focusRing =
  "outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset";

const rowClass = `flex min-h-14 w-full items-center gap-3 px-4 text-left text-body text-text-primary motion-safe:transition-colors hover:bg-bg-raised active:bg-bg-hover ${focusRing}`;

function Icon({ children }: { children: ReactNode }): JSX.Element {
  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-bg-raised text-text-secondary">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        {children}
      </svg>
    </span>
  );
}

const stroke = { stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;

function Chevron(): JSX.Element {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="ml-auto shrink-0 text-text-muted">
      <path d="M9 6l6 6-6 6" {...stroke} />
    </svg>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }): JSX.Element {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="px-4 text-label uppercase text-text-muted">{title}</h2>
      <ul className="divide-y divide-border/60 overflow-hidden rounded-xl bg-bg-surface">{children}</ul>
    </section>
  );
}

function LinkRow({ to, icon, label }: { to: string; icon: ReactNode; label: string }): JSX.Element {
  return (
    <li>
      <Link to={to} className={rowClass}>
        <Icon>{icon}</Icon>
        {label}
        <Chevron />
      </Link>
    </li>
  );
}

// Mobile-app style settings: a profile card up top, then grouped rows.
// Signing out lives here (and in the desktop account menu), not on the
// profile page, and still asks for confirmation first.
export function SettingsPage(): JSX.Element {
  const { data: user, isLoading } = useCurrentUser();
  const { canInstall, install } = useInstallPrompt();
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  if (isLoading) return <PageSkeleton label="Cargando ajustes…" rows={3} />;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 pb-10 pt-4 sm:px-6 sm:pt-10">
      <BackButton className="-mb-2" />
      <h1 className="text-page-title text-text-primary">Ajustes</h1>

      <Link
        to={`/u/${user.username}`}
        className={`flex items-center gap-4 rounded-xl bg-bg-surface p-4 motion-safe:transition-colors hover:bg-bg-raised ${focusRing}`}
      >
        <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent-strong text-section-title text-text-primary">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            user.username.slice(0, 2).toUpperCase()
          )}
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-section-title text-text-primary">{user.name}</span>
          <span className="truncate text-secondary text-text-muted">@{user.username}</span>
        </span>
        <Chevron />
      </Link>

      <Group title="Cuenta">
        <LinkRow
          to={`/u/${user.username}?edit=1`}
          label="Editar perfil"
          icon={<path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4" {...stroke} />}
        />
        <LinkRow
          to={`/u/${user.username}`}
          label="Ver mi perfil"
          icon={
            <>
              <circle cx="12" cy="8" r="3.5" {...stroke} />
              <path d="M4.5 20c1.4-3.6 4.3-5.5 7.5-5.5s6.1 1.9 7.5 5.5" {...stroke} />
            </>
          }
        />
        <LinkRow
          to="/my-reviews"
          label="Mis reseñas"
          icon={<path d="M6 4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5V21l-6-3.5L6 21V4.5z" {...stroke} />}
        />
      </Group>

      <Group title="Descubrir">
        <LinkRow
          to="/people"
          label="Buscar personas"
          icon={
            <>
              <circle cx="11" cy="11" r="7" {...stroke} />
              <path d="M20 20l-3.5-3.5" {...stroke} />
            </>
          }
        />
      </Group>

      {canInstall && (
        <Group title="Aplicación">
          <li>
            <button type="button" onClick={() => void install()} className={rowClass}>
              <Icon>
                <path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 19h14" {...stroke} />
              </Icon>
              Instalar Sonora
              <Chevron />
            </button>
          </li>
        </Group>
      )}

      <Group title="Seguridad">
        <li>
          <button type="button" onClick={() => setIsPasswordOpen(true)} className={rowClass}>
            <Icon>
              <rect x="5" y="11" width="14" height="9" rx="2" {...stroke} />
              <path d="M8 11V8a4 4 0 0 1 8 0v3" {...stroke} />
            </Icon>
            Cambiar contraseña
            <Chevron />
          </button>
        </li>
      </Group>

      <Group title="Sesión">
        <li>
          <button type="button" onClick={() => setIsLogoutOpen(true)} className={`${rowClass} text-danger`}>
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-bg-raised text-danger">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4M15 8l4 4-4 4M19 12H9" {...stroke} />
              </svg>
            </span>
            Cerrar sesión
          </button>
        </li>
        <li>
          <button type="button" onClick={() => setIsDeleteOpen(true)} className={`${rowClass} text-danger`}>
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-bg-raised text-danger">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" {...stroke} />
              </svg>
            </span>
            Eliminar cuenta
          </button>
        </li>
      </Group>

      <p className="text-center text-label font-normal normal-case tracking-normal text-text-muted">Sonora</p>

      {isLogoutOpen && <LogoutDialog onClose={() => setIsLogoutOpen(false)} />}
      {isPasswordOpen && <ChangePasswordDialog onClose={() => setIsPasswordOpen(false)} />}
      {isDeleteOpen && <DeleteAccountDialog onClose={() => setIsDeleteOpen(false)} />}
    </div>
  );
}
