import type { PinoLogger } from "nestjs-pino";

import { AppendAuditLogUseCase } from "../../../../../src/modules/audit-logs/application/use-cases/append-audit-log.use-case";
import { RequestCorrelationContext } from "../../../../../src/shared/request-correlation/request-correlation.context";

function createLoggerMock(): PinoLogger {
  return {
    info: jest.fn(),
    setContext: jest.fn(),
  } as unknown as PinoLogger;
}

describe("AppendAuditLogUseCase", () => {
  it("appends an audit log with the current correlation id", async () => {
    const auditLogRepository = {
      append: jest.fn().mockResolvedValue(undefined),
    };
    const requestCorrelationContext = new RequestCorrelationContext();
    const useCase = new AppendAuditLogUseCase(
      auditLogRepository as never,
      requestCorrelationContext,
      createLoggerMock(),
    );

    const result = await requestCorrelationContext.run("request-123", () =>
      useCase.execute({
        action: "role_created",
        metadata: {
          roleId: "role-1",
        },
        resource: "access_control.role",
        tenantId: "tenant-1",
        userId: "user-1",
      }),
    );

    expect(auditLogRepository.append).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "role_created",
        correlationId: "request-123",
        resource: "access_control.role",
        tenantId: "tenant-1",
        userId: "user-1",
      }),
    );
    expect(result.correlationId).toBe("request-123");
  });
});
