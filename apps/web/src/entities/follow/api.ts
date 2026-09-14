import type { CreateFollowDto, Follow } from "@project/shared";
import { http } from "@/shared/api/http";

export function createFollow(dto: CreateFollowDto): Promise<Follow> {
  return http.post<Follow>("/follows", dto);
}

export function removeFollow(followerId: string, followingId: string): Promise<void> {
  return http.del<void>(`/follows/${followerId}/${followingId}`);
}
