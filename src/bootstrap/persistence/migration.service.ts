import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

import { Inject, Injectable } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";
import type { Pool } from "pg";

import { DATABASE_POOL } from "./database.constants";

interface AppliedMigrationRow {
  readonly version: string;
}

@Injectable()
export class DatabaseMigrationService {
  public constructor(
    @Inject(DATABASE_POOL) private readonly pool: Pool,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(DatabaseMigrationService.name);
  }

  public async runPendingMigrations(): Promise<void> {
    this.logger.info({ event: "start" }, "Checking pending PostgreSQL migrations");
    await this.ensureMigrationsTable();

    const migrationDirectory = join(process.cwd(), "migrations");
    const migrationFiles = await this.readMigrationFiles(migrationDirectory);

    if (migrationFiles.length === 0) {
      this.logger.info({ event: "success" }, "No SQL migrations found");
      return;
    }

    const appliedVersions = await this.loadAppliedVersions();

    for (const version of migrationFiles) {
      if (appliedVersions.has(version)) {
        continue;
      }

      await this.applyMigration(migrationDirectory, version);
    }

    this.logger.info({ event: "success" }, "PostgreSQL migrations are up to date");
  }

  private async ensureMigrationsTable(): Promise<void> {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL
      )
    `);
  }

  private async loadAppliedVersions(): Promise<Set<string>> {
    const result = await this.pool.query<AppliedMigrationRow>(
      "SELECT version FROM schema_migrations ORDER BY version ASC",
    );

    return new Set(result.rows.map((row) => row.version));
  }

  private async readMigrationFiles(migrationDirectory: string): Promise<string[]> {
    const files = await readdir(migrationDirectory, { withFileTypes: true });

    return files
      .filter((file) => file.isFile() && file.name.endsWith(".sql"))
      .map((file) => file.name)
      .sort((left, right) => left.localeCompare(right));
  }

  private async applyMigration(migrationDirectory: string, version: string): Promise<void> {
    const statement = await readFile(join(migrationDirectory, version), "utf8");
    const client = await this.pool.connect();

    this.logger.info({ event: "start", migration: version }, "Applying PostgreSQL migration");

    try {
      await client.query("BEGIN");
      await client.query(statement);
      await client.query("INSERT INTO schema_migrations (version, applied_at) VALUES ($1, NOW())", [
        version,
      ]);
      await client.query("COMMIT");
      this.logger.info({ event: "success", migration: version }, "PostgreSQL migration applied");
    } catch (error) {
      await client.query("ROLLBACK");
      this.logger.error({ err: error, event: "error", migration: version }, "Migration failed");
      throw error;
    } finally {
      client.release();
    }
  }
}
