import { Injectable } from "@nestjs/common";
import type { CreateFavoriteDto, Favorite } from "@project/shared";
import { JsonDb } from "@/shared/json-db/json-db.service";

@Injectable()
export class FavoriteService {
  constructor(private readonly db: JsonDb) {}

  async create(dto: CreateFavoriteDto): Promise<Favorite> {
    const existing = this.db.state.favorites.find(
      (f) => f.userId === dto.userId && f.albumId === dto.albumId,
    );
    if (existing) return existing;

    const favorite: Favorite = { ...dto, createdAt: new Date() };
    await this.db.mutate((data) => {
      data.favorites.push(favorite);
    });
    return favorite;
  }

  async remove(userId: string, albumId: string): Promise<void> {
    await this.db.mutate((data) => {
      data.favorites = data.favorites.filter((f) => !(f.userId === userId && f.albumId === albumId));
    });
  }
}
