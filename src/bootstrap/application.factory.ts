import { ValidationPipe, type INestApplication } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { Logger } from "nestjs-pino";
import { PinoLogger } from "nestjs-pino";

import { AppModule } from "../app.module";
import { GlobalExceptionFilter } from "./errors/http-exception.filter";
import { shutdownTelemetry } from "./telemetry/telemetry.sdk";

export async function createApplication(): Promise<INestApplication> {
  const application = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  application.useLogger(application.get(Logger));
  application.enableShutdownHooks();
  application.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: true,
      whitelist: true,
    }),
  );
  application.useGlobalFilters(new GlobalExceptionFilter(application.get(PinoLogger)));

  return application;
}

export async function disposeApplication(application: INestApplication): Promise<void> {
  await application.close();
  await shutdownTelemetry();
}
