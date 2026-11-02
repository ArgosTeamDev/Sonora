// Tabla de acciones del endpoint único (compartida por API y web). Cada acción apunta a una ruta REST
// existente; los :params se rellenan con los valores de la query o del body.
// Para agregar una acción nueva basta una línea aquí.
export type GatewayMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export const ROUTES: Record<string, { method: GatewayMethod; path: string }> = {
  // Sesión
  sesion: { method: "GET", path: "/auth/me" },
  login: { method: "POST", path: "/auth/login" },
  logout: { method: "POST", path: "/auth/logout" },
  registrar_usuario: { method: "POST", path: "/auth/register" },
  cambiar_password: { method: "POST", path: "/auth/password" },
  eliminar_cuenta: { method: "POST", path: "/auth/delete-account" },

  // Reseñas
  listar_resenas: { method: "GET", path: "/reviews" },
  obtener_resena: { method: "GET", path: "/reviews/:id" },
  crear_resena: { method: "POST", path: "/reviews" },
  actualizar_resena: { method: "PATCH", path: "/reviews/:id" },
  eliminar_resena: { method: "DELETE", path: "/reviews/:id" },

  // Álbumes y artistas
  listar_albumes: { method: "GET", path: "/albums" },
  obtener_album: { method: "GET", path: "/albums/:id" },
  obtener_artista: { method: "GET", path: "/artists/:slug" },

  // Usuarios
  listar_usuarios: { method: "GET", path: "/users" },
  obtener_usuario: { method: "GET", path: "/users/:username" },
  actualizar_usuario: { method: "PATCH", path: "/users/:username" },
  resenas_de_usuario: { method: "GET", path: "/users/:username/reviews" },
  siguiendo: { method: "GET", path: "/users/:username/following" },
  seguidores: { method: "GET", path: "/users/:username/followers" },
  favoritos_de_usuario: { method: "GET", path: "/users/:username/favorites" },
  watchlist_de_usuario: { method: "GET", path: "/users/:username/watchlist" },
  listas_de_usuario: { method: "GET", path: "/users/:username/lists" },
  obtener_top: { method: "GET", path: "/users/:username/top" },
  guardar_top: { method: "PUT", path: "/users/:username/top" },

  // Social
  seguir: { method: "POST", path: "/follows" },
  dejar_de_seguir: { method: "DELETE", path: "/follows/:followerId/:followingId" },
  agregar_favorito: { method: "POST", path: "/favorites" },
  quitar_favorito: { method: "DELETE", path: "/favorites/:userId/:albumId" },
  listar_likes: { method: "GET", path: "/review-likes" },
  dar_like: { method: "POST", path: "/review-likes" },
  quitar_like: { method: "DELETE", path: "/review-likes/:reviewId" },

  // Watchlist
  agregar_watchlist: { method: "POST", path: "/watchlist" },
  quitar_watchlist: { method: "DELETE", path: "/watchlist/:albumId" },

  // Listas
  listar_listas: { method: "GET", path: "/lists" },
  crear_lista: { method: "POST", path: "/lists" },
  eliminar_lista: { method: "DELETE", path: "/lists/:id" },
  agregar_item_lista: { method: "POST", path: "/lists/:id/items" },
  quitar_item_lista: { method: "DELETE", path: "/lists/:id/items/:albumId" },

  // Feed
  feed: { method: "GET", path: "/feed" },
};

const MATCHERS = Object.entries(ROUTES).map(([action, route]) => {
  const names: string[] = [];
  const source = route.path.replace(/:(\w+)/g, (_, name: string) => {
    names.push(name);
    return "([^/]+)";
  });
  return { action, method: route.method, names, regex: new RegExp(`^${source}$`) };
});

export interface ResolvedGatewayRoute {
  action: string;
  /** Valores de los :params de la ruta, ya decodificados. */
  params: Record<string, string>;
}

/** Traduce una llamada REST ("GET", "/albums/123") a su acción del endpoint único. */
export function resolveGatewayRoute(method: string, pathname: string): ResolvedGatewayRoute | null {
  for (const m of MATCHERS) {
    if (m.method !== method) continue;
    const hit = m.regex.exec(pathname);
    if (!hit) continue;
    const params: Record<string, string> = {};
    m.names.forEach((name, i) => {
      params[name] = decodeURIComponent(hit[i + 1]!);
    });
    return { action: m.action, params };
  }
  return null;
}
