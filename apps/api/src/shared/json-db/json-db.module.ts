import { Global, Module } from "@nestjs/common";
import { JsonDb } from "./json-db.service";

@Global()
@Module({
  providers: [JsonDb],
  exports: [JsonDb],
})
export class JsonDbModule {}
