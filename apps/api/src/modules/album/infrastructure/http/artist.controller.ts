import { Controller, Get, Param } from "@nestjs/common";
import type { ArtistDiscography } from "@project/shared";
import { GetArtistUseCase } from "@/modules/album/application/get-artist.use-case";

@Controller("artists")
export class ArtistController {
  constructor(private readonly getArtist: GetArtistUseCase) {}

  @Get(":slug")
  getOne(@Param("slug") slug: string): Promise<ArtistDiscography> {
    return this.getArtist.execute(slug);
  }
}
