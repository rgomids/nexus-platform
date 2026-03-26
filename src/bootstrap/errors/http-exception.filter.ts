import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";
import type { Request, Response } from "express";

import {
  AuthenticationError,
  AuthorizationError,
  ConflictError,
  NexusError,
  NotFoundError,
  ValidationError,
} from "../../shared/domain/nexus.errors";

interface ErrorResponseBody {
  readonly statusCode: number;
  readonly error: string;
  readonly message: string | string[];
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  public constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(GlobalExceptionFilter.name);
  }

  public catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const request = context.getRequest<Request & { id?: string | number }>();
    const response = context.getResponse<Response>();
    const normalizedError = this.normalizeError(exception);

    this.logFailure(request, normalizedError, exception);
    response.status(normalizedError.statusCode).json(normalizedError.body);
  }

  private normalizeError(exception: unknown): {
    readonly body: ErrorResponseBody;
    readonly code: string;
    readonly statusCode: number;
  } {
    if (exception instanceof HttpException) {
      return this.normalizeHttpException(exception);
    }

    if (exception instanceof ValidationError) {
      return this.buildNexusErrorResponse(exception, HttpStatus.BAD_REQUEST, "Bad Request");
    }

    if (exception instanceof ConflictError) {
      return this.buildNexusErrorResponse(exception, HttpStatus.CONFLICT, "Conflict");
    }

    if (exception instanceof AuthenticationError) {
      return this.buildNexusErrorResponse(exception, HttpStatus.UNAUTHORIZED, "Unauthorized");
    }

    if (exception instanceof AuthorizationError) {
      return this.buildNexusErrorResponse(exception, HttpStatus.FORBIDDEN, "Forbidden");
    }

    if (exception instanceof NotFoundError) {
      return this.buildNexusErrorResponse(exception, HttpStatus.NOT_FOUND, "Not Found");
    }

    return {
      body: {
        error: "Internal Server Error",
        message: "Internal server error",
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      },
      code: "internal_error",
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    };
  }

  private normalizeHttpException(exception: HttpException): {
    readonly body: ErrorResponseBody;
    readonly code: string;
    readonly statusCode: number;
  } {
    const statusCode = exception.getStatus();
    const response = exception.getResponse();

    if (typeof response === "string") {
      return {
        body: {
          error: this.resolveHttpStatusTitle(statusCode),
          message: response,
          statusCode,
        },
        code: "http_exception",
        statusCode,
      };
    }

    const responseBody = response as Record<string, unknown>;

    return {
      body: {
        error: this.readString(responseBody.error) ?? this.resolveHttpStatusTitle(statusCode),
        message: this.readMessage(responseBody.message),
        statusCode,
      },
      code: "http_exception",
      statusCode,
    };
  }

  private buildNexusErrorResponse(
    exception: NexusError,
    statusCode: number,
    error: string,
  ): {
    readonly body: ErrorResponseBody;
    readonly code: string;
    readonly statusCode: number;
  } {
    return {
      body: {
        error,
        message: exception.publicMessage,
        statusCode,
      },
      code: exception.code,
      statusCode,
    };
  }

  private logFailure(
    request: Request & { id?: string | number },
    normalizedError: { readonly code: string; readonly statusCode: number },
    exception: unknown,
  ): void {
    const message = "HTTP request failed";
    const logPayload = {
      correlationId:
        typeof request.id === "number" || typeof request.id === "string"
          ? request.id.toString()
          : "unknown",
      errorCode: normalizedError.code,
      event: normalizedError.statusCode >= 500 ? "error" : "alert",
      method: request.method,
      path: request.url,
      statusCode: normalizedError.statusCode,
    };

    if (normalizedError.statusCode >= 500) {
      this.logger.error({ ...logPayload, err: exception }, message);
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

  private readString(value: unknown): string | undefined {
    if (typeof value !== "string" || value.length === 0) {
      return undefined;
    }

    return value;
  }

  private resolveHttpStatusTitle(statusCode: number): string {
    return (
      {
        [HttpStatus.BAD_REQUEST]: "Bad Request",
        [HttpStatus.UNAUTHORIZED]: "Unauthorized",
        [HttpStatus.FORBIDDEN]: "Forbidden",
        [HttpStatus.NOT_FOUND]: "Not Found",
        [HttpStatus.CONFLICT]: "Conflict",
      }[statusCode] ?? "Error"
    );
  }
}
