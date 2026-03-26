import type { INestApplication } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { Logger } from "nestjs-pino";

import { AppModule } from "../app.module";
import { shutdownTelemetry } from "./telemetry/telemetry.sdk";

export async function createApplication(): Promise<INestApplication> {
  const application = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  application.useLogger(application.get(Logger));
  application.enableShutdownHooks();

  return application;
}

export async function disposeApplication(application: INestApplication): Promise<void> {
  await application.close();
  await shutdownTelemetry();
}
