// ============================================================
// ENDPOINT ÚNICO: /api/gateway?action=<nombre>
// Las acciones están en packages/shared/src/gateway.ts. Cada una se reenvía a la ruta REST
// real (con su cookie), así se reutilizan guards, validación y reglas.
//   GET    -> parámetros en la query (?action=obtener_album&id=123)
//   otros  -> parámetros en el body JSON ({ "id": "...", ...datos })
// Respuesta: { success, message, data } | { success:false, error }
// ============================================================
import { All, Controller, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";
import { ROUTES } from "@project/shared";

type Params = Record<string, unknown>;

@Controller("gateway")
export class GatewayController {
  @All()
  async handle(@Req() req: Request, @Res() res: Response): Promise<void> {
    const body: Params = req.body && typeof req.body === "object" ? { ...req.body } : {};
    const { action: queryAction, ...query } = req.query as Params;
    const action = String(queryAction ?? body.action ?? "");
    delete body.action;

    const route = Object.prototype.hasOwnProperty.call(ROUTES, action) ? ROUTES[action] : undefined;
    if (!route) return this.fail(res, 404, "Acción no reconocida o no especificada.");
    if (req.method !== route.method) return this.fail(res, 405, `Método no permitido. Usa ${route.method}.`);

    // Rellena los :params desde query/body y deja el resto como payload.
    const all: Params = { ...query, ...body };
    let path = route.path.replace(/:(\w+)/g, (_, name: string) => {
      const value = all[name];
      delete query[name];
      delete body[name];
      return encodeURIComponent(String(value ?? ""));
    });
    if (path.includes("//") || path.endsWith("/")) return this.fail(res, 400, "Faltan parámetros de la ruta.");

    const qs = new URLSearchParams(query as Record<string, string>).toString();
    const url = `http://127.0.0.1:${req.socket.localPort}/api${path}${route.method === "GET" && qs ? `?${qs}` : ""}`;

    try {
      const upstream = await fetch(url, {
        method: route.method,
        headers: {
          ...(req.headers.cookie ? { cookie: req.headers.cookie } : {}),
          ...(route.method !== "GET" ? { "content-type": "application/json" } : {}),
        },
        body: route.method === "GET" || route.method === "DELETE" ? undefined : JSON.stringify(body),
      });

      // Reenvía la cookie de sesión (login / register / logout).
      for (const cookie of upstream.headers.getSetCookie()) res.append("set-cookie", cookie);

      const text = await upstream.text();
      const json = text ? safeParse(text) : null;
      if (!upstream.ok) {
        const err = (json ?? {}) as { message?: unknown; code?: unknown };
        return this.fail(
          res,
          upstream.status,
          typeof err.message === "string" ? err.message : "El servidor rechazó la petición.",
          typeof err.code === "string" ? err.code : undefined,
        );
      }
      res.status(200).json({ success: true, message: "OK", data: json });
    } catch (e) {
      console.error("gateway:", e);
      this.fail(res, 500, "Error interno del servidor.");
    }
  }

  private fail(res: Response, status: number, error: string, code?: string): void {
    res.status(status).json({ success: false, error, ...(code ? { code } : {}) });
  }
}

function safeParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
