import { AuditLogSubscribers } from "../../../../../src/modules/audit-logs/application/audit-log.subscribers";
import { InternalEventBus } from "../../../../../src/shared/events/internal-event-bus";

describe("AuditLogSubscribers", () => {
  it("maps authorization denials into audit append requests", async () => {
    const internalEventBus = new InternalEventBus();
    const appendAuditLogUseCase = {
      execute: jest.fn().mockResolvedValue({
        id: "audit-1",
      }),
    };
    const subscribers = new AuditLogSubscribers(
      internalEventBus,
      appendAuditLogUseCase as never,
    );

    subscribers.onModuleInit();
    await internalEventBus.publish({
      method: "GET",
      occurredAt: new Date("2026-03-26T12:00:00.000Z"),
      organizationId: "tenant-1",
      path: "/organizations/tenant-1/memberships",
      permissionCode: "membership:view",
      type: "authorization.denied",
      userId: "user-1",
    });

    expect(appendAuditLogUseCase.execute).toHaveBeenCalledWith({
      action: "authorization_denied",
      metadata: {
        method: "GET",
        path: "/organizations/tenant-1/memberships",
        permissionCode: "membership:view",
      },
      resource: "authorization",
      tenantId: "tenant-1",
      timestamp: new Date("2026-03-26T12:00:00.000Z"),
      userId: "user-1",
    });
  });

  it("maps membership assignments into audit append requests", async () => {
    const internalEventBus = new InternalEventBus();
    const appendAuditLogUseCase = {
      execute: jest.fn().mockResolvedValue({
        id: "audit-2",
      }),
    };
    const subscribers = new AuditLogSubscribers(
      internalEventBus,
      appendAuditLogUseCase as never,
    );

    subscribers.onModuleInit();
    await internalEventBus.publish({
      actorUserId: "user-1",
      membershipId: "membership-1",
      occurredAt: new Date("2026-03-26T12:05:00.000Z"),
      organizationId: "tenant-1",
      type: "membership.assigned",
      userId: "user-2",
    });

    expect(appendAuditLogUseCase.execute).toHaveBeenCalledWith({
      action: "membership_assigned",
      metadata: {
        actorUserId: "user-1",
        membershipId: "membership-1",
        targetUserId: "user-2",
      },
      resource: "membership",
      tenantId: "tenant-1",
      timestamp: new Date("2026-03-26T12:05:00.000Z"),
      userId: "user-1",
    });
  });
});
