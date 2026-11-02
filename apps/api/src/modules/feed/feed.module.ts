import { Module } from "@nestjs/common";
import { ReviewModule } from "@/modules/review/review.module";
import { ListModule } from "@/modules/list/list.module";
import { FeedController } from "./feed.controller";
import { FeedService } from "./feed.service";

@Module({
  imports: [ReviewModule, ListModule],
  controllers: [FeedController],
  providers: [FeedService],
})
export class FeedModule {}
