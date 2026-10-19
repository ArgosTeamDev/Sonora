# SONORA

Rate and review the music you listen to day to day.
Inspired by [Letterboxd](https://letterboxd.com/).

`React + Vite` · `NestJS` · `MySQL` · `PWA`

---

## Getting started

You need Node 20.11 (`nvm use`), pnpm 9 and Docker (for MySQL).

```bash
git clone <url> && cd rotacion
cp .env.example .env
pnpm setup     # installs dependencies, starts MySQL (docker compose) and runs the migrations
pnpm dev       # api on :4000, web on :5173
pnpm db:import # optional, once: loads the legacy data/ files into MySQL
```

Open http://localhost:5173/#/explore

## Commands

| Command | What it does |
|---|---|
| `pnpm dev` | Runs api and web in parallel |
| `pnpm build` | Builds both apps |
| `pnpm db:up` | Starts MySQL in Docker (port 3307) |
| `pnpm db:migrate` | Applies pending SQL migrations (`apps/api/migrations`) |
| `pnpm db:reset` | Drops the volume and starts over (then run `pnpm db:migrate`) |
| `pnpm db:import` | One-time import of `data/db.json` + `data/sonora.db` into MySQL |

## Structure

```
apps/api/          NestJS · hexagonal
apps/web/          React + Vite · SPA with hash routing
packages/shared/   the contract: Zod schemas and types used by both
data/              legacy JSON/SQLite files, only read by `pnpm db:import`
docs/              domain, data model, decisions
.claude/commands/  per-stage prompts for the agent
```

## How it works

The **contract** lives in `packages/shared`. A Zod schema generates the
TypeScript type and validates at runtime, on both sides. If you change a field there,
both apps stop compiling.

The backend is **hexagonal** in the review module, which is where the real
business rules live. Read-only modules (albums, artists) go straight to
persistence with no domain layer.

Everything lives in **MySQL** (`DATABASE_URL`, default
`mysql://sonora:sonora@localhost:3307/sonora`). The schema is versioned as plain
SQL files in `apps/api/migrations` (`-- Up` / `-- Down` sections), applied in
name order by `apps/api/scripts/migrate.mjs`; add one by creating the next
`NNN_name.sql`. Album and artist data isn't stored: it comes live from iTunes, so
`album_id` columns hold the iTunes `collectionId`.

Every `PATCH` sends the `version` the client knows about. If it doesn't match the
server's, it responds **409** instead of overwriting someone else's change.

## Documentation

- [Domain](docs/domain.md) — what the app does and its rules
- [Data model](docs/er.md) — the ER diagram
- [Decisions](docs/decisions.md) — why the stack is what it is

## Notes

- In production set `DATABASE_URL` and `JWT_SECRET` in the environment of the `api` process (pm2); on CloudPanel use the credentials of the database you create for the site (`mysql://user:pass@127.0.0.1:3306/db`). The deploy workflow runs `migrate up` before restarting it.
- MySQL runs on port **3307** to avoid clashing with local installs.
- On Windows, work inside WSL2. Hot reload is very slow under `/mnt/c/`.
- The album catalog comes from the iTunes Search API; only our own data lives in MySQL.
