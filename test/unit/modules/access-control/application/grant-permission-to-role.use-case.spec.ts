import type { PinoLogger } from "nestjs-pino";

import { GrantPermissionToRoleUseCase } from "../../../../../src/modules/access-control/application/use-cases/grant-permission-to-role.use-case";
import {
  PermissionNotFoundError,
  RoleNotFoundError,
  RolePermissionAlreadyExistsError,
} from "../../../../../src/modules/access-control/domain/access-control.errors";
import { Permission } from "../../../../../src/modules/access-control/domain/entities/permission.entity";
import { Role } from "../../../../../src/modules/access-control/domain/entities/role.entity";

function createLoggerMock(): PinoLogger {
  return {
    info: jest.fn(),
    setContext: jest.fn(),
  } as unknown as PinoLogger;
}

describe("GrantPermissionToRoleUseCase", () => {
  it("grants a permission that belongs to the same tenant", async () => {
    const now = new Date();
    const useCase = new GrantPermissionToRoleUseCase(
      {
        findById: jest.fn().mockResolvedValue(
          Role.create({
            id: "role-1",
            name: "Manager",
            now,
            organizationId: "organization-1",
          }),
        ),
      } as never,
      {
        findByCode: jest.fn().mockResolvedValue(
          Permission.create({
            code: "membership:view",
            id: "permission-1",
            now,
            organizationId: "organization-1",
          }),
        ),
      } as never,
      {
        save: jest.fn().mockResolvedValue(undefined),
      } as never,
      createLoggerMock(),
    );

    const result = await useCase.execute({
      actorUserId: "user-1",
      organizationId: "organization-1",
      permissionCode: "membership:view",
      roleId: "role-1",
    });

    expect(result.permissionCode).toBe("membership:view");
    expect(result.organizationId).toBe("organization-1");
  });

  it("rejects when the role is outside the tenant", async () => {
    const useCase = new GrantPermissionToRoleUseCase(
      {
        findById: jest.fn().mockResolvedValue(null),
      } as never,
      {} as never,
      {} as never,
      createLoggerMock(),
    );

    await expect(
      useCase.execute({
        actorUserId: "user-1",
        organizationId: "organization-1",
        permissionCode: "membership:view",
        roleId: "role-1",
      }),
    ).rejects.toThrow(RoleNotFoundError);
  });

  it("rejects when the permission does not exist in the tenant", async () => {
    const useCase = new GrantPermissionToRoleUseCase(
      {
        findById: jest.fn().mockResolvedValue(
          Role.create({
            id: "role-1",
            name: "Manager",
            now: new Date(),
            organizationId: "organization-1",
          }),
        ),
      } as never,
      {
        findByCode: jest.fn().mockResolvedValue(null),
      } as never,
      {} as never,
      createLoggerMock(),
    );

    await expect(
      useCase.execute({
        actorUserId: "user-1",
        organizationId: "organization-1",
        permissionCode: "membership:view",
        roleId: "role-1",
      }),
    ).rejects.toThrow(PermissionNotFoundError);
  });

  it("rejects duplicate permission grants", async () => {
    const now = new Date();
    const useCase = new GrantPermissionToRoleUseCase(
      {
        findById: jest.fn().mockResolvedValue(
          Role.create({
            id: "role-1",
            name: "Manager",
            now,
            organizationId: "organization-1",
          }),
        ),
      } as never,
      {
        findByCode: jest.fn().mockResolvedValue(
          Permission.create({
            code: "membership:view",
            id: "permission-1",
            now,
            organizationId: "organization-1",
          }),
        ),
      } as never,
      {
        save: jest.fn().mockRejectedValue(new RolePermissionAlreadyExistsError()),
      } as never,
      createLoggerMock(),
    );

    await expect(
      useCase.execute({
        actorUserId: "user-1",
        organizationId: "organization-1",
        permissionCode: "membership:view",
        roleId: "role-1",
      }),
    ).rejects.toThrow(RolePermissionAlreadyExistsError);
  });
});
