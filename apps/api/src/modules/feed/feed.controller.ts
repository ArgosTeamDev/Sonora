import { Controller, Get, Query, Req, UseGuards } from "@nestjs/common";
import type { FeedEvent } from "@project/shared";
import { AuthGuard, type AuthenticatedRequest } from "@/shared/auth/auth.guard";
import { FeedService } from "./feed.service";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

@Controller("feed")
export class FeedController {
  constructor(private readonly feed: FeedService) {}

  // Always the caller's own circle: there is no way to read someone else's feed.
  @Get()
  @UseGuards(AuthGuard)
  list(@Req() req: AuthenticatedRequest, @Query("limit") limit?: string): Promise<FeedEvent[]> {
    const parsed = Number.parseInt(limit ?? "", 10);
    const size = Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), MAX_LIMIT) : DEFAULT_LIMIT;
    return this.feed.forUser(req.authUser!.id, size);
  }
}
