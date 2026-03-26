import { randomUUID } from "node:crypto";

import { Inject, Injectable } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";

import { DatabaseExecutor } from "../../../../bootstrap/persistence/database.executor";
import { InternalEventBus } from "../../../../shared/events/internal-event-bus";
import { Role } from "../../domain/entities/role.entity";
import {
  ROLE_REPOSITORY,
  type RoleRepository,
} from "../../domain/repositories/role.repository";
import type { RoleView } from "../dto/access-control.views";

export interface CreateRoleInput {
  readonly actorUserId: string;
  readonly name: string;
  readonly organizationId: string;
}

@Injectable()
export class CreateRoleUseCase {
  public constructor(
    @Inject(ROLE_REPOSITORY)
    private readonly roleRepository: RoleRepository,
    private readonly databaseExecutor: DatabaseExecutor,
    private readonly internalEventBus: InternalEventBus,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CreateRoleUseCase.name);
  }

  public async execute(input: CreateRoleInput): Promise<RoleView> {
    const now = new Date();
    const role = Role.create({
      id: randomUUID(),
      name: input.name,
      now,
      organizationId: input.organizationId,
    });

    await this.databaseExecutor.withTransaction(async () => {
      await this.roleRepository.save(role);
      await this.internalEventBus.publish({
        actorUserId: input.actorUserId,
        name: role.name,
        occurredAt: role.createdAt,
        organizationId: role.organizationId,
        roleId: role.id,
        type: "access_control.role_created",
      });
    });

    this.logger.info(
      {
        event: "role_created",
        organizationId: input.organizationId,
        roleId: role.id,
        userId: input.actorUserId,
      },
      "Role created",
    );

    return {
      createdAt: role.createdAt.toISOString(),
      name: role.name,
      organizationId: role.organizationId,
      roleId: role.id,
      updatedAt: role.updatedAt.toISOString(),
    };
  }
}
