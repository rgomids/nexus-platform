import { PassThrough } from "node:stream";

import pino from "pino";

import { buildPinoHttpConfiguration } from "../../../../src/bootstrap/logging/pino-logger.config";

describe("buildPinoHttpConfiguration", () => {
  it("produces structured logs with timestamp, level and message", () => {
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
        level: configuration.level ?? "info",
        messageKey: configuration.messageKey ?? "message",
        timestamp: configuration.timestamp ?? false,
      },
      output,
    );

    logger.info("foundation ready");

    const entry = JSON.parse(Buffer.concat(chunks).toString("utf8").trim()) as {
      level: number;
      message: string;
      timestamp: string;
    };

    expect(entry).toMatchObject({
      level: 30,
      message: "foundation ready",
    });
    expect(typeof entry.timestamp).toBe("string");
  });
});
