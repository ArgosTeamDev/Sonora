import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { User } from "@project/shared";
import { createFollow, removeFollow } from "@/entities/follow/api";
import { userKeys } from "@/entities/user/api";

interface UseFollowUserParams {
  followerUser: User;
  targetUser: User;
}

// Patches both sides of the relationship in the cache: the follower's
// "following" list and the target's "followers" list. Whoever is looking
// at either profile right now sees the count move instantly, without a
// refetch — same list-patching pattern as everywhere else (CLAUDE.md rule 7).
export function useFollowUser({ followerUser, targetUser }: UseFollowUserParams) {
  const queryClient = useQueryClient();
  const followingKey = userKeys.following(followerUser.username);
  const followersKey = userKeys.followers(targetUser.username);

  return useMutation<
    void,
    unknown,
    boolean,
    { previousFollowing?: User[]; previousFollowers?: User[] }
  >({
    mutationFn: async (nextIsFollowing: boolean) => {
      if (nextIsFollowing) {
        await createFollow({ followerId: followerUser.id, followingId: targetUser.id });
      } else {
        await removeFollow(followerUser.id, targetUser.id);
      }
    },

    onMutate: async (nextIsFollowing) => {
      await queryClient.cancelQueries({ queryKey: followingKey });
      await queryClient.cancelQueries({ queryKey: followersKey });
      const previousFollowing = queryClient.getQueryData<User[]>(followingKey);
      const previousFollowers = queryClient.getQueryData<User[]>(followersKey);

      queryClient.setQueryData<User[]>(followingKey, (current) => {
        const withoutTarget = (current ?? []).filter((u) => u.id !== targetUser.id);
        return nextIsFollowing ? [...withoutTarget, targetUser] : withoutTarget;
      });
      queryClient.setQueryData<User[]>(followersKey, (current) => {
        const withoutFollower = (current ?? []).filter((u) => u.id !== followerUser.id);
        return nextIsFollowing ? [...withoutFollower, followerUser] : withoutFollower;
      });

      return { previousFollowing, previousFollowers };
    },

    onError: (_error, _input, context) => {
      if (context?.previousFollowing) queryClient.setQueryData(followingKey, context.previousFollowing);
      if (context?.previousFollowers) queryClient.setQueryData(followersKey, context.previousFollowers);
    },
  });
}
