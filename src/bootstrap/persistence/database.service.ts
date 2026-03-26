import { Inject, Injectable, OnApplicationBootstrap, OnApplicationShutdown } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";
import type { Pool } from "pg";

import { DATABASE_POOL } from "./database.constants";

@Injectable()
export class DatabaseConnectionService implements OnApplicationBootstrap, OnApplicationShutdown {
  public constructor(
    @Inject(DATABASE_POOL) private readonly pool: Pool,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(DatabaseConnectionService.name);
  }

  public async onApplicationBootstrap(): Promise<void> {
    this.logger.info({ event: "start" }, "Validating PostgreSQL connectivity");

    try {
      await this.pool.query("SELECT 1");
      this.logger.info({ event: "success" }, "PostgreSQL connectivity validated");
    } catch (error) {
      this.logger.error({ err: error, event: "error" }, "Failed to validate PostgreSQL connectivity");

      throw error;
    }
  }

  public async onApplicationShutdown(): Promise<void> {
    this.logger.info({ event: "start" }, "Closing PostgreSQL pool");
    await this.pool.end();
    this.logger.info({ event: "success" }, "PostgreSQL pool closed");
  }
}
