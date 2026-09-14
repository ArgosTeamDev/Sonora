# Architecture decisions

Format: context → decision → consequence. Three lines each.
They're here for when you open the repo in six months and don't remember why.

This file only grows. If you change your mind, add a new entry that
says "replaces N" instead of editing the old one.

---

## 1. Monorepo with pnpm workspaces + Turborepo
**Context.** Frontend and backend in TypeScript, same types on both sides.
**Decision.** One repo with `packages/shared` as the shared contract.
**Consequence.** If a field changes in the backend, the frontend stops compiling
that instant. In exchange, deployment needs a configured root directory.

## 2. Hexagonal architecture, but only where it earns its keep
**Context.** Delivery 1 persists to JSON, delivery 2 to PostgreSQL. But not every
module has business logic.
**Decision.** Full hexagonal in `review`. Read-only modules
(`album`, `user`) go controller → service → persistence, no domain layer.
**Consequence.** The module that matters is protected and testable without a database.
Trivial CRUD doesn't carry five files for a `GET`.

## 3. JSON file persistence (delivery 1)
**Context.** Explicit requirement of the deliverable.
**Decision.** `JsonDb` with in-memory data, a serialized write queue and
atomic writes (tmp + rename). Validated with Zod on load.
**Consequence.** No race conditions or half-written corrupt files.
Doesn't scale to multiple processes, but doesn't need to.

## 4. Hash-based routing
**Context.** Explicit requirement.
**Decision.** react-router's `createHashRouter`, a single `index.html`.
**Consequence.** Fits perfectly with the PWA: a shell that precaches completely
and works offline with no server rewrites. SEO is given up.

## 5. Vite instead of Next.js
**Context.** Hash routing, offline PWA and a separate NestJS backend turn off
almost everything that makes Next valuable (SSR, file-based routing, server actions).
**Decision.** Vite + React.
**Consequence.** Zero time spent disabling framework features.
If SEO is ever needed, a migration would be required.

## 6. PostgreSQL instead of NoSQL
**Context.** The model is clearly relational: reviews connecting users
to albums, with a uniqueness constraint that's the domain's central rule.
**Decision.** Postgres. `genres` as a native array; JSONB only if something
truly schemaless shows up.
**Consequence.** The unique `(user_id, album_id)` is enforced by the database, not the code.
FKs and transactions for free.

## 7. Optimistic locking with a `version` column
**Context.** The granular-update requirement implies partial writes that
can be concurrent (the same review open on two devices).
**Decision.** Every `PATCH` sends the known `version`; the server responds 409
if it doesn't match.
**Consequence.** Nobody overwrites anybody else's change. Ten lines of code.

## 8. An album's average is not stored
**Context.** It's the most queried piece of data in the app and could be cached on `albums`.
**Decision.** Compute it on read, from the reviews.
**Consequence.** Zero risk of inconsistency. If performance hurts with large
catalogs, it gets denormalized then — with a measurement in hand.

## 9. Catalog as a local seed
**Context.** MusicBrainz (free, no auth) and Spotify (better catalog,
but OAuth and tokens) were evaluated.
**Decision.** 20 albums preloaded in `data/db.seed.json`.
**Consequence.** Zero external dependencies, works offline, and saves the
sync entity. `mbid` and `spotifyId` fields are ready just in case.

---

## Template for the next ones

## N. Title
**Context.**
**Decision.**
**Consequence.**
