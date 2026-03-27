import { randomUUID } from "node:crypto";

import { Inject, Injectable, Optional } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";

import { DatabaseExecutor } from "../../../../bootstrap/persistence/database.executor";
import { ApplicationTelemetryService } from "../../../../bootstrap/telemetry/application-telemetry.service";
import { InternalEventBus } from "../../../../shared/events/internal-event-bus";
import {
  ACCESS_CONTROL_BOOTSTRAP_CONTRACT,
  type AccessControlBootstrapContract,
} from "../../../access-control/application/contracts/access-control-bootstrap.contract";
import {
  USERS_TENANCY_CONTRACT,
  type UsersTenancyContract,
} from "../../../users/application/contracts/users-tenancy.contract";
import { Organization } from "../../domain/entities/organization.entity";
import {
  ORGANIZATION_REPOSITORY,
  type OrganizationRepository,
} from "../../domain/repositories/organization.repository";

export interface CreateOrganizationInput {
  readonly createdByUserId: string;
  readonly name: string;
}

export interface OrganizationView {
  readonly createdAt: string;
  readonly name: string;
  readonly organizationId: string;
  readonly status: "active" | "inactive";
  readonly updatedAt: string;
}

@Injectable()
export class CreateOrganizationUseCase {
  public constructor(
    @Inject(ORGANIZATION_REPOSITORY)
    private readonly organizationRepository: OrganizationRepository,
    @Inject(USERS_TENANCY_CONTRACT)
    private readonly usersTenancyContract: UsersTenancyContract,
    @Inject(ACCESS_CONTROL_BOOTSTRAP_CONTRACT)
    private readonly accessControlBootstrapContract: AccessControlBootstrapContract,
    private readonly databaseExecutor: DatabaseExecutor,
    private readonly internalEventBus: InternalEventBus,
    private readonly logger: PinoLogger,
    @Optional()
    private readonly applicationTelemetryService?: ApplicationTelemetryService,
  ) {
    this.logger.setContext(CreateOrganizationUseCase.name);
  }

  public async execute(input: CreateOrganizationInput): Promise<OrganizationView> {
    const executeOperation = async (): Promise<OrganizationView> => {
      const now = new Date();
      const organization = Organization.create({
        id: randomUUID(),
        name: input.name,
        now,
      });

      await this.databaseExecutor.withTransaction(async () => {
        await this.organizationRepository.save(organization);
        await this.usersTenancyContract.createMembership({
          actorUserId: input.createdByUserId,
          organizationId: organization.id,
          userId: input.createdByUserId,
        });
        await this.accessControlBootstrapContract.bootstrapTenantAccessControl({
          createdByUserId: input.createdByUserId,
          organizationId: organization.id,
        });
        await this.internalEventBus.publish({
          actorUserId: input.createdByUserId,
          name: organization.name,
          occurredAt: organization.createdAt,
          organizationId: organization.id,
          type: "organization.created",
        });
      });

      this.logger.info(
        {
          event: "organization_created",
          organizationId: organization.id,
          userId: input.createdByUserId,
        },
        "Organization created",
      );

      return {
        createdAt: organization.createdAt.toISOString(),
        name: organization.name,
        organizationId: organization.id,
        status: organization.status,
        updatedAt: organization.updatedAt.toISOString(),
      };
    };

    if (this.applicationTelemetryService === undefined) {
      return executeOperation();
    }

    return this.applicationTelemetryService.runInSpan(
      "organizations.create_organization",
      {},
      executeOperation,
    );
  }
}
