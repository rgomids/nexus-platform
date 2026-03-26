import { config as loadDotenv } from "dotenv";

export const APP_CONFIG = Symbol("APP_CONFIG");

export type NodeEnvironment = "development" | "test" | "production";

export interface AppConfig {
  readonly app: {
    readonly port: number;
    readonly nodeEnv: NodeEnvironment;
  };
  readonly auth: {
    readonly jwtExpiresInMinutes: number;
    readonly jwtSecret: string;
  };
  readonly database: {
    readonly host: string;
    readonly port: number;
    readonly user: string;
    readonly password: string;
    readonly name: string;
  };
}

let environmentLoaded = false;

export function loadEnvironmentVariables(): void {
  if (environmentLoaded) {
    return;
  }

  loadDotenv();
  environmentLoaded = true;
}

export function loadAppConfig(environment: NodeJS.ProcessEnv = process.env): AppConfig {
  return {
    app: {
      nodeEnv: readNodeEnvironment(environment.NODE_ENV),
      port: readRequiredNumber(environment.APP_PORT, "APP_PORT"),
    },
    auth: {
      jwtExpiresInMinutes: readOptionalNumber(
        environment.AUTH_JWT_EXPIRES_IN_MINUTES,
        "AUTH_JWT_EXPIRES_IN_MINUTES",
        480,
      ),
      jwtSecret: readRequiredString(environment.AUTH_JWT_SECRET, "AUTH_JWT_SECRET"),
    },
    database: {
      host: readRequiredString(environment.DB_HOST, "DB_HOST"),
      name: readRequiredString(environment.DB_NAME, "DB_NAME"),
      password: readRequiredString(environment.DB_PASSWORD, "DB_PASSWORD"),
      port: readRequiredNumber(environment.DB_PORT, "DB_PORT"),
      user: readRequiredString(environment.DB_USER, "DB_USER"),
    },
  };
}

function readNodeEnvironment(value: string | undefined): NodeEnvironment {
  const defaultEnvironment: NodeEnvironment = "development";

  if (value === undefined || value.length === 0) {
    return defaultEnvironment;
  }

  if (value === "development" || value === "test" || value === "production") {
    return value;
  }

  throw new Error(`Invalid NODE_ENV value: ${value}`);
}

function readRequiredString(value: string | undefined, key: string): string {
  if (value === undefined || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value.trim();
}

function readRequiredNumber(value: string | undefined, key: string): number {
  const parsedValue = Number.parseInt(readRequiredString(value, key), 10);

  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    throw new Error(`Invalid numeric environment variable: ${key}`);
  }

  return parsedValue;
}

function readOptionalNumber(value: string | undefined, key: string, fallback: number): number {
  if (value === undefined || value.trim().length === 0) {
    return fallback;
  }

  return readRequiredNumber(value, key);
}
