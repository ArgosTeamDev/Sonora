import { Injectable, type OnModuleInit } from "@nestjs/common";
import { DatabaseSync } from "node:sqlite";
import path from "node:path";

const DB_PATH = path.resolve(process.cwd(), "..", "..", "data", "sonora.db");

// Only User accounts live here — Review/Follow stay in the JSON store for
// now (see CLAUDE.md). One file, no server to run, works the same on any
// machine.
@Injectable()
export class SqliteService implements OnModuleInit {
  readonly db = new DatabaseSync(DB_PATH);

  onModuleInit(): void {
    this.db.exec(`
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
  }
}
