import { useEffect, useState } from "react";
import type { JSX } from "react";

// Tells people why things stop loading, instead of leaving scattered
// "no se pudo cargar" messages. Driven by the browser's online/offline events.
export function OfflineBanner(): JSX.Element | null {
  const [online, setOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    const on = (): void => setOnline(true);
    const off = (): void => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  if (online) return null;
  return (
    <div role="status" className="bg-bg-hover px-4 py-2 text-center text-secondary text-text-primary">
      Sin conexión. Algunas cosas no se cargarán hasta que vuelvas a estar en línea.
    </div>
  );
}
