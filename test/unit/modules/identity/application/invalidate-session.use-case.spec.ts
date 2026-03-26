import type { PinoLogger } from "nestjs-pino";

import { InvalidateSessionUseCase } from "../../../../../src/modules/identity/application/use-cases/invalidate-session.use-case";
import { Session } from "../../../../../src/modules/identity/domain/entities/session.entity";
import { InvalidAccessTokenError } from "../../../../../src/modules/identity/domain/identity.errors";

function createLoggerMock(): PinoLogger {
  return {
    info: jest.fn(),
    setContext: jest.fn(),
  } as unknown as PinoLogger;
}

describe("InvalidateSessionUseCase", () => {
  it("invalidates an active session", async () => {
    const session = Session.start({
      accountId: "account-1",
      expiresAt: new Date(Date.now() + 60_000),
      id: "session-1",
      jti: "jti-1",
      now: new Date(),
      organizationId: "organization-1",
      userId: "user-1",
    });
    const sessionRepository = {
      findById: jest.fn().mockResolvedValue(session),
      update: jest.fn().mockResolvedValue(undefined),
    };

    const useCase = new InvalidateSessionUseCase(
      sessionRepository as never,
      {
        verify: jest.fn().mockResolvedValue({
          aid: "account-1",
          jti: "jti-1",
          oid: "organization-1",
          sid: "session-1",
          sub: "user-1",
        }),
      } as never,
      createLoggerMock(),
    );

    await useCase.execute("jwt-token");

    expect(sessionRepository.update).toHaveBeenCalledTimes(1);
  });

  it("rejects an already revoked session", async () => {
    const session = Session.restore({
      accountId: "account-1",
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 60_000),
      id: "session-1",
      jti: "jti-1",
      organizationId: "organization-1",
      revokedAt: new Date(),
      status: "revoked",
      updatedAt: new Date(),
      userId: "user-1",
    });

    const useCase = new InvalidateSessionUseCase(
      {
        findById: jest.fn().mockResolvedValue(session),
      } as never,
      {
        verify: jest.fn().mockResolvedValue({
          aid: "account-1",
          jti: "jti-1",
          oid: "organization-1",
          sid: "session-1",
          sub: "user-1",
        }),
      } as never,
      createLoggerMock(),
    );

    await expect(useCase.execute("jwt-token")).rejects.toThrow(InvalidAccessTokenError);
  });
});
