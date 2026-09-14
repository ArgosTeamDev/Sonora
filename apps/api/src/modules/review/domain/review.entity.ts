import type { CreateReviewDto, Review, UpdateReviewDto } from "@project/shared";
import { StaleVersionError } from "./errors";

export class ReviewEntity {
  private constructor(private state: Review) {}

  static create(dto: CreateReviewDto, id: string): ReviewEntity {
    const now = new Date();
    return new ReviewEntity({
      ...dto,
      id,
      version: 1,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromState(state: Review): ReviewEntity {
    return new ReviewEntity(state);
  }

  update(patch: UpdateReviewDto): void {
    if (patch.version !== this.state.version) {
      throw new StaleVersionError(this.state.id, this.state.version, patch.version);
    }
    const { version: _version, ...changes } = patch;
    this.state = {
      ...this.state,
      ...changes,
      version: this.state.version + 1,
      updatedAt: new Date(),
    };
  }

  toJSON(): Review {
    return this.state;
  }
}
