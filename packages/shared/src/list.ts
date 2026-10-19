import { z } from "zod";

export const ListSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string().trim().min(1).max(80),
  description: z.string().max(300).nullable(),
  // Ordered, first = top of the list.
  albumIds: z.array(z.string().min(1)),
  createdAt: z.coerce.date(),
});
export type List = z.infer<typeof ListSchema>;

export const CreateListDtoSchema = ListSchema.pick({ name: true, description: true }).partial({
  description: true,
});
export type CreateListDto = z.infer<typeof CreateListDtoSchema>;

export const AddListItemDtoSchema = z.object({ albumId: z.string().min(1) });
export type AddListItemDto = z.infer<typeof AddListItemDtoSchema>;
