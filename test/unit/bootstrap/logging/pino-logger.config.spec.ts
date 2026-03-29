import { PassThrough } from "node:stream";

import pino from "pino";

import { buildPinoHttpConfiguration } from "../../../../src/bootstrap/logging/pino-logger.config";

describe("buildPinoHttpConfiguration", () => {
  it("produces structured logs with timestamp, string level and normalized fields", () => {
    const output = new PassThrough();
    const chunks: Buffer[] = [];

    output.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });

    const configuration = buildPinoHttpConfiguration({
      app: {
        nodeEnv: "test",
        port: 3000,
      },
      auth: {
        jwtExpiresInMinutes: 30,
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

    const logger = pino(
      {
        base: configuration.base ?? null,
        ...(configuration.formatters === undefined
          ? {}
          : { formatters: configuration.formatters }),
        level: configuration.level ?? "info",
        messageKey: configuration.messageKey ?? "message",
        timestamp: configuration.timestamp ?? false,
      },
      output,
    );

    logger.info("foundation ready");
    logger.info(
      {
        correlationId: "request-123",
        context: "HealthController",
        organizationId: "tenant-1",
        userId: "user-1",
      },
      "structured ready",
    );

    const entries = Buffer.concat(chunks)
      .toString("utf8")
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line) as Record<string, unknown>);
    const entry = entries[0] as {
      level: string;
      message: string;
      timestamp: string;
    };
    const structuredEntry = entries[1] as Record<string, unknown>;

    expect(entry).toMatchObject({
      level: "info",
      message: "foundation ready",
    });
    expect(typeof entry.timestamp).toBe("string");
    expect(structuredEntry).toMatchObject({
      correlation_id: "request-123",
      message: "structured ready",
      tenant_id: "tenant-1",
      user_id: "user-1",
    });
  });
});
