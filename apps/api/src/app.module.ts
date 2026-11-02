import { Module } from "@nestjs/common";
import { MysqlModule } from "./shared/db/mysql.module";
import { ReviewModule } from "./modules/review/review.module";
import { AlbumModule } from "./modules/album/album.module";
import { UserModule } from "./modules/user/user.module";
import { FollowModule } from "./modules/follow/follow.module";
import { FavoriteModule } from "./modules/favorite/favorite.module";
import { ListModule } from "./modules/list/list.module";
import { WatchlistModule } from "./modules/watchlist/watchlist.module";
import { ReviewLikeModule } from "./modules/review-like/review-like.module";
import { FeedModule } from "./modules/feed/feed.module";
import { AuthModule } from "./modules/auth/auth.module";
import { GatewayModule } from "./modules/gateway/gateway.module";

@Module({
  imports: [
    MysqlModule,
    ReviewModule,
    AlbumModule,
    UserModule,
    FollowModule,
    FavoriteModule,
    ListModule,
    WatchlistModule,
    ReviewLikeModule,
    FeedModule,
    AuthModule,
    GatewayModule,
  ],
})
export class AppModule {}
