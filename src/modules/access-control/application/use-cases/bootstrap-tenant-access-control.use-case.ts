import { randomUUID } from "node:crypto";

import { Inject, Injectable } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";

import { Permission } from "../../domain/entities/permission.entity";
import { RolePermission } from "../../domain/entities/role-permission.entity";
import { Role } from "../../domain/entities/role.entity";
import { UserRoleAssignment } from "../../domain/entities/user-role-assignment.entity";
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
import {
  USER_ROLE_ASSIGNMENT_REPOSITORY,
  type UserRoleAssignmentRepository,
} from "../../domain/repositories/user-role-assignment.repository";
import {
  DEFAULT_PERMISSION_CODES,
  ORGANIZATION_ADMIN_ROLE_NAME,
} from "../default-rbac-values";
import type { BootstrapTenantAccessControlInput } from "../contracts/access-control-bootstrap.contract";

@Injectable()
export class BootstrapTenantAccessControlUseCase {
  public constructor(
    @Inject(PERMISSION_REPOSITORY)
    private readonly permissionRepository: PermissionRepository,
    @Inject(ROLE_REPOSITORY)
    private readonly roleRepository: RoleRepository,
    @Inject(ROLE_PERMISSION_REPOSITORY)
    private readonly rolePermissionRepository: RolePermissionRepository,
    @Inject(USER_ROLE_ASSIGNMENT_REPOSITORY)
    private readonly userRoleAssignmentRepository: UserRoleAssignmentRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(BootstrapTenantAccessControlUseCase.name);
  }

  public async execute(input: BootstrapTenantAccessControlInput): Promise<void> {
    const now = new Date();
    const permissions = DEFAULT_PERMISSION_CODES.map((code) =>
      Permission.create({
        code,
        id: randomUUID(),
        now,
        organizationId: input.organizationId,
      }),
    );

    for (const permission of permissions) {
      await this.permissionRepository.save(permission);
    }

    const role = Role.create({
      id: randomUUID(),
      name: ORGANIZATION_ADMIN_ROLE_NAME,
      now,
      organizationId: input.organizationId,
    });

    await this.roleRepository.save(role);
    this.logger.info(
      {
        event: "role_created",
        organizationId: input.organizationId,
        roleId: role.id,
        userId: input.createdByUserId,
      },
      "Role created",
    );

    for (const permission of permissions) {
      const rolePermission = RolePermission.create({
        id: randomUUID(),
        now,
        organizationId: input.organizationId,
        permissionId: permission.id,
        roleId: role.id,
      });

      await this.rolePermissionRepository.save(rolePermission);
      this.logger.info(
        {
          event: "permission_granted",
          organizationId: input.organizationId,
          permissionCode: permission.code,
          permissionId: permission.id,
          roleId: role.id,
          userId: input.createdByUserId,
        },
        "Permission granted to role",
      );
    }

    const assignment = UserRoleAssignment.create({
      id: randomUUID(),
      now,
      organizationId: input.organizationId,
      roleId: role.id,
      userId: input.createdByUserId,
    });

    await this.userRoleAssignmentRepository.save(assignment);
    this.logger.info(
      {
        event: "role_assigned",
        organizationId: input.organizationId,
        roleId: role.id,
        targetUserId: input.createdByUserId,
        userId: input.createdByUserId,
      },
      "Role assigned to user",
    );
  }
}
