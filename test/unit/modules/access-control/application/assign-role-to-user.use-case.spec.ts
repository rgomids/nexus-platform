import type { PinoLogger } from "nestjs-pino";

import { AssignRoleToUserUseCase } from "../../../../../src/modules/access-control/application/use-cases/assign-role-to-user.use-case";
import {
  RoleNotFoundError,
  UserRoleAssignmentAlreadyExistsError,
} from "../../../../../src/modules/access-control/domain/access-control.errors";
import { Role } from "../../../../../src/modules/access-control/domain/entities/role.entity";
import { MembershipNotFoundError, UserNotFoundError } from "../../../../../src/modules/users/domain/user.errors";

function createLoggerMock(): PinoLogger {
  return {
    info: jest.fn(),
    setContext: jest.fn(),
  } as unknown as PinoLogger;
}

describe("AssignRoleToUserUseCase", () => {
  it("assigns a role when user and membership exist in the tenant", async () => {
    const useCase = new AssignRoleToUserUseCase(
      {
        getUserById: jest.fn().mockResolvedValue({
          fullName: "Jane Doe",
          status: "active",
          userId: "user-2",
        }),
      } as never,
      {
        findActiveMembership: jest.fn().mockResolvedValue({
          membershipId: "membership-1",
          organizationId: "organization-1",
          status: "active",
          userId: "user-2",
        }),
      } as never,
      {
        findById: jest.fn().mockResolvedValue(
          Role.create({
            id: "role-1",
            name: "Viewer",
            now: new Date(),
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
      roleId: "role-1",
      userId: "user-2",
    });

    expect(result.roleId).toBe("role-1");
    expect(result.userId).toBe("user-2");
  });

  it("rejects when the target user does not exist", async () => {
    const useCase = new AssignRoleToUserUseCase(
      {
        getUserById: jest.fn().mockResolvedValue(null),
      } as never,
      {} as never,
      {} as never,
      {} as never,
      createLoggerMock(),
    );

    await expect(
      useCase.execute({
        actorUserId: "user-1",
        organizationId: "organization-1",
        roleId: "role-1",
        userId: "user-2",
      }),
    ).rejects.toThrow(UserNotFoundError);
  });

  it("rejects when the target user has no active membership in the tenant", async () => {
    const useCase = new AssignRoleToUserUseCase(
      {
        getUserById: jest.fn().mockResolvedValue({
          fullName: "Jane Doe",
          status: "active",
          userId: "user-2",
        }),
      } as never,
      {
        findActiveMembership: jest.fn().mockResolvedValue(null),
      } as never,
      {} as never,
      {} as never,
      createLoggerMock(),
    );

    await expect(
      useCase.execute({
        actorUserId: "user-1",
        organizationId: "organization-1",
        roleId: "role-1",
        userId: "user-2",
      }),
    ).rejects.toThrow(MembershipNotFoundError);
  });

  it("rejects when the role belongs to another tenant", async () => {
    const useCase = new AssignRoleToUserUseCase(
      {
        getUserById: jest.fn().mockResolvedValue({
          fullName: "Jane Doe",
          status: "active",
          userId: "user-2",
        }),
      } as never,
      {
        findActiveMembership: jest.fn().mockResolvedValue({
          membershipId: "membership-1",
          organizationId: "organization-1",
          status: "active",
          userId: "user-2",
        }),
      } as never,
      {
        findById: jest.fn().mockResolvedValue(null),
      } as never,
      {} as never,
      createLoggerMock(),
    );

    await expect(
      useCase.execute({
        actorUserId: "user-1",
        organizationId: "organization-1",
        roleId: "role-1",
        userId: "user-2",
      }),
    ).rejects.toThrow(RoleNotFoundError);
  });

  it("rejects duplicate role assignments", async () => {
    const useCase = new AssignRoleToUserUseCase(
      {
        getUserById: jest.fn().mockResolvedValue({
          fullName: "Jane Doe",
          status: "active",
          userId: "user-2",
        }),
      } as never,
      {
        findActiveMembership: jest.fn().mockResolvedValue({
          membershipId: "membership-1",
          organizationId: "organization-1",
          status: "active",
          userId: "user-2",
        }),
      } as never,
      {
        findById: jest.fn().mockResolvedValue(
          Role.create({
            id: "role-1",
            name: "Viewer",
            now: new Date(),
            organizationId: "organization-1",
          }),
        ),
      } as never,
      {
        save: jest.fn().mockRejectedValue(new UserRoleAssignmentAlreadyExistsError()),
      } as never,
      createLoggerMock(),
    );

    await expect(
      useCase.execute({
        actorUserId: "user-1",
        organizationId: "organization-1",
        roleId: "role-1",
        userId: "user-2",
      }),
    ).rejects.toThrow(UserRoleAssignmentAlreadyExistsError);
  });
});
