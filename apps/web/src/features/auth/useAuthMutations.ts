import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authKeys, login, logout, register } from "@/entities/auth/api";

export function useRegister() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: register,
    onSuccess: (user) => queryClient.setQueryData(authKeys.me(), user),
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: login,
    onSuccess: (user) => queryClient.setQueryData(authKeys.me(), user),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      // Drops every cached result, not just the session — the next login could
      // be a different account, and nothing here should leak between users.
      // resetQueries (not clear) because it also notifies mounted components:
      // the nav and profile re-read /auth/me, get a 401 and flip to logged-out
      // right away instead of showing the old user until a hard reload.
      void queryClient.resetQueries();
    },
  });
}
