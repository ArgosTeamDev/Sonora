import { Module } from "@nestjs/common";
import { ReviewModule } from "@/modules/review/review.module";
import { AlbumController } from "./infrastructure/http/album.controller";
import { AlbumRepository } from "./domain/album.repository";
import { AlbumOverlayRepository } from "./domain/album-overlay.repository";
import { MysqlAlbumOverlayRepository } from "./infrastructure/persistence/mysql/mysql-album-overlay.repository";
import { ItunesClient } from "./infrastructure/itunes/itunes-client";
import { ItunesAlbumRepository } from "./infrastructure/itunes/itunes-album.repository";
import { DeezerClient } from "./infrastructure/deezer/deezer-client";
import { MusicBrainzClient } from "./infrastructure/musicbrainz/musicbrainz-client";
import { CatalogAlbumRepository } from "./infrastructure/catalog-album.repository";
import { ListAlbumsUseCase } from "./application/list-albums.use-case";
import { GetAlbumUseCase } from "./application/get-album.use-case";

@Module({
  imports: [ReviewModule],
  controllers: [AlbumController],
  providers: [
    ItunesClient,
    { provide: AlbumOverlayRepository, useClass: MysqlAlbumOverlayRepository },
    ItunesAlbumRepository,
    DeezerClient,
    MusicBrainzClient,
    { provide: AlbumRepository, useClass: CatalogAlbumRepository },
    ListAlbumsUseCase,
    GetAlbumUseCase,
  ],
})
export class AlbumModule {}
