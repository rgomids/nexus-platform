import type { ApplicationMetricsService } from "../../src/bootstrap/telemetry/application-metrics.service";
import type { ApplicationTelemetryService } from "../../src/bootstrap/telemetry/application-telemetry.service";
import type { DatabaseExecutor } from "../../src/bootstrap/persistence/database.executor";
import type { InternalEventBus } from "../../src/shared/events/internal-event-bus";

export function createDatabaseExecutorMock(): DatabaseExecutor {
  return {
    withTransaction: jest.fn(async (operation: () => Promise<unknown>) => operation()),
  } as unknown as DatabaseExecutor;
}

export function createInternalEventBusMock(): InternalEventBus {
  return {
    publish: jest.fn().mockResolvedValue(undefined),
    subscribe: jest.fn(),
  } as unknown as InternalEventBus;
}

export function createApplicationTelemetryServiceMock(): ApplicationTelemetryService {
  return {
    bindSpan: jest.fn((_: unknown, operation: () => void) => operation()),
    endHttpServerSpan: jest.fn(),
    runInSpan: jest.fn(
      async (
        _name: string,
        _attributes: Record<string, unknown>,
        operation: () => Promise<unknown>,
      ) => operation(),
    ),
    startHttpServerSpan: jest.fn(),
  } as unknown as ApplicationTelemetryService;
}

export function createApplicationMetricsServiceMock(): ApplicationMetricsService {
  return {
    recordAuditOperation: jest.fn(),
    recordAuthorizationDecision: jest.fn(),
    recordHttpRequest: jest.fn(),
    recordLoginResult: jest.fn(),
    recordModuleFailure: jest.fn(),
    renderPrometheusMetrics: jest.fn().mockReturnValue(""),
  } as unknown as ApplicationMetricsService;
}
