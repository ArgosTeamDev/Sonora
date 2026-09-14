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
      // Clears every cache, not just the session — the next login could be
      // a different account, and nothing here should leak between users.
      queryClient.clear();
    },
  });
}
