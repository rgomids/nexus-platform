import { Inject, Injectable } from "@nestjs/common";

import { OrganizationNotFoundError } from "../../domain/organization.errors";
import {
  ORGANIZATION_REPOSITORY,
  type OrganizationRepository,
} from "../../domain/repositories/organization.repository";
import type { OrganizationView } from "./create-organization.use-case";

@Injectable()
export class GetOrganizationByIdUseCase {
  public constructor(
    @Inject(ORGANIZATION_REPOSITORY)
    private readonly organizationRepository: OrganizationRepository,
  ) {}

  public async execute(organizationId: string): Promise<OrganizationView> {
    const organization = await this.organizationRepository.findById(organizationId);

    if (organization === null) {
      throw new OrganizationNotFoundError();
    }

    return {
      createdAt: organization.createdAt.toISOString(),
      name: organization.name,
      organizationId: organization.id,
      status: organization.status,
      updatedAt: organization.updatedAt.toISOString(),
    };
  }
}
