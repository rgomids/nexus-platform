import { Injectable } from "@nestjs/common";

import { DatabaseExecutor } from "../../../../bootstrap/persistence/database.executor";
import { DuplicateAccountEmailError } from "../../domain/identity.errors";
import { Account } from "../../domain/entities/account.entity";
import type { AccountRepository } from "../../domain/repositories/account.repository";
import { EmailAddress } from "../../domain/value-objects/email-address.value-object";

interface AccountRow {
  readonly created_at: Date;
  readonly email: string;
  readonly id: string;
  readonly normalized_email: string;
  readonly status: "active" | "inactive";
  readonly updated_at: Date;
  readonly user_id: string;
}

@Injectable()
export class PgAccountRepository implements AccountRepository {
  public constructor(private readonly databaseExecutor: DatabaseExecutor) {}

  public async findByEmail(email: EmailAddress): Promise<Account | null> {
    const result = await this.databaseExecutor.query<AccountRow>(
      `
        SELECT id, user_id, email, normalized_email, status, created_at, updated_at
        FROM accounts
        WHERE normalized_email = $1
      `,
      [email.normalized],
    );

    const row = result.rows[0];

    if (row === undefined) {
      return null;
    }

    return this.mapRow(row);
  }

  public async findById(accountId: string): Promise<Account | null> {
    const result = await this.databaseExecutor.query<AccountRow>(
      `
        SELECT id, user_id, email, normalized_email, status, created_at, updated_at
        FROM accounts
        WHERE id = $1
      `,
      [accountId],
    );

    const row = result.rows[0];

    if (row === undefined) {
      return null;
    }

    return this.mapRow(row);
  }

  public async save(account: Account): Promise<void> {
    try {
      await this.databaseExecutor.query(
        `
          INSERT INTO accounts (id, user_id, email, normalized_email, status, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `,
        [
          account.id,
          account.userId,
          account.email.value,
          account.email.normalized,
          account.status,
          account.createdAt,
          account.updatedAt,
        ],
      );
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new DuplicateAccountEmailError();
      }

      throw error;
    }
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    );
  }

  private mapRow(row: AccountRow): Account {
    return Account.restore({
      createdAt: new Date(row.created_at),
      email: EmailAddress.create(row.normalized_email),
      id: row.id,
      status: row.status,
      updatedAt: new Date(row.updated_at),
      userId: row.user_id,
    });
  }
}
