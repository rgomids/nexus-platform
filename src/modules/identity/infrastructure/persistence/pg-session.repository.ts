import { Injectable } from "@nestjs/common";

import { DatabaseExecutor } from "../../../../bootstrap/persistence/database.executor";
import { Session } from "../../domain/entities/session.entity";
import type { SessionRepository } from "../../domain/repositories/session.repository";

interface SessionRow {
  readonly account_id: string;
  readonly created_at: Date;
  readonly expires_at: Date;
  readonly id: string;
  readonly jti: string;
  readonly revoked_at: Date | null;
  readonly status: "active" | "revoked";
  readonly updated_at: Date;
  readonly user_id: string;
}

@Injectable()
export class PgSessionRepository implements SessionRepository {
  public constructor(private readonly databaseExecutor: DatabaseExecutor) {}

  public async findById(sessionId: string): Promise<Session | null> {
    const result = await this.databaseExecutor.query<SessionRow>(
      `
        SELECT id, account_id, user_id, jti, status, created_at, updated_at, expires_at, revoked_at
        FROM sessions
        WHERE id = $1
      `,
      [sessionId],
    );

    const row = result.rows[0];

    if (row === undefined) {
      return null;
    }

    return this.mapRow(row);
  }

  public async save(session: Session): Promise<void> {
    await this.databaseExecutor.query(
      `
        INSERT INTO sessions (id, account_id, user_id, jti, status, created_at, updated_at, expires_at, revoked_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `,
      [
        session.id,
        session.accountId,
        session.userId,
        session.jti,
        session.status,
        session.createdAt,
        session.updatedAt,
        session.expiresAt,
        session.revokedAt,
      ],
    );
  }

  public async update(session: Session): Promise<void> {
    await this.databaseExecutor.query(
      `
        UPDATE sessions
        SET status = $2,
            updated_at = $3,
            revoked_at = $4
        WHERE id = $1
      `,
      [session.id, session.status, session.updatedAt, session.revokedAt],
    );
  }

  private mapRow(row: SessionRow): Session {
    return Session.restore({
      accountId: row.account_id,
      createdAt: new Date(row.created_at),
      expiresAt: new Date(row.expires_at),
      id: row.id,
      jti: row.jti,
      revokedAt: row.revoked_at === null ? null : new Date(row.revoked_at),
      status: row.status,
      updatedAt: new Date(row.updated_at),
      userId: row.user_id,
    });
  }
}
