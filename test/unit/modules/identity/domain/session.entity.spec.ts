import {
  SessionAlreadyInvalidatedError,
} from "../../../../../src/modules/identity/domain/identity.errors";
import { Session } from "../../../../../src/modules/identity/domain/entities/session.entity";

describe("Session", () => {
  it("creates and invalidates a session", () => {
    const now = new Date("2026-03-25T12:00:00.000Z");
    const session = Session.start({
      accountId: "account-1",
      expiresAt: new Date("2026-03-25T13:00:00.000Z"),
      id: "session-1",
      jti: "jti-1",
      now,
      userId: "user-1",
    });

    const revoked = session.revoke(new Date("2026-03-25T12:30:00.000Z"));

    expect(revoked.status).toBe("revoked");
    expect(revoked.revokedAt?.toISOString()).toBe("2026-03-25T12:30:00.000Z");
  });

  it("rejects invalidating an already revoked session", () => {
    const revoked = Session.restore({
      accountId: "account-1",
      createdAt: new Date("2026-03-25T12:00:00.000Z"),
      expiresAt: new Date("2026-03-25T13:00:00.000Z"),
      id: "session-1",
      jti: "jti-1",
      revokedAt: new Date("2026-03-25T12:30:00.000Z"),
      status: "revoked",
      updatedAt: new Date("2026-03-25T12:30:00.000Z"),
      userId: "user-1",
    });

    expect(() => revoked.revoke(new Date())).toThrow(SessionAlreadyInvalidatedError);
  });
});
