import type { PinoLogger } from "nestjs-pino";

import { ListAuditLogsUseCase } from "../../../../../src/modules/audit-logs/application/use-cases/list-audit-logs.use-case";
import { InvalidAuditLogTimeRangeError } from "../../../../../src/modules/audit-logs/domain/audit-log.errors";
import { AuditLogEntry } from "../../../../../src/modules/audit-logs/domain/entities/audit-log-entry.entity";

function createLoggerMock(): PinoLogger {
  return {
    info: jest.fn(),
    setContext: jest.fn(),
  } as unknown as PinoLogger;
}

describe("ListAuditLogsUseCase", () => {
  it("lists audit logs using the provided filters", async () => {
    const repository = {
      list: jest.fn().mockResolvedValue([
        AuditLogEntry.create({
          action: "organization_created",
          correlationId: "request-1",
          id: "audit-1",
          metadata: {
            name: "Acme Corp",
          },
          resource: "organization",
          tenantId: "tenant-1",
          timestamp: new Date("2026-03-26T12:00:00.000Z"),
          userId: "user-1",
        }),
      ]),
    };
    const useCase = new ListAuditLogsUseCase(repository as never, createLoggerMock());

    const result = await useCase.execute({
      action: "organization_created",
      from: new Date("2026-03-26T00:00:00.000Z"),
      tenantId: "tenant-1",
      to: new Date("2026-03-27T00:00:00.000Z"),
      userId: "user-1",
    });

    expect(repository.list).toHaveBeenCalledWith({
      action: "organization_created",
      from: new Date("2026-03-26T00:00:00.000Z"),
      tenantId: "tenant-1",
      to: new Date("2026-03-27T00:00:00.000Z"),
      userId: "user-1",
    });
    expect(result).toEqual([
      expect.objectContaining({
        action: "organization_created",
        correlationId: "request-1",
        tenantId: "tenant-1",
      }),
    ]);
  });

  it("rejects an invalid time range", async () => {
    const useCase = new ListAuditLogsUseCase({ list: jest.fn() } as never, createLoggerMock());

    await expect(
      useCase.execute({
        from: new Date("2026-03-27T00:00:00.000Z"),
        tenantId: "tenant-1",
        to: new Date("2026-03-26T00:00:00.000Z"),
      }),
    ).rejects.toThrow(InvalidAuditLogTimeRangeError);
  });
});
