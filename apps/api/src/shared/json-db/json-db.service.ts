import { Injectable, type OnModuleInit } from "@nestjs/common";
import { existsSync } from "node:fs";
import { readFile, rename, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { DbShapeSchema, type DbShape } from "@project/shared";

const DB_PATH = path.resolve(process.cwd(), "..", "..", "data", "db.json");

const emptyDb = (): DbShape => ({
  albumOverlays: [],
  reviews: [],
  follows: [],
  favorites: [],
});

@Injectable()
export class JsonDb implements OnModuleInit {
  private data: DbShape = emptyDb();
  private queue: Promise<unknown> = Promise.resolve();

  async onModuleInit(): Promise<void> {
    if (!existsSync(DB_PATH)) {
      this.data = emptyDb();
      return;
    }
    const raw = await readFile(DB_PATH, "utf-8");
    this.data = DbShapeSchema.parse(JSON.parse(raw));
  }

  get state(): DbShape {
    return this.data;
  }

  mutate<T>(fn: (data: DbShape) => T): Promise<T> {
    const task = this.queue.then(async () => {
      const result = fn(this.data);
      await this.persist();
      return result;
    });
    this.queue = task.then(
      () => undefined,
      () => undefined,
    );
    return task;
  }

  private async persist(): Promise<void> {
    const tmpPath = `${DB_PATH}.${randomUUID()}.tmp`;
    await writeFile(tmpPath, JSON.stringify(this.data, null, 2), "utf-8");
    await rename(tmpPath, DB_PATH);
  }
}
