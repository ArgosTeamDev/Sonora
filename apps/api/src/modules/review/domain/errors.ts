import { ConflictError, NotFoundError } from "@/shared/domain/errors";

export class ReviewNotFoundError extends NotFoundError {
  constructor(id: string) {
    super(`Review ${id} not found`);
    this.name = "ReviewNotFoundError";
  }
}

export class StaleVersionError extends ConflictError {
  readonly code = "STALE_VERSION" as const;

  constructor(id: string, currentVersion: number, attemptedVersion: number) {
    super(
      `Review ${id} is at version ${currentVersion}; update targeted version ${attemptedVersion}`,
    );
    this.name = "StaleVersionError";
  }
}

export class DuplicateReviewError extends ConflictError {
  readonly code = "DUPLICATE_REVIEW" as const;

  constructor(userId: string, albumId: string) {
    super(`User ${userId} already has a review for album ${albumId}`);
    this.name = "DuplicateReviewError";
  }
}
