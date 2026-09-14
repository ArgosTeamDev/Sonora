// Minimal ambient types for Node's built-in `node:sqlite` module (stable as
// of Node 22.5+; this project runs on Node 24). Not yet shipped in the
// pinned @types/node version, so declared by hand instead of bumping a
// shared devDependency for a handful of methods.
declare module "node:sqlite" {
  export interface StatementResultingChanges {
    changes: number | bigint;
    lastInsertRowid: number | bigint;
  }

  export class StatementSync {
    run(...params: unknown[]): StatementResultingChanges;
    get(...params: unknown[]): Record<string, unknown> | undefined;
    all(...params: unknown[]): Record<string, unknown>[];
  }

  export class DatabaseSync {
    constructor(location: string, options?: { open?: boolean });
    exec(sql: string): void;
    prepare(sql: string): StatementSync;
    close(): void;
  }
}
