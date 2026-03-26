import type { PinoLogger } from "nestjs-pino";

import { CreateRoleUseCase } from "../../../../../src/modules/access-control/application/use-cases/create-role.use-case";
import { RoleAlreadyExistsError } from "../../../../../src/modules/access-control/domain/access-control.errors";
import { Role } from "../../../../../src/modules/access-control/domain/entities/role.entity";
import {
  createDatabaseExecutorMock,
  createInternalEventBusMock,
} from "../../../../support/unit-test-doubles";

function createLoggerMock(): PinoLogger {
  return {
    info: jest.fn(),
    setContext: jest.fn(),
  } as unknown as PinoLogger;
}

describe("CreateRoleUseCase", () => {
  it("creates a role for the active tenant", async () => {
    const roleRepository = {
      save: jest.fn().mockResolvedValue(undefined),
    };
    const useCase = new CreateRoleUseCase(
      roleRepository as never,
      createDatabaseExecutorMock(),
      createInternalEventBusMock(),
      createLoggerMock(),
    );

    const result = await useCase.execute({
      actorUserId: "user-1",
      name: "Member Manager",
      organizationId: "organization-1",
    });

    expect(roleRepository.save).toHaveBeenCalledWith(expect.any(Role));
    expect(result.name).toBe("Member Manager");
    expect(result.organizationId).toBe("organization-1");
  });

  it("propagates duplicate role errors", async () => {
    const useCase = new CreateRoleUseCase(
      {
        save: jest.fn().mockRejectedValue(new RoleAlreadyExistsError()),
      } as never,
      createDatabaseExecutorMock(),
      createInternalEventBusMock(),
      createLoggerMock(),
    );

    await expect(
      useCase.execute({
        actorUserId: "user-1",
        name: "Organization Admin",
        organizationId: "organization-1",
      }),
    ).rejects.toThrow(RoleAlreadyExistsError);
  });
});
