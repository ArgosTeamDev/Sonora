// One-time migration: moves `users` out of data/db.seed.json and
// data/db.json into data/sonora.db (SQLite), since accounts now need a
// password hash — not something that belongs in a plaintext JSON file.
// Every migrated account gets the same default password so they stay
// loginable for local testing.
import { DatabaseSync } from "node:sqlite";
import { readFileSync, writeFileSync } from "node:fs";
import { randomBytes, scryptSync } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(root, "..", "data", "sonora.db");
const seedPath = path.join(root, "..", "data", "db.seed.json");
const jsonDbPath = path.join(root, "..", "data", "db.json");

const DEFAULT_PASSWORD = "password123";

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

const db = new DatabaseSync(dbPath);
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    bio TEXT,
    avatar_url TEXT,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1
  )
`);

const insert = db.prepare(`
  INSERT OR IGNORE INTO users (id, username, name, bio, avatar_url, password_hash, created_at, version)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

let migratedCount = 0;

for (const file of [seedPath, jsonDbPath]) {
  const data = JSON.parse(readFileSync(file, "utf8"));
  if (!data.users) {
    console.log(`${path.basename(file)}: no users field, skipping.`);
    continue;
  }

  for (const user of data.users) {
    insert.run(
      user.id,
      user.username,
      user.name,
      user.bio ?? null,
      user.avatarUrl ?? null,
      hashPassword(DEFAULT_PASSWORD),
      new Date(user.createdAt).toISOString(),
      user.version ?? 1,
    );
    migratedCount++;
  }

  delete data.users;
  writeFileSync(file, JSON.stringify(data, null, 2) + "\n", "utf8");
  console.log(`${path.basename(file)}: migrated ${data.users?.length ?? "0"} users, field removed.`);
}

console.log(`\nDone. ${migratedCount} user rows written to ${dbPath}.`);
console.log(`Default password for every migrated account: ${DEFAULT_PASSWORD}`);
