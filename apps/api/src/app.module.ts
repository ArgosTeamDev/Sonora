import { Module } from "@nestjs/common";
import { JsonDbModule } from "./shared/json-db/json-db.module";
import { SqliteModule } from "./shared/db/sqlite.module";
import { ReviewModule } from "./modules/review/review.module";
import { AlbumModule } from "./modules/album/album.module";
import { UserModule } from "./modules/user/user.module";
import { FollowModule } from "./modules/follow/follow.module";
import { FavoriteModule } from "./modules/favorite/favorite.module";
import { AuthModule } from "./modules/auth/auth.module";

@Module({
  imports: [
    JsonDbModule,
    SqliteModule,
    ReviewModule,
    AlbumModule,
    UserModule,
    FollowModule,
    FavoriteModule,
    AuthModule,
  ],
})
export class AppModule {}
