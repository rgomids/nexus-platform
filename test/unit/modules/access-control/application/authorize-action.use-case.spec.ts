import type { PinoLogger } from "nestjs-pino";

import { AuthorizeActionUseCase } from "../../../../../src/modules/access-control/application/use-cases/authorize-action.use-case";
import {
  createApplicationMetricsServiceMock,
  createApplicationTelemetryServiceMock,
} from "../../../../support/unit-test-doubles";

function createLoggerMock(): PinoLogger {
  return {
    info: jest.fn(),
    setContext: jest.fn(),
  } as unknown as PinoLogger;
}

describe("AuthorizeActionUseCase", () => {
  it("allows when the user has the required permission through assigned roles", async () => {
    const applicationMetricsService = createApplicationMetricsServiceMock();
    const applicationTelemetryService = createApplicationTelemetryServiceMock();
    const useCase = new AuthorizeActionUseCase(
      {
        listPermissionCodesByUserIdAndOrganizationId: jest
          .fn()
          .mockResolvedValue(["membership:view", "membership:create"]),
      } as never,
      createLoggerMock(),
      applicationTelemetryService,
      applicationMetricsService,
    );

    const decision = await useCase.execute({
      organizationId: "organization-1",
      permissionCode: "membership:create",
      userId: "user-1",
    });

    expect(decision.allowed).toBe(true);
    expect(applicationMetricsService.recordAuthorizationDecision).toHaveBeenCalledWith("allow");
    expect(applicationTelemetryService.runInSpan).toHaveBeenCalledWith(
      "access_control.authorize_action",
      expect.objectContaining({
        "authorization.permission_code": "membership:create",
      }),
      expect.any(Function),
    );
  });

  it("denies by default when the user has no matching permission", async () => {
    const applicationMetricsService = createApplicationMetricsServiceMock();
    const useCase = new AuthorizeActionUseCase(
      {
        listPermissionCodesByUserIdAndOrganizationId: jest
          .fn()
          .mockResolvedValue(["membership:view"]),
      } as never,
      createLoggerMock(),
      undefined,
      applicationMetricsService,
    );

    const decision = await useCase.execute({
      organizationId: "organization-1",
      permissionCode: "membership:create",
      userId: "user-1",
    });

    expect(decision.allowed).toBe(false);
    expect(applicationMetricsService.recordAuthorizationDecision).toHaveBeenCalledWith("deny");
  });
});
