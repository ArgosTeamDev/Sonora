import { Controller, Get, Param, Query } from "@nestjs/common";
import type { AlbumWithStats } from "@project/shared";
import { ListAlbumsUseCase } from "@/modules/album/application/list-albums.use-case";
import { GetAlbumUseCase } from "@/modules/album/application/get-album.use-case";

@Controller("albums")
export class AlbumController {
  constructor(
    private readonly listAlbums: ListAlbumsUseCase,
    private readonly getAlbum: GetAlbumUseCase,
  ) {}

  @Get()
  list(
    @Query("genre") genre?: string,
    @Query("year") year?: string,
    @Query("artistId") artistId?: string,
    @Query("sort") sort?: "rating" | "year" | "title",
    @Query("q") q?: string,
    @Query("ids") ids?: string,
  ): Promise<AlbumWithStats[]> {
    return this.listAlbums.execute({
      genre,
      year: year !== undefined ? Number(year) : undefined,
      artistId,
      sort,
      q,
      ids: ids ? ids.split(",").filter(Boolean) : undefined,
    });
  }

  @Get(":id")
  getOne(@Param("id") id: string): Promise<AlbumWithStats> {
    return this.getAlbum.execute(id);
  }
}
