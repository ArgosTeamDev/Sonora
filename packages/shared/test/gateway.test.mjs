// Run with `pnpm --filter @project/shared test` (builds first: it imports dist/).
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { ROUTES, resolveGatewayRoute } from "../dist/index.js";

const here = dirname(fileURLToPath(import.meta.url));

test("resolveGatewayRoute: traduce rutas REST a acciones", () => {
  const cases = [
    ["GET", "/albums", "listar_albumes", {}],
    ["GET", "/albums/abc%20d", "obtener_album", { id: "abc d" }],
    ["GET", "/auth/me", "sesion", {}],
    ["POST", "/auth/login", "login", {}],
    ["GET", "/users/ana/favorites", "favoritos_de_usuario", { username: "ana" }],
    ["GET", "/users/ana/reviews", "resenas_de_usuario", { username: "ana" }],
    ["DELETE", "/favorites/u1/a1", "quitar_favorito", { userId: "u1", albumId: "a1" }],
    ["DELETE", "/lists/9/items/a1", "quitar_item_lista", { id: "9", albumId: "a1" }],
    ["PUT", "/users/ana/top", "guardar_top", { username: "ana" }],
    ["PATCH", "/reviews/r1", "actualizar_resena", { id: "r1" }],
    ["POST", "/auth/password", "cambiar_password", {}],
    ["POST", "/auth/delete-account", "eliminar_cuenta", {}],
  ];
  for (const [method, path, action, params] of cases) {
    const hit = resolveGatewayRoute(method, path);
    assert.ok(hit, `${method} ${path} no tiene acción`);
    assert.equal(hit.action, action, `${method} ${path}`);
    assert.deepEqual(hit.params, params, `${method} ${path}`);
  }
});

test("resolveGatewayRoute: rutas o métodos desconocidos devuelven null", () => {
  assert.equal(resolveGatewayRoute("GET", "/nada"), null);
  assert.equal(resolveGatewayRoute("DELETE", "/albums/1"), null);
  assert.equal(resolveGatewayRoute("GET", "/albums/1/extra"), null);
});

test("ROUTES: no hay dos acciones para el mismo método y ruta", () => {
  const seen = new Map();
  for (const [action, { method, path }] of Object.entries(ROUTES)) {
    const key = `${method} ${path}`;
    assert.ok(!seen.has(key), `${key} está en "${seen.get(key)}" y en "${action}"`);
    seen.set(key, action);
  }
});

test("ROUTES: cada acción se resuelve a sí misma", () => {
  for (const [action, { method, path }] of Object.entries(ROUTES)) {
    const concrete = path.replace(/:\w+/g, "x");
    assert.equal(resolveGatewayRoute(method, concrete)?.action, action);
  }
});

// Evita el olvido de "añadí una ruta REST y no la puse en gateway.ts".
test("cada ruta REST de los controladores tiene su acción en el gateway", () => {
  const modules = join(here, "..", "..", "..", "apps", "api", "src", "modules");
  const files = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) walk(full);
      else if (name.endsWith(".controller.ts") && name !== "gateway.controller.ts") files.push(full);
    }
  };
  walk(modules);
  assert.ok(files.length > 5, "no se encontraron controladores");

  const missing = [];
  for (const file of files) {
    const src = readFileSync(file, "utf8");
    const base = /@Controller\(\s*(?:"([^"]*)")?\s*\)/.exec(src)?.[1] ?? "";
    for (const m of src.matchAll(/@(Get|Post|Put|Patch|Delete)\(\s*(?:"([^"]*)")?\s*\)/g)) {
      const method = m[1].toUpperCase();
      const path = "/" + [base, m[2] ?? ""].filter(Boolean).join("/");
      const concrete = path.replace(/:\w+/g, "x");
      if (!resolveGatewayRoute(method, concrete)) missing.push(`${method} ${path}  (${file.split(/[\\/]/).pop()})`);
    }
  }
  assert.deepEqual(missing, [], `Rutas sin acción en packages/shared/src/gateway.ts:\n${missing.join("\n")}`);
});
