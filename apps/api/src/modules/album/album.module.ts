import { Module } from "@nestjs/common";
import { ReviewModule } from "@/modules/review/review.module";
import { AlbumController } from "./infrastructure/http/album.controller";
import { AlbumRepository } from "./domain/album.repository";
import { AlbumOverlayRepository } from "./domain/album-overlay.repository";
import { JsonAlbumOverlayRepository } from "./infrastructure/persistence/json/json-album-overlay.repository";
import { ItunesClient } from "./infrastructure/itunes/itunes-client";
import { ItunesAlbumRepository } from "./infrastructure/itunes/itunes-album.repository";
import { ListAlbumsUseCase } from "./application/list-albums.use-case";
import { GetAlbumUseCase } from "./application/get-album.use-case";

@Module({
  imports: [ReviewModule],
  controllers: [AlbumController],
  providers: [
    ItunesClient,
    { provide: AlbumOverlayRepository, useClass: JsonAlbumOverlayRepository },
    { provide: AlbumRepository, useClass: ItunesAlbumRepository },
    ListAlbumsUseCase,
    GetAlbumUseCase,
  ],
})
export class AlbumModule {}
