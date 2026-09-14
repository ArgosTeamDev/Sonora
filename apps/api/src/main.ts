import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { DomainExceptionFilter } from "./shared/http/domain-exception.filter";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("api");
  // credentials: true + reflected origin, since the auth cookie needs to
  // round-trip even when the app isn't accessed through Vite's same-origin
  // dev proxy.
  app.enableCors({ origin: true, credentials: true });
  app.useGlobalFilters(new DomainExceptionFilter());
  await app.listen(4000);
}

bootstrap();
