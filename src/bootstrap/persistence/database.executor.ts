import { AsyncLocalStorage } from "node:async_hooks";

import { Inject, Injectable, Optional } from "@nestjs/common";
import type { Pool, PoolClient, QueryResult, QueryResultRow } from "pg";

import { ApplicationTelemetryService } from "../telemetry/application-telemetry.service";
import { DATABASE_POOL } from "./database.constants";

@Injectable()
export class DatabaseExecutor {
  private readonly transactionStorage = new AsyncLocalStorage<PoolClient>();

  public constructor(
    @Inject(DATABASE_POOL) private readonly pool: Pool,
    @Optional()
    private readonly applicationTelemetryService?: ApplicationTelemetryService,
  ) {}

  public async query<TResult extends QueryResultRow>(
    statement: string,
    values: readonly unknown[] = [],
  ): Promise<QueryResult<TResult>> {
    const executeQuery = async (): Promise<QueryResult<TResult>> => {
      const client = this.transactionStorage.getStore();
      const executor = client ?? this.pool;

      return executor.query<TResult>(statement, [...values]);
    };

    if (this.applicationTelemetryService === undefined) {
      return executeQuery();
    }

    return this.applicationTelemetryService.runInSpan(
      "database.query",
      {
        "db.operation": readStatementOperation(statement),
        "db.system": "postgresql",
      },
      executeQuery,
    );
  }

  public async withTransaction<TResult>(operation: () => Promise<TResult>): Promise<TResult> {
    const activeClient = this.transactionStorage.getStore();

    if (activeClient !== undefined) {
      return operation();
    }

    const executeTransaction = async (): Promise<TResult> => {
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
    };

    if (this.applicationTelemetryService === undefined) {
      return executeTransaction();
    }

    return this.applicationTelemetryService.runInSpan(
      "database.transaction",
      {
        "db.system": "postgresql",
      },
      executeTransaction,
    );
  }
}

function readStatementOperation(statement: string): string {
  const [operation = "unknown"] = statement.trim().split(/\s+/);

  return operation.toUpperCase();
}
