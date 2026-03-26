import { randomUUID } from "node:crypto";

import { ValidationPipe, type INestApplication } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { Logger } from "nestjs-pino";
import { PinoLogger } from "nestjs-pino";
import type { NextFunction, Request, Response } from "express";

import { AppModule } from "../app.module";
import { RequestCorrelationContext } from "../shared/request-correlation/request-correlation.context";
import { GlobalExceptionFilter } from "./errors/http-exception.filter";
import { shutdownTelemetry } from "./telemetry/telemetry.sdk";

export async function createApplication(): Promise<INestApplication> {
  const application = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });
  const requestCorrelationContext = application.get(RequestCorrelationContext);

  application.useLogger(application.get(Logger));
  application.enableShutdownHooks();
  application.use((request: Request & { id?: string | number }, _response: Response, next: NextFunction) => {
    const correlationHeader = request.headers["x-correlation-id"];
    const correlationId =
      typeof correlationHeader === "string" && correlationHeader.length > 0
        ? correlationHeader
        : Array.isArray(correlationHeader) && correlationHeader[0] !== undefined
          ? correlationHeader[0]
          :
      typeof request.id === "string" || typeof request.id === "number"
        ? request.id.toString()
        : randomUUID();

    request.id = correlationId;

    requestCorrelationContext.run(correlationId, () => next());
  });
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
