import type { ExecutionContext } from "@nestjs/common";
import type { Reflector } from "@nestjs/core";
import type { PinoLogger } from "nestjs-pino";

import { AuthorizationGuard } from "../../../../src/shared/auth/authorization.guard";
import { REQUIRED_PERMISSION_METADATA_KEY } from "../../../../src/shared/auth/require-permission.decorator";
import { PermissionDeniedError } from "../../../../src/modules/access-control/domain/access-control.errors";

function createLoggerMock(): PinoLogger {
  return {
    error: jest.fn(),
    setContext: jest.fn(),
  } as unknown as PinoLogger;
}

function createExecutionContextMock(request: Record<string, unknown>): ExecutionContext {
  return {
    getClass: () => AuthorizationGuard,
    getHandler: () => AuthorizationGuard.prototype.canActivate,
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;
}

describe("AuthorizationGuard", () => {
  it("returns true when no permission metadata is required", async () => {
    const guard = new AuthorizationGuard(
      {
        getAllAndOverride: jest.fn().mockReturnValue(undefined),
      } as unknown as Reflector,
      {} as never,
      {} as never,
      createLoggerMock(),
    );

    await expect(
      guard.canActivate(createExecutionContextMock({})),
    ).resolves.toBe(true);
  });

  it("publishes an audit event and throws when the action is denied", async () => {
    const internalEventBus = {
      publish: jest.fn().mockResolvedValue(undefined),
    };
    const guard = new AuthorizationGuard(
      {
        getAllAndOverride: jest
          .fn()
          .mockImplementation((metadataKey: string) =>
            metadataKey === REQUIRED_PERMISSION_METADATA_KEY
              ? "membership:view"
              : undefined,
          ),
      } as unknown as Reflector,
      {
        execute: jest.fn().mockResolvedValue({ allowed: false }),
      } as never,
      internalEventBus as never,
      createLoggerMock(),
    );

    const request = {
      authenticatedPrincipal: {
        userId: "user-1",
      },
      method: "GET",
      originalUrl: "/organizations/organization-1/memberships",
      tenantContext: {
        organizationId: "organization-1",
      },
      url: "/organizations/organization-1/memberships",
    };

    await expect(
      guard.canActivate(createExecutionContextMock(request)),
    ).rejects.toThrow(PermissionDeniedError);
    expect(internalEventBus.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: "organization-1",
        permissionCode: "membership:view",
        type: "authorization.denied",
        userId: "user-1",
      }),
    );
  });
});
