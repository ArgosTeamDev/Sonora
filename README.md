# SONORA

Rate and review the music you listen to day to day.
Inspired by [Letterboxd](https://letterboxd.com/).

`React + Vite` · `NestJS` · `PostgreSQL` · `PWA`

---

## Getting started

You need Node 20.11 (`nvm use`), pnpm 9 and Docker.

```bash
git clone <url> && cd rotacion
cp .env.example .env
pnpm setup     # installs dependencies and creates data/db.json from the seed
pnpm dev       # api on :4000, web on :5173
```

Open http://localhost:5173/#/explore

## Commands

| Command | What it does |
|---|---|
| `pnpm dev` | Runs api and web in parallel |
| `pnpm build` | Builds both apps |
| `pnpm db:up` | Starts Postgres in Docker |
| `pnpm db:reset` | Drops the volume and starts over |
| `pnpm db:seed` | Regenerates `data/db.json` from the seed |

## Structure

```
apps/api/          NestJS · hexagonal
apps/web/          React + Vite · SPA with hash routing
packages/shared/   the contract: Zod schemas and types used by both
data/              versioned db.seed.json · db.json is ignored
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

Writes to the JSON go through a **serialized queue** and are saved with
`tmp` + `rename`, so there are no corrupt files or writes stepping on each other.

Every `PATCH` sends the `version` the client knows about. If it doesn't match the
server's, it responds **409** instead of overwriting someone else's change.

## Documentation

- [Domain](docs/domain.md) — what the app does and its rules
- [Data model](docs/er.md) — the ER diagram
- [Decisions](docs/decisions.md) — why the stack is what it is

## Notes

- `data/db.json` is in `.gitignore`. Only the seed is versioned.
- Postgres runs on port **5433** to avoid clashing with local installs.
- On Windows, work inside WSL2. Hot reload is very slow under `/mnt/c/`.
- The album catalog is a local seed. It doesn't depend on any external API.
