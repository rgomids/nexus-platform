import { AuditLogEntry } from "../../../../../src/modules/audit-logs/domain/entities/audit-log-entry.entity";

describe("AuditLogEntry", () => {
  it("creates an immutable audit log entry", () => {
    const entry = AuditLogEntry.create({
      action: "login_success",
      correlationId: "request-123",
      id: "audit-log-1",
      metadata: {
        accountId: "account-1",
        nested: {
          sessionId: "session-1",
        },
      },
      resource: "identity.session",
      tenantId: "tenant-1",
      timestamp: new Date("2026-03-26T12:00:00.000Z"),
      userId: "user-1",
    });

    expect(entry.action).toBe("login_success");
    expect(entry.resource).toBe("identity.session");
    expect(entry.tenantId).toBe("tenant-1");
    expect(Object.isFrozen(entry)).toBe(true);
    expect(Object.isFrozen(entry.metadata)).toBe(true);
    expect(Object.isFrozen(entry.metadata.nested)).toBe(true);
  });
});
