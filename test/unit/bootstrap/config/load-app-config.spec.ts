import { loadAppConfig } from "../../../../src/bootstrap/config/app-config";

describe("loadAppConfig", () => {
  it("parses the required environment variables", () => {
    const config = loadAppConfig({
      APP_PORT: "3000",
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
        DB_HOST: "localhost",
        DB_NAME: "nexus",
        DB_PASSWORD: "postgres",
        DB_USER: "postgres",
      }),
    ).toThrow("Missing required environment variable: DB_PORT");
  });
});
