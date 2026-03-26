import { Pool, type PoolConfig } from "pg";

import type { AppConfig } from "../config/app-config";

export function buildDatabasePoolOptions(config: AppConfig): PoolConfig {
  return {
    connectionTimeoutMillis: 5000,
    database: config.database.name,
    host: config.database.host,
    idleTimeoutMillis: 30000,
    max: 10,
    password: config.database.password,
    port: config.database.port,
    user: config.database.user,
  };
}

export function createDatabasePool(config: AppConfig): Pool {
  return new Pool(buildDatabasePoolOptions(config));
}
