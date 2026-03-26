import { PinoLogger } from "nestjs-pino";

import { createDatabasePool } from "../database.providers";
import { loadAppConfig, loadEnvironmentVariables } from "../../config/app-config";
import { DatabaseMigrationService } from "../migration.service";

async function runMigrations(): Promise<void> {
  loadEnvironmentVariables();

  const config = loadAppConfig();
  const pool = createDatabasePool(config);
  const logger = new PinoLogger({
    pinoHttp: {
      base: null,
      enabled: true,
      level: "info",
      messageKey: "message",
      timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
    },
  });

  try {
    const migrationService = new DatabaseMigrationService(pool, logger);

    await migrationService.runPendingMigrations();
  } finally {
    await pool.end();
  }
}

void runMigrations();
