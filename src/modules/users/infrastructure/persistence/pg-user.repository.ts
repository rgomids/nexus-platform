import { Injectable } from "@nestjs/common";

import { DatabaseExecutor } from "../../../../bootstrap/persistence/database.executor";
import { User } from "../../domain/entities/user.entity";
import type { UserRepository } from "../../domain/repositories/user.repository";

interface UserRow {
  readonly created_at: Date;
  readonly full_name: string;
  readonly id: string;
  readonly status: "active" | "inactive";
  readonly updated_at: Date;
}

@Injectable()
export class PgUserRepository implements UserRepository {
  public constructor(private readonly databaseExecutor: DatabaseExecutor) {}

  public async findById(userId: string): Promise<User | null> {
    const result = await this.databaseExecutor.query<UserRow>(
      `
        SELECT id, full_name, status, created_at, updated_at
        FROM users
        WHERE id = $1
      `,
      [userId],
    );

    const row = result.rows[0];

    if (row === undefined) {
      return null;
    }

    return User.restore({
      createdAt: new Date(row.created_at),
      fullName: row.full_name,
      id: row.id,
      status: row.status,
      updatedAt: new Date(row.updated_at),
    });
  }

  public async save(user: User): Promise<void> {
    await this.databaseExecutor.query(
      `
        INSERT INTO users (id, full_name, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5)
      `,
      [user.id, user.fullName, user.status, user.createdAt, user.updatedAt],
    );
  }
}
