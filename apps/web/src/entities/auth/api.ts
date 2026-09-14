import { useQuery } from "@tanstack/react-query";
import type { LoginDto, RegisterDto, User } from "@project/shared";
import { http } from "@/shared/api/http";

export const authKeys = {
  me: () => ["auth", "me"] as const,
};

export function fetchMe(): Promise<User> {
  return http.get<User>("/auth/me");
}

export function register(dto: RegisterDto): Promise<User> {
  return http.post<User>("/auth/register", dto);
}

export function login(dto: LoginDto): Promise<User> {
  return http.post<User>("/auth/login", dto);
}

export function logout(): Promise<{ ok: true }> {
  return http.post<{ ok: true }>("/auth/logout", {});
}

// A 401 here just means "not logged in" — not worth retrying. Callers treat
// `data === undefined` (once isLoading settles) as the logged-out state.
export function useCurrentUser() {
  return useQuery({
    queryKey: authKeys.me(),
    queryFn: fetchMe,
    retry: false,
  });
}
