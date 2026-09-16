# Decisiones de arquitectura


## 1. Monorepo con pnpm workspaces + Turborepo
**Contexto.** Frontend y backend en TypeScript, los mismos tipos en ambos lados.
**Decisión.** Un solo repo con `packages/shared` como contrato compartido.
**Consecuencia.** Si cambia un campo en el backend, el frontend deja de compilar
en ese instante. A cambio, el despliegue necesita configurar el root directory.

## 2. Arquitectura hexagonal, pero solo donde se gana su lugar
**Contexto.** La entrega 1 persiste en JSON, la 2 en PostgreSQL. Pero no todos
los módulos tienen lógica de negocio.
**Decisión.** Hexagonal completo en `review`. Los módulos de solo lectura
(`album`, `user`) van controller → servicio → persistencia, sin capa de dominio.
**Consecuencia.** El módulo que importa queda protegido y es testeable sin base de
datos. Los CRUD triviales no cargan con cinco archivos para un `GET`.

## 3. Persistencia en archivo JSON (entrega 1)
**Contexto.** Requerimiento explícito del entregable.
**Decisión.** `JsonDb` con los datos en memoria, una cola de escritura serializada
y escritura atómica (tmp + rename). Validado con Zod al cargar.
**Consecuencia.** Sin condiciones de carrera ni archivos corruptos a medio escribir.
No escala a múltiples procesos, pero no lo necesita.

## 4. Navegación basada en hash
**Contexto.** Requerimiento explícito.
**Decisión.** `createHashRouter` de react-router, un solo `index.html`.
**Consecuencia.** Encaja perfecto con la PWA: un shell que se precachea completo y
funciona offline sin rewrites en el servidor. Se renuncia al SEO.

## 5. Vite en lugar de Next.js
**Contexto.** El hash routing, la PWA offline y tener el backend aparte en NestJS
desactivan casi todo lo que hace valioso a Next (SSR, file-based routing,
server actions).
**Decisión.** Vite + React.
**Consecuencia.** Cero tiempo gastado en desactivar funciones del framework.
Si algún día hiciera falta SEO, habría que migrar.

## 6. PostgreSQL en lugar de NoSQL
**Contexto.** El modelo es claramente relacional: reseñas que conectan usuarios
con álbumes, con una restricción de unicidad que es la regla central del dominio.
**Decisión.** Postgres. `genres` como array nativo; JSONB solo si aparece algo
realmente sin esquema.
**Consecuencia.** El único `(user_id, album_id)` lo aplica la base de datos, no el
código. FKs y transacciones gratis.

## 7. Bloqueo optimista con columna `version`
**Contexto.** El requerimiento de actualización granular implica escrituras
parciales que pueden ser concurrentes (la misma reseña abierta en dos dispositivos).
**Decisión.** Cada `PATCH` manda la `version` que conoce; el servidor responde 409
si no coincide.
**Consecuencia.** Nadie sobrescribe el cambio de nadie. Diez líneas de código.

## 8. El promedio de un álbum no se almacena
**Contexto.** Es el dato más consultado de la app y se podría cachear en `albums`.
**Decisión.** Calcularlo al leer, a partir de las reseñas.
**Consecuencia.** Cero riesgo de inconsistencia. Si el rendimiento duele con
catálogos grandes, se desnormaliza entonces — con una medición en mano.

## 9. Catálogo como seed local
**Contexto.** Se evaluaron MusicBrainz (gratis, sin autenticación) y Spotify
(mejor catálogo, pero OAuth y tokens).
**Decisión.** 20 álbumes precargados en `data/db.seed.json`.
**Consecuencia.** Cero dependencias externas, funciona offline, y se ahorra la
entidad de sincronización. Los campos `mbid` y `spotifyId` quedan listos por si acaso.

---

## Plantilla para las siguientes

## N. Título
**Contexto.**
**Decisión.**
**Consecuencia.**