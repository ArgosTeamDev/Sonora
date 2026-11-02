import { Component } from "react";
import type { ErrorInfo, JSX, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

// Without this, an error thrown while rendering any page unmounts the whole
// tree and leaves a blank screen. This keeps the navigation alive and offers
// a way out. RootLayout re-keys it on every route change, so moving to
// another page clears the error state.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("Render error:", error, info.componentStack);
  }

  render(): JSX.Element {
    if (!this.state.hasError) return <>{this.props.children}</>;
    return (
      <div role="alert" className="mx-auto flex max-w-md flex-col items-center gap-4 px-6 py-16 text-center">
        <h1 className="text-page-title text-text-primary">Algo salió mal</h1>
        <p className="text-body text-text-secondary">
          Esta pantalla tuvo un problema inesperado. Puedes recargarla o volver al inicio.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex min-h-11 items-center rounded bg-accent-cta px-4 text-secondary font-semibold text-on-cta hover:bg-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Recargar
          </button>
          <a
            href="#/"
            onClick={() => this.setState({ hasError: false })}
            className="inline-flex min-h-11 items-center rounded bg-bg-raised px-4 text-secondary font-semibold text-text-primary hover:bg-bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Ir al inicio
          </a>
        </div>
      </div>
    );
  }
}
