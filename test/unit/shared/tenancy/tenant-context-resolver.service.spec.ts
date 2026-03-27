import type { PinoLogger } from "nestjs-pino";

import { TenantContextResolverService } from "../../../../src/shared/tenancy/tenant-context-resolver.service";
import {
  TenantContextDeniedError,
  TenantContextRequiredError,
} from "../../../../src/shared/tenancy/tenant.errors";
import { OrganizationInactiveError } from "../../../../src/modules/organizations/domain/organization.errors";

function createLoggerMock(): PinoLogger {
  return {
    info: jest.fn(),
    setContext: jest.fn(),
    warn: jest.fn(),
  } as unknown as PinoLogger;
}

describe("TenantContextResolverService", () => {
  it("resolves an active tenant with an active membership", async () => {
    const service = new TenantContextResolverService(
      {
        getOrganizationById: jest.fn().mockResolvedValue({
          organizationId: "organization-1",
          status: "active",
        }),
      } as never,
      {
        findActiveMembership: jest.fn().mockResolvedValue({
          membershipId: "membership-1",
          organizationId: "organization-1",
          status: "active",
          userId: "user-1",
        }),
      } as never,
      createLoggerMock(),
    );

    const result = await service.resolve({
      organizationId: "organization-1",
      userId: "user-1",
    });

    expect(result).toEqual({
      membershipId: "membership-1",
      organizationId: "organization-1",
      userId: "user-1",
    });
  });

  it("denies the tenant when the route organization does not match the session", async () => {
    const service = new TenantContextResolverService(
      {} as never,
      {} as never,
      createLoggerMock(),
    );

    await expect(
      service.resolve({
        organizationId: "organization-1",
        routeOrganizationId: "organization-2",
        userId: "user-1",
      }),
    ).rejects.toThrow(TenantContextDeniedError);
  });

  it("requires a tenant context for protected flows", async () => {
    const service = new TenantContextResolverService(
      {} as never,
      {} as never,
      createLoggerMock(),
    );

    await expect(
      service.resolve({
        organizationId: null,
        userId: "user-1",
      }),
    ).rejects.toThrow(TenantContextRequiredError);
  });

  it("rejects inactive organizations", async () => {
    const service = new TenantContextResolverService(
      {
        getOrganizationById: jest.fn().mockResolvedValue({
          organizationId: "organization-1",
          status: "inactive",
        }),
      } as never,
      {} as never,
      createLoggerMock(),
    );

    await expect(
      service.resolve({
        organizationId: "organization-1",
        userId: "user-1",
      }),
    ).rejects.toThrow(OrganizationInactiveError);
  });
});
