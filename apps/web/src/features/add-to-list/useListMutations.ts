import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateListDto, List } from "@project/shared";
import { addListItem, createList, listKeys, removeListItem } from "@/entities/list/api";

// The server answers every list mutation with the full updated list, so the
// cache is patched from that response (replace in place, or prepend a new
// one) instead of refetching — same list-patching approach as useFavoriteAlbum.
export function useListMutations(username: string) {
  const queryClient = useQueryClient();
  const key = listKeys.byUser(username);

  const upsert = (list: List): void => {
    queryClient.setQueryData<List[]>(key, (current) => {
      const lists = current ?? [];
      return lists.some((l) => l.id === list.id)
        ? lists.map((l) => (l.id === list.id ? list : l))
        : [list, ...lists];
    });
  };

  const create = useMutation({
    mutationFn: (dto: CreateListDto) => createList(dto),
    onSuccess: upsert,
  });

  const toggleAlbum = useMutation({
    mutationFn: ({ list, albumId }: { list: List; albumId: string }) =>
      list.albumIds.includes(albumId) ? removeListItem(list.id, albumId) : addListItem(list.id, { albumId }),
    onSuccess: upsert,
  });

  return { create, toggleAlbum };
}
