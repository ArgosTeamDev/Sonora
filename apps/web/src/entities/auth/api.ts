import { useQuery } from "@tanstack/react-query";
import type { ChangePasswordDto, DeleteAccountDto, LoginDto, RegisterDto, User } from "@project/shared";
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

export function changePassword(dto: ChangePasswordDto): Promise<{ ok: true }> {
  return http.post<{ ok: true }>("/auth/password", dto);
}

export function deleteAccount(dto: DeleteAccountDto): Promise<{ ok: true }> {
  return http.post<{ ok: true }>("/auth/delete-account", dto);
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
