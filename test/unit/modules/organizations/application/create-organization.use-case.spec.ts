import type { PinoLogger } from "nestjs-pino";

import type { DatabaseExecutor } from "../../../../../src/bootstrap/persistence/database.executor";
import { CreateOrganizationUseCase } from "../../../../../src/modules/organizations/application/use-cases/create-organization.use-case";
import { Organization } from "../../../../../src/modules/organizations/domain/entities/organization.entity";
import { createInternalEventBusMock } from "../../../../support/unit-test-doubles";

function createLoggerMock(): PinoLogger {
  return {
    info: jest.fn(),
    setContext: jest.fn(),
  } as unknown as PinoLogger;
}

describe("CreateOrganizationUseCase", () => {
  it("creates the organization and the creator membership in one transaction", async () => {
    const organizationRepository = {
      save: jest.fn().mockResolvedValue(undefined),
    };
    const usersTenancyContract = {
      createMembership: jest.fn().mockResolvedValue({
        membershipId: "membership-1",
        organizationId: "organization-1",
        status: "active",
        userId: "user-1",
      }),
    };
    const accessControlBootstrapContract = {
      bootstrapTenantAccessControl: jest.fn().mockResolvedValue(undefined),
    };
    const databaseExecutor = {
      withTransaction: jest.fn(async (operation: () => Promise<void>) => operation()),
    } as unknown as DatabaseExecutor;

    const useCase = new CreateOrganizationUseCase(
      organizationRepository as never,
      usersTenancyContract as never,
      accessControlBootstrapContract as never,
      databaseExecutor,
      createInternalEventBusMock(),
      createLoggerMock(),
    );

    const result = await useCase.execute({
      createdByUserId: "user-1",
      name: "Acme Corp",
    });

    expect(databaseExecutor.withTransaction).toHaveBeenCalledTimes(1);
    expect(organizationRepository.save).toHaveBeenCalledWith(expect.any(Organization));
    expect(usersTenancyContract.createMembership).toHaveBeenCalledWith({
      actorUserId: "user-1",
      organizationId: result.organizationId,
      userId: "user-1",
    });
    expect(
      accessControlBootstrapContract.bootstrapTenantAccessControl,
    ).toHaveBeenCalledWith({
      createdByUserId: "user-1",
      organizationId: result.organizationId,
    });
    expect(result.status).toBe("active");
  });
});
