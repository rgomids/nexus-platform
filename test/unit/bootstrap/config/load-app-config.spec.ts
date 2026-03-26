import { loadAppConfig } from "../../../../src/bootstrap/config/app-config";

describe("loadAppConfig", () => {
  it("parses the required environment variables", () => {
    const config = loadAppConfig({
      APP_PORT: "3000",
      AUTH_JWT_SECRET: "test-secret",
      DB_HOST: "localhost",
      DB_NAME: "nexus",
      DB_PASSWORD: "postgres",
      DB_PORT: "5432",
      DB_USER: "postgres",
      NODE_ENV: "test",
    });

    expect(config).toEqual({
      app: {
        nodeEnv: "test",
        port: 3000,
      },
      auth: {
        jwtExpiresInMinutes: 480,
        jwtSecret: "test-secret",
      },
      database: {
        host: "localhost",
        name: "nexus",
        password: "postgres",
        port: 5432,
        user: "postgres",
      },
    });
  });

  it("fails when a required variable is missing", () => {
    expect(() =>
      loadAppConfig({
        APP_PORT: "3000",
        AUTH_JWT_SECRET: "test-secret",
        DB_HOST: "localhost",
        DB_NAME: "nexus",
        DB_PASSWORD: "postgres",
        DB_USER: "postgres",
      }),
    ).toThrow("Missing required environment variable: DB_PORT");
  });

  it("uses the default JWT expiration when it is not configured", () => {
    const config = loadAppConfig({
      APP_PORT: "3000",
      AUTH_JWT_SECRET: "test-secret",
      DB_HOST: "localhost",
      DB_NAME: "nexus",
      DB_PASSWORD: "postgres",
      DB_PORT: "5432",
      DB_USER: "postgres",
      NODE_ENV: "test",
    });

    expect(config.auth.jwtExpiresInMinutes).toBe(480);
  });
});
