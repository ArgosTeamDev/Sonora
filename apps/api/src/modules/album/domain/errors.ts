import { NotFoundError } from "@/shared/domain/errors";

export class AlbumNotFoundError extends NotFoundError {
  constructor(id: string) {
    super(`Album ${id} not found`);
    this.name = "AlbumNotFoundError";
  }
}
