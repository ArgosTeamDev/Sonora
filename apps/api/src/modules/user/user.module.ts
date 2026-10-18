import { Module } from "@nestjs/common";
import { ReviewModule } from "@/modules/review/review.module";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";
import { UserRepository } from "./user.repository";

@Module({
  imports: [ReviewModule],
  controllers: [UserController],
  providers: [UserService, UserRepository],
})
export class UserModule {}
