import { AsyncLocalStorage } from "node:async_hooks";

import { Inject, Injectable } from "@nestjs/common";
import type { Pool, PoolClient, QueryResult, QueryResultRow } from "pg";

import { DATABASE_POOL } from "./database.constants";

@Injectable()
export class DatabaseExecutor {
  private readonly transactionStorage = new AsyncLocalStorage<PoolClient>();

  public constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  public async query<TResult extends QueryResultRow>(
    statement: string,
    values: readonly unknown[] = [],
  ): Promise<QueryResult<TResult>> {
    const client = this.transactionStorage.getStore();
    const executor = client ?? this.pool;

    return executor.query<TResult>(statement, [...values]);
  }

  public async withTransaction<TResult>(operation: () => Promise<TResult>): Promise<TResult> {
    const activeClient = this.transactionStorage.getStore();

    if (activeClient !== undefined) {
      return operation();
    }

    const client = await this.pool.connect();

    try {
      await client.query("BEGIN");

      const result = await this.transactionStorage.run(client, operation);

      await client.query("COMMIT");

      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}
