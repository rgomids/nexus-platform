import { Injectable } from "@nestjs/common";

import { DatabaseExecutor } from "../../../../bootstrap/persistence/database.executor";
import { Credential } from "../../domain/entities/credential.entity";
import type { CredentialRepository } from "../../domain/repositories/credential.repository";

interface CredentialRow {
  readonly account_id: string;
  readonly created_at: Date;
  readonly password_hash: string;
  readonly updated_at: Date;
}

@Injectable()
export class PgCredentialRepository implements CredentialRepository {
  public constructor(private readonly databaseExecutor: DatabaseExecutor) {}

  public async findByAccountId(accountId: string): Promise<Credential | null> {
    const result = await this.databaseExecutor.query<CredentialRow>(
      `
        SELECT account_id, password_hash, created_at, updated_at
        FROM credentials
        WHERE account_id = $1
      `,
      [accountId],
    );

    const row = result.rows[0];

    if (row === undefined) {
      return null;
    }

    return Credential.restore({
      accountId: row.account_id,
      createdAt: new Date(row.created_at),
      passwordHash: row.password_hash,
      updatedAt: new Date(row.updated_at),
    });
  }

  public async save(credential: Credential): Promise<void> {
    await this.databaseExecutor.query(
      `
        INSERT INTO credentials (account_id, password_hash, created_at, updated_at)
        VALUES ($1, $2, $3, $4)
      `,
      [
        credential.accountId,
        credential.passwordHash,
        credential.createdAt,
        credential.updatedAt,
      ],
    );
  }
}
