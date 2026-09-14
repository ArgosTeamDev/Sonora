import type { ErrorCode } from "@project/shared";

export abstract class DomainError extends Error {
  abstract readonly code: ErrorCode;
  abstract readonly status: number;
}

export abstract class NotFoundError extends DomainError {
  readonly code = "NOT_FOUND" as const;
  readonly status = 404;
}

export abstract class ConflictError extends DomainError {
  readonly status = 409;
}
