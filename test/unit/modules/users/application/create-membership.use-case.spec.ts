import type { PinoLogger } from "nestjs-pino";

import { CreateMembershipUseCase } from "../../../../../src/modules/users/application/use-cases/create-membership.use-case";
import { Membership } from "../../../../../src/modules/users/domain/entities/membership.entity";
import {
  MembershipAlreadyExistsError,
  UserNotFoundError,
} from "../../../../../src/modules/users/domain/user.errors";
import { User } from "../../../../../src/modules/users/domain/entities/user.entity";
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

describe("CreateMembershipUseCase", () => {
  it("creates a membership for an existing user", async () => {
    const userRepository = {
      findById: jest.fn().mockResolvedValue(
        User.create({
          fullName: "Jane Doe",
          id: "user-1",
          now: new Date(),
        }),
      ),
    };
    const membershipRepository = {
      findActiveByUserIdAndOrganizationId: jest.fn().mockResolvedValue(null),
      save: jest.fn().mockResolvedValue(undefined),
    };

    const useCase = new CreateMembershipUseCase(
      userRepository as never,
      membershipRepository as never,
      createDatabaseExecutorMock(),
      createInternalEventBusMock(),
      createLoggerMock(),
    );

    const result = await useCase.execute({
      actorUserId: "user-1",
      organizationId: "organization-1",
      userId: "user-1",
    });

    expect(membershipRepository.save).toHaveBeenCalledWith(expect.any(Membership));
    expect(result.status).toBe("active");
  });

  it("rejects membership creation when the user does not exist", async () => {
    const useCase = new CreateMembershipUseCase(
      {
        findById: jest.fn().mockResolvedValue(null),
      } as never,
      {} as never,
      createDatabaseExecutorMock(),
      createInternalEventBusMock(),
      createLoggerMock(),
    );

    await expect(
      useCase.execute({
        actorUserId: "user-1",
        organizationId: "organization-1",
        userId: "user-1",
      }),
    ).rejects.toThrow(UserNotFoundError);
  });

  it("rejects duplicate active memberships", async () => {
    const useCase = new CreateMembershipUseCase(
      {
        findById: jest.fn().mockResolvedValue(
          User.create({
            fullName: "Jane Doe",
            id: "user-1",
            now: new Date(),
          }),
        ),
      } as never,
      {
        findActiveByUserIdAndOrganizationId: jest.fn().mockResolvedValue(
          Membership.create({
            id: "membership-1",
            now: new Date(),
            organizationId: "organization-1",
            userId: "user-1",
          }),
        ),
      } as never,
      createDatabaseExecutorMock(),
      createInternalEventBusMock(),
      createLoggerMock(),
    );

    await expect(
      useCase.execute({
        actorUserId: "user-1",
        organizationId: "organization-1",
        userId: "user-1",
      }),
    ).rejects.toThrow(MembershipAlreadyExistsError);
  });
});
