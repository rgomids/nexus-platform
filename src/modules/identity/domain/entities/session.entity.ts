import { SessionAlreadyInvalidatedError } from "../identity.errors";

export type SessionStatus = "active" | "revoked";

export class Session {
  public static start(props: {
    readonly accountId: string;
    readonly expiresAt: Date;
    readonly id: string;
    readonly jti: string;
    readonly now: Date;
    readonly userId: string;
  }): Session {
    return new Session(
      props.id,
      props.accountId,
      props.userId,
      props.jti,
      "active",
      props.now,
      props.now,
      props.expiresAt,
      null,
    );
  }

  public static restore(props: {
    readonly accountId: string;
    readonly createdAt: Date;
    readonly expiresAt: Date;
    readonly id: string;
    readonly jti: string;
    readonly revokedAt: Date | null;
    readonly status: SessionStatus;
    readonly updatedAt: Date;
    readonly userId: string;
  }): Session {
    return new Session(
      props.id,
      props.accountId,
      props.userId,
      props.jti,
      props.status,
      props.createdAt,
      props.updatedAt,
      props.expiresAt,
      props.revokedAt,
    );
  }

  private constructor(
    public readonly id: string,
    public readonly accountId: string,
    public readonly userId: string,
    public readonly jti: string,
    public readonly status: SessionStatus,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly expiresAt: Date,
    public readonly revokedAt: Date | null,
  ) {}

  public revoke(now: Date): Session {
    if (this.status === "revoked") {
      throw new SessionAlreadyInvalidatedError();
    }

    return new Session(
      this.id,
      this.accountId,
      this.userId,
      this.jti,
      "revoked",
      this.createdAt,
      now,
      this.expiresAt,
      now,
    );
  }

  public isExpired(at: Date): boolean {
    return this.expiresAt.getTime() <= at.getTime();
  }
}
