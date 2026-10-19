import path from "node:path";

// Load the repo-root .env (the same file scripts/migrate.mjs reads) before
// anything else reads process.env — jwt.ts takes JWT_SECRET at import time.
// Real environment variables win; a missing file is fine (e.g. pm2 env).
try {
  process.loadEnvFile(path.resolve(__dirname, "..", "..", "..", ".env"));
} catch {
  // no .env
}
