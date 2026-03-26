import { Injectable, OnModuleInit } from "@nestjs/common";

import { InternalEventBus } from "../../../shared/events/internal-event-bus";
import {
  AppendAuditLogUseCase,
  type AppendAuditLogInput,
} from "./use-cases/append-audit-log.use-case";

@Injectable()
export class AuditLogSubscribers implements OnModuleInit {
  public constructor(
    private readonly internalEventBus: InternalEventBus,
    private readonly appendAuditLogUseCase: AppendAuditLogUseCase,
  ) {}

  public onModuleInit(): void {
    this.internalEventBus.subscribe("user.created", async (event) => {
      await this.append({
        action: "user_created",
        metadata: {
          accountId: event.accountId,
          actorUserId: event.actorUserId,
          email: event.email,
        },
        resource: "user",
        tenantId: null,
        timestamp: event.occurredAt,
        userId: event.userId,
      });
    });

    this.internalEventBus.subscribe("identity.login_succeeded", async (event) => {
      await this.append({
        action: "login_success",
        metadata: {
          accountId: event.accountId,
          sessionId: event.sessionId,
        },
        resource: "identity.session",
        tenantId: event.organizationId,
        timestamp: event.occurredAt,
        userId: event.userId,
      });
    });

    this.internalEventBus.subscribe("identity.login_failed", async (event) => {
      await this.append({
        action: "login_failed",
        metadata: {
          email: event.email,
          reason: event.reason,
        },
        resource: "identity.session",
        tenantId: event.organizationId,
        timestamp: event.occurredAt,
        userId: event.userId,
      });
    });

    this.internalEventBus.subscribe("identity.logout_succeeded", async (event) => {
      await this.append({
        action: "logout",
        metadata: {
          accountId: event.accountId,
          sessionId: event.sessionId,
        },
        resource: "identity.session",
        tenantId: event.organizationId,
        timestamp: event.occurredAt,
        userId: event.userId,
      });
    });

    this.internalEventBus.subscribe("organization.created", async (event) => {
      await this.append({
        action: "organization_created",
        metadata: {
          actorUserId: event.actorUserId,
          name: event.name,
        },
        resource: "organization",
        tenantId: event.organizationId,
        timestamp: event.occurredAt,
        userId: event.actorUserId,
      });
    });

    this.internalEventBus.subscribe("organization.deactivated", async (event) => {
      await this.append({
        action: "organization_deactivated",
        metadata: {
          actorUserId: event.actorUserId,
        },
        resource: "organization",
        tenantId: event.organizationId,
        timestamp: event.occurredAt,
        userId: event.actorUserId,
      });
    });

    this.internalEventBus.subscribe("membership.assigned", async (event) => {
      await this.append({
        action: "membership_assigned",
        metadata: {
          actorUserId: event.actorUserId,
          membershipId: event.membershipId,
          targetUserId: event.userId,
        },
        resource: "membership",
        tenantId: event.organizationId,
        timestamp: event.occurredAt,
        userId: event.actorUserId,
      });
    });

    this.internalEventBus.subscribe("access_control.role_created", async (event) => {
      await this.append({
        action: "role_created",
        metadata: {
          actorUserId: event.actorUserId,
          name: event.name,
          roleId: event.roleId,
        },
        resource: "access_control.role",
        tenantId: event.organizationId,
        timestamp: event.occurredAt,
        userId: event.actorUserId,
      });
    });

    this.internalEventBus.subscribe("access_control.permission_granted", async (event) => {
      await this.append({
        action: "permission_granted",
        metadata: {
          actorUserId: event.actorUserId,
          permissionCode: event.permissionCode,
          permissionId: event.permissionId,
          roleId: event.roleId,
        },
        resource: "access_control.permission",
        tenantId: event.organizationId,
        timestamp: event.occurredAt,
        userId: event.actorUserId,
      });
    });

    this.internalEventBus.subscribe("access_control.role_assigned", async (event) => {
      await this.append({
        action: "role_assigned",
        metadata: {
          actorUserId: event.actorUserId,
          roleId: event.roleId,
          targetUserId: event.targetUserId,
        },
        resource: "access_control.assignment",
        tenantId: event.organizationId,
        timestamp: event.occurredAt,
        userId: event.actorUserId,
      });
    });

    this.internalEventBus.subscribe("authorization.denied", async (event) => {
      await this.append({
        action: "authorization_denied",
        metadata: {
          method: event.method,
          path: event.path,
          permissionCode: event.permissionCode,
        },
        resource: "authorization",
        tenantId: event.organizationId,
        timestamp: event.occurredAt,
        userId: event.userId,
      });
    });
  }

  private async append(input: AppendAuditLogInput): Promise<void> {
    await this.appendAuditLogUseCase.execute(input);
  }
}
