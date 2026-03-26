import { Inject, Injectable } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";

import {
  OrganizationNotFoundError,
} from "../../domain/organization.errors";
import {
  ORGANIZATION_REPOSITORY,
  type OrganizationRepository,
} from "../../domain/repositories/organization.repository";
import type { OrganizationView } from "./create-organization.use-case";

@Injectable()
export class DeactivateOrganizationUseCase {
  public constructor(
    @Inject(ORGANIZATION_REPOSITORY)
    private readonly organizationRepository: OrganizationRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(DeactivateOrganizationUseCase.name);
  }

  public async execute(organizationId: string): Promise<OrganizationView> {
    const organization = await this.organizationRepository.findById(organizationId);

    if (organization === null) {
      throw new OrganizationNotFoundError();
    }

    const deactivatedOrganization = organization.deactivate(new Date());

    if (deactivatedOrganization !== organization) {
      await this.organizationRepository.update(deactivatedOrganization);
      this.logger.info(
        {
          event: "organization_deactivated",
          organizationId: deactivatedOrganization.id,
        },
        "Organization deactivated",
      );
    }

    return {
      createdAt: deactivatedOrganization.createdAt.toISOString(),
      name: deactivatedOrganization.name,
      organizationId: deactivatedOrganization.id,
      status: deactivatedOrganization.status,
      updatedAt: deactivatedOrganization.updatedAt.toISOString(),
    };
  }
}
