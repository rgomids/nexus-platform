import { randomUUID } from "node:crypto";

import { ValidationPipe, type INestApplication } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { SpanStatusCode } from "@opentelemetry/api";
import { Logger } from "nestjs-pino";
import { PinoLogger } from "nestjs-pino";
import type { NextFunction, Request, Response } from "express";

import { AppModule } from "../app.module";
import { RequestCorrelationContext } from "../shared/request-correlation/request-correlation.context";
import { GlobalExceptionFilter } from "./errors/http-exception.filter";
import { createValidationExceptionFactory } from "./errors/validation-exception.factory";
import { ApplicationMetricsService } from "./telemetry/application-metrics.service";
import { ApplicationTelemetryService } from "./telemetry/application-telemetry.service";
import { shutdownTelemetry } from "./telemetry/telemetry.sdk";

export async function createApplication(): Promise<INestApplication> {
  const application = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });
  const requestCorrelationContext = application.get(RequestCorrelationContext);
  const applicationTelemetryService = application.get(ApplicationTelemetryService);
  const applicationMetricsService = application.get(ApplicationMetricsService);

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
    _response.setHeader("x-correlation-id", correlationId);

    const requestStartedAt = performance.now();
    const span = applicationTelemetryService.startHttpServerSpan("http.request", {
      "http.method": request.method,
      "http.route": resolveHttpRoute(request),
      "http.target": request.originalUrl ?? request.url,
      "request.correlation_id": correlationId,
    });
    let requestCompleted = false;
    const finalizeRequest = () => {
      if (requestCompleted) {
        return;
      }

      requestCompleted = true;
      const route = resolveHttpRoute(request);
      const statusCode = _response.statusCode;

      span.setAttribute("http.status_code", statusCode);
      span.setAttribute("http.route", route);
      span.setStatus({
        code: statusCode >= 500 ? SpanStatusCode.ERROR : SpanStatusCode.OK,
      });
      applicationTelemetryService.endHttpServerSpan(
        span,
        {
          "http.route": route,
          "http.status_code": statusCode,
          "request.correlation_id": correlationId,
        },
        statusCode,
      );
      applicationMetricsService.recordHttpRequest({
        durationMs: performance.now() - requestStartedAt,
        method: request.method,
        route,
        statusCode,
      });
    };

    _response.once("finish", finalizeRequest);
    _response.once("close", finalizeRequest);

    applicationTelemetryService.bindSpan(span, () => {
      requestCorrelationContext.run(correlationId, () => next());
    });
  });
  application.useGlobalPipes(
    new ValidationPipe({
      exceptionFactory: createValidationExceptionFactory(),
      forbidNonWhitelisted: true,
      transform: true,
      whitelist: true,
    }),
  );
  application.useGlobalFilters(
    new GlobalExceptionFilter(application.get(PinoLogger), applicationMetricsService),
  );

  return application;
}

export async function disposeApplication(application: INestApplication): Promise<void> {
  await application.close();
  await shutdownTelemetry();
}

function resolveHttpRoute(request: Request): string {
  const route = request.route as { path?: unknown } | undefined;
  const routePath =
    route !== undefined && typeof route.path === "string" ? route.path : undefined;

  if (routePath !== undefined) {
    const baseUrl = typeof request.baseUrl === "string" ? request.baseUrl : "";

    return `${baseUrl}${routePath}`;
  }

  return (request.path ?? request.url).split("?")[0] ?? "unknown";
}
