import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import {
  AddListItemDtoSchema,
  CreateListDtoSchema,
  type AddListItemDto,
  type CreateListDto,
  type List,
} from "@project/shared";
import { ZodValidationPipe } from "@/shared/http/zod-validation.pipe";
import { AuthGuard, type AuthenticatedRequest } from "@/shared/auth/auth.guard";
import { ListService } from "./list.service";

@Controller()
export class ListController {
  constructor(private readonly lists: ListService) {}

  @Get("lists")
  getRecent(@Query("limit") limit?: string): Promise<List[]> {
    const parsed = Number.parseInt(limit ?? "", 10);
    return this.lists.findRecent(Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), 24) : 6);
  }

  @Get("users/:username/lists")
  getByUser(@Param("username") username: string): Promise<List[]> {
    return this.lists.findByUsername(username);
  }

  // The owner is always whoever the auth cookie says — never taken from the body.
  @Post("lists")
  @UseGuards(AuthGuard)
  create(
    @Body(new ZodValidationPipe(CreateListDtoSchema)) dto: CreateListDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<List> {
    return this.lists.create(req.authUser!.id, dto);
  }

  @Delete("lists/:id")
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param("id") id: string, @Req() req: AuthenticatedRequest): Promise<void> {
    return this.lists.remove(id, req.authUser!.id);
  }

  @Post("lists/:id/items")
  @UseGuards(AuthGuard)
  addItem(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(AddListItemDtoSchema)) dto: AddListItemDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<List> {
    return this.lists.addItem(id, req.authUser!.id, dto);
  }

  @Delete("lists/:id/items/:albumId")
  @UseGuards(AuthGuard)
  removeItem(
    @Param("id") id: string,
    @Param("albumId") albumId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<List> {
    return this.lists.removeItem(id, req.authUser!.id, albumId);
  }
}
