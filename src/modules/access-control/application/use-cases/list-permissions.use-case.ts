import { Inject, Injectable } from "@nestjs/common";

import {
  PERMISSION_REPOSITORY,
  type PermissionRepository,
} from "../../domain/repositories/permission.repository";
import type { PermissionView } from "../dto/access-control.views";

@Injectable()
export class ListPermissionsUseCase {
  public constructor(
    @Inject(PERMISSION_REPOSITORY)
    private readonly permissionRepository: PermissionRepository,
  ) {}

  public async execute(organizationId: string): Promise<PermissionView[]> {
    const permissions = await this.permissionRepository.listByOrganizationId(organizationId);

    return permissions.map((permission) => ({
      code: permission.code,
      createdAt: permission.createdAt.toISOString(),
      organizationId: permission.organizationId,
      permissionId: permission.id,
      updatedAt: permission.updatedAt.toISOString(),
    }));
  }
}
