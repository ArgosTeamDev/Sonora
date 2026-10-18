// Minimal SQL migration runner (MySQL). Files in ../migrations are applied in
// name order; each holds an "-- Up" section and a "-- Down" section. Applied
// names are tracked in the `migrations` table.
//   node scripts/migrate.mjs [up|down|status]
// DATABASE_URL resolution matches the API: env var > repo-root .env > local
// docker-compose default.
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createConnection } from "mysql2/promise";

const apiRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const migrationsDir = path.join(apiRoot, "migrations");
try {
  process.loadEnvFile(path.join(apiRoot, "..", "..", ".env"));
} catch {
  // no .env (e.g. production, where pm2 provides the environment)
}
const url = process.env.DATABASE_URL ?? "mysql://sonora:sonora@localhost:3307/sonora";
const command = process.argv[2] ?? "up";

function load(file) {
  const [, up = "", down = ""] = readFileSync(path.join(migrationsDir, file), "utf8").split(
    /^-- (?:Up|Down)\s*$/m,
  );
  return { up, down };
}

// DDL auto-commits in MySQL, so there's no transaction to wrap a migration in:
// a failure mid-file leaves it partially applied and unrecorded. Keep
// migrations idempotent (IF NOT EXISTS) so they can simply be re-run.
const db = await createConnection({ uri: url, multipleStatements: true });
try {
  await db.query(
    "CREATE TABLE IF NOT EXISTS migrations (name VARCHAR(255) NOT NULL PRIMARY KEY, run_on DATETIME NOT NULL)",
  );
  const [rows] = await db.query("SELECT name FROM migrations ORDER BY name");
  const applied = new Set(rows.map((r) => r.name));
  const files = readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();

  if (command === "status") {
    for (const f of files) console.log(`${applied.has(f) ? "applied " : "pending "} ${f}`);
  } else if (command === "up") {
    const pending = files.filter((f) => !applied.has(f));
    for (const f of pending) {
      console.log(`> applying ${f}`);
      await db.query(load(f).up);
      await db.query("INSERT INTO migrations (name, run_on) VALUES (?, UTC_TIMESTAMP())", [f]);
    }
    console.log(pending.length ? "Migrations complete!" : "No migrations to run!");
  } else if (command === "down") {
    const last = files.filter((f) => applied.has(f)).pop();
    if (!last) {
      console.log("Nothing to revert.");
    } else {
      console.log(`> reverting ${last}`);
      await db.query(load(last).down);
      await db.query("DELETE FROM migrations WHERE name = ?", [last]);
    }
  } else {
    throw new Error(`Unknown command "${command}" (use up, down or status)`);
  }
} finally {
  await db.end();
}
