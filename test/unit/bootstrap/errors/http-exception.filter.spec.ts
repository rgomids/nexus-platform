import { HttpException, HttpStatus } from "@nestjs/common";
import type { ArgumentsHost } from "@nestjs/common";
import type { PinoLogger } from "nestjs-pino";

import { GlobalExceptionFilter } from "../../../../src/bootstrap/errors/http-exception.filter";
import type { ApplicationMetricsService } from "../../../../src/bootstrap/telemetry/application-metrics.service";
import { InvalidCredentialsError } from "../../../../src/modules/identity/domain/identity.errors";

function createLoggerMock(): PinoLogger {
  return {
    error: jest.fn(),
    setContext: jest.fn(),
    warn: jest.fn(),
  } as unknown as PinoLogger;
}

function createArgumentsHostMock(request: Record<string, unknown>, response: Record<string, unknown>) {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
    }),
  } as ArgumentsHost;
}

describe("GlobalExceptionFilter", () => {
  it("maps semantic errors to the public HTTP contract with correlation id", () => {
    const logger = createLoggerMock();
    const metrics = {
      recordModuleFailure: jest.fn(),
    } as unknown as ApplicationMetricsService;
    const filter = new GlobalExceptionFilter(logger, metrics);
    const response = {
      json: jest.fn(),
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
    const request = {
      id: "request-123",
      method: "POST",
      url: "/identity/login",
    };

    filter.catch(
      new InvalidCredentialsError(),
      createArgumentsHostMock(request, response),
    );

    expect(response.setHeader).toHaveBeenCalledWith("x-correlation-id", "request-123");
    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.json).toHaveBeenCalledWith({
      correlation_id: "request-123",
      error: "invalid_credentials",
      message: "Invalid credentials",
    });
    expect(metrics.recordModuleFailure).toHaveBeenCalledWith({
      errorCode: "invalid_credentials",
      module: "identity",
      operation: "http_request",
    });
  });

  it("returns a generic body for unexpected exceptions", () => {
    const logger = createLoggerMock();
    const metrics = {
      recordModuleFailure: jest.fn(),
    } as unknown as ApplicationMetricsService;
    const filter = new GlobalExceptionFilter(logger, metrics);
    const response = {
      json: jest.fn(),
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
    const request = {
      id: "request-500",
      method: "GET",
      url: "/metrics",
    };

    filter.catch(new Error("boom"), createArgumentsHostMock(request, response));

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith({
      correlation_id: "request-500",
      error: "internal_error",
      message: "Internal server error",
    });
    expect((logger.error as jest.Mock).mock.calls).toHaveLength(1);
  });

  it("normalizes raw Nest HTTP exceptions into semantic codes", () => {
    const filter = new GlobalExceptionFilter(
      createLoggerMock(),
      { recordModuleFailure: jest.fn() } as unknown as ApplicationMetricsService,
    );
    const response = {
      json: jest.fn(),
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
    const request = {
      id: "request-400",
      method: "GET",
      url: "/health",
    };

    filter.catch(
      new HttpException("invalid query", HttpStatus.BAD_REQUEST),
      createArgumentsHostMock(request, response),
    );

    expect(response.json).toHaveBeenCalledWith({
      correlation_id: "request-400",
      error: "invalid_request",
      message: "invalid query",
    });
  });
});
