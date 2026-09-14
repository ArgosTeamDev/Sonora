import { useQuery } from "@tanstack/react-query";
import type { UpdateUserDto, User } from "@project/shared";
import { http } from "@/shared/api/http";

export const userKeys = {
  list: () => ["users", "list"] as const,
  search: (q: string) => ["users", "search", q] as const,
  profile: (username: string) => ["users", "detail", username] as const,
  following: (username: string) => ["users", "detail", username, "following"] as const,
  followers: (username: string) => ["users", "detail", username, "followers"] as const,
};

export function fetchUsers(): Promise<User[]> {
  return http.get<User[]>("/users");
}

export function searchUsers(q: string): Promise<User[]> {
  return http.get<User[]>(`/users?q=${encodeURIComponent(q)}`);
}

export function fetchUser(username: string): Promise<User> {
  return http.get<User>(`/users/${username}`);
}

export function fetchFollowing(username: string): Promise<User[]> {
  return http.get<User[]>(`/users/${username}/following`);
}

export function fetchFollowers(username: string): Promise<User[]> {
  return http.get<User[]>(`/users/${username}/followers`);
}

export function updateUser(username: string, dto: UpdateUserDto): Promise<User> {
  return http.patch<User>(`/users/${username}`, dto);
}

export function useUsers() {
  return useQuery({ queryKey: userKeys.list(), queryFn: fetchUsers });
}

export function useSearchUsers(q: string) {
  return useQuery({
    queryKey: userKeys.search(q),
    queryFn: () => searchUsers(q),
    enabled: q.trim().length > 0,
  });
}

export function useUser(username: string) {
  return useQuery({
    queryKey: userKeys.profile(username),
    queryFn: () => fetchUser(username),
    enabled: Boolean(username),
  });
}

export function useFollowing(username: string) {
  return useQuery({
    queryKey: userKeys.following(username),
    queryFn: () => fetchFollowing(username),
    enabled: Boolean(username),
  });
}

export function useFollowers(username: string) {
  return useQuery({
    queryKey: userKeys.followers(username),
    queryFn: () => fetchFollowers(username),
    enabled: Boolean(username),
  });
}
