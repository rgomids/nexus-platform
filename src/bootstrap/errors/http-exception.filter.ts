import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";
import type { Request, Response } from "express";

import { ApplicationMetricsService } from "../telemetry/application-metrics.service";
import type { RequestWithSecurityContext } from "../../shared/auth/request-context.types";
import {
  AuthenticationError,
  AuthorizationError,
  ConflictError,
  NexusError,
  NotFoundError,
  ValidationError,
} from "../../shared/domain/nexus.errors";

interface ErrorResponseBody {
  readonly error: string;
  readonly message: string | string[];
  readonly correlation_id: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  public constructor(
    private readonly logger: PinoLogger,
    private readonly applicationMetricsService: ApplicationMetricsService,
  ) {
    this.logger.setContext(GlobalExceptionFilter.name);
  }

  public catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const request = context.getRequest<Request & { id?: string | number }>();
    const response = context.getResponse<Response>();
    const correlationId = this.readCorrelationId(request);
    const normalizedError = this.normalizeError(exception, correlationId);

    response.setHeader("x-correlation-id", correlationId);
    this.logFailure(request, normalizedError);
    response.status(normalizedError.statusCode).json(normalizedError.body);
  }

  private normalizeError(
    exception: unknown,
    correlationId: string,
  ): {
    readonly body: ErrorResponseBody;
    readonly code: string;
    readonly statusCode: number;
  } {
    if (exception instanceof HttpException) {
      return this.normalizeHttpException(exception, correlationId);
    }

    if (exception instanceof ValidationError) {
      return this.buildNexusErrorResponse(exception, HttpStatus.BAD_REQUEST, correlationId);
    }

    if (exception instanceof ConflictError) {
      return this.buildNexusErrorResponse(exception, HttpStatus.CONFLICT, correlationId);
    }

    if (exception instanceof AuthenticationError) {
      return this.buildNexusErrorResponse(
        exception,
        HttpStatus.UNAUTHORIZED,
        correlationId,
      );
    }

    if (exception instanceof AuthorizationError) {
      return this.buildNexusErrorResponse(exception, HttpStatus.FORBIDDEN, correlationId);
    }

    if (exception instanceof NotFoundError) {
      return this.buildNexusErrorResponse(exception, HttpStatus.NOT_FOUND, correlationId);
    }

    return {
      body: {
        correlation_id: correlationId,
        error: "internal_error",
        message: "Internal server error",
      },
      code: "internal_error",
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    };
  }

  private normalizeHttpException(
    exception: HttpException,
    correlationId: string,
  ): {
    readonly body: ErrorResponseBody;
    readonly code: string;
    readonly statusCode: number;
  } {
    const statusCode = exception.getStatus();
    const response = exception.getResponse();

    if (typeof response === "string") {
      return {
        body: {
          correlation_id: correlationId,
          error: this.resolveHttpStatusCode(statusCode),
          message: response,
        },
        code: this.resolveHttpStatusCode(statusCode),
        statusCode,
      };
    }

    const responseBody = response as Record<string, unknown>;

    return {
      body: {
        correlation_id: correlationId,
        error:
          this.readSemanticErrorCode(responseBody.error) ?? this.resolveHttpStatusCode(statusCode),
        message: this.readMessage(responseBody.message),
      },
      code:
        this.readSemanticErrorCode(responseBody.error) ?? this.resolveHttpStatusCode(statusCode),
      statusCode,
    };
  }

  private buildNexusErrorResponse(
    exception: NexusError,
    statusCode: number,
    correlationId: string,
  ): {
    readonly body: ErrorResponseBody;
    readonly code: string;
    readonly statusCode: number;
  } {
    return {
      body: {
        correlation_id: correlationId,
        error: exception.code,
        message: exception.publicMessage,
      },
      code: exception.code,
      statusCode,
    };
  }

  private logFailure(
    request: Request & { id?: string | number },
    normalizedError: { readonly code: string; readonly statusCode: number },
  ): void {
    const message = "HTTP request failed";
    const requestWithSecurityContext = request as RequestWithSecurityContext & {
      id?: string | number;
    };
    const authenticatedPrincipal =
      typeof requestWithSecurityContext.authenticatedPrincipal === "object"
        ? requestWithSecurityContext.authenticatedPrincipal
        : undefined;
    const tenantContext =
      typeof requestWithSecurityContext.tenantContext === "object"
        ? requestWithSecurityContext.tenantContext
        : undefined;
    const logPayload = {
      correlationId: this.readCorrelationId(request),
      errorCode: normalizedError.code,
      event: normalizedError.statusCode >= 500 ? "error" : "alert",
      method: request.method,
      path: request.url,
      statusCode: normalizedError.statusCode,
      ...(tenantContext === undefined
        ? {}
        : {
            tenantId: tenantContext.organizationId,
          }),
      ...(authenticatedPrincipal === undefined
        ? {}
        : {
            userId: authenticatedPrincipal.userId,
          }),
    };

    this.applicationMetricsService.recordModuleFailure({
      errorCode: normalizedError.code,
      module: this.resolveModuleName(request.url),
      operation: "http_request",
    });

    if (normalizedError.statusCode >= 500) {
      this.logger.error(logPayload, message);
      return;
    }

    this.logger.warn(logPayload, message);
  }

  private readMessage(value: unknown): string | string[] {
    if (Array.isArray(value) && value.every((item) => typeof item === "string")) {
      return value;
    }

    if (typeof value === "string") {
      return value;
    }

    return "Unexpected request error";
  }

  private readCorrelationId(request: Request & { id?: string | number }): string {
    if (typeof request.id === "number" || typeof request.id === "string") {
      return request.id.toString();
    }

    return "unknown";
  }

  private readSemanticErrorCode(value: unknown): string | undefined {
    if (typeof value !== "string" || value.length === 0) {
      return undefined;
    }

    if (/^[a-z0-9]+(?:_[a-z0-9]+)*$/.test(value)) {
      return value;
    }

    return undefined;
  }

  private resolveHttpStatusCode(statusCode: number): string {
    return (
      {
        [HttpStatus.BAD_REQUEST]: "invalid_request",
        [HttpStatus.UNAUTHORIZED]: "unauthorized",
        [HttpStatus.FORBIDDEN]: "forbidden",
        [HttpStatus.NOT_FOUND]: "not_found",
        [HttpStatus.CONFLICT]: "conflict",
      }[statusCode] ?? "internal_error"
    );
  }

  private resolveModuleName(path: string): string {
    const normalizedPath = path.split("?")[0] ?? "";

    if (normalizedPath.startsWith("/identity")) {
      return "identity";
    }

    if (normalizedPath.startsWith("/organizations")) {
      return "organizations";
    }

    if (
      normalizedPath.startsWith("/roles") ||
      normalizedPath.startsWith("/permissions") ||
      /^\/users\/[^/]+\/roles$/.test(normalizedPath)
    ) {
      return "access-control";
    }

    if (normalizedPath.startsWith("/audit-logs")) {
      return "audit-logs";
    }

    if (normalizedPath.startsWith("/metrics")) {
      return "telemetry";
    }

    if (normalizedPath.startsWith("/health")) {
      return "health";
    }

    return "bootstrap";
  }
}
