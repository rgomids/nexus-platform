import { randomUUID } from "node:crypto";

import { Inject, Injectable } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";

import { DatabaseExecutor } from "../../../../bootstrap/persistence/database.executor";
import { InternalEventBus } from "../../../../shared/events/internal-event-bus";
import { PermissionNotFoundError, RoleNotFoundError } from "../../domain/access-control.errors";
import { RolePermission } from "../../domain/entities/role-permission.entity";
import {
  PERMISSION_REPOSITORY,
  type PermissionRepository,
} from "../../domain/repositories/permission.repository";
import {
  ROLE_PERMISSION_REPOSITORY,
  type RolePermissionRepository,
} from "../../domain/repositories/role-permission.repository";
import {
  ROLE_REPOSITORY,
  type RoleRepository,
} from "../../domain/repositories/role.repository";
import type { RolePermissionView } from "../dto/access-control.views";

export interface GrantPermissionToRoleInput {
  readonly actorUserId: string;
  readonly organizationId: string;
  readonly permissionCode: string;
  readonly roleId: string;
}

@Injectable()
export class GrantPermissionToRoleUseCase {
  public constructor(
    @Inject(ROLE_REPOSITORY)
    private readonly roleRepository: RoleRepository,
    @Inject(PERMISSION_REPOSITORY)
    private readonly permissionRepository: PermissionRepository,
    @Inject(ROLE_PERMISSION_REPOSITORY)
    private readonly rolePermissionRepository: RolePermissionRepository,
    private readonly databaseExecutor: DatabaseExecutor,
    private readonly internalEventBus: InternalEventBus,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(GrantPermissionToRoleUseCase.name);
  }

  public async execute(input: GrantPermissionToRoleInput): Promise<RolePermissionView> {
    const role = await this.roleRepository.findById(input.roleId, input.organizationId);

    if (role === null) {
      throw new RoleNotFoundError();
    }

    const permission = await this.permissionRepository.findByCode(
      input.organizationId,
      input.permissionCode,
    );

    if (permission === null) {
      throw new PermissionNotFoundError();
    }

    const rolePermission = RolePermission.create({
      id: randomUUID(),
      now: new Date(),
      organizationId: input.organizationId,
      permissionId: permission.id,
      roleId: role.id,
    });

    await this.databaseExecutor.withTransaction(async () => {
      await this.rolePermissionRepository.save(rolePermission);
      await this.internalEventBus.publish({
        actorUserId: input.actorUserId,
        occurredAt: rolePermission.createdAt,
        organizationId: input.organizationId,
        permissionCode: permission.code,
        permissionId: permission.id,
        roleId: role.id,
        type: "access_control.permission_granted",
      });
    });

    this.logger.info(
      {
        event: "permission_granted",
        organizationId: input.organizationId,
        permissionCode: permission.code,
        permissionId: permission.id,
        roleId: role.id,
        userId: input.actorUserId,
      },
      "Permission granted to role",
    );

    return {
      createdAt: rolePermission.createdAt.toISOString(),
      organizationId: rolePermission.organizationId,
      permissionCode: permission.code,
      permissionId: permission.id,
      roleId: role.id,
      rolePermissionId: rolePermission.id,
      updatedAt: rolePermission.updatedAt.toISOString(),
    };
  }
}
