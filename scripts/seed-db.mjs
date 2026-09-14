import { copyFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(fileURLToPath(import.meta.url));
const seedPath = path.join(root, "..", "data", "db.seed.json");
const dbPath = path.join(root, "..", "data", "db.json");

copyFileSync(seedPath, dbPath);
console.log(`Seeded ${dbPath} from ${seedPath}`);
