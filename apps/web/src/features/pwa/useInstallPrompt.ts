import { useCallback, useEffect, useState } from "react";

// Chromium's non-standard install event; Safari/iOS never fires it (there the
// only route is "Añadir a pantalla de inicio" from the share sheet).
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// Captures the browser's install offer so a button in Ajustes can trigger it
// later. `canInstall` is only true while the browser actually has one to give
// (not already installed, criteria met), so the row hides itself otherwise.
export function useInstallPrompt(): { canInstall: boolean; install: () => Promise<void> } {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const onPrompt = (event: Event): void => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };
    const onInstalled = (): void => setDeferred(null);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = useCallback(async (): Promise<void> => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    // The event can only be used once, accepted or not.
    setDeferred(null);
  }, [deferred]);

  return { canInstall: deferred !== null, install };
}
