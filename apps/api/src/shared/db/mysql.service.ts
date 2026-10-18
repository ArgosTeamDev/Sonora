import { Injectable, type OnModuleDestroy } from "@nestjs/common";
import { createPool, type ResultSetHeader } from "mysql2/promise";

const DEFAULT_URL = "mysql://sonora:sonora@localhost:3307/sonora";

// The schema is managed by the SQL files in apps/api/migrations (run with
// `pnpm db:migrate`). Albums and artists aren't stored: catalog data comes
// live from iTunes, so album_id columns are plain iTunes collectionIds.
@Injectable()
export class MysqlService implements OnModuleDestroy {
  // timezone "Z": DATETIME columns hold UTC and come back as UTC Date objects.
  // decimalNumbers: DECIMAL (ratings) as numbers instead of strings.
  readonly pool = createPool({
    uri: process.env.DATABASE_URL ?? DEFAULT_URL,
    timezone: "Z",
    decimalNumbers: true,
  });

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }

  async select<R>(sql: string, params: unknown[] = []): Promise<R[]> {
    const [rows] = await this.pool.query(sql, params);
    return rows as R[];
  }

  async execute(sql: string, params: unknown[] = []): Promise<ResultSetHeader> {
    const [result] = await this.pool.query(sql, params);
    return result as ResultSetHeader;
  }
}
