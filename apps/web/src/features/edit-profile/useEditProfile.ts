import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UpdateUserDto, User } from "@project/shared";
import { updateUser, userKeys } from "@/entities/user/api";
import { authKeys } from "@/entities/auth/api";

// Editing a profile is only ever offered for your own (see ProfilePage's
// isOwnProfile gate), so this patches both the profile-detail cache
// (useUser(username), what the page you're looking at reads) and the
// session cache (useCurrentUser(), what TopNav/BottomNav read) — same
// account, two different cache entries, both need to agree instantly.
export function useEditProfile(username: string) {
  const queryClient = useQueryClient();
  const profileKey = userKeys.profile(username);
  const meKey = authKeys.me();

  return useMutation<
    User,
    unknown,
    UpdateUserDto,
    { previousProfile?: User; previousMe?: User }
  >({
    mutationFn: (dto: UpdateUserDto) => updateUser(username, dto),

    onMutate: async (dto) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: profileKey }),
        queryClient.cancelQueries({ queryKey: meKey }),
      ]);
      const previousProfile = queryClient.getQueryData<User>(profileKey);
      const previousMe = queryClient.getQueryData<User>(meKey);

      const patch = (current: User | undefined): User | undefined => (current ? { ...current, ...dto } : current);
      queryClient.setQueryData<User>(profileKey, patch);
      queryClient.setQueryData<User>(meKey, patch);

      return { previousProfile, previousMe };
    },

    onError: (_error, _dto, context) => {
      if (context?.previousProfile) queryClient.setQueryData(profileKey, context.previousProfile);
      if (context?.previousMe) queryClient.setQueryData(meKey, context.previousMe);
    },

    onSuccess: (user) => {
      queryClient.setQueryData(profileKey, user);
      queryClient.setQueryData(meKey, user);
    },
  });
}
