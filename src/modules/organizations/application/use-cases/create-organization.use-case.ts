import { randomUUID } from "node:crypto";

import { Inject, Injectable } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";

import { DatabaseExecutor } from "../../../../bootstrap/persistence/database.executor";
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
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CreateOrganizationUseCase.name);
  }

  public async execute(input: CreateOrganizationInput): Promise<OrganizationView> {
    const now = new Date();
    const organization = Organization.create({
      id: randomUUID(),
      name: input.name,
      now,
    });

    await this.databaseExecutor.withTransaction(async () => {
      await this.organizationRepository.save(organization);
      await this.usersTenancyContract.createMembership({
        organizationId: organization.id,
        userId: input.createdByUserId,
      });
      await this.accessControlBootstrapContract.bootstrapTenantAccessControl({
        createdByUserId: input.createdByUserId,
        organizationId: organization.id,
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
  }
}
