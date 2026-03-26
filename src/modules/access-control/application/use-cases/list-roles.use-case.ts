import { Inject, Injectable } from "@nestjs/common";

import {
  ROLE_REPOSITORY,
  type RoleRepository,
} from "../../domain/repositories/role.repository";
import type { RoleView } from "../dto/access-control.views";

@Injectable()
export class ListRolesUseCase {
  public constructor(
    @Inject(ROLE_REPOSITORY)
    private readonly roleRepository: RoleRepository,
  ) {}

  public async execute(organizationId: string): Promise<RoleView[]> {
    const roles = await this.roleRepository.listByOrganizationId(organizationId);

    return roles.map((role) => ({
      createdAt: role.createdAt.toISOString(),
      name: role.name,
      organizationId: role.organizationId,
      roleId: role.id,
      updatedAt: role.updatedAt.toISOString(),
    }));
  }
}
