import { Inject, Injectable } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";

import { DatabaseExecutor } from "../../../../bootstrap/persistence/database.executor";
import { InternalEventBus } from "../../../../shared/events/internal-event-bus";
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
    private readonly databaseExecutor: DatabaseExecutor,
    private readonly internalEventBus: InternalEventBus,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(DeactivateOrganizationUseCase.name);
  }

  public async execute(input: {
    readonly actorUserId: string;
    readonly organizationId: string;
  }): Promise<OrganizationView> {
    const organization = await this.organizationRepository.findById(input.organizationId);

    if (organization === null) {
      throw new OrganizationNotFoundError();
    }

    const deactivatedOrganization = organization.deactivate(new Date());

    if (deactivatedOrganization !== organization) {
      await this.databaseExecutor.withTransaction(async () => {
        await this.organizationRepository.update(deactivatedOrganization);
        await this.internalEventBus.publish({
          actorUserId: input.actorUserId,
          occurredAt: deactivatedOrganization.updatedAt,
          organizationId: deactivatedOrganization.id,
          type: "organization.deactivated",
        });
      });

      this.logger.info(
        {
          event: "organization_deactivated",
          organizationId: deactivatedOrganization.id,
          userId: input.actorUserId,
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
