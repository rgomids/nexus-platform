import type { PinoLogger } from "nestjs-pino";

import { AuthorizeActionUseCase } from "../../../../../src/modules/access-control/application/use-cases/authorize-action.use-case";

function createLoggerMock(): PinoLogger {
  return {
    info: jest.fn(),
    setContext: jest.fn(),
  } as unknown as PinoLogger;
}

describe("AuthorizeActionUseCase", () => {
  it("allows when the user has the required permission through assigned roles", async () => {
    const useCase = new AuthorizeActionUseCase(
      {
        listPermissionCodesByUserIdAndOrganizationId: jest
          .fn()
          .mockResolvedValue(["membership:view", "membership:create"]),
      } as never,
      createLoggerMock(),
    );

    const decision = await useCase.execute({
      organizationId: "organization-1",
      permissionCode: "membership:create",
      userId: "user-1",
    });

    expect(decision.allowed).toBe(true);
  });

  it("denies by default when the user has no matching permission", async () => {
    const useCase = new AuthorizeActionUseCase(
      {
        listPermissionCodesByUserIdAndOrganizationId: jest
          .fn()
          .mockResolvedValue(["membership:view"]),
      } as never,
      createLoggerMock(),
    );

    const decision = await useCase.execute({
      organizationId: "organization-1",
      permissionCode: "membership:create",
      userId: "user-1",
    });

    expect(decision.allowed).toBe(false);
  });
});
